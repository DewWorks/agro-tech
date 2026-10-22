import 'dotenv/config'
import prisma from '../src/lib/prisma'
import {
  createAsaasCustomer,
  updateAsaasCustomer,
  findCustomerByCpfCnpj,
} from '../src/lib/asaas/customers'
import {
  createAsaasSubscription,
  getSubscriptionPayments,
} from '../src/lib/asaas/subscriptions'
import { getPixQrCode } from '../src/lib/asaas/payments'
import { computeInitialCompetence, decimalToNumber } from '../src/lib/billing/invoice-helpers'
import { asaasConfig } from '../src/lib/asaas/config'

interface ProvisionOptions {
  organizationId?: string
  planCode?: string
  dueDay?: number
  customPrice?: number
  force?: boolean
  offlineMode?: boolean
}

export async function provisionSubscription(options: ProvisionOptions = {}) {
  const targetOrgId = options.organizationId || 'd4450841-c4ba-4558-8630-0f37aaec33d4'
  const planCode = options.planCode || 'FOUNDER_300'
  const billingDueDay = options.dueDay ?? 10

  console.log(`\n======================================================`)
  console.log(`🚀 INICIANDO PROVISIONAMENTO DE ASSINATURA SAAS`)
  console.log(`======================================================`)
  console.log(`• Target Organization ID: ${targetOrgId}`)
  console.log(`• Plano Selecionado:      ${planCode}`)
  console.log(`• Dia Base de Vencimento: Dia ${billingDueDay}`)

  // 1. Localizar Organização
  const org = await prisma.organization.findUnique({
    where: { id: targetOrgId },
    include: {
      users: {
        where: { role: 'OWNER' },
        take: 1,
      },
      subscription: {
        include: { plan: true },
      },
    },
  })

  if (!org) {
    throw new Error(`Organização com ID "${targetOrgId}" não foi encontrada no banco de dados.`)
  }

  console.log(`• Organização Encontrada: ${org.name.trim()}`)
  console.log(`• CNPJ Fiscal:            ${org.cnpj}`)

  if (org.subscription && !options.force) {
    console.log(`\n⚠️  A organização "${org.name.trim()}" já possui uma assinatura vinculada!`)
    console.log(`   - ID da Assinatura: ${org.subscription.id}`)
    console.log(`   - Plano Atual:      ${org.subscription.plan.name} (${org.subscription.plan.code})`)
    console.log(`   - Status:           ${org.subscription.status}`)
    console.log(`   - Asaas Sub ID:     ${org.subscription.asaasSubscriptionId || 'N/A'}`)
    console.log(`\nPara forçar uma sobrescrita ou recriação, utilize a flag --force.`)
    return org.subscription
  }

  // 2. Localizar Plano
  let plan = await prisma.subscriptionPlan.findUnique({
    where: { code: planCode },
  })

  if (!plan) {
    console.log(`⚠️ Plano "${planCode}" não encontrado. Criando automaticamente...`)
    plan = await prisma.subscriptionPlan.create({
      data: {
        code: 'FOUNDER_300',
        name: 'Plano Fundador (Pioneiro)',
        description: 'Condição contratual exclusiva acordada para a LN Consultoria e parceiros pioneiros. Acesso completo ao ecossistema AgroTech.',
        price: 300.0,
        billingCycle: 'MONTHLY',
        maxBranches: 5,
        maxUsers: 15,
        storageLimitGb: 20,
        pdfQuotaMonthly: 500,
        isActive: true,
      },
    })
    console.log(`✅ Plano criado com sucesso!`)
  }

  const effectivePrice = options.customPrice ?? decimalToNumber(plan.price)
  const billingEmail = org.users[0]?.email || 'ruraltec-projetosrurais@hotmail.com'
  const billingName = org.name.trim()
  const billingCpfCnpj = org.cnpj

  // 3. Determinar modo de operação (Online Asaas vs Homologação Offline)
  const hasAsaasApiKey = Boolean(asaasConfig.apiKey && asaasConfig.apiKey.trim().length > 0)
  const isOffline = options.offlineMode || !hasAsaasApiKey

  let asaasCustomerId: string
  let asaasSubscriptionId: string
  let initialInvoiceData: any = null

  const now = new Date()
  let nextDue = new Date(now.getFullYear(), now.getMonth(), billingDueDay)
  if (nextDue <= now) {
    nextDue = new Date(now.getFullYear(), now.getMonth() + 1, billingDueDay)
  }
  const nextDueDateStr = nextDue.toISOString().split('T')[0]

  if (!isOffline) {
    console.log(`\n🌐 MODO ONLINE: Comunicando com Asaas API v3 (${asaasConfig.environment})...`)

    // 3.1 Cliente no Asaas
    console.log(`   → Verificando cliente Asaas para CNPJ ${billingCpfCnpj}...`)
    const existingCustomer = await findCustomerByCpfCnpj(billingCpfCnpj)

    if (existingCustomer) {
      asaasCustomerId = existingCustomer.id
      console.log(`   → Cliente já existente no Asaas: ${asaasCustomerId}`)
      await updateAsaasCustomer(asaasCustomerId, {
        name: billingName,
        email: billingEmail,
      })
    } else {
      console.log(`   → Criando novo cliente no Asaas...`)
      const createdCustomer = await createAsaasCustomer({
        name: billingName,
        cpfCnpj: billingCpfCnpj,
        email: billingEmail,
        externalReference: org.id,
      })
      asaasCustomerId = createdCustomer.id
      console.log(`   → Cliente criado no Asaas: ${asaasCustomerId}`)
    }

    // 3.2 Assinatura no Asaas
    console.log(`   → Criando assinatura recorrente no Asaas (${nextDueDateStr}, R$ ${effectivePrice.toFixed(2)})...`)
    const asaasSub = await createAsaasSubscription({
      customer: asaasCustomerId,
      billingType: 'BOLETO',
      value: effectivePrice,
      nextDueDate: nextDueDateStr,
      cycle: 'MONTHLY',
      description: `Assinatura AgroTech SaaS - ${plan.name} (${billingName})`,
      externalReference: org.id,
    })
    asaasSubscriptionId = asaasSub.id
    console.log(`   → Assinatura criada com ID: ${asaasSubscriptionId}`)

    // 3.3 Buscar cobrança inicial gerada pelo Asaas
    try {
      console.log(`   → Buscando cobrança inicial gerada pelo gateway...`)
      const payments = await getSubscriptionPayments(asaasSub.id)
      const firstPayment = payments[0]

      if (firstPayment) {
        console.log(`   → Primeira cobrança Asaas: ${firstPayment.id} (Vencimento: ${firstPayment.dueDate})`)
        let pixPayload: string | null = null
        let pixImage: string | null = null

        try {
          const pix = await getPixQrCode(firstPayment.id)
          pixPayload = pix.payload
          pixImage = pix.encodedImage
          console.log(`   → QR Code Pix obtido com sucesso!`)
        } catch {
          console.log(`   ℹ️ QR Code Pix será gerado em background pelo Asaas.`)
        }

        const dueDate = new Date(firstPayment.dueDate)
        const { competenceStart, competenceEnd } = computeInitialCompetence(dueDate, billingDueDay)

        initialInvoiceData = {
          asaasPaymentId: firstPayment.id,
          amount: firstPayment.value,
          netAmount: firstPayment.netValue ?? null,
          dueDate,
          invoiceUrl: firstPayment.invoiceUrl ?? null,
          bankSlipUrl: firstPayment.bankSlipUrl ?? null,
          pixQrCodePayload: pixPayload,
          pixQrCodeImage: pixImage,
          competenceStart,
          competenceEnd,
        }
      }
    } catch (err: any) {
      console.warn(`   ⚠️ Aviso ao sincronizar primeira fatura:`, err.message)
    }
  } else {
    console.log(`\n🧪 MODO ASSISTIDO / HOMOLOGAÇÃO: ASAAS_API_KEY não configurada.`)
    console.log(`   Gerando vínculo local com identificadores compatíveis com o gateway...`)

    const shortId = org.id.slice(0, 8)
    asaasCustomerId = `cus_ln_${shortId}`
    asaasSubscriptionId = `sub_founder_${shortId}`

    const dueDate = nextDue
    const { competenceStart, competenceEnd } = computeInitialCompetence(dueDate, billingDueDay)

    initialInvoiceData = {
      asaasPaymentId: `pay_founder_${Date.now()}`,
      amount: effectivePrice,
      netAmount: effectivePrice - 1.99,
      dueDate,
      invoiceUrl: 'https://sandbox.asaas.com/i/sample-invoice',
      bankSlipUrl: 'https://sandbox.asaas.com/b/sample-bank-slip',
      pixQrCodePayload: '00020101021226830014br.gov.bcb.pix2561pix.asaas.com/qr/stat/sample-pix-agrotech5204000053039865406300.005802BR5925LN CONSULTORIA E PROJETOS6009SAO PAULO62070503***6304E2D1',
      pixQrCodeImage: null,
      competenceStart,
      competenceEnd,
    }
  }

  // 4. Gravação atômica no banco de dados local
  console.log(`\n💾 Gravando assinatura no PostgreSQL da organização...`)
  const currentPeriodStart = now
  const currentPeriodEnd = nextDue

  const subscription = await prisma.organizationSubscription.upsert({
    where: { organizationId: org.id },
    create: {
      organizationId: org.id,
      planId: plan.id,
      asaasCustomerId,
      asaasSubscriptionId,
      status: 'ACTIVE',
      customPrice: options.customPrice ? options.customPrice : null,
      billingDueDay,
      currentPeriodStart,
      currentPeriodEnd,
      billingName,
      billingCpfCnpj,
      billingEmail,
      billingPhone: null,
    },
    update: {
      planId: plan.id,
      asaasCustomerId,
      asaasSubscriptionId,
      status: 'ACTIVE',
      customPrice: options.customPrice ? options.customPrice : null,
      billingDueDay,
      currentPeriodStart,
      currentPeriodEnd,
      billingName,
      billingCpfCnpj,
      billingEmail,
    },
  })

  console.log(`✅ Assinatura gravada com sucesso! ID Local: ${subscription.id}`)

  // 5. Gravação da fatura inicial se gerada
  if (initialInvoiceData) {
    console.log(`💾 Registrando fatura inicial no histórico contábil...`)
    await prisma.subscriptionInvoice.upsert({
      where: { asaasPaymentId: initialInvoiceData.asaasPaymentId },
      create: {
        subscriptionId: subscription.id,
        ...initialInvoiceData,
        status: 'PENDING',
        lastWebhookEvent: 'INITIAL_PAYMENT_GENERATED',
        lastWebhookAt: new Date(),
      },
      update: {
        amount: initialInvoiceData.amount,
        dueDate: initialInvoiceData.dueDate,
        invoiceUrl: initialInvoiceData.invoiceUrl,
        bankSlipUrl: initialInvoiceData.bankSlipUrl,
        pixQrCodePayload: initialInvoiceData.pixQrCodePayload,
        pixQrCodeImage: initialInvoiceData.pixQrCodeImage,
      },
    })
    console.log(`✅ Fatura inicial registrada com vencimento em ${nextDueDateStr}!`)
  }

  console.log(`\n======================================================`)
  console.log(`🎉 PROVISIONAMENTO CONCLUÍDO COM SUCESSO!`)
  console.log(`======================================================`)
  console.log(`• Organização:      ${org.name.trim()}`)
  console.log(`• Plano:            ${plan.name} (R$ ${effectivePrice.toFixed(2)}/mês)`)
  console.log(`• Status:           ACTIVE`)
  console.log(`• Vencimento Base:  Dia ${billingDueDay} de cada mês`)
  console.log(`• Próximo Ciclo:    ${nextDue.toLocaleDateString('pt-BR')}`)
  console.log(`• Asaas Customer:   ${asaasCustomerId}`)
  console.log(`• Asaas Sub ID:     ${asaasSubscriptionId}`)
  console.log(`======================================================\n`)

  return subscription
}

// Execução direta via CLI (npx tsx scripts/provision-subscription.ts)
if (require.main === module || process.argv[1]?.includes('provision-subscription')) {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const offlineMode = args.includes('--offline') || args.includes('--simulate')

  let orgId = 'd4450841-c4ba-4558-8630-0f37aaec33d4'
  const orgArgIndex = args.indexOf('--orgId')
  if (orgArgIndex !== -1 && args[orgArgIndex + 1]) {
    orgId = args[orgArgIndex + 1]
  }

  provisionSubscription({ organizationId: orgId, force, offlineMode })
    .catch((err) => {
      console.error('\n❌ ERRO FATAL NO PROVISIONAMENTO:', err)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
