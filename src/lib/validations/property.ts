import { z } from 'zod'

export const propertySchema = z.object({
  name: z.string().min(1, "Obrigatório"),
  branchId: z.string().min(1, "Obrigatório"),
  city: z.string().optional(),
  state: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),

  // Vinculo
  producerId: z.string().min(1, "Produtor titular é obrigatório"),
  ownershipType: z.string().min(1, "Obrigatório"),
  explorationPercentage: z.coerce.number().min(0).max(100).optional(),
  contractEndDate: z.string().optional(),

  // Dados Fundiários (Novas Regras)
  totalArea: z.coerce.number().positive("Deve ser maior que 0"),
  productiveArea: z.coerce.number().optional(),
  pastureArea: z.coerce.number().optional(),
  preserveArea: z.coerce.number().optional(),

  registrationNumber: z.string()
    .min(1, "Obrigatório")
    .regex(/^\d+$/, "Apenas números são permitidos"),
  registryOffice: z.string().min(3, "Informe o cartório"),
  car: z
    .preprocess(
      (val) => (typeof val === 'string' ? val.trim().replace(/\s+/g, '').toUpperCase() : val),
      z
        .string()
        .regex(
          /^([A-Z]{2}-\d{7}-[A-Z0-9]{4}(\.[A-Z0-9]{4}){7}|[A-Z]{2}-\d{7}-[A-Z0-9]{8,32})$/i,
          'Formato de CAR inválido. Padrão federal: UF-1234567-XXXX.XXXX.XXXX.XXXX.XXXX.XXXX.XXXX.XXXX'
        )
        .optional()
        .or(z.literal(''))
        .nullable()
    ),
  ccir: z.string().optional(),
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
  accessRoute: z.string().min(10, "Descreva o roteiro com no mínimo 10 caracteres"),

  // Posse e Atividade
  explorationActivity: z.string().min(1, "Selecione ou adicione uma atividade"),
  possessionYears: z.coerce.number().optional(),

  // Rebanho & Marcas
  totalHeadCount: z.coerce.number().optional(),
  brandDescription: z.string().optional(),
  brandRegistrationAdapec: z.string().optional(),
  brandLocation: z.string().optional(),
})

export type PropertyFormValues = z.infer<typeof propertySchema>

export const RURAL_ACTIVITIES = [
  "Pecuária de Cria",
  "Pecuária de Recria e Engorda",
  "Pecuária Leiteira",
  "Cultivo de Soja",
  "Cultivo de Milho",
  "Cultivo de Arroz",
  "Cultivo de Feijão",
  "Silvicultura",
  "Hortifruti",
  "Piscicultura",
  "Avicultura",
  "Suinocultura",
]

export function normalizeTitleCase(text: string): string {
  if (!text) return ""
  return text
    .replace(/\s+/g, ' ') // Remove espaços múltiplos
    .trim() // Remove espaços nas pontas
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase()) // Capitaliza primeira letra de cada palavra
}
