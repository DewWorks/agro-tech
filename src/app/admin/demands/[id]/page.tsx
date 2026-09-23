import React from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getDemandById } from '@/actions/demands'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { DemandStatusStepper } from '@/components/demands/DemandStatusStepper'
import { DemandTimeline } from '@/components/demands/DemandTimeline'
import { DemandChecklistSection } from '@/components/demands/DemandChecklistSection'
import { DemandSlaBadge } from '@/components/demands/DemandSlaBadge'
import { RURAL_SERVICES_CATALOG, RuralServiceTypeCode } from '@/lib/validations/demands'
import {
  ArrowLeft,
  Edit,
  User,
  Home,
  FileText,
  Calendar,
  Building2,
  Clock,
  History,
  CheckCircle2,
  MessageCircle,
  AlertCircle,
  FileCheck2,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface DemandDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function DemandDetailPage(props: DemandDetailPageProps) {
  const { id } = await props.params
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }

  const result = await getDemandById(id)
  if (!result.success || !result.demand) {
    notFound()
  }

  const demand = result.demand

  // Documentos existentes no GED do produtor/propriedade para sugestão de vínculo
  const existingGedDocs = await prisma.document.findMany({
    where: {
      producerId: demand.producerId,
      isArchived: false,
      isSuperseded: false,
    },
    select: {
      id: true,
      fileName: true,
      documentType: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const serviceMeta = RURAL_SERVICES_CATALOG[demand.serviceType as RuralServiceTypeCode]
  const serviceTitle =
    demand.serviceType === 'OUTROS' && demand.customServiceType
      ? demand.customServiceType
      : serviceMeta?.label || demand.serviceType

  const propertyDisplayName =
    demand.property?.name || demand.property?.propertyName || 'Nenhuma propriedade vinculada'
  const propertyLocation =
    demand.property?.city && demand.property?.state
      ? `${demand.property.city} - ${demand.property.state}`
      : null

  const creatorName = demand.creator?.fullName || demand.creator?.email?.split('@')[0] || 'Sistema'
  const assigneeName = demand.assignedTo?.fullName || demand.responsibleName || 'Não atribuído'

  const formattedRequestDate = new Date(demand.requestDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const formattedEstimatedDate = demand.estimatedDeliveryDate
    ? new Date(demand.estimatedDeliveryDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Não definida'

  const formattedStartDate = demand.startDate
    ? new Date(demand.startDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Aguardando início'

  const formattedCompletionDate = demand.completionDate
    ? new Date(demand.completionDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Barra de Navegação Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/admin/demands"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Hub de Demandas</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/demands/${demand.id}/edit`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition-all"
          >
            <Edit className="w-3.5 h-3.5 text-slate-400" />
            <span>Editar Demanda</span>
          </Link>
        </div>
      </div>

      {/* Cartão de Identificação Principal */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              {serviceTitle}
            </span>
            {demand.proposalId && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-lg">
                <FileCheck2 className="w-3.5 h-3.5 text-indigo-500" />
                Proposta: {demand.proposalId}
              </span>
            )}
            <DemandSlaBadge sla={demand.sla} />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
            Demanda para {demand.producer.name}
          </h1>

          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" />
              <span>Produtor: </span>
              <Link
                href={`/admin/crm/${demand.producer.id}`}
                className="font-bold text-slate-700 hover:text-emerald-700 transition-colors"
              >
                {demand.producer.name}
              </Link>
            </div>

            <div className="flex items-center gap-1.5">
              <Home className="w-4 h-4 text-slate-400" />
              <span>Fazenda: </span>
              <span className="font-semibold text-slate-700">
                {propertyDisplayName} {propertyLocation && `(${propertyLocation})`}
              </span>
            </div>
          </div>
        </div>

        {/* Resumo Rápido de Prazos */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 flex items-center gap-6 shrink-0 text-xs">
          <div>
            <div className="text-slate-400 font-medium">Solicitado em</div>
            <div className="font-bold text-slate-800 text-sm mt-0.5">{formattedRequestDate}</div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div>
            <div className="text-slate-400 font-medium">Previsão (SLA)</div>
            <div className="font-bold text-slate-800 text-sm mt-0.5">{formattedEstimatedDate}</div>
          </div>
        </div>
      </div>

      {/* Stepper dos 4 Estados do Workflow */}
      <DemandStatusStepper demandId={demand.id} currentStatus={demand.status as any} />

      {/* Grid Principal de Conteúdo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Coluna da Esquerda (2 Colunas): Checklist GED & Descrição */}
        <div className="lg:col-span-2 space-y-6">
          {/* Checklist Documental */}
          <DemandChecklistSection
            demandId={demand.id}
            items={demand.checklistItems as any}
            producerName={demand.producer.name}
            producerPhone={demand.producer.phone}
            serviceTitle={serviceTitle}
            existingGedDocs={existingGedDocs as any}
          />

          {/* Especificações & Observações */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">Especificações da Demanda</h3>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Descrição do Atendimento
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 font-normal">
                {demand.description || 'Nenhuma descrição detalhada informada.'}
              </p>
            </div>

            {demand.notes && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Notas Internas
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/40 p-3.5 rounded-xl border border-amber-100 font-normal">
                  {demand.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Coluna da Direita (1 Coluna): Auditoria & Linha do Tempo */}
        <div className="space-y-6">
          {/* Card de Metadados de Auditoria & Governança */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">Governança & Rastreabilidade</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-400">Criado por:</span>
                <span className="font-semibold text-slate-800 text-right">{creatorName}</span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-400">Data de Abertura:</span>
                <span className="font-semibold text-slate-800 text-right">{formattedRequestDate}</span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-400">Responsável Atual:</span>
                <span className="font-semibold text-slate-800 text-right">{assigneeName}</span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-400">Início da Execução:</span>
                <span className="font-semibold text-slate-800 text-right">{formattedStartDate}</span>
              </div>

              {formattedCompletionDate && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-400">Conclusão Efetiva:</span>
                  <span className="font-bold text-emerald-700 text-right">
                    {formattedCompletionDate}
                  </span>
                </div>
              )}

              {demand.proposalId && (
                <div className="flex items-start justify-between gap-2 pt-2 border-t border-slate-100">
                  <span className="text-slate-400">Proposta / Dossiê:</span>
                  <span className="font-bold text-indigo-700 text-right">{demand.proposalId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Linha do Tempo / Histórico de Transições */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Linha do Tempo</h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                {demand.history.length} evento{demand.history.length > 1 ? 's' : ''}
              </span>
            </div>

            <DemandTimeline history={demand.history as any} />
          </div>
        </div>
      </div>
    </div>
  )
}
