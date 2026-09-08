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
  car: z.string().regex(
    /^[A-Z]{2}-\d{7}-[A-Z0-9]{4}\.[A-Z0-9]{4}\.[A-Z0-9]{4}\.[A-Z0-9]{4}\.[A-Z0-9]{4}\.[A-Z0-9]{4}\.[A-Z0-9]{4}$/, 
    "Formato inválido. Ex: TO-1700000-ABCD.1234..."
  ),
  ccir: z.string().optional(),
  itr: z.string().optional(),
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
