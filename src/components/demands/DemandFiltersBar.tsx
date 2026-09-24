'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Ban, X, Building2 } from 'lucide-react'
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
}: DemandFiltersBarProps) {
  const router = useRouter()
  const [search, setSearch] = useState(currentSearch)
  const [serviceType, setServiceType] = useState<string>(currentServiceType || 'ALL')
  const [branchId, setBranchId] = useState<string>(currentBranchId || 'ALL')
  const [slaFilter, setSlaFilter] = useState<string>(currentSlaFilter || 'ALL')

  React.useEffect(() => {
    setSlaFilter(currentSlaFilter || 'ALL')
  }, [currentSlaFilter])

  const handleApplyFilters = (
    newServiceType?: string,
    newBranchId?: string,
    newSlaFilter?: string
  ) => {
    const activeServiceType = newServiceType !== undefined ? newServiceType : serviceType
    const activeBranchId = newBranchId !== undefined ? newBranchId : branchId
    const activeSlaFilter = newSlaFilter !== undefined ? newSlaFilter : slaFilter

    const params = new URLSearchParams()
    if (currentView) params.set('view', currentView)
    if (search.trim()) params.set('search', search.trim())
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
                  ? 'Em Aviso (≤ 30 dias)'
                  : slaFilter === 'OVERDUE'
                  ? 'Atrasadas'
                  : slaFilter === 'ON_TRACK'
                  ? 'No Prazo (> 30 dias)'
                  : slaFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Prazos</SelectItem>
              <SelectItem value="WARNING_30">
                <div className="flex items-center gap-1.5 font-medium text-amber-700">
                  <span>⚠️</span>
                  <span>Em Aviso (≤ 30 dias)</span>
                </div>
              </SelectItem>
              <SelectItem value="OVERDUE">
                <div className="flex items-center gap-1.5 font-bold text-red-600">
                  <span>🚨</span>
                  <span>Atrasadas</span>
                </div>
              </SelectItem>
              <SelectItem value="ON_TRACK">No Prazo (&gt; 30 dias)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          onClick={() => handleApplyFilters()}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
        >
          Filtrar
        </button>
      </div>

      {/* Controles da Direita: Canceladas & View Switcher */}
      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
        {/* Toggle Canceladas */}
        <Link
          href={`/admin/demands?view=${currentView}&search=${encodeURIComponent(
            search
          )}&serviceType=${encodeURIComponent(
            serviceType === 'ALL' ? '' : serviceType
          )}&branchId=${encodeURIComponent(
            branchId === 'ALL' ? '' : branchId
          )}&slaFilter=${encodeURIComponent(
            slaFilter === 'ALL' ? '' : slaFilter
          )}&showCancelled=${showCancelled ? 'false' : 'true'}`}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all inline-flex items-center gap-1.5 ${
            showCancelled
              ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-2xs'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Ban className="w-3.5 h-3.5" />
          <span>{showCancelled ? 'Ocultar Canceladas' : `Ver Canceladas (${cancelledCount ?? 0})`}</span>
        </Link>

        {/* Alternância Kanban | Tabela */}
        <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex items-center">
          <Link
            href={`/admin/demands?view=kanban&search=${encodeURIComponent(
              search
            )}&serviceType=${encodeURIComponent(
              serviceType === 'ALL' ? '' : serviceType
            )}&branchId=${encodeURIComponent(
              branchId === 'ALL' ? '' : branchId
            )}&slaFilter=${encodeURIComponent(
              slaFilter === 'ALL' ? '' : slaFilter
            )}&showCancelled=${showCancelled ? 'true' : 'false'}`}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              currentView === 'kanban'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Kanban
          </Link>
          <Link
            href={`/admin/demands?view=table&search=${encodeURIComponent(
              search
            )}&serviceType=${encodeURIComponent(
              serviceType === 'ALL' ? '' : serviceType
            )}&branchId=${encodeURIComponent(
              branchId === 'ALL' ? '' : branchId
            )}&slaFilter=${encodeURIComponent(
              slaFilter === 'ALL' ? '' : slaFilter
            )}&showCancelled=${showCancelled ? 'true' : 'false'}`}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              currentView === 'table'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Tabela
          </Link>
        </div>
      </div>
    </div>
  )
}
