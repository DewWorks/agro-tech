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
  Zap,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'

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

  // 1. Sincronização Automática com GED: Qualquer documento emitido contendo demandId
  // ou vinculado diretamente à demanda deve constar no checklist imediatamente
  const allGedDocsForProducer = await prisma.document.findMany({
    where: {
      producerId: demand.producerId,
      isArchived: false,
      isSuperseded: false,
    },
    select: {
      id: true,
      fileName: true,
      documentType: true,
      storagePath: true,
      complianceStatus: true,
      metadataPayload: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Sincroniza documentos emitidos que possuem o demandId ou são o primary document
  const linkedDocsToSync = allGedDocsForProducer.filter((doc) => {
    if (demand.documentId && doc.id === demand.documentId) return true
    const meta = (doc.metadataPayload as any) || {}
    return meta.demandId === demand.id || meta.linkedDemandId === demand.id
  })

  for (const doc of linkedDocsToSync) {
    const isAlreadyInChecklist = demand.checklistItems.some((item) => item.documentId === doc.id)
    if (!isAlreadyInChecklist) {
      try {
        const syncedItem = await prisma.demandChecklistItem.create({
          data: {
            demandId: demand.id,
            title: `Projeto Técnico Emitido: ${doc.fileName}`,
            documentType: doc.documentType,
            documentId: doc.id,
            isRequired: true,
            isDelivered: true,
            deliveredAt: doc.createdAt,
            notes: 'Documento vinculado e sincronizado automaticamente pela esteira de crédito.',
          },
          include: {
            document: {
              select: {
                id: true,
                fileName: true,
                storagePath: true,
                complianceStatus: true,
              },
            },
          },
        })
        demand.checklistItems.push(syncedItem as any)
      } catch (err) {
        console.error('[Document Sync Error]:', err)
      }
    }
  }

  const existingGedDocs = allGedDocsForProducer.map((doc) => ({
    id: doc.id,
    fileName: doc.fileName,
    documentType: doc.documentType,
  }))

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
      {/* Top Header com Identidade Padronizada */}
      <PageHeaderBanner
        badge={`Demanda #${demand.id.slice(-6).toUpperCase()} • ${serviceTitle}`}
        badgeIcon={<ClipboardList className="h-4 w-4 shrink-0 text-emerald-300" />}
        title={serviceTitle}
        description={`Demanda vinculada a ${demand.producer.name}${demand.property ? ` — Fazenda ${propertyDisplayName}` : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/demands">
              <Button
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Voltar
              </Button>
            </Link>
            <Link href={`/admin/demands/${demand.id}/edit`}>
              <Button className="bg-white text-[#1B4D3E] hover:bg-emerald-50 text-xs font-bold shadow-xs">
                <Edit className="mr-1.5 h-4 w-4" />
                <span>Editar Demanda</span>
              </Button>
            </Link>
          </div>
        }
      />

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

      {/* Card de Ações Técnicas Vinculadas (Hub de Integração Bidirecional da Esteira) */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#1B4D3E] to-slate-900 rounded-2xl p-5 text-white shadow-xs border border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold shrink-0 border border-emerald-400/30">
            <Sparkles className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-white">
                Ações Técnicas Vinculadas à Demanda
              </h4>
              <span className="text-[10px] font-semibold bg-emerald-800/80 text-emerald-200 border border-emerald-600/40 px-2 py-0.5 rounded-full">
                Hub Bidirecional
              </span>
              {demand.document && (
                <span className="text-[10px] font-medium bg-white/10 text-emerald-200 px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-emerald-300" />
                  Doc: {demand.document.fileName}
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-100/80 mt-1">
              Contexto ativo herdado: <strong>{demand.producer.name}</strong>
              {demand.property ? ` • Fazenda ${propertyDisplayName}` : ''}.
              Avance ou simule sem reinserir dados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Link
            href={`/admin/documents/credit-projects/new?demandId=${demand.id}&producerId=${demand.producerId}&propertyId=${demand.propertyId || ''}`}
          >
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 px-3.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              <span>Gerar Projeto Técnico BB</span>
            </Button>
          </Link>

          <Link
            href={`/admin/credit-limit?propertyId=${demand.propertyId || ''}&producerId=${demand.producerId}&demandId=${demand.id}&tab=simulator`}
          >
            <Button
              type="button"
              className="bg-white hover:bg-emerald-50 text-[#1B4D3E] font-bold text-xs h-9 px-3.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-600 fill-yellow-500" />
              <span>Simular Limite MCR / ICSD</span>
            </Button>
          </Link>
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
