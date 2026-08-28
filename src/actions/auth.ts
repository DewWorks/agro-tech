'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { handleServerError } from '@/lib/errorHandler'

export async function login(formData: FormData) {
  let success = false
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      throw new Error('Por favor, preencha todos os campos.')
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    success = true
  } catch (error: any) {
    return { error: handleServerError(error, 'Auth - login') }
  }

  if (success) {
    redirect('/admin')
  }
}

export async function logout() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) throw error
  } catch (error: any) {
    return { error: handleServerError(error, 'Auth - logout') }
  }
  // Se quisermos redirecionar para fora (opcional), mas normalmente faz-se na UI
}

export async function resetPassword(formData: FormData) {
  try {
    const email = formData.get('email') as string
    if (!email) {
      throw new Error('Por favor, introduza o seu e-mail.')
    }

    const supabase = await createClient()
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/update-password`,
    })

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return { error: handleServerError(error, 'Auth - resetPassword') }
  }
}

export async function updatePassword(formData: FormData) {
  let success = false
  try {
    const password = formData.get('password') as string
    if (!password || password.length < 6) {
      throw new Error('A palavra-passe deve ter pelo menos 6 caracteres.')
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) throw error

    success = true
  } catch (error: any) {
    return { error: handleServerError(error, 'Auth - updatePassword') }
  }

  if (success) {
    redirect('/admin')
  }
}
