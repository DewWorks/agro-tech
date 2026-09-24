'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Layers, ShieldAlert, FileClock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DemandMetricsRibbonProps {
  activeCount: number
  overdueCount: number
  warning30Count: number
  pendingDocsCount: number
  currentSlaFilter?: string
  currentView: string
  currentSearch?: string
  currentServiceType?: string
  currentBranchId?: string
  currentStatus?: string
  showCancelled?: boolean
  className?: string
}

export function DemandMetricsRibbon({
  activeCount,
  overdueCount,
  warning30Count,
  pendingDocsCount,
  currentSlaFilter = 'ALL',
  currentView,
  currentSearch = '',
  currentServiceType,
  currentBranchId,
  currentStatus,
  showCancelled = false,
  className,
}: DemandMetricsRibbonProps) {
  const router = useRouter()

  const handleToggleSla = (targetFilter: 'WARNING_30' | 'OVERDUE') => {
    const nextFilter = currentSlaFilter === targetFilter ? 'ALL' : targetFilter
    const params = new URLSearchParams()

    if (currentView) params.set('view', currentView)
    if (currentSearch.trim()) params.set('search', currentSearch.trim())
    if (currentServiceType && currentServiceType !== 'ALL') {
      params.set('serviceType', currentServiceType)
    }
    if (currentBranchId && currentBranchId !== 'ALL') {
      params.set('branchId', currentBranchId)
    }
    if (currentStatus && currentStatus !== 'ALL') {
      params.set('status', currentStatus)
    }
    if (showCancelled) params.set('showCancelled', 'true')
    if (nextFilter !== 'ALL') {
      params.set('slaFilter', nextFilter)
    }

    router.push(`/admin/demands?${params.toString()}`)
  }

  const handleClearSla = () => {
    if (currentSlaFilter === 'ALL') return
    const params = new URLSearchParams()
    if (currentView) params.set('view', currentView)
    if (currentSearch.trim()) params.set('search', currentSearch.trim())
    if (currentServiceType && currentServiceType !== 'ALL') {
      params.set('serviceType', currentServiceType)
    }
    if (currentBranchId && currentBranchId !== 'ALL') {
      params.set('branchId', currentBranchId)
    }
    if (currentStatus && currentStatus !== 'ALL') {
      params.set('status', currentStatus)
    }
    if (showCancelled) params.set('showCancelled', 'true')

    router.push(`/admin/demands?${params.toString()}`)
  }

  return (
    <div className={cn('flex items-center gap-2.5 flex-wrap text-xs', className)}>
      {/* Total Demandas Ativas */}
      <button
        type="button"
        onClick={handleClearSla}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-medium cursor-pointer',
          currentSlaFilter === 'ALL'
            ? 'bg-slate-100/90 border-slate-300 text-slate-800 shadow-2xs font-semibold'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        )}
        title="Clique para ver todas as demandas ativas"
      >
        <Layers className="w-3.5 h-3.5 text-slate-500" />
        <span>
          Total:{' '}
          <strong className="text-slate-900 font-bold">{activeCount} demandas ativas</strong>
        </span>
      </button>

      {/* Chip Interativo: Em Aviso (<= 30 dias) */}
      <button
        type="button"
        onClick={() => handleToggleSla('WARNING_30')}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer',
          warning30Count > 0
            ? currentSlaFilter === 'WARNING_30'
              ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-bold'
              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100/80 font-semibold'
            : currentSlaFilter === 'WARNING_30'
            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
        )}
        title={
          currentSlaFilter === 'WARNING_30'
            ? 'Filtro ativo: clique para remover filtro'
            : 'Clique para filtrar demandas com prazo de entrega até 30 dias'
        }
      >
        <AlertTriangle
          className={cn(
            'w-3.5 h-3.5 shrink-0',
            currentSlaFilter === 'WARNING_30'
              ? 'text-white'
              : warning30Count > 0
              ? 'text-amber-600'
              : 'text-slate-400'
          )}
        />
        <span>
          <strong className="font-bold">{warning30Count}</strong> em Aviso (≤ 30 dias)
        </span>
      </button>

      {/* Atrasadas / Risco de SLA */}
      <button
        type="button"
        onClick={() => handleToggleSla('OVERDUE')}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-medium cursor-pointer',
          overdueCount > 0
            ? currentSlaFilter === 'OVERDUE'
              ? 'bg-red-600 text-white border-red-700 shadow-xs font-bold'
              : 'bg-red-50/90 border-red-200 text-red-700 hover:bg-red-100/80 font-semibold'
            : currentSlaFilter === 'OVERDUE'
            ? 'bg-red-600 text-white border-red-700 shadow-xs font-bold'
            : 'bg-slate-50/80 border-slate-200 text-slate-500 hover:bg-slate-100'
        )}
        title={
          currentSlaFilter === 'OVERDUE'
            ? 'Filtro ativo: clique para remover filtro'
            : 'Clique para filtrar demandas com SLA estourado'
        }
      >
        <ShieldAlert
          className={cn(
            'w-3.5 h-3.5',
            currentSlaFilter === 'OVERDUE'
              ? 'text-white'
              : overdueCount > 0
              ? 'text-red-600'
              : 'text-slate-400'
          )}
        />
        <span>
          <strong
            className={
              currentSlaFilter === 'OVERDUE'
                ? 'font-black'
                : overdueCount > 0
                ? 'text-red-700 font-black'
                : 'font-medium'
            }
          >
            {overdueCount}
          </strong>{' '}
          Atrasadas / Risco de SLA
        </span>
      </button>

      {/* Pendências no GED */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-medium">
        <FileClock className="w-3.5 h-3.5 text-slate-500" />
        <span>
          <strong className="text-slate-900 font-bold">{pendingDocsCount}</strong> Pendências no GED
        </span>
      </div>
    </div>
  )
}
