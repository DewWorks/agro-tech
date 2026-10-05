import { z } from 'zod'
import { validateCPF, validateCNPJ } from '@/lib/utils/masks'

/**
 * Validador para CPF ou CNPJ limpo
 */
function isValidDocument(doc: string): boolean {
  const clean = (doc || '').replace(/[^\d]+/g, '')
  if (clean.length === 11) return validateCPF(clean)
  if (clean.length === 14) return validateCNPJ(clean)
  return false
}

// ==========================================
// 1. CONFIGURAÇÕES
// ==========================================

export const financialSettingsSchema = z.object({
  defaultSuccessFeePercent: z.number().min(0).max(100),
  defaultPartnerCommissionPercent: z.number().min(0).max(100),
  defaultFieldSurveyCostPerKm: z.number().min(0),
})

export type FinancialSettingsInput = z.infer<typeof financialSettingsSchema>

export const financialBranchSettingsSchema = z.object({
  monthlyFixedCostTarget: z.number().min(0),
  monthlyRevenueTarget: z.number().min(0),
  activeCropYear: z.string().min(4),
  notes: z.string().optional().nullable(),
})

export type FinancialBranchSettingsInput = z.infer<typeof financialBranchSettingsSchema>

// ==========================================
// 2. CONTAS BANCÁRIAS E TESOURARIA
// ==========================================

export const bankAccountSchema = z.object({
  branchId: z.string().uuid(),
  bankCode: z.string().min(1, 'Código do banco obrigatório'),
  bankName: z.string().min(2, 'Nome do banco/caixa obrigatório'),
  agency: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  accountType: z.enum(['CORRENTE', 'POUPANCA', 'CAIXA_ESPECIE']),
  initialBalance: z.number().default(0),
})

export type BankAccountInput = z.infer<typeof bankAccountSchema>

export const transferBetweenAccountsSchema = z.object({
  sourceBankAccountId: z.string().uuid('Conta de origem inválida'),
  destinationBankAccountId: z.string().uuid('Conta de destino inválida'),
  amount: z.number().positive('O valor deve ser maior que zero'),
  description: z.string().min(3, 'Descrição obrigatória (mínimo 3 caracteres)'),
}).refine(data => data.sourceBankAccountId !== data.destinationBankAccountId, {
  message: 'A conta de destino deve ser diferente da conta de origem',
  path: ['destinationBankAccountId'],
})

export type TransferBetweenAccountsInput = z.infer<typeof transferBetweenAccountsSchema>

// ==========================================
// 3. PARCEIROS COMERCIAIS
// ==========================================

export const commercialPartnerSchema = z.object({
  branchId: z.string().uuid(),
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  document: z.string().refine(isValidDocument, {
    message: 'CPF ou CNPJ inválido',
  }),
  phone: z.string().optional().nullable(),
  email: z.string().email('E-mail inválido').optional().nullable(),
  pixKey: z.string().min(3, 'Chave PIX obrigatória'),
  pixKeyType: z.enum(['CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'ALEATORIA']),
  bankInfo: z.record(z.string(), z.any()).optional().nullable(),
  defaultCommissionRate: z.number().min(0).max(100).default(20.0),
})

export type CommercialPartnerInput = z.infer<typeof commercialPartnerSchema>

// ==========================================
// 4. CONTAS A RECEBER E FATURAMENTO
// ==========================================

export const installmentItemSchema = z.object({
  installmentNumber: z.number().int().positive(),
  totalInstallments: z.number().int().positive(),
  dueDate: z.string().or(z.date()),
  amount: z.number().positive('Valor da parcela deve ser positivo'),
})

export const createReceivableTitleSchema = z.object({
  branchId: z.string().uuid(),
  producerId: z.string().uuid(),
  propertyId: z.string().uuid().optional().nullable(),
  demandId: z.string().uuid().optional().nullable(),
  partnerId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid(),
  originType: z.enum(['ESTEIRA_CREDITO', 'SERVICO_AVULSO_PACOTE']).default('ESTEIRA_CREDITO'),
  serviceSubtype: z.string().optional().nullable(),
  documentNumber: z.string().optional().nullable(),
  cropYear: z.string().default('2025/2026'),
  financedAmount: z.number().optional().nullable(),
  successFeePercent: z.number().optional().nullable(),
  grossAmount: z.number().positive('Valor bruto deve ser maior que zero'),
  discountAmount: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  installments: z.array(installmentItemSchema).min(1, 'Pelo menos uma parcela é obrigatória'),
})

export type CreateReceivableTitleInput = z.infer<typeof createReceivableTitleSchema>

export const settleReceivableInstallmentSchema = z.object({
  installmentId: z.string().uuid(),
  bankAccountId: z.string().uuid('Selecione a conta de crédito'),
  receivedAmount: z.number().positive('Valor recebido deve ser maior que zero'),
  receivedAt: z.string().or(z.date()).optional(),
  notes: z.string().optional().nullable(),
})

export type SettleReceivableInstallmentInput = z.infer<typeof settleReceivableInstallmentSchema>

export const reverseReceivablePaymentSchema = z.object({
  transactionId: z.string().uuid(),
  justification: z.string().min(15, 'A justificativa do estorno deve ter no mínimo 15 caracteres'),
})

export type ReverseReceivablePaymentInput = z.infer<typeof reverseReceivablePaymentSchema>

// ==========================================
// 5. CONTAS A PAGAR E COMPRAS PARCELADAS
// ==========================================

export const createPayableTitleSchema = z.object({
  branchId: z.string().uuid(),
  categoryId: z.string().uuid(),
  demandId: z.string().uuid().optional().nullable(),
  partnerCommissionId: z.string().uuid().optional().nullable(),
  supplierName: z.string().min(2, 'Nome do fornecedor obrigatório'),
  supplierDocument: z.string().optional().nullable(),
  documentNumber: z.string().optional().nullable(),
  expenseType: z.enum(['CUSTO_DIRETO_PROPOSTA', 'DESPESA_FIXA_FILIAL', 'COMISSAO_PARCEIRO']),
  cropYear: z.string().default('2025/2026'),
  totalAmount: z.number().positive('Valor total deve ser maior que zero'),
  isInstallmentPurchase: z.boolean().default(false),
  notes: z.string().optional().nullable(),
  installments: z.array(installmentItemSchema).min(1, 'Pelo menos uma parcela é obrigatória'),
})

export type CreatePayableTitleInput = z.infer<typeof createPayableTitleSchema>

export const settlePayableInstallmentSchema = z.object({
  installmentId: z.string().uuid(),
  bankAccountId: z.string().uuid('Selecione a conta de débito'),
  paidAmount: z.number().positive('Valor pago deve ser maior que zero'),
  paidAt: z.string().or(z.date()).optional(),
  notes: z.string().optional().nullable(),
})

export type SettlePayableInstallmentInput = z.infer<typeof settlePayableInstallmentSchema>
