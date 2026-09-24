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
  ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="mb-2">
            <Link
              href="/admin/demands"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para Hub de Demandas</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            {serviceTitle}
          </h1>
          <p className="text-muted-foreground mt-2">
            Demanda vinculada a <strong className="text-foreground">{demand.producer.name}</strong>
            {demand.property ? ` — Fazenda ${propertyDisplayName}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/admin/demands/${demand.id}/edit`}>
            <Button variant="outline" className="border-slate-200">
              <Edit className="mr-2 h-4 w-4" />
              <span>Editar Demanda</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Cartão de Identificação Principal */}
      <div className="bg-white rounded-xl p-6 border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1B4D3E] bg-[#1B4D3E]/10 px-2.5 py-0.5 rounded-md border border-[#1B4D3E]/20">
              {serviceTitle}
            </span>
            {demand.proposalId && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
                <FileCheck2 className="w-3.5 h-3.5 text-indigo-500" />
                Proposta: {demand.proposalId}
              </span>
            )}
            <DemandSlaBadge sla={demand.sla} />
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>Produtor: </span>
              <Link
                href={`/admin/crm/${demand.producer.id}/edit`}
                className="font-semibold text-foreground hover:text-[#1B4D3E] transition-colors"
                title={`Ver cadastro de ${demand.producer.name} no CRM`}
              >
                {demand.producer.name}
              </Link>
            </div>

            <div className="flex items-center gap-1.5">
              <Home className="w-4 h-4 text-muted-foreground" />
              <span>Fazenda: </span>
              {demand.property?.id ? (
                <Link
                  href={`/admin/crm/properties/${demand.property.id}/edit`}
                  className="font-semibold text-foreground hover:text-[#1B4D3E] transition-colors"
                  title={`Ver dados da fazenda ${propertyDisplayName}`}
                >
                  {propertyDisplayName} {propertyLocation && `(${propertyLocation})`}
                </Link>
              ) : (
                <span className="font-semibold text-foreground">
                  {propertyDisplayName} {propertyLocation && `(${propertyLocation})`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Resumo Rápido de Prazos */}
        <div className="bg-slate-50 p-4 rounded-xl border flex items-center gap-6 shrink-0 text-xs">
          <div>
            <div className="text-muted-foreground font-medium">Solicitado em</div>
            <div className="font-bold text-foreground text-sm mt-0.5">{formattedRequestDate}</div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div>
            <div className="text-muted-foreground font-medium">Previsão (SLA)</div>
            <div className="font-bold text-foreground text-sm mt-0.5">{formattedEstimatedDate}</div>
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
            branchId={demand.branchId}
            producerId={demand.producerId}
            propertyId={demand.propertyId}
            items={demand.checklistItems as any}
            producerName={demand.producer.name}
            producerPhone={demand.producer.phone}
            serviceTitle={serviceTitle}
            existingGedDocs={existingGedDocs as any}
          />

          {/* Especificações & Observações */}
          <div className="bg-white rounded-xl p-6 border shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-5 h-5 text-[#1B4D3E]" />
              <h3 className="font-bold text-[#1B4D3E] text-base">Especificações da Demanda</h3>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Descrição do Atendimento
              </h4>
              <p className="text-xs text-foreground leading-relaxed bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 font-normal">
                {demand.description || 'Nenhuma descrição detalhada informada.'}
              </p>
            </div>

            {demand.notes && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Notas Internas
                </h4>
                <p className="text-xs text-foreground leading-relaxed bg-amber-50/40 p-3.5 rounded-xl border border-amber-100 font-normal">
                  {demand.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Coluna da Direita (1 Coluna): Auditoria & Linha do Tempo */}
        <div className="space-y-6">
          {/* Card de Metadados de Auditoria & Governança */}
          <div className="bg-white rounded-xl p-6 border shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-5 h-5 text-[#1B4D3E]" />
              <h3 className="font-bold text-[#1B4D3E] text-base">Governança & Rastreabilidade</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Criado por:</span>
                <span className="font-semibold text-foreground text-right">{creatorName}</span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Data de Abertura:</span>
                <span className="font-semibold text-foreground text-right">{formattedRequestDate}</span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Responsável Atual:</span>
                <span className="font-semibold text-foreground text-right">{assigneeName}</span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Início da Execução:</span>
                <span className="font-semibold text-foreground text-right">{formattedStartDate}</span>
              </div>

              {formattedCompletionDate && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground">Conclusão Efetiva:</span>
                  <span className="font-bold text-emerald-700 text-right">
                    {formattedCompletionDate}
                  </span>
                </div>
              )}

              {demand.proposalId && (
                <div className="flex items-start justify-between gap-2 pt-2 border-t border-slate-100">
                  <span className="text-muted-foreground">Proposta / Dossiê:</span>
                  <span className="font-bold text-indigo-700 text-right">{demand.proposalId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Linha do Tempo / Histórico de Transições */}
          <div className="bg-white rounded-xl p-6 border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#1B4D3E]" />
                <h3 className="font-bold text-[#1B4D3E] text-base">Linha do Tempo</h3>
              </div>
              <span className="text-xs text-muted-foreground font-semibold">
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
