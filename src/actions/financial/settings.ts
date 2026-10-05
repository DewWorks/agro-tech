'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { handleServerError } from '@/lib/errorHandler'
import { requireFinancialAuth, assertBranchMutationAllowed } from '@/lib/financial/auth-guard'
import {
  financialSettingsSchema,
  financialBranchSettingsSchema,
  bankAccountSchema,
  transferBetweenAccountsSchema,
  FinancialSettingsInput,
  FinancialBranchSettingsInput,
  BankAccountInput,
  TransferBetweenAccountsInput,
} from '@/lib/validations/financial'
import { Prisma } from '@prisma/client'

/**
 * Obtém as configurações financeiras globais da organização.
 */
export async function getFinancialSettings() {
  try {
    const auth = await requireFinancialAuth()
    
    let settings = await prisma.financialSettings.findUnique({
      where: { organizationId: auth.organizationId },
    })

    if (!settings && auth.organizationId) {
      settings = await prisma.financialSettings.create({
        data: {
          organizationId: auth.organizationId,
          defaultSuccessFeePercent: new Prisma.Decimal(2.0),
          defaultPartnerCommissionPercent: new Prisma.Decimal(20.0),
          defaultFieldSurveyCostPerKm: new Prisma.Decimal(2.5),
        },
      })
    }

    return { data: settings }
  } catch (error) {
    return { error: handleServerError(error, 'getFinancialSettings') }
  }
}

/**
 * Atualiza as configurações financeiras globais (Apenas OWNER / SUPER_ADMIN).
 */
export async function updateFinancialSettings(data: FinancialSettingsInput) {
  try {
    const auth = await requireFinancialAuth()
    if (!auth.isExecutive) {
      throw new Error('Acesso negado: Apenas a diretoria executiva pode alterar parâmetros globais.')
    }

    const validated = financialSettingsSchema.parse(data)

    const updated = await prisma.financialSettings.upsert({
      where: { organizationId: auth.organizationId },
      create: {
        organizationId: auth.organizationId,
        defaultSuccessFeePercent: new Prisma.Decimal(validated.defaultSuccessFeePercent),
        defaultPartnerCommissionPercent: new Prisma.Decimal(validated.defaultPartnerCommissionPercent),
        defaultFieldSurveyCostPerKm: new Prisma.Decimal(validated.defaultFieldSurveyCostPerKm),
      },
      update: {
        defaultSuccessFeePercent: new Prisma.Decimal(validated.defaultSuccessFeePercent),
        defaultPartnerCommissionPercent: new Prisma.Decimal(validated.defaultPartnerCommissionPercent),
        defaultFieldSurveyCostPerKm: new Prisma.Decimal(validated.defaultFieldSurveyCostPerKm),
      },
    })

    revalidatePath('/admin/financial/settings')
    return { data: updated, success: true }
  } catch (error) {
    return { error: handleServerError(error, 'updateFinancialSettings') }
  }
}

/**
 * Obtém os parâmetros e metas financeiras de uma filial específica.
 */
export async function getBranchFinancialSettings(branchId: string) {
  try {
    const auth = await requireFinancialAuth(branchId)

    let settings = await prisma.financialBranchSettings.findUnique({
      where: { branchId: auth.effectiveBranchId || branchId },
    })

    if (!settings && (auth.effectiveBranchId || branchId)) {
      const targetId = auth.effectiveBranchId || branchId
      settings = await prisma.financialBranchSettings.create({
        data: {
          branchId: targetId,
          monthlyFixedCostTarget: new Prisma.Decimal(15000.0),
          monthlyRevenueTarget: new Prisma.Decimal(60000.0),
          activeCropYear: '2025/2026',
        },
      })
    }

    return { data: settings }
  } catch (error) {
    return { error: handleServerError(error, 'getBranchFinancialSettings') }
  }
}

/**
 * Atualiza metas e parâmetros por filial.
 */
export async function updateBranchFinancialSettings(
  branchId: string,
  data: FinancialBranchSettingsInput
) {
  try {
    const auth = await requireFinancialAuth(branchId)
    await assertBranchMutationAllowed(auth, branchId)

    const validated = financialBranchSettingsSchema.parse(data)

    const updated = await prisma.financialBranchSettings.upsert({
      where: { branchId },
      create: {
        branchId,
        monthlyFixedCostTarget: new Prisma.Decimal(validated.monthlyFixedCostTarget),
        monthlyRevenueTarget: new Prisma.Decimal(validated.monthlyRevenueTarget),
        activeCropYear: validated.activeCropYear,
        notes: validated.notes,
      },
      update: {
        monthlyFixedCostTarget: new Prisma.Decimal(validated.monthlyFixedCostTarget),
        monthlyRevenueTarget: new Prisma.Decimal(validated.monthlyRevenueTarget),
        activeCropYear: validated.activeCropYear,
        notes: validated.notes,
      },
    })

    revalidatePath('/admin/financial/settings')
    return { data: updated, success: true }
  } catch (error) {
    return { error: handleServerError(error, 'updateBranchFinancialSettings') }
  }
}

/**
 * Lista as contas bancárias e caixas físicos (com suporte a filtro multi-filial).
 */
export async function getBankAccounts(targetBranchId?: string | null) {
  try {
    const auth = await requireFinancialAuth(targetBranchId)

    const where: Prisma.BankAccountWhereInput = {
      isActive: true,
    }

    if (auth.isGlobalView || !auth.effectiveBranchId) {
      where.branch = { organizationId: auth.organizationId }
    } else {
      where.branchId = auth.effectiveBranchId
    }

    const accounts = await prisma.bankAccount.findMany({
      where,
      select: {
        id: true,
        bankCode: true,
        bankName: true,
        accountType: true,
        agency: true,
        accountNumber: true,
        initialBalance: true,
        currentBalance: true,
        isActive: true,
        branchId: true,
        branch: {
          select: { id: true, name: true, city: true, state: true },
        },
      },
      orderBy: [{ branchId: 'asc' }, { bankName: 'asc' }],
    })

    return { data: accounts }
  } catch (error) {
    return { error: handleServerError(error, 'getBankAccounts') }
  }
}

/**
 * Cadastra uma nova conta corrente ou caixa físico.
 */
export async function createBankAccount(data: BankAccountInput) {
  try {
    const auth = await requireFinancialAuth(data.branchId)
    await assertBranchMutationAllowed(auth, data.branchId)

    const validated = bankAccountSchema.parse(data)

    const account = await prisma.bankAccount.create({
      data: {
        branchId: validated.branchId,
        bankCode: validated.bankCode,
        bankName: validated.bankName,
        agency: validated.agency,
        accountNumber: validated.accountNumber,
        accountType: validated.accountType,
        initialBalance: new Prisma.Decimal(validated.initialBalance || 0),
        currentBalance: new Prisma.Decimal(validated.initialBalance || 0),
        isActive: true,
      },
    })

    revalidatePath('/admin/financial/settings')
    return { data: account, success: true }
  } catch (error) {
    return { error: handleServerError(error, 'createBankAccount') }
  }
}

/**
 * Atualiza status ou dados de uma conta bancária.
 */
export async function updateBankAccount(
  id: string,
  data: Partial<BankAccountInput> & { isActive?: boolean }
) {
  try {
    const account = await prisma.bankAccount.findUnique({
      where: { id },
      select: { branchId: true },
    })

    if (!account) {
      throw new Error('Conta bancária não encontrada.')
    }

    const auth = await requireFinancialAuth(account.branchId)
    await assertBranchMutationAllowed(auth, account.branchId)

    const updated = await prisma.bankAccount.update({
      where: { id },
      data: {
        bankName: data.bankName,
        bankCode: data.bankCode,
        agency: data.agency,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
        isActive: data.isActive,
      },
    })

    revalidatePath('/admin/financial/settings')
    return { data: updated, success: true }
  } catch (error) {
    return { error: handleServerError(error, 'updateBankAccount') }
  }
}

/**
 * Realiza uma transferência interna de tesouraria entre contas cadastradas.
 * 
 * Regra Arquitetural (ADR-023):
 * 1. Mutações atômicas nativas do PostgreSQL via Prisma: decrement na origem e increment no destino.
 * 2. Registro em CashTransaction com type: TRANSFERENCIA_INTERNA.
 * 3. Neutralidade total no DRE (excluído do cômputo de receitas/despesas operacionais).
 */
export async function transferBetweenBankAccounts(data: TransferBetweenAccountsInput) {
  try {
    const validated = transferBetweenAccountsSchema.parse(data)

    const sourceAccount = await prisma.bankAccount.findUnique({
      where: { id: validated.sourceBankAccountId },
    })
    const destAccount = await prisma.bankAccount.findUnique({
      where: { id: validated.destinationBankAccountId },
    })

    if (!sourceAccount || !destAccount) {
      throw new Error('Uma ou ambas as contas bancárias não foram encontradas.')
    }

    if (!sourceAccount.isActive || !destAccount.isActive) {
      throw new Error('Não é permitido transferir entre contas inativas.')
    }

    // Validação de acesso à filial da conta de origem
    const auth = await requireFinancialAuth(sourceAccount.branchId)
    await assertBranchMutationAllowed(auth, sourceAccount.branchId)

    const transferAmount = new Prisma.Decimal(validated.amount)

    // Execução atômica blindada contra race conditions
    const result = await prisma.$transaction(async (tx) => {
      // 1. Decrementa atomicamente na origem
      const updatedSource = await tx.bankAccount.update({
        where: { id: sourceAccount.id },
        data: {
          currentBalance: { decrement: transferAmount },
        },
      })

      // 2. Incrementa atomicamente no destino
      const updatedDest = await tx.bankAccount.update({
        where: { id: destAccount.id },
        data: {
          currentBalance: { increment: transferAmount },
        },
      })

      // 3. Registra o evento de caixa
      const transaction = await tx.cashTransaction.create({
        data: {
          branchId: sourceAccount.branchId,
          bankAccountId: sourceAccount.id,
          destinationBankAccountId: destAccount.id,
          type: 'TRANSFERENCIA_INTERNA',
          amount: transferAmount,
          description: validated.description,
          operatorId: auth.user.id,
        },
      })

      return { transaction, updatedSource, updatedDest }
    })

    revalidatePath('/admin/financial')
    revalidatePath('/admin/financial/settings')
    return { data: result, success: true }
  } catch (error) {
    return { error: handleServerError(error, 'transferBetweenBankAccounts') }
  }
}
