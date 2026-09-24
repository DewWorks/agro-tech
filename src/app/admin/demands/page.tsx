import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { getDemands } from '@/actions/demands'
import { DemandKanbanBoard } from '@/components/demands/DemandKanbanBoard'
import { DemandTableView } from '@/components/demands/DemandTableView'
import { DemandFiltersBar } from '@/components/demands/DemandFiltersBar'
import { DemandMetricsRibbon } from '@/components/demands/DemandMetricsRibbon'
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  FileClock,
  Layers,
  Ban,
  ShieldAlert,
  ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  RURAL_SERVICES_CATALOG,
  RURAL_SERVICE_TYPES,
  RuralServiceTypeCode,
  DemandStatusCode,
} from '@/lib/validations/demands'
import { cn } from '@/lib/utils'

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

  // Busca demandas incluindo ou não canceladas (ou filtradas por status na tabela e SLA)
  const result = await getDemands({
    branchId: selectedBranchId,
    search: search || undefined,
    serviceType: serviceType || undefined,
    status: view === 'table' ? statusFilter : undefined,
    slaFilter: slaFilter !== 'ALL' ? slaFilter : undefined,
    includeCancelled: statusFilter === 'CANCELADO' || showCancelled,
  })

  const demands = result.success ? (result.demands as any[]) : []
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

  const STATUS_TABS = [
    { key: 'ALL', label: 'Todas', count: counters.total },
    { key: 'SOLICITADO', label: 'Solicitado', count: counters.solicitado },
    { key: 'EM_EXECUCAO', label: 'Em Execução', count: counters.emExecucao },
    { key: 'AGUARDANDO_DOCUMENTACAO', label: 'Aguardando Docs', count: counters.aguardandoDocumentacao },
    { key: 'CONCLUIDO', label: 'Concluído', count: counters.concluido },
    { key: 'CANCELADO', label: 'Cancelado', count: counters.cancelado },
  ]

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            Serviços & Demandas Rurais
          </h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Gestão operacional de ordens de serviço, esteira documental do GED e governança de prazos.
          </p>
        </div>
        <Link href="/admin/demands/new">
          <Button className="bg-[#1B4D3E] hover:bg-[#13382D]">
            <Plus className="mr-2 h-4 w-4" /> Nova Demanda
          </Button>
        </Link>
      </div>

      {/* Modo Kanban: Fita de Métricas Executiva e Compacta com Chips Interativos */}
      {view === 'kanban' && (
        <DemandMetricsRibbon
          activeCount={activeDemands}
          overdueCount={counters.atrasadas}
          warning30Count={counters.warning30}
          pendingDocsCount={counters.aguardandoDocumentacao}
          currentSlaFilter={slaFilter}
          currentView={view}
          currentSearch={search}
          currentServiceType={serviceType}
          currentBranchId={searchParams.branchId}
          showCancelled={showCancelled}
        />
      )}

      {/* Modo Tabela: Barra Compacta de Status como Filtros Rápidos */}
      {view === 'table' && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs pb-1">
          <span className="text-slate-400 font-semibold mr-1 text-[11px] uppercase tracking-wider">
            Filtrar:
          </span>
          {STATUS_TABS.map((tab) => {
            const isActive = (!statusFilter && tab.key === 'ALL') || statusFilter === tab.key
            return (
              <Link
                key={tab.key}
                href={`/admin/demands?view=table&status=${tab.key === 'ALL' ? '' : tab.key}&search=${encodeURIComponent(
                  search
                )}&serviceType=${encodeURIComponent(
                  serviceType || ''
                )}&branchId=${encodeURIComponent(
                  searchParams.branchId || ''
                )}&slaFilter=${encodeURIComponent(
                  slaFilter === 'ALL' ? '' : slaFilter
                )}&showCancelled=${tab.key === 'CANCELADO' || showCancelled ? 'true' : 'false'}`}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-1.5 cursor-pointer',
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                    isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {tab.count}
                </span>
              </Link>
            )
          })}
        </div>
      )}

      {/* Barra de Filtros e Alternância de Visualização */}
      <DemandFiltersBar
        currentView={view}
        currentSearch={search}
        currentServiceType={serviceType}
        currentBranchId={searchParams.branchId || 'ALL'}
        currentSlaFilter={slaFilter}
        branches={branches}
        showCancelled={showCancelled}
        cancelledCount={counters.cancelado}
      />

      {/* Conteúdo Principal: Kanban ou Tabela */}
      {view === 'kanban' ? (
        <DemandKanbanBoard initialDemands={demands} />
      ) : (
        <DemandTableView demands={demands} />
      )}
    </div>
  )
}
