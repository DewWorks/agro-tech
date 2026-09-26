import { z } from 'zod'
import { validateCPF, validateCNPJ } from '@/lib/utils/masks'

export const CIVIL_STATUS_ENUM = [
  'SOLTEIRO',
  'CASADO',
  'SEPARADO',
  'DIVORCIADO',
  'VIUVO',
  'UNIAO_ESTAVEL',
] as const

export const MARRIAGE_REGIME_ENUM = [
  'COMUNHAO_PARCIAL',
  'COMUNHAO_UNIVERSAL',
  'SEPARACAO_TOTAL',
  'SEPARACAO_OBRIGATORIA',
  'PARTICIPACAO_FINAL',
] as const

export const PRODUCER_SIZE_ENUM = ['MINI', 'PEQUENO', 'MEDIO', 'GRANDE'] as const

/**
 * Validação de Maioridade Legal (>= 18 anos)
 */
function isAdult(date: Date | string): boolean {
  const birth = new Date(date)
  if (isNaN(birth.getTime())) return false
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age >= 18
}

/**
 * Validação de Data Não Futura
 */
function isNotFuture(date: Date | string): boolean {
  const d = new Date(date)
  if (isNaN(d.getTime())) return false
  return d <= new Date()
}

export const producerBaseSchema = z.object({
  id: z.string().optional(),
  branchId: z.string().min(1, 'A filial de vínculo é obrigatória.'),
  type: z.enum(['PF', 'PJ']).default('PF'),

  // Documento do Titular
  document: z.string().min(1, 'O documento (CPF ou CNPJ) é obrigatório.'),

  // Nome Completo / Razão Social
  name: z
    .string()
    .min(3, 'O nome deve ter no mínimo 3 caracteres.')
    .regex(/\S+\s+\S+/, 'Informe o nome e o sobrenome completos.')
    .trim(),

  // Contato
  email: z
    .string()
    .email('E-mail em formato inválido.')
    .toLowerCase()
    .trim()
    .optional()
    .or(z.literal(''))
    .nullable(),

  phone: z
    .string()
    .regex(
      /^(\(\d{2}\)\s\d{4,5}-\d{4}|\d{10,11})$/,
      'Telefone inválido. Utilize o formato (00) 00000-0000 ou 10/11 dígitos.'
    )
    .optional()
    .or(z.literal(''))
    .nullable(),

  // Dados Civis & Nascimento
  birthDate: z
    .union([z.string(), z.date()])
    .optional()
    .or(z.literal(''))
    .nullable(),

  civilStatus: z.enum(CIVIL_STATUS_ENUM).default('SOLTEIRO').optional().nullable(),
  marriageRegime: z.enum(MARRIAGE_REGIME_ENUM).optional().or(z.literal('')).nullable(),

  // Documentos Pessoais Titular
  rg: z
    .string()
    .regex(/^[a-zA-Z0-9.\-/]{3,14}$/, 'RG deve conter entre 3 e 14 caracteres alfanuméricos.')
    .optional()
    .or(z.literal(''))
    .nullable(),

  rgIssuer: z
    .string()
    .regex(/^[A-Z0-9]{2,8}\/[A-Z]{2}$/, 'Órgão emissor deve seguir o padrão ÓRGÃO/UF (ex: SSP/TO).')
    .optional()
    .or(z.literal(''))
    .nullable(),

  profession: z.string().optional().or(z.literal('')).nullable(),
  nationality: z.string().default('Brasileira').optional().nullable(),

  // Representante Legal (PJ)
  representativeCpf: z.string().optional().or(z.literal('')).nullable(),

  // Cônjuge (Condicional por Estado Civil)
  spouseName: z.string().optional().or(z.literal('')).nullable(),
  spouseCpf: z.string().optional().or(z.literal('')).nullable(),
  spouseRg: z
    .string()
    .regex(/^[a-zA-Z0-9.\-/]{3,14}$/, 'RG do cônjuge deve conter entre 3 e 14 caracteres alfanuméricos.')
    .optional()
    .or(z.literal(''))
    .nullable(),
  spouseRgIssuer: z
    .string()
    .regex(/^[A-Z0-9]{2,8}\/[A-Z]{2}$/, 'Órgão emissor do cônjuge deve seguir o formato ÓRGÃO/UF (ex: SSP/TO).')
    .optional()
    .or(z.literal('')).nullable(),
  spouseNationality: z.string().default('Brasileira').optional().nullable(),
  spouseEducationLevel: z.string().optional().or(z.literal('')).nullable(),

  // Dados Bancários
  bankName: z.string().optional().or(z.literal('')).nullable(),
  bankAgency: z
    .string()
    .regex(/^\d{1,5}(-[\dX])?$/, 'Agência inválida (ex: 1234-5).')
    .optional()
    .or(z.literal(''))
    .nullable(),
  bankAccount: z
    .string()
    .regex(/^\d{1,12}(-[\dX])?$/, 'Conta corrente inválida (ex: 12345-6).')
    .optional()
    .or(z.literal(''))
    .nullable(),
  bankAccountType: z.enum(['CORRENTE', 'POUPANCA']).default('CORRENTE').optional().nullable(),

  // Qualificação
  educationLevel: z.string().optional().or(z.literal('')).nullable(),
  naturalness: z.string().optional().or(z.literal('')).nullable(),
  producerSize: z.enum(PRODUCER_SIZE_ENUM).optional().nullable(),
  dapCafNumber: z.string().optional().or(z.literal('')).nullable(),

  // Propriedade Vinculada Opcional no Cadastro
  propertyName: z.string().optional().or(z.literal('')).nullable(),
  propertyCity: z.string().optional().or(z.literal('')).nullable(),
  propertyState: z.string().optional().or(z.literal('')).nullable(),
  pastureArea: z.union([z.string(), z.number()]).optional().nullable(),
  totalHeadCount: z.union([z.string(), z.number()]).optional().nullable(),
  registrationNumber: z.string().optional().or(z.literal('')).nullable(),
  registryOffice: z.string().optional().or(z.literal('')).nullable(),
  car: z.string().optional().or(z.literal('')).nullable(),
  possessionYears: z.union([z.string(), z.number()]).optional().nullable(),
  explorationActivity: z.string().optional().or(z.literal('')).nullable(),
  brandDescription: z.string().optional().or(z.literal('')).nullable(),
  brandRegistrationAdapec: z.string().optional().or(z.literal('')).nullable(),
  brandLocation: z.string().optional().or(z.literal('')).nullable(),
})

export const producerSchema = producerBaseSchema.superRefine((data, ctx) => {
  // 1. Validação estrita de CPF/CNPJ via Módulo 11 (bloqueio de dígitos repetidos)
  const cleanDoc = (data.document || '').replace(/\D/g, '')
  if (data.type === 'PF') {
    if (!validateCPF(cleanDoc)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['document'],
        message: 'CPF matematicamente inválido (Módulo 11). Verifique os dígitos informados.',
      })
    }
  } else if (data.type === 'PJ') {
    if (!validateCNPJ(cleanDoc)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['document'],
        message: 'CNPJ matematicamente inválido (Módulo 11). Verifique os dígitos informados.',
      })
    }
  }

  // 2. Validação de Representante Legal em PJ
  if (data.type === 'PJ') {
    const cleanRepDoc = (data.representativeCpf || '').replace(/\D/g, '')
    if (!cleanRepDoc) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['representativeCpf'],
        message: 'O CPF do representante legal é obrigatório para pessoa jurídica.',
      })
    } else if (!validateCPF(cleanRepDoc)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['representativeCpf'],
        message: 'CPF do representante legal matematicamente inválido.',
      })
    }
  }

  // 3. Validação de Data de Nascimento e Maioridade Legal
  if (data.birthDate) {
    if (!isNotFuture(data.birthDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['birthDate'],
        message: 'A data de nascimento não pode ser futura.',
      })
    } else if (data.type === 'PF' && !isAdult(data.birthDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['birthDate'],
        message: 'O produtor rural titular deve ter no mínimo 18 anos de idade.',
      })
    }
  }

  // 4. Validação Condicional do Cônjuge (Casado ou União Estável)
  const isMarriedOrStable =
    data.type === 'PF' && (data.civilStatus === 'CASADO' || data.civilStatus === 'UNIAO_ESTAVEL')

  if (isMarriedOrStable) {
    // Regime de bens
    if (!data.marriageRegime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['marriageRegime'],
        message: 'O regime de casamento é estritamente obrigatório para produtor casado ou em união estável.',
      })
    }

    // Nome do cônjuge (nome e sobrenome)
    const cleanSpouseName = (data.spouseName || '').trim()
    if (!cleanSpouseName || cleanSpouseName.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['spouseName'],
        message: 'O nome do cônjuge é obrigatório (mínimo 3 caracteres).',
      })
    } else if (!/\S+\s+\S+/.test(cleanSpouseName)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['spouseName'],
        message: 'Informe o nome e o sobrenome completos do cônjuge.',
      })
    }

    // CPF do cônjuge
    const cleanSpouseCpf = (data.spouseCpf || '').replace(/\D/g, '')
    if (!cleanSpouseCpf) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['spouseCpf'],
        message: 'O CPF do cônjuge é obrigatório para comprovação de outorga uxória.',
      })
    } else if (!validateCPF(cleanSpouseCpf)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['spouseCpf'],
        message: 'CPF do cônjuge matematicamente inválido.',
      })
    } else if (cleanSpouseCpf === cleanDoc) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['spouseCpf'],
        message: 'O CPF do cônjuge não pode ser igual ao CPF do titular.',
      })
    }

    // RG do cônjuge (obrigatório se casado)
    const cleanSpouseRg = (data.spouseRg || '').trim()
    if (!cleanSpouseRg) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['spouseRg'],
        message: 'O RG do cônjuge é obrigatório para minutas legais e cartorárias.',
      })
    } else if (cleanSpouseRg.length > 14) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['spouseRg'],
        message: 'O RG do cônjuge deve ter no máximo 14 caracteres.',
      })
    }
  }
})

export const producerUpdateSchema = producerBaseSchema.partial().superRefine((data, ctx) => {
  // Document validation if provided
  if (data.document && data.type) {
    const cleanDoc = data.document.replace(/\D/g, '')
    if (data.type === 'PF' && !validateCPF(cleanDoc)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['document'],
        message: 'CPF do produtor é inválido.',
      })
    }
    if (data.type === 'PJ' && !validateCNPJ(cleanDoc)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['document'],
        message: 'CNPJ do produtor é inválido.',
      })
    }
  }

  // Spouse validation if married
  const isMarried =
    data.type === 'PF' && (data.civilStatus === 'CASADO' || data.civilStatus === 'UNIAO_ESTAVEL')
  if (isMarried) {
    if (!data.marriageRegime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['marriageRegime'],
        message: 'O regime de casamento é obrigatório.',
      })
    }
    if (!data.spouseName || !data.spouseName.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['spouseName'],
        message: 'O nome do cônjuge é obrigatório.',
      })
    }
    if (data.spouseCpf) {
      const cleanSpouse = data.spouseCpf.replace(/\D/g, '')
      if (cleanSpouse && !validateCPF(cleanSpouse)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['spouseCpf'],
          message: 'CPF do cônjuge é inválido.',
        })
      }
    }
  }
})

export type ProducerFormValues = z.infer<typeof producerSchema>
export type ProducerUpdateValues = z.infer<typeof producerUpdateSchema>
