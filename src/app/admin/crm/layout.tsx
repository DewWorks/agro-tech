import { getUserContext } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function CRMLayout({ children }: { children: React.ReactNode }) {
  const userContext = await getUserContext()
  if (!userContext) redirect('/login')

  const globalMod = await prisma.systemModule.findUnique({ where: { code: 'CRM' } })
  const isGloballyActive = globalMod?.isActive ?? true
  const isClientActive = (userContext.organization?.modules || []).includes('CRM')

  if (userContext.realRole !== 'SUPER_ADMIN') {
    if (!isGloballyActive || !isClientActive) {
      redirect('/admin')
    }
  }

  return <>{children}</>
}
