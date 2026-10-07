'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  PlusCircle,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ListFilter,
  History,
  ShieldCheck,
  User,
} from 'lucide-react'
import { formatCurrency, formatCPF, formatCNPJ, cn } from '@/lib/utils'
import { getQuittanceReceiptData } from '@/actions/financial/receivables'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useReceivablesFilter } from './hooks/useReceivablesFilter'
import SettleReceivableModal from './modals/SettleReceivableModal'
import ReverseReceivableModal from './modals/ReverseReceivableModal'
import FinancialAuditDrawer from '@/components/financial/audit/FinancialAuditDrawer'

const RECEIVABLE_STATUS_OPTIONS = [
  { value: 'TODOS', label: 'Status: Todos', icon: ListFilter, iconColor: 'text-slate-500' },
  { value: 'PENDENTE', label: 'Pendentes', icon: Clock, iconColor: 'text-amber-500' },
  { value: 'PARCIALMENTE_RECEBIDO', label: 'Parcialmente Recebidos', icon: Clock, iconColor: 'text-blue-500' },
  { value: 'QUITADO', label: 'Quitados', icon: CheckCircle2, iconColor: 'text-emerald-600' },
  { value: 'EM_ATRASO', label: 'Em Atraso', icon: AlertTriangle, iconColor: 'text-rose-600' },
]

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
  const router = useRouter()
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredTitles,
  } = useReceivablesFilter(titles)

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  // Modais sob demanda
  const [settleModalOpen, setSettleModalOpen] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<any | null>(null)
  const [selectedTitle, setSelectedTitle] = useState<any | null>(null)

  const [reverseModalOpen, setReverseModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null)

  // Download do PDF de Recibo
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null)

  // Gaveta Lateral de Auditoria & Observabilidade
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

  const handleOpenSettle = (title: any, installment: any) => {
    setSelectedTitle(title)
    setSelectedInstallment(installment)
    setSettleModalOpen(true)
  }

  const handleOpenReverse = (tx: any) => {
    setSelectedTransaction(tx)
    setReverseModalOpen(true)
  }

  // Download sob demanda (code-split) de PDF
  const handleDownloadReceipt = async (receiptId: string) => {
    setDownloadingReceiptId(receiptId)
    const toastId = toast.loading('Compilando Recibo Oficial em Alta Resolução (336 DPI)...')

    try {
      const { triggerQuittanceReceiptDownload } = await import(
        '@/components/financial/QuittanceReceiptPdfTemplate'
      )
      const res = await getQuittanceReceiptData(receiptId)
      if (res.error || !res.data) {
        toast.dismiss(toastId)
        toast.error(res.error || 'Erro ao carregar dados do recibo.')
        return
      }

      const receipt = res.data
      const title = receipt.installment.receivableTitle
      const snapshot = receipt.payloadSnapshot as any

      const pdfData = {
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
          document: title.producer?.document || '000.000.000-00',
          phone: title.producer?.phone,
        },
        property: title.property
          ? {
              name: title.property.name,
              city: title.property.city,
              state: title.property.state,
            }
          : undefined,
        title: {
          documentNumber: title.documentNumber,
          serviceSubtype: title.serviceSubtype || title.category?.name || 'Serviços Técnicos e Honorários',
          cropYear: title.cropYear || '2025/2026',
          originType: title.originType || 'ESTEIRA_CREDITO',
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
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'TODOS')}>
            <SelectTrigger className="h-9 w-[210px] text-xs font-semibold bg-white border-slate-200">
              <SelectValue placeholder="Status: Todos">
                {(() => {
                  const opt = RECEIVABLE_STATUS_OPTIONS.find((o) => o.value === statusFilter) || RECEIVABLE_STATUS_OPTIONS[0]
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
              {RECEIVABLE_STATUS_OPTIONS.map((opt) => {
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
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => toggleRow(title.id)}
                              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline"
                            >
                              {installments.length} {installments.length === 1 ? 'parcela' : 'parcelas'}
                            </button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenAudit(title.id, title.documentNumber)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg"
                              title="Abrir Trilha de Auditoria Integral"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
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
                                          <div>Parcela {inst.installmentNumber}/{inst.totalInstallments}</div>
                                          {instRec > 0 && (
                                            <div className="text-[10px] text-slate-500 font-normal mt-0.5 flex flex-wrap items-center gap-1">
                                              <span className="inline-flex items-center gap-1">
                                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                                <span>Baixa: <strong className="text-slate-700">{inst.settlementOperator?.name || 'Operador'}</strong></span>
                                              </span>
                                              <span>•</span>
                                              <span>{inst.bankAccount?.bankName || 'Caixa'}</span>
                                              {inst.receivedAt && (
                                                <>
                                                  <span>•</span>
                                                  <span>{new Date(inst.receivedAt).toLocaleDateString('pt-BR')}</span>
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

      {/* Modais Montados Sob Demanda */}
      {settleModalOpen && (
        <SettleReceivableModal
          isOpen={settleModalOpen}
          onClose={() => setSettleModalOpen(false)}
          selectedTitle={selectedTitle}
          selectedInstallment={selectedInstallment}
          bankAccounts={bankAccounts}
          onSuccess={(receiptId) => {
            router.refresh()
            if (receiptId) {
              handleDownloadReceipt(receiptId)
            }
          }}
        />
      )}

      {reverseModalOpen && (
        <ReverseReceivableModal
          isOpen={reverseModalOpen}
          onClose={() => setReverseModalOpen(false)}
          selectedTransaction={selectedTransaction}
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
        type="RECEIVABLE"
        initialDocumentNumber={selectedAuditDocNumber}
        onDownloadReceipt={(receiptId) => handleDownloadReceipt(receiptId)}
      />
    </div>
  )
}
