import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardHome() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  // DECODE THE ACTUAL JWT PAYLOAD TO SEE THE NAKED TRUTH
  let rawClaims = null
  if (session?.access_token) {
    try {
      const base64Url = session.access_token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      rawClaims = JSON.parse(jsonPayload)
    } catch(e) {
      console.error(e)
    }
  }

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-xl w-full bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
        <h1 className="text-2xl font-bold text-[#1B4D3E] mb-2">Bem-vindo à AgroTech!</h1>
        <p className="text-gray-600 mb-6">
          Autenticação concluída com sucesso. Você está na rota protegida do Dashboard.
        </p>
        
        <div className="bg-gray-100 p-4 rounded text-sm text-left mb-6 overflow-auto">
          <strong>User ID:</strong> {user.id}<br/>
          <strong>E-mail:</strong> {user.email}<br/>
          <strong>Função (Role):</strong> {rawClaims?.app_metadata?.role || 'OPERATOR'}<br/>
          <strong>Organização (JWT Claim):</strong> {rawClaims?.app_metadata?.organization_id || 'Não vinculada'}<br/>
          <strong>Filiais Associadas (JWT Claim):</strong> {rawClaims?.app_metadata?.branch_ids ? JSON.stringify(rawClaims.app_metadata.branch_ids) : 'Nenhuma'}
          <br/><br/>
          <div className="bg-black text-green-400 p-2 text-xs font-mono overflow-auto rounded mt-2">
            <strong>DEBUG RAW TOKEN:</strong><br/>
            {JSON.stringify(rawClaims?.app_metadata, null, 2)}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {(rawClaims?.app_metadata?.role === 'OWNER' || rawClaims?.app_metadata?.role === 'ADMIN') && (
            <a 
              href="/admin" 
              className="block w-full text-center bg-[#1B4D3E] text-white py-2 rounded font-semibold hover:bg-[#13382D] transition-colors"
            >
              Acessar Painel de Administração
            </a>
          )}
          <form action="/auth/signout" method="POST">
            <button type="submit" className="w-full border px-4 py-2 rounded text-gray-700 hover:bg-gray-50 transition-colors">
              Sair do Sistema (Log Out)
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
