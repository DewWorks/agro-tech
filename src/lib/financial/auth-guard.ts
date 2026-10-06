import { cache } from 'react'
import { getUserContext } from '@/lib/auth'

export interface FinancialAuthContext {
  user: NonNullable<Awaited<ReturnType<typeof getUserContext>>>
  isExecutive: boolean
  isGlobalView: boolean
  effectiveBranchId: string | null
  organizationId: string
}

/**
 * Utilitário de segurança RBAC e isolamento multi-filial para o módulo financeiro.
 * Deduplicado por request com React cache().
 * 
 * Regras:
 * 1. Apenas papéis autorizados (OWNER, SUPER_ADMIN, ADMIN, OPERATOR) podem acessar.
 * 2. Operadores locais têm consultas estritamente fixadas na sua filial (user.branchId).
 * 3. Apenas perfis executivos (OWNER, SUPER_ADMIN) podem alternar entre filiais ou visualizar o consolidado (ALL).
 */
export const requireFinancialAuth = cache(async (
  targetBranchId?: string | null
): Promise<FinancialAuthContext> => {
  const user = await getUserContext()
  if (!user) {
    throw new Error('Não autenticado. Faça login para acessar o módulo financeiro.')
  }

  const isExecutive =
    user.role === 'OWNER' ||
    user.role === 'SUPER_ADMIN' ||
    user.realRole === 'SUPER_ADMIN'

  const organizationId = user.organizationId
  if (!organizationId && user.realRole !== 'SUPER_ADMIN') {
    throw new Error('Usuário sem organização ativa vinculada.')
  }

  // Operador local ou Administrador de filial: fixado na filial vinculada
  if (!isExecutive) {
    if (!user.branchId) {
      throw new Error('Acesso negado: Operador sem filial de atuação associada.')
    }

    // Se tentar consultar outra filial explicitamente, lançar erro de autorização
    if (targetBranchId && targetBranchId !== 'ALL' && targetBranchId !== user.branchId) {
      throw new Error('Acesso negado: Você não possui autorização para consultar dados de outra filial.')
    }

    return {
      user,
      isExecutive: false,
      isGlobalView: false,
      effectiveBranchId: user.branchId,
      organizationId: organizationId || '',
    }
  }

  // Perfil Executivo (OWNER / SUPER_ADMIN)
  if (!targetBranchId || targetBranchId === 'ALL') {
    return {
      user,
      isExecutive: true,
      isGlobalView: true,
      effectiveBranchId: null,
      organizationId: organizationId || '',
    }
  }

  return {
    user,
    isExecutive: true,
    isGlobalView: false,
    effectiveBranchId: targetBranchId,
    organizationId: organizationId || '',
  }
})

/**
 * Constrói a cláusula WHERE de isolamento multi-tenant para queries Prisma.
 */
export function buildFinancialBranchWhere(
  auth: FinancialAuthContext,
  branchField: string = 'branchId'
): Record<string, any> {
  if (auth.isGlobalView || !auth.effectiveBranchId) {
    return {
      branch: {
        organizationId: auth.organizationId,
      },
    }
  }

  return {
    [branchField]: auth.effectiveBranchId,
  }
}

/**
 * Valida autorização de escrita/mutação para uma filial específica.
 */
export async function assertBranchMutationAllowed(
  auth: FinancialAuthContext,
  targetBranchId: string
): Promise<void> {
  if (!targetBranchId) {
    throw new Error('Identificador de filial obrigatório para mutações financeiras.')
  }

  if (!auth.isExecutive && auth.effectiveBranchId !== targetBranchId) {
    throw new Error('Acesso negado: Você só pode realizar lançamentos na sua própria filial.')
  }
}
