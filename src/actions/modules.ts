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

/**
 * Retorna todos os módulos globais do sistema.
 */
export async function getSystemModules() {
  const user = await getUserContext()
  if (!user || user.realRole !== 'SUPER_ADMIN') {
    throw new Error('Não autorizado.')
  }

  return await prisma.systemModule.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Retorna um módulo específico pelo ID.
 */
export async function getSystemModuleById(id: string) {
  const user = await getUserContext()
  if (!user || user.realRole !== 'SUPER_ADMIN') {
    throw new Error('Não autorizado.')
  }

  return await prisma.systemModule.findUnique({
    where: { id }
  })
}

/**
 * Cria um novo módulo do sistema.
 */
export async function createSystemModule(data: {
  code: string
  name: string
  description?: string
  isActive?: boolean
}) {
  const user = await getUserContext()
  if (!user || user.realRole !== 'SUPER_ADMIN') {
    throw new Error('Não autorizado.')
  }

  // Validar se o código já existe
  const existing = await prisma.systemModule.findUnique({
    where: { code: data.code.toUpperCase() }
  })

  if (existing) {
    throw new Error('Já existe um módulo com este código.')
  }

  const module = await prisma.systemModule.create({
    data: {
      ...data,
      code: data.code.toUpperCase()
    }
  })

  revalidatePath('/admin/modules')
  return module
}

/**
 * Atualiza um módulo do sistema.
 */
export async function updateSystemModule(id: string, data: {
  name: string
  description?: string
  isActive?: boolean
}) {
  const user = await getUserContext()
  if (!user || user.realRole !== 'SUPER_ADMIN') {
    throw new Error('Não autorizado.')
  }

  const module = await prisma.systemModule.update({
    where: { id },
    data
  })

  revalidatePath('/admin/modules')
  return module
}

/**
 * Altera o status (Ativo/Inativo) de um módulo.
 */
export async function toggleSystemModuleStatus(id: string, isActive: boolean) {
  const user = await getUserContext()
  if (!user || user.realRole !== 'SUPER_ADMIN') {
    throw new Error('Não autorizado.')
  }

  const module = await prisma.systemModule.update({
    where: { id },
    data: { isActive }
  })

  revalidatePath('/admin/modules')
  return { success: true }
}
