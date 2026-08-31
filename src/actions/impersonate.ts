'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function startImpersonating(orgId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (dbUser?.role !== 'SUPER_ADMIN') {
    throw new Error('Apenas Super Administradores podem aceder a painéis de clientes')
  }

  // Verifica se a organização existe
  const org = await prisma.organization.findUnique({ where: { id: orgId } })
  if (!org) {
    throw new Error('Organização não encontrada')
  }

  // Define o cookie de impersonation (expira em 1 hora, ou até ser removido)
  const cookieStore = await cookies()
  cookieStore.set('impersonated_org_id', orgId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 2 // 2 horas
  })

  // Redireciona para o painel principal, que agora será o painel da org
  redirect('/admin')
}

export async function stopImpersonating() {
  const cookieStore = await cookies()
  cookieStore.delete('impersonated_org_id')
  
  // Redireciona de volta para a tabela global de organizações
  redirect('/admin/organizations')
}
