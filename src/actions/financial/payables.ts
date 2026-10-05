'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { handleServerError } from '@/lib/errorHandler'
import { requireFinancialAuth, assertBranchMutationAllowed } from '@/lib/financial/auth-guard'
import {
  createPayableTitleSchema,
  settlePayableInstallmentSchema,
  CreatePayableTitleInput,
  SettlePayableInstallmentInput,
} from '@/lib/validations/financial'
import { Prisma, PayableStatus, ExpenseType } from '@prisma/client'

export interface PayableFilters {
  branchId?: string | null
  status?: PayableStatus | 'ALL'
  expenseType?: ExpenseType | 'ALL'
  categoryId?: string
  cropYear?: string
  search?: string
}

/**
 * Lista títulos a pagar com suporte a filtros e isolamento multi-filial.
 */
export async function getPayableTitles(filters: PayableFilters = {}) {
  try {
    const auth = await requireFinancialAuth(filters.branchId)

    const where: Prisma.PayableTitleWhereInput = {}

    if (auth.isGlobalView || !auth.effectiveBranchId) {
      where.branch = { organizationId: auth.organizationId }
    } else {
      where.branchId = auth.effectiveBranchId
    }

    if (filters.status && filters.status !== 'ALL') where.status = filters.status
    if (filters.expenseType && filters.expenseType !== 'ALL') where.expenseType = filters.expenseType
    if (filters.categoryId) where.categoryId = filters.categoryId
    if (filters.cropYear) where.cropYear = filters.cropYear

    if (filters.search) {
      where.OR = [
        { supplierName: { contains: filters.search, mode: 'insensitive' } },
        { documentNumber: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const payables = await prisma.payableTitle.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, code: true, isDirectProjectCost: true } },
        demand: { select: { id: true, serviceType: true, producer: { select: { name: true } } } },
        partnerCommission: {
          select: {
            id: true,
            partner: { select: { id: true, name: true, pixKey: true, pixKeyType: true } },
          },
        },
        installments: {
          orderBy: { installmentNumber: 'asc' },
          include: {
            bankAccount: { select: { id: true, bankName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { data: payables }
  } catch (error) {
    return { error: handleServerError(error, 'getPayableTitles') }
  }
}

/**
 * Obtém detalhes completos de um título a pagar.
 */
export async function getPayableTitleById(id: string) {
  try {
    const title = await prisma.payableTitle.findUnique({
      where: { id },
      include: {
        category: true,
        demand: { include: { producer: true } },
        partnerCommission: { include: { partner: true } },
        branch: { select: { id: true, name: true, city: true, state: true } },
        installments: {
          orderBy: { installmentNumber: 'asc' },
          include: {
            bankAccount: true,
            cashTransactions: {
              where: { isReversed: false },
              orderBy: { transactionDate: 'desc' },
            },
          },
        },
      },
    })

    if (!title) {
      throw new Error('Título a pagar não encontrado.')
    }

    await requireFinancialAuth(title.branchId)

    return { data: title }
  } catch (error) {
    return { error: handleServerError(error, 'getPayableTitleById') }
  }
}

/**
 * Apropriação ágil de despesas e compras parceladas a prazo (ADR-022).
 */
export async function createDirectPayableTitle(data: CreatePayableTitleInput) {
  try {
    const auth = await requireFinancialAuth(data.branchId)
    await assertBranchMutationAllowed(auth, data.branchId)

    const validated = createPayableTitleSchema.parse(data)
    const totalAmount = new Prisma.Decimal(validated.totalAmount)

    let documentNumber = validated.documentNumber
    if (!documentNumber) {
      const currentYear = new Date().getFullYear()
      const count = await prisma.payableTitle.count({
        where: { branchId: validated.branchId },
      })
      documentNumber = `PAG-${currentYear}-${String(count + 1).padStart(4, '0')}`
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cria Título Pai
      const title = await tx.payableTitle.create({
        data: {
          branchId: validated.branchId,
          categoryId: validated.categoryId,
          demandId: validated.demandId,
          partnerCommissionId: validated.partnerCommissionId,
          supplierName: validated.supplierName.trim(),
          supplierDocument: validated.supplierDocument?.replace(/[^\d]+/g, ''),
          documentNumber,
          expenseType: validated.expenseType,
          cropYear: validated.cropYear,
          totalAmount,
          paidAmount: new Prisma.Decimal(0),
          isInstallmentPurchase: validated.isInstallmentPurchase,
          status: 'PENDENTE',
          notes: validated.notes,
        },
      })

      // 2. Desdobramento em N parcelas / boletos futuros (ADR-022)
      const installments = await Promise.all(
        validated.installments.map((inst) =>
          tx.payableInstallment.create({
            data: {
              payableTitleId: title.id,
              installmentNumber: inst.installmentNumber,
              totalInstallments: inst.totalInstallments,
              dueDate: new Date(inst.dueDate),
              amount: new Prisma.Decimal(inst.amount),
              paidAmount: new Prisma.Decimal(0),
              status: 'A_VENCER',
            },
          })
        )
      )

      return { title, installments }
    })

    revalidatePath('/admin/financial')
    revalidatePath('/admin/financial/payables')
    return { data: result, success: true }
  } catch (error) {
    return { error: handleServerError(error, 'createDirectPayableTitle') }
  }
}

/**
 * Liquidação de Parcela a Pagar (Débito em Conta / Caixa Físico).
 * 
 * Regra Arquitetural (ADR-023):
 * 1. Mutação atômica nativa: currentBalance: { decrement: paidAmount } no banco.
 * 2. Registro em CashTransaction com type: SAIDA.
 * 3. Se for comissão de parceiro, atualiza paidAmount em PartnerCommission.
 */
export async function settlePayableInstallment(data: SettlePayableInstallmentInput) {
  try {
    const validated = settlePayableInstallmentSchema.parse(data)
    const paidAmount = new Prisma.Decimal(validated.paidAmount)

    const installment = await prisma.payableInstallment.findUnique({
      where: { id: validated.installmentId },
      include: {
        payableTitle: {
          include: {
            partnerCommission: true,
          },
        },
      },
    })

    if (!installment) {
      throw new Error('Parcela a pagar não encontrada.')
    }

    const title = installment.payableTitle
    const auth = await requireFinancialAuth(title.branchId)
    await assertBranchMutationAllowed(auth, title.branchId)

    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: validated.bankAccountId },
    })

    if (!bankAccount || !bankAccount.isActive) {
      throw new Error('Conta bancária de débito inválida ou inativa.')
    }

    // Execução Atômica
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mutação Atômica Nativa de Saldo (Decrementa o caixa de saída)
      const updatedAccount = await tx.bankAccount.update({
        where: { id: bankAccount.id },
        data: {
          currentBalance: { decrement: paidAmount },
        },
      })

      // 2. Registra o evento de saída
      const cashTransaction = await tx.cashTransaction.create({
        data: {
          branchId: title.branchId,
          bankAccountId: bankAccount.id,
          type: 'SAIDA',
          amount: paidAmount,
          description: `Pagamento parcela ${installment.installmentNumber}/${installment.totalInstallments} - ${title.supplierName} (${title.documentNumber || 'S/N'})`,
          payableInstallmentId: installment.id,
          operatorId: auth.user.id,
          transactionDate: validated.paidAt ? new Date(validated.paidAt) : new Date(),
        },
      })

      // 3. Atualiza a Parcela
      const newInstPaid = installment.paidAmount.add(paidAmount)
      const isInstFullyPaid = newInstPaid.gte(installment.amount)

      const updatedInstallment = await tx.payableInstallment.update({
        where: { id: installment.id },
        data: {
          paidAmount: newInstPaid,
          paidAt: new Date(),
          bankAccountId: bankAccount.id,
          status: isInstFullyPaid ? 'QUITADO' : 'A_VENCER',
        },
      })

      // 4. Atualiza o Título Pai
      const newTitlePaid = title.paidAmount.add(paidAmount)
      const isTitleFullyPaid = newTitlePaid.gte(title.totalAmount)

      const updatedTitle = await tx.payableTitle.update({
        where: { id: title.id },
        data: {
          paidAmount: newTitlePaid,
          status: isTitleFullyPaid ? 'PAGO' : 'PARCIALMENTE_PAGO',
        },
      })

      // 5. Se for comissão de parceiro, atualiza o acumulado pago na PartnerCommission
      let updatedCommission = null
      if (title.partnerCommission) {
        const commission = title.partnerCommission
        const newCommPaid = commission.paidAmount.add(paidAmount)
        const isCommFullyPaid = newCommPaid.gte(commission.totalCommissionAmount)

        updatedCommission = await tx.partnerCommission.update({
          where: { id: commission.id },
          data: {
            paidAmount: newCommPaid,
            status: isCommFullyPaid ? 'PAGO' : commission.status,
          },
        })
      }

      return { cashTransaction, updatedInstallment, updatedTitle, updatedCommission, updatedAccount }
    })

    revalidatePath('/admin/financial')
    revalidatePath('/admin/financial/payables')
    revalidatePath('/admin/financial/partners')
    return { data: result, success: true }
  } catch (error) {
    return { error: handleServerError(error, 'settlePayableInstallment') }
  }
}

/**
 * Estorno de Pagamento de Título a Pagar.
 */
export async function reversePayablePayment(transactionId: string, justification: string) {
  try {
    if (!justification || justification.trim().length < 15) {
      throw new Error('A justificativa do estorno deve conter no mínimo 15 caracteres.')
    }

    const transaction = await prisma.cashTransaction.findUnique({
      where: { id: transactionId },
      include: {
        payableInstallment: {
          include: {
            payableTitle: {
              include: { partnerCommission: true },
            },
          },
        },
      },
    })

    if (!transaction || transaction.type !== 'SAIDA' || !transaction.payableInstallment) {
      throw new Error('Transação de pagamento a pagar inválida ou não encontrada.')
    }

    if (transaction.isReversed) {
      throw new Error('Esta transação já foi estornada.')
    }

    const installment = transaction.payableInstallment
    const title = installment.payableTitle
    const auth = await requireFinancialAuth(transaction.branchId)
    await assertBranchMutationAllowed(auth, transaction.branchId)

    const reversedAmount = transaction.amount

    const result = await prisma.$transaction(async (tx) => {
      // 1. Marca transação como estornada
      const updatedTx = await tx.cashTransaction.update({
        where: { id: transaction.id },
        data: {
          isReversed: true,
          reversedAt: new Date(),
          reversalReason: justification,
        },
      })

      // 2. Estorno Atômico: Devolve o dinheiro à conta bancária (Increment)
      const updatedAccount = await tx.bankAccount.update({
        where: { id: transaction.bankAccountId },
        data: {
          currentBalance: { increment: reversedAmount },
        },
      })

      // 3. Atualiza parcela
      const newInstPaid = Prisma.Decimal.max(new Prisma.Decimal(0), installment.paidAmount.sub(reversedAmount))
      const isPastDue = new Date() > new Date(installment.dueDate)

      const updatedInstallment = await tx.payableInstallment.update({
        where: { id: installment.id },
        data: {
          paidAmount: newInstPaid,
          status: newInstPaid.eq(0) ? (isPastDue ? 'EM_ATRASO' : 'A_VENCER') : 'A_VENCER',
        },
      })

      // 4. Atualiza título pai
      const newTitlePaid = Prisma.Decimal.max(new Prisma.Decimal(0), title.paidAmount.sub(reversedAmount))
      const updatedTitle = await tx.payableTitle.update({
        where: { id: title.id },
        data: {
          paidAmount: newTitlePaid,
          status: newTitlePaid.eq(0) ? 'PENDENTE' : 'PARCIALMENTE_PAGO',
        },
      })

      // 5. Se for comissão de parceiro, reverte paidAmount
      if (title.partnerCommission) {
        const commission = title.partnerCommission
        const newCommPaid = Prisma.Decimal.max(new Prisma.Decimal(0), commission.paidAmount.sub(reversedAmount))

        await tx.partnerCommission.update({
          where: { id: commission.id },
          data: {
            paidAmount: newCommPaid,
            status: newCommPaid.lt(commission.releasedAmount) ? 'LIBERADO_PARCIAL' : commission.status,
          },
        })
      }

      // 6. Auditoria
      await tx.financialAuditLog.create({
        data: {
          branchId: transaction.branchId,
          userId: auth.user.id,
          action: 'ESTORNO_PAGAMENTO',
          entityName: 'PayableInstallment',
          entityId: installment.id,
          justification,
          oldSnapshot: {
            transactionId: transaction.id,
            amount: reversedAmount.toNumber(),
          },
          newSnapshot: {
            newPaidAmount: newInstPaid.toNumber(),
            reversedAt: new Date().toISOString(),
          },
        },
      })

      return { updatedTx, updatedAccount, updatedInstallment, updatedTitle }
    })

    revalidatePath('/admin/financial')
    revalidatePath('/admin/financial/payables')
    return { data: result, success: true }
  } catch (error) {
    return { error: handleServerError(error, 'reversePayablePayment') }
  }
}
