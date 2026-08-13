import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

// Ler manual do .env.local
const envFile = fs.readFileSync('.env.local', 'utf8')
const envs = {}
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=')
  if (key && val.length > 0) {
    envs[key.trim()] = val.join('=').trim()
  }
})

const supabaseUrl = envs['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = envs['SUPABASE_SERVICE_ROLE_KEY']

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetPassword() {
  console.log('Tentando redefinir senha...')
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    'a6b8e42c-0b2b-4d4f-a2d1-2ccbbd13f108',
    { password: 'AgroTechAdmin2026!' }
  )

  if (error) {
    console.error('Erro ao redefinir:', error)
  } else {
    console.log('Senha redefinida com sucesso para o usuário:', data.user.email)
  }
}

resetPassword()
