'use server'

import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { handleServerError } from '@/lib/errorHandler'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email'

export async function getOrganizations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (dbUser?.role !== 'SUPER_ADMIN') {
    throw new Error('Acesso negado: Apenas Super Admins podem listar organizações.')
  }

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      users: {
        where: { role: 'OWNER' }
      },
      _count: {
        select: { branches: true, users: true }
      }
    }
  })

  return organizations
}

export async function createOrganization(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) throw new Error('Não autorizado')

    const dbUser = await prisma.user.findUnique({ where: { id: currentUser.id } })
    if (dbUser?.role !== 'SUPER_ADMIN') {
      throw new Error('Acesso negado: Apenas Super Admins podem criar organizações.')
    }

    const orgName = formData.get('orgName') as string
    const orgCnpj = formData.get('orgCnpj') as string
    const ownerName = formData.get('ownerName') as string
    const ownerEmail = formData.get('ownerEmail') as string

    if (!orgName || !orgCnpj || !ownerName || !ownerEmail) {
      throw new Error('Todos os campos são obrigatórios.')
    }

    // 1. Verificar se CNPJ já existe
    const existingOrg = await prisma.organization.findUnique({ where: { cnpj: orgCnpj } })
    if (existingOrg) throw new Error('Já existe uma organização com este CNPJ.')

    // 2. Verificar se Email já existe
    const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } })
    if (existingUser) throw new Error('Este email já está em uso por outro utilizador.')

    const temporaryPassword = Math.random().toString(36).slice(-10) + 'A1!'

    // 3. Criar Organização
    const newOrg = await prisma.organization.create({
      data: {
        name: orgName,
        cnpj: orgCnpj,
      }
    })

    // 4. Criar Conta no Supabase (Auth)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: ownerEmail,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirm
      user_metadata: {
        full_name: ownerName,
      }
    })

    if (authError || !authData.user) {
      // Rollback da org
      await prisma.organization.delete({ where: { id: newOrg.id } })
      throw new Error(`Erro ao criar utilizador no Supabase: ${authError?.message || 'Falha desconhecida'}`)
    }

    // 5. Vincular Utilizador à Organização no Prisma
    // O trigger do Supabase já pode ter criado o registo na tabela User, 
    // então usamos upsert ou esperamos 2s pelo trigger e fazemos update.
    // Vamos esperar 1s pelo trigger (como já está implementado no createUser action)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {
        organizationId: newOrg.id,
        role: 'OWNER',
        fullName: ownerName,
      },
      create: {
        id: authData.user.id,
        email: ownerEmail,
        fullName: ownerName,
        role: 'OWNER',
        organizationId: newOrg.id,
      }
    })

    // 6. Enviar Email
    try {
      await sendWelcomeEmail({
        email: ownerEmail,
        fullName: ownerName,
        organizationName: newOrg.name,
        role: 'OWNER',
        tempPassword: temporaryPassword
      })
    } catch (emailError: any) {
      console.error('Falha ao enviar email:', emailError)
      revalidatePath('/admin/organizations')
      return { warning: `Organização e utilizador criados, mas falha ao enviar email: ${emailError.message}` }
    }

    revalidatePath('/admin/organizations')
    return { success: true }
  } catch (error: any) {
    return { error: handleServerError(error, 'Organizations - createOrganization') }
  }
}

