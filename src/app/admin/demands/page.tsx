import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { getDemands } from '@/actions/demands'
import { DemandHubContainer } from '@/components/demands/DemandHubContainer'
import { Plus, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  RuralServiceTypeCode,
  DemandStatusCode,
} from '@/lib/validations/demands'

export const dynamic = 'force-dynamic'

interface DemandsPageProps {
  searchParams: Promise<{
    view?: string
    search?: string
    serviceType?: string
    branchId?: string
    showCancelled?: string
    status?: string
    slaFilter?: string
  }>
}

export default async function DemandsPage(props: DemandsPageProps) {
  const searchParams = await props.searchParams
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }

  const isOwnerOrSuperAdmin =
    dbUser.role === 'OWNER' ||
    dbUser.role === 'SUPER_ADMIN' ||
    Boolean((dbUser as any).isSuperAdminImpersonating)

  // Filiais ativas da organização (exclusivo para visualização de OWNER e SUPER_ADMIN)
  let branches: Array<{ id: string; name: string }> = []
  if (isOwnerOrSuperAdmin) {
    branches = await prisma.branch.findMany({
      where: {
        ...(dbUser.role !== 'SUPER_ADMIN' && !dbUser.isSuperAdminImpersonating && dbUser.organizationId
          ? { organizationId: dbUser.organizationId }
          : {}),
        isActive: true,
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
  }

  const view = searchParams.view === 'table' ? 'table' : 'kanban'
  const search = searchParams.search || ''
  const serviceType = (searchParams.serviceType as RuralServiceTypeCode) || undefined
  const showCancelled = searchParams.showCancelled === 'true'
  const statusFilter = (searchParams.status as DemandStatusCode) || undefined
  const slaFilter = searchParams.slaFilter || 'ALL'

  // Para OPERATOR: aplica silenciosamente dbUser.branchId
  // Para OWNER/SUPER_ADMIN: usa o searchParams.branchId se informado, senão busca todas
  const selectedBranchId = isOwnerOrSuperAdmin
    ? searchParams.branchId && searchParams.branchId !== 'ALL'
      ? searchParams.branchId
      : undefined
    : dbUser.branchId || undefined

  // Se showCancelled === true, buscamos as demandas canceladas
  // Se view === 'table' e houver statusFilter, filtramos por ele
  const targetStatus = showCancelled ? 'CANCELADO' : (view === 'table' ? statusFilter : undefined)

  // Busca demandas incluindo ou não canceladas (ou filtradas por status na tabela e SLA)
  const result = await getDemands({
    branchId: selectedBranchId,
    search: search || undefined,
    serviceType: serviceType || undefined,
    status: targetStatus,
    slaFilter: slaFilter !== 'ALL' ? slaFilter : undefined,
    includeCancelled: statusFilter === 'CANCELADO' || showCancelled,
  })

  const demands = result.success ? (result.demands as any[]) : []
  const cancelledDemands = demands.filter((d) => d.status === 'CANCELADO')
  const counters = result.success
    ? result.counters
    : {
        total: 0,
        solicitado: 0,
        emExecucao: 0,
        aguardandoDocumentacao: 0,
        concluido: 0,
        cancelado: 0,
        atrasadas: 0,
        warning30: 0,
      }

  // Demandas ativas em esteira operacional (exclui concluídas e canceladas)
  const activeDemands = counters.solicitado + counters.emExecucao + counters.aguardandoDocumentacao

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ClipboardList className="text-[#1B4D3E] w-6 h-6" />
            Serviços & Demandas Rurais
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Gestão operacional de ordens de serviço, esteira documental do GED e governança de prazos.
          </p>
        </div>
        <Link href="/admin/demands/new">
          <Button className="bg-[#1B4D3E] hover:bg-[#13382D]">
            <Plus className="mr-2 h-4 w-4" /> Nova Demanda
          </Button>
        </Link>
      </div>

      {/* Hub Container com Transições Instantâneas e Skeletons */}
      <DemandHubContainer
        currentView={view}
        search={search}
        serviceType={serviceType}
        branchId={selectedBranchId}
        slaFilter={slaFilter}
        statusFilter={statusFilter}
        showCancelled={showCancelled}
        branches={branches}
        activeDemands={activeDemands}
        counters={counters}
        demands={demands}
        cancelledDemands={cancelledDemands}
      />
    </div>
  )
}
