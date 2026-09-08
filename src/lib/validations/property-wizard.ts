import { z } from 'zod'
import {
  RURAL_ACTIVITIES,
  BB_IMPROVEMENTS_CATALOG,
  LIVESTOCK_CATEGORIES,
  LIVESTOCK_BREEDS,
  LIVESTOCK_PURPOSES,
  MACHINERY_CATEGORIES,
} from './reference-data'

export {
  RURAL_ACTIVITIES,
  BB_IMPROVEMENTS_CATALOG,
  LIVESTOCK_CATEGORIES,
  LIVESTOCK_BREEDS,
  LIVESTOCK_PURPOSES,
  MACHINERY_CATEGORIES,
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

export const step1LandSchema = z.object({
  // Identificação e Vínculo
  name: z.string().min(2, 'O nome da fazenda é obrigatório'),
  branchId: z.string().min(1, 'Filial obrigatória'),
  producerId: z.string().min(1, 'Produtor titular obrigatório'),
  ownershipType: z.string().min(1, 'Tipo de vínculo obrigatório'),
  explorationPercentage: z.coerce.number().min(1).max(100).default(100),
  contractEndDate: z.string().optional(),

  // Registros com Máscaras Estritas
  registrationNumber: z
    .string()
    .min(1, 'A matrícula é obrigatória')
    .regex(/^\d+$/, 'Apenas números são permitidos na matrícula'),
  registryOffice: z.string().min(3, 'Informe o Cartório de Registro de Imóveis (CRI)'),
  comarca: z.string().min(2, 'Informe a comarca do cartório'),
  car: z
    .string()
    .regex(
      /^[A-Z]{2}-\d{7}-[A-Z0-9]{4}\.[A-Z0-9]{4}\.[A-Z0-9]{4}\.[A-Z0-9]{4}\.[A-Z0-9]{4}\.[A-Z0-9]{4}\.[A-Z0-9]{4}$/,
      'Formato CAR inválido. Ex: TO-1700000-ABCD.1234.EF56.7890.1234.5678.90AB'
    ),
  ccir: z
    .string()
    .min(1, 'CCIR é obrigatório')
    .regex(/^\d{13}$/, 'CCIR deve conter exatamente 13 dígitos numéricos'),
  itr: z
    .string()
    .min(1, 'ITR/NIRF é obrigatório')
    .regex(/^\d{8}$/, 'ITR/NIRF deve conter exatamente 8 dígitos numéricos'),

  // Atividade e Posse
  explorationActivity: z.string().min(1, 'Selecione ou adicione a atividade principal'),
  possessionYears: z.coerce.number().min(0).default(0),

  // Áreas (em Hectares)
  totalArea: z.coerce.number().positive('A área total deve ser maior que zero'),
  consolidatedArea: z.coerce.number().min(0).default(0),
  productiveArea: z.coerce.number().min(0).default(0),
  pastureArea: z.coerce.number().min(0).default(0),
  preserveArea: z.coerce.number().min(0).default(0), // APP + Reserva Legal
  ruralModules: z.coerce.number().min(0).default(0),

  // Natureza da Terra & VTN
  vtnPerHectare: z.coerce.number().min(0, 'VTN não pode ser negativo').default(0),
  totalLandValue: z.coerce.number().min(0).default(0),

  // Localização & Roteiro
  city: z.string().min(2, 'Informe o município'),
  state: z.string().length(2, 'Informe a UF (2 letras)').toUpperCase(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  accessRoute: z
    .string()
    .min(10, 'Roteiro de acesso deve conter no mínimo 10 caracteres para vistoria'),
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

export type Step1LandValues = z.infer<typeof step1LandSchema>

// ============================================================================
// STEP 2: MÁQUINAS, EQUIPAMENTOS E IMPLEMENTOS (useFieldArray)
// ============================================================================

export const machineryItemSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1, 'Categoria obrigatória'),
  brand: z.string().min(1, 'Marca obrigatória'),
  model: z.string().min(1, 'Modelo obrigatório'),
  year: z.coerce
    .number()
    .min(1950, 'Ano inválido')
    .max(new Date().getFullYear() + 1, 'Ano futuro inválido'),
  powerCapacity: z.string().optional(),
  chassisSerial: z.string().min(3, 'Chassi/Série obrigatório para vistoria bancária'),
  participationPercent: z.coerce.number().min(1).max(100).default(100),
  value: z.coerce.number().positive('O valor deve ser maior que zero'),
  hasLien: z.boolean().default(false),
  lienInstitution: z.string().optional(),
})

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
  specification: z.string().min(1, 'Benfeitoria obrigatória'),
  unit: z.string().min(1, 'Unidade obrigatória'),
  quantity: z.coerce.number().positive('Quantidade deve ser maior que zero'),
  unitValue: z.coerce.number().positive('Valor unitário deve ser maior que zero'),
  totalValue: z.coerce.number().min(0).default(0),
  conservationState: z.string().default('BOM'),
  observation: z.string().optional(),
})

export const livestockItemSchema = z.object({
  id: z.string().optional(),
  species: z.string().min(1, 'Espécie obrigatória'),
  category: z.string().min(1, 'Categoria zootécnica obrigatória'),
  purpose: z.string().min(1, 'Finalidade obrigatória'),
  breed: z.string().min(1, 'Raça obrigatória'),
  geneticGrade: z.string().default('Comercial'),
  quantity: z.coerce.number().int().positive('Quantidade deve ser maior que zero'),
  ageMonths: z.coerce.number().min(0).default(0),
  avgWeightKg: z.coerce.number().min(0).default(0),
  unitValue: z.coerce.number().positive('Valor unitário deve ser maior que zero'),
  totalValue: z.coerce.number().min(0).default(0),
  markingType: z.string().optional(),
  markingLocation: z.string().optional(),
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
  computedLandValue: z.coerce.number().min(0).default(0),
  computedImprovementsValue: z.coerce.number().min(0).default(0),
  computedMachineryValue: z.coerce.number().min(0).default(0),
  computedLivestockValue: z.coerce.number().min(0).default(0),
  computedTotalAssets: z.coerce.number().min(0).default(0),

  // Entradas Manuais de Fluxo Financeiro
  effectiveAgroRevenue: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0),
  projectedAgroRevenue: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0),
  otherRevenues: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0),
  operationalExpenses: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0),
  existingDebtService: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0),
  familyLivingCosts: z.coerce.number().min(0, 'Valor não pode ser negativo').default(0),
})

export type Step4FinancialSummaryValues = z.infer<typeof step4FinancialSummarySchema>

// ============================================================================
// COMPOSITE SCHEMA CONSOLIDADO (WIZARD COMPLETO)
// ============================================================================

export const propertyWizardSchema = z.object({
  ...step1LandSchema.shape,
  ...step2MachinerySchema.shape,
  ...step3ImprovementsAndHerdSchema.shape,
  ...step4FinancialSummarySchema.shape,
})

export type PropertyWizardFormValues = z.infer<typeof propertyWizardSchema>

// ============================================================================
// MAPA DE CAMPOS PARA VALIDAÇÃO PARCIAL (Partial Triggering por Passo)
// ============================================================================

export const STEP_FIELDS_MAP: Record<number, (keyof PropertyWizardFormValues)[]> = {
  1: [
    'name',
    'branchId',
    'producerId',
    'ownershipType',
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
  explorationPercentage: 100,
  contractEndDate: '',
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
}
