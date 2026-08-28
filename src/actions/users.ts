'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Role } from '@prisma/client'
import { sendWelcomeEmail } from '@/lib/email'

// Tipos para os parâmetros das ações
interface CreateUserData {
  email: string
  fullName: string
  role: Role
  isActive: boolean
  branches: { branchId: string; role: Role }[]
}

interface UpdateUserData {
  fullName: string
  role: Role
  isActive: boolean
  branches: { branchId: string; role: Role }[]
}

async function verifyAdminAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const dbUser = await prisma.user.findUnique({ 
    where: { id: user.id },
    include: { organization: true }
  })
  
  if (!dbUser || (dbUser.role !== 'OWNER' && dbUser.role !== 'ADMIN')) {
    throw new Error('Permissão negada')
  }
  if (!dbUser.organizationId || !dbUser.organization) {
    throw new Error('Usuário sem organização')
  }

  return dbUser
}

export async function createUser(data: CreateUserData) {
  try {
    const adminUser = await verifyAdminAccess()

    // 1. Verificar se o utilizador já existe no Prisma
    let dbUser = await prisma.user.findUnique({ where: { email: data.email } })
    let targetUserId: string
    let tempPassword

    if (dbUser) {
      // Utilizador já existe, vamos apenas vinculá-lo à organização
      targetUserId = dbUser.id
    } else {
      // 2. Criar novo utilizador no Supabase Auth usando o Admin API
      tempPassword = Math.random().toString(36).slice(-10) + 'A1!'
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          role: data.role // Isso pode ser usado pela trigger no futuro
        }
      })

      if (authError) throw new Error(`Erro Supabase: ${authError.message}`)
      if (!authData.user) throw new Error('Falha ao criar utilizador no Supabase.')

      targetUserId = authData.user.id

      // 3. Aguardar 1 segundo para garantir que a Trigger do Postgres inseriu o User no Prisma
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // 4. Atualizar os dados do User no Prisma para vinculá-lo à organização
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        organizationId: adminUser.organizationId,
        fullName: data.fullName,
        role: data.role,
        isActive: data.isActive
      }
    })

    // 5. Apagar vínculos antigos de filiais e inserir as novas relações
    await prisma.userBranch.deleteMany({
      where: { userId: targetUserId }
    })

    if (data.branches && data.branches.length > 0) {
      const userBranchesData = data.branches.map(b => ({
        userId: targetUserId,
        branchId: b.branchId,
        role: b.role
      }))
      
      await prisma.userBranch.createMany({
        data: userBranchesData
      })
    }

    // Enviar o email de boas vindas
    await sendWelcomeEmail({
      email: data.email,
      fullName: data.fullName,
      organizationName: adminUser.organization.name,
      role: data.role,
      tempPassword
    })

    revalidatePath('/admin/users')
    return { success: true, tempPassword }
  } catch (error: any) {
    console.error('Erro ao criar/vincular utilizador:', error)
    if (error?.code === 'P2002') {
      return { error: 'Já existe um utilizador com este e-mail na organização.' }
    }
    return { error: 'Ocorreu um erro ao criar ou vincular o utilizador. Verifique os dados e tente novamente.' }
  }
}

export async function updateUser(id: string, data: UpdateUserData) {
  try {
    const adminUser = await verifyAdminAccess()

    // 1. Atualizar dados do Utilizador no Prisma
    await prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName,
        role: data.role,
        isActive: data.isActive
      }
    })

    // 2. Apagar todas as relações antigas e recriar as novas
    await prisma.userBranch.deleteMany({
      where: { userId: id }
    })

    if (data.branches && data.branches.length > 0) {
      const userBranchesData = data.branches.map(b => ({
        userId: id,
        branchId: b.branchId,
        role: b.role
      }))
      
      await prisma.userBranch.createMany({
        data: userBranchesData
      })
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao atualizar utilizador:', error)
    return { error: 'Ocorreu um erro ao atualizar os dados do utilizador. Tente novamente.' }
  }
}

export async function toggleUserStatus(id: string, newStatus: boolean) {
  try {
    const adminUser = await verifyAdminAccess()
    
    // Não deixar o admin desativar-se a si próprio
    if (adminUser.id === id) {
      throw new Error('Não pode desativar a sua própria conta.')
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: newStatus }
    })
    
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao alternar status do utilizador:', error)
    return { error: 'Não foi possível alterar o status deste utilizador no momento.' }
  }
}
