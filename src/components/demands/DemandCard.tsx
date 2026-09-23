'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  User,
  Home,
  FileText,
  Clock,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  ChevronRight,
  ArrowRight,
  Building2,
  Calendar,
  FileCheck2,
  Ban,
  ExternalLink,
} from 'lucide-react'
import { DemandSlaBadge, SlaInfo } from './DemandSlaBadge'
import { CancelDemandModal } from './CancelDemandModal'
import { RURAL_SERVICES_CATALOG, RuralServiceTypeCode, DemandStatusCode } from '@/lib/validations/demands'
import { cn } from '@/lib/utils'

export interface DemandCardData {
  id: string
  serviceType: RuralServiceTypeCode
  customServiceType?: string | null
  status: DemandStatusCode
  priority: string
  description?: string | null
  requestDate: Date | string
  startDate?: Date | string | null
  estimatedDeliveryDate?: Date | string | null
  completionDate?: Date | string | null
  proposalId?: string | null
  responsibleName?: string | null
  producer: {
    id: string
    name: string
    document?: string | null
    phone?: string | null
  }
  property?: {
    id: string
    name: string
    propertyName?: string | null
    city?: string | null
    state?: string | null
  } | null
  creator?: {
    id: string
    fullName?: string | null
    email?: string | null
    avatarUrl?: string | null
  } | null
  assignedTo?: {
    id: string
    fullName?: string | null
    email?: string | null
    avatarUrl?: string | null
  } | null
  document?: {
    id: string
    fileName: string
    storagePath: string
    documentType?: string | null
  } | null
  sla: SlaInfo
  checklistSummary: {
    total: number
    delivered: number
    pending: number
    percentage: number
  }
}

interface DemandCardProps {
  demand: DemandCardData
  onMoveStatus?: (id: string, targetStatus: DemandStatusCode) => void
  onRefresh?: () => void
  isDragging?: boolean
}

export function DemandCard({ demand, onMoveStatus, onRefresh, isDragging = false }: DemandCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)

  const serviceMeta = RURAL_SERVICES_CATALOG[demand.serviceType]
  const serviceTitle =
    demand.serviceType === 'OUTROS' && demand.customServiceType
      ? demand.customServiceType
      : serviceMeta?.label || demand.serviceType

  const formattedRequestDate = new Date(demand.requestDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })

  const propertyDisplayName = demand.property?.name || demand.property?.propertyName || 'Sem fazenda vinculada'
  const propertyLocation =
    demand.property?.city && demand.property?.state
      ? `${demand.property.city} - ${demand.property.state}`
      : null

  const creatorName = demand.creator?.fullName || demand.creator?.email?.split('@')[0] || 'Sistema'
  const assigneeName = demand.assignedTo?.fullName || demand.responsibleName || 'Não atribuído'

  // Próximo status rápido sugerido no workflow
  let nextAction: { label: string; status: DemandStatusCode } | null = null
  if (demand.status === 'SOLICITADO') {
    nextAction = { label: 'Iniciar Atendimento', status: 'EM_EXECUCAO' }
  } else if (demand.status === 'EM_EXECUCAO') {
    nextAction = { label: 'Aguardar Docs', status: 'AGUARDANDO_DOCUMENTACAO' }
  } else if (demand.status === 'AGUARDANDO_DOCUMENTACAO') {
    nextAction = { label: 'Retomar Execução', status: 'EM_EXECUCAO' }
  }

  // Link para WhatsApp do produtor se houver telefone
  const cleanPhone = demand.producer.phone ? demand.producer.phone.replace(/\D/g, '') : null
  const whatsappUrl = cleanPhone
    ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
        `Olá ${demand.producer.name}, sobre a sua demanda de ${serviceTitle} na AgroTech...`
      )}`
    : null

  return (
    <>
      <div
        className={cn(
          'group relative bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden',
          isDragging ? 'opacity-50 ring-2 ring-emerald-500 shadow-xl' : 'hover:border-slate-300'
        )}
      >
        {/* Faixa superior com Tipo de Serviço e Menu */}
        <div className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 truncate max-w-full">
                {serviceTitle}
              </span>
            </div>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Opções"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                    <Link
                      href={`/admin/demands/${demand.id}`}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      Ver Central da Demanda
                    </Link>
                    <Link
                      href={`/admin/demands/${demand.id}/edit`}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Editar Informações
                    </Link>
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Conversar no WhatsApp
                      </a>
                    )}
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        setCancelModalOpen(true)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <Ban className="w-3.5 h-3.5 text-rose-500" />
                      Cancelar Demanda...
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Produtor e Propriedade */}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1">
              <Link
                href={`/admin/crm/${demand.producer.id}`}
                className="font-bold text-slate-900 text-sm hover:text-emerald-700 transition-colors truncate"
                title={demand.producer.name}
              >
                {demand.producer.name}
              </Link>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                  title="Falar no WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate" title={propertyDisplayName}>
              <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{propertyDisplayName}</span>
              {propertyLocation && (
                <span className="text-[10px] text-slate-400 shrink-0">({propertyLocation})</span>
              )}
            </div>
          </div>

          {/* Vínculo de Proposta ou Documento do Dossiê */}
          {(demand.proposalId || demand.document) && (
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              {demand.proposalId && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
                  <FileCheck2 className="w-3 h-3 text-indigo-500" />
                  Prop: {demand.proposalId}
                </span>
              )}
              {demand.document && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200/60 px-2 py-0.5 rounded-md truncate max-w-[180px]">
                  <FileText className="w-3 h-3 text-sky-500" />
                  Doc: {demand.document.fileName}
                </span>
              )}
            </div>
          )}

          {/* Metadados de Autoria & Atribuição */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1 text-[11px] text-slate-500">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Criado por:</span>
              <span className="font-medium text-slate-700 truncate max-w-[140px]" title={creatorName}>
                {creatorName} em {formattedRequestDate}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Responsável:</span>
              <span
                className={cn(
                  'font-medium truncate max-w-[140px]',
                  demand.assignedTo ? 'text-slate-800 font-semibold' : 'text-slate-400 italic'
                )}
                title={assigneeName}
              >
                {assigneeName}
              </span>
            </div>
          </div>

          {/* Barra de Progresso do Checklist Documental */}
          {demand.checklistSummary.total > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                <span className="text-slate-500">Documentação GED</span>
                <span
                  className={cn(
                    demand.checklistSummary.delivered === demand.checklistSummary.total
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  )}
                >
                  {demand.checklistSummary.delivered}/{demand.checklistSummary.total} entregues
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-300 rounded-full',
                    demand.checklistSummary.percentage === 100
                      ? 'bg-emerald-500'
                      : demand.checklistSummary.percentage >= 50
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  )}
                  style={{ width: `${demand.checklistSummary.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com SLA e Ação Rápida */}
        <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
          <DemandSlaBadge sla={demand.sla} />

          {nextAction && onMoveStatus && (
            <button
              type="button"
              onClick={() => onMoveStatus(demand.id, nextAction!.status)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-emerald-700 bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-200 rounded-lg shadow-2xs transition-all active:scale-95"
              title={`Mover para ${nextAction.status}`}
            >
              <span>{nextAction.label}</span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
            </button>
          )}

          {!nextAction && (
            <Link
              href={`/admin/demands/${demand.id}`}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
            >
              <span>Detalhes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      <CancelDemandModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        demandId={demand.id}
        demandTitle={`${serviceTitle} - ${demand.producer.name}`}
        onSuccess={() => {
          if (onRefresh) onRefresh()
        }}
      />
    </>
  )
}
