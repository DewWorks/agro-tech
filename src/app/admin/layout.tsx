import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/layout/AdminSidebar'
import AdminHeader from '@/components/admin/layout/AdminHeader'
import { getUserContext } from '@/lib/auth'
import { stopImpersonating } from '@/actions/impersonate'
import prisma from '@/lib/prisma'
import ModuleWarningBanner from '@/components/admin/layout/ModuleWarningBanner'
import NavigationProgress from '@/components/admin/layout/NavigationProgress'
import AdminContentWrapper from '@/components/admin/layout/AdminContentWrapper'
import { AlertTriangle } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const userContext = await getUserContext()

  if (!userContext) {
    redirect('/login')
  }

  const role = userContext.role
  const globalModules = await prisma.systemModule.findMany()

  return (
    <div className="flex h-screen bg-[#F8FAFC] print:h-auto print:overflow-visible print:bg-white">
      <NavigationProgress />
      <AdminSidebar 
        role={role} 
        realRole={userContext.realRole} 
        modules={userContext.organization?.modules || []} 
        globalModules={globalModules.map(m => ({ code: m.code, isActive: m.isActive }))} 
        organizationName={userContext.impersonatedOrgName || userContext.organization?.name || null}
        user={{
          fullName: userContext.fullName,
          email: userContext.email,
          role: role,
        }}
      />
      <div className="flex-1 flex flex-col overflow-hidden print:h-auto print:overflow-visible">
        {userContext.isSuperAdminImpersonating && (
          <div className="bg-yellow-400 text-yellow-900 px-6 py-2 text-sm font-medium flex items-center justify-between shadow-sm z-50 print:hidden">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-900" />
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
        <div className="print:hidden">
          <ModuleWarningBanner 
            realRole={userContext.realRole}
            clientModules={userContext.organization?.modules || []}
            globalModules={globalModules.map(m => ({ code: m.code, isActive: m.isActive }))}
          />
        </div>
        <AdminHeader email={userContext.email} role={role} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8FAFC] p-8 print:p-0 print:m-0 print:bg-white print:overflow-visible print:h-auto print:block">
          <AdminContentWrapper>
            {children}
          </AdminContentWrapper>
        </main>
      </div>
    </div>
  )
}
