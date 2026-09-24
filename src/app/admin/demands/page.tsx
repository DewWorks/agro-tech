import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { getDemands } from '@/actions/demands'
import { DemandKanbanBoard } from '@/components/demands/DemandKanbanBoard'
import { DemandTableView } from '@/components/demands/DemandTableView'
import { DemandFiltersBar } from '@/components/demands/DemandFiltersBar'
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
import { RURAL_SERVICES_CATALOG, RURAL_SERVICE_TYPES, RuralServiceTypeCode } from '@/lib/validations/demands'

export const dynamic = 'force-dynamic'

interface DemandsPageProps {
  searchParams: Promise<{
    view?: string
    search?: string
    serviceType?: string
    branchId?: string
    showCancelled?: string
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

  // Para OPERATOR: aplica silenciosamente dbUser.branchId
  // Para OWNER/SUPER_ADMIN: usa o searchParams.branchId se informado, senão busca todas
  const selectedBranchId = isOwnerOrSuperAdmin
    ? searchParams.branchId && searchParams.branchId !== 'ALL'
      ? searchParams.branchId
      : undefined
    : dbUser.branchId || undefined

  // Busca demandas incluindo ou não canceladas
  const result = await getDemands({
    branchId: selectedBranchId,
    search: search || undefined,
    serviceType: serviceType || undefined,
    includeCancelled: showCancelled,
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
      }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            Serviços & Demandas Rurais
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestão operacional de ordens de serviço, esteira documental do GED e governança de prazos.
          </p>
        </div>
        <Link href="/admin/demands/new">
          <Button className="bg-[#1B4D3E] hover:bg-[#13382D]">
            <Plus className="mr-2 h-4 w-4" /> Nova Demanda
          </Button>
        </Link>
      </div>

      {/* Cards de Métricas Consolidadas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Geral */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{counters.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">demandas registradas</div>
        </div>

        {/* Em Execução */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-purple-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Execução</span>
            <PlayCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-purple-700">{counters.emExecucao}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">em andamento técnico</div>
        </div>

        {/* Aguardando Docs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Aguardando</span>
            <FileClock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-700">{counters.aguardandoDocumentacao}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">com pendências no GED</div>
        </div>

        {/* Atrasadas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Atrasadas</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-700">{counters.atrasadas}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">alerta de SLA estourado</div>
        </div>

        {/* Concluídas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Concluídas</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{counters.concluido}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">entregas finalizadas</div>
        </div>

        {/* Canceladas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Canceladas</span>
            <Ban className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-600">{counters.cancelado}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">arquivadas</div>
        </div>
      </div>

      {/* Barra de Filtros e Alternância de Visualização */}
      <DemandFiltersBar
        currentView={view}
        currentSearch={search}
        currentServiceType={serviceType}
        currentBranchId={searchParams.branchId || 'ALL'}
        branches={branches}
        showCancelled={showCancelled}
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
