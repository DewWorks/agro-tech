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
}

export interface ProducerData {
  id: string
  name: string
  document: string
  type: string
  spouseName?: string | null
  spouseCpf?: string | null
  phone?: string | null
  email?: string | null
  civilStatus?: string | null
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
}

export interface CustomOptions {
  responsibleName: string
  creaNumber: string
  artNumber: string
  targetBank: string
  purpose: string
  
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

  // Custeio Safra
  custeioSafraYear: string
  custeioCropName: string
  custeioAreaHa: number
  custeioExpectedYield: number
  custeioPricePerUnit: number
  custeioCostPerHa: number
  custeioInterestRate: number

  // Dados Fundiários do Imóvel Beneficiado
  propertyRegistrationNumber: string
  propertyRegistryOffice: string
  propertyCar: string
  propertyCcir: string
  propertyItr: string
  propertyTotalArea: number
  propertyAccessRoute: string
  propertyActivity: string
  
  // Additional dynamic fields
  [key: string]: any
}
