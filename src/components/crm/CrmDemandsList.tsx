'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ClipboardList,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  FileClock,
  ExternalLink,
  Loader2,
  Calendar,
  User,
  Paperclip,
} from 'lucide-react'
import { getDemands } from '@/actions/demands'
import {
  RURAL_SERVICES_CATALOG,
  RuralServiceTypeCode,
  DemandStatusCode,
} from '@/lib/validations/demands'
import { cn } from '@/lib/utils'

interface CrmDemandsListProps {
  producerId?: string
  producerName?: string
  propertyId?: string
  propertyName?: string
  initialDemands?: any[]
}

function getStatusBadge(status: DemandStatusCode) {
  switch (status) {
    case 'SOLICITADO':
      return {
        label: 'Solicitado',
        className: 'bg-slate-100 text-slate-700 border-slate-300',
        icon: Clock,
      }
    case 'EM_EXECUCAO':
      return {
        label: 'Em Execução',
        className: 'bg-slate-900 text-white border-slate-900',
        icon: PlayCircle,
      }
    case 'AGUARDANDO_DOCUMENTACAO':
      return {
        label: 'Aguardando Docs',
        className: 'bg-amber-50 text-amber-900 border-amber-300',
        icon: FileClock,
      }
    case 'CONCLUIDO':
      return {
        label: 'Concluído',
        className: 'bg-emerald-50 text-emerald-900 border-emerald-300',
        icon: CheckCircle2,
      }
    case 'CANCELADO':
      return {
        label: 'Cancelado',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: AlertTriangle,
      }
    default:
      return {
        label: status,
        className: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: Clock,
      }
  }
}

export function CrmDemandsList({
  producerId,
  producerName,
  propertyId,
  propertyName,
  initialDemands,
}: CrmDemandsListProps) {
  const [demands, setDemands] = useState<any[]>(initialDemands || [])
  const [loading, setLoading] = useState(!initialDemands)

  useEffect(() => {
    if (!initialDemands && (producerId || propertyId)) {
      setLoading(true)
      getDemands({
        producerId: producerId || undefined,
        propertyId: propertyId || undefined,
        includeCancelled: true,
      })
        .then((res) => {
          if (res.success && res.demands) {
            setDemands(res.demands)
          }
        })
        .finally(() => setLoading(false))
    }
  }, [producerId, propertyId, initialDemands])

  // Parâmetros para criar nova demanda pré-preenchendo os seletores
  const newDemandUrl = `/admin/demands/new?${[
    producerId ? `producerId=${encodeURIComponent(producerId)}` : '',
    propertyId ? `propertyId=${encodeURIComponent(propertyId)}` : '',
  ]
    .filter(Boolean)
    .join('&')}`

  return (
    <div className="space-y-4">
      {/* Cabeçalho da Lista 360º */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#1B4D3E]" />
            <h3 className="font-bold text-[#1B4D3E] text-base">
              Ordens de Serviço & Demandas Rurais
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {demands.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {propertyName
              ? `Projetos técnicos e esteira de crédito vinculados à fazenda ${propertyName}.`
              : producerName
              ? `Histórico de atendimentos e serviços contratados por ${producerName}.`
              : 'Visão 360º de demandas técnicas e esteira documental.'}
          </p>
        </div>

        <Link
          href={newDemandUrl}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs active:scale-95 shrink-0 self-start sm:self-center cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nova Demanda</span>
        </Link>
      </div>

      {/* Conteúdo: Tabela ou Estado Vazio */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-xs">Carregando demandas vinculadas...</span>
        </div>
      ) : demands.length === 0 ? (
        <div className="p-10 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="font-bold text-slate-800 text-sm">
              Nenhuma demanda registrada
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Abra uma nova ordem de serviço técnico, projeto de custeio bancário ou solicitação ambiental para este cliente.
            </p>
          </div>
          <Link
            href={newDemandUrl}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Criar Primeira Demanda</span>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-2xs bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Serviço Solicitado</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Responsável Técnico</th>
                <th className="py-3 px-4">Checklist GED</th>
                <th className="py-3 px-4">Previsão & SLA</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {demands.map((demand) => {
                const statusMeta = getStatusBadge(demand.status)
                const StatusIcon = statusMeta.icon
                const serviceMeta =
                  RURAL_SERVICES_CATALOG[demand.serviceType as RuralServiceTypeCode]
                const serviceTitle =
                  demand.serviceType === 'OUTROS' && demand.customServiceType
                    ? demand.customServiceType
                    : serviceMeta?.label || demand.serviceType

                const formattedEstimatedDate = demand.estimatedDeliveryDate
                  ? new Date(demand.estimatedDeliveryDate).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : 'Não definida'

                const checklist = demand.checklistSummary || {
                  total: 0,
                  delivered: 0,
                  percentage: 100,
                }

                return (
                  <tr
                    key={demand.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Serviço */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-emerald-800 transition-colors">
                        {serviceTitle}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        {demand.proposalId && (
                          <span className="font-mono text-slate-500">
                            Prop: {demand.proposalId}
                          </span>
                        )}
                        {demand.property && (
                          <span>
                            Fazenda: {demand.property.name || demand.property.propertyName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border',
                          statusMeta.className
                        )}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{statusMeta.label}</span>
                      </span>
                    </td>

                    {/* Responsável */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium text-slate-700">
                          {demand.assignedTo?.fullName ||
                            demand.responsibleName ||
                            'Não atribuído'}
                        </span>
                      </div>
                    </td>

                    {/* Checklist GED */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {checklist.total > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
                            <Paperclip className="w-3 h-3 text-slate-400" />
                            <span>
                              {checklist.delivered}/{checklist.total} docs
                            </span>
                            <span className="text-slate-400">({checklist.percentage}%)</span>
                          </div>
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full rounded-full transition-all"
                              style={{ width: `${checklist.percentage}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Sem pendências</span>
                      )}
                    </td>

                    {/* SLA / Previsão */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formattedEstimatedDate}</span>
                      </div>
                      {demand.sla && (
                        <div className="mt-0.5">
                          <span
                            className={cn(
                              'text-[10px] font-bold px-1.5 py-0.2 rounded border',
                              demand.sla.badgeColor
                            )}
                          >
                            {demand.sla.label}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Ação */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/demands/${demand.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 hover:border-emerald-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                        title="Abrir Central da Demanda"
                      >
                        <span>Acessar</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-700" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
