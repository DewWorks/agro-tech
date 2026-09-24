import React from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getDemandById } from '@/actions/demands'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { DemandStatusStepper } from '@/components/demands/DemandStatusStepper'
import { DemandAuditTabs } from '@/components/demands/DemandAuditTabs'
import { DemandChecklistSection } from '@/components/demands/DemandChecklistSection'
import { DemandDescriptionBlock } from '@/components/demands/DemandDescriptionBlock'
import { DemandSlaBadge } from '@/components/demands/DemandSlaBadge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
  ShieldCheck,
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
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-md">
                <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
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

          {/* Descrição e Notas Unificados no Cabeçalho */}
          <DemandDescriptionBlock
            description={demand.description}
            notes={demand.notes}
          />
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

      {/* Abas Principais da Tela (Page-level Tabs no Design System Agro-Limit) */}
      <Tabs defaultValue="checklist" className="w-full space-y-6">
        <div className="border-b border-slate-200">
          <TabsList className="bg-transparent h-auto p-0 gap-8 border-b-0">
            <TabsTrigger
              value="checklist"
              className="relative pb-3 pt-1 px-1 rounded-none border-b-2 border-transparent text-sm font-bold text-slate-500 hover:text-slate-800 data-[state=active]:border-[#1B4D3E] data-[state=active]:text-[#1B4D3E] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Checklist Documental & Anexos do GED</span>
            </TabsTrigger>

            <TabsTrigger
              value="auditoria"
              className="relative pb-3 pt-1 px-1 rounded-none border-b-2 border-transparent text-sm font-bold text-slate-500 hover:text-slate-800 data-[state=active]:border-[#1B4D3E] data-[state=active]:text-[#1B4D3E] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Governança, Linha do Tempo & Auditoria</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {demand.history.length} eventos
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Aba 1: Checklist Documental & Anexos do GED (Largura Total Confortável) */}
        <TabsContent value="checklist" className="focus-visible:outline-hidden space-y-6">
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
        </TabsContent>

        {/* Aba 2: Governança, Linha do Tempo & Auditoria (Grid Amplo 35% / 65%) */}
        <TabsContent value="auditoria" className="focus-visible:outline-hidden">
          <DemandAuditTabs
            demand={{
              id: demand.id,
              requestDate: demand.requestDate,
              startDate: demand.startDate,
              estimatedDeliveryDate: demand.estimatedDeliveryDate,
              completionDate: demand.completionDate,
              proposalId: demand.proposalId,
              responsibleName: demand.responsibleName,
              branch: demand.branch,
              creator: demand.creator,
              assignedTo: demand.assignedTo,
              sla: demand.sla,
              history: demand.history as any,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
