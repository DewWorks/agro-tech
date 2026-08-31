'use server'

import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function toggleOrganizationModule(organizationId: string, moduleCode: string, isActive: boolean) {
  const user = await getUserContext()
  if (!user || user.realRole !== 'SUPER_ADMIN') {
    return { error: 'Acesso negado' }
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { modules: true }
  })

  if (!org) {
    return { error: 'Organização não encontrada' }
  }

  let updatedModules = [...(org.modules || [])]
  if (isActive && !updatedModules.includes(moduleCode)) {
    updatedModules.push(moduleCode)
  } else if (!isActive) {
    updatedModules = updatedModules.filter(m => m !== moduleCode)
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { modules: updatedModules }
  })

  revalidatePath('/admin/organizations/[id]/edit', 'page')
  return { success: true }
}
