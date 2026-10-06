import prisma from '@/lib/prisma'

export interface OperatorInfo {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
}

/**
 * Resolve lote de IDs de operadores para nome e email amigáveis, com fallback elegante.
 */
export async function resolveOperators(
  operatorIds: string[]
): Promise<Map<string, OperatorInfo>> {
  const map = new Map<string, OperatorInfo>()
  const cleanIds = Array.from(new Set(operatorIds.filter(Boolean)))

  if (cleanIds.length === 0) {
    return map
  }

  try {
    const users = await prisma.user.findMany({
      where: { id: { in: cleanIds } },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
      },
    })

    for (const u of users) {
      map.set(u.id, {
        id: u.id,
        name: u.fullName || u.email.split('@')[0],
        email: u.email,
        avatarUrl: u.avatarUrl,
      })
    }
  } catch (err) {
    console.error('[resolveOperators] Erro ao consultar operadores:', err)
  }

  // Preenche fallbacks para IDs não localizados
  for (const id of cleanIds) {
    if (!map.has(id)) {
      map.set(id, {
        id,
        name: 'Operador Financeiro',
        email: 'sistema@agrotech.com',
        avatarUrl: null,
      })
    }
  }

  return map
}
