'use server';

import prisma from '@/lib/prisma';
import { getUserContext } from '@/lib/auth';
import { startOfMonth, subDays, format, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CREDIT_TEMPLATES_REGISTRY } from '@/lib/document-templates';
import { Prisma } from '@prisma/client';
import { calculateDocumentStatus } from '@/lib/ged/semaphore';
import type { DocumentRow } from '@/components/ged/DocumentTable';

export interface FranchiseUsageResult {
  used: number;
  limit: number;
  percentage: number;
  totalAllTime: number;
}

export interface TimePoint {
  date: string;
  formattedDate: string;
  count: number;
}

export interface TemplateRankingItem {
  templateCode: string;
  title: string;
  category: string;
  badgeColor: string;
  count: number;
  percentage: number;
}

export interface ProducerRankingItem {
  producerId: string;
  producerName: string;
  document: string;
  emissionsCount: number;
  percentage: number;
}

export interface PropertyRankingItem {
  propertyId: string;
  propertyName: string;
  producerName: string;
  location: string;
  emissionsCount: number;
  percentage: number;
}

export interface RecentEmissionItem {
  id: string;
  templateCode: string;
  templateTitle: string;
  producerName: string;
  producerDoc: string;
  propertyName: string | null;
  branchName: string;
  createdAt: string;
}

export interface StorageMetricsResult {
  totalBytes: number;
  formattedUsed: string;
  limitBytes: number;
  formattedLimit: string;
  percentage: number;
  totalDocuments: number;
}

export interface SemaphoreOverviewResult {
  expiring60: number;
  expiring30: number;
  expiring7: number;
  expired: number;
}

export interface BranchOption {
  id: string;
  name: string;
}

async function resolveEffectiveUser(userParam?: any) {
  const user = userParam || (await getUserContext());
  if (!user) {
    throw new Error('Usuário não autenticado.');
  }

  if (user.organizationId) {
    return user;
  }

  // SUPER_ADMIN global: seleciona a primeira organização para visualização do painel
  if (user.role === 'SUPER_ADMIN' || user.realRole === 'SUPER_ADMIN') {
    const firstOrg = await prisma.organization.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    if (firstOrg) {
      return {
        ...user,
        organizationId: firstOrg.id,
        organization: firstOrg,
      };
    }
  }

  throw new Error('Usuário sem organização vinculada.');
}

/**
 * Constrói o filtro de branch respeitando isolamento multi-tenant da organização.
 */
async function buildBranchFilter(branchId?: string, userParam?: any): Promise<Prisma.GeneratedFormWhereInput> {
  const user = await resolveEffectiveUser(userParam);

  if (branchId && branchId !== 'ALL') {
    return {
      branchId,
      branch: { organizationId: user.organizationId },
    };
  }

  // Se o usuário tem branch fixa e não é OWNER ou SUPER_ADMIN
  if (user.branchId && user.role !== 'OWNER' && user.role !== 'SUPER_ADMIN') {
    return { branchId: user.branchId };
  }

  // Organização inteira
  return {
    branch: { organizationId: user.organizationId },
  };
}

/**
 * Retorna as filiais da organização atual para seleção no filtro do topo.
 */
export async function getBranchesList(userParam?: any): Promise<BranchOption[]> {
  const user = await resolveEffectiveUser(userParam);

  const branches = await prisma.branch.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return branches;
}

/**
 * Retorna as métricas de franquia do mês atual e o limite contratado (300).
 */
export async function getFranchiseUsage(branchId?: string, userParam?: any): Promise<FranchiseUsageResult> {
  const branchFilter = await buildBranchFilter(branchId, userParam);
  const currentMonthStart = startOfMonth(new Date());

  const [currentMonthCount, totalAllTime] = await Promise.all([
    prisma.generatedForm.count({
      where: {
        ...branchFilter,
        createdAt: { gte: currentMonthStart },
      },
    }),
    prisma.generatedForm.count({
      where: branchFilter,
    }),
  ]);

  const limit = 300;
  const percentage = Math.min(Math.round((currentMonthCount / limit) * 100), 100);

  return {
    used: currentMonthCount,
    limit,
    percentage,
    totalAllTime,
  };
}

/**
 * Retorna o volume de emissões diárias nos últimos 30 dias com todos os dias preenchidos.
 */
export async function getEmissionsOverTime(branchId?: string, userParam?: any): Promise<TimePoint[]> {
  const branchFilter = await buildBranchFilter(branchId, userParam);
  const today = new Date();
  const startDate = subDays(today, 29); // 30 dias contínuos

  const forms = await prisma.generatedForm.findMany({
    where: {
      ...branchFilter,
      createdAt: { gte: startDate },
    },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Agrupamento por YYYY-MM-DD
  const countsByDay: Record<string, number> = {};
  for (const f of forms) {
    const dayKey = format(f.createdAt, 'yyyy-MM-dd');
    countsByDay[dayKey] = (countsByDay[dayKey] || 0) + 1;
  }

  // Preenche todo o intervalo de 30 dias
  const allDays = eachDayOfInterval({ start: startDate, end: today });

  return allDays.map((dateObj) => {
    const key = format(dateObj, 'yyyy-MM-dd');
    return {
      date: key,
      formattedDate: format(dateObj, 'dd/MM', { locale: ptBR }),
      count: countsByDay[key] || 0,
    };
  });
}

/**
 * Helper para resolver metadados legíveis de modelos.
 */
function resolveTemplateMeta(code: string) {
  const item = CREDIT_TEMPLATES_REGISTRY.find((t) => t.code === code);
  if (item) {
    return {
      title: item.title,
      category: item.category,
      badgeColor: item.badgeColor,
    };
  }
  return {
    title: code.replace(/_/g, ' '),
    category: 'OUTROS',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
  };
}

/**
 * Ranking de quais modelos foram mais emitidos.
 */
export async function getEmissionsRankingByTemplate(branchId?: string, userParam?: any): Promise<TemplateRankingItem[]> {
  const branchFilter = await buildBranchFilter(branchId, userParam);

  const grouped = await prisma.generatedForm.groupBy({
    by: ['templateCode'],
    where: branchFilter,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  const total = grouped.reduce((acc, curr) => acc + curr._count.id, 0);

  return grouped.map((g) => {
    const meta = resolveTemplateMeta(g.templateCode);
    return {
      templateCode: g.templateCode,
      title: meta.title,
      category: meta.category,
      badgeColor: meta.badgeColor,
      count: g._count.id,
      percentage: total > 0 ? Math.round((g._count.id / total) * 100) : 0,
    };
  });
}

/**
 * Ranking de produtores por volume de documentos emitidos.
 */
export async function getEmissionsRankingByProducer(branchId?: string, userParam?: any): Promise<ProducerRankingItem[]> {
  const branchFilter = await buildBranchFilter(branchId, userParam);

  const grouped = await prisma.generatedForm.groupBy({
    by: ['producerId'],
    where: branchFilter,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  });

  if (grouped.length === 0) return [];

  const producerIds = grouped.map((g) => g.producerId);
  const producers = await prisma.producer.findMany({
    where: { id: { in: producerIds } },
    select: { id: true, name: true, document: true },
  });

  const total = grouped.reduce((acc, curr) => acc + curr._count.id, 0);

  return grouped.map((g) => {
    const p = producers.find((prod) => prod.id === g.producerId);
    return {
      producerId: g.producerId,
      producerName: p?.name || 'Produtor Desconhecido',
      document: p?.document || '',
      emissionsCount: g._count.id,
      percentage: total > 0 ? Math.round((g._count.id / total) * 100) : 0,
    };
  });
}

// Mantido para compatibilidade reversa
export async function getEmissionsRanking(branchId?: string, userParam?: any) {
  const results = await getEmissionsRankingByProducer(branchId, userParam);
  return results.map((r) => ({
    producerName: r.producerName,
    emissionsCount: r.emissionsCount,
  }));
}

/**
 * Ranking de propriedades rurais mais beneficiadas por emissões de documentos.
 */
export async function getEmissionsRankingByProperty(branchId?: string, userParam?: any): Promise<PropertyRankingItem[]> {
  const branchFilter = await buildBranchFilter(branchId, userParam);

  const grouped = await prisma.generatedForm.groupBy({
    by: ['propertyId'],
    where: {
      ...branchFilter,
      propertyId: { not: null },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  });

  const propertyIds = grouped
    .map((g) => g.propertyId)
    .filter((id): id is string => id !== null);

  if (propertyIds.length === 0) return [];

  const properties = await prisma.property.findMany({
    where: { id: { in: propertyIds } },
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      producers: {
        select: {
          producer: { select: { name: true } },
        },
        take: 1,
      },
    },
  });

  const total = grouped.reduce((acc, curr) => acc + curr._count.id, 0);

  return grouped.map((g) => {
    const prop = properties.find((p) => p.id === g.propertyId);
    const location = prop ? `${prop.city || ''} - ${prop.state || ''}`.replace(/^ - | - $/g, '') || 'Localização não informada' : 'Localização não informada';
    const primaryProducer = prop?.producers?.[0]?.producer?.name || 'Produtor Desconhecido';
    return {
      propertyId: g.propertyId || '',
      propertyName: prop?.name || 'Propriedade Não Identificada',
      producerName: primaryProducer,
      location,
      emissionsCount: g._count.id,
      percentage: total > 0 ? Math.round((g._count.id / total) * 100) : 0,
    };
  });
}

/**
 * Feed de emissões recentes (últimos documentos gerados).
 */
export async function getRecentEmissions(branchId?: string, limit: number = 10, userParam?: any): Promise<RecentEmissionItem[]> {
  const branchFilter = await buildBranchFilter(branchId, userParam);

  const forms = await prisma.generatedForm.findMany({
    where: branchFilter,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      producer: { select: { id: true, name: true, document: true } },
      property: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
    },
  });

  return forms.map((f) => {
    const meta = resolveTemplateMeta(f.templateCode);
    return {
      id: f.id,
      templateCode: f.templateCode,
      templateTitle: meta.title,
      producerName: f.producer?.name || 'Produtor Desconhecido',
      producerDoc: f.producer?.document || '',
      propertyName: f.property?.name || null,
      branchName: f.branch?.name || 'Filial Principal',
      createdAt: format(f.createdAt, 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    };
  });
}

/**
 * Retorna as métricas REAIS de armazenamento consumido no bucket de documentos.
 */
export async function getRealStorageMetrics(branchId?: string, userParam?: any): Promise<StorageMetricsResult> {
  const user = await resolveEffectiveUser(userParam);

  const whereClause: Prisma.DocumentWhereInput = {
    branch: { organizationId: user.organizationId },
    isArchived: false,
    ...(branchId && branchId !== 'ALL' ? { branchId } : {}),
  };

  const aggregate = await prisma.document.aggregate({
    where: whereClause,
    _sum: { fileSize: true },
    _count: { id: true },
  });

  const totalBytes = aggregate._sum.fileSize || 0;
  const totalDocuments = aggregate._count.id || 0;

  // Formata os bytes para MB ou GB
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const limitBytes = 50 * 1024 * 1024 * 1024; // 50 GB
  const percentage = Number(((totalBytes / limitBytes) * 100).toFixed(2));

  return {
    totalBytes,
    formattedUsed: formatBytes(totalBytes),
    limitBytes,
    formattedLimit: '50 GB',
    percentage,
    totalDocuments,
  };
}

/**
 * Retorna o painel de semáforos globais (Documentos próximos do vencimento).
 */
export async function getGlobalSemaphoreOverview(branchId?: string, userParam?: any): Promise<SemaphoreOverviewResult> {
  const user = await resolveEffectiveUser(userParam);

  const whereClause: Prisma.DocumentAlertWhereInput = {
    isResolved: false,
    document: {
      branch: { organizationId: user.organizationId },
      ...(branchId && branchId !== 'ALL' ? { branchId } : {}),
    },
  };

  const alerts = await prisma.documentAlert.groupBy({
    by: ['alertLevel'],
    where: whereClause,
    _count: { id: true },
  });

  const overview = {
    expiring60: 0,
    expiring30: 0,
    expiring7: 0,
    expired: 0,
  };

  alerts.forEach((a) => {
    if (a.alertLevel === 'EXPIRING_60') overview.expiring60 = a._count.id;
    if (a.alertLevel === 'EXPIRING_30') overview.expiring30 = a._count.id;
    if (a.alertLevel === 'EXPIRING_7') overview.expiring7 = a._count.id;
    if (a.alertLevel === 'EXPIRED') overview.expired = a._count.id;
  });

  return overview;
}

/**
 * Retorna os documentos da organização processados com o status do semáforo para o dashboard.
 */
export async function getProcessedDocumentsForSemaphore(branchId?: string, userParam?: any): Promise<{
  documents: DocumentRow[];
  validCount: number;
  alertCount: number;
  expiredCount: number;
}> {
  const user = await resolveEffectiveUser(userParam);

  const whereClause: Prisma.DocumentWhereInput = {
    branch: { organizationId: user.organizationId },
    isArchived: false,
    isSuperseded: false,
    ...(branchId && branchId !== 'ALL' ? { branchId } : {}),
  };

  const rawDocs = await prisma.document.findMany({
    where: whereClause,
    include: {
      producer: { select: { id: true, name: true } },
      property: { select: { id: true, name: true } },
    },
    orderBy: { expirationDate: 'asc' },
  });

  let validCount = 0;
  let alertCount = 0;
  let expiredCount = 0;

  const documents: DocumentRow[] = rawDocs.map((doc) => {
    const calculatedStatus = calculateDocumentStatus(doc.expirationDate, doc.documentType);
    if (calculatedStatus === 'VALIDO') validCount++;
    if (calculatedStatus === 'ALERTA') alertCount++;
    if (calculatedStatus === 'VENCIDO') expiredCount++;

    return {
      id: doc.id,
      fileName: doc.fileName,
      documentType: doc.documentType,
      issueDate: doc.issueDate,
      expirationDate: doc.expirationDate,
      fileSize: Number(doc.fileSize),
      mimeType: doc.mimeType,
      storagePath: doc.storagePath,
      isInherited: doc.isInherited,
      cropYear: doc.cropYear,
      inheritedFromId: doc.inheritedFromId,
      calculatedStatus,
      producer: doc.producer,
      property: doc.property,
    };
  });

  return {
    documents,
    validCount,
    alertCount,
    expiredCount,
  };
}

/**
 * Agregador completo para carregar todos os dados do dashboard em paralelo.
 */
export async function getAllOwnerDashboardData(branchId?: string) {
  const user = await resolveEffectiveUser();

  const [
    branches,
    usage,
    timeData,
    templatesRanking,
    producersRanking,
    propertiesRanking,
    recentEmissions,
    storage,
    semaphores,
    semaphoreData,
  ] = await Promise.all([
    getBranchesList(user),
    getFranchiseUsage(branchId, user),
    getEmissionsOverTime(branchId, user),
    getEmissionsRankingByTemplate(branchId, user),
    getEmissionsRankingByProducer(branchId, user),
    getEmissionsRankingByProperty(branchId, user),
    getRecentEmissions(branchId, 12, user),
    getRealStorageMetrics(branchId, user),
    getGlobalSemaphoreOverview(branchId, user),
    getProcessedDocumentsForSemaphore(branchId, user),
  ]);

  return {
    branches,
    usage,
    timeData,
    templatesRanking,
    producersRanking,
    propertiesRanking,
    recentEmissions,
    storage,
    semaphores,
    semaphoreData,
    effectiveOrgName: user.organization?.name || 'Organização AgroTech',
  };
}
