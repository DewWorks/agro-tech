import { z } from 'zod'

export const BRANDING_BUCKET = 'organization-assets'

export const brandingUpdateSchema = z.object({
  name: z.string().min(1, 'Razão Social é obrigatória').optional(),
  tradeName: z.string().trim().optional().nullable().or(z.literal('')),
  cnpj: z.string().optional(),
  primaryColorHex: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Cor hexadecimal inválida')
    .optional()
    .nullable()
    .or(z.literal('')),
  accentColorHex: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Cor hexadecimal inválida')
    .optional()
    .nullable()
    .or(z.literal('')),
  removeLogoHorizontal: z.coerce.boolean().optional(),
  removeLogoDark: z.coerce.boolean().optional(),
  removeLogoIcon: z.coerce.boolean().optional(),
})

export type BrandingUpdateInput = z.infer<typeof brandingUpdateSchema>
