import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/layout/AdminSidebar'
import AdminHeader from '@/components/admin/layout/AdminHeader'
import { getUserContext } from '@/lib/auth'
import { stopImpersonating } from '@/actions/impersonate'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const userContext = await getUserContext()

  if (!userContext) {
    redirect('/login')
  }

  const role = userContext.role

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <AdminSidebar role={role} modules={userContext.organization?.modules || []} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {userContext.isSuperAdminImpersonating && (
          <div className="bg-yellow-400 text-yellow-900 px-6 py-2 text-sm font-medium flex items-center justify-between shadow-sm z-50">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span>
                Estás a aceder ao painel de <strong>{userContext.impersonatedOrgName}</strong>. Tudo o que fizeres aqui afeta os dados reais deste cliente.
              </span>
            </div>
            <form action={stopImpersonating}>
              <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 px-3 py-1 rounded-md text-xs font-bold transition-colors">
                Sair do Cliente
              </button>
            </form>
          </div>
        )}
        <AdminHeader email={userContext.email} role={role} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8FAFC] p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
