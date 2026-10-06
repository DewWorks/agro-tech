'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { handleServerError } from '@/lib/errorHandler'
import { getUserContext } from '@/lib/auth'
import { Prisma } from '@prisma/client'
import { extractFinancedAmountFromPayload } from '@/lib/financial/extract-amount'

export interface TriggerReceivableOptions {
  financedAmount?: number
  successFeePercent?: number
  fixedHonoraryAmount?: number
  partnerId?: string
  partnerCommissionPercent?: number
  dueDate?: string | Date
  notes?: string
}

export interface DemandBillingSuggestion {
  demandId: string
  serviceType: string
  customServiceType?: string | null
  producerId: string
  producerName: string
  propertyId: string | null
  propertyName: string | null
  branchId: string
  branchName: string
  suggestedFinancedAmount: number
  suggestedFinancialAgent: string
  defaultSuccessFeePercent: number
  defaultPartnerCommissionPercent: number
  partners: Array<{ id: string; name: string; defaultCommissionRate: number }>
  alreadyBilled: boolean
  existingTitle?: {
    id: string
    documentNumber: string
    grossAmount: number
    status: string
  }
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
    console.log(`[Financial Trigger] Iniciando processamento para demanda: ${demandId}`, { options })

    const user = await getUserContext()
    if (!user) {
      throw new Error('Não autenticado. Faça login para acessar o módulo financeiro.')
    }

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

    // Validação Multi-tenant: Usuário deve pertencer à organização da demanda (ou SUPER_ADMIN)
    const isSuperAdmin =
      user.role === 'SUPER_ADMIN' ||
      user.realRole === 'SUPER_ADMIN' ||
      Boolean(user.isSuperAdminImpersonating)

    if (!isSuperAdmin && user.organizationId && user.organizationId !== demand.branch.organizationId) {
      throw new Error('Acesso negado: Você não possui permissão para emitir faturamento nesta organização.')
    }

    // 1. Verificar idempotência: já existe faturamento ativo para esta demanda?
    const existingTitle = await prisma.receivableTitle.findFirst({
      where: {
        demandId: demand.id,
        status: { not: 'CANCELADO' },
      },
      include: {
        installments: true,
        commissions: true,
      },
    })

    if (existingTitle) {
      console.log(`[Financial Trigger] Título a receber já existe para a demanda ${demandId}: ${existingTitle.documentNumber}`)
      return {
        data: existingTitle,
        alreadyExisted: true,
        message: `Título a receber já existente (${existingTitle.documentNumber}).`,
      }
    }

    // 2. Parâmetros padrão da organização ou fallback oficial
    const orgSettings = demand.branch.organization.financialSettings
    const defaultSuccessFee = orgSettings?.defaultSuccessFeePercent
      ? Number(orgSettings.defaultSuccessFeePercent)
      : 2.0
    const defaultPartnerCommission = orgSettings?.defaultPartnerCommissionPercent
      ? Number(orgSettings.defaultPartnerCommissionPercent)
      : 20.0

    const successFeePercent = options.successFeePercent !== undefined ? options.successFeePercent : defaultSuccessFee
    const partnerCommissionPercent =
      options.partnerCommissionPercent !== undefined ? options.partnerCommissionPercent : defaultPartnerCommission
    let financedAmount = options.financedAmount ?? 0
    let fixedHonorary = options.fixedHonoraryAmount ?? 0

    // Resolução inteligente: se o valor financiado não foi informado manualmente,
    // busca automaticamente na Análise de Crédito (MCR), no Dossiê Emitido ou histórico
    if (!financedAmount || financedAmount <= 0) {
      console.log(`[Financial Trigger] financedAmount não informado. Iniciando cascata de busca inteligente...`)

      // 2.1 Verificar GeneratedForm associado à demanda (documentId ou proposalId)
      if (demand.documentId || demand.proposalId) {
        const form = await prisma.generatedForm.findFirst({
          where: {
            OR: [
              ...(demand.documentId ? [{ id: demand.documentId }] : []),
              ...(demand.proposalId ? [{ id: demand.proposalId }] : []),
            ],
          },
          select: { id: true, payloadSnapshot: true },
        })
        if (form?.payloadSnapshot) {
          const val = extractFinancedAmountFromPayload(form.payloadSnapshot)
          if (val > 0) {
            financedAmount = val
            console.log(`[Financial Trigger] Encontrado financedAmount = R$ ${financedAmount} no GeneratedForm vinculado (${form.id})`)
          }
        }
      }

      // 2.2 Se ainda não achou, buscar o GeneratedForm mais recente do mesmo produtor/propriedade
      // Resolve tanto o produtor da demanda quanto registros associados pelo mesmo CPF (PF/PJ)
      if (!financedAmount || financedAmount <= 0) {
        const prodDoc = demand.producer?.document
        const prodRep = demand.producer?.representativeCpf
        const relatedProducers = await prisma.producer.findMany({
          where: {
            OR: [
              { id: demand.producerId },
              ...(prodDoc ? [{ document: prodDoc }, { representativeCpf: prodDoc }] : []),
              ...(prodRep ? [{ document: prodRep }, { representativeCpf: prodRep }] : []),
            ],
          },
          select: { id: true },
        })
        const producerIds = relatedProducers.length > 0 ? relatedProducers.map((p) => p.id) : [demand.producerId]

        const recentForm = await prisma.generatedForm.findFirst({
          where: {
            producerId: { in: producerIds },
            templateCode: {
              in: ['PROJETO_CUSTEIO_SAFRA', 'PROJETO_RENOVAGRO', 'PROJETO_INOVAGRO', 'LIMITE_CREDITO_BB'],
            },
          },
          orderBy: { createdAt: 'desc' },
          select: { id: true, templateCode: true, payloadSnapshot: true },
        })
        if (recentForm?.payloadSnapshot) {
          const val = extractFinancedAmountFromPayload(recentForm.payloadSnapshot)
          if (val > 0) {
            financedAmount = val
            console.log(`[Financial Trigger] Encontrado financedAmount = R$ ${financedAmount} no GeneratedForm recente (${recentForm.templateCode}) do produtor`)
          }
        }
      }

      // 2.3 Buscar na Análise de Crédito da propriedade ou do produtor
      if (!financedAmount || financedAmount <= 0) {
        if (demand.propertyId) {
          const lastAnalysis = await prisma.creditAnalysis.findFirst({
            where: { propertyId: demand.propertyId, requestedAmount: { gt: 0 } },
            orderBy: { createdAt: 'desc' },
            select: { requestedAmount: true },
          })
          if (lastAnalysis && Number(lastAnalysis.requestedAmount) > 0) {
            financedAmount = Number(lastAnalysis.requestedAmount)
            console.log(`[Financial Trigger] Encontrado financedAmount = R$ ${financedAmount} no CreditAnalysis da propriedade`)
          }
        }
      }

      if (!financedAmount || financedAmount <= 0) {
        const lastProducerAnalysis = await prisma.creditAnalysis.findFirst({
          where: { producerId: demand.producerId, requestedAmount: { gt: 0 } },
          orderBy: { createdAt: 'desc' },
          select: { requestedAmount: true },
        })
        if (lastProducerAnalysis && Number(lastProducerAnalysis.requestedAmount) > 0) {
          financedAmount = Number(lastProducerAnalysis.requestedAmount)
          console.log(`[Financial Trigger] Encontrado financedAmount = R$ ${financedAmount} no CreditAnalysis do produtor`)
        }
      }

      // 2.4 Buscar no Document do GED associado ao produtor/propriedade
      if (!financedAmount || financedAmount <= 0) {
        const recentDoc = await prisma.document.findFirst({
          where: {
            producerId: demand.producerId,
            ...(demand.propertyId ? { propertyId: demand.propertyId } : {}),
          },
          orderBy: { createdAt: 'desc' },
          select: { metadataPayload: true },
        })
        if (recentDoc?.metadataPayload) {
          const meta = recentDoc.metadataPayload as any
          const val = Number(meta.financedAmount || 0)
          if (val > 0) {
            financedAmount = val
            console.log(`[Financial Trigger] Encontrado financedAmount = R$ ${financedAmount} no metadataPayload do Document GED`)
          }
        }
      }

      // 2.5 Fallback por regex no texto de notes e description
      if (!financedAmount || financedAmount <= 0) {
        const text = `${demand.notes || ''} ${demand.description || ''}`
        const match = text.match(/(?:R\$\s*|valor\s*(?:de)?\s*)(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:\.\d{2})?)/i)
        if (match) {
          const numStr = match[1].replace(/\./g, '').replace(',', '.')
          const parsed = parseFloat(numStr)
          if (!isNaN(parsed) && parsed > 0) {
            financedAmount = parsed
            console.log(`[Financial Trigger] Encontrado financedAmount = R$ ${financedAmount} via regex nas anotações da demanda`)
          }
        }
      }
    }

    // Cálculo do Honorário Bruto: (Financiado * % Êxito) + Fixo
    const feeFromPercent = financedAmount * (successFeePercent / 100)
    const grossAmount = feeFromPercent + fixedHonorary

    if (grossAmount <= 0) {
      console.warn(`[Financial Trigger] Demanda ${demandId}: Honorário bruto calculado é R$ 0,00 (Financiado: R$ ${financedAmount}, Êxito: ${successFeePercent}%). Operação não faturada.`)
      return {
        skipped: true,
        message: 'Valor bruto calculado é zero ou negativo. Nenhum título a receber foi gerado.',
        financedAmount,
        grossAmount,
      }
    }

    // 3. Localizar ou auto-semear categoria de honorários de crédito
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

    // Se nenhuma categoria de receita existir, cria automaticamente a categoria padrão 1.1.01
    if (!category) {
      console.log(`[Financial Trigger] Nenhuma categoria de receita encontrada. Auto-criando categoria 1.1.01 para organização ${demand.branch.organizationId}`)
      category = await prisma.financialCategory.create({
        data: {
          organizationId: demand.branch.organizationId,
          code: '1.1.01',
          name: 'Honorários de Crédito Rural',
          type: 'RECEITA',
          isActive: true,
        },
      })
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

    console.log(`[Financial Trigger] Criando título financeiro:`, {
      documentNumber,
      grossAmount,
      financedAmount,
      successFeePercent,
      partnerId: options.partnerId,
      partnerCommissionPercent,
      dueDate,
    })

    // 5. Execução atômica no banco de dados
    const result = await prisma.$transaction(async (tx) => {
      // 5.1 Cria o Título a Receber
      const title = await tx.receivableTitle.create({
        data: {
          branchId: demand.branchId,
          producerId: demand.producerId,
          propertyId: demand.propertyId,
          demandId: demand.id,
          partnerId: options.partnerId || null,
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
          notes:
            options.notes ||
            `Faturamento gerado automaticamente a partir da demanda #${demand.id.slice(0, 8)}. Honorários de ${successFeePercent}% sobre R$ ${financedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
        },
      })

      // 5.2 Cria a parcela única padrão (pode ser desdobrada depois no módulo financeiro)
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
            status: 'BLOQUEADO', // Trava ativada! Cláusula 2.2 Aditivo 004
          },
        })
      }

      return { title, installment, commission }
    })

    console.log(`[Financial Trigger] Sucesso! Título ${result.title.documentNumber} criado com valor R$ ${grossAmount}.`)

    revalidatePath('/admin/financial')
    revalidatePath('/admin/financial/receivables')
    revalidatePath('/admin/financial/partners')
    revalidatePath('/admin/demands')
    revalidatePath(`/admin/demands/${demandId}`)

    return {
      success: true,
      data: result,
      message: `Título ${result.title.documentNumber} no valor de R$ ${grossAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} gerado com sucesso.`,
    }
  } catch (error) {
    console.error(`[Financial Trigger Error] Falha ao processar faturamento para demanda ${demandId}:`, error)
    return {
      success: false,
      error: handleServerError(error, 'triggerReceivableFromDemand'),
    }
  }
}

/**
 * Consulta os dados sugeridos para o Diálogo Inteligente de Faturamento de uma Demanda.
 * Usado pelo Modal Inteligente de Faturamento ao concluir a OS rural.
 */
export async function getDemandBillingSuggestion(demandId: string): Promise<{
  success: boolean
  data?: DemandBillingSuggestion
  error?: string
}> {
  try {
    const user = await getUserContext()
    if (!user) {
      throw new Error('Não autenticado.')
    }

    const demand = await prisma.serviceDemand.findUnique({
      where: { id: demandId },
      include: {
        producer: { select: { id: true, name: true, document: true, representativeCpf: true } },
        property: { select: { id: true, name: true, city: true, state: true } },
        branch: {
          select: {
            id: true,
            name: true,
            organizationId: true,
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

    // Verificar se já existe título a receber
    const existingTitle = await prisma.receivableTitle.findFirst({
      where: { demandId: demand.id, status: { not: 'CANCELADO' } },
      select: {
        id: true,
        documentNumber: true,
        grossAmount: true,
        status: true,
        createdAt: true,
      },
    })

    // Cascata de busca do valor financiado sugerido
    let suggestedFinancedAmount = 0
    let suggestedFinancialAgent = 'Banco do Brasil'

    // 1. GeneratedForm vinculado diretamente
    if (demand.documentId || demand.proposalId) {
      const form = await prisma.generatedForm.findFirst({
        where: {
          OR: [
            ...(demand.documentId ? [{ id: demand.documentId }] : []),
            ...(demand.proposalId ? [{ id: demand.proposalId }] : []),
          ],
        },
        select: { payloadSnapshot: true },
      })
      if (form?.payloadSnapshot) {
        const val = extractFinancedAmountFromPayload(form.payloadSnapshot)
        if (val > 0) suggestedFinancedAmount = val
        const p = form.payloadSnapshot as any
        if (p.targetBank || p.financialAgent) suggestedFinancialAgent = p.targetBank || p.financialAgent
      }
    }

    // 2. GeneratedForm recente do produtor/propriedade (incluindo vínculos PF/PJ por CPF)
    if (!suggestedFinancedAmount || suggestedFinancedAmount <= 0) {
      const prodDoc = demand.producer?.document
      const prodRep = (demand.producer as any)?.representativeCpf
      const relatedProducers = await prisma.producer.findMany({
        where: {
          OR: [
            { id: demand.producerId },
            ...(prodDoc ? [{ document: prodDoc }, { representativeCpf: prodDoc }] : []),
            ...(prodRep ? [{ document: prodRep }, { representativeCpf: prodRep }] : []),
          ],
        },
        select: { id: true },
      })
      const producerIds = relatedProducers.length > 0 ? relatedProducers.map((p) => p.id) : [demand.producerId]

      const recentForm = await prisma.generatedForm.findFirst({
        where: {
          producerId: { in: producerIds },
          templateCode: {
            in: ['PROJETO_CUSTEIO_SAFRA', 'PROJETO_RENOVAGRO', 'PROJETO_INOVAGRO', 'LIMITE_CREDITO_BB'],
          },
        },
        orderBy: { createdAt: 'desc' },
        select: { payloadSnapshot: true },
      })
      if (recentForm?.payloadSnapshot) {
        const val = extractFinancedAmountFromPayload(recentForm.payloadSnapshot)
        if (val > 0) suggestedFinancedAmount = val
        const p = recentForm.payloadSnapshot as any
        if (p.targetBank || p.financialAgent) suggestedFinancialAgent = p.targetBank || p.financialAgent
      }
    }

    // 3. Análise de Crédito
    if (!suggestedFinancedAmount || suggestedFinancedAmount <= 0) {
      if (demand.propertyId) {
        const lastAnalysis = await prisma.creditAnalysis.findFirst({
          where: { propertyId: demand.propertyId, requestedAmount: { gt: 0 } },
          orderBy: { createdAt: 'desc' },
          select: { requestedAmount: true },
        })
        if (lastAnalysis && Number(lastAnalysis.requestedAmount) > 0) {
          suggestedFinancedAmount = Number(lastAnalysis.requestedAmount)
        }
      }
    }

    if (!suggestedFinancedAmount || suggestedFinancedAmount <= 0) {
      const lastProducerAnalysis = await prisma.creditAnalysis.findFirst({
        where: { producerId: demand.producerId, requestedAmount: { gt: 0 } },
        orderBy: { createdAt: 'desc' },
        select: { requestedAmount: true },
      })
      if (lastProducerAnalysis && Number(lastProducerAnalysis.requestedAmount) > 0) {
        suggestedFinancedAmount = Number(lastProducerAnalysis.requestedAmount)
      }
    }

    // 4. GED document metadata
    if (!suggestedFinancedAmount || suggestedFinancedAmount <= 0) {
      const doc = await prisma.document.findFirst({
        where: { producerId: demand.producerId },
        orderBy: { createdAt: 'desc' },
        select: { metadataPayload: true },
      })
      if (doc?.metadataPayload) {
        const meta = doc.metadataPayload as any
        if (Number(meta.financedAmount || 0) > 0) {
          suggestedFinancedAmount = Number(meta.financedAmount)
        }
      }
    }

    // 5. Fallback por regex no texto
    if (!suggestedFinancedAmount || suggestedFinancedAmount <= 0) {
      const text = `${demand.notes || ''} ${demand.description || ''}`
      const match = text.match(/(?:R\$\s*|valor\s*(?:de)?\s*)(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:\.\d{2})?)/i)
      if (match) {
        const numStr = match[1].replace(/\./g, '').replace(',', '.')
        const parsed = parseFloat(numStr)
        if (!isNaN(parsed) && parsed > 0) suggestedFinancedAmount = parsed
      }
    }

    const orgSettings = demand.branch.organization.financialSettings
    const defaultSuccessFeePercent = orgSettings?.defaultSuccessFeePercent
      ? Number(orgSettings.defaultSuccessFeePercent)
      : 2.0
    const defaultPartnerCommissionPercent = orgSettings?.defaultPartnerCommissionPercent
      ? Number(orgSettings.defaultPartnerCommissionPercent)
      : 20.0

    // Buscar parceiros comerciais ativos da organização
    const partners = await prisma.commercialPartner.findMany({
      where: {
        branch: { organizationId: demand.branch.organizationId },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        defaultCommissionRate: true,
      },
      orderBy: { name: 'asc' },
    })

    return {
      success: true,
      data: {
        demandId: demand.id,
        serviceType: demand.serviceType,
        customServiceType: demand.customServiceType,
        producerId: demand.producer.id,
        producerName: demand.producer.name,
        propertyId: demand.property?.id || null,
        propertyName: demand.property?.name || null,
        branchId: demand.branch.id,
        branchName: demand.branch.name,
        suggestedFinancedAmount,
        suggestedFinancialAgent,
        defaultSuccessFeePercent,
        defaultPartnerCommissionPercent,
        partners: partners.map((p) => ({
          id: p.id,
          name: p.name,
          defaultCommissionRate: Number(p.defaultCommissionRate || defaultPartnerCommissionPercent),
        })),
        alreadyBilled: Boolean(existingTitle),
        existingTitle: existingTitle
          ? {
              id: existingTitle.id,
              documentNumber: existingTitle.documentNumber,
              grossAmount: Number(existingTitle.grossAmount),
              status: existingTitle.status,
            }
          : undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: handleServerError(error, 'getDemandBillingSuggestion'),
    }
  }
}
