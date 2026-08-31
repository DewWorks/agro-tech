'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { handleServerError } from '@/lib/errorHandler'
import { getUserContext } from '@/lib/auth'

const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
})

const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'A Razão Social deve ter pelo menos 2 caracteres.'),
  cnpj: z.string().min(14, 'CNPJ inválido.'),
})

export async function updateProfile(formData: FormData) {
  try {
    const dbUser = await getUserContext()

    if (!dbUser) {
      return { error: 'Não autenticado' }
    }

    const validatedFields = updateProfileSchema.safeParse({
      fullName: formData.get('fullName'),
    })

    if (!validatedFields.success) {
      return { error: validatedFields.error.issues[0].message }
    }

    await prisma.user.update({
      where: { id: dbUser.id },
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
    const dbUser = await getUserContext()

    if (!dbUser) {
      return { error: 'Não autenticado' }
    }

    const isSuperAdmin = dbUser.realRole === 'SUPER_ADMIN'
    const isOwner = dbUser.role === 'OWNER'

    if (!isSuperAdmin && !isOwner) {
      return { error: 'Permissão negada. Apenas o proprietário pode alterar os dados da organização.' }
    }

    const targetOrgId = formData.get('orgId') as string || dbUser.organizationId

    if (!targetOrgId) {
      return { error: 'Organização não encontrada.' }
    }

    const name = formData.get('name') as string
    const cnpj = formData.get('cnpj') as string

    if (!name || name.length < 2) {
      return { error: 'A Razão Social deve ter pelo menos 2 caracteres.' }
    }

    // Se não for Super Admin, não permitimos alterar o CNPJ (ignoramos o que vem ou validamos)
    const updateData: any = { name }

    if (isSuperAdmin) {
      if (!cnpj || cnpj.length < 14) {
        return { error: 'CNPJ inválido.' }
      }
      updateData.cnpj = cnpj
    }

    await prisma.organization.update({
      where: { id: targetOrgId },
      data: updateData,
    })

    revalidatePath('/admin/settings/organization')
    revalidatePath('/admin/organizations')
    return { success: true }
  } catch (error: any) {
    return { error: handleServerError(error, 'Settings - updateOrganization') }
  }
}
