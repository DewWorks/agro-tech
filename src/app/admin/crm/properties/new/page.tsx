import { MapPin } from 'lucide-react'
import PropertyMultiStepForm from '@/components/crm/PropertyMultiStepForm'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function NewPropertyPage() {
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }

  let effectiveUser = dbUser
  const isSuperAdmin = dbUser.role === 'SUPER_ADMIN' || (dbUser as any).realRole === 'SUPER_ADMIN'

  if (isSuperAdmin && !effectiveUser.organizationId) {
    const defaultOrg = await prisma.organization.findFirst({
      orderBy: { createdAt: 'asc' },
    })
    if (defaultOrg) {
      effectiveUser = {
        ...dbUser,
        organizationId: defaultOrg.id,
        organization: defaultOrg,
      }
    }
  }

  if (!effectiveUser.organizationId) {
    return <div>Organização não encontrada.</div>
  }

  let userBranches: any[] = []

  if (effectiveUser.role === 'OWNER' || effectiveUser.role === 'ADMIN' || isSuperAdmin) {
    userBranches = await prisma.branch.findMany({
      where: { organizationId: effectiveUser.organizationId },
      orderBy: { name: 'asc' }
    })
  } else {
    const userBranchesData = await prisma.userBranch.findMany({
      where: { userId: effectiveUser.id },
      include: { branch: true }
    })
    userBranches = userBranchesData.map(ub => ub.branch)
  }

  const initialBranchId = userBranches[0]?.id

  const initialProducers = initialBranchId ? await prisma.producer.findMany({
    where: {
      branchId: initialBranchId,
      isActive: true,
      branch: {
        organizationId: effectiveUser.organizationId
      }
    },
    select: {
      id: true,
      name: true,
      document: true,
      type: true,
    },
    orderBy: { name: 'asc' }
  }) : []

  // Super Admin sempre tem acesso ao módulo financeiro, mesmo que desativado no cliente.
  // Para os demais usuários, respeita estritamente a lista de módulos da organização.
  const isOrgFinancialEnabled = (effectiveUser.organization?.modules || []).includes('FINANCIAL_SUMMARY')
  const hasFinancialModule = isSuperAdmin || isOrgFinancialEnabled
  const isFinancialModuleDisabledForOrg = isSuperAdmin && !isOrgFinancialEnabled

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
            <MapPin className="h-8 w-8" />
            Nova Propriedade Rural
          </h1>
          <p className="text-muted-foreground mt-1">
            Cadastre os dados da propriedade, áreas, titularidade e rebanho.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xs border p-6">
        <PropertyMultiStepForm 
          branches={userBranches} 
          producers={initialProducers} 
          hasFinancialModule={hasFinancialModule}
          isFinancialModuleDisabledForOrg={isFinancialModuleDisabledForOrg}
        />
      </div>
    </div>
  )
}
