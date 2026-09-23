import React from 'react'
import Link from 'next/link'
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
} from 'lucide-react'
import { RURAL_SERVICES_CATALOG, RURAL_SERVICE_TYPES, RuralServiceTypeCode } from '@/lib/validations/demands'

export const dynamic = 'force-dynamic'

interface DemandsPageProps {
  searchParams: Promise<{
    view?: string
    search?: string
    serviceType?: string
    showCancelled?: string
  }>
}

export default async function DemandsPage(props: DemandsPageProps) {
  const searchParams = await props.searchParams
  const view = searchParams.view === 'table' ? 'table' : 'kanban'
  const search = searchParams.search || ''
  const serviceType = (searchParams.serviceType as RuralServiceTypeCode) || undefined
  const showCancelled = searchParams.showCancelled === 'true'

  // Busca demandas incluindo ou não canceladas
  const result = await getDemands({
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Serviços & Demandas Rurais
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Workflow Operacional
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gestão visual de ordens de serviço, esteira documental do GED e governança de prazos.
          </p>
        </div>

        <Link
          href="/admin/demands/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm hover:shadow transition-all duration-200 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nova Demanda</span>
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
