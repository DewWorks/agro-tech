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

  if (!dbUser.organizationId) {
    return <div>Organização não encontrada.</div>
  }

  let userBranches: any[] = []

  if (dbUser.role === 'OWNER' || dbUser.role === 'ADMIN' || dbUser.realRole === 'SUPER_ADMIN') {
    userBranches = await prisma.branch.findMany({
      where: { organizationId: dbUser.organizationId },
      orderBy: { name: 'asc' }
    })
  } else {
    const userBranchesData = await prisma.userBranch.findMany({
      where: { userId: dbUser.id },
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
        organizationId: dbUser.organizationId
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
        />
      </div>
    </div>
  )
}
