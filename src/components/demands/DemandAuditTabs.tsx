'use client'

import React, { useState, useMemo } from 'react'
import {
  Building2,
  ShieldCheck,
  History,
  Search,
  Calendar,
  User,
  Filter,
  X,
  FileCheck2,
  Clock,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { DemandTimeline, DemandHistoryItem } from './DemandTimeline'
import { DemandSlaBadge, SlaInfo } from './DemandSlaBadge'
import { DemandStatusCode } from '@/lib/validations/demands'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS: { value: string; label: string; dotClass: string }[] = [
  { value: 'ALL', label: 'Todos os Status', dotClass: '' },
  { value: 'SOLICITADO', label: 'Solicitado', dotClass: 'bg-slate-400' },
  { value: 'EM_EXECUCAO', label: 'Em Execução', dotClass: 'bg-slate-900' },
  { value: 'AGUARDANDO_DOCUMENTACAO', label: 'Aguardando Docs', dotClass: 'bg-amber-500' },
  { value: 'CONCLUIDO', label: 'Concluído', dotClass: 'bg-emerald-600' },
  { value: 'CANCELADO', label: 'Cancelado', dotClass: 'bg-red-500' },
]

export interface DemandAuditTabsProps {
  demand: {
    id: string
    requestDate?: Date | string
    createdAt?: Date | string
    startDate?: Date | string | null
    estimatedDeliveryDate?: Date | string | null
    completionDate?: Date | string | null
    proposalId?: string | null
    responsibleName?: string | null
    branchName?: string | null
    branch?: {
      id: string
      name: string
    } | null
    creator?: {
      id: string
      fullName?: string | null
      name?: string | null
      email?: string | null
      avatarUrl?: string | null
    } | null
    createdBy?: {
      id: string
      fullName?: string | null
      name?: string | null
      email?: string | null
      avatarUrl?: string | null
    } | null
    createdByUser?: {
      id: string
      fullName?: string | null
      email?: string | null
    } | null
    assignedTo?: {
      id: string
      fullName?: string | null
      name?: string | null
      email?: string | null
      avatarUrl?: string | null
    } | null
    sla?: SlaInfo
    history: DemandHistoryItem[]
  }
  className?: string
}

export function DemandAuditTabs({ demand, className }: DemandAuditTabsProps) {
  // Estado local para os filtros instantâneos da Aba de Histórico
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [selectedDate, setSelectedDate] = useState<string>('')

  // Formatações de data para Governança
  const rawRequestDate = demand.requestDate || (demand as any).createdAt
  const requestDateObj = rawRequestDate ? new Date(rawRequestDate) : null
  const formattedRequestDate =
    requestDateObj && !isNaN(requestDateObj.getTime())
      ? requestDateObj.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '--'
  const formattedRequestTime =
    requestDateObj && !isNaN(requestDateObj.getTime())
      ? requestDateObj.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '--'

  const rawStartDate = demand.startDate || (demand as any).startedAt
  const formattedStartDate =
    rawStartDate && !isNaN(new Date(rawStartDate).getTime())
      ? new Date(rawStartDate).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : 'Aguardando início'

  const rawEstimatedDate = demand.estimatedDeliveryDate || (demand as any).slaForecast
  const formattedEstimatedDate =
    rawEstimatedDate && !isNaN(new Date(rawEstimatedDate).getTime())
      ? new Date(rawEstimatedDate).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : 'Não definida'

  const rawCompletionDate = demand.completionDate || (demand as any).completedAt
  const formattedCompletionDate =
    rawCompletionDate && !isNaN(new Date(rawCompletionDate).getTime())
      ? new Date(rawCompletionDate).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : null

  const creatorName =
    demand.creator?.fullName ||
    (demand as any).creator?.name ||
    (demand as any).createdBy?.fullName ||
    (demand as any).createdBy?.name ||
    demand.creator?.email?.split('@')[0] ||
    (demand as any).createdBy?.email ||
    'Sistema'

  const assigneeName =
    demand.assignedTo?.fullName ||
    (demand as any).assignedTo?.name ||
    demand.responsibleName ||
    (demand as any).assignee?.fullName ||
    'Não atribuído'

  const branchName = demand.branch?.name || (demand as any).branchName || 'Não informada'

  // Lista de usuários únicos presentes no histórico
  const uniqueUsers = useMemo(() => {
    const userMap = new Map<string, string>()
    demand.history.forEach((item) => {
      if (item.user?.id) {
        userMap.set(item.user.id, item.user.fullName || item.user.email || 'Usuário')
      } else if (item.userId) {
        userMap.set(item.userId, 'Usuário')
      }
    })
    return Array.from(userMap.entries()).map(([id, name]) => ({ id, name }))
  }, [demand.history])

  // Filtragem no cliente com useMemo (0ms)
  const filteredHistory = useMemo(() => {
    return demand.history.filter((item) => {
      // 1. Busca textual (despacho/observação, status, usuário)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const notesMatch = item.notes?.toLowerCase().includes(query)
        const userMatch =
          item.user?.fullName?.toLowerCase().includes(query) ||
          item.user?.email?.toLowerCase().includes(query)
        const fromMatch = item.fromStatus?.toLowerCase().includes(query)
        const toMatch = item.toStatus?.toLowerCase().includes(query)
        if (!notesMatch && !userMatch && !fromMatch && !toMatch) {
          return false
        }
      }

      // 2. Filtro por usuário
      if (selectedUser !== 'ALL') {
        if (item.userId !== selectedUser && item.user?.id !== selectedUser) {
          return false
        }
      }

      // 3. Filtro por status
      if (selectedStatus !== 'ALL') {
        if (item.toStatus !== selectedStatus && item.fromStatus !== selectedStatus) {
          return false
        }
      }

      // 4. Filtro por data (compara UTC e local)
      if (selectedDate) {
        const itemDate = new Date(item.createdAt)
        const itemDateUtc = itemDate.toISOString().slice(0, 10)
        const itemDateLocal = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`
        if (itemDateUtc !== selectedDate && itemDateLocal !== selectedDate) {
          return false
        }
      }

      return true
    })
  }, [demand.history, searchQuery, selectedUser, selectedStatus, selectedDate])

  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedUser !== 'ALL' || selectedStatus !== 'ALL' || selectedDate
  )

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedUser('ALL')
    setSelectedStatus('ALL')
    setSelectedDate('')
  }

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-12 gap-6 items-start', className)}>
      {/* Lado Esquerdo (35%): Card de Governança & Rastreabilidade */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-[#1B4D3E]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Governança & Rastreabilidade
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500">Criado por:</span>
              <span className="font-semibold text-slate-900 text-right">
                {creatorName}
                <span className="block text-[11px] font-normal text-slate-400">
                  {formattedRequestDate} às {formattedRequestTime}
                </span>
              </span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500">Responsável Atual:</span>
              <span className="font-semibold text-slate-900 text-right">{assigneeName}</span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500">Filial de Atendimento:</span>
              <span className="font-semibold text-slate-900 text-right">{branchName}</span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500">Início da Execução:</span>
              <span className="font-semibold text-slate-900 text-right">{formattedStartDate}</span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500">Previsão (SLA):</span>
              <span className="font-semibold text-slate-900 text-right">{formattedEstimatedDate}</span>
            </div>

            {demand.sla && (
              <div className="flex items-start justify-between gap-2 pt-1">
                <span className="text-slate-500">Status do SLA:</span>
                <DemandSlaBadge sla={demand.sla} />
              </div>
            )}

            {formattedCompletionDate && (
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Conclusão Efetiva:</span>
                <span className="font-bold text-emerald-800 text-right flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {formattedCompletionDate}
                </span>
              </div>
            )}

            {demand.proposalId && (
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <span className="text-slate-500">Proposta Vinculada:</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                  <FileCheck2 className="w-3 h-3 text-slate-500" />
                  {demand.proposalId}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lado Direito (65%): Linha do Tempo Espaçosa com Barra Horizontal de Filtros */}
      <div className="lg:col-span-8 space-y-4">
        {/* Barra de Filtros Espaçosa (Horizontal) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          {/* Linha 1: Input de Busca Textual */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por despacho, usuário ou status..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Linha 2: Filtros Horizontais Espaçosos (3 Colunas) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            {/* Select de Usuário */}
            <div className="min-w-0">
              <Select
                value={selectedUser}
                onValueChange={(val) => setSelectedUser(val || 'ALL')}
              >
                <SelectTrigger className="h-8.5 text-xs rounded-lg border-slate-200 bg-white text-slate-700 shadow-2xs w-full">
                  <SelectValue placeholder="Todos os Usuários">
                    {selectedUser === 'ALL'
                      ? 'Todos os Usuários'
                      : uniqueUsers.find((u) => u.id === selectedUser)?.name || 'Usuário'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[260px] text-xs">
                  <SelectItem value="ALL">Todos os Usuários</SelectItem>
                  {uniqueUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select de Status */}
            <div className="min-w-0">
              <Select
                value={selectedStatus}
                onValueChange={(val) => setSelectedStatus(val || 'ALL')}
              >
                <SelectTrigger className="h-8.5 text-xs rounded-lg border-slate-200 bg-white text-slate-700 shadow-2xs w-full">
                  <SelectValue placeholder="Todos os Status">
                    {selectedStatus === 'ALL'
                      ? 'Todos os Status'
                      : STATUS_OPTIONS.find((s) => s.value === selectedStatus)?.label || selectedStatus}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[260px] text-xs">
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-1.5">
                        {status.dotClass && (
                          <span className={cn('w-2 h-2 rounded-full shrink-0', status.dotClass)} />
                        )}
                        <span>{status.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DatePicker */}
            <div className="min-w-0">
              <DatePicker
                value={selectedDate || ''}
                onChange={(val) => setSelectedDate(val || '')}
                placeholder="Filtrar por data específica..."
                showPresets={false}
                className="h-8.5 text-xs rounded-lg border-slate-200 bg-white shadow-2xs w-full justify-start font-normal text-slate-700"
                align="start"
              />
            </div>
          </div>

          {/* Linha 3: Feedback e Reset de Filtros */}
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
            <span data-testid="history-counter" className="text-slate-500 font-medium">
              Exibindo <strong className="text-slate-800">{filteredHistory.length}</strong> de{' '}
              {demand.history.length} eventos
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Limpar filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* Linha do Tempo Espaçosa */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          {filteredHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
              <History className="w-6 h-6 mx-auto opacity-40 text-slate-400" />
              <p className="font-semibold text-slate-600">Nenhum evento corresponde aos filtros.</p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs text-slate-700 font-bold hover:underline cursor-pointer"
              >
                <span>Redefinir filtros</span>
              </button>
            </div>
          ) : (
            <DemandTimeline history={filteredHistory} />
          )}
        </div>
      </div>
    </div>
  )
}
