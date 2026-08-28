'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Por favor, preencha todos os campos.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'E-mail ou senha incorretos.' }
  }

  redirect('/admin')
}

export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string
  if (!email) {
    return { error: 'Por favor, introduza o seu e-mail.' }
  }

  const supabase = await createClient()
  
  // O origin URL pode necessitar de ser adaptado com base no ambiente (dev vs prod)
  // Utilizar URL de produção ou localhost conforme apropriado.
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/update-password`,
  })

  if (error) {
    return { error: 'Não foi possível enviar o e-mail de recuperação.' }
  }

  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  if (!password || password.length < 6) {
    return { error: 'A palavra-passe deve ter pelo menos 6 caracteres.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: 'Ocorreu um erro ao atualizar a palavra-passe.' }
  }

  redirect('/admin')
}
