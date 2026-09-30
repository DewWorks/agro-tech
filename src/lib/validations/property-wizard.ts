import { z } from 'zod'
import {
  RURAL_ACTIVITIES,
  BB_IMPROVEMENTS_CATALOG,
  IMPROVEMENT_UNITS,
  LIVESTOCK_CATEGORIES,
  LIVESTOCK_BREEDS,
  LIVESTOCK_PURPOSES,
  LIVESTOCK_MARKINGS,
  LIVESTOCK_MARKING_LOCATIONS,
  MACHINERY_CATEGORIES,
  BRAZILIAN_STATES,
  MODULE_FINANCIAL_SUMMARY,
} from './reference-data'

export {
  RURAL_ACTIVITIES,
  BB_IMPROVEMENTS_CATALOG,
  IMPROVEMENT_UNITS,
  LIVESTOCK_CATEGORIES,
  LIVESTOCK_BREEDS,
  LIVESTOCK_PURPOSES,
  LIVESTOCK_MARKINGS,
  LIVESTOCK_MARKING_LOCATIONS,
  MACHINERY_CATEGORIES,
  BRAZILIAN_STATES,
  MODULE_FINANCIAL_SUMMARY,
}

// ============================================================================
// HELPERS & TEXT NORMALIZATION (UX BANCÁRIA)
// ============================================================================

export function normalizeTitleCase(text: string): string {
  if (!text) return ''
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase())
}

// ============================================================================
// STEP 1: IDENTIFICAÇÃO E DADOS FUNDIÁRIOS
// ============================================================================

export const step1LandBaseSchema = z.object({
  // Identificação e Vínculo
  name: z
    .string({ message: 'O nome da fazenda é obrigatório' })
    .min(2, 'O nome da fazenda é obrigatório'),
  branchId: z
    .string({ message: 'Filial obrigatória' })
    .min(1, 'Filial obrigatória'),
  producerId: z
    .string({ message: 'Produtor titular obrigatório' })
    .min(1, 'Produtor titular obrigatório'),
  ownershipType: z
    .string({ message: 'Tipo de vínculo obrigatório' })
    .min(1, 'Tipo de vínculo obrigatório'),
  explorationPercentage: z.coerce.number().min(1, 'Percentual mínimo de 1%').max(100, 'Percentual máximo de 100%').default(100).optional().nullable(),
  propertyStatus: z.string().default('QUITADA').optional().nullable(),

  // Vínculos Contratuais Condicionais (Arrendamento, Parceria, Comodato, Meeiro)
  landlordName: z.string().optional().or(z.literal('')).nullable(),
  landlordDocument: z.string().optional().or(z.literal('')).nullable(),
  contractType: z.string().optional().or(z.literal('')).nullable(),
  contractStartDate: z.string().optional().or(z.literal('')).nullable(),
  contractEndDate: z.string().optional().or(z.literal('')).nullable(),
  exploredAreaHa: z.coerce.number().min(0, 'Área explorada não pode ser negativa').default(0).optional().nullable(),

  // Registros Fundiários
  registrationNumber: z
    .string()
    .regex(/^\d{1,8}$/, 'A matrícula deve conter de 1 a 8 dígitos numéricos')
    .optional()
    .or(z.literal(''))
    .nullable(),
  registryOffice: z.string().optional().or(z.literal('')).nullable(),
  comarca: z.string().optional().or(z.literal('')).nullable(),
  car: z
    .string()
    .regex(
      /^([A-Z]{2}-\d{7}-[A-F0-9]{4}(\.[A-F0-9]{4}){7}|[A-Z]{2}-\d{7}-[A-F0-9]{8,32})$/i,
      'Formato de CAR inválido. Padrão federal: UF-1234567-XXXX.XXXX.XXXX.XXXX.XXXX.XXXX.XXXX.XXXX'
    )
    .optional()
    .or(z.literal(''))
    .nullable(),
  ccir: z
    .string()
    .refine((val) => !val || val.replace(/\D/g, '').length === 13, {
      message: 'O CCIR deve conter exatamente 13 dígitos numéricos',
    })
    .optional()
    .or(z.literal(''))
    .nullable(),
  itr: z
    .string()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true
        if (!/^[A-Za-z0-9.\-\s]+$/.test(val)) return false
        const clean = val.replace(/[^A-Za-z0-9]/g, '')
        return clean.length === 8
      },
      {
        message: 'O CIB/ITR deve conter exatamente 8 caracteres alfanuméricos (ex: XEHVEZ5-T ou 1234567-8)',
      }
    )
    .optional()
    .or(z.literal(''))
    .nullable(),

  // Atividade e Posse
  explorationActivity: z.string().optional().or(z.literal('')).nullable(),
  possessionYears: z.coerce.number().min(0, 'Tempo de posse não pode ser negativo').default(0).optional().nullable(),

  // Áreas (em Hectares)
  totalArea: z.coerce.number({ message: 'Área total deve ser um número' }).min(0, 'Área total não pode ser negativa').default(0),
  consolidatedArea: z.coerce.number().min(0, 'Área consolidada não pode ser negativa').default(0).optional().nullable(),
  productiveArea: z.coerce.number().min(0, 'Área produtiva não pode ser negativa').default(0).optional().nullable(),
  pastureArea: z.coerce.number().min(0, 'Área de pastagem não pode ser negativa').default(0).optional().nullable(),
  preserveArea: z.coerce.number().min(0, 'Área de preservação não pode ser negativa').default(0).optional().nullable(), // APP + Reserva Legal
  ruralModules: z.coerce.number().min(0, 'Módulos fiscais não podem ser negativos').default(0).optional().nullable(),

  // Natureza da Terra & VTN
  vtnPerHectare: z.coerce.number().min(0, 'VTN por hectare não pode ser negativo').default(0).optional().nullable(),
  totalLandValue: z.coerce.number().min(0, 'Valor total da terra não pode ser negativo').default(0).optional().nullable(),

  // Localização & Roteiro
  city: z.string().optional().or(z.literal('')).nullable(),
  state: z.string().optional().or(z.literal('')).nullable(),
  latitude: z.string().optional().or(z.literal('')).nullable(),
  longitude: z.string().optional().or(z.literal('')).nullable(),
  accessRoute: z.string().optional().or(z.literal('')).nullable(),
  confrontantNorth: z.string().optional().or(z.literal('')).nullable(),
  confrontantSouth: z.string().optional().or(z.literal('')).nullable(),
  confrontantEast: z.string().optional().or(z.literal('')).nullable(),
  confrontantWest: z.string().optional().or(z.literal('')).nullable(),

  // Indicadores de Risco Bancário
  impenhorabilidade: z.string().default('PENHORAVEL').optional().nullable(),
  hasLien: z.boolean().default(false).optional().nullable(),
  hasInsurance: z.boolean().default(false).optional().nullable(),
  isBorderProperty: z.boolean().default(false).optional().nullable(),
  conservationState: z.string().default('BOM').optional().nullable(),
})

export const step1LandSchema = step1LandBaseSchema
  .refine(
    (data) => {
      if (!data.totalArea || data.totalArea <= 0) return true
      const sum = (Number(data.productiveArea) || 0) + (Number(data.pastureArea) || 0) + (Number(data.preserveArea) || 0)
      return sum <= Number(data.totalArea)
    },
    {
      message: 'A soma das áreas (produtiva, pastagem e preservação) não pode ultrapassar a área total da propriedade (balanço de áreas fundiárias).',
      path: ['totalArea'],
    }
  )
  .refine(
    (data) => {
      if (data.ownershipType && data.ownershipType !== 'PROPRIETARIO') {
        if (data.exploredAreaHa && data.totalArea && Number(data.exploredAreaHa) > Number(data.totalArea)) {
          return false
        }
      }
      return true
    },
    {
      message: 'A área explorada não pode ser superior à área total da propriedade.',
      path: ['exploredAreaHa'],
    }
  )
  .refine(
    (data) => {
      if (data.ownershipType && data.ownershipType !== 'PROPRIETARIO' && data.contractStartDate && data.contractEndDate) {
        return new Date(data.contractEndDate) > new Date(data.contractStartDate)
      }
      return true
    },
    {
      message: 'A data final do contrato deve ser posterior à data inicial.',
      path: ['contractEndDate'],
    }
  )

export type Step1LandValues = z.infer<typeof step1LandSchema>

// ============================================================================
// STEP 2: MÁQUINAS, EQUIPAMENTOS E IMPLEMENTOS (useFieldArray)
// ============================================================================

export const machineryItemSchema = z.object({
  id: z.string().optional().nullable(),
  category: z.string().optional().nullable().default('Trator de Pneus'),
  brand: z.string().optional().or(z.literal('')).nullable(),
  model: z.string().optional().or(z.literal('')).nullable(),
  year: z.coerce
    .number()
    .int('Ano deve ser um número inteiro')
    .min(1950, 'Ano deve ser a partir de 1950')
    .max(new Date().getFullYear() + 1, 'Ano não pode ser superior ao próximo ano')
    .optional()
    .nullable()
    .default(new Date().getFullYear()),
  powerCapacity: z.string().optional().or(z.literal('')).nullable(),
  chassisSerial: z
    .string()
    .max(30, 'Chassi deve conter até 30 caracteres')
    .optional()
    .or(z.literal(''))
    .nullable(),
  participationPercent: z.coerce.number().min(0).max(100).default(100).optional().nullable(),
  value: z.coerce.number().min(0).default(0).optional().nullable(),
  hasLien: z.boolean().default(false).optional().nullable(),
  lienInstitution: z.string().optional().or(z.literal('')).nullable(),
}).refine(
  (data) => {
    if (data.hasLien && (!data.lienInstitution || !data.lienInstitution.trim())) {
      return false
    }
    return true
  },
  {
    message: 'Informe a instituição credora do gravame/penhor.',
    path: ['lienInstitution'],
  }
)

export const step2MachinerySchema = z.object({
  machineries: z.array(machineryItemSchema).optional().default([]),
})

export type MachineryItemValues = z.infer<typeof machineryItemSchema>
export type Step2MachineryValues = z.infer<typeof step2MachinerySchema>

// ============================================================================
// STEP 3: BENFEITORIAS E REBANHO / SEMOVENTES (useFieldArray)
// ============================================================================

export const improvementItemSchema = z.object({
  id: z.string().optional().nullable(),
  specification: z.string().optional().or(z.literal('')).nullable(),
  unit: z.string().optional().or(z.literal('m²')).nullable(),
  quantity: z.coerce.number().min(0).default(0).optional().nullable(),
  unitValue: z.coerce.number().min(0).default(0).optional().nullable(),
  totalValue: z.coerce.number().min(0).default(0).optional().nullable(),
  conservationState: z.string().default('BOM').optional().nullable(),
  observation: z.string().optional().or(z.literal('')).nullable(),
  isArtificialPasture: z.boolean().optional().default(false).nullable(),
})

export const livestockItemSchema = z.object({
  id: z.string().optional().nullable(),
  species: z.string().optional().or(z.literal('BOVINO')).nullable(),
  category: z.string().optional().or(z.literal('Vaca')).nullable(),
  purpose: z.string().optional().or(z.literal('Criação')).nullable(),
  breed: z.string().optional().or(z.literal('Nelore')).nullable(),
  geneticGrade: z.string().default('Comercial').optional().nullable(),
  quantity: z.coerce
    .number()
    .int('Quantidade de cabeças deve ser um número inteiro')
    .min(0, 'Quantidade não pode ser negativa')
    .default(0)
    .optional()
    .nullable(),
  ageMonths: z.coerce
    .number()
    .int('Idade em meses deve ser um número inteiro')
    .min(0, 'Idade não pode ser negativa')
    .max(360, 'Idade máxima permitida de 360 meses (30 anos)')
    .optional()
    .nullable()
    .default(0),
  avgWeightKg: z.coerce
    .number()
    .min(0, 'Peso não pode ser negativo')
    .max(2500, 'Peso médio máximo permitido de 2.500 kg')
    .optional()
    .nullable()
    .default(0),
  unitValue: z.coerce.number().min(0).default(0).optional().nullable(),
  totalValue: z.coerce.number().min(0).default(0).optional().nullable(),
  markingType: z.string().optional().or(z.literal('')).nullable(),
  markingLocation: z.string().optional().or(z.literal('')).nullable(),
  brandingType: z.string().optional().or(z.literal('')).nullable(),
  brandingLocation: z.string().optional().or(z.literal('')).nullable(),
  categoryBB: z.string().optional().or(z.literal('')).nullable(),
  purposeBB: z.string().optional().or(z.literal('')).nullable(),
})

export const step3ImprovementsAndHerdSchema = z.object({
  improvements: z.array(improvementItemSchema).optional().default([]),
  livestocks: z.array(livestockItemSchema).optional().default([]),
})

export type ImprovementItemValues = z.infer<typeof improvementItemSchema>
export type LivestockItemValues = z.infer<typeof livestockItemSchema>
export type Step3ImprovementsAndHerdValues = z.infer<typeof step3ImprovementsAndHerdSchema>

// ============================================================================
// STEP 4: RESUMO FINANCEIRO, FLUXO DE CAIXA E GARANTIAS (ADITIVO 003)
// ============================================================================

export const urbanPropertyItemSchema = z.object({
  id: z.string().optional().nullable(),
  propertyType: z.enum(['RESIDENCIAL', 'COMERCIAL', 'TERRENO_LOTE', 'GALPAO_INDUSTRIAL', 'OUTRO']).default('RESIDENCIAL'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(2, 'UF é obrigatória'),
  marketValue: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0),
  hasLien: z.boolean().default(false),
  liquidityRating: z.enum(['ALTA', 'MEDIA', 'BAIXA']).default('MEDIA'),
})

export const vehicleItemSchema = z.object({
  id: z.string().optional().nullable(),
  vehicleType: z.enum(['AUTOMOVEL', 'CAMINHONETE', 'CAMINHAO', 'CARRETA', 'MOTO', 'TRATOR_UTILITARIO', 'OUTRO']).default('CAMINHONETE'),
  brand: z.string().min(1, 'Marca é obrigatória'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  modelYear: z.coerce.number().optional().nullable(),
  licensePlate: z.string().optional().nullable(),
  declaredValue: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0),
  hasLien: z.boolean().default(false),
})

export const agroRevenueItemSchema = z.object({
  id: z.string().optional().nullable(),
  activityType: z.enum(['AGRICOLA_GRAOS', 'PECUARIA_CORTE', 'PECUARIA_LEITE', 'HORTIFRUTI', 'SILVICULTURA', 'OUTRA']).default('AGRICOLA_GRAOS'),
  realizationType: z.enum(['EFETIVA_HISTORICA', 'PROJETADA_SAFRA']).default('PROJETADA_SAFRA'),
  description: z.string().min(1, 'Descrição da cultura/lote é obrigatória'),
  quantity: z.coerce.number().min(0).default(0),
  unit: z.string().default('sc'),
  unitPrice: z.coerce.number().min(0).default(0),
  productionCostTotal: z.coerce.number().min(0).default(0),
})

export const expenseItemSchema = z.object({
  id: z.string().optional().nullable(),
  category: z.enum(['CUSTEIO_OPERACIONAL', 'MANUTENCAO_FAMILIAR', 'PASSIVO_EXISTENTE_BANCARIO', 'ENCARGOS_TRIBUTOS', 'TRANSPORTE_FRETE', 'OUTROS']).default('MANUTENCAO_FAMILIAR'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  creditorName: z.string().optional().nullable(),
  annualAmount: z.coerce.number().min(0).default(0),
  isContinuingLiability: z.boolean().default(true),
})

export type UrbanPropertyItemValues = z.infer<typeof urbanPropertyItemSchema>
export type VehicleItemValues = z.infer<typeof vehicleItemSchema>
export type AgroRevenueItemValues = z.infer<typeof agroRevenueItemSchema>
export type ExpenseItemValues = z.infer<typeof expenseItemSchema>

export const step4FinancialSummarySchema = z.object({
  // Totais Derivados (Calculados e exibidos em Cards Dashboard)
  computedLandValue: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0).optional().nullable(),
  computedImprovementsValue: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0).optional().nullable(),
  computedMachineryValue: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0).optional().nullable(),
  computedLivestockValue: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0).optional().nullable(),
  computedTotalAssets: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0).optional().nullable(),

  // Entradas Manuais de Fluxo Financeiro (Totais Globais)
  effectiveAgroRevenue: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0).optional().nullable(),
  projectedAgroRevenue: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0).optional().nullable(),
  otherRevenues: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0).optional().nullable(),
  operationalExpenses: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0).optional().nullable(),
  existingDebtService: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0).optional().nullable(),
  familyLivingCosts: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0).optional().nullable(),

  // Base do Limite de Crédito Rural (MCR / Bancos Agro)
  creditLimitRequested: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0).optional().nullable(),
  creditLimitPurpose: z.string().default('CUSTEIO_AGRICOLA').optional().nullable(),
  creditLimitTargetBank: z.string().default('BANCO_DO_BRASIL').optional().nullable(),
  creditLimitTermMonths: z.coerce.number().min(1, 'Prazo mínimo de 1 mês').default(12).optional().nullable(),
  creditLimitNotes: z.string().optional().or(z.literal('')).nullable(),

  // Novos Campos do Motor Financeiro (Aditivo 003)
  amortizationSystem: z.enum(['PRICE', 'SAC']).default('PRICE').optional().nullable(),
  creditLineCode: z.string().default('PRONAMP_CUSTEIO').optional().nullable(),
  interestRateAnnual: z.coerce.number().min(0).default(8.0).optional().nullable(),
  gracePeriodMonths: z.coerce.number().min(0).default(0).optional().nullable(),

  // Bens Secundários de Garantia
  urbanProperties: z.array(urbanPropertyItemSchema).optional().default([]),
  vehicles: z.array(vehicleItemSchema).optional().default([]),

  // Fluxos Detalhados (Linhas Dinâmicas)
  customAgroRevenues: z.array(agroRevenueItemSchema).optional().default([]),
  customExpenses: z.array(expenseItemSchema).optional().default([]),
})

export type Step4FinancialSummaryValues = z.infer<typeof step4FinancialSummarySchema>

// ============================================================================
// COMPOSITE SCHEMA CONSOLIDADO (WIZARD COMPLETO)
// ============================================================================

export const propertyWizardBaseSchema = z.object({
  ...step1LandBaseSchema.shape,
  ...step2MachinerySchema.shape,
  ...step3ImprovementsAndHerdSchema.shape,
  ...step4FinancialSummarySchema.shape,
})

export type PropertyWizardFormValues = z.infer<typeof propertyWizardBaseSchema>

export const propertyWizardSchema = propertyWizardBaseSchema
  .refine(
    (data) => {
      if (!data.totalArea || data.totalArea <= 0) return true
      const sum = (Number(data.productiveArea) || 0) + (Number(data.pastureArea) || 0) + (Number(data.preserveArea) || 0)
      return sum <= Number(data.totalArea)
    },
    {
      message: 'A soma das áreas (produtiva, pastagem e preservação) não pode ultrapassar a área total da propriedade (balanço de áreas fundiárias).',
      path: ['totalArea'],
    }
  )
  .refine(
    (data) => {
      if (data.ownershipType && data.ownershipType !== 'PROPRIETARIO') {
        if (data.exploredAreaHa && data.totalArea && Number(data.exploredAreaHa) > Number(data.totalArea)) {
          return false
        }
      }
      return true
    },
    {
      message: 'A área explorada não pode ser superior à área total da propriedade.',
      path: ['exploredAreaHa'],
    }
  )
  .refine(
    (data) => {
      if (data.ownershipType && data.ownershipType !== 'PROPRIETARIO' && data.contractStartDate && data.contractEndDate) {
        return new Date(data.contractEndDate) > new Date(data.contractStartDate)
      }
      return true
    },
    {
      message: 'A data final do contrato deve ser posterior à data inicial.',
      path: ['contractEndDate'],
    }
  )
  .refine(
    (data) => {
      if (data.ownershipType && data.ownershipType !== 'PROPRIETARIO') {
        if (!data.landlordName || !data.landlordName.trim()) {
          return false
        }
      }
      return true
    },
    {
      message: 'O nome do cedente / proprietário da terra é obrigatório para contratos de cessão ou arrendamento.',
      path: ['landlordName'],
    }
  )
  .refine(
    (data) => {
      if (data.ownershipType && data.ownershipType !== 'PROPRIETARIO') {
        const doc = (data.landlordDocument || '').replace(/\D/g, '')
        if (!doc || (doc.length !== 11 && doc.length !== 14)) {
          return false
        }
      }
      return true
    },
    {
      message: 'O CPF ou CNPJ do cedente / proprietário da terra é obrigatório e deve ser válido.',
      path: ['landlordDocument'],
    }
  )

// ============================================================================
// MAPA DE CAMPOS PARA VALIDAÇÃO PARCIAL (Partial Triggering por Passo)
// ============================================================================

export const STEP_FIELDS_MAP: Record<number, (keyof PropertyWizardFormValues)[]> = {
  1: [
    'name',
    'branchId',
    'producerId',
    'ownershipType',
    'propertyStatus',
    'landlordName',
    'landlordDocument',
    'contractType',
    'contractStartDate',
    'contractEndDate',
    'exploredAreaHa',
    'explorationPercentage',
    'registrationNumber',
    'registryOffice',
    'comarca',
    'car',
    'ccir',
    'itr',
    'explorationActivity',
    'totalArea',
    'consolidatedArea',
    'productiveArea',
    'pastureArea',
    'preserveArea',
    'ruralModules',
    'vtnPerHectare',
    'totalLandValue',
    'city',
    'state',
    'accessRoute',
    'confrontantNorth',
    'confrontantSouth',
    'confrontantEast',
    'confrontantWest',
    'impenhorabilidade',
    'hasLien',
    'hasInsurance',
    'isBorderProperty',
    'conservationState',
  ],
  2: ['machineries'],
  3: ['improvements', 'livestocks'],
  4: [
    'effectiveAgroRevenue',
    'projectedAgroRevenue',
    'otherRevenues',
    'operationalExpenses',
    'existingDebtService',
    'familyLivingCosts',
    'creditLimitRequested',
    'creditLimitPurpose',
    'creditLimitTargetBank',
    'creditLimitTermMonths',
    'creditLimitNotes',
  ],
  5: [], // Step 5: Dossiê e Submissão Final
}

// ============================================================================
// VALORES DEFAULT DO FORMULÁRIO
// ============================================================================

export const defaultPropertyWizardValues: Partial<PropertyWizardFormValues> = {
  name: '',
  branchId: '',
  producerId: '',
  ownershipType: 'PROPRIETARIO',
  propertyStatus: 'QUITADA',
  landlordName: '',
  landlordDocument: '',
  contractType: '',
  contractStartDate: '',
  contractEndDate: '',
  exploredAreaHa: 0,
  explorationPercentage: 100,
  registrationNumber: '',
  registryOffice: '',
  comarca: '',
  car: '',
  ccir: '',
  itr: '',
  explorationActivity: 'Pecuária de Cria',
  possessionYears: 0,
  totalArea: 0,
  consolidatedArea: 0,
  productiveArea: 0,
  pastureArea: 0,
  preserveArea: 0,
  ruralModules: 0,
  vtnPerHectare: 0,
  totalLandValue: 0,
  city: '',
  state: 'TO',
  latitude: '',
  longitude: '',
  accessRoute: '',
  confrontantNorth: '',
  confrontantSouth: '',
  confrontantEast: '',
  confrontantWest: '',
  impenhorabilidade: 'PENHORAVEL',
  hasLien: false,
  hasInsurance: false,
  isBorderProperty: false,
  conservationState: 'BOM',
  machineries: [],
  improvements: [],
  livestocks: [],
  computedLandValue: 0,
  computedImprovementsValue: 0,
  computedMachineryValue: 0,
  computedLivestockValue: 0,
  computedTotalAssets: 0,
  effectiveAgroRevenue: 0,
  projectedAgroRevenue: 0,
  otherRevenues: 0,
  operationalExpenses: 0,
  existingDebtService: 0,
  familyLivingCosts: 0,
  creditLimitRequested: 0,
  creditLimitPurpose: 'CUSTEIO_AGRICOLA',
  creditLimitTargetBank: 'BANCO_DO_BRASIL',
  creditLimitTermMonths: 12,
  creditLimitNotes: '',
}
