'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createBranch(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser || (dbUser.role !== 'OWNER' && dbUser.role !== 'ADMIN')) {
      throw new Error('Permissão negada')
    }
    if (!dbUser.organizationId) {
      throw new Error('Usuário não pertence a nenhuma organização')
    }

    const name = formData.get('name') as string
    const cnpj = formData.get('cnpj') as string
    const city = formData.get('city') as string
    const state = formData.get('state') as string
    const isActive = formData.get('isActive') === 'on' || formData.get('isActive') === 'true'

    if (!name || !cnpj || !city || !state) {
      return { error: 'Preencha todos os campos obrigatórios.' }
    }

    const branch = await prisma.branch.create({
      data: {
        organizationId: dbUser.organizationId,
        name,
        cnpj,
        city,
        state,
        isActive,
      }
    })

    revalidatePath('/admin/branches')
    return { success: true, data: branch }
  } catch (error: any) {
    console.error('Erro ao criar filial:', error)
    if (error?.code === 'P2002') {
      return { error: 'Já existe uma filial com este CNPJ.' }
    }
    return { error: 'Ocorreu um erro ao criar a filial. Verifique os dados ou tente novamente.' }
  }
}

export async function updateBranch(id: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser || (dbUser.role !== 'OWNER' && dbUser.role !== 'ADMIN')) {
      throw new Error('Permissão negada')
    }

    const branch = await prisma.branch.findUnique({ where: { id } })
    if (!branch || branch.organizationId !== dbUser.organizationId) {
      throw new Error('Filial não encontrada ou sem permissão.')
    }

    const name = formData.get('name') as string
    const cnpj = formData.get('cnpj') as string
    const city = formData.get('city') as string
    const state = formData.get('state') as string
    const isActive = formData.get('isActive') === 'on' || formData.get('isActive') === 'true'

    const updated = await prisma.branch.update({
      where: { id },
      data: {
        name,
        cnpj,
        city,
        state,
        isActive,
      }
    })

    revalidatePath('/admin/branches')
    return { success: true, data: updated }
  } catch (error: any) {
    console.error('Erro ao atualizar filial:', error)
    if (error?.code === 'P2002') {
      return { error: 'Já existe outra filial com este CNPJ.' }
    }
    return { error: 'Ocorreu um erro ao atualizar a filial. Tente novamente.' }
  }
}

export async function deleteBranch(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser || (dbUser.role !== 'OWNER' && dbUser.role !== 'ADMIN')) {
      throw new Error('Permissão negada')
    }

    const branch = await prisma.branch.findUnique({ where: { id } })
    if (!branch || branch.organizationId !== dbUser.organizationId) {
      throw new Error('Filial não encontrada ou sem permissão.')
    }

    await prisma.branch.delete({ where: { id } })

    revalidatePath('/admin/branches')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao deletar filial:', error)
    return { error: 'Não foi possível apagar a filial. Ela pode ter utilizadores associados.' }
  }
}

export async function toggleBranchStatus(id: string, newStatus: boolean) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser || (dbUser.role !== 'OWNER' && dbUser.role !== 'ADMIN')) {
      throw new Error('Permissão negada')
    }

    await prisma.branch.update({
      where: { id },
      data: { isActive: newStatus }
    })

    revalidatePath('/admin/branches')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao alternar status da filial:', error)
    return { error: 'Não foi possível alterar o status da filial no momento.' }
  }
}
