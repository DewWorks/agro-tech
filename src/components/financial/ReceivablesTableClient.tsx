'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  PlusCircle,
  FileText,
  Download,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Landmark,
  ShieldAlert,
} from 'lucide-react'
import { formatCurrency, formatCPF, formatCNPJ } from '@/lib/utils'
import {
  settleReceivableInstallment,
  reverseReceivablePayment,
  getQuittanceReceiptData,
} from '@/actions/financial/receivables'
import { triggerQuittanceReceiptDownload, QuittanceReceiptPdfData } from '@/components/financial/QuittanceReceiptPdfTemplate'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ReceivablesTableClientProps {
  titles: any[]
  bankAccounts: any[]
  currentBranchId?: string | null
}

export default function ReceivablesTableClient({
  titles,
  bankAccounts,
  currentBranchId,
}: ReceivablesTableClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  // Modal de Baixa Declaratória
  const [settleModalOpen, setSettleModalOpen] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<any | null>(null)
  const [selectedTitle, setSelectedTitle] = useState<any | null>(null)
  const [settleAmount, setSettleAmount] = useState<number>(0)
  const [settleBankAccountId, setSettleBankAccountId] = useState<string>('')
  const [settleDate, setSettleDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [isSettling, setIsSettling] = useState(false)

  // Modal de Estorno
  const [reverseModalOpen, setReverseModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null)
  const [justification, setJustification] = useState('')
  const [isReversing, setIsReversing] = useState(false)

  // Estado de download de PDF
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null)

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Filtragem local dos títulos
  const filteredTitles = titles.filter((t) => {
    const matchesSearch =
      searchTerm === '' ||
      t.producer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.documentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.notes?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Abertura do modal de liquidação
  const handleOpenSettle = (title: any, installment: any) => {
    setSelectedTitle(title)
    setSelectedInstallment(installment)
    const residual = Math.max(0, Number(installment.amount) - Number(installment.receivedAmount))
    setSettleAmount(residual)
    setSettleBankAccountId(bankAccounts[0]?.id || '')
    setSettleDate(new Date().toISOString().slice(0, 10))
    setSettleModalOpen(true)
  }

  // Submissão da baixa
  const handleConfirmSettle = async () => {
    if (!selectedInstallment || !settleBankAccountId || settleAmount <= 0) {
      toast.error('Informe a conta bancária e um valor válido para liquidação.')
      return
    }

    setIsSettling(true)
    const toastId = toast.loading('Processando liquidação e destravamento atômico...')

    try {
      const res = await settleReceivableInstallment({
        installmentId: selectedInstallment.id,
        bankAccountId: settleBankAccountId,
        receivedAmount: settleAmount,
        receivedAt: new Date(settleDate).toISOString(),
      })

      if (res.error) {
        toast.dismiss(toastId)
        toast.error(res.error)
        return
      }

      toast.dismiss(toastId)
      toast.success('Baixa efetuada com sucesso! Recibo oficial gerado.')
      setSettleModalOpen(false)

      // Se gerou recibo, oferece download imediato
      if (res.data?.receipt) {
        handleDownloadReceipt(res.data.receipt.id)
      }
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err?.message || 'Falha ao processar liquidação.')
    } finally {
      setIsSettling(false)
    }
  }

  // Abertura do modal de estorno
  const handleOpenReverse = (tx: any) => {
    setSelectedTransaction(tx)
    setJustification('')
    setReverseModalOpen(true)
  }

  // Confirmação do estorno
  const handleConfirmReverse = async () => {
    if (!selectedTransaction) return
    if (!justification || justification.trim().length < 15) {
      toast.error('A justificativa de estorno deve ter no mínimo 15 caracteres.')
      return
    }

    setIsReversing(true)
    const toastId = toast.loading('Processando estorno atômico e rastreabilidade...')

    try {
      const res = await reverseReceivablePayment({
        transactionId: selectedTransaction.id,
        justification: justification.trim(),
      })

      if (res.error) {
        toast.dismiss(toastId)
        toast.error(res.error)
        return
      }

      toast.dismiss(toastId)
      toast.success('Estorno realizado com sucesso. Saldo e comissões reajustados.')
      setReverseModalOpen(false)
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err?.message || 'Falha ao executar estorno.')
    } finally {
      setIsReversing(false)
    }
  }

  // Download do Recibo em PDF em 1-clique
  const handleDownloadReceipt = async (receiptId: string) => {
    setDownloadingReceiptId(receiptId)
    const toastId = toast.loading('Compilando Recibo Oficial em Alta Resolução (336 DPI)...')

    try {
      const res = await getQuittanceReceiptData(receiptId)
      if (res.error || !res.data) {
        toast.dismiss(toastId)
        toast.error(res.error || 'Erro ao carregar dados do recibo.')
        return
      }

      const receipt = res.data
      const title = receipt.installment.receivableTitle
      const snapshot = receipt.payloadSnapshot as any

      const pdfData: QuittanceReceiptPdfData = {
        receiptNumber: receipt.receiptNumber,
        issuedAt: receipt.issuedAt,
        sha256Hash: receipt.sha256Hash,
        organization: {
          name: title.branch?.organization?.name || 'LN CONSULTORIA E PROJETOS RURAIS',
          cnpj: (title.branch?.organization as any)?.cnpj || null,
        },
        branch: {
          name: title.branch?.name || 'Filial Principal',
          city: title.branch?.city || 'Ponte Alta do Bom Jesus',
          state: title.branch?.state || 'TO',
        },
        producer: {
          name: title.producer?.name || 'Produtor Rural',
          document: title.producer?.document || '',
          phone: title.producer?.phone,
        },
        property: title.property
          ? {
              name: title.property.name,
            }
          : null,
        title: {
          documentNumber: title.documentNumber,
          serviceSubtype: title.serviceSubtype || title.category?.name,
          cropYear: title.cropYear,
          originType: title.originType,
        },
        installment: {
          installmentNumber: receipt.installment.installmentNumber,
          totalInstallments: receipt.installment.totalInstallments,
          dueDate: receipt.installment.dueDate,
        },
        amounts: {
          amountReceivedThisEvent: snapshot?.amountReceivedThisEvent || Number(receipt.transaction?.amount || 0),
          totalInstallmentReceived: snapshot?.totalInstallmentReceived || Number(receipt.installment.receivedAmount || 0),
          installmentTotalAmount: snapshot?.installmentTotalAmount || Number(receipt.installment.amount || 0),
          remainingInstallmentBalance: snapshot?.remainingInstallmentBalance || 0,
        },
        bankAccount: {
          bankName: receipt.transaction?.bankAccount?.bankName || 'Conta Corrente LN',
          agency: receipt.transaction?.bankAccount?.agency,
          accountNumber: receipt.transaction?.bankAccount?.accountNumber,
        },
        paymentDate: receipt.transaction?.transactionDate || receipt.issuedAt,
      }

      await triggerQuittanceReceiptDownload(pdfData)
      toast.dismiss(toastId)
      toast.success('Recibo baixado com sucesso!')
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err?.message || 'Falha ao compilar recibo em PDF.')
    } finally {
      setDownloadingReceiptId(null)
    }
  }

  // Cálculo da prévia de comissão destravada no modal
  const commissionPreview = React.useMemo(() => {
    if (!selectedTitle || !selectedTitle.commissions || selectedTitle.commissions.length === 0) {
      return null
    }
    const net = Number(selectedTitle.netAmount) || 1
    const ratio = settleAmount / net
    const totalCommission = Number(selectedTitle.commissions[0].totalCommissionAmount) || 0
    const unlockAmount = totalCommission * ratio
    return {
      partnerName: selectedTitle.partner?.name || 'Parceiro Comercial',
      totalCommission,
      unlockAmount: Math.min(totalCommission, unlockAmount),
    }
  }, [selectedTitle, settleAmount])

  // Semáforo visual para status da parcela
  const getInstallmentSemaphore = (inst: any) => {
    if (inst.status === 'QUITADO') {
      return {
        label: 'Quitado',
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
      {/* Barra de Ações e Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Busca Textual */}
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por produtor, título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Filtro por Status */}
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'ALL')}>
            <SelectTrigger className="h-9 w-[210px] text-xs font-semibold bg-white border-slate-200">
              <SelectValue placeholder="Status: Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Status: Todos</SelectItem>
              <SelectItem value="PENDENTE">🟡 Pendentes</SelectItem>
              <SelectItem value="PARCIALMENTE_RECEBIDO">🔵 Parcialmente Recebidos</SelectItem>
              <SelectItem value="QUITADO">🟢 Quitados</SelectItem>
              <SelectItem value="EM_ATRASO">🔴 Em Atraso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Botão de Novo Faturamento Avulso */}
        <Link
          href={`/admin/financial/receivables/new${
            currentBranchId ? `?branchId=${currentBranchId}` : ''
          }`}
        >
          <Button className="bg-emerald-800 hover:bg-emerald-900 text-white gap-2 font-semibold text-xs">
            <PlusCircle className="h-4 w-4" />
            Novo Faturamento Avulso
          </Button>
        </Link>
      </div>

      {/* Tabela Principal de Títulos */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-8"></th>
                <th className="py-3 px-4">Documento / Produtor</th>
                <th className="py-3 px-4">Origem / Categoria</th>
                <th className="py-3 px-4 text-right">Valor Líquido</th>
                <th className="py-3 px-4 text-right">Recebido</th>
                <th className="py-3 px-4 text-right">Saldo Aberto</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTitles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhum título a receber encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTitles.map((title) => {
                  const isExpanded = !!expandedRows[title.id]
                  const net = Number(title.netAmount)
                  const received = Number(title.totalReceivedAmount)
                  const openBalance = Math.max(0, net - received)
                  const installments = title.installments || []

                  return (
                    <React.Fragment key={title.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleRow(title.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            title={isExpanded ? 'Recolher parcelas' : 'Expandir parcelas'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{title.producer?.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {title.documentNumber} •{' '}
                            {title.producer?.document
                              ? title.producer.document.length === 11
                                ? formatCPF(title.producer.document)
                                : formatCNPJ(title.producer.document)
                              : ''}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">
                            {title.serviceSubtype || title.category?.name || 'Honorários Técnicos'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Safra {title.cropYear || '2025/2026'} •{' '}
                            {title.originType === 'ESTEIRA_CREDITO'
                              ? 'Esteira de Crédito'
                              : 'Pacote Avulso'}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-semibold text-slate-900">
                          {formatCurrency(net)}
                        </td>

                        <td className="py-3 px-4 text-right font-medium text-emerald-700">
                          {formatCurrency(received)}
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(openBalance)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                              title.status === 'QUITADO'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : title.status === 'PARCIALMENTE_RECEBIDO'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : title.status === 'EM_ATRASO'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {title.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => toggleRow(title.id)}
                            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline"
                          >
                            {installments.length} {installments.length === 1 ? 'parcela' : 'parcelas'}
                          </button>
                        </td>
                      </tr>

                      {/* Grade de Parcelas Desdobradas */}
                      {isExpanded && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={8} className="p-4 pl-12 border-y border-slate-200">
                            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                              <div className="mb-2 flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase text-slate-700">
                                  Grade de Parcelas & Histórico de Liquidações
                                </h4>
                                {title.partner && (
                                  <div className="text-[11px] text-slate-500">
                                    Originador:{' '}
                                    <strong className="text-slate-800">
                                      {title.partner.name}
                                    </strong>{' '}
                                    (PIX: {title.partner.pixKey || 'N/A'})
                                  </div>
                                )}
                              </div>

                              <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                                  <tr>
                                    <th className="py-1.5 px-3">Parcela</th>
                                    <th className="py-1.5 px-3">Vencimento</th>
                                    <th className="py-1.5 px-3 text-right">Valor Nominal</th>
                                    <th className="py-1.5 px-3 text-right">Baixado</th>
                                    <th className="py-1.5 px-3 text-right">Saldo Residual</th>
                                    <th className="py-1.5 px-3 text-center">Semáforo</th>
                                    <th className="py-1.5 px-3 text-right">Ações de Baixa</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {installments.map((inst: any) => {
                                    const sem = getInstallmentSemaphore(inst)
                                    const Icon = sem.icon
                                    const instAmount = Number(inst.amount)
                                    const instRec = Number(inst.receivedAmount)
                                    const residual = Math.max(0, instAmount - instRec)
                                    const receipts = inst.receipts || []

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

                                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                                          {formatCurrency(instRec)}
                                        </td>

                                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
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
                                          <div className="flex items-center justify-end gap-1.5">
                                            {/* Botão Baixar */}
                                            {residual > 0 && (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleOpenSettle(title, inst)}
                                                className="h-7 text-[11px] font-bold text-emerald-800 border-emerald-300 hover:bg-emerald-50 gap-1"
                                              >
                                                <DollarSign className="h-3 w-3" />
                                                Baixar
                                              </Button>
                                            )}

                                            {/* Botão Download Recibo PDF */}
                                            {receipts.length > 0 && (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={downloadingReceiptId === receipts[0].id}
                                                onClick={() => handleDownloadReceipt(receipts[0].id)}
                                                className="h-7 text-[11px] font-bold text-blue-700 border-blue-300 hover:bg-blue-50 gap-1"
                                                title="Baixar Recibo Oficial em PDF (336 DPI)"
                                              >
                                                <Download className="h-3 w-3" />
                                                Recibo PDF
                                              </Button>
                                            )}
                                          </div>
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

      {/* MODAL DE BAIXA DECLARATÓRIA */}
      <Dialog open={settleModalOpen} onOpenChange={setSettleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Landmark className="h-5 w-5 text-emerald-800" />
              Liquidação Declaratória de Parcela
            </DialogTitle>
          </DialogHeader>

          {selectedInstallment && selectedTitle && (
            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-lg bg-slate-50 p-3 space-y-1 border border-slate-200">
                <div className="font-bold text-slate-800">
                  {selectedTitle.producer?.name} • {selectedTitle.documentNumber}
                </div>
                <div className="text-slate-500">
                  Parcela {selectedInstallment.installmentNumber} de{' '}
                  {selectedInstallment.totalInstallments} • Vencimento:{' '}
                  {new Date(selectedInstallment.dueDate).toLocaleDateString('pt-BR', {
                    timeZone: 'UTC',
                  })}
                </div>
                <div className="text-slate-700 pt-1 font-semibold">
                  Saldo devedor desta parcela:{' '}
                  <span className="text-rose-600 font-bold">
                    {formatCurrency(
                      Math.max(
                        0,
                        Number(selectedInstallment.amount) -
                          Number(selectedInstallment.receivedAmount)
                      )
                    )}
                  </span>
                </div>
              </div>

              {/* Conta Bancária */}
              <div className="space-y-1.5">
                <Label htmlFor="bankAccount" className="text-xs font-semibold">
                  Conta Bancária de Crédito:
                </Label>
                <Select
                  value={settleBankAccountId}
                  onValueChange={(val) => setSettleBankAccountId(val || '')}
                >
                  <SelectTrigger id="bankAccount" className="w-full text-xs font-semibold bg-white border-slate-200">
                    <SelectValue placeholder="Selecione a conta de crédito" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        🏦 {b.bankName} (Ag. {b.agency || 'S/A'} - CC {b.accountNumber || 'S/N'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Valor da Baixa */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="settleAmount" className="text-xs font-semibold">
                    Valor a Baixar (R$):
                  </Label>
                  <Input
                    id="settleAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(parseFloat(e.target.value) || 0)}
                    className="font-bold text-emerald-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="settleDate" className="text-xs font-semibold">
                    Data da Liquidação:
                  </Label>
                  <Input
                    id="settleDate"
                    type="date"
                    value={settleDate}
                    onChange={(e) => setSettleDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Prévia de Destravamento de Comissão */}
              {commissionPreview && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px] uppercase">
                    <Clock className="h-3.5 w-3.5" />
                    Destravamento Proporcional da Trava (ADR-021)
                  </div>
                  <div className="text-[11px] text-amber-800">
                    Parceiro: <strong>{commissionPreview.partnerName}</strong>
                  </div>
                  <div className="text-[11px] text-amber-900 font-semibold">
                    Comissão liberada nesta baixa:{' '}
                    <span className="text-emerald-800 font-black">
                      {formatCurrency(commissionPreview.unlockAmount)}
                    </span>{' '}
                    (de {formatCurrency(commissionPreview.totalCommission)})
                  </div>
                </div>
              )}
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
              disabled={isSettling}
            >
              {isSettling ? 'Gravando...' : 'Confirmar Liquidação & Gerar Recibo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE ESTORNO COM JUSTIFICATIVA */}
      <Dialog open={reverseModalOpen} onOpenChange={setReverseModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-rose-800">
              <ShieldAlert className="h-5 w-5 text-rose-600" />
              Estorno de Liquidação Financeira
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-900">
              <p className="font-semibold">⚠️ Regra de Auditoria e Governança (ADR-023):</p>
              <p className="text-[11px] mt-1 text-rose-800">
                O estorno reverterá o saldo em conta corrente atomicamente, re-bloqueará a fração de
                comissão do parceiro, invalidará o recibo oficial e gerará registro perpétuo em{' '}
                <code>FinancialAuditLog</code>.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="justification" className="text-xs font-semibold">
                  Justificativa Formal do Estorno:
                </Label>
                <span
                  className={`text-[10px] font-bold ${
                    justification.length >= 15 ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {justification.length} / 15 caracteres mínimos
                </span>
              </div>
              <Textarea
                id="justification"
                placeholder="Exemplo: Lançamento efetuado em duplicidade pelo operador no caixa..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReverseModalOpen(false)}
              disabled={isReversing}
            >
              Cancelar
            </Button>
            <Button
              className="bg-rose-700 hover:bg-rose-800 text-white font-bold"
              onClick={handleConfirmReverse}
              disabled={isReversing || justification.trim().length < 15}
            >
              {isReversing ? 'Estornando...' : 'Confirmar Estorno Irreversível'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
