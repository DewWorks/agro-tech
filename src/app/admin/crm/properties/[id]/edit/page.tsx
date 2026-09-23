import { MapPin, ClipboardList, Plus } from 'lucide-react'
import Link from 'next/link'
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

  if (!isSuperAdmin && !effectiveUser.organizationId) {
    return <div>Organização não encontrada.</div>
  }

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      branch: {
        include: {
          organization: true,
        },
      },
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

  if (!property || (!isSuperAdmin && property.branch.organizationId !== effectiveUser.organizationId)) {
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
  const targetOrgId = property.branch.organizationId || effectiveUser.organizationId || undefined

  if (effectiveUser.role === 'OWNER' || effectiveUser.role === 'ADMIN' || isSuperAdmin) {
    userBranches = await prisma.branch.findMany({
      where: { organizationId: targetOrgId },
      orderBy: { name: 'asc' }
    })
  } else {
    const userBranchesData = await prisma.userBranch.findMany({
      where: { userId: effectiveUser.id },
      include: { branch: true }
    })
    userBranches = userBranchesData.map(ub => ub.branch)
  }

  const producers: any[] = await prisma.producer.findMany({
    where: {
      branchId: property.branchId,
      isActive: true,
      branch: {
        organizationId: targetOrgId
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
    if (lp && !producers.some(p => p.id === lp.id)) {
      producers.push({
        id: lp.id,
        name: lp.name,
        document: lp.document,
        type: lp.type
      })
    }
  }

  // Super Admin sempre tem acesso ao módulo financeiro, mesmo que desativado no cliente.
  // Para os demais usuários, respeita estritamente a lista de módulos da organização.
  const targetOrg = property.branch?.organization || effectiveUser.organization
  const isOrgFinancialEnabled = (targetOrg?.modules || []).includes('FINANCIAL_SUMMARY')
  const hasFinancialModule = isSuperAdmin || isOrgFinancialEnabled
  const isFinancialModuleDisabledForOrg = isSuperAdmin && !isOrgFinancialEnabled

  const propertyDemandsCount = await prisma.serviceDemand.count({
    where: { propertyId: id }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
            <MapPin className="h-8 w-8" />
            Editar Propriedade Rural
          </h1>
          <p className="text-muted-foreground mt-1">
            Atualize as informações cadastrais, documentação, rebanho e titularidade do imóvel.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/admin/demands?search=${encodeURIComponent(property.name || property.propertyName || '')}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
          >
            <ClipboardList className="w-4 h-4 text-emerald-600" />
            <span>Demandas ({propertyDemandsCount})</span>
          </Link>
          <Link
            href={`/admin/demands/new?propertyId=${property.id}${linkedProducers[0] ? `&producerId=${linkedProducers[0].id}` : ''}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Demanda</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xs border p-6">
        <PropertyMultiStepForm 
          branches={userBranches} 
          initialData={property} 
          producers={producers}
          hasFinancialModule={hasFinancialModule}
          isFinancialModuleDisabledForOrg={isFinancialModuleDisabledForOrg}
        />
      </div>
    </div>
  )
}
