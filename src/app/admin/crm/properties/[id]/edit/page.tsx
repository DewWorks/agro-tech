import { MapPin } from 'lucide-react'
import PropertyMultiStepForm from '@/components/crm/PropertyMultiStepForm'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'

export default async function EditPropertyPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }

  if (!dbUser.organizationId) {
    return <div>Organização não encontrada.</div>
  }

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      branch: true,
      producers: {
        include: {
          producer: true
        }
      }
    }
  })

  if (!property || property.branch.organizationId !== dbUser.organizationId) {
    notFound()
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

  const producers = await prisma.producer.findMany({
    where: {
      branchId: property.branchId,
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
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
            <MapPin className="h-8 w-8" />
            Editar Propriedade Rural
          </h1>
          <p className="text-muted-foreground mt-1">
            Atualize as informações cadastrais, documentação, rebanho e titularidade do imóvel.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xs border p-6">
        <PropertyMultiStepForm 
          branches={userBranches} 
          initialData={property} 
          producers={producers}
        />
      </div>
    </div>
  )
}
