'use server'

import prisma from '@/lib/prisma'
import { requireFinancialAuth } from '@/lib/financial/auth-guard'
import { resolveOperators, type OperatorInfo } from '@/lib/financial/audit-operator'
import { serializeDecimals } from '@/lib/utils'

export type AuditEventType = 'CRIACAO' | 'LIQUIDACAO' | 'COMISSAO' | 'ESTORNO'

export interface AuditTimelineEvent {
  id: string
  type: AuditEventType
  timestamp: string
  title: string
  description: string
  amount?: number
  remainingBalance?: number
  bankAccountName?: string
  operator?: OperatorInfo
  receiptId?: string
  receiptNumber?: string
  partnerName?: string
  pixKey?: string
  pixKeyType?: string
  reversalReason?: string
  metadata?: Record<string, any>
}

export interface TitleAuditTimelineData {
  titleId: string
  type: 'RECEIVABLE' | 'PAYABLE'
  documentNumber: string
  entityName: string // Nome do produtor ou fornecedor
  totalAmount: number
  status: string
  createdAt: string
  events: AuditTimelineEvent[]
}

/**
 * Consulta a Trilha de Auditoria Integral (Audit Trail) de um título a receber ou a pagar.
 */
export async function getTitleAuditTimeline(
  titleId: string,
  type: 'RECEIVABLE' | 'PAYABLE'
): Promise<{ data?: TitleAuditTimelineData; error?: string }> {
  try {
    const auth = await requireFinancialAuth()

    const operatorIds: string[] = []
    const events: AuditTimelineEvent[] = []

    if (type === 'RECEIVABLE') {
      const title = await prisma.receivableTitle.findUnique({
        where: { id: titleId },
        include: {
          producer: { select: { name: true, document: true } },
          category: { select: { name: true, code: true } },
          branch: { select: { name: true, organizationId: true } },
          demand: {
            select: {
              id: true,
              serviceType: true,
              createdById: true,
            },
          },
          installments: {
            orderBy: { installmentNumber: 'asc' },
            include: {
              bankAccount: { select: { bankName: true } },
              receipts: { select: { id: true, receiptNumber: true, issuedAt: true, issuedById: true } },
              cashTransactions: {
                orderBy: { transactionDate: 'asc' },
                include: {
                  bankAccount: { select: { bankName: true } },
                },
              },
            },
          },
          commissions: {
            include: {
              partner: { select: { name: true, pixKey: true, pixKeyType: true } },
            },
          },
        },
      })

      if (!title) {
        return { error: 'Título a receber não encontrado.' }
      }

      // Validação de acesso multi-tenant
      if (!auth.isExecutive && auth.effectiveBranchId !== title.branchId) {
        return { error: 'Acesso negado: Você não tem permissão para visualizar este título.' }
      }

      // Coleta operadores
      if (title.demand?.createdById) operatorIds.push(title.demand.createdById)

      for (const inst of title.installments) {
        for (const receipt of inst.receipts) {
          if (receipt.issuedById) operatorIds.push(receipt.issuedById)
        }
        for (const tx of inst.cashTransactions) {
          if (tx.operatorId) operatorIds.push(tx.operatorId)
        }
      }

      // Consulta logs de auditoria explícitos
      const auditLogs = await prisma.financialAuditLog.findMany({
        where: { entityId: titleId },
        orderBy: { createdAt: 'desc' },
      })

      for (const log of auditLogs) {
        if (log.userId) operatorIds.push(log.userId)
      }

      const operatorsMap = await resolveOperators(operatorIds)

      const creationLog = auditLogs.find((l) => l.action === 'CRIACAO_TITULO')
      const creationOperator =
        creationLog && creationLog.userId ? operatorsMap.get(creationLog.userId) : null

      // 1. Evento de Criação
      events.push({
        id: `create-${title.id}`,
        type: 'CRIACAO',
        timestamp: title.createdAt.toISOString(),
        title: 'Criação do Título a Receber',
        description:
          title.originType === 'ESTEIRA_CREDITO'
            ? `Título gerado automaticamente via Esteira de Crédito Rural (Demanda #${title.demandId?.slice(0, 8) || 'N/A'}).`
            : 'Faturamento direto avulso cadastrado no ERP Financeiro.',
        amount: Number(title.grossAmount),
        operator: title.demand?.createdById
          ? operatorsMap.get(title.demand.createdById)
          : creationOperator || { id: 'sys', name: 'Sistema Automático / Esteira', email: 'sistema@agrotech.com' },
        metadata: {
          cropYear: title.cropYear,
          serviceSubtype: title.serviceSubtype || title.category?.name,
          financedAmount: title.financedAmount ? Number(title.financedAmount) : null,
          successFeePercent: title.successFeePercent ? Number(title.successFeePercent) : null,
        },
      })

      // 2. Eventos de Liquidação e Estorno
      for (const inst of title.installments) {
        for (const tx of inst.cashTransactions) {
          const operator = operatorsMap.get(tx.operatorId)
          const receipt = inst.receipts[0]

          if (tx.isReversed) {
            // Estorno
            events.push({
              id: `reverse-${tx.id}`,
              type: 'ESTORNO',
              timestamp: (tx.reversedAt || tx.transactionDate).toISOString(),
              title: `Estorno de Pagamento — Parcela ${inst.installmentNumber}/${inst.totalInstallments}`,
              description: `Operação de baixa desfeita pelo operador. Saldo do título recomposto.`,
              amount: Number(tx.amount),
              reversalReason: tx.reversalReason || 'Estorno operacional de liquidação.',
              operator,
              bankAccountName: tx.bankAccount?.bankName,
            })
          } else {
            // Liquidação
            const instAmount = Number(inst.amount)
            const instReceived = Number(inst.receivedAmount)
            const remaining = Math.max(0, instAmount - instReceived)

            events.push({
              id: `settle-${tx.id}`,
              type: 'LIQUIDACAO',
              timestamp: tx.transactionDate.toISOString(),
              title: `Baixa / Liquidação — Parcela ${inst.installmentNumber}/${inst.totalInstallments}`,
              description: `Recebimento financeiro registrado e conciliado no caixa.`,
              amount: Number(tx.amount),
              remainingBalance: remaining,
              bankAccountName: tx.bankAccount?.bankName,
              operator,
              receiptId: receipt?.id,
              receiptNumber: receipt?.receiptNumber,
            })
          }
        }
      }

      // 3. Eventos de Comissão de Parceiros
      for (const comm of title.commissions) {
        const released = Number(comm.releasedAmount)
        if (released > 0) {
          events.push({
            id: `comm-${comm.id}`,
            type: 'COMISSAO',
            timestamp: comm.updatedAt.toISOString(),
            title: `Comissão Destravada — ${comm.partner.name}`,
            description: `Destravamento proporcional automático (${Number(comm.commissionPercent)}% sobre a receita liquidada).`,
            amount: released,
            partnerName: comm.partner.name,
            pixKey: comm.partner.pixKey || 'Não cadastrada',
            pixKeyType: comm.partner.pixKeyType || 'PIX',
            metadata: {
              status: comm.status,
              totalCommission: Number(comm.totalCommissionAmount),
              paidAmount: Number(comm.paidAmount),
            },
          })
        }
      }

      // Ordena por timestamp crescente
      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      return {
        data: serializeDecimals({
          titleId: title.id,
          type: 'RECEIVABLE',
          documentNumber: title.documentNumber,
          entityName: title.producer?.name || 'Produtor Rural',
          totalAmount: Number(title.grossAmount),
          status: title.status,
          createdAt: title.createdAt.toISOString(),
          events,
        }),
      }
    }

    // Caso type === 'PAYABLE'
    const payable = await prisma.payableTitle.findUnique({
      where: { id: titleId },
      include: {
        category: { select: { name: true, code: true } },
        branch: { select: { name: true } },
        demand: { select: { id: true, serviceType: true } },
        partnerCommission: {
          include: {
            partner: { select: { name: true, pixKey: true, pixKeyType: true } },
          },
        },
        installments: {
          orderBy: { installmentNumber: 'asc' },
          include: {
            bankAccount: { select: { bankName: true } },
            cashTransactions: {
              orderBy: { transactionDate: 'asc' },
              include: {
                bankAccount: { select: { bankName: true } },
              },
            },
          },
        },
      },
    })

    if (!payable) {
      return { error: 'Título a pagar não encontrado.' }
    }

    if (!auth.isExecutive && auth.effectiveBranchId !== payable.branchId) {
      return { error: 'Acesso negado: Você não tem permissão para visualizar este título.' }
    }

    for (const inst of payable.installments) {
      for (const tx of inst.cashTransactions) {
        if (tx.operatorId) operatorIds.push(tx.operatorId)
      }
    }

    const auditLogs = await prisma.financialAuditLog.findMany({
      where: { entityId: titleId },
      orderBy: { createdAt: 'desc' },
    })

    for (const log of auditLogs) {
      if (log.userId) operatorIds.push(log.userId)
    }

    const operatorsMap = await resolveOperators(operatorIds)

    const creationLog = auditLogs.find((l) => l.action === 'CRIACAO_TITULO')
    const creationOperator =
      creationLog && creationLog.userId ? operatorsMap.get(creationLog.userId) : null

    // 1. Criação
    events.push({
      id: `create-${payable.id}`,
      type: 'CRIACAO',
      timestamp: payable.createdAt.toISOString(),
      title: 'Lançamento do Título a Pagar',
      description: payable.partnerCommissionId
        ? `Obrigação financeira gerada por destravamento de comissão do parceiro ${payable.supplierName}.`
        : `Despesa operacional registrada na categoria ${payable.category?.name || 'Geral'}.`,
      amount: Number(payable.totalAmount),
      operator: creationOperator || { id: 'sys', name: 'Operador / Sistema', email: 'financeiro@agrotech.com' },
      metadata: {
        expenseType: payable.expenseType,
        cropYear: payable.cropYear,
        notes: payable.notes,
      },
    })

    // 2. Liquidações e Estornos de Saída
    for (const inst of payable.installments) {
      for (const tx of inst.cashTransactions) {
        const operator = operatorsMap.get(tx.operatorId)

        if (tx.isReversed) {
          events.push({
            id: `reverse-${tx.id}`,
            type: 'ESTORNO',
            timestamp: (tx.reversedAt || tx.transactionDate).toISOString(),
            title: `Estorno de Pagamento — Boleto ${inst.installmentNumber}/${inst.totalInstallments}`,
            description: 'Pagamento desfeito pelo operador financeiro com estorno no livro-caixa.',
            amount: Number(tx.amount),
            reversalReason: tx.reversalReason || 'Estorno operacional de pagamento.',
            operator,
            bankAccountName: tx.bankAccount?.bankName,
          })
        } else {
          const instAmount = Number(inst.amount)
          const instPaid = Number(inst.paidAmount)
          const remaining = Math.max(0, instAmount - instPaid)

          events.push({
            id: `settle-${tx.id}`,
            type: 'LIQUIDACAO',
            timestamp: tx.transactionDate.toISOString(),
            title: `Pagamento Efetivado — Boleto ${inst.installmentNumber}/${inst.totalInstallments}`,
            description: `Transferência bancária/PIX realizada com débito na conta.`,
            amount: Number(tx.amount),
            remainingBalance: remaining,
            bankAccountName: tx.bankAccount?.bankName,
            operator,
          })
        }
      }
    }

    // 3. Informações de Comissão
    if (payable.partnerCommission) {
      const comm = payable.partnerCommission
      events.push({
        id: `comm-info-${comm.id}`,
        type: 'COMISSAO',
        timestamp: comm.createdAt.toISOString(),
        title: `Vínculo de Comissão Comercial — ${comm.partner.name}`,
        description: `Favorecido comercial vinculado com chave cadastrada para pagamento.`,
        amount: Number(comm.totalCommissionAmount),
        partnerName: comm.partner.name,
        pixKey: comm.partner.pixKey || 'Não informada',
        pixKeyType: comm.partner.pixKeyType || 'PIX',
      })
    }

    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    return {
      data: serializeDecimals({
        titleId: payable.id,
        type: 'PAYABLE',
        documentNumber: payable.documentNumber || 'S/N',
        entityName: payable.supplierName,
        totalAmount: Number(payable.totalAmount),
        status: payable.status,
        createdAt: payable.createdAt.toISOString(),
        events,
      }),
    }
  } catch (error: any) {
    console.error('[getTitleAuditTimeline] Erro:', error)
    return { error: error?.message || 'Erro ao carregar linha do tempo de auditoria.' }
  }
}
