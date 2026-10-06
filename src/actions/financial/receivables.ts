'use server'

import prisma from '@/lib/prisma'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { handleServerError } from '@/lib/errorHandler'
import { requireFinancialAuth, assertBranchMutationAllowed } from '@/lib/financial/auth-guard'
import {
  createReceivableTitleSchema,
  settleReceivableInstallmentSchema,
  reverseReceivablePaymentSchema,
  CreateReceivableTitleInput,
  SettleReceivableInstallmentInput,
  ReverseReceivablePaymentInput,
} from '@/lib/validations/financial'
import { Prisma, ReceivableStatus, InstallmentStatus, CommissionStatus } from '@prisma/client'
import crypto from 'crypto'
import { serializeDecimals } from '@/lib/utils'

export interface ReceivableFilters {
  branchId?: string | null
  producerId?: string
  status?: ReceivableStatus | 'ALL'
  cropYear?: string
  startDate?: string
  endDate?: string
  search?: string
}

const fetchCachedReceivableTitles = unstable_cache(
  async (
    branchKey: string,
    organizationId: string,
    producerIdKey: string,
    statusKey: string,
    cropYearKey: string,
    searchKey: string
  ) => {
    const isGlobal = branchKey === 'ALL'
    const where: Prisma.ReceivableTitleWhereInput = {}

    if (isGlobal) {
      where.branch = { organizationId }
    } else {
      where.branchId = branchKey
    }

    if (producerIdKey) where.producerId = producerIdKey
    if (statusKey && statusKey !== 'ALL') where.status = statusKey as ReceivableStatus
    if (cropYearKey) where.cropYear = cropYearKey

    if (searchKey) {
      where.OR = [
        { documentNumber: { contains: searchKey, mode: 'insensitive' } },
        { producer: { name: { contains: searchKey, mode: 'insensitive' } } },
        { notes: { contains: searchKey, mode: 'insensitive' } },
      ]
    }

    const titles = await prisma.receivableTitle.findMany({
      where,
      include: {
        producer: { select: { id: true, name: true, document: true, phone: true } },
        property: { select: { id: true, name: true } },
        partner: { select: { id: true, name: true, pixKey: true, pixKeyType: true } },
        category: { select: { id: true, name: true, code: true } },
        installments: {
          orderBy: { installmentNumber: 'asc' },
          include: {
            bankAccount: { select: { id: true, bankName: true } },
            receipts: { select: { id: true, receiptNumber: true, issuedAt: true, sha256Hash: true } },
          },
        },
        commissions: {
          select: {
            id: true,
            status: true,
            totalCommissionAmount: true,
            releasedAmount: true,
            paidAmount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return serializeDecimals(titles)
  },
  ['financial-receivables-data'],
  { tags: ['financial-data'], revalidate: 3600 }
)

/**
 * Lista títulos a receber com filtros avançados e isolamento multi-filial (Cache em memória < 50ms).
 */
export async function getReceivableTitles(filters: ReceivableFilters = {}) {
  try {
    const auth = await requireFinancialAuth(filters.branchId)
    const branchKey = auth.isGlobalView || !auth.effectiveBranchId ? 'ALL' : auth.effectiveBranchId

    const titles = await fetchCachedReceivableTitles(
      branchKey,
      auth.organizationId,
      filters.producerId || '',
      filters.status || 'ALL',
      filters.cropYear || '',
      filters.search || ''
    )

    return { data: titles }
  } catch (error) {
    return { error: handleServerError(error, 'getReceivableTitles') }
  }
}

/**
 * Obtém os detalhes completos de um título a receber.
 */
export async function getReceivableTitleById(titleId: string) {
  try {
    const title = await prisma.receivableTitle.findUnique({
      where: { id: titleId },
      include: {
        producer: true,
        property: true,
        partner: true,
        category: true,
        branch: { select: { id: true, name: true, city: true, state: true } },
        installments: {
          orderBy: { installmentNumber: 'asc' },
          include: {
            bankAccount: true,
            receipts: true,
            cashTransactions: {
              where: { isReversed: false },
              orderBy: { transactionDate: 'desc' },
            },
          },
        },
        commissions: {
          include: {
            partner: true,
            payableTitles: {
              include: {
                installments: true,
              },
            },
          },
        },
      },
    })

    if (!title) {
      throw new Error('Título a receber não encontrado.')
    }

    await requireFinancialAuth(title.branchId)

    return { data: serializeDecimals(title) }
  } catch (error) {
    return { error: handleServerError(error, 'getReceivableTitleById') }
  }
}

/**
 * Criação direta de faturamento avulso ou pacotes fechados (CAR, AUI, Laudos de Avaliação).
 */
export async function createDirectReceivableTitle(data: CreateReceivableTitleInput) {
  try {
    const auth = await requireFinancialAuth(data.branchId)
    await assertBranchMutationAllowed(auth, data.branchId)

    const validated = createReceivableTitleSchema.parse(data)

    const grossAmount = new Prisma.Decimal(validated.grossAmount)
    const discountAmount = new Prisma.Decimal(validated.discountAmount || 0)
    const netAmount = grossAmount.sub(discountAmount)

    if (netAmount.lte(0)) {
      throw new Error('O valor líquido do faturamento deve ser maior que zero.')
    }

    // Gerar número de documento se não fornecido
    let documentNumber = validated.documentNumber
    if (!documentNumber) {
      const currentYear = new Date().getFullYear()
      const count = await prisma.receivableTitle.count({
        where: { branchId: validated.branchId },
      })
      documentNumber = `FAT-${currentYear}-${String(count + 1).padStart(4, '0')}`
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cria Título Pai
      const title = await tx.receivableTitle.create({
        data: {
          branchId: validated.branchId,
          producerId: validated.producerId,
          propertyId: validated.propertyId,
          demandId: validated.demandId,
          partnerId: validated.partnerId,
          categoryId: validated.categoryId,
          originType: validated.originType,
          serviceSubtype: validated.serviceSubtype,
          documentNumber,
          cropYear: validated.cropYear,
          financedAmount: validated.financedAmount ? new Prisma.Decimal(validated.financedAmount) : null,
          successFeePercent: validated.successFeePercent ? new Prisma.Decimal(validated.successFeePercent) : null,
          grossAmount,
          discountAmount,
          netAmount,
          totalReceivedAmount: new Prisma.Decimal(0),
          status: 'PENDENTE',
          notes: validated.notes,
        },
      })

      // 2. Cria Parcelas
      const installments = await Promise.all(
        validated.installments.map((inst) =>
          tx.receivableInstallment.create({
            data: {
              receivableTitleId: title.id,
              installmentNumber: inst.installmentNumber,
              totalInstallments: inst.totalInstallments,
              dueDate: new Date(inst.dueDate),
              amount: new Prisma.Decimal(inst.amount),
              receivedAmount: new Prisma.Decimal(0),
              status: 'A_VENCER',
            },
          })
        )
      )

      // 3. Provisão de Comissão do Parceiro (se houver parceiro selecionado)
      let commission = null
      if (validated.partnerId) {
        const partner = await tx.commercialPartner.findUnique({
          where: { id: validated.partnerId },
          select: { defaultCommissionRate: true },
        })

        const commissionRate = partner?.defaultCommissionRate || new Prisma.Decimal(20.0)
        const totalCommissionAmount = netAmount.mul(commissionRate).div(100)

        commission = await tx.partnerCommission.create({
          data: {
            branchId: validated.branchId,
            partnerId: validated.partnerId,
            receivableTitleId: title.id,
            calculationBasisAmount: netAmount,
            commissionPercent: commissionRate,
            totalCommissionAmount,
            releasedAmount: new Prisma.Decimal(0),
            paidAmount: new Prisma.Decimal(0),
            status: 'BLOQUEADO',
          },
        })
      }

      return { title, installments, commission }
    })

    ;(revalidateTag as any)('financial-data')
    revalidatePath('/admin/financial')
    revalidatePath('/admin/financial/receivables')
    return { data: result, success: true }
  } catch (error) {
    return { error: handleServerError(error, 'createDirectReceivableTitle') }
  }
}

/**
 * Liquidação Declaratória de Parcela a Receber (Baixa Parcial ou Total).
 * 
 * Regras Canônicas de Concorrência e Confiabilidade (ADR-021 & ADR-023):
 * 1. Mutação atômica nativa: currentBalance: { increment: receivedAmount } no PostgreSQL via Prisma.
 * 2. Emissão de QuittanceReceipt vinculado diretamente ao CashTransaction.id (permite N recibos por parcela).
 * 3. Destravamento proporcional de comissão do parceiro:
 *    ΔCP_k = TotalComissão * (receivedAmount / NetAmount)
 * 4. Geração automática do PayableTitle correspondente à fração destravada para pagamento PIX.
 */
export async function settleReceivableInstallment(data: SettleReceivableInstallmentInput) {
  try {
    const validated = settleReceivableInstallmentSchema.parse(data)
    const receivedAmount = new Prisma.Decimal(validated.receivedAmount)

    const installment = await prisma.receivableInstallment.findUnique({
      where: { id: validated.installmentId },
      include: {
        receivableTitle: {
          include: {
            producer: true,
            property: true,
            branch: { include: { organization: true } },
            commissions: {
              where: { status: { in: ['BLOQUEADO', 'LIBERADO_PARCIAL'] } },
            },
          },
        },
      },
    })

    if (!installment) {
      throw new Error('Parcela a receber não encontrada.')
    }

    const title = installment.receivableTitle
    const auth = await requireFinancialAuth(title.branchId)
    await assertBranchMutationAllowed(auth, title.branchId)

    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: validated.bankAccountId },
    })

    if (!bankAccount || !bankAccount.isActive) {
      throw new Error('Conta bancária selecionada inválida ou inativa.')
    }

    // Execução Atômica
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mutação Atômica Nativa de Saldo na Conta Bancária (Imunidade a Race Conditions)
      const updatedAccount = await tx.bankAccount.update({
        where: { id: bankAccount.id },
        data: {
          currentBalance: { increment: receivedAmount },
        },
      })

      // 2. Registro do Lançamento em CashTransaction
      const cashTransaction = await tx.cashTransaction.create({
        data: {
          branchId: title.branchId,
          bankAccountId: bankAccount.id,
          type: 'ENTRADA',
          amount: receivedAmount,
          description: `Baixa declaratória parcela ${installment.installmentNumber}/${installment.totalInstallments} - Título ${title.documentNumber}`,
          receivableInstallmentId: installment.id,
          operatorId: auth.user.id,
          transactionDate: validated.receivedAt ? new Date(validated.receivedAt) : new Date(),
        },
      })

      // 3. Atualização da Parcela
      const newInstReceived = installment.receivedAmount.add(receivedAmount)
      const isInstFullyPaid = newInstReceived.gte(installment.amount)

      const updatedInstallment = await tx.receivableInstallment.update({
        where: { id: installment.id },
        data: {
          receivedAmount: newInstReceived,
          receivedAt: new Date(),
          bankAccountId: bankAccount.id,
          status: isInstFullyPaid ? 'QUITADO' : 'A_VENCER',
        },
      })

      // 4. Atualização do Título Pai
      const newTitleReceived = title.totalReceivedAmount.add(receivedAmount)
      const isTitleFullyPaid = newTitleReceived.gte(title.netAmount)

      const updatedTitle = await tx.receivableTitle.update({
        where: { id: title.id },
        data: {
          totalReceivedAmount: newTitleReceived,
          status: isTitleFullyPaid ? 'QUITADO' : 'PARCIALMENTE_RECEBIDO',
        },
      })

      // 5. Emissão do Recibo Oficial (QuittanceReceipt) atrelado à CashTransaction
      const currentYear = new Date().getFullYear()
      const receiptCount = await tx.quittanceReceipt.count()
      const receiptNumber = `REC-LN-${currentYear}-${String(receiptCount + 1).padStart(4, '0')}`

      const payloadSnapshot = {
        receiptNumber,
        transactionId: cashTransaction.id,
        installmentId: installment.id,
        documentNumber: title.documentNumber,
        producerName: title.producer.name,
        producerDocument: title.producer.document,
        propertyName: title.property?.name || 'N/A',
        installmentNumber: installment.installmentNumber,
        totalInstallments: installment.totalInstallments,
        amountReceivedThisEvent: receivedAmount.toNumber(),
        totalInstallmentReceived: newInstReceived.toNumber(),
        installmentTotalAmount: installment.amount.toNumber(),
        remainingInstallmentBalance: Math.max(0, installment.amount.sub(newInstReceived).toNumber()),
        bankAccountName: bankAccount.bankName,
        paymentDate: cashTransaction.transactionDate.toISOString(),
        issuedById: auth.user.id,
      }

      const sha256Hash = crypto
        .createHash('sha256')
        .update(JSON.stringify(payloadSnapshot))
        .digest('hex')

      const receipt = await tx.quittanceReceipt.create({
        data: {
          receiptNumber,
          installmentId: installment.id,
          transactionId: cashTransaction.id,
          payloadSnapshot,
          sha256Hash,
          issuedById: auth.user.id,
        },
      })

      // 6. Motor de Destravamento Proporcional de Comissões de Parceiros (ADR-021 / ADR-023)
      const unlockedCommissions = []
      for (const commission of title.commissions) {
        // Fração destravada = TotalComissão * (receivedAmount / NetAmount)
        const unlockRatio = receivedAmount.div(title.netAmount)
        const unlockAmount = commission.totalCommissionAmount.mul(unlockRatio)

        const newReleased = commission.releasedAmount.add(unlockAmount)
        const isFullyReleased = newReleased.gte(commission.totalCommissionAmount)

        const updatedCommission = await tx.partnerCommission.update({
          where: { id: commission.id },
          data: {
            releasedAmount: newReleased,
            status: isFullyReleased ? 'LIBERADO_TOTAL' : 'LIBERADO_PARCIAL',
          },
        })

        // Buscar categoria de comissão de parceiros (código 2.1.04)
        let commCategory = await tx.financialCategory.findFirst({
          where: {
            organizationId: title.branch.organizationId,
            code: '2.1.04',
          },
        })

        if (!commCategory) {
          commCategory = await tx.financialCategory.findFirst({
            where: {
              organizationId: title.branch.organizationId,
              type: 'DESPESA',
            },
          })
        }

        // Criar o Título a Pagar para o Parceiro correspondente à fração destravada com trava de idempotência
        if (unlockAmount.gt(0) && commCategory) {
          const partner = await tx.commercialPartner.findUnique({
            where: { id: commission.partnerId },
          })

          const idempotencyKey = `[IDEMPOTENCY:partnerCommissionId=${commission.id}:installmentId=${installment.id}]`

          const existingPayable = await tx.payableTitle.findFirst({
            where: {
              branchId: title.branchId,
              partnerCommissionId: commission.id,
              OR: [
                { notes: { contains: idempotencyKey } },
                { notes: { contains: `baixa da parcela ${installment.installmentNumber} do título ${title.documentNumber}` } },
                { documentNumber: `COM-${receiptNumber}` },
              ],
            },
          })

          let payableTitle = existingPayable

          if (!payableTitle) {
            payableTitle = await tx.payableTitle.create({
              data: {
                branchId: title.branchId,
                categoryId: commCategory.id,
                partnerCommissionId: commission.id,
                supplierName: partner?.name || 'Parceiro Comercial',
                supplierDocument: partner?.document,
                documentNumber: `COM-${receiptNumber}`,
                expenseType: 'COMISSAO_PARCEIRO',
                cropYear: title.cropYear,
                totalAmount: unlockAmount,
                paidAmount: new Prisma.Decimal(0),
                status: 'PENDENTE',
                notes: `Comissão destravada proporcionalmente referente à baixa da parcela ${installment.installmentNumber} do título ${title.documentNumber}. Chave PIX: ${partner?.pixKey} (${partner?.pixKeyType}). ${idempotencyKey}`,
              },
            })

            // Cria parcela única a pagar
            await tx.payableInstallment.create({
              data: {
                payableTitleId: payableTitle.id,
                installmentNumber: 1,
                totalInstallments: 1,
                dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Vencimento padrão: 5 dias
                amount: unlockAmount,
                paidAmount: new Prisma.Decimal(0),
                status: 'A_VENCER',
              },
            })
          }

          unlockedCommissions.push({ commission: updatedCommission, payableTitle })
        }
      }

      return {
        cashTransaction,
        updatedInstallment,
        updatedTitle,
        receipt,
        unlockedCommissions,
        updatedAccount,
      }
    })

    ;(revalidateTag as any)('financial-data')
    revalidatePath('/admin/financial')
    revalidatePath('/admin/financial/receivables')
    revalidatePath('/admin/financial/payables')
    revalidatePath('/admin/financial/partners')
    return { data: result, success: true }
  } catch (error) {
    return { error: handleServerError(error, 'settleReceivableInstallment') }
  }
}

/**
 * Estorno de Liquidação Financeira com Justificativa e Rastreabilidade Completa.
 * 
 * Regra Arquitetural (ADR-023 & Cláusula 2.3 Aditivo 004):
 * 1. Justificativa formal obrigatória (mínimo 15 caracteres).
 * 2. Estorno atômico de saldo: currentBalance: { decrement: amount }.
 * 3. Reversão do status da parcela e título para A_VENCER / PARCIAL.
 * 4. Invalidação do QuittanceReceipt correspondente.
 * 5. Re-bloqueio ou cancelamento da fração de comissão destravada.
 * 6. Gravação imutável de FinancialAuditLog.
 */
export async function reverseReceivablePayment(data: ReverseReceivablePaymentInput) {
  try {
    const validated = reverseReceivablePaymentSchema.parse(data)

    const transaction = await prisma.cashTransaction.findUnique({
      where: { id: validated.transactionId },
      include: {
        receivableInstallment: {
          include: {
            receivableTitle: {
              include: {
                commissions: true,
              },
            },
          },
        },
        receipt: true,
      },
    })

    if (!transaction) {
      throw new Error('Transação financeira não encontrada.')
    }

    if (transaction.isReversed) {
      throw new Error('Esta transação já foi estornada anteriormente.')
    }

    if (!transaction.receivableInstallment) {
      throw new Error('Transação não associada a uma parcela a receber.')
    }

    const installment = transaction.receivableInstallment
    const title = installment.receivableTitle
    const auth = await requireFinancialAuth(transaction.branchId)
    await assertBranchMutationAllowed(auth, transaction.branchId)

    const reversedAmount = transaction.amount

    const result = await prisma.$transaction(async (tx) => {
      // 1. Marca a transação como estornada
      const updatedTx = await tx.cashTransaction.update({
        where: { id: transaction.id },
        data: {
          isReversed: true,
          reversedAt: new Date(),
          reversalReason: validated.justification,
        },
      })

      // 2. Estorno Atômico de Saldo no Banco (Decrementa o crédito indevido)
      const updatedAccount = await tx.bankAccount.update({
        where: { id: transaction.bankAccountId },
        data: {
          currentBalance: { decrement: reversedAmount },
        },
      })

      // 3. Subtrai recebido da parcela
      const newInstReceived = Prisma.Decimal.max(new Prisma.Decimal(0), installment.receivedAmount.sub(reversedAmount))
      const isPastDue = new Date() > new Date(installment.dueDate)

      const updatedInstallment = await tx.receivableInstallment.update({
        where: { id: installment.id },
        data: {
          receivedAmount: newInstReceived,
          status: newInstReceived.eq(0) ? (isPastDue ? 'EM_ATRASO' : 'A_VENCER') : 'A_VENCER',
        },
      })

      // 4. Subtrai recebido do título pai
      const newTitleReceived = Prisma.Decimal.max(new Prisma.Decimal(0), title.totalReceivedAmount.sub(reversedAmount))
      const updatedTitle = await tx.receivableTitle.update({
        where: { id: title.id },
        data: {
          totalReceivedAmount: newTitleReceived,
          status: newTitleReceived.eq(0) ? 'PENDENTE' : 'PARCIALMENTE_RECEBIDO',
        },
      })

      // 5. Invalida o recibo associado
      if (transaction.receipt) {
        await tx.quittanceReceipt.update({
          where: { id: transaction.receipt.id },
          data: {
            pdfStoragePath: null,
            payloadSnapshot: {
              ...(transaction.receipt.payloadSnapshot as Record<string, any>),
              invalidated: true,
              invalidatedAt: new Date().toISOString(),
              invalidationReason: validated.justification,
            },
          },
        })
      }

      // 6. Reverte a comissão destravada
      for (const commission of title.commissions) {
        const unlockRatio = reversedAmount.div(title.netAmount)
        const reblockAmount = commission.totalCommissionAmount.mul(unlockRatio)
        const newReleased = Prisma.Decimal.max(new Prisma.Decimal(0), commission.releasedAmount.sub(reblockAmount))

        await tx.partnerCommission.update({
          where: { id: commission.id },
          data: {
            releasedAmount: newReleased,
            status: newReleased.eq(0) ? 'BLOQUEADO' : 'LIBERADO_PARCIAL',
          },
        })

        // Cancelar o título a pagar de comissão gerado pelo recibo estornado
        if (transaction.receipt) {
          const commDocNumber = `COM-${transaction.receipt.receiptNumber}`
          await tx.payableTitle.updateMany({
            where: {
              partnerCommissionId: commission.id,
              documentNumber: commDocNumber,
              status: 'PENDENTE',
            },
            data: {
              status: 'CANCELADO',
              notes: `Cancelado automaticamente em virtude do estorno da transação #${transaction.id.slice(0, 8)}. Motivo: ${validated.justification}`,
            },
          })
        }
      }

      // 7. Registro Imutável de Auditoria (FinancialAuditLog)
      const auditLog = await tx.financialAuditLog.create({
        data: {
          branchId: transaction.branchId,
          userId: auth.user.id,
          action: 'ESTORNO_BAIXA',
          entityName: 'ReceivableInstallment',
          entityId: installment.id,
          justification: validated.justification,
          oldSnapshot: {
            transactionId: transaction.id,
            amount: reversedAmount.toNumber(),
            previousInstallmentReceived: installment.receivedAmount.toNumber(),
            previousTitleReceived: title.totalReceivedAmount.toNumber(),
          },
          newSnapshot: {
            newInstallmentReceived: newInstReceived.toNumber(),
            newTitleReceived: newTitleReceived.toNumber(),
            reversedAt: new Date().toISOString(),
          },
        },
      })

      return { updatedTx, updatedAccount, updatedInstallment, updatedTitle, auditLog }
    })

    ;(revalidateTag as any)('financial-data')
    revalidatePath('/admin/financial')
    revalidatePath('/admin/financial/receivables')
    revalidatePath('/admin/financial/payables')
    return { data: result, success: true }
  } catch (error) {
    return { error: handleServerError(error, 'reverseReceivablePayment') }
  }
}

/**
 * Baixa por Inadimplência / Perda com Cancelamento Formal de Comissões.
 */
export async function archiveReceivableAsLoss(titleId: string, justification: string) {
  try {
    if (!justification || justification.trim().length < 15) {
      throw new Error('A justificativa de baixa por inadimplência deve ter no mínimo 15 caracteres.')
    }

    const title = await prisma.receivableTitle.findUnique({
      where: { id: titleId },
      include: { commissions: true },
    })

    if (!title) {
      throw new Error('Título não encontrado.')
    }

    const auth = await requireFinancialAuth(title.branchId)
    await assertBranchMutationAllowed(auth, title.branchId)

    const result = await prisma.$transaction(async (tx) => {
      // 1. Transita título para BAIXADO_INADIMPLENCIA
      const updatedTitle = await tx.receivableTitle.update({
        where: { id: title.id },
        data: {
          status: 'BAIXADO_INADIMPLENCIA',
          notes: `${title.notes || ''}\n[BAIXA INADIMPLÊNCIA]: ${justification}`,
        },
      })

      // 2. Cancela parcelas pendentes
      await tx.receivableInstallment.updateMany({
        where: {
          receivableTitleId: title.id,
          status: { in: ['A_VENCER', 'EM_ATRASO'] },
        },
        data: {
          status: 'CANCELADO',
        },
      })

      // 3. Cancela comissões ainda bloqueadas
      await tx.partnerCommission.updateMany({
        where: {
          receivableTitleId: title.id,
          status: 'BLOQUEADO',
        },
        data: {
          status: 'CANCELADO',
        },
      })

      // 4. Auditoria
      await tx.financialAuditLog.create({
        data: {
          branchId: title.branchId,
          userId: auth.user.id,
          action: 'BAIXA_INADIMPLENCIA',
          entityName: 'ReceivableTitle',
          entityId: title.id,
          justification,
          oldSnapshot: { status: title.status, netAmount: title.netAmount.toNumber() },
          newSnapshot: { status: 'BAIXADO_INADIMPLENCIA' },
        },
      })

      return updatedTitle
    })

    revalidatePath('/admin/financial/receivables')
    return { data: result, success: true }
  } catch (error) {
    return { error: handleServerError(error, 'archiveReceivableAsLoss') }
  }
}

/**
 * Obtém os dados completos do Recibo de Quitação para renderização e emissão em PDF (336 DPI).
 */
export async function getQuittanceReceiptData(receiptId: string) {
  try {
    const receipt = await prisma.quittanceReceipt.findUnique({
      where: { id: receiptId },
      include: {
        transaction: {
          include: {
            bankAccount: true,
          },
        },
        installment: {
          include: {
            receivableTitle: {
              include: {
                producer: true,
                property: true,
                branch: {
                  include: {
                    organization: true,
                  },
                },
                category: true,
              },
            },
          },
        },
      },
    })

    if (!receipt) {
      throw new Error('Recibo de quitação não encontrado.')
    }

    const title = receipt.installment.receivableTitle
    await requireFinancialAuth(title.branchId)

    return { data: receipt, success: true }
  } catch (error) {
    return { error: handleServerError(error, 'getQuittanceReceiptData') }
  }
}
