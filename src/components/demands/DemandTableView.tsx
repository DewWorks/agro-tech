'use client'

import React from 'react'
import Link from 'next/link'
import { DemandCardData } from './DemandCard'
import { DemandSlaBadge } from './DemandSlaBadge'
import { RURAL_SERVICES_CATALOG } from '@/lib/validations/demands'
import {
  FileText,
  Home,
  User,
  ArrowRight,
  ExternalLink,
  MessageCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DemandTableViewProps {
  demands: DemandCardData[]
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'SOLICITADO':
      return { label: 'Solicitado', cls: 'bg-blue-50 text-blue-700 border-blue-200' }
    case 'EM_EXECUCAO':
      return { label: 'Em Execução', cls: 'bg-purple-50 text-purple-700 border-purple-200' }
    case 'AGUARDANDO_DOCUMENTACAO':
      return { label: 'Aguardando Docs', cls: 'bg-amber-50 text-amber-800 border-amber-200' }
    case 'CONCLUIDO':
      return { label: 'Concluído', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    case 'CANCELADO':
      return { label: 'Cancelado', cls: 'bg-rose-50 text-rose-700 border-rose-200' }
    default:
      return { label: status, cls: 'bg-slate-100 text-slate-700 border-slate-200' }
  }
}

export function DemandTableView({ demands }: DemandTableViewProps) {
  if (demands.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
        Nenhuma demanda encontrada para os filtros selecionados.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
            <tr>
              <th className="py-3.5 px-4">Serviço & Proposta</th>
              <th className="py-3.5 px-4">Produtor Rural</th>
              <th className="py-3.5 px-4">Propriedade</th>
              <th className="py-3.5 px-4">Criador & Abertura</th>
              <th className="py-3.5 px-4">Responsável Técnico</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">SLA / Prazo</th>
              <th className="py-3.5 px-4">Checklist GED</th>
              <th className="py-3.5 px-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {demands.map((demand) => {
              const serviceMeta = RURAL_SERVICES_CATALOG[demand.serviceType]
              const serviceTitle =
                demand.serviceType === 'OUTROS' && demand.customServiceType
                  ? demand.customServiceType
                  : serviceMeta?.label || demand.serviceType

              const statusBadge = getStatusBadge(demand.status)
              const propertyName = demand.property?.name || demand.property?.propertyName || '—'
              const creatorName = demand.creator?.fullName || demand.creator?.email?.split('@')[0] || 'Sistema'
              const assigneeName = demand.assignedTo?.fullName || demand.responsibleName || 'Não atribuído'

              const formattedDate = new Date(demand.requestDate).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })

              return (
                <tr key={demand.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Serviço & Proposta */}
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/admin/demands/${demand.id}`}
                      className="font-bold text-slate-900 hover:text-emerald-700 transition-colors block"
                    >
                      {serviceTitle}
                    </Link>
                    {demand.proposalId && (
                      <span className="inline-block mt-0.5 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.2 rounded">
                        Prop: {demand.proposalId}
                      </span>
                    )}
                  </td>

                  {/* Produtor */}
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/admin/crm/${demand.producer.id}/edit`}
                      className="font-semibold text-slate-900 hover:text-emerald-700 transition-colors"
                      title={`Ver cadastro de ${demand.producer.name} no CRM`}
                    >
                      {demand.producer.name}
                    </Link>
                  </td>

                  {/* Propriedade */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {demand.property?.id ? (
                        <Link
                          href={`/admin/crm/properties/${demand.property.id}/edit`}
                          className="truncate max-w-[150px] hover:text-emerald-700 hover:underline transition-colors"
                          title={propertyName}
                        >
                          {propertyName}
                        </Link>
                      ) : (
                        <span className="truncate max-w-[150px]" title={propertyName}>
                          {propertyName}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Criador & Data */}
                  <td className="py-3.5 px-4 text-slate-500">
                    <div className="font-medium text-slate-700">{creatorName}</div>
                    <div className="text-[11px] text-slate-400">{formattedDate}</div>
                  </td>

                  {/* Responsável Técnico */}
                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        'font-medium',
                        demand.assignedTo ? 'text-slate-800 font-semibold' : 'text-slate-400 italic'
                      )}
                    >
                      {assigneeName}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        'inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border',
                        statusBadge.cls
                      )}
                    >
                      {statusBadge.label}
                    </span>
                  </td>

                  {/* SLA */}
                  <td className="py-3.5 px-4">
                    <DemandSlaBadge sla={demand.sla} />
                  </td>

                  {/* Checklist GED */}
                  <td className="py-3.5 px-4">
                    {demand.checklistSummary.total > 0 ? (
                      <span
                        className={cn(
                          'font-semibold text-[11px]',
                          demand.checklistSummary.delivered === demand.checklistSummary.total
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        )}
                      >
                        {demand.checklistSummary.delivered}/{demand.checklistSummary.total} (
                        {demand.checklistSummary.percentage}%)
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>

                  {/* Ação */}
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/admin/demands/${demand.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      <span>Ver</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
