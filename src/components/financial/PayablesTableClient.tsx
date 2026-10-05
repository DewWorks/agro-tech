'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  PlusCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Landmark,
  Sparkles,
  CreditCard,
  Building,
  Calendar,
  DollarSign,
  Briefcase,
} from 'lucide-react'
import { formatCurrency, formatCPF, formatCNPJ } from '@/lib/utils'
import { createDirectPayableTitle, settlePayableInstallment } from '@/actions/financial/payables'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface PayablesTableClientProps {
  payables: any[]
  bankAccounts: any[]
  categories: any[]
  demands: any[]
  branches: any[]
  currentBranchId?: string | null
}

const EXPENSE_PRESETS = [
  {
    name: 'ART CREA-TO',
    supplier: 'CREA-TO - Conselho Regional de Engenharia e Agronomia',
    categoryCode: '2.1.01',
    expenseType: 'CUSTO_DIRETO_PROPOSTA',
    defaultAmount: 285.5,
    notes: 'Anotação de Responsabilidade Técnica de Projeto de Crédito Rural',
  },
  {
    name: 'Combustível de Campo',
    supplier: 'Posto Petrobras / Ipiranga Regional',
    categoryCode: '2.1.02',
    expenseType: 'CUSTO_DIRETO_PROPOSTA',
    defaultAmount: 450.0,
    notes: 'Abastecimento vistoria agronômica e demarcação GPS',
  },
  {
    name: 'Cartório e Certidões',
    supplier: 'Cartório de Registro de Imóveis',
    categoryCode: '2.1.03',
    expenseType: 'CUSTO_DIRETO_PROPOSTA',
    defaultAmount: 180.0,
    notes: 'Emolumentos de certidão de inteiro teor e ônus reais',
  },
  {
    name: 'Despesa Fixa (Aluguel/Sede)',
    supplier: 'Locador Imóvel Filial',
    categoryCode: '2.2.01',
    expenseType: 'DESPESA_FIXA_FILIAL',
    defaultAmount: 2200.0,
    notes: 'Aluguel mensal sede operacional',
  },
]

export default function PayablesTableClient({
  payables,
  bankAccounts,
  categories,
  demands,
  branches,
  currentBranchId,
}: PayablesTableClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  // Modal de Nova Despesa / Compra Parcelada
  const [newPayableModalOpen, setNewPayableModalOpen] = useState(false)
  const [branchId, setBranchId] = useState<string>(currentBranchId || branches[0]?.id || '')
  const [supplierName, setSupplierName] = useState('')
  const [supplierDocument, setSupplierDocument] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '')
  const [demandId, setDemandId] = useState<string>('')
  const [expenseType, setExpenseType] = useState<
    'CUSTO_DIRETO_PROPOSTA' | 'DESPESA_FIXA_FILIAL' | 'COMISSAO_PARCEIRO'
  >('CUSTO_DIRETO_PROPOSTA')
  const [cropYear, setCropYear] = useState('2025/2026')
  const [totalAmount, setTotalAmount] = useState<number>(285.5)
  const [isInstallmentPurchase, setIsInstallmentPurchase] = useState(false)
  const [numInstallments, setNumInstallments] = useState(1)
  const [firstDueDate, setFirstDueDate] = useState(
    new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Modal de Liquidação / Pagamento
  const [settleModalOpen, setSettleModalOpen] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<any | null>(null)
  const [selectedPayable, setSelectedPayable] = useState<any | null>(null)
  const [settleBankAccountId, setSettleBankAccountId] = useState('')
  const [settleAmount, setSettleAmount] = useState(0)
  const [settleDate, setSettleDate] = useState(new Date().toISOString().slice(0, 10))
  const [isSettling, setIsSettling] = useState(false)

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Filtragem dos títulos
  const filteredPayables = payables.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.documentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.notes?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
    const matchesType = typeFilter === 'ALL' || p.expenseType === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Grade de Boletos Futuros no assistente de parcelamento
  const installmentsGrid = useMemo(() => {
    const count = isInstallmentPurchase ? Math.max(1, numInstallments) : 1
    const baseAmount = Math.floor((totalAmount / count) * 100) / 100
    const remainder = Math.round((totalAmount - baseAmount * count) * 100) / 100

    const grid = []
    const start = new Date(firstDueDate)

    for (let i = 1; i <= count; i++) {
      const d = new Date(start)
      d.setMonth(d.getMonth() + (i - 1))

      const amount = i === 1 ? baseAmount + remainder : baseAmount
      grid.push({
        installmentNumber: i,
        totalInstallments: count,
        dueDate: d.toISOString().slice(0, 10),
        amount,
      })
    }
    return grid
  }, [isInstallmentPurchase, numInstallments, totalAmount, firstDueDate])

  // Aplicação de Preset
  const handleApplyPreset = (preset: (typeof EXPENSE_PRESETS)[0]) => {
    setSupplierName(preset.supplier)
    setExpenseType(preset.expenseType as any)
    setTotalAmount(preset.defaultAmount)
    setNotes(preset.notes)
    setIsInstallmentPurchase(false)
    setNumInstallments(1)

    const cat = categories.find((c) => c.code === preset.categoryCode)
    if (cat) setCategoryId(cat.id)
  }

  // Submissão de nova obrigação
  const handleCreatePayable = async () => {
    if (!branchId || !supplierName || !categoryId || totalAmount <= 0) {
      toast.error('Preencha os campos obrigatórios e garanta um valor positivo.')
      return
    }

    setIsCreating(true)
    const toastId = toast.loading('Lançando obrigação e gerando boletos futuros...')

    try {
      const payload = {
        branchId,
        categoryId,
        demandId: demandId || undefined,
        supplierName: supplierName.trim(),
        supplierDocument: supplierDocument.trim() || undefined,
        documentNumber: documentNumber.trim() || undefined,
        expenseType,
        cropYear,
        totalAmount,
        isInstallmentPurchase,
        notes: notes.trim() || undefined,
        installments: installmentsGrid.map((inst) => ({
          installmentNumber: inst.installmentNumber,
          totalInstallments: inst.totalInstallments,
          dueDate: new Date(inst.dueDate).toISOString(),
          amount: inst.amount,
        })),
      }

      const res = await createDirectPayableTitle(payload)

      if (res.error) {
        toast.dismiss(toastId)
        toast.error(res.error)
        return
      }

      toast.dismiss(toastId)
      toast.success('Obrigação registrada com sucesso!')
      setNewPayableModalOpen(false)
      window.location.reload()
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err?.message || 'Falha ao registrar obrigação.')
    } finally {
      setIsCreating(false)
    }
  }

  // Abertura do modal de liquidação
  const handleOpenSettle = (payable: any, inst: any) => {
    setSelectedPayable(payable)
    setSelectedInstallment(inst)
    const residual = Math.max(0, Number(inst.amount) - Number(inst.paidAmount))
    setSettleAmount(residual)
    setSettleBankAccountId(bankAccounts[0]?.id || '')
    setSettleDate(new Date().toISOString().slice(0, 10))
    setSettleModalOpen(true)
  }

  // Confirmação da liquidação
  const handleConfirmSettle = async () => {
    if (!selectedInstallment || !settleBankAccountId || settleAmount <= 0) {
      toast.error('Selecione a conta bancária de saída e um valor válido.')
      return
    }

    setIsSettling(true)
    const toastId = toast.loading('Processando pagamento e débito atômico em conta...')

    try {
      const res = await settlePayableInstallment({
        installmentId: selectedInstallment.id,
        bankAccountId: settleBankAccountId,
        paidAmount: settleAmount,
        paidAt: new Date(settleDate).toISOString(),
      })

      if (res.error) {
        toast.dismiss(toastId)
        toast.error(res.error)
        return
      }

      toast.dismiss(toastId)
      toast.success('Pagamento liquidado com sucesso! Débito efetuado em conta.')
      setSettleModalOpen(false)
      window.location.reload()
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err?.message || 'Falha ao liquidar pagamento.')
    } finally {
      setIsSettling(false)
    }
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-emerald-600 focus:outline-hidden"
          >
            <option value="ALL">Status: Todos</option>
            <option value="PENDENTE">🟡 Pendentes</option>
            <option value="PARCIALMENTE_PAGO">🔵 Parcialmente Pagos</option>
            <option value="PAGO">🟢 Pagos</option>
            <option value="EM_ATRASO">🔴 Em Atraso</option>
          </select>

          {/* Filtro Tipo */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-emerald-600 focus:outline-hidden"
          >
            <option value="ALL">Tipo: Todos</option>
            <option value="CUSTO_DIRETO_PROPOSTA">🚜 Custo Direto (Projetos)</option>
            <option value="DESPESA_FIXA_FILIAL">🏢 Despesa Fixa (Filial)</option>
            <option value="COMISSAO_PARCEIRO">🤝 Comissões</option>
          </select>
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
                          <button
                            onClick={() => toggleRow(payable.id)}
                            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline"
                          >
                            {installments.length} {installments.length === 1 ? 'boleto' : 'boletos'}
                          </button>
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
                                          Parcela {inst.installmentNumber}/{inst.totalInstallments}
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

      {/* MODAL: NOVA APROPRIAÇÃO / COMPRA PARCELADA A PRAZO */}
      <Dialog open={newPayableModalOpen} onOpenChange={setNewPayableModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Apropriação de Despesa & Boletos Futuros
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Presets Rápidos */}
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
              <span className="text-[10px] font-bold uppercase text-emerald-800 mb-1.5 block">
                ⚡ Presets de Despesas Frequentes:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {EXPENSE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="flex flex-col text-left rounded border border-emerald-200 bg-white p-2 hover:border-emerald-600 transition-colors"
                  >
                    <span className="font-bold text-emerald-900">{preset.name}</span>
                    <span className="text-[10px] text-slate-500">
                      {formatCurrency(preset.defaultAmount)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Filial:</Label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      📍 {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Categoria Financeira:</Label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Fornecedor / Credor:</Label>
                <Input
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Nome da empresa ou prestador"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nº do Documento / Nota / Boleto:</Label>
                <Input
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="NF 12345 / Boleto 001"
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Centro de Custo / Proposta (Opcional):</Label>
                <select
                  value={demandId}
                  onChange={(e) => setDemandId(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                >
                  <option value="">Despesa Geral da Filial</option>
                  {demands.map((d) => (
                    <option key={d.id} value={d.id}>
                      🚜 {d.producer?.name} ({d.serviceType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Valor Total da Despesa (R$):</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                  className="text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Toggle de Compra Parcelada a Prazo */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">
                    Compra Parcelada a Prazo (Múltiplos Boletos Futuros)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Gera N obrigações cronológicas para planejamento orçamentário da safra (ADR-022)
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="instToggle"
                  checked={isInstallmentPurchase}
                  onChange={(e) => setIsInstallmentPurchase(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
                />
              </div>

              {isInstallmentPurchase && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Quantidade de Parcelas:</Label>
                    <select
                      value={numInstallments}
                      onChange={(e) => setNumInstallments(parseInt(e.target.value, 10))}
                      className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                    >
                      <option value={2}>2x</option>
                      <option value={3}>3x</option>
                      <option value={4}>4x</option>
                      <option value={5}>5x</option>
                      <option value={6}>6x</option>
                      <option value={10}>10x</option>
                      <option value={12}>12x</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Primeiro Vencimento:</Label>
                    <Input
                      type="date"
                      value={firstDueDate}
                      onChange={(e) => setFirstDueDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  {/* Projeção da Grade */}
                  <div className="col-span-2 space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      Grade de Boletos Projetada:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {installmentsGrid.map((inst) => (
                        <div
                          key={inst.installmentNumber}
                          className="rounded border border-slate-200 bg-white p-1.5 text-[10px]"
                        >
                          <div className="font-bold text-slate-700">
                            Boleto {inst.installmentNumber}/{inst.totalInstallments}
                          </div>
                          <div className="text-rose-700 font-extrabold">
                            {formatCurrency(inst.amount)}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            {new Date(inst.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Observações / Detalhes:</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Exemplo: Compra de peças do drone de pulverização com garantia..."
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewPayableModalOpen(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
              onClick={handleCreatePayable}
              disabled={isCreating || totalAmount <= 0}
            >
              {isCreating ? 'Lançando...' : 'Confirmar & Registrar Obrigação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: LIQUIDAÇÃO DE PARCELA A PAGAR */}
      <Dialog open={settleModalOpen} onOpenChange={setSettleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Liquidação de Pagamento / Débito em Conta
            </DialogTitle>
          </DialogHeader>

          {selectedInstallment && selectedPayable && (
            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-lg bg-slate-50 p-3 space-y-1 border border-slate-200">
                <div className="font-bold text-slate-900">
                  {selectedPayable.supplierName} • {selectedPayable.documentNumber || 'S/N'}
                </div>
                <div className="text-slate-500">
                  Boleto {selectedInstallment.installmentNumber} de{' '}
                  {selectedInstallment.totalInstallments} • Vencimento:{' '}
                  {new Date(selectedInstallment.dueDate).toLocaleDateString('pt-BR', {
                    timeZone: 'UTC',
                  })}
                </div>
                <div className="text-slate-700 font-semibold pt-1">
                  Saldo devedor desta parcela:{' '}
                  <span className="text-rose-600 font-bold">
                    {formatCurrency(
                      Math.max(
                        0,
                        Number(selectedInstallment.amount) -
                          Number(selectedInstallment.paidAmount)
                      )
                    )}
                  </span>
                </div>
              </div>

              {/* Conta Bancária de Débito */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Conta Bancária de Saída / Débito:</Label>
                <select
                  value={settleBankAccountId}
                  onChange={(e) => setSettleBankAccountId(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      🏦 {b.bankName} (Saldo: {formatCurrency(Number(b.currentBalance))})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Valor a Pagar (R$):</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(parseFloat(e.target.value) || 0)}
                    className="font-bold text-rose-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Data do Pagamento:</Label>
                  <Input
                    type="date"
                    value={settleDate}
                    onChange={(e) => setSettleDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettleModalOpen(false)}
              disabled={isSettling}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
              onClick={handleConfirmSettle}
              disabled={isSettling || settleAmount <= 0}
            >
              {isSettling ? 'Debitando...' : 'Confirmar Débito & Baixar Boleto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
