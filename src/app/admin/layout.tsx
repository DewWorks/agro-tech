import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/layout/AdminSidebar'
import AdminHeader from '@/components/admin/layout/AdminHeader'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) {
    redirect('/login')
  }

  let role = 'OPERATOR'
  if (session?.access_token) {
    try {
      const base64Url = session.access_token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      const rawClaims = JSON.parse(jsonPayload)
      if (rawClaims?.app_metadata?.role) {
        role = rawClaims.app_metadata.role
      }
    } catch(e) {}
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <AdminSidebar role={role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8FAFC] p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
