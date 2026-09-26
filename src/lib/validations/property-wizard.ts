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
  name: z.string().min(2, 'O nome da fazenda é obrigatório'),
  branchId: z.string().min(1, 'Filial obrigatória'),
  producerId: z.string().min(1, 'Produtor titular obrigatório'),
  ownershipType: z.string().min(1, 'Tipo de vínculo obrigatório'),
  explorationPercentage: z.coerce.number().min(1).max(100).default(100),
  propertyStatus: z.string().default('QUITADA'),

  // Vínculos Contratuais Condicionais (Arrendamento, Parceria, Comodato, Meeiro)
  landlordName: z.string().optional().or(z.literal('')),
  landlordDocument: z.string().optional().or(z.literal('')),
  contractType: z.string().optional().or(z.literal('')),
  contractStartDate: z.string().optional().or(z.literal('')),
  contractEndDate: z.string().optional().or(z.literal('')),
  exploredAreaHa: z.coerce.number().min(0).default(0),

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
      /^([A-Z]{2}-\d{7}-[A-Z0-9]{4}(\.[A-Z0-9]{4}){6}|[A-Z]{2}-\d{7}-[A-Z0-9]{8,32})$/i,
      'Formato do CAR inválido. Padrão federal: UF-1234567-XXXX.XXXX.XXXX.XXXX.XXXX.XXXX.XXXX'
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
    .refine((val) => !val || val.replace(/\D/g, '').length === 8, {
      message: 'O ITR/NIRF deve conter exatamente 8 dígitos numéricos',
    })
    .optional()
    .or(z.literal(''))
    .nullable(),

  // Atividade e Posse
  explorationActivity: z.string().optional().or(z.literal('')),
  possessionYears: z.coerce.number().min(0).default(0),

  // Áreas (em Hectares)
  totalArea: z.coerce.number().min(0).default(0),
  consolidatedArea: z.coerce.number().min(0).default(0),
  productiveArea: z.coerce.number().min(0).default(0),
  pastureArea: z.coerce.number().min(0).default(0),
  preserveArea: z.coerce.number().min(0).default(0), // APP + Reserva Legal
  ruralModules: z.coerce.number().min(0).default(0),

  // Natureza da Terra & VTN
  vtnPerHectare: z.coerce.number().min(0).default(0),
  totalLandValue: z.coerce.number().min(0).default(0),

  // Localização & Roteiro
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  accessRoute: z.string().optional().or(z.literal('')),
  confrontantNorth: z.string().optional(),
  confrontantSouth: z.string().optional(),
  confrontantEast: z.string().optional(),
  confrontantWest: z.string().optional(),

  // Indicadores de Risco Bancário
  impenhorabilidade: z.string().default('PENHORAVEL'),
  hasLien: z.boolean().default(false),
  hasInsurance: z.boolean().default(false),
  isBorderProperty: z.boolean().default(false),
  conservationState: z.string().default('BOM'),
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
  id: z.string().optional(),
  category: z.string().optional().default('Trator de Pneus'),
  brand: z.string().optional().or(z.literal('')),
  model: z.string().optional().or(z.literal('')),
  year: z.coerce
    .number()
    .int('Ano deve ser um número inteiro')
    .min(1950, 'Ano deve ser a partir de 1950')
    .max(new Date().getFullYear() + 1, 'Ano não pode ser superior ao próximo ano')
    .optional()
    .nullable()
    .default(new Date().getFullYear()),
  powerCapacity: z.string().optional().or(z.literal('')),
  chassisSerial: z
    .string()
    .max(30, 'Chassi deve conter até 30 caracteres')
    .optional()
    .or(z.literal(''))
    .nullable(),
  participationPercent: z.coerce.number().min(0).max(100).default(100),
  value: z.coerce.number().min(0).default(0),
  hasLien: z.boolean().default(false),
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
  machineries: z.array(machineryItemSchema).default([]),
})

export type MachineryItemValues = z.infer<typeof machineryItemSchema>
export type Step2MachineryValues = z.infer<typeof step2MachinerySchema>

// ============================================================================
// STEP 3: BENFEITORIAS E REBANHO / SEMOVENTES (useFieldArray)
// ============================================================================

export const improvementItemSchema = z.object({
  id: z.string().optional(),
  specification: z.string().optional().or(z.literal('')),
  unit: z.string().optional().or(z.literal('m²')),
  quantity: z.coerce.number().min(0).default(0),
  unitValue: z.coerce.number().min(0).default(0),
  totalValue: z.coerce.number().min(0).default(0),
  conservationState: z.string().default('BOM'),
  observation: z.string().optional().or(z.literal('')),
  isArtificialPasture: z.boolean().optional().default(false),
})

export const livestockItemSchema = z.object({
  id: z.string().optional(),
  species: z.string().optional().or(z.literal('BOVINO')),
  category: z.string().optional().or(z.literal('Vaca')),
  purpose: z.string().optional().or(z.literal('Criação')),
  breed: z.string().optional().or(z.literal('Nelore')),
  geneticGrade: z.string().default('Comercial'),
  quantity: z.coerce
    .number()
    .int('Quantidade de cabeças deve ser um número inteiro')
    .min(0, 'Quantidade não pode ser negativa')
    .default(0),
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
  unitValue: z.coerce.number().min(0).default(0),
  totalValue: z.coerce.number().min(0).default(0),
  markingType: z.string().optional().or(z.literal('')),
  markingLocation: z.string().optional().or(z.literal('')),
  brandingType: z.string().optional().or(z.literal('')),
  brandingLocation: z.string().optional().or(z.literal('')),
  categoryBB: z.string().optional().or(z.literal('')),
  purposeBB: z.string().optional().or(z.literal('')),
})

export const step3ImprovementsAndHerdSchema = z.object({
  improvements: z.array(improvementItemSchema).default([]),
  livestocks: z.array(livestockItemSchema).default([]),
})

export type ImprovementItemValues = z.infer<typeof improvementItemSchema>
export type LivestockItemValues = z.infer<typeof livestockItemSchema>
export type Step3ImprovementsAndHerdValues = z.infer<typeof step3ImprovementsAndHerdSchema>

// ============================================================================
// STEP 4: RESUMO FINANCEIRO E CAPACIDADE DE PAGAMENTO
// ============================================================================

export const step4FinancialSummarySchema = z.object({
  // Totais Derivados (Calculados e exibidos em Cards Dashboard)
  computedLandValue: z.coerce.number().min(0).default(0).optional(),
  computedImprovementsValue: z.coerce.number().min(0).default(0).optional(),
  computedMachineryValue: z.coerce.number().min(0).default(0).optional(),
  computedLivestockValue: z.coerce.number().min(0).default(0).optional(),
  computedTotalAssets: z.coerce.number().min(0).default(0).optional(),

  // Entradas Manuais de Fluxo Financeiro
  effectiveAgroRevenue: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0).optional(),
  projectedAgroRevenue: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0).optional(),
  otherRevenues: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0).optional(),
  operationalExpenses: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0).optional(),
  existingDebtService: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0).optional(),
  familyLivingCosts: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0).optional(),

  // Base do Limite de Crédito Rural (MCR / Bancos Agro)
  creditLimitRequested: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0).optional(),
  creditLimitPurpose: z.string().default('CUSTEIO_AGRICOLA').optional(),
  creditLimitTargetBank: z.string().default('BANCO_DO_BRASIL').optional(),
  creditLimitTermMonths: z.coerce.number().min(1, 'Prazo mínimo de 1 mês').default(12).optional(),
  creditLimitNotes: z.string().optional(),
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
