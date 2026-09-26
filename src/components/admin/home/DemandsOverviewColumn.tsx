'use client'

import React from 'react'
import Link from 'next/link'
import {
  ClipboardCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  Tractor,
  User,
  ShieldAlert,
} from 'lucide-react'
import { DemandItemSummary } from '@/actions/home-dashboard'
import { DemandSlaBadge } from '@/components/demands/DemandSlaBadge'
import { Button } from '@/components/ui/button'

interface DemandsOverviewColumnProps {
  metrics: {
    solicitado: number
    emExecucao: number
    aguardandoDocumentacao: number
    concluido: number
    totalAtivas: number
    overdueCount: number
    warning30Count: number
    recentDemands: DemandItemSummary[]
  }
}

export function DemandsOverviewColumn({ metrics }: DemandsOverviewColumnProps) {
  const hasCriticalAlerts = metrics.overdueCount > 0 || metrics.warning30Count > 0

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between h-full space-y-5">
      {/* Cabeçalho com Link Discreto */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1B4D3E] flex items-center justify-center border border-emerald-100/80">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              Acompanhamento de Demandas
            </h2>
            <p className="text-[11px] text-slate-500">Esteira operacional e ordens técnicas</p>
          </div>
        </div>

        <Link
          href="/admin/demands"
          prefetch={true}
          className="text-xs font-semibold text-[#1B4D3E] hover:text-[#13382D] flex items-center gap-1 group transition-colors"
        >
          <span>Abrir Kanban</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Régua Horizontal de Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
            Solicitado
          </span>
          <span className="text-lg font-black text-slate-700">{metrics.solicitado}</span>
        </div>

        <div className="bg-slate-900 border border-slate-900 rounded-xl p-3 text-center text-white">
          <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider block">
            Em Execução
          </span>
          <span className="text-lg font-black text-white">{metrics.emExecucao}</span>
        </div>

        <div className="bg-amber-50 border border-amber-200/70 rounded-xl p-3 text-center text-amber-900">
          <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
            Aguardando Doc.
          </span>
          <span className="text-lg font-black text-amber-900">
            {metrics.aguardandoDocumentacao}
          </span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200/70 rounded-xl p-3 text-center text-emerald-900">
          <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
            Concluído
          </span>
          <span className="text-lg font-black text-emerald-800">{metrics.concluido}</span>
        </div>
      </div>

      {/* Alerta de Prazo Crítico */}
      {hasCriticalAlerts ? (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-amber-950 block">Atenção a Prazos Operacionais</span>
              <span className="text-amber-800 text-[11px]">
                {metrics.overdueCount > 0 && (
                  <strong className="text-red-700 font-bold mr-2">
                    {metrics.overdueCount} atrasada(s)
                  </strong>
                )}
                {metrics.warning30Count > 0 && (
                  <span>{metrics.warning30Count} com prazo crítico (≤ 30 dias)</span>
                )}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-center gap-2 text-xs text-slate-500">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Todos os prazos da esteira estão regularizados e dentro do cronograma.</span>
        </div>
      )}

      {/* Lista Resumida das 3 Demandas Mais Urgentes/Recentes */}
      <div className="space-y-2.5 flex-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Demandas Prioritárias em Aberto
        </span>

        {metrics.recentDemands.length > 0 ? (
          <div className="space-y-2">
            {metrics.recentDemands.map((demand) => (
              <div
                key={demand.id}
                className="border border-slate-100 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-200 rounded-xl p-3 transition-colors flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {demand.producerName}
                    </span>
                    {demand.propertyName && (
                      <span className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                        <Tractor className="w-3 h-3 text-slate-400 shrink-0" />
                        {demand.propertyName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      {demand.serviceTypeLabel}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {demand.technicianName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <DemandSlaBadge sla={demand.sla} />
                  <Link href={`/admin/demands/${demand.id}`} prefetch={true}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2.5 text-xs text-[#1B4D3E] hover:bg-emerald-50 hover:text-[#13382D] font-semibold"
                    >
                      Ver
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Nenhuma demanda em aberto no momento. Fluxo totalmente regularizado.
          </div>
        )}
      </div>
    </div>
  )
}
