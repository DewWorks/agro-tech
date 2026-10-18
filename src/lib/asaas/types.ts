// ==========================================
// Tipos de Requisição Asaas API v3
// ==========================================

export interface CreateCustomerRequest {
  name: string
  cpfCnpj: string
  email: string
  phone?: string
  mobilePhone?: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  externalReference?: string
  notificationDisabled?: boolean
}

export interface UpdateCustomerRequest {
  name?: string
  cpfCnpj?: string
  email?: string
  phone?: string
  mobilePhone?: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  notificationDisabled?: boolean
}

export interface CreateSubscriptionRequest {
  customer: string           // asaasCustomerId (ex: "cus_xxx")
  billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'UNDEFINED'
  value: number              // ex: 300.00
  nextDueDate: string        // "YYYY-MM-DD"
  cycle: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
  description?: string
  externalReference?: string
  discount?: {
    value: number
    dueDateLimitDays?: number
    type?: 'FIXED' | 'PERCENTAGE'
  }
}

export interface UpdateSubscriptionRequest {
  billingType?: 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'UNDEFINED'
  value?: number
  nextDueDate?: string
  cycle?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  description?: string
  updatePendingPayments?: boolean
}

// ==========================================
// Tipos de Resposta Asaas API v3
// ==========================================

export interface AsaasCustomerResponse {
  object: 'customer'
  id: string                 // "cus_xxx"
  dateCreated: string
  name: string
  email: string
  phone: string | null
  mobilePhone: string | null
  cpfCnpj: string
  postalCode: string | null
  address: string | null
  addressNumber: string | null
  complement: string | null
  province: string | null
  externalReference: string | null
  notificationDisabled: boolean
  deleted: boolean
}

export interface AsaasSubscriptionResponse {
  object: 'subscription'
  id: string                 // "sub_xxx"
  dateCreated: string
  customer: string
  paymentLink?: string | null
  billingType: string
  value: number
  nextDueDate: string
  cycle: string
  description: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  deleted: boolean
}

export interface AsaasPaymentResponse {
  object: 'payment'
  id: string                 // "pay_xxx"
  dateCreated: string
  customer: string
  subscription?: string | null
  installment?: string | null
  paymentLink?: string | null
  dueDate: string
  originalDueDate: string
  value: number
  netValue?: number
  originalValue?: number
  interestValue?: number
  description?: string | null
  billingType: string
  canBePaidAfterDueDate?: boolean
  pixTransaction?: string | null
  status:
    | 'PENDING'
    | 'RECEIVED'
    | 'CONFIRMED'
    | 'OVERDUE'
    | 'REFUNDED'
    | 'RECEIVED_IN_CASH'
    | 'REFUND_REQUESTED'
    | 'REFUND_IN_PROGRESS'
    | 'CHARGEBACK_REQUESTED'
    | 'CHARGEBACK_DISPUTE'
    | 'AWAITING_CHARGEBACK_REVERSAL'
    | 'DUNNING_REQUESTED'
    | 'DUNNING_RECEIVED'
    | 'AWAITING_RISK_ANALYSIS'
  bankSlipUrl?: string | null
  invoiceUrl?: string | null
  invoiceNumber?: string | null
  externalReference?: string | null
  paymentDate?: string | null
  clientPaymentDate?: string | null
  deleted: boolean
}

export interface AsaasPixQrCodeResponse {
  encodedImage: string       // Base64 da imagem QR Code
  payload: string            // Código Pix Copia-e-Cola (EMV)
  expirationDate: string
}

export interface AsaasListResponse<T> {
  object: 'list'
  hasMore: boolean
  totalCount: number
  limit: number
  offset: number
  data: T[]
}
