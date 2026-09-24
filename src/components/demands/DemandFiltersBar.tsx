'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Ban, X, Building2, Kanban, Table, Undo2, Loader2, AlertTriangle, AlertCircle } from 'lucide-react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  RURAL_SERVICE_TYPES,
  RURAL_SERVICES_CATALOG,
  RuralServiceTypeCode,
} from '@/lib/validations/demands'

interface DemandFiltersBarProps {
  currentView: string
  currentSearch: string
  currentServiceType?: string
  currentBranchId?: string
  currentSlaFilter?: string
  branches?: Array<{ id: string; name: string }>
  showCancelled: boolean
  cancelledCount?: number
  isPending?: boolean
  pendingAction?: 'kanban' | 'table' | 'cancelled' | 'filter' | null
  onViewChange?: (mode: 'kanban' | 'table') => void
  onToggleCancelled?: () => void
  onApplyFilters?: (
    newServiceType?: string,
    newBranchId?: string,
    newSlaFilter?: string,
    newSearch?: string
  ) => void
}

export function DemandFiltersBar({
  currentView,
  currentSearch,
  currentServiceType,
  currentBranchId,
  currentSlaFilter,
  branches = [],
  showCancelled,
  cancelledCount,
  isPending = false,
  pendingAction = null,
  onViewChange,
  onToggleCancelled,
  onApplyFilters,
}: DemandFiltersBarProps) {
  const router = useRouter()
  const [search, setSearch] = useState(currentSearch)
  const [serviceType, setServiceType] = useState<string>(currentServiceType || 'ALL')
  const [branchId, setBranchId] = useState<string>(currentBranchId || 'ALL')
  const [slaFilter, setSlaFilter] = useState<string>(currentSlaFilter || 'ALL')
  const [viewMode, setViewMode] = useState<string>(currentView || 'kanban')

  React.useEffect(() => {
    setSlaFilter(currentSlaFilter || 'ALL')
  }, [currentSlaFilter])

  React.useEffect(() => {
    setViewMode(currentView || 'kanban')
  }, [currentView])

  const handleViewModeChange = (mode: 'kanban' | 'table') => {
    setViewMode(mode)
    if (onViewChange) {
      onViewChange(mode)
      return
    }
    const params = new URLSearchParams()
    params.set('view', mode)
    if (search.trim()) params.set('search', search.trim())
    if (serviceType && serviceType !== 'ALL') params.set('serviceType', serviceType)
    if (branchId && branchId !== 'ALL') params.set('branchId', branchId)
    if (slaFilter && slaFilter !== 'ALL') params.set('slaFilter', slaFilter)
    if (showCancelled) params.set('showCancelled', 'true')
    router.push(`/admin/demands?${params.toString()}`)
  }

  const handleToggleCancelled = () => {
    if (onToggleCancelled) {
      onToggleCancelled()
      return
    }
    const nextShowCancelled = !showCancelled
    const params = new URLSearchParams()
    if (currentView) params.set('view', currentView)
    if (search.trim()) params.set('search', search.trim())
    if (serviceType && serviceType !== 'ALL') params.set('serviceType', serviceType)
    if (branchId && branchId !== 'ALL') params.set('branchId', branchId)
    if (slaFilter && slaFilter !== 'ALL') params.set('slaFilter', slaFilter)
    if (nextShowCancelled) params.set('showCancelled', 'true')
    router.push(`/admin/demands?${params.toString()}`)
  }

  const handleApplyFilters = (
    newServiceType?: string,
    newBranchId?: string,
    newSlaFilter?: string,
    newSearch?: string
  ) => {
    const activeServiceType = newServiceType !== undefined ? newServiceType : serviceType
    const activeBranchId = newBranchId !== undefined ? newBranchId : branchId
    const activeSlaFilter = newSlaFilter !== undefined ? newSlaFilter : slaFilter
    const activeSearch = newSearch !== undefined ? newSearch : search

    if (onApplyFilters) {
      onApplyFilters(activeServiceType, activeBranchId, activeSlaFilter, activeSearch)
      return
    }

    const params = new URLSearchParams()
    if (currentView) params.set('view', currentView)
    if (activeSearch.trim()) params.set('search', activeSearch.trim())
    if (activeServiceType && activeServiceType !== 'ALL') {
      params.set('serviceType', activeServiceType)
    }
    if (activeBranchId && activeBranchId !== 'ALL') {
      params.set('branchId', activeBranchId)
    }
    if (activeSlaFilter && activeSlaFilter !== 'ALL') {
      params.set('slaFilter', activeSlaFilter)
    }
    if (showCancelled) params.set('showCancelled', 'true')
    router.push(`/admin/demands?${params.toString()}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleApplyFilters()
    }
  }

  const handleServiceChange = (val: string | null) => {
    const normalized = val || 'ALL'
    setServiceType(normalized)
    handleApplyFilters(normalized, branchId, slaFilter)
  }

  const handleBranchChange = (val: string | null) => {
    const normalized = val || 'ALL'
    setBranchId(normalized)
    handleApplyFilters(serviceType, normalized, slaFilter)
  }

  const handleSlaChange = (val: string | null) => {
    const normalized = val || 'ALL'
    setSlaFilter(normalized)
    handleApplyFilters(serviceType, branchId, normalized)
  }

  const hasBranchesSelect = branches.length > 0

  return (
    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Formulário de Busca e Filtro de Serviço & Filial */}
      <div className="flex items-center gap-2.5 flex-1 flex-wrap">
        {/* Campo de Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por produtor, fazenda, proposta..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                const params = new URLSearchParams()
                if (currentView) params.set('view', currentView)
                if (serviceType && serviceType !== 'ALL') params.set('serviceType', serviceType)
                if (branchId && branchId !== 'ALL') params.set('branchId', branchId)
                if (showCancelled) params.set('showCancelled', 'true')
                if (slaFilter && slaFilter !== 'ALL') params.set('slaFilter', slaFilter)
                router.push(`/admin/demands?${params.toString()}`)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown de Filiais (Exclusivo para OWNER / SUPER_ADMIN) */}
        {hasBranchesSelect && (
          <div className="w-[180px]">
            <Select value={branchId} onValueChange={handleBranchChange}>
              <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200 bg-white">
                <SelectValue placeholder="Todas as Filiais">
                  {branchId === 'ALL'
                    ? 'Todas as Filiais'
                    : branches.find((b) => b.id === branchId)?.name || 'Filial'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as Filiais</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Dropdown de Serviços */}
        <div className="w-[200px]">
          <Select value={serviceType} onValueChange={handleServiceChange}>
            <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200 bg-white">
              <SelectValue placeholder="Todos os Serviços">
                {serviceType === 'ALL'
                  ? 'Todos os Serviços'
                  : RURAL_SERVICES_CATALOG[serviceType as RuralServiceTypeCode]?.label || serviceType}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Serviços</SelectItem>
              {RURAL_SERVICE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {RURAL_SERVICES_CATALOG[type]?.label || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Dropdown de Prazos (SLA) */}
        <div className="w-[185px]">
          <Select value={slaFilter} onValueChange={handleSlaChange}>
            <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200 bg-white">
              <SelectValue placeholder="Todos os Prazos">
                {slaFilter === 'ALL'
                  ? 'Todos os Prazos'
                  : slaFilter === 'WARNING_30'
                  ? (
                    <span className="flex items-center gap-1.5 font-medium text-amber-700">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Em Aviso (≤ 30 dias)</span>
                    </span>
                  )
                  : slaFilter === 'OVERDUE'
                  ? (
                    <span className="flex items-center gap-1.5 font-bold text-red-600">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span>Atrasadas</span>
                    </span>
                  )
                  : slaFilter === 'ON_TRACK'
                  ? 'No Prazo (> 30 dias)'
                  : slaFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Prazos</SelectItem>
              <SelectItem value="WARNING_30">
                <div className="flex items-center gap-1.5 font-medium text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Em Aviso (≤ 30 dias)</span>
                </div>
              </SelectItem>
              <SelectItem value="OVERDUE">
                <div className="flex items-center gap-1.5 font-bold text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>Atrasadas</span>
                </div>
              </SelectItem>
              <SelectItem value="ON_TRACK">No Prazo (&gt; 30 dias)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={() => handleApplyFilters()}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
        >
          {isPending && pendingAction === 'filter' && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}
          <span>{isPending && pendingAction === 'filter' ? 'Filtrando...' : 'Filtrar'}</span>
        </button>
      </div>

      {/* Controles da Direita: Canceladas & View Switcher */}
      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
        {/* Toggle Canceladas */}
        <button
          type="button"
          disabled={isPending}
          onClick={handleToggleCancelled}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-70 ${
            showCancelled
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title={showCancelled ? 'Clique para voltar para as demandas ativas' : 'Clique para ver as demandas canceladas'}
        >
          {isPending && pendingAction === 'cancelled' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
              <span>{showCancelled ? 'Voltando...' : 'Carregando...'}</span>
            </>
          ) : showCancelled ? (
            <>
              <Undo2 className="w-3.5 h-3.5" />
              <span>Exibindo Canceladas ({cancelledCount ?? 0})</span>
            </>
          ) : (
            <>
              <Ban className="w-3.5 h-3.5" />
              <span>Ver Canceladas ({cancelledCount ?? 0})</span>
            </>
          )}
        </button>

        {/* Alternância Kanban | Tabela (Segmented Control com Ícones e Loading) */}
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleViewModeChange('kanban')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer disabled:opacity-70 ${
              viewMode === 'kanban'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isPending && pendingAction === 'kanban' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-900" />
            ) : (
              <Kanban className="w-3.5 h-3.5" />
            )}
            <span>Kanban</span>
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => handleViewModeChange('table')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer disabled:opacity-70 ${
              viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isPending && pendingAction === 'table' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-900" />
            ) : (
              <Table className="w-3.5 h-3.5" />
            )}
            <span>Tabela</span>
          </button>
        </div>
      </div>
    </div>
  )
}
