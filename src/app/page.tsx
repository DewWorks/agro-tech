import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
          <strong>Filial Associada (JWT Claim):</strong> {user.app_metadata?.branch_id || 'Não vinculada'}
        </div>

        <form action="/auth/signout" method="POST">
          <button 
            type="submit" 
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
          >
            Sair do Sistema (Log Out)
          </button>
        </form>
      </div>
    </div>
  )
}
