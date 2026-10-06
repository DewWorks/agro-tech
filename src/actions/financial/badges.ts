'use server'

import { unstable_cache } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireFinancialAuth } from '@/lib/financial/auth-guard'

export interface FinancialBadgeCounts {
  receivablesCount: number
  receivablesOverdueCount: number
  payablesPendingCount: number
  partnersPendingPayoutCount: number
}

/**
 * Consulta de contadores dos badges encapsulada em unstable_cache em memória (< 5ms)
 * com tag 'financial-data' e revalidação de 1 hora.
 */
export const getCachedBadgeCounts = unstable_cache(
  async (branchKey: string, organizationId?: string): Promise<FinancialBadgeCounts> => {
    const isGlobal = branchKey === 'ALL' || !branchKey
    const branchWhere = isGlobal
      ? organizationId
        ? { branch: { organizationId } }
        : {}
      : { branchId: branchKey }

    const now = new Date()

    const [
      receivablesCount,
      receivablesOverdueCount,
      payablesPendingCount,
      partnersPendingPayoutCount,
    ] = await Promise.all([
      // 1. Parcelas de honorários pendentes/em aberto (A_VENCER, VENCE_HOJE, EM_ATRASO)
      prisma.receivableInstallment.count({
        where: {
          receivableTitle: {
            ...branchWhere,
            status: { not: 'CANCELADO' },
          },
          status: { in: ['A_VENCER', 'VENCE_HOJE', 'EM_ATRASO'] },
        },
      }),

      // 2. Parcelas em atraso (status EM_ATRASO ou data de vencimento anterior a hoje)
      prisma.receivableInstallment.count({
        where: {
          receivableTitle: {
            ...branchWhere,
            status: { not: 'CANCELADO' },
          },
          OR: [
            { status: 'EM_ATRASO' },
            {
              status: 'A_VENCER',
              dueDate: { lt: now },
            },
          ],
        },
      }),

      // 3. Boletos/Contas a pagar pendentes
      prisma.payableInstallment.count({
        where: {
          payableTitle: {
            ...branchWhere,
            status: { not: 'CANCELADO' },
          },
          status: { in: ['A_VENCER', 'VENCE_HOJE', 'EM_ATRASO'] },
        },
      }),

      // 4. Comissões com status LIBERADO (aguardando transferência PIX para o parceiro)
      prisma.partnerCommission.count({
        where: {
          ...branchWhere,
          status: { in: ['LIBERADO_PARCIAL', 'LIBERADO_TOTAL'] },
        },
      }),
    ])

    return {
      receivablesCount,
      receivablesOverdueCount,
      payablesPendingCount,
      partnersPendingPayoutCount,
    }
  },
  ['financial-badge-counts'],
  { tags: ['financial-data'], revalidate: 3600 }
)

/**
 * Obtém os contadores de pendências do ERP Financeiro para os Badges de Alerta das Abas.
 * Executa em paralelo com projeções de contagem direta no banco de dados e cache em memória.
 */
export async function getFinancialBadgeCounts(
  targetBranchId?: string | null
): Promise<FinancialBadgeCounts> {
  try {
    const auth = await requireFinancialAuth(targetBranchId)
    const branchKey = auth.isGlobalView || !auth.effectiveBranchId ? 'ALL' : auth.effectiveBranchId
    return await getCachedBadgeCounts(branchKey, auth.organizationId)
  } catch (err) {
    console.error('[getFinancialBadgeCounts] Erro ao consultar badges:', err)
    return {
      receivablesCount: 0,
      receivablesOverdueCount: 0,
      payablesPendingCount: 0,
      partnersPendingPayoutCount: 0,
    }
  }
}

/**
 * Função utilitária de contadores financeiros.
 */
export async function getFinancialCounters(
  targetBranchId?: string | null
): Promise<FinancialBadgeCounts> {
  return getFinancialBadgeCounts(targetBranchId)
}

