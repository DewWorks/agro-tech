'use client'

import React, { useEffect, useState } from 'react'
import {
  X,
  History,
  ShieldCheck,
  FilePlus2,
  CheckCircle2,
  Users2,
  RotateCcw,
  Download,
  Building2,
  CreditCard,
  User,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import {
  getTitleAuditTimeline,
  type TitleAuditTimelineData,
  type AuditTimelineEvent,
  type AuditEventType,
} from '@/actions/financial/audit'
import { Button } from '@/components/ui/button'

interface FinancialAuditDrawerProps {
  isOpen: boolean
  onClose: () => void
  titleId: string | null
  type: 'RECEIVABLE' | 'PAYABLE'
  initialDocumentNumber?: string
  onDownloadReceipt?: (receiptId: string) => void
}

export default function FinancialAuditDrawer({
  isOpen,
  onClose,
  titleId,
  type,
  initialDocumentNumber,
  onDownloadReceipt,
}: FinancialAuditDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TitleAuditTimelineData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !titleId) {
      setData(null)
      setError(null)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    getTitleAuditTimeline(titleId, type)
      .then((res) => {
        if (!isMounted) return
        if (res.error) {
          setError(res.error)
        } else if (res.data) {
          setData(res.data)
        }
      })
      .catch((err) => {
        if (isMounted) setError(err?.message || 'Falha ao buscar auditoria.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, titleId, type])

  // Fecha com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getEventIconAndStyle = (eventType: AuditEventType) => {
    switch (eventType) {
      case 'CRIACAO':
        return {
          icon: FilePlus2,
          bg: 'bg-purple-100 text-purple-700 border-purple-200',
          dot: 'bg-purple-600',
          badge: 'bg-purple-50 text-purple-700 border-purple-200',
          badgeLabel: 'Criação / Origem',
        }
      case 'LIQUIDACAO':
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-600',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          badgeLabel: 'Baixa / Liquidação',
        }
      case 'COMISSAO':
        return {
          icon: Users2,
          bg: 'bg-amber-100 text-amber-700 border-amber-200',
          dot: 'bg-amber-600',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          badgeLabel: 'Comissão Destravada',
        }
      case 'ESTORNO':
        return {
          icon: RotateCcw,
          bg: 'bg-rose-100 text-rose-700 border-rose-200',
          dot: 'bg-rose-600',
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          badgeLabel: 'Estorno Operacional',
        }
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop com Blur suave */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-lg transform bg-white shadow-2xl transition-all duration-300 flex flex-col">
          {/* Header da Gaveta */}
          <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#113025] text-white shadow-xs">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">
                      Trilha de Auditoria & Observabilidade
                    </h2>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Enterprise Log
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Título: <span className="font-mono font-bold text-slate-700">{data?.documentNumber || initialDocumentNumber || 'S/N'}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                title="Fechar Gaveta"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sumário do Título */}
            {data && (
              <div className="mt-3.5 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {data.type === 'RECEIVABLE' ? 'Produtor / Sacado' : 'Fornecedor / Favorecido'}
                  </span>
                  <p className="font-bold text-slate-800 truncate max-w-[200px]">
                    {data.entityName}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Valor Total</span>
                  <p className="font-black text-slate-900">
                    {formatCurrency(data.totalAmount)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Conteúdo / Timeline Cronológica */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {loading && (
              <div className="space-y-6 py-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="h-9 w-9 rounded-full bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-36 bg-slate-200 rounded" />
                      <div className="h-16 w-full bg-slate-100 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!loading && !error && data && data.events.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400">
                <History className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                Nenhum evento auditado registrado para este título.
              </div>
            )}

            {!loading && !error && data && data.events.length > 0 && (
              <div className="relative pl-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                <div className="space-y-6">
                  {data.events.map((event) => {
                    const style = getEventIconAndStyle(event.type)
                    const Icon = style.icon
                    const eventDate = new Date(event.timestamp)

                    return (
                      <div key={event.id} className="relative group">
                        {/* Ponto / Ícone Conectado da Timeline */}
                        <div
                          className={cn(
                            'absolute -left-6 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white shadow-xs',
                            style.bg
                          )}
                        >
                          <Icon className="h-3 w-3" />
                        </div>

                        {/* Card do Evento */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all">
                          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                            <div>
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border uppercase',
                                  style.badge
                                )}
                              >
                                {style.badgeLabel}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 mt-1">
                                {event.title}
                              </h4>
                            </div>

                            {event.amount !== undefined && (
                              <div className="text-right">
                                <span className="text-xs font-black text-slate-900">
                                  {formatCurrency(event.amount)}
                                </span>
                                {event.remainingBalance !== undefined && event.remainingBalance > 0 && (
                                  <p className="text-[10px] font-medium text-amber-700">
                                    Restam: {formatCurrency(event.remainingBalance)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                            {event.description}
                          </p>

                          {/* Justificativa de Estorno (se houver) */}
                          {event.reversalReason && (
                            <div className="mt-2.5 rounded-lg border border-rose-200 bg-rose-50/70 p-2.5 text-xs text-rose-900">
                              <span className="font-bold">Motivo do Estorno:</span>{' '}
                              {event.reversalReason}
                            </div>
                          )}

                          {/* Detalhes de Conta e Parceiro */}
                          <div className="mt-3 grid grid-cols-1 gap-1.5 text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                            {event.bankAccountName && (
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span>Conta: <strong className="text-slate-700">{event.bankAccountName}</strong></span>
                              </div>
                            )}

                            {event.partnerName && (
                              <div className="flex items-center gap-1.5">
                                <Users2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                <span>
                                  Parceiro: <strong className="text-slate-800">{event.partnerName}</strong>{' '}
                                  • PIX: <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[10px]">{event.pixKey}</code>
                                </span>
                              </div>
                            )}

                            {/* Operador Responsável */}
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <User className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                              <span>
                                Operador: <strong className="text-slate-800">{event.operator?.name || 'Sistema'}</strong>{' '}
                                <span className="text-slate-400">({event.operator?.email || 'automático'})</span>
                              </span>
                            </div>

                            {/* Timestamp exato */}
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span>
                                {eventDate.toLocaleDateString('pt-BR')} às{' '}
                                {eventDate.toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Link de Download do Recibo de Quitação */}
                          {event.receiptId && (
                            <div className="mt-3 pt-2.5 border-t border-slate-100">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (onDownloadReceipt && event.receiptId) {
                                    onDownloadReceipt(event.receiptId)
                                  }
                                }}
                                className="h-7 text-[11px] font-bold text-blue-700 border-blue-300 hover:bg-blue-50 gap-1.5 w-full justify-center"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Baixar Recibo Oficial ({event.receiptNumber || 'PDF'})
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Rodapé da Gaveta */}
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-3.5 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
              Observabilidade e Trilha de Auditoria Ativa
            </span>
            <Button size="sm" variant="outline" onClick={onClose} className="h-8 text-xs font-semibold">
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
