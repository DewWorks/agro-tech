'use server'

import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import {
  calculateSlaInfo,
  RURAL_SERVICES_CATALOG,
  RuralServiceTypeCode,
  DemandStatusCode,
  SlaInfo,
} from '@/lib/validations/demands'
import {
  calculateDocumentStatus,
  DOCUMENT_TYPE_LABELS,
  DocumentStatus,
} from '@/lib/ged/semaphore'
import { differenceInCalendarDays, addDays } from 'date-fns'
import { Prisma } from '@prisma/client'

export interface DemandItemSummary {
  id: string
  serviceType: string
  serviceTypeLabel: string
  status: string
  producerName: string
  propertyName: string | null
  technicianName: string
  estimatedDeliveryDate: string | null
  sla: SlaInfo
}

export interface PriorityDocumentSummary {
  id: string
  fileName: string
  documentType: string
  documentTypeLabel: string
  producerName: string
  expirationDate: string
  daysRemaining: number
  status: DocumentStatus
}

export interface HomeDashboardData {
  branches: Array<{ id: string; name: string }>
  currentBranchId?: string
  activeBranchName: string
  organizationName: string
  demands: {
    solicitado: number
    emExecucao: number
    aguardandoDocumentacao: number
    concluido: number
    totalAtivas: number
    overdueCount: number
    warning30Count: number
    recentDemands: DemandItemSummary[]
  }
  ged: {
    totalBytes: number
    formattedUsed: string
    limitFormatted: string
    percentage: number
    validCount: number
    alertCount: number
    expiredCount: number
    totalDocsCount: number
    emittedCount: number
    priorityDocuments: PriorityDocumentSummary[]
  }
  summary: {
    totalProducers: number
    totalProperties: number
    totalHectares: number
    formattedHectares: string
    totalBranches: number
    totalUsers: number
  }
}

async function resolveEffectiveUser(userParam?: any) {
  const user = userParam || (await getUserContext())
  if (!user) {
    throw new Error('Usuário não autenticado.')
  }

  if (user.organizationId) {
    return user
  }

  // SUPER_ADMIN global: seleciona a primeira organização para contextualizar
  if (user.role === 'SUPER_ADMIN' || user.realRole === 'SUPER_ADMIN') {
    const firstOrg = await prisma.organization.findFirst({
      orderBy: { createdAt: 'asc' },
    })
    if (firstOrg) {
      return {
        ...user,
        organizationId: firstOrg.id,
        organization: firstOrg,
      }
    }
  }

  throw new Error('Usuário sem organização vinculada.')
}

export async function getHomeDashboardData(
  branchId?: string,
  userParam?: any
): Promise<HomeDashboardData> {
  const user = await resolveEffectiveUser(userParam)
  const organizationId = user.organizationId as string

  // Lista de filiais ativas da organização
  const branches = await prisma.branch.findMany({
    where: { organizationId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const hasSpecificBranch = Boolean(branchId && branchId !== 'ALL')
  const activeBranchName = hasSpecificBranch
    ? branches.find((b) => b.id === branchId)?.name || 'Filial Selecionada'
    : 'Todas as Filiais (Consolidado)'

  const orgName = user.organization?.name || 'AgroTech Gestão Rural'

  // Filtros multi-tenant unificados
  const branchFilter: any = {
    branch: { organizationId },
    ...(hasSpecificBranch ? { branchId } : {}),
  }

  const now = new Date()
  const in30Days = addDays(now, 30)

  // Consultas paralelas otimizadas
  const [
    demandGrouped,
    overdueDemandsCount,
    warning30DemandsCount,
    activeDemandsList,
    docStorageAggregate,
    emittedFormsCount,
    docsWithExpiration,
    priorityDocsList,
    producersCount,
    propertiesAggregate,
    branchesCount,
    usersCount,
  ] = await Promise.all([
    // 1. Demandas agrupadas por status
    prisma.serviceDemand.groupBy({
      by: ['status'],
      where: branchFilter,
      _count: { id: true },
    }),

    // 2. Demandas atrasadas (não concluídas/canceladas com prazo < agora)
    prisma.serviceDemand.count({
      where: {
        ...branchFilter,
        status: { in: ['SOLICITADO', 'EM_EXECUCAO', 'AGUARDANDO_DOCUMENTACAO'] },
        estimatedDeliveryDate: { lt: now },
      },
    }),

    // 3. Demandas em aviso (prazo entre hoje e 30 dias)
    prisma.serviceDemand.count({
      where: {
        ...branchFilter,
        status: { in: ['SOLICITADO', 'EM_EXECUCAO', 'AGUARDANDO_DOCUMENTACAO'] },
        estimatedDeliveryDate: { gte: now, lte: in30Days },
      },
    }),

    // 4. Lista das 3 demandas ativas prioritárias
    prisma.serviceDemand.findMany({
      where: {
        ...branchFilter,
        status: { in: ['SOLICITADO', 'EM_EXECUCAO', 'AGUARDANDO_DOCUMENTACAO'] },
      },
      orderBy: [
        { estimatedDeliveryDate: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 3,
      include: {
        producer: { select: { id: true, name: true } },
        property: { select: { id: true, name: true, propertyName: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
      },
    }),

    // 5. Agregação de armazenamento do GED
    prisma.document.aggregate({
      where: {
        branch: { organizationId },
        isArchived: false,
        isSuperseded: false,
        ...(hasSpecificBranch ? { branchId } : {}),
      },
      _sum: { fileSize: true },
      _count: { id: true },
    }),

    // 5b. Total de formulários e projetos de crédito emitidos
    prisma.generatedForm.count({
      where: {
        branch: { organizationId },
        ...(hasSpecificBranch ? { branchId } : {}),
      },
    }),

    // 6. Documentos para semáforo de validade
    prisma.document.findMany({
      where: {
        branch: { organizationId },
        isArchived: false,
        isSuperseded: false,
        ...(hasSpecificBranch ? { branchId } : {}),
      },
      select: {
        id: true,
        expirationDate: true,
        documentType: true,
      },
    }),

    // 7. Lista das 3 certidões/licenças mais urgentes
    prisma.document.findMany({
      where: {
        branch: { organizationId },
        isArchived: false,
        isSuperseded: false,
        expirationDate: { not: null },
        ...(hasSpecificBranch ? { branchId } : {}),
      },
      orderBy: { expirationDate: 'asc' },
      take: 3,
      include: {
        producer: { select: { id: true, name: true } },
      },
    }),

    // 8. Total de Produtores Rurais ativos
    prisma.producer.count({
      where: {
        branch: { organizationId },
        isActive: true,
        ...(hasSpecificBranch ? { branchId } : {}),
      },
    }),

    // 9. Total de Imóveis Rurais e soma de hectares
    prisma.property.aggregate({
      where: {
        branch: { organizationId },
        ...(hasSpecificBranch ? { branchId } : {}),
      },
      _count: { id: true },
      _sum: { totalArea: true },
    }),

    // 10. Total de Filiais ativas da organização
    prisma.branch.count({
      where: { organizationId, isActive: true },
    }),

    // 11. Total de Usuários cadastrados na organização
    prisma.user.count({
      where: { organizationId, isActive: true },
    }),
  ])

  // Processamento de demandas
  let solicitadoCount = 0
  let emExecucaoCount = 0
  let aguardandoDocCount = 0
  let concluidoCount = 0

  for (const item of demandGrouped) {
    if (item.status === 'SOLICITADO') solicitadoCount = item._count.id
    if (item.status === 'EM_EXECUCAO') emExecucaoCount = item._count.id
    if (item.status === 'AGUARDANDO_DOCUMENTACAO') aguardandoDocCount = item._count.id
    if (item.status === 'CONCLUIDO') concluidoCount = item._count.id
  }

  const totalAtivas = solicitadoCount + emExecucaoCount + aguardandoDocCount

  const recentDemands: DemandItemSummary[] = activeDemandsList.map((d) => {
    const sla = calculateSlaInfo(
      d.estimatedDeliveryDate,
      d.completionDate,
      d.status as DemandStatusCode,
      now
    )
    const catalogMeta = RURAL_SERVICES_CATALOG[d.serviceType as RuralServiceTypeCode]
    const serviceTypeLabel = catalogMeta?.label || d.customServiceType || d.serviceType
    const technicianName =
      d.assignedTo?.fullName || d.responsibleName || 'Técnico Responsável'
    const propertyName = d.property?.name || d.property?.propertyName || null

    return {
      id: d.id,
      serviceType: d.serviceType,
      serviceTypeLabel,
      status: d.status,
      producerName: d.producer?.name || 'Produtor Desconhecido',
      propertyName,
      technicianName,
      estimatedDeliveryDate: d.estimatedDeliveryDate
        ? d.estimatedDeliveryDate.toISOString()
        : null,
      sla,
    }
  })

  // Processamento do GED e Semáforo
  const totalBytes = docStorageAggregate._sum.fileSize || 0
  const limitBytes = 50 * 1024 * 1024 * 1024 // 50 GB
  const storagePercentage = Math.min(
    100,
    Number(((totalBytes / limitBytes) * 100).toFixed(2))
  )

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  let validCount = 0
  let alertCount = 0
  let expiredCount = 0

  for (const doc of docsWithExpiration) {
    const status = calculateDocumentStatus(doc.expirationDate, doc.documentType)
    if (status === 'VALIDO') validCount++
    if (status === 'ALERTA') alertCount++
    if (status === 'VENCIDO') expiredCount++
  }

  const priorityDocuments: PriorityDocumentSummary[] = priorityDocsList.map((doc) => {
    const status = calculateDocumentStatus(doc.expirationDate, doc.documentType)
    const daysRemaining = doc.expirationDate
      ? differenceInCalendarDays(doc.expirationDate, now)
      : 0
    const documentTypeLabel =
      DOCUMENT_TYPE_LABELS[doc.documentType || ''] || doc.documentType || 'Certidão / Licença'

    return {
      id: doc.id,
      fileName: doc.fileName,
      documentType: doc.documentType || 'OUTROS',
      documentTypeLabel,
      producerName: doc.producer?.name || 'Cliente Vinculado',
      expirationDate: doc.expirationDate!.toISOString(),
      daysRemaining,
      status,
    }
  })

  // Processamento do Resumo Patrimonial
  const totalProperties = propertiesAggregate._count.id || 0
  const totalHectares = Number((propertiesAggregate._sum.totalArea || 0).toFixed(2))
  const formattedHectares = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalHectares)

  return {
    branches,
    currentBranchId: hasSpecificBranch ? branchId : undefined,
    activeBranchName,
    organizationName: orgName,
    demands: {
      solicitado: solicitadoCount,
      emExecucao: emExecucaoCount,
      aguardandoDocumentacao: aguardandoDocCount,
      concluido: concluidoCount,
      totalAtivas,
      overdueCount: overdueDemandsCount,
      warning30Count: warning30DemandsCount,
      recentDemands,
    },
    ged: {
      totalBytes,
      formattedUsed: formatBytes(totalBytes),
      limitFormatted: '50 GB',
      percentage: storagePercentage,
      validCount,
      alertCount,
      expiredCount,
      totalDocsCount: docStorageAggregate._count.id || 0,
      emittedCount: emittedFormsCount || 0,
      priorityDocuments,
    },
    summary: {
      totalProducers: producersCount,
      totalProperties,
      totalHectares,
      formattedHectares,
      totalBranches: branchesCount,
      totalUsers: usersCount,
    },
  }
}
