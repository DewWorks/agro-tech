'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { handleServerError } from '@/lib/errorHandler'

const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
})

const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'A Razão Social deve ter pelo menos 2 caracteres.'),
  cnpj: z.string().min(14, 'CNPJ inválido.'),
})

export async function updateProfile(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Não autenticado' }
    }

    const validatedFields = updateProfileSchema.safeParse({
      fullName: formData.get('fullName'),
    })

    if (!validatedFields.success) {
      return { error: validatedFields.error.issues[0].message }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: validatedFields.data.fullName,
      },
    })

    revalidatePath('/admin/settings/profile')
    return { success: true }
  } catch (error: any) {
    return { error: handleServerError(error, 'Settings - updateProfile') }
  }
}

export async function updateOrganization(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Não autenticado' }
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { organization: true }
    })

    if (!dbUser || dbUser.role !== 'OWNER') {
      return { error: 'Permissão negada. Apenas o proprietário pode alterar os dados da organização.' }
    }

    if (!dbUser.organizationId) {
      return { error: 'Organização não encontrada.' }
    }

    const validatedFields = updateOrganizationSchema.safeParse({
      name: formData.get('name'),
      cnpj: formData.get('cnpj'),
    })

    if (!validatedFields.success) {
      return { error: validatedFields.error.issues[0].message }
    }

    await prisma.organization.update({
      where: { id: dbUser.organizationId },
      data: {
        name: validatedFields.data.name,
        cnpj: validatedFields.data.cnpj,
      },
    })

    revalidatePath('/admin/settings/organization')
    return { success: true }
  } catch (error: any) {
    return { error: handleServerError(error, 'Settings - updateOrganization') }
  }
}
