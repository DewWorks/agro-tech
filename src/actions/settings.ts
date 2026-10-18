'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { handleServerError } from '@/lib/errorHandler'
import { getUserContext } from '@/lib/auth'
import { updateAsaasCustomer } from '@/lib/asaas/customers'
import { serverLog } from '@/lib/logger'

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

    const targetOrgId = isSuperAdmin
      ? ((formData.get('orgId') as string) || dbUser.organizationId)
      : dbUser.organizationId

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

    const updatedOrg = await prisma.organization.update({
      where: { id: targetOrgId },
      data: updateData,
    })

    // Sincronização Fiscal com Gateway Asaas (Requisito Crítico #5)
    try {
      const subscription = await prisma.organizationSubscription.findUnique({
        where: { organizationId: targetOrgId },
      })

      if (subscription?.asaasCustomerId) {
        // 1. Atualiza a persistência cadastral/fiscal local
        await prisma.organizationSubscription.update({
          where: { organizationId: targetOrgId },
          data: {
            billingName: updatedOrg.name,
            billingCpfCnpj: updatedOrg.cnpj,
          },
        })

        // 2. Dispara sincronização remota com Asaas com tratamento gracioso
        try {
          await updateAsaasCustomer(subscription.asaasCustomerId, {
            name: updatedOrg.name,
            cpfCnpj: updatedOrg.cnpj,
          })
        } catch (asaasErr) {
          serverLog('warn', 'Settings - updateOrganization:updateAsaasCustomer', asaasErr)
        }
      }
    } catch (syncErr) {
      serverLog('warn', 'Settings - updateOrganization:syncFiscal', syncErr)
    }

    revalidatePath('/admin/settings/organization')
    revalidatePath('/admin/organizations')
    return { success: true }
  } catch (error: any) {
    return { error: handleServerError(error, 'Settings - updateOrganization') }
  }
}
