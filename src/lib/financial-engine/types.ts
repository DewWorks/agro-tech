// Enums alinhados 1:1 com schema.prisma (Aditivo 003)
export const AmortizationSystem = {
  PRICE: 'PRICE',
  SAC: 'SAC',
} as const
export type AmortizationSystem = (typeof AmortizationSystem)[keyof typeof AmortizationSystem]

export const AnalysisStatus = {
  RASCUNHO: 'RASCUNHO',
  EM_ANALISE: 'EM_ANALISE',
  CALCULADO: 'CALCULADO',
  VALIDADO: 'VALIDADO',
  REPROVADO: 'REPROVADO',
  ARQUIVADO: 'ARQUIVADO',
} as const
export type AnalysisStatus = (typeof AnalysisStatus)[keyof typeof AnalysisStatus]

export const CreditLineAxis = {
  CUSTEIO: 'CUSTEIO',
  INVESTIMENTO: 'INVESTIMENTO',
} as const
export type CreditLineAxis = (typeof CreditLineAxis)[keyof typeof CreditLineAxis]

export const AgroActivityType = {
  AGRICOLA_GRAOS: 'AGRICOLA_GRAOS',
  PECUARIA_CORTE: 'PECUARIA_CORTE',
  PECUARIA_LEITE: 'PECUARIA_LEITE',
  HORTIFRUTI: 'HORTIFRUTI',
  SILVICULTURA: 'SILVICULTURA',
  OUTRA: 'OUTRA',
} as const
export type AgroActivityType = (typeof AgroActivityType)[keyof typeof AgroActivityType]

export const RevenueRealizationType = {
  EFETIVA_HISTORICA: 'EFETIVA_HISTORICA',
  PROJETADA_SAFRA: 'PROJETADA_SAFRA',
} as const
export type RevenueRealizationType = (typeof RevenueRealizationType)[keyof typeof RevenueRealizationType]

export const ExpenseCategory = {
  CUSTEIO_OPERACIONAL: 'CUSTEIO_OPERACIONAL',
  MANUTENCAO_FAMILIAR: 'MANUTENCAO_FAMILIAR',
  PASSIVO_EXISTENTE_BANCARIO: 'PASSIVO_EXISTENTE_BANCARIO',
  ENCARGOS_TRIBUTOS: 'ENCARGOS_TRIBUTOS',
  TRANSPORTE_FRETE: 'TRANSPORTE_FRETE',
  OUTROS: 'OUTROS',
} as const
export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory]

export const UrbanPropertyType = {
  RESIDENCIAL: 'RESIDENCIAL',
  COMERCIAL: 'COMERCIAL',
  TERRENO_LOTE: 'TERRENO_LOTE',
  GALPAO_INDUSTRIAL: 'GALPAO_INDUSTRIAL',
  OUTRO: 'OUTRO',
} as const
export type UrbanPropertyType = (typeof UrbanPropertyType)[keyof typeof UrbanPropertyType]

export const VehicleType = {
  AUTOMOVEL: 'AUTOMOVEL',
  CAMINHONETE: 'CAMINHONETE',
  CAMINHAO: 'CAMINHAO',
  CARRETA: 'CARRETA',
  MOTO: 'MOTO',
  TRATOR_UTILITARIO: 'TRATOR_UTILITARIO',
  OUTRO: 'OUTRO',
} as const
export type VehicleType = (typeof VehicleType)[keyof typeof VehicleType]

export const LiquidityRating = {
  ALTA: 'ALTA',
  MEDIA: 'MEDIA',
  BAIXA: 'BAIXA',
} as const
export type LiquidityRating = (typeof LiquidityRating)[keyof typeof LiquidityRating]

export interface InstallmentScheduleItem {
  period: number // Ano ou Mês (1, 2, 3...)
  label: string // Ex: "Ano 1", "Mês 12"
  isGracePeriod: boolean
  openingBalance: number
  amortization: number
  interest: number
  totalPayment: number
  closingBalance: number
}

export interface AmortizationResult {
  system: AmortizationSystem
  principal: number
  annualInterestRate: number // Ex: 10.5 para 10.5%
  termMonths: number
  graceMonths: number
  annualDebtService: number // Parcela de referência para o ICSD (estresse do Ano 1 pós-carência)
  schedule: InstallmentScheduleItem[]
  totalInterestPaid: number
  totalAmountPaid: number
}

export interface AgroRevenueInput {
  description: string
  activityType: AgroActivityType
  realizationType: RevenueRealizationType
  areaHa?: number | null
  quantity: number
  unit: string
  unitPrice: number
  productionCostTotal?: number
}

export interface NonAgroRevenueInput {
  description: string
  annualAmount: number
  monthlyAmount?: number
  proofDocumentNotes?: string | null
}

export interface ExpenseInput {
  category: ExpenseCategory
  description: string
  annualAmount: number
  installmentValue?: number | null
  isContinuingLiability?: boolean
}

export interface RuralCollateralInput {
  landValue: number
  improvementsValue: number
  machineryValue: number
  livestockValue: number
}

export interface UrbanPropertyCollateralInput {
  description: string
  propertyType: UrbanPropertyType
  marketValue: number
  hasLien?: boolean
  liquidityRating?: LiquidityRating
}

export interface VehicleCollateralInput {
  brand: string
  model: string
  vehicleType: VehicleType
  declaredValue: number
  hasLien?: boolean
}

export type IcsdClassification =
  | 'APROVADO_CONFORTAVEL' // ICSD >= 1.30
  | 'APROVADO_ALERTA'      // 1.20 <= ICSD < 1.30
  | 'REPROVADO'            // ICSD < 1.20 ou CP <= 0

export interface IcsdResult {
  grossAgroRevenue: number
  totalProductionCosts: number
  netAgroRevenue: number
  nonAgroRevenueTotal: number
  totalGrossInflows: number
  totalNetInflows: number
  totalExpenses: number
  paymentCapacity: number // CP
  annualDebtService: number
  icsdValue: number
  icsdThreshold: number
  classification: IcsdClassification
  isApproved: boolean
  opinionText: string
}

export interface LtvResult {
  ruralLandAndImprovements: number
  ruralPenhor: number
  ruralTotal: number
  ruralAcceptable: number

  urbanTotal: number
  urbanAcceptable: number

  vehiclesTotal: number
  vehiclesAcceptable: number

  totalDeclaredCollateral: number
  totalAcceptableCollateral: number

  requestedAmount: number
  ltvRatioDeclared: number    // requested / totalDeclared
  ltvRatioAcceptable: number  // requested / totalAcceptable
  isApproved: boolean
  coverageRatioPercent: number // (totalAcceptable / requested) * 100
  opinionText: string
}

export interface FinancialEngineInput {
  requestedAmount: number
  termMonths: number
  graceMonths?: number
  annualInterestRate: number
  amortizationSystem: AmortizationSystem
  creditLineAxis: CreditLineAxis
  creditLineCode: string
  creditLineName: string
  agroRevenues: AgroRevenueInput[]
  nonAgroRevenues?: NonAgroRevenueInput[]
  expenses: ExpenseInput[]
  ruralCollateral: RuralCollateralInput
  urbanProperties?: UrbanPropertyCollateralInput[]
  vehicles?: VehicleCollateralInput[]
}

export interface FinancialEngineResult {
  amortization: AmortizationResult
  icsd: IcsdResult
  ltv: LtvResult
  overallStatus: 'APROVADO' | 'APROVADO_COM_RESTRICOES' | 'REPROVADO'
  summaryOpinion: string
  regulatoryNotes: string[]
  calculatedAt: string
}
