'use client'

import React from 'react'
import {
  Clock,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Play,
  Pause,
  Ban,
  CircleDot,
} from 'lucide-react'
import { DemandStatusCode } from '@/lib/validations/demands'
import { cn } from '@/lib/utils'

export interface DemandHistoryItem {
  id: string
  demandId: string
  userId: string
  fromStatus: DemandStatusCode | null
  toStatus: DemandStatusCode
  notes?: string | null
  createdAt: Date | string
  user?: {
    id: string
    fullName?: string | null
    email?: string | null
    avatarUrl?: string | null
  } | null
}

interface DemandTimelineProps {
  history: DemandHistoryItem[]
  className?: string
}

function getStatusBadge(status: DemandStatusCode | null) {
  if (!status) return null

  switch (status) {
    case 'SOLICITADO':
      return {
        label: 'Solicitado',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        dotColor: 'bg-blue-500',
      }
    case 'EM_EXECUCAO':
      return {
        label: 'Em Execução',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        dotColor: 'bg-purple-500',
      }
    case 'AGUARDANDO_DOCUMENTACAO':
      return {
        label: 'Aguardando Docs',
        color: 'bg-amber-50 text-amber-800 border-amber-200',
        dotColor: 'bg-amber-500',
      }
    case 'CONCLUIDO':
      return {
        label: 'Concluído',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotColor: 'bg-emerald-500',
      }
    case 'CANCELADO':
      return {
        label: 'Cancelado',
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        dotColor: 'bg-rose-500',
      }
    default:
      return {
        label: status,
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        dotColor: 'bg-slate-400',
      }
  }
}

export function DemandTimeline({ history, className }: DemandTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        Nenhum registro de histórico encontrado.
      </div>
    )
  }

  return (
    <div className={cn('relative pl-6 space-y-6', className)}>
      {/* Linha vertical conectora */}
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200" />

      {history.map((item, index) => {
        const toBadge = getStatusBadge(item.toStatus)
        const fromBadge = getStatusBadge(item.fromStatus)
        const userName = item.user?.fullName || item.user?.email?.split('@')[0] || 'Usuário do Sistema'

        const dateObj = new Date(item.createdAt)
        const formattedDate = dateObj.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
        const formattedTime = dateObj.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })

        return (
          <div key={item.id} className="relative flex items-start gap-3 group">
            {/* Ponto na timeline */}
            <div
              className={cn(
                'absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs z-10 transition-transform group-hover:scale-125',
                toBadge?.dotColor || 'bg-slate-400'
              )}
            />

            {/* Conteúdo do Card de Evento */}
            <div className="flex-1 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                {/* Transição de Status */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {fromBadge ? (
                    <>
                      <span
                        className={cn(
                          'text-[11px] font-semibold px-2 py-0.5 rounded-md border',
                          fromBadge.color
                        )}
                      >
                        {fromBadge.label}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span
                        className={cn(
                          'text-[11px] font-bold px-2 py-0.5 rounded-md border shadow-2xs',
                          toBadge?.color
                        )}
                      >
                        {toBadge?.label}
                      </span>
                    </>
                  ) : (
                    <span
                      className={cn(
                        'text-[11px] font-bold px-2 py-0.5 rounded-md border shadow-2xs',
                        toBadge?.color
                      )}
                    >
                      Abertura: {toBadge?.label}
                    </span>
                  )}
                </div>

                {/* Data e Hora */}
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formattedDate} às {formattedTime}
                  </span>
                </div>
              </div>

              {/* Responsável pela Ação */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800">{userName}</span>
                {item.user?.email && (
                  <span className="text-[11px] text-slate-400">({item.user.email})</span>
                )}
              </div>

              {/* Justificativa / Observação de Despacho */}
              {item.notes && (
                <div className="mt-2.5 text-xs text-slate-700 bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 shadow-2xs leading-relaxed font-normal">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                    <span>Despacho / Observação Registrada:</span>
                  </div>
                  <p className="text-slate-800 italic pl-5 border-l-2 border-amber-300">
                    "{item.notes}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
