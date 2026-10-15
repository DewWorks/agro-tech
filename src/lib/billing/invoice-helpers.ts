import { Prisma } from '@prisma/client'

export interface SerializedInvoice {
  id: string
  subscriptionId: string
  asaasPaymentId: string
  status: string
  amount: number
  netAmount: number | null
  dueDate: string
  paidAt: string | null
  invoiceUrl: string | null
  bankSlipUrl: string | null
  pixQrCodePayload: string | null
  pixQrCodeImage: string | null
  invoiceNumber: string | null
  competenceStart: string
  competenceEnd: string
  createdAt: string
}

/**
 * Normaliza datas do ciclo de cobrança garantindo ancoragem no billingDueDay
 * Evita drift de 30 dias que acumula distorções em meses com 28, 29 ou 31 dias.
 */
export function computeNextCompetencePeriod(
  baseDueDate: Date,
  billingDueDay = 10,
): { newPeriodStart: Date; newPeriodEnd: Date } {
  const d = new Date(baseDueDate)
  
  // O início do novo período de competência é a data base de vencimento do ciclo quitado
  const newPeriodStart = new Date(d.getFullYear(), d.getMonth(), billingDueDay)

  // O término do novo período avança exatamente 1 mês civil, mantendo o dia de corte
  const newPeriodEnd = new Date(d.getFullYear(), d.getMonth() + 1, billingDueDay)

  return { newPeriodStart, newPeriodEnd }
}

/**
 * Calcula o período de competência de uma fatura recém-criada
 */
export function computeInitialCompetence(
  dueDate: Date,
  billingDueDay = 10,
): { competenceStart: Date; competenceEnd: Date } {
  const end = new Date(dueDate)
  const start = new Date(dueDate.getFullYear(), dueDate.getMonth() - 1, billingDueDay)
  return { competenceStart: start, competenceEnd: end }
}

/**
 * Converte com segurança campos Prisma.Decimal para number em Server-to-Client boundaries
 */
export function decimalToNumber(val: Prisma.Decimal | number | null | undefined): number {
  if (val === null || val === undefined) return 0
  if (typeof val === 'number') return val
  return Number(val)
}

/**
 * Serializa faturas de assinatura para consumo em Client Components (React 19)
 */
export function serializeInvoice(invoice: any): SerializedInvoice {
  return {
    id: invoice.id,
    subscriptionId: invoice.subscriptionId,
    asaasPaymentId: invoice.asaasPaymentId,
    status: invoice.status,
    amount: decimalToNumber(invoice.amount),
    netAmount: invoice.netAmount ? decimalToNumber(invoice.netAmount) : null,
    dueDate: invoice.dueDate instanceof Date ? invoice.dueDate.toISOString() : String(invoice.dueDate),
    paidAt: invoice.paidAt ? (invoice.paidAt instanceof Date ? invoice.paidAt.toISOString() : String(invoice.paidAt)) : null,
    invoiceUrl: invoice.invoiceUrl ?? null,
    bankSlipUrl: invoice.bankSlipUrl ?? null,
    pixQrCodePayload: invoice.pixQrCodePayload ?? null,
    pixQrCodeImage: invoice.pixQrCodeImage ?? null,
    invoiceNumber: invoice.invoiceNumber ?? null,
    competenceStart: invoice.competenceStart instanceof Date ? invoice.competenceStart.toISOString() : String(invoice.competenceStart),
    competenceEnd: invoice.competenceEnd instanceof Date ? invoice.competenceEnd.toISOString() : String(invoice.competenceEnd),
    createdAt: invoice.createdAt instanceof Date ? invoice.createdAt.toISOString() : String(invoice.createdAt),
  }
}
