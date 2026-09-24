'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DemandFiltersBar } from './DemandFiltersBar'
import { DemandMetricsRibbon } from './DemandMetricsRibbon'
import { DemandKanbanBoard } from './DemandKanbanBoard'
import { DemandTableView } from './DemandTableView'
import { DemandCancelledEmptyState } from './DemandCancelledEmptyState'
import { DemandKanbanSkeleton, DemandTableSkeleton } from './DemandBoardSkeleton'
import { cn } from '@/lib/utils'

interface DemandHubContainerProps {
  currentView: 'kanban' | 'table'
  search: string
  serviceType?: string
  branchId?: string
  slaFilter?: string
  statusFilter?: string
  showCancelled: boolean
  branches?: Array<{ id: string; name: string }>
  activeDemands: number
  counters: {
    total: number
    solicitado: number
    emExecucao: number
    aguardandoDocumentacao: number
    concluido: number
    cancelado: number
    atrasadas: number
    warning30: number
  }
  demands: any[]
  cancelledDemands: any[]
}

export function DemandHubContainer({
  currentView,
  search,
  serviceType,
  branchId,
  slaFilter = 'ALL',
  statusFilter,
  showCancelled,
  branches = [],
  activeDemands,
  counters,
  demands,
  cancelledDemands,
}: DemandHubContainerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<
    'kanban' | 'table' | 'cancelled' | 'filter' | null
  >(null)

  useEffect(() => {
    if (!isPending) {
      setPendingAction(null)
    }
  }, [isPending])

  const navigateWithTransition = (
    action: 'kanban' | 'table' | 'cancelled' | 'filter',
    url: string
  ) => {
    setPendingAction(action)
    startTransition(() => {
      router.push(url)
    })
  }

  const handleViewChange = (newView: 'kanban' | 'table') => {
    if (newView === currentView && !showCancelled) return
    const params = new URLSearchParams()
    params.set('view', newView)
    if (search.trim()) params.set('search', search.trim())
    if (serviceType && serviceType !== 'ALL') params.set('serviceType', serviceType)
    if (branchId && branchId !== 'ALL') params.set('branchId', branchId)
    if (slaFilter && slaFilter !== 'ALL') params.set('slaFilter', slaFilter)
    if (showCancelled) params.set('showCancelled', 'true')
    navigateWithTransition(newView, `/admin/demands?${params.toString()}`)
  }

  const handleToggleCancelled = () => {
    const nextShowCancelled = !showCancelled
    const params = new URLSearchParams()
    if (currentView) params.set('view', currentView)
    if (search.trim()) params.set('search', search.trim())
    if (serviceType && serviceType !== 'ALL') params.set('serviceType', serviceType)
    if (branchId && branchId !== 'ALL') params.set('branchId', branchId)
    if (slaFilter && slaFilter !== 'ALL') params.set('slaFilter', slaFilter)
    if (nextShowCancelled) params.set('showCancelled', 'true')
    navigateWithTransition('cancelled', `/admin/demands?${params.toString()}`)
  }

  const handleApplyFilters = (
    newServiceType?: string,
    newBranchId?: string,
    newSlaFilter?: string,
    newSearch?: string
  ) => {
    const params = new URLSearchParams()
    if (currentView) params.set('view', currentView)
    const activeSearch = newSearch !== undefined ? newSearch : search
    if (activeSearch.trim()) params.set('search', activeSearch.trim())
    const activeService = newServiceType !== undefined ? newServiceType : serviceType
    if (activeService && activeService !== 'ALL') params.set('serviceType', activeService)
    const activeBranch = newBranchId !== undefined ? newBranchId : branchId
    if (activeBranch && activeBranch !== 'ALL') params.set('branchId', activeBranch)
    const activeSla = newSlaFilter !== undefined ? newSlaFilter : slaFilter
    if (activeSla && activeSla !== 'ALL') params.set('slaFilter', activeSla)
    if (showCancelled) params.set('showCancelled', 'true')
    navigateWithTransition('filter', `/admin/demands?${params.toString()}`)
  }

  const STATUS_TABS = [
    { key: 'ALL', label: 'Todas', count: counters.total },
    { key: 'SOLICITADO', label: 'Solicitado', count: counters.solicitado },
    { key: 'EM_EXECUCAO', label: 'Em Execução', count: counters.emExecucao },
    {
      key: 'AGUARDANDO_DOCUMENTACAO',
      label: 'Aguardando Docs',
      count: counters.aguardandoDocumentacao,
    },
    { key: 'CONCLUIDO', label: 'Concluído', count: counters.concluido },
    { key: 'CANCELADO', label: 'Cancelado', count: counters.cancelado },
  ]

  const handleStatusTabClick = (tabKey: string) => {
    const params = new URLSearchParams()
    params.set('view', 'table')
    if (tabKey !== 'ALL') params.set('status', tabKey)
    if (search.trim()) params.set('search', search.trim())
    if (serviceType && serviceType !== 'ALL') params.set('serviceType', serviceType)
    if (branchId && branchId !== 'ALL') params.set('branchId', branchId)
    if (slaFilter && slaFilter !== 'ALL') params.set('slaFilter', slaFilter)
    if (tabKey === 'CANCELADO' || showCancelled) params.set('showCancelled', 'true')
    navigateWithTransition('filter', `/admin/demands?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* Modo Kanban: Fita de Métricas Executiva e Compacta com Chips Interativos */}
      {currentView === 'kanban' && !showCancelled && (
        <DemandMetricsRibbon
          activeCount={activeDemands}
          overdueCount={counters.atrasadas}
          warning30Count={counters.warning30}
          pendingDocsCount={counters.aguardandoDocumentacao}
          currentSlaFilter={slaFilter}
          currentView={currentView}
          currentSearch={search}
          currentServiceType={serviceType}
          currentBranchId={branchId}
          showCancelled={showCancelled}
        />
      )}

      {/* Modo Tabela: Barra Compacta de Status como Filtros Rápidos */}
      {currentView === 'table' && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs pb-1">
          <span className="text-slate-400 font-semibold mr-1 text-[11px] uppercase tracking-wider">
            Filtrar:
          </span>
          {STATUS_TABS.map((tab) => {
            const isActive =
              (!statusFilter && tab.key === 'ALL') || statusFilter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                disabled={isPending}
                onClick={() => handleStatusTabClick(tab.key)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-70',
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                    isActive
                      ? 'bg-slate-800 text-slate-200'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Barra de Filtros e Alternância de Visualização com Estados de Loading */}
      <DemandFiltersBar
        currentView={currentView}
        currentSearch={search}
        currentServiceType={serviceType}
        currentBranchId={branchId || 'ALL'}
        currentSlaFilter={slaFilter}
        branches={branches}
        showCancelled={showCancelled}
        cancelledCount={counters.cancelado}
        isPending={isPending}
        pendingAction={pendingAction}
        onViewChange={handleViewChange}
        onToggleCancelled={handleToggleCancelled}
        onApplyFilters={handleApplyFilters}
      />

      {/* Área Principal de Conteúdo com Skeleton Imediato em Transição */}
      <div className="relative min-h-[400px]">
        {isPending ? (
          pendingAction === 'kanban' ||
          (currentView === 'kanban' &&
            !showCancelled &&
            pendingAction !== 'table' &&
            pendingAction !== 'cancelled') ? (
            <DemandKanbanSkeleton />
          ) : (
            <DemandTableSkeleton />
          )
        ) : showCancelled ? (
          cancelledDemands.length === 0 ? (
            <DemandCancelledEmptyState
              currentView={currentView}
              currentSearch={search}
              currentServiceType={serviceType}
              currentBranchId={branchId}
              currentSlaFilter={slaFilter}
              onReturnToActive={handleToggleCancelled}
            />
          ) : (
            <DemandTableView demands={cancelledDemands} />
          )
        ) : currentView === 'kanban' ? (
          <DemandKanbanBoard initialDemands={demands} />
        ) : (
          <DemandTableView demands={demands} />
        )}
      </div>
    </div>
  )
}
