import { z } from 'zod'

export const urbanPropertyInputSchema = z.object({
  description: z.string().optional(),
  propertyType: z.enum(['RESIDENCIAL', 'COMERCIAL', 'TERRENO_LOTE', 'GALPAO_INDUSTRIAL', 'OUTRO']).default('RESIDENCIAL'),
  marketValue: z.number().nonnegative().default(0),
  hasLien: z.boolean().default(false),
  liquidityRating: z.enum(['ALTA', 'MEDIA', 'BAIXA']).default('MEDIA'),
})

export const vehicleInputSchema = z.object({
  brand: z.string().optional(),
  model: z.string().optional(),
  vehicleType: z.enum(['CAMINHONETE', 'CAMINHAO', 'AUTOMOVEL', 'TRATOR_UTILITARIO', 'CARRETA', 'OUTRO']).default('CAMINHONETE'),
  declaredValue: z.number().nonnegative().default(0),
  hasLien: z.boolean().default(false),
})

export const customAgroRevenueInputSchema = z.object({
  activityType: z.string().optional(),
  realizationType: z.string().optional(),
  description: z.string().default('Cultura Agrícola'),
  quantity: z.number().nonnegative().optional(),
  unit: z.string().optional(),
  unitPrice: z.number().nonnegative().optional(),
  productionCostTotal: z.number().nonnegative().optional(),
})

export const customExpenseInputSchema = z.object({
  category: z.enum(['CUSTEIO_OPERACIONAL', 'MANUTENCAO_FAMILIAR', 'SERVICO_DIVIDA_BANCARIA', 'OUTRO']).default('CUSTEIO_OPERACIONAL'),
  description: z.string().default('Despesa'),
  creditorName: z.string().optional(),
  annualAmount: z.number().nonnegative().default(0),
  installmentValue: z.number().nonnegative().optional(),
  isContinuingLiability: z.boolean().default(true),
})

export const creditSimulationSchema = z.object({
  creditLineCode: z.string().optional(),
  requestedAmount: z.number().nonnegative(),
  amortizationSystem: z.enum(['PRICE', 'SAC']).default('PRICE'),
  totalTermMonths: z.number().int().positive().default(12),
  gracePeriodMonths: z.number().int().nonnegative().default(0),
  interestRateAnnual: z.number().nonnegative().default(8.0),
  effectiveAgroRevenue: z.number().nonnegative().default(0),
  projectedAgroRevenue: z.number().nonnegative().default(0),
  nonAgroRevenue: z.number().nonnegative().default(0),
  productionCosts: z.number().nonnegative().default(0),
  familyLivingExpenses: z.number().nonnegative().default(0),
  existingDebtService: z.number().nonnegative().default(0),
  landValue: z.number().nonnegative().default(0),
  improvementsValue: z.number().nonnegative().default(0),
  machineryValue: z.number().nonnegative().default(0),
  livestockValue: z.number().nonnegative().default(0),
  urbanProperties: z.array(urbanPropertyInputSchema).optional(),
  vehicles: z.array(vehicleInputSchema).optional(),
  customAgroRevenues: z.array(customAgroRevenueInputSchema).optional(),
  customExpenses: z.array(customExpenseInputSchema).optional(),
})

export const saveCreditAnalysisSchema = creditSimulationSchema.extend({
  id: z.string().optional(),
  producerId: z.string().min(1, 'Produtor é obrigatório'),
  propertyId: z.string().optional(),
  branchId: z.string().optional(),
  cropYear: z.string().optional(),
  creditLimitPurpose: z.string().optional(),
  creditLimitTargetBank: z.string().optional(),
  notes: z.string().optional(),
  detailedUrbanProperties: z.array(
    z.object({
      propertyType: z.enum(['RESIDENCIAL', 'COMERCIAL', 'TERRENO_LOTE', 'GALPAO_INDUSTRIAL', 'OUTRO']),
      description: z.string(),
      city: z.string(),
      state: z.string(),
      marketValue: z.number(),
      hasLien: z.boolean(),
      lienInstitution: z.string().optional(),
      liquidityRating: z.enum(['ALTA', 'MEDIA', 'BAIXA']).optional(),
    })
  ).optional(),
  detailedVehicles: z.array(
    z.object({
      vehicleType: z.enum(['CAMINHONETE', 'CAMINHAO', 'AUTOMOVEL', 'TRATOR_UTILITARIO', 'CARRETA', 'OUTRO']),
      brand: z.string(),
      model: z.string(),
      modelYear: z.number().optional(),
      licensePlate: z.string().optional(),
      declaredValue: z.number(),
      hasLien: z.boolean(),
      lienInstitution: z.string().optional(),
    })
  ).optional(),
})

export interface CreditSimulationInput {
  creditLineCode?: string
  requestedAmount: number
  amortizationSystem?: 'PRICE' | 'SAC'
  totalTermMonths?: number
  gracePeriodMonths?: number
  interestRateAnnual?: number
  effectiveAgroRevenue?: number
  projectedAgroRevenue?: number
  nonAgroRevenue?: number
  productionCosts?: number
  familyLivingExpenses?: number
  existingDebtService?: number
  landValue?: number
  improvementsValue?: number
  machineryValue?: number
  livestockValue?: number
  urbanProperties?: Array<{
    description?: string
    propertyType?: 'RESIDENCIAL' | 'COMERCIAL' | 'TERRENO_LOTE' | 'GALPAO_INDUSTRIAL' | 'OUTRO'
    marketValue: number
    hasLien?: boolean
    liquidityRating?: 'ALTA' | 'MEDIA' | 'BAIXA'
  }>
  vehicles?: Array<{
    brand?: string
    model?: string
    vehicleType?: 'CAMINHONETE' | 'CAMINHAO' | 'AUTOMOVEL' | 'TRATOR_UTILITARIO' | 'CARRETA' | 'OUTRO'
    declaredValue: number
    hasLien?: boolean
  }>
  customAgroRevenues?: Array<{
    activityType?: string
    realizationType?: string
    description: string
    quantity?: number
    unit?: string
    unitPrice?: number
    productionCostTotal?: number
  }>
  customExpenses?: Array<{
    category: 'CUSTEIO_OPERACIONAL' | 'MANUTENCAO_FAMILIAR' | 'SERVICO_DIVIDA_BANCARIA' | 'OUTRO'
    description: string
    creditorName?: string
    annualAmount: number
    installmentValue?: number
    isContinuingLiability?: boolean
  }>
}

export interface SaveCreditAnalysisInput extends CreditSimulationInput {
  id?: string
  producerId: string
  propertyId?: string
  branchId?: string
  cropYear?: string
  creditLimitPurpose?: string
  creditLimitTargetBank?: string
  notes?: string
  detailedUrbanProperties?: Array<{
    propertyType: 'RESIDENCIAL' | 'COMERCIAL' | 'TERRENO_LOTE' | 'GALPAO_INDUSTRIAL' | 'OUTRO'
    description: string
    city: string
    state: string
    marketValue: number
    hasLien: boolean
    lienInstitution?: string
    liquidityRating?: 'ALTA' | 'MEDIA' | 'BAIXA'
  }>
  detailedVehicles?: Array<{
    vehicleType: 'CAMINHONETE' | 'CAMINHAO' | 'AUTOMOVEL' | 'TRATOR_UTILITARIO' | 'CARRETA' | 'OUTRO'
    brand: string
    model: string
    modelYear?: number
    licensePlate?: string
    declaredValue: number
    hasLien: boolean
    lienInstitution?: string
  }>
}
