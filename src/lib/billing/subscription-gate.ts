import prisma from '@/lib/prisma'
import { serializeInvoice, type SerializedInvoice } from './invoice-helpers'

export type SubscriptionGateResult =
  | { allowed: true; status?: string }
  | { allowed: false; reason: 'SUSPENDED'; invoice: SerializedInvoice | null }
  | {
      allowed: false
      reason: 'OVERDUE'
      invoice: SerializedInvoice | null
      daysRemaining: number
      dueDate: string
    }
  | { allowed: false; reason: 'NO_SUBSCRIPTION' }

/**
 * Avalia o portão de acesso (paywall) de uma organização.
 * Chamado pelo Layout do Admin (Server Component).
 */
export async function checkSubscriptionGate(
  organizationId: string,
): Promise<SubscriptionGateResult> {
  const subscription = await prisma.organizationSubscription.findUnique({
    where: { organizationId },
    include: {
      invoices: {
        where: { status: { in: ['PENDING', 'OVERDUE'] } },
        orderBy: { dueDate: 'desc' },
        take: 1,
      },
    },
  })

  if (!subscription) {
    return { allowed: false, reason: 'NO_SUBSCRIPTION' }
  }

  // 1. TRIAL e ACTIVE: Acesso pleno liberado
  if (subscription.status === 'TRIAL' || subscription.status === 'ACTIVE') {
    return { allowed: true, status: subscription.status }
  }

  const latestPendingInvoice = subscription.invoices[0]
  const invoiceDisplay: SerializedInvoice | null = latestPendingInvoice
    ? serializeInvoice(latestPendingInvoice)
    : null

  // 2. OVERDUE: Período de tolerância (1 a 15 dias de atraso)
  if (subscription.status === 'OVERDUE') {
    const now = new Date()
    const graceEnd = subscription.gracePeriodUntil ?? now
    const msRemaining = graceEnd.getTime() - now.getTime()
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)))

    // Se ultrapassou a tolerância, atualiza para SUSPENDED de forma defensiva
    if (daysRemaining <= 0) {
      await prisma.organizationSubscription.update({
        where: { organizationId },
        data: { status: 'SUSPENDED' },
      })
      return { allowed: false, reason: 'SUSPENDED', invoice: invoiceDisplay }
    }

    const dueDateStr = latestPendingInvoice
      ? (latestPendingInvoice.dueDate instanceof Date
          ? latestPendingInvoice.dueDate.toISOString()
          : String(latestPendingInvoice.dueDate))
      : now.toISOString()

    return {
      allowed: false,
      reason: 'OVERDUE',
      invoice: invoiceDisplay,
      daysRemaining,
      dueDate: dueDateStr,
    }
  }

  // 3. SUSPENDED ou CANCELLED: Bloqueio total
  if (subscription.status === 'SUSPENDED' || subscription.status === 'CANCELLED') {
    return { allowed: false, reason: 'SUSPENDED', invoice: invoiceDisplay }
  }

  return { allowed: true, status: subscription.status }
}
