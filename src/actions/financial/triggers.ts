'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { handleServerError } from '@/lib/errorHandler'
import { requireFinancialAuth } from '@/lib/financial/auth-guard'
import { Prisma } from '@prisma/client'

export interface TriggerReceivableOptions {
  financedAmount?: number
  successFeePercent?: number
  fixedHonoraryAmount?: number
  partnerId?: string
  partnerCommissionPercent?: number
  dueDate?: string | Date
  notes?: string
}

/**
 * Gatilho Transacional da Esteira Operacional:
 * Cria automaticamente o Título a Receber e a Provisão Bloqueada de Comissão do Parceiro
 * a partir da conclusão de uma demanda ou aprovação de projeto de crédito rural.
 * 
 * Regra Arquitetural (ADR-021 & Cláusula 2.2 Aditivo 004):
 * 1. Provisão de comissão nasce com status BLOQUEADO.
 * 2. Herança 100% automatizada de Produtor, Propriedade, Filial e Demanda.
 * 3. Idempotência: não duplica faturamento caso a demanda já possua título associado.
 */
export async function triggerReceivableFromDemand(
  demandId: string,
  options: TriggerReceivableOptions = {}
) {
  try {
    const demand = await prisma.serviceDemand.findUnique({
      where: { id: demandId },
      include: {
        producer: true,
        property: true,
        branch: {
          include: {
            organization: {
              include: {
                financialSettings: true,
              },
            },
          },
        },
      },
    })

    if (!demand) {
      throw new Error(`Demanda ${demandId} não encontrada.`)
    }

    const auth = await requireFinancialAuth(demand.branchId)

    // 1. Verificar idempotência: já existe faturamento ativo para esta demanda?
    const existingTitle = await prisma.receivableTitle.findFirst({
      where: {
        demandId: demand.id,
        status: { not: 'CANCELADO' },
      },
    })

    if (existingTitle) {
      return {
        data: existingTitle,
        alreadyExisted: true,
        message: 'Título a receber já existente para esta demanda.',
      }
    }

    // 2. Parâmetros padrão da organização
    const orgSettings = demand.branch.organization.financialSettings
    const defaultSuccessFee = orgSettings?.defaultSuccessFeePercent
      ? Number(orgSettings.defaultSuccessFeePercent)
      : 2.0
    const defaultPartnerCommission = orgSettings?.defaultPartnerCommissionPercent
      ? Number(orgSettings.defaultPartnerCommissionPercent)
      : 20.0

    const successFeePercent = options.successFeePercent ?? defaultSuccessFee
    const partnerCommissionPercent = options.partnerCommissionPercent ?? defaultPartnerCommission
    const financedAmount = options.financedAmount ?? 0
    const fixedHonorary = options.fixedHonoraryAmount ?? 0

    // Cálculo do Honorário Bruto: (Financiado * % Êxito) + Fixo
    const feeFromPercent = financedAmount * (successFeePercent / 100)
    const grossAmount = feeFromPercent + fixedHonorary

    if (grossAmount <= 0) {
      return {
        skipped: true,
        message: 'Valor bruto calculado é zero ou negativo. Nenhum título gerado.',
      }
    }

    // 3. Localizar categoria de honorários de crédito
    let category = await prisma.financialCategory.findFirst({
      where: {
        organizationId: demand.branch.organizationId,
        code: '1.1.01',
        isActive: true,
      },
    })

    if (!category) {
      category = await prisma.financialCategory.findFirst({
        where: {
          organizationId: demand.branch.organizationId,
          type: 'RECEITA',
          isActive: true,
        },
      })
    }

    if (!category) {
      throw new Error('Nenhuma categoria de receita cadastrada no plano de contas da organização.')
    }

    // 4. Gerar número de documento sequencial
    const currentYear = new Date().getFullYear()
    const titlesCount = await prisma.receivableTitle.count({
      where: { branchId: demand.branchId },
    })
    const docSeq = String(titlesCount + 1).padStart(4, '0')
    const documentNumber = `FAT-${currentYear}-${docSeq}`

    const dueDate = options.dueDate
      ? new Date(options.dueDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Padrão: 30 dias

    // 5. Execução atômica no banco de dados
    const result = await prisma.$transaction(async (tx) => {
      // 5.1 Cria o Título a Receber
      const title = await tx.receivableTitle.create({
        data: {
          branchId: demand.branchId,
          producerId: demand.producerId,
          propertyId: demand.propertyId,
          demandId: demand.id,
          partnerId: options.partnerId,
          categoryId: category.id,
          originType: 'ESTEIRA_CREDITO',
          serviceSubtype: demand.serviceType,
          documentNumber,
          cropYear: '2025/2026',
          financedAmount: financedAmount > 0 ? new Prisma.Decimal(financedAmount) : null,
          successFeePercent: new Prisma.Decimal(successFeePercent),
          grossAmount: new Prisma.Decimal(grossAmount),
          discountAmount: new Prisma.Decimal(0),
          netAmount: new Prisma.Decimal(grossAmount),
          totalReceivedAmount: new Prisma.Decimal(0),
          status: 'PENDENTE',
          notes: options.notes || `Faturamento gerado automaticamente a partir da demanda #${demand.id.slice(0, 8)}.`,
        },
      })

      // 5.2 Cria a parcela única padrão (pode ser desdobrada depois se solicitado parcelamento)
      const installment = await tx.receivableInstallment.create({
        data: {
          receivableTitleId: title.id,
          installmentNumber: 1,
          totalInstallments: 1,
          dueDate,
          amount: new Prisma.Decimal(grossAmount),
          receivedAmount: new Prisma.Decimal(0),
          status: 'A_VENCER',
        },
      })

      // 5.3 Se houver parceiro comercial associado, gera a provisão com trava de segurança (BLOQUEADO)
      let commission = null
      if (options.partnerId) {
        const commissionAmount = grossAmount * (partnerCommissionPercent / 100)

        commission = await tx.partnerCommission.create({
          data: {
            branchId: demand.branchId,
            partnerId: options.partnerId,
            receivableTitleId: title.id,
            receivableInstallmentId: installment.id,
            calculationBasisAmount: new Prisma.Decimal(grossAmount),
            commissionPercent: new Prisma.Decimal(partnerCommissionPercent),
            totalCommissionAmount: new Prisma.Decimal(commissionAmount),
            releasedAmount: new Prisma.Decimal(0),
            paidAmount: new Prisma.Decimal(0),
            status: 'BLOQUEADO', // Trava ativada!
          },
        })
      }

      return { title, installment, commission }
    })

    revalidatePath('/admin/financial')
    revalidatePath('/admin/financial/receivables')
    revalidatePath('/admin/demands')
    return { data: result, success: true }
  } catch (error) {
    return { error: handleServerError(error, 'triggerReceivableFromDemand') }
  }
}
