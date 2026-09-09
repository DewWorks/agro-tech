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
      },
      machineries: true,
      improvementsList: true,
      livestockList: true,
    }
  })

  if (!property || property.branch.organizationId !== dbUser.organizationId) {
    notFound()
  }

  // Se a propriedade não tiver máquinas ou benfeitorias salvas na tabela relacional,
  // busca do rascunho de formulário do projeto de crédito mais recente para restaurar automaticamente
  if (property.machineries.length === 0 || property.improvementsList.length === 0) {
    try {
      const latestForm = await prisma.generatedForm.findFirst({
        where: { propertyId: id },
        orderBy: { createdAt: 'desc' }
      })

      const snapshot = (latestForm?.payloadSnapshot as any) || {}

      if (property.machineries.length === 0 && Array.isArray(snapshot.machineryItems) && snapshot.machineryItems.length > 0) {
        await prisma.machinery.createMany({
          data: snapshot.machineryItems.map((m: any) => ({
            branchId: property.branchId,
            propertyId: id,
            specification: m.type || m.category || m.specification || 'Trator de Pneus',
            brand: m.brand || null,
            model: m.model || null,
            powerCapacity: m.powerCapacity || null,
            year: m.year ? Number(m.year) : null,
            chassisSerial: m.chassi || m.chassisSerial || null,
            participationPercent: m.participationPercent ? Number(m.participationPercent) : 100,
            value: m.value ? Number(m.value) : 0,
            hasLien: Boolean(m.hasLien),
            lienInstitution: m.lienInstitution || null,
          }))
        })

        property.machineries = await prisma.machinery.findMany({
          where: { propertyId: id }
        })
      }

      if (property.improvementsList.length === 0 && Array.isArray(snapshot.improvementItems) && snapshot.improvementItems.length > 0) {
        await prisma.improvement.createMany({
          data: snapshot.improvementItems.map((imp: any) => ({
            branchId: property.branchId,
            propertyId: id,
            specification: imp.specification || '',
            unit: imp.unit || 'm²',
            quantity: imp.quantity ? Number(imp.quantity) : 0,
            unitValue: imp.unitValue ? Number(imp.unitValue) : 0,
            observation: imp.conservationState ? `Estado: ${imp.conservationState}` : null,
          }))
        })

        property.improvementsList = await prisma.improvement.findMany({
          where: { propertyId: id }
        })
      }
    } catch (err) {
      console.error('Error migrating snapshot machinery to property:', err)
    }
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

  // Garantir que os produtores vinculados à propriedade estejam sempre presentes na lista
  const linkedProducers = property.producers.map(p => p.producer).filter(Boolean)
  for (const lp of linkedProducers) {
    if (!producers.some(p => p.id === lp.id)) {
      producers.push({
        id: lp.id,
        name: lp.name,
        document: lp.document,
        type: lp.type
      })
    }
  }

  const hasFinancialModule = (dbUser.organization?.modules || []).includes('FINANCIAL_SUMMARY')

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
          hasFinancialModule={hasFinancialModule}
        />
      </div>
    </div>
  )
}
