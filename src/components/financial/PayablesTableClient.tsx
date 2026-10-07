'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  PlusCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ListFilter,
  Layers,
  Tractor,
  Building2,
  Users2,
  History,
  User,
} from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePayablesFilter } from './hooks/usePayablesFilter'
import NewPayableModal from './modals/NewPayableModal'
import SettlePayableModal from './modals/SettlePayableModal'
import FinancialAuditDrawer from '@/components/financial/audit/FinancialAuditDrawer'

const PAYABLE_STATUS_OPTIONS = [
  { value: 'TODOS', label: 'Status: Todos', icon: ListFilter, iconColor: 'text-slate-500' },
  { value: 'PENDENTE', label: 'Pendentes', icon: Clock, iconColor: 'text-amber-500' },
  { value: 'PARCIALMENTE_PAGO', label: 'Parcialmente Pagos', icon: Clock, iconColor: 'text-blue-500' },
  { value: 'PAGO', label: 'Pagos', icon: CheckCircle2, iconColor: 'text-emerald-600' },
  { value: 'EM_ATRASO', label: 'Em Atraso', icon: AlertTriangle, iconColor: 'text-rose-600' },
]

const PAYABLE_TYPE_OPTIONS = [
  { value: 'TODOS', label: 'Tipo: Todos', icon: Layers, iconColor: 'text-slate-500' },
  { value: 'CUSTO_DIRETO_PROPOSTA', label: 'Custo Direto (Projetos)', icon: Tractor, iconColor: 'text-emerald-700' },
  { value: 'DESPESA_FIXA_FILIAL', label: 'Despesa Fixa (Filial)', icon: Building2, iconColor: 'text-slate-700' },
  { value: 'COMISSAO_PARCEIRO', label: 'Comissões', icon: Users2, iconColor: 'text-amber-700' },
]

interface PayablesTableClientProps {
  payables: any[]
  bankAccounts: any[]
  categories: any[]
  demands: any[]
  branches: any[]
  currentBranchId?: string | null
}

export default function PayablesTableClient({
  payables,
  bankAccounts,
  categories,
  demands,
  branches,
  currentBranchId,
}: PayablesTableClientProps) {
  const router = useRouter()
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    filteredPayables,
  } = usePayablesFilter(payables)

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  // Controle de Modais (Montagem Sob Demanda)
  const [newPayableModalOpen, setNewPayableModalOpen] = useState(false)
  const [settleModalOpen, setSettleModalOpen] = useState(false)
  const [selectedPayable, setSelectedPayable] = useState<any | null>(null)
  const [selectedInstallment, setSelectedInstallment] = useState<any | null>(null)

  // Trilha de Auditoria Integral
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false)
  const [selectedAuditTitleId, setSelectedAuditTitleId] = useState<string | null>(null)
  const [selectedAuditDocNumber, setSelectedAuditDocNumber] = useState<string | undefined>()

  const handleOpenAudit = (titleId: string, docNumber?: string) => {
    setSelectedAuditTitleId(titleId)
    setSelectedAuditDocNumber(docNumber)
    setAuditDrawerOpen(true)
  }

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleOpenSettle = (payable: any, inst: any) => {
    setSelectedPayable(payable)
    setSelectedInstallment(inst)
    setSettleModalOpen(true)
  }

  // Semáforo para parcelas a pagar
  const getInstallmentSemaphore = (inst: any) => {
    if (inst.status === 'PAGO' || Number(inst.paidAmount) >= Number(inst.amount)) {
      return {
        label: 'Pago',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-300',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
      }
    }
    const due = new Date(inst.dueDate).getTime()
    const now = new Date().setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))

    if (diffDays < 0 || inst.status === 'EM_ATRASO') {
      return {
        label: 'Em Atraso',
        color: 'bg-rose-50 text-rose-700 border-rose-300',
        dot: 'bg-rose-500 animate-pulse',
        icon: AlertTriangle,
      }
    }
    if (diffDays <= 5) {
      return {
        label: `Vence em ${diffDays === 0 ? 'Hoje' : `${diffDays}d`}`,
        color: 'bg-amber-50 text-amber-700 border-amber-300',
        dot: 'bg-amber-500',
        icon: Clock,
      }
    }
    return {
      label: 'A Vencer',
      color: 'bg-slate-50 text-slate-700 border-slate-300',
      dot: 'bg-slate-400',
      icon: Clock,
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de Filtros & Ações */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Busca */}
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por fornecedor, documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Filtro Status */}
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'TODOS')}>
            <SelectTrigger className="h-9 w-[190px] text-xs font-semibold bg-white border-slate-200">
              <SelectValue placeholder="Status: Todos">
                {(() => {
                  const opt = PAYABLE_STATUS_OPTIONS.find((o) => o.value === statusFilter) || PAYABLE_STATUS_OPTIONS[0]
                  const Icon = opt.icon
                  return (
                    <span className="flex items-center gap-1.5 truncate">
                      <Icon className={cn('h-3.5 w-3.5 shrink-0', opt.iconColor)} />
                      <span className="truncate">{opt.label}</span>
                    </span>
                  )
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PAYABLE_STATUS_OPTIONS.map((opt) => {
                const Icon = opt.icon
                return (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <Icon className={cn('h-3.5 w-3.5 shrink-0', opt.iconColor)} />
                      <span>{opt.label}</span>
                    </span>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          {/* Filtro Tipo */}
          <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val || 'TODOS')}>
            <SelectTrigger className="h-9 w-[220px] text-xs font-semibold bg-white border-slate-200">
              <SelectValue placeholder="Tipo: Todos">
                {(() => {
                  const opt = PAYABLE_TYPE_OPTIONS.find((o) => o.value === typeFilter) || PAYABLE_TYPE_OPTIONS[0]
                  const Icon = opt.icon
                  return (
                    <span className="flex items-center gap-1.5 truncate">
                      <Icon className={cn('h-3.5 w-3.5 shrink-0', opt.iconColor)} />
                      <span className="truncate">{opt.label}</span>
                    </span>
                  )
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PAYABLE_TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon
                return (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <Icon className={cn('h-3.5 w-3.5 shrink-0', opt.iconColor)} />
                      <span>{opt.label}</span>
                    </span>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Botão Nova Obrigação */}
        <Button
          onClick={() => setNewPayableModalOpen(true)}
          className="bg-emerald-800 hover:bg-emerald-900 text-white gap-2 font-semibold text-xs"
        >
          <PlusCircle className="h-4 w-4" />
          Apropriar Despesa / Compra Parcelada
        </Button>
      </div>

      {/* Tabela de Contas a Pagar */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-8"></th>
                <th className="py-3 px-4">Fornecedor / Documento</th>
                <th className="py-3 px-4">Centro de Custos / Categoria</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-right">Valor Pago</th>
                <th className="py-3 px-4 text-right">Saldo Devedor</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Parcelas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayables.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhuma obrigação a pagar encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredPayables.map((payable) => {
                  const isExpanded = !!expandedRows[payable.id]
                  const total = Number(payable.totalAmount)
                  const paid = Number(payable.paidAmount)
                  const remaining = Math.max(0, total - paid)
                  const installments = payable.installments || []

                  return (
                    <React.Fragment key={payable.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleRow(payable.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            title={isExpanded ? 'Recolher boletos' : 'Expandir boletos'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{payable.supplierName}</div>
                          <div className="text-[11px] text-slate-400">
                            {payable.documentNumber || 'S/N'} •{' '}
                            {payable.isInstallmentPurchase ? 'Compra Parcelada a Prazo' : 'À Vista'}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">
                            {payable.category?.name || 'Despesa Operacional'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {payable.demand ? (
                              <span>
                                Proposta: {payable.demand.producer?.name} ({payable.demand.serviceType})
                              </span>
                            ) : payable.partnerCommission ? (
                              <span className="text-amber-700 font-semibold">
                                Repasse Comissão: {payable.partnerCommission.partner?.name}
                              </span>
                            ) : (
                              <span>Despesa da Filial</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-semibold text-slate-900">
                          {formatCurrency(total)}
                        </td>

                        <td className="py-3 px-4 text-right font-medium text-emerald-700">
                          {formatCurrency(paid)}
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-rose-700">
                          {formatCurrency(remaining)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                              payable.status === 'PAGO'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : payable.status === 'PARCIALMENTE_PAGO'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : payable.status === 'EM_ATRASO'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {payable.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => toggleRow(payable.id)}
                              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline"
                            >
                              {installments.length} {installments.length === 1 ? 'boleto' : 'boletos'}
                            </button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenAudit(payable.id, payable.documentNumber)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg"
                              title="Abrir Trilha de Auditoria Integral"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Grade de Boletos Desdobrados */}
                      {isExpanded && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={8} className="p-4 pl-12 border-y border-slate-200">
                            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                              <h4 className="mb-2 text-xs font-bold uppercase text-slate-700">
                                Grade de Vencimentos & Liquidações
                              </h4>

                              <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                                  <tr>
                                    <th className="py-1.5 px-3">Boleto / Parcela</th>
                                    <th className="py-1.5 px-3">Data Vencimento</th>
                                    <th className="py-1.5 px-3 text-right">Valor Nominal</th>
                                    <th className="py-1.5 px-3 text-right">Pago</th>
                                    <th className="py-1.5 px-3 text-right">Saldo Aberto</th>
                                    <th className="py-1.5 px-3 text-center">Semáforo</th>
                                    <th className="py-1.5 px-3 text-right">Ação</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {installments.map((inst: any) => {
                                    const sem = getInstallmentSemaphore(inst)
                                    const Icon = sem.icon
                                    const instAmount = Number(inst.amount)
                                    const instPaid = Number(inst.paidAmount)
                                    const residual = Math.max(0, instAmount - instPaid)

                                    return (
                                      <tr key={inst.id} className="hover:bg-slate-50">
                                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                                          <div>Parcela {inst.installmentNumber}/{inst.totalInstallments}</div>
                                          {instPaid > 0 && (
                                            <div className="text-[10px] text-slate-500 font-normal mt-0.5 flex flex-wrap items-center gap-1">
                                              <span className="inline-flex items-center gap-1">
                                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                                <span>Baixa: <strong className="text-slate-700">{inst.settlementOperator?.name || 'Operador'}</strong></span>
                                              </span>
                                              <span>•</span>
                                              <span>{inst.bankAccount?.bankName || 'Caixa'}</span>
                                              {inst.paidAt && (
                                                <>
                                                  <span>•</span>
                                                  <span>{new Date(inst.paidAt).toLocaleDateString('pt-BR')}</span>
                                                </>
                                              )}
                                            </div>
                                          )}
                                        </td>

                                        <td className="py-2.5 px-3 text-slate-600">
                                          {new Date(inst.dueDate).toLocaleDateString('pt-BR', {
                                            timeZone: 'UTC',
                                          })}
                                        </td>

                                        <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                                          {formatCurrency(instAmount)}
                                        </td>

                                        <td className="py-2.5 px-3 text-right font-medium text-emerald-700">
                                          {formatCurrency(instPaid)}
                                        </td>

                                        <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                                          {formatCurrency(residual)}
                                        </td>

                                        <td className="py-2.5 px-3 text-center">
                                          <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold border ${sem.color}`}
                                          >
                                            <span
                                              className={`h-1.5 w-1.5 rounded-full ${sem.dot}`}
                                            />
                                            <Icon className="h-3 w-3" />
                                            {sem.label}
                                          </span>
                                        </td>

                                        <td className="py-2.5 px-3 text-right">
                                          {residual > 0 && (
                                            <Button
                                              size="sm"
                                              onClick={() => handleOpenSettle(payable, inst)}
                                              className="h-7 bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold gap-1"
                                            >
                                              <CreditCard className="h-3 w-3" />
                                              Pagar / Baixar
                                            </Button>
                                          )}
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais Montados Sob Demanda */}
      {newPayableModalOpen && (
        <NewPayableModal
          isOpen={newPayableModalOpen}
          onClose={() => setNewPayableModalOpen(false)}
          branches={branches}
          categories={categories}
          demands={demands}
          currentBranchId={currentBranchId}
          onSuccess={() => router.refresh()}
        />
      )}

      {settleModalOpen && (
        <SettlePayableModal
          isOpen={settleModalOpen}
          onClose={() => setSettleModalOpen(false)}
          selectedPayable={selectedPayable}
          selectedInstallment={selectedInstallment}
          bankAccounts={bankAccounts}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* Gaveta Lateral de Trilha de Auditoria Integral */}
      <FinancialAuditDrawer
        isOpen={auditDrawerOpen}
        onClose={() => {
          setAuditDrawerOpen(false)
          setSelectedAuditTitleId(null)
          setSelectedAuditDocNumber(undefined)
        }}
        titleId={selectedAuditTitleId}
        type="PAYABLE"
        initialDocumentNumber={selectedAuditDocNumber}
      />
    </div>
  )
}
