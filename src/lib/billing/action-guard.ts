import prisma from '@/lib/prisma'

export class SubscriptionRequiredError extends Error {
  constructor(
    message = 'Acesso suspenso por pendência financeira. Regularize sua assinatura para continuar operando.',
  ) {
    super(message)
    this.name = 'SubscriptionRequiredError'
  }
}

/**
 * Trava de execução para Server Actions (mutações no banco).
 * Garante que tenants inadimplentes não consigam emitir pareceres, criar cadastros ou movimentar caixas.
 * Usuários com role SUPER_ADMIN possuem bypass irrestrito.
 */
export async function requireActiveSubscription(
  organizationId?: string | null,
  role?: string,
): Promise<void> {
  // SUPER_ADMIN possui bypass irrestrito
  if (role === 'SUPER_ADMIN') return

  // Se não possui organização vinculada, permite prosseguir
  if (!organizationId) return

  const subscription = await prisma.organizationSubscription.findUnique({
    where: { organizationId },
    select: { status: true },
  })

  // Se não tem subscription cadastrada (ex.: implantação inicial assistida), permite operação
  if (!subscription) return

  if (subscription.status === 'SUSPENDED' || subscription.status === 'CANCELLED') {
    throw new SubscriptionRequiredError()
  }
}
