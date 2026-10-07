import {
  AmortizationSystem,
  AmortizationResult,
  IcsdResult,
  LtvResult,
  FinancialEngineResult,
} from '@/lib/financial-engine'

export type CreditLimitStatus =
  | 'COMPATIVEL'
  | 'REVISAR_PRAZO'
  | 'INCOMPATIVEL'
  | 'PENDENTE'

export interface CreditLimitFilter {
  branchId?: string
  search?: string
  purpose?: string
  bank?: string
  status?: string
}

export interface CreditLimitPropertyItem {
  id: string
  name: string
  propertyName: string | null
  city: string | null
  state: string | null
  totalArea: number
  branchId: string
  branchName: string
  producerId?: string | null
  primaryProducerName: string
  primaryProducerDocument: string | null
  landValue: number
  improvementsValue: number
  machineryValue: number
  livestockValue: number
  totalAssets: number
  realEstateCollateral: number
  pledgeCollateral: number
  totalCollateralLimit: number
  effectiveAgroRevenue: number
  projectedAgroRevenue: number
  operationalExpenses: number
  existingDebtService: number
  familyLivingCosts: number
  netMargin: number
  creditLimitRequested: number
  creditLimitPurpose: string
  creditLimitTargetBank: string
  creditLimitTermMonths: number
  estimatedAnnualInstallment: number
  hasFinancialData: boolean
  status: CreditLimitStatus
  updatedAt: Date
}

export interface CreditLimitPortfolioKPIs {
  totalRequestedLimit: number
  totalCollateralAvailable: number
  totalAnalyzedProperties: number
  totalProperties: number
  compatibleCount: number
  reviewCount: number
  averageNetMargin: number
}

export interface CreditLimitPortfolioResult {
  success: boolean
  error?: string
  isFinancialModuleDisabledForOrg: boolean
  kpis: CreditLimitPortfolioKPIs
  properties: CreditLimitPropertyItem[]
  branches: { id: string; name: string }[]
}

export interface CreditSimulationSaveParams {
  requestedAmount: number
  creditLineCode: string
  creditLimitPurpose: string
  creditLimitTargetBank: string
  termMonths: number
  graceMonths: number
  interestRateAnnual: number
  amortizationSystem: 'PRICE' | 'SAC'
  notes?: string
}

export interface PropertySimulationData {
  property: {
    id: string
    name: string
    propertyName: string | null
    city: string | null
    state: string | null
    registrationNumber: string | null
    car: string | null
    ccir: string | null
    itr: string | null
    totalArea: number
    vtnPerHectare: number
    landValue: number
    branchId: string
    branchName: string
  }
  producer: {
    id: string
    name: string
    document: string
    type: string
    spouseName?: string | null
    spouseCpf?: string | null
    marriageRegime?: string | null
    profession?: string | null
    representativeCpf?: string | null
    representativeName?: string | null
    phone?: string | null
  }
  collateral: {
    landValue: number
    improvementsValue: number
    machineryValue: number
    livestockValue: number
    ruralAssetsTotal: number
    urbanTotal: number
    vehiclesTotal: number
    totalAssets: number
    acceptableCollateral: number
    urbanProperties: any[]
    vehicles: any[]
  }
  cashFlow: {
    effectiveAgroRevenue: number
    projectedAgroRevenue: number
    otherRevenues: number
    operationalExpenses: number
    familyLivingCosts: number
    existingDebtService: number
    netMargin: number
    paymentCapacity: number
    customAgroRevenues: any[]
    customExpenses: any[]
  }
  simulationParams: {
    creditLineCode: string
    creditLimitPurpose: string
    creditLimitTargetBank: string
    requestedAmount: number
    termMonths: number
    graceMonths: number
    interestRateAnnual: number
    amortizationSystem: 'PRICE' | 'SAC'
  }
}

export interface PropertySelectOption {
  id: string
  name: string
  propertyName: string | null
  city: string | null
  state: string | null
  totalArea: number
  producerName: string
  producerId: string
}

export interface CreditRiskSimulatorProps {
  initialPropertyId?: string
  initialProducerId?: string
  initialAmount?: number
  initialCreditLine?: string
  initialTargetBank?: string
  initialPropertiesList?: PropertySelectOption[]
  initialSimulationData?: PropertySimulationData | null
  onPropertyChange?: (propertyId: string) => void
}

export interface SimulatorPropertyHeaderProps {
  propertiesList: PropertySelectOption[]
  selectedPropertyId: string
  currentProperty?: PropertySelectOption
  onSelectProperty: (propertyId: string) => void
  onSave: () => void
  isSaving: boolean
  onOpenPreview: () => void
  isLoadingProperty: boolean
  hasSimulationData: boolean
}

export interface SimulatorAssetsAndCashFlowCardsProps {
  simulationData: PropertySimulationData
  selectedPropertyId: string
}

export interface SimulatorParametersFormProps {
  creditLineCode: string
  onSelectCreditLine: (code: string) => void
  purpose: string
  onChangePurpose: (purpose: string) => void
  targetBank: string
  onChangeTargetBank: (bank: string) => void
  requestedAmount: number
  onChangeRequestedAmount: (amount: number) => void
  amortizationSystem: AmortizationSystem
  onChangeAmortizationSystem: (system: AmortizationSystem) => void
  termMonths: number
  onChangeTermMonths: (months: number) => void
  graceMonths: number
  onChangeGraceMonths: (months: number) => void
  interestRate: number
  onChangeInterestRate: (rate: number) => void
}

export interface SimulatorKpiMetricsProps {
  amortization: AmortizationResult
  amortizationSystem: AmortizationSystem
  icsd: IcsdResult
  ltv: LtvResult
}
