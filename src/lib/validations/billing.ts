import { z } from 'zod'

export const asaasWebhookPaymentSchema = z.object({
  id: z.string(),
  subscription: z.string().nullable().optional(),
  customer: z.string(),
  value: z.number(),
  netValue: z.number().nullable().optional(),
  status: z.string(),
  billingType: z.string(),
  dueDate: z.string(), // "YYYY-MM-DD"
  originalDueDate: z.string().nullable().optional(),
  paymentDate: z.string().nullable().optional(),
  clientPaymentDate: z.string().nullable().optional(),
  bankSlipUrl: z.string().nullable().optional(),
  invoiceUrl: z.string().nullable().optional(),
  invoiceNumber: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  deleted: z.boolean().optional(),
})

export const asaasWebhookSchema = z.object({
  event: z.enum([
    'PAYMENT_CREATED',
    'PAYMENT_UPDATED',
    'PAYMENT_RECEIVED',
    'PAYMENT_CONFIRMED',
    'PAYMENT_OVERDUE',
    'PAYMENT_REFUNDED',
    'PAYMENT_DELETED',
    'PAYMENT_RESTORED',
  ]),
  payment: asaasWebhookPaymentSchema,
})

export type AsaasWebhookPayload = z.infer<typeof asaasWebhookSchema>
export type AsaasWebhookPayment = z.infer<typeof asaasWebhookPaymentSchema>

// Esquemas de formulário para ativação/alteração da assinatura
export const activateSubscriptionSchema = z.object({
  organizationId: z.string().uuid('ID da organização inválido'),
  planCode: z.string().min(1, 'Selecione um plano'),
  billingDueDay: z.number().int().min(1).max(28).default(10),
  customPrice: z.number().positive().optional(),
  billingName: z.string().min(3, 'Nome para faturamento obrigatório'),
  billingCpfCnpj: z.string().min(11, 'CPF ou CNPJ inválido'),
  billingEmail: z.string().email('E-mail para faturamento inválido'),
  billingPhone: z.string().optional(),
})

export type ActivateSubscriptionInput = z.infer<typeof activateSubscriptionSchema>

export const updateSubscriptionPlanSchema = z.object({
  organizationId: z.string().uuid(),
  newPlanCode: z.string().min(1),
  customPrice: z.number().positive().optional().nullable(),
  updatePendingPayments: z.boolean().default(true),
})

export type UpdateSubscriptionPlanInput = z.infer<typeof updateSubscriptionPlanSchema>
