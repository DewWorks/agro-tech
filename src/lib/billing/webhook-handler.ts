import prisma from '@/lib/prisma'
import { serverLog } from '@/lib/logger'
import { getPixQrCode } from '@/lib/asaas/payments'
import { computeInitialCompetence, computeNextCompetencePeriod } from './invoice-helpers'
import type { AsaasWebhookPayment } from '@/lib/validations/billing'
import type { SubscriptionStatus, InvoiceStatus } from '@prisma/client'

/**
 * PAYMENT_CREATED:
 * 1. Upsert da fatura no PostgreSQL dentro de transação atômica.
 * 2. Busca do Pix Copia-e-Cola FORA da transação (evita gargalo de pool no PgBouncer).
 * 3. Atualização isolada do payload Pix se obtido com sucesso.
 */
export async function handlePaymentCreated(payment: AsaasWebhookPayment): Promise<void> {
  if (!payment.subscription) {
    serverLog('info', 'handlePaymentCreated', `Pagamento avulso ${payment.id} ignorado`)
    return
  }

  // 1. Localizar subscription
  const subscription = await prisma.organizationSubscription.findUnique({
    where: { asaasSubscriptionId: payment.subscription },
  })

  if (!subscription) {
    serverLog(
      'warn',
      'handlePaymentCreated',
      `Assinatura Asaas ${payment.subscription} não encontrada no banco local para o pagamento ${payment.id}`,
    )
    return
  }

  const dueDate = new Date(payment.dueDate)
  const { competenceStart, competenceEnd } = computeInitialCompetence(
    dueDate,
    subscription.billingDueDay,
  )

  // 2. Upsert atômico da fatura
  await prisma.subscriptionInvoice.upsert({
    where: { asaasPaymentId: payment.id },
    create: {
      subscriptionId: subscription.id,
      asaasPaymentId: payment.id,
      status: 'PENDING',
      amount: payment.value,
      netAmount: payment.netValue ?? null,
      dueDate,
      invoiceUrl: payment.invoiceUrl ?? null,
      bankSlipUrl: payment.bankSlipUrl ?? null,
      competenceStart,
      competenceEnd,
      lastWebhookEvent: 'PAYMENT_CREATED',
      lastWebhookAt: new Date(),
    },
    update: {
      amount: payment.value,
      netAmount: payment.netValue ?? undefined,
      dueDate,
      invoiceUrl: payment.invoiceUrl ?? undefined,
      bankSlipUrl: payment.bankSlipUrl ?? undefined,
      lastWebhookEvent: 'PAYMENT_CREATED',
      lastWebhookAt: new Date(),
    },
  })

  // 3. Chamada HTTP externa do Pix executada FORA do lock de transação do PostgreSQL
  try {
    const pixData = await getPixQrCode(payment.id)
    if (pixData?.payload) {
      await prisma.subscriptionInvoice.update({
        where: { asaasPaymentId: payment.id },
        data: {
          pixQrCodePayload: pixData.payload,
          pixQrCodeImage: pixData.encodedImage,
        },
      })
    }
  } catch (pixError) {
    // Tolerância operacional: Asaas pode demorar alguns instantes para gerar o Pix de boletos híbridos
    serverLog(
      'warn',
      'handlePaymentCreated',
      `Pix QR Code ainda não disponível de imediato para fatura ${payment.id}. Será atualizado em consultas posteriores.`,
      pixError,
    )
  }
}

/**
 * PAYMENT_RECEIVED / PAYMENT_CONFIRMED:
 * Unifica a liquidação do título e renova a vigência sem drift de calendário.
 */
export async function handlePaymentSettled(
  payment: AsaasWebhookPayment,
  event: 'PAYMENT_RECEIVED' | 'PAYMENT_CONFIRMED',
): Promise<void> {
  const invoice = await prisma.subscriptionInvoice.findUnique({
    where: { asaasPaymentId: payment.id },
    include: { subscription: true },
  })

  if (!invoice) {
    // Se a fatura ainda não existia, tenta sincronizar a criação primeiro
    serverLog('warn', 'handlePaymentSettled', `Fatura ${payment.id} não encontrada. Criando antecipadamente...`)
    await handlePaymentCreated(payment)
  }

  await prisma.$transaction(async (tx) => {
    const currentInvoice = await tx.subscriptionInvoice.findUnique({
      where: { asaasPaymentId: payment.id },
      include: { subscription: true },
    })

    if (!currentInvoice) {
      throw new Error(`Fatura ${payment.id} irrecuperável durante liquidação`)
    }

    // Idempotência estrita: se já quitada, não estende vigência novamente
    if (currentInvoice.status === 'RECEIVED') {
      serverLog('info', 'handlePaymentSettled', `Fatura ${payment.id} já liquidada anteriormente. Ignorando re-execução.`)
      return
    }

    const paidAt = payment.paymentDate ? new Date(payment.paymentDate) : new Date()

    // 1. Quitar a fatura
    await tx.subscriptionInvoice.update({
      where: { asaasPaymentId: payment.id },
      data: {
        status: 'RECEIVED',
        paidAt,
        netAmount: payment.netValue ?? currentInvoice.netAmount,
        invoiceNumber: payment.invoiceNumber ?? currentInvoice.invoiceNumber,
        lastWebhookEvent: event,
        lastWebhookAt: new Date(),
      },
    })

    // 2. Calcular vigência correta ancorada no billingDueDay (prevenção de drift)
    const { newPeriodStart, newPeriodEnd } = computeNextCompetencePeriod(
      currentInvoice.dueDate,
      currentInvoice.subscription.billingDueDay,
    )

    // 3. Ativar assinatura e limpar tolerância
    await tx.organizationSubscription.update({
      where: { id: currentInvoice.subscriptionId },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd,
        gracePeriodUntil: null,
      },
    })

    serverLog(
      'info',
      'handlePaymentSettled',
      `Assinatura ${currentInvoice.subscriptionId} reativada com sucesso até ${newPeriodEnd.toISOString()}`,
    )
  })
}

/**
 * PAYMENT_OVERDUE:
 * Registra o vencimento da fatura e calcula o período de tolerância de 15 dias corridos.
 */
export async function handlePaymentOverdue(payment: AsaasWebhookPayment): Promise<void> {
  if (!payment.subscription) return

  // Correção forense: Buscar subscription antes do upsert para garantir subscriptionId válida
  const subscription = await prisma.organizationSubscription.findUnique({
    where: { asaasSubscriptionId: payment.subscription },
  })

  if (!subscription) {
    serverLog(
      'warn',
      'handlePaymentOverdue',
      `Assinatura Asaas ${payment.subscription} não encontrada para cobrança vencida ${payment.id}`,
    )
    return
  }

  const dueDate = new Date(payment.dueDate)
  const { competenceStart, competenceEnd } = computeInitialCompetence(
    dueDate,
    subscription.billingDueDay,
  )

  await prisma.$transaction(async (tx) => {
    // 1. Atualizar ou criar fatura em atraso
    await tx.subscriptionInvoice.upsert({
      where: { asaasPaymentId: payment.id },
      create: {
        subscriptionId: subscription.id,
        asaasPaymentId: payment.id,
        status: 'OVERDUE',
        amount: payment.value,
        netAmount: payment.netValue ?? null,
        dueDate,
        invoiceUrl: payment.invoiceUrl ?? null,
        bankSlipUrl: payment.bankSlipUrl ?? null,
        competenceStart,
        competenceEnd,
        lastWebhookEvent: 'PAYMENT_OVERDUE',
        lastWebhookAt: new Date(),
      },
      update: {
        status: 'OVERDUE',
        lastWebhookEvent: 'PAYMENT_OVERDUE',
        lastWebhookAt: new Date(),
      },
    })

    // 2. Tolerância legal e contratual: 15 dias corridos a partir da data de vencimento
    const gracePeriodUntil = new Date(dueDate)
    gracePeriodUntil.setDate(gracePeriodUntil.getDate() + 15)

    const now = new Date()
    const isPastGrace = now > gracePeriodUntil
    const targetStatus: SubscriptionStatus = isPastGrace ? 'SUSPENDED' : 'OVERDUE'

    await tx.organizationSubscription.update({
      where: { id: subscription.id },
      data: {
        status: targetStatus,
        gracePeriodUntil,
      },
    })

    serverLog(
      'warn',
      'handlePaymentOverdue',
      `Assinatura ${subscription.id} marcada como ${targetStatus}. Carência até ${gracePeriodUntil.toISOString()}`,
    )
  })
}

/**
 * PAYMENT_REFUNDED / PAYMENT_DELETED:
 * Atualiza status da fatura para estorno ou cancelamento e audita adimplência.
 */
export async function handlePaymentCancelled(
  payment: AsaasWebhookPayment,
  event: 'PAYMENT_REFUNDED' | 'PAYMENT_DELETED',
): Promise<void> {
  const newInvoiceStatus: InvoiceStatus = event === 'PAYMENT_REFUNDED' ? 'REFUNDED' : 'CANCELLED'

  await prisma.$transaction(async (tx) => {
    await tx.subscriptionInvoice.updateMany({
      where: { asaasPaymentId: payment.id },
      data: {
        status: newInvoiceStatus,
        lastWebhookEvent: event,
        lastWebhookAt: new Date(),
      },
    })

    if (!payment.subscription) return

    const subscription = await tx.organizationSubscription.findUnique({
      where: { asaasSubscriptionId: payment.subscription },
      include: {
        invoices: {
          where: { status: 'RECEIVED' },
          orderBy: { dueDate: 'desc' },
          take: 1,
        },
      },
    })

    if (!subscription) return

    // Se nenhuma outra fatura recebida existir, marca a subscription como OVERDUE/SUSPENDED
    if (subscription.invoices.length === 0) {
      await tx.organizationSubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'OVERDUE',
        },
      })
    }
  })
}
