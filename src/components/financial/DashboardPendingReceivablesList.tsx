'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  User,
  ExternalLink,
} from 'lucide-react'
import { formatCurrency, maskDocument } from '@/lib/utils'
import SettleReceivableModal from './modals/SettleReceivableModal'

export interface DashboardPendingReceivable {
  id: string
  documentNumber: string
  serviceSubtype?: string | null
  originType: string
  grossAmount: number
  netAmount: number
  totalReceivedAmount: number
  status: string
  producer: {
    id: string
    name: string
    document: string
  }
  partner?: {
    id: string
    name: string
  } | null
  installments: Array<{
    id: string
    installmentNumber: number
    totalInstallments: number
    dueDate: string | Date
    amount: number
    receivedAmount: number
    status: string
  }>
  commissions?: Array<{
    id: string
    totalCommissionAmount: number
    status: string
  }>
}

interface DashboardPendingReceivablesListProps {
  pendingTitles: DashboardPendingReceivable[]
  bankAccounts: Array<{
    id: string
    bankName: string
    agency?: string | null
    accountNumber?: string | null
  }>
}

export default function DashboardPendingReceivablesList({
  pendingTitles,
  bankAccounts,
}: DashboardPendingReceivablesListProps) {
  const router = useRouter()
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false)
  const [selectedTitle, setSelectedTitle] = useState<DashboardPendingReceivable | null>(null)
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null)

  const handleOpenSettle = (title: DashboardPendingReceivable) => {
    // Localiza a primeira parcela em aberto ou a própria parcela ativa
    const firstOpenInstallment =
      title.installments.find(
        (inst) => inst.status === 'A_VENCER' || inst.status === 'EM_ATRASO' || inst.status === 'VENCE_HOJE'
      ) || title.installments[0]

    setSelectedTitle(title)
    setSelectedInstallment(firstOpenInstallment)
    setIsSettleModalOpen(true)
  }

  const handleSettleSuccess = () => {
    setIsSettleModalOpen(false)
    setSelectedTitle(null)
    setSelectedInstallment(null)
    router.refresh()
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      {/* Cabeçalho do Bloco */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Radar de Cobranças e Títulos Pendentes
            </h3>
            {pendingTitles.length > 0 && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                {pendingTitles.length} pendente{pendingTitles.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Honorários a receber em aberto com liquidação e destravamento declaratório imediato
          </p>
        </div>
        <Link
          href="/admin/financial/receivables"
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-900 transition-colors"
        >
          <span>Ver Contas a Receber Completo</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Conteúdo / Tabela de Cobrança Rápida */}
      <div className="mt-4">
        {pendingTitles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl bg-emerald-50/60 border border-dashed border-emerald-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-3 shadow-xs">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-emerald-900">
              🟢 Todos os honorários previstos estão 100% quitados!
            </h4>
            <p className="text-xs text-emerald-700 max-w-md mt-1">
              Excelente controle de tesouraria: nenhum título a receber pendente de pagamento no período.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Produtor & Documento</th>
                  <th className="py-2.5 px-3">Origem / Demanda</th>
                  <th className="py-2.5 px-3">Vencimento</th>
                  <th className="py-2.5 px-3 text-right">Saldo em Aberto</th>
                  <th className="py-2.5 px-3 text-center">Ação Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingTitles.map((title) => {
                  const residual = Math.max(0, title.netAmount - title.totalReceivedAmount)
                  const firstInstallment = title.installments[0]
                  const dueDate = firstInstallment?.dueDate
                    ? new Date(firstInstallment.dueDate)
                    : null

                  let isOverdue = false
                  let isToday = false
                  if (dueDate) {
                    const d = new Date(dueDate)
                    d.setHours(0, 0, 0, 0)
                    if (d.getTime() < today.getTime()) isOverdue = true
                    else if (d.getTime() === today.getTime()) isToday = true
                  }

                  const originLabel =
                    title.serviceSubtype === 'PROJETO_CUSTEIO'
                      ? 'Projeto de Custeio — Banco do Brasil'
                      : title.serviceSubtype === 'PROJETO_INVESTIMENTO'
                      ? 'Projeto de Investimento Rural'
                      : title.serviceSubtype || 'Honorários Técnicos'

                  return (
                    <tr
                      key={title.id}
                      className="group transition-colors hover:bg-slate-50/80"
                    >
                      {/* Produtor Rural & CPF */}
                      <td className="py-3 px-3">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 rounded-md bg-emerald-100/70 p-1 text-emerald-800 shrink-0">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-emerald-950">
                              {title.producer.name}
                            </span>
                            <div className="text-[11px] text-slate-500">
                              {maskDocument(title.producer.document)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Origem e Título */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{originLabel}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <FileText className="h-3 w-3" />
                          <span>{title.documentNumber}</span>
                          {title.partner && (
                            <span className="text-amber-800 font-medium">
                              • Indicação: {title.partner.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Vencimento e Semáforo */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700">
                            {dueDate
                              ? dueDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                              : 'A definir'}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {title.status === 'PARCIALMENTE_RECEBIDO' || (title.totalReceivedAmount > 0 && residual > 0) ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                              <Clock className="h-2.5 w-2.5" />
                              PARCIALMENTE_RECEBIDO
                            </span>
                          ) : isOverdue ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              EM ATRASO
                            </span>
                          ) : isToday ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              <Clock className="h-2.5 w-2.5" />
                              VENCE HOJE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              A VENCER
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Saldo a Receber */}
                      <td className="py-3 px-3 text-right">
                        <div className="text-sm font-black text-slate-900">
                          {formatCurrency(residual)}
                        </div>
                        {title.totalReceivedAmount > 0 ? (
                          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                            {title.netAmount > 0
                              ? `${((title.totalReceivedAmount / title.netAmount) * 100).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 1,
                                })}% liquidado`
                              : ''}{' '}
                            ({formatCurrency(title.totalReceivedAmount)} de {formatCurrency(title.netAmount)})
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            0% liquidado
                          </div>
                        )}
                      </td>

                      {/* Ação Rápida */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenSettle(title)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#113025] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#184535] active:scale-95"
                          title="Dar baixa e emitir recibo imediatamente"
                        >
                          <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-300" />
                          <span>Dar Baixa Declaratória</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Reativo de Liquidação Integrado */}
      {selectedTitle && selectedInstallment && (
        <SettleReceivableModal
          key={selectedInstallment.id}
          isOpen={isSettleModalOpen}
          onClose={() => setIsSettleModalOpen(false)}
          selectedTitle={selectedTitle}
          selectedInstallment={selectedInstallment}
          bankAccounts={bankAccounts}
          onSuccess={handleSettleSuccess}
        />
      )}
    </div>
  )
}
