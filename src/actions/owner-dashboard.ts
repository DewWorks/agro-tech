'use server';

import prisma from '@/lib/prisma';
import { startOfDay, startOfWeek, startOfMonth, subMonths } from 'date-fns';

/**
 * Retorna as métricas de franquia do mês atual e o limite máximo (300).
 */
export async function getFranchiseUsage(branchId?: string) {
  const currentMonthStart = startOfMonth(new Date());

  const whereClause = {
    createdAt: { gte: currentMonthStart },
    ...(branchId ? { branchId } : {}), // Se for SUPER_ADMIN, pode não passar branchId
  };

  const count = await prisma.generatedForm.count({
    where: whereClause,
  });

  return {
    used: count,
    limit: 300,
    percentage: Math.min((count / 300) * 100, 100)
  };
}

/**
 * Retorna o volume de documentos emitidos agrupados por tempo.
 * Ideal para renderizar gráficos no Recharts.
 */
export async function getEmissionsOverTime(branchId?: string) {
  // Simples agrupamento por dia nos últimos 30 dias (Usando groupBy do Prisma)
  const last30Days = subMonths(new Date(), 1);

  const whereClause = {
    createdAt: { gte: last30Days },
    ...(branchId ? { branchId } : {}),
  };

  // O prisma groupBy precisa ser formatado. 
  // No PostgreSQL, agrupar por data requer Raw Query, ou pegamos os dados e agrupamos no Node.
  // Vamos buscar e agrupar no Node para simplificar a demo.
  const forms = await prisma.generatedForm.findMany({
    where: whereClause,
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' }
  });

  const dailyCounts: Record<string, number> = {};
  for (const f of forms) {
    const day = f.createdAt.toISOString().split('T')[0];
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  }

  return Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));
}

/**
 * Retorna o ranking de emissões por Produtor.
 */
export async function getEmissionsRanking(branchId?: string) {
  const whereClause = branchId ? { branchId } : {};

  const ranking = await prisma.generatedForm.groupBy({
    by: ['producerId'],
    where: whereClause,
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 10,
  });

  // Para pegar os nomes dos produtores, fazemos um lookup
  const producerIds = ranking.map(r => r.producerId);
  const producers = await prisma.producer.findMany({
    where: { id: { in: producerIds } },
    select: { id: true, name: true }
  });

  return ranking.map(r => {
    const producer = producers.find(p => p.id === r.producerId);
    return {
      producerName: producer?.name || 'Desconhecido',
      emissionsCount: r._count.id
    };
  });
}

/**
 * Retorna o painel de semáforos globais (Documentos próximos do vencimento).
 * Usa os DocumentAlerts.
 */
export async function getGlobalSemaphoreOverview(branchId?: string) {
  const whereClause = {
    isResolved: false,
    ...(branchId ? { branchId } : {})
  };

  const alerts = await prisma.documentAlert.groupBy({
    by: ['alertLevel'],
    where: whereClause,
    _count: {
      id: true
    }
  });

  const overview = {
    expiring60: 0,
    expiring30: 0,
    expiring7: 0,
    expired: 0
  };

  alerts.forEach(a => {
    if (a.alertLevel === 'EXPIRING_60') overview.expiring60 = a._count.id;
    if (a.alertLevel === 'EXPIRING_30') overview.expiring30 = a._count.id;
    if (a.alertLevel === 'EXPIRING_7') overview.expiring7 = a._count.id;
    if (a.alertLevel === 'EXPIRED') overview.expired = a._count.id;
  });

  return overview;
}
