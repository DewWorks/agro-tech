'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getUserContext } from '@/lib/auth'
import { serverLog } from '@/lib/logger'
import {
  activateSubscriptionSchema,
  updateSubscriptionPlanSchema,
  type ActivateSubscriptionInput,
  type UpdateSubscriptionPlanInput,
} from '@/lib/validations/billing'
import {
  createAsaasCustomer,
  updateAsaasCustomer,
  findCustomerByCpfCnpj,
} from '@/lib/asaas/customers'
import {
  createAsaasSubscription,
  updateAsaasSubscription,
  getSubscriptionPayments,
} from '@/lib/asaas/subscriptions'
import { getPixQrCode } from '@/lib/asaas/payments'
import {
  computeInitialCompetence,
  decimalToNumber,
  serializeInvoice,
  type SerializedInvoice,
} from '@/lib/billing/invoice-helpers'

/**
 * Retorna o catálogo oficial de planos ativos
 */
export async function getSubscriptionPlans() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' },
  })

  return plans.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description,
    price: decimalToNumber(p.price),
    billingCycle: p.billingCycle,
    maxBranches: p.maxBranches,
    maxUsers: p.maxUsers,
    storageLimitGb: p.storageLimitGb,
    pdfQuotaMonthly: p.pdfQuotaMonthly,
    isActive: p.isActive,
  }))
}

/**
 * Retorna os detalhes de assinatura e histórico de faturas de uma organização
 */
export async function getOrganizationBillingDetails(organizationId: string) {
  const dbUser = await getUserContext()
  if (!dbUser) throw new Error('Não autenticado')

  // Apenas SUPER_ADMIN ou membros da própria organização podem visualizar
  if (dbUser.realRole !== 'SUPER_ADMIN' && dbUser.organizationId !== organizationId) {
    throw new Error('Acesso negado aos dados de faturamento')
  }

  const subscription = await prisma.organizationSubscription.findUnique({
    where: { organizationId },
    include: {
      plan: true,
      invoices: {
        orderBy: { dueDate: 'desc' },
      },
    },
  })

  if (!subscription) return null

  const effectivePrice = decimalToNumber(subscription.customPrice ?? subscription.plan.price)

  return {
    id: subscription.id,
    organizationId: subscription.organizationId,
    status: subscription.status,
    plan: {
      id: subscription.plan.id,
      code: subscription.plan.code,
      name: subscription.plan.name,
      description: subscription.plan.description,
      price: decimalToNumber(subscription.plan.price),
      billingCycle: subscription.plan.billingCycle,
      maxBranches: subscription.plan.maxBranches,
      maxUsers: subscription.plan.maxUsers,
      storageLimitGb: subscription.plan.storageLimitGb,
      pdfQuotaMonthly: subscription.plan.pdfQuotaMonthly,
    },
    effectivePrice,
    customPrice: subscription.customPrice ? decimalToNumber(subscription.customPrice) : null,
    billingDueDay: subscription.billingDueDay,
    currentPeriodStart: subscription.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
    gracePeriodUntil: subscription.gracePeriodUntil?.toISOString() ?? null,
    billingName: subscription.billingName,
    billingCpfCnpj: subscription.billingCpfCnpj,
    billingEmail: subscription.billingEmail,
    billingPhone: subscription.billingPhone,
    asaasCustomerId: subscription.asaasCustomerId,
    asaasSubscriptionId: subscription.asaasSubscriptionId,
    invoices: subscription.invoices.map(serializeInvoice),
  }
}

/**
 * Ativa ou cria a assinatura Asaas de uma organização (Exclusivo SUPER_ADMIN)
 */
export async function activateOrganizationSubscription(input: ActivateSubscriptionInput) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser || dbUser.realRole !== 'SUPER_ADMIN') {
      throw new Error('Acesso negado: Apenas SUPER_ADMIN pode gerenciar assinaturas')
    }

    const validated = activateSubscriptionSchema.parse(input)

    const org = await prisma.organization.findUnique({
      where: { id: validated.organizationId },
    })
    if (!org) throw new Error('Organização não encontrada')

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { code: validated.planCode },
    })
    if (!plan) throw new Error('Plano de assinatura não encontrado')

    const effectivePrice = validated.customPrice ?? decimalToNumber(plan.price)

    // 1. Criar ou localizar cliente no Asaas
    let asaasCustomerId: string
    const existingAsaasCustomer = await findCustomerByCpfCnpj(validated.billingCpfCnpj)

    if (existingAsaasCustomer) {
      asaasCustomerId = existingAsaasCustomer.id
      await updateAsaasCustomer(asaasCustomerId, {
        name: validated.billingName,
        email: validated.billingEmail,
        phone: validated.billingPhone,
      })
    } else {
      const createdCustomer = await createAsaasCustomer({
        name: validated.billingName,
        cpfCnpj: validated.billingCpfCnpj,
        email: validated.billingEmail,
        phone: validated.billingPhone,
        externalReference: org.id,
      })
      asaasCustomerId = createdCustomer.id
    }

    // 2. Calcular próxima data de vencimento baseada no billingDueDay
    const now = new Date()
    let nextDue = new Date(now.getFullYear(), now.getMonth(), validated.billingDueDay)
    if (nextDue <= now) {
      nextDue = new Date(now.getFullYear(), now.getMonth() + 1, validated.billingDueDay)
    }
    const nextDueDateStr = nextDue.toISOString().split('T')[0]

    // 3. Criar assinatura recorrente no Asaas (Boleto com Pix embutido)
    const asaasSub = await createAsaasSubscription({
      customer: asaasCustomerId,
      billingType: 'BOLETO',
      value: effectivePrice,
      nextDueDate: nextDueDateStr,
      cycle: 'MONTHLY',
      description: `Assinatura AgroTech SaaS - ${plan.name} (${org.name})`,
      externalReference: org.id,
    })

    // 4. Salvar ou atualizar assinatura no banco de dados local
    const currentPeriodStart = now
    const currentPeriodEnd = nextDue

    const subscription = await prisma.organizationSubscription.upsert({
      where: { organizationId: org.id },
      create: {
        organizationId: org.id,
        planId: plan.id,
        asaasCustomerId,
        asaasSubscriptionId: asaasSub.id,
        status: 'ACTIVE',
        customPrice: validated.customPrice ? validated.customPrice : null,
        billingDueDay: validated.billingDueDay,
        currentPeriodStart,
        currentPeriodEnd,
        billingName: validated.billingName,
        billingCpfCnpj: validated.billingCpfCnpj,
        billingEmail: validated.billingEmail,
        billingPhone: validated.billingPhone,
      },
      update: {
        planId: plan.id,
        asaasCustomerId,
        asaasSubscriptionId: asaasSub.id,
        status: 'ACTIVE',
        customPrice: validated.customPrice ? validated.customPrice : null,
        billingDueDay: validated.billingDueDay,
        currentPeriodStart,
        currentPeriodEnd,
        billingName: validated.billingName,
        billingCpfCnpj: validated.billingCpfCnpj,
        billingEmail: validated.billingEmail,
        billingPhone: validated.billingPhone,
      },
    })

    // 5. Buscar cobrança inicial gerada automaticamente pelo Asaas
    try {
      const payments = await getSubscriptionPayments(asaasSub.id)
      const firstPayment = payments[0]

      if (firstPayment) {
        const dueDate = new Date(firstPayment.dueDate)
        const { competenceStart, competenceEnd } = computeInitialCompetence(
          dueDate,
          validated.billingDueDay,
        )

        // Busca Pix QR Code fora de qualquer lock
        let pixPayload: string | null = null
        let pixImage: string | null = null
        try {
          const pix = await getPixQrCode(firstPayment.id)
          pixPayload = pix.payload
          pixImage = pix.encodedImage
        } catch (pixErr) {
          serverLog('warn', 'activateSubscription', 'Pix QR Code não disponível de imediato', pixErr)
        }

        await prisma.subscriptionInvoice.upsert({
          where: { asaasPaymentId: firstPayment.id },
          create: {
            subscriptionId: subscription.id,
            asaasPaymentId: firstPayment.id,
            status: 'PENDING',
            amount: firstPayment.value,
            netAmount: firstPayment.netValue ?? null,
            dueDate,
            invoiceUrl: firstPayment.invoiceUrl ?? null,
            bankSlipUrl: firstPayment.bankSlipUrl ?? null,
            pixQrCodePayload: pixPayload,
            pixQrCodeImage: pixImage,
            competenceStart,
            competenceEnd,
            lastWebhookEvent: 'INITIAL_PAYMENT_GENERATED',
            lastWebhookAt: new Date(),
          },
          update: {
            amount: firstPayment.value,
            dueDate,
            invoiceUrl: firstPayment.invoiceUrl ?? undefined,
            bankSlipUrl: firstPayment.bankSlipUrl ?? undefined,
            pixQrCodePayload: pixPayload ?? undefined,
            pixQrCodeImage: pixImage ?? undefined,
          },
        })
      }
    } catch (paymentErr) {
      serverLog('warn', 'activateSubscription', 'Não foi possível sincronizar o primeiro pagamento de imediato', paymentErr)
    }

    revalidatePath('/admin/organizations')
    revalidatePath(`/admin/organizations/${org.id}`)
    return { success: true, subscriptionId: subscription.id }
  } catch (err: any) {
    serverLog('error', 'activateOrganizationSubscription', err)
    return { success: false, error: err.message || 'Erro ao ativar assinatura' }
  }
}

/**
 * Atualiza o plano ou preço personalizado de uma organização
 */
export async function updateOrganizationPlan(input: UpdateSubscriptionPlanInput) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser || dbUser.realRole !== 'SUPER_ADMIN') {
      throw new Error('Acesso negado: Apenas SUPER_ADMIN pode alterar planos')
    }

    const validated = updateSubscriptionPlanSchema.parse(input)

    const subscription = await prisma.organizationSubscription.findUnique({
      where: { organizationId: validated.organizationId },
      include: { plan: true },
    })

    if (!subscription || !subscription.asaasSubscriptionId) {
      throw new Error('Assinatura Asaas não encontrada para esta organização')
    }

    const targetPlan = await prisma.subscriptionPlan.findUnique({
      where: { code: validated.newPlanCode },
    })
    if (!targetPlan) throw new Error('Plano de destino não encontrado')

    const newEffectivePrice = validated.customPrice ?? decimalToNumber(targetPlan.price)

    // Atualiza no Asaas
    await updateAsaasSubscription(subscription.asaasSubscriptionId, {
      value: newEffectivePrice,
      description: `Assinatura AgroTech SaaS - ${targetPlan.name}`,
      updatePendingPayments: validated.updatePendingPayments,
    })

    // Atualiza localmente
    await prisma.organizationSubscription.update({
      where: { id: subscription.id },
      data: {
        planId: targetPlan.id,
        customPrice: validated.customPrice ? validated.customPrice : null,
      },
    })

    revalidatePath('/admin/organizations')
    revalidatePath(`/admin/organizations/${validated.organizationId}`)
    return { success: true }
  } catch (err: any) {
    serverLog('error', 'updateOrganizationPlan', err)
    return { success: false, error: err.message || 'Erro ao atualizar plano' }
  }
}

/**
 * Atualiza manualmente o Pix QR Code de uma fatura caso não tenha vindo na criação
 */
export async function refreshInvoicePixAction(invoiceId: string) {
  try {
    const invoice = await prisma.subscriptionInvoice.findUnique({
      where: { id: invoiceId },
    })
    if (!invoice) throw new Error('Fatura não encontrada')

    const pix = await getPixQrCode(invoice.asaasPaymentId)

    await prisma.subscriptionInvoice.update({
      where: { id: invoice.id },
      data: {
        pixQrCodePayload: pix.payload,
        pixQrCodeImage: pix.encodedImage,
      },
    })

    return {
      success: true,
      pixQrCodePayload: pix.payload,
      pixQrCodeImage: pix.encodedImage,
    }
  } catch (err: any) {
    serverLog('error', 'refreshInvoicePixAction', err)
    return { success: false, error: err.message || 'Falha ao buscar Pix no gateway' }
  }
}
