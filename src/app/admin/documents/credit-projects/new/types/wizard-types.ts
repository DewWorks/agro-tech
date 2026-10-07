import { CreditTemplateMeta } from '@/lib/document-templates'

export interface PropertyData {
  id: string
  name: string
  city?: string | null
  state?: string | null
  registrationNumber?: string | null
  registryOffice?: string | null
  car?: string | null
  ccir?: string | null
  itr?: string | null
  totalArea?: number
  productiveArea?: number
  pastureArea?: number
  preserveArea?: number
  explorationActivity?: string | null
  accessRoute?: string | null
  machineries?: Array<{
    id?: string
    type: string
    category?: string
    brand?: string
    model?: string
    year?: number
    chassi?: string
    value?: number
  }>
  improvements?: Array<{
    id?: string
    specification: string
    unit: string
    quantity: number
    unitValue: number
    totalValue: number
  }>
  livestockList?: Array<{
    id?: string
    species?: string
    category?: string
    categoryBB?: string
    purposeBB?: string
    breed?: string
    quantity: number
    ageMonths?: number | null
    avgWeightKg?: number | null
    unitValue?: number | null
    brandingType?: string | null
    brandingLocation?: string | null
    observation?: string | null
  }>
  livestocks?: Array<any>
  livestock?: any
  livestockData?: {
    totalCattle?: number
    brandRegistrationAdapec?: string
    brandDescription?: string
    brandLocation?: string
  }
}

export interface ProducerData {
  id: string
  name: string
  document: string
  type: string
  spouseName?: string | null
  spouseCpf?: string | null
  spouseRg?: string | null
  spouseRgIssuer?: string | null
  spouseNationality?: string | null
  spouseEducationLevel?: string | null
  marriageRegime?: string | null
  representativeCpf?: string | null
  phone?: string | null
  email?: string | null
  civilStatus?: string | null
  street?: string | null
  city?: string | null
  state?: string | null
  branchName?: string | null
  properties: PropertyData[]
  isActive?: boolean
}

export interface CreditProjectWizardProps {
  producers: ProducerData[]
  templates: CreditTemplateMeta[]
  defaultResponsibleName?: string
  defaultOrgName?: string
  defaultOrgCnpj?: string
  initialTemplateCode?: string
  initialProducerId?: string
  initialPropertyId?: string
  initialDemandId?: string
  initialAmount?: number
  linkedDemand?: {
    id: string
    serviceType: string
    producerId: string
    propertyId?: string | null
    producerName?: string
    propertyName?: string | null
  } | null
  initialSavedData?: CustomOptions | null
  backUrl?: string
  pageTitle?: string
  initialCategory?: string
}

export interface CustomOptions {
  responsibleName: string
  creaNumber: string
  artNumber: string
  targetBank: string
  purpose: string

  // Linhas Oficiais de Crédito Rural (15 Linhas)
  creditLineId?: string
  creditLineName?: string
  creditLineShortName?: string
  creditLineAxis?: 'CUSTEIO' | 'INVESTIMENTO' | 'AMBOS'
  operationalAxis?: 'custeio' | 'investimento'

  // Representante Legal (para PJ ou exigência de CPF)
  representativeCpf?: string
  representativeName?: string
  
  // Limite de Crédito BB
  estimatedLandValuePerHa: number
  improvementsValue: number
  machineryValue: number
  annualRevenue: number
  annualExpenses: number
  existingDebts: number

  // InovAgro
  inovagroEquipment: string
  inovagroSpec: string
  inovagroPower: number
  inovagroCapacity: string
  inovagroCnae: string
  inovagroTotalInvestment: number
  inovagroFinanced: number
  inovagroOwnResources: number
  inovagroTermYears: number
  inovagroGraceMonths: number
  inovagroInterestRate: number
  inovagroMonthlySavings: number

  // RenovAgro
  renovagroSubline: string
  renovagroAreaHa: number
  renovagroCostPerHa: number
  renovagroTotalInvestment: number
  renovagroFinanced: number
  renovagroOwnResources: number
  renovagroTermYears: number
  renovagroGraceMonths: number
  renovagroInterestRate: number

  // Custeio Safra & Pecuária Expandido
  custeioSafraYear: string
  custeioCropName: string
  custeioAreaHa: number
  custeioExpectedYield: number
  custeioPricePerUnit: number
  custeioCostPerHa: number
  custeioInterestRate: number
  custeioActivityType?: 'AGRICOLA' | 'PECUARIA'
  custeioPecuariaModality?: 'AQUISICAO_ANIMAIS' | 'CUSTEIO_PRODUCAO'
  custeioQuantity?: number
  custeioUnitPrice?: number
  custeioTotalAmount?: number

  // Dados Fundiários do Imóvel Beneficiado
  propertyRegistrationNumber: string
  propertyRegistryOffice: string
  propertyCar: string
  propertyCcir: string
  propertyItr: string
  propertyTotalArea: number
  propertyAccessRoute: string
  propertyActivity: string

  // Máquinas, Benfeitorias & Semoventes
  machineryItems?: Array<{
    id?: string
    type: string
    brand: string
    model: string
    year: number
    chassi?: string
    value: number
  }>
  improvementItems?: Array<{
    id?: string
    specification: string
    unit: string
    quantity: number
    unitValue: number
    totalValue: number
    conservationState?: string
  }>
  livestockCattleHeads?: number
  livestockCattleHeadValue?: number
  livestockBrandAdapec?: string
  livestockBrandDescription?: string
  
  // Additional dynamic fields
  [key: string]: any
}
