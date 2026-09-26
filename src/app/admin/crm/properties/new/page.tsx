import { MapPin, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import PropertyMultiStepForm from '@/components/crm/PropertyMultiStepForm'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'

interface NewPropertyPageProps {
  searchParams?: Promise<{
    producerId?: string
    branchId?: string
  }>
}

export default async function NewPropertyPage(props: NewPropertyPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {}
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

  const userBranchIds = userBranches.map((ub) => ub.id)

  let producers = userBranchIds.length > 0
    ? await prisma.producer.findMany({
        where: {
          branchId: { in: userBranchIds },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          document: true,
          type: true,
          branchId: true,
        },
        orderBy: { name: 'asc' },
      })
    : []

  if (searchParams.producerId && !producers.some((p) => p.id === searchParams.producerId)) {
    const specificProducer = await prisma.producer.findUnique({
      where: { id: searchParams.producerId },
      select: {
        id: true,
        name: true,
        document: true,
        type: true,
        branchId: true,
      },
    })
    if (specificProducer) {
      producers = [specificProducer, ...producers]
    }
  }

  // Super Admin sempre tem acesso ao módulo financeiro, mesmo que desativado no cliente.
  // Para os demais usuários, respeita estritamente a lista de módulos da organização.
  const isOrgFinancialEnabled = (effectiveUser.organization?.modules || []).includes('FINANCIAL_SUMMARY')
  const hasFinancialModule = isSuperAdmin || isOrgFinancialEnabled
  const isFinancialModuleDisabledForOrg = isSuperAdmin && !isOrgFinancialEnabled

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeaderBanner
        badge="CRM & Imóveis Rurais"
        badgeIcon={<MapPin className="h-4 w-4 shrink-0 text-emerald-300" />}
        title="Nova Propriedade Rural"
        description="Cadastre os dados da propriedade, áreas, titularidade e rebanho."
        actions={
          <Link href="/admin/crm/properties">
            <Button
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar às Propriedades
            </Button>
          </Link>
        }
      />

      {producers.length === 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-sm text-amber-900">
                Nenhum produtor rural cadastrado
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                No sistema AgroTech, toda propriedade rural deve estar vinculada a um produtor titular. Cadastre o produtor rural primeiro para poder vincular esta fazenda.
              </p>
            </div>
          </div>
          <Link href="/admin/crm/new">
            <Button className="bg-[#1B4D3E] hover:bg-[#153e32] text-white text-xs font-semibold shrink-0">
              Cadastrar Produtor Agora
            </Button>
          </Link>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-xs border p-6">
        <PropertyMultiStepForm 
          branches={userBranches} 
          producers={producers} 
          initialProducerId={searchParams.producerId}
          initialBranchId={searchParams.branchId}
          hasFinancialModule={hasFinancialModule}
          isFinancialModuleDisabledForOrg={isFinancialModuleDisabledForOrg}
        />
      </div>
    </div>
  )
}
