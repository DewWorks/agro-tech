import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function getUserContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await prisma.user.findUnique({ 
    where: { id: user.id },
    include: { organization: true }
  })
  
  if (!dbUser) return null

  // Se for SUPER_ADMIN, verificar se está a representar um cliente
  if (dbUser.role === 'SUPER_ADMIN') {
    const cookieStore = await cookies()
    const impersonatedOrgId = cookieStore.get('impersonated_org_id')?.value

    if (impersonatedOrgId) {
      const org = await prisma.organization.findUnique({ where: { id: impersonatedOrgId } })
      
      if (org) {
        return {
          ...dbUser,
          role: 'OWNER', // Impersona como OWNER da organização
          organizationId: impersonatedOrgId,
          organization: org,
          isSuperAdminImpersonating: true,
          realRole: 'SUPER_ADMIN',
          impersonatedOrgName: org.name
        }
      }
    }
  }

  // Caso normal (ou SUPER_ADMIN no seu painel global)
  return {
    ...dbUser,
    isSuperAdminImpersonating: false,
    realRole: dbUser.role,
    impersonatedOrgName: null
  }
}
