'use server'
 
import { cache } from 'react'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { handleServerError } from '@/lib/errorHandler'
import { requireFinancialAuth, assertBranchMutationAllowed } from '@/lib/financial/auth-guard'
import {
  commercialPartnerSchema,
  CommercialPartnerInput,
} from '@/lib/validations/financial'
import { Prisma } from '@prisma/client'
import { serializeDecimals } from '@/lib/utils'

/**
 * Consulta interna de parceiros com React cache()
 */
const fetchCommercialPartnersInternal = cache(async (
  isGlobalView: boolean,
  effectiveBranchId: string | null,
  organizationId: string
) => {
  const where: Prisma.CommercialPartnerWhereInput = {}

  if (isGlobalView || !effectiveBranchId) {
    where.branch = { organizationId }
  } else {
    where.branchId = effectiveBranchId
  }

  return prisma.commercialPartner.findMany({
    where,
    include: {
      branch: {
        select: { id: true, name: true, city: true, state: true },
      },
      _count: {
        select: { commissions: true, receivableTitles: true },
      },
    },
    orderBy: { name: 'asc' },
  })
})

/**
 * Lista todos os parceiros comerciais com suporte a filtro multi-filial.
 */
export async function getCommercialPartners(targetBranchId?: string | null) {
  try {
    const auth = await requireFinancialAuth(targetBranchId)
    const partners = await fetchCommercialPartnersInternal(
      auth.isGlobalView,
      auth.effectiveBranchId,
      auth.organizationId
    )

    return { data: serializeDecimals(partners) }
  } catch (error) {
    return { error: handleServerError(error, 'getCommercialPartners') }
  }
}

/**
 * Obtém os detalhes de um parceiro comercial específico.
 */
export async function getCommercialPartnerById(partnerId: string) {
  try {
    const partner = await prisma.commercialPartner.findUnique({
      where: { id: partnerId },
      include: {
        branch: {
          select: { id: true, name: true, city: true, state: true },
        },
      },
    })

    if (!partner) {
      throw new Error('Parceiro comercial não encontrado.')
    }

    await requireFinancialAuth(partner.branchId)

    return { data: serializeDecimals(partner) }
  } catch (error) {
    return { error: handleServerError(error, 'getCommercialPartnerById') }
  }
}

/**
 * Cadastra um novo parceiro comercial (prospectador / corretor de campo).
 */
export async function createCommercialPartner(data: CommercialPartnerInput) {
  try {
    const auth = await requireFinancialAuth(data.branchId)
    await assertBranchMutationAllowed(auth, data.branchId)

    const validated = commercialPartnerSchema.parse(data)
    const cleanDoc = validated.document.replace(/[^\d]+/g, '')

    // Verificar unicidade de documento na filial
    const existing = await prisma.commercialPartner.findUnique({
      where: {
        branchId_document: {
          branchId: validated.branchId,
          document: cleanDoc,
        },
      },
    })

    if (existing) {
      throw new Error('Já existe um parceiro cadastrado com este CPF/CNPJ nesta filial.')
    }

    const partner = await prisma.commercialPartner.create({
      data: {
        branchId: validated.branchId,
        name: validated.name.trim(),
        document: cleanDoc,
        phone: validated.phone,
        email: validated.email,
        pixKey: validated.pixKey.trim(),
        pixKeyType: validated.pixKeyType,
        bankInfo: validated.bankInfo ?? undefined,
        defaultCommissionRate: new Prisma.Decimal(validated.defaultCommissionRate),
        isActive: true,
      },
    })

    revalidatePath('/admin/financial/partners')
    return { data: partner, success: true }
  } catch (error) {
    return { error: handleServerError(error, 'createCommercialPartner') }
  }
}

/**
 * Atualiza dados cadastrais e chave PIX do parceiro.
 */
export async function updateCommercialPartner(
  partnerId: string,
  data: Partial<CommercialPartnerInput>
) {
  try {
    const partner = await prisma.commercialPartner.findUnique({
      where: { id: partnerId },
    })

    if (!partner) {
      throw new Error('Parceiro comercial não encontrado.')
    }

    const auth = await requireFinancialAuth(partner.branchId)
    await assertBranchMutationAllowed(auth, partner.branchId)

    const updateData: Prisma.CommercialPartnerUpdateInput = {}

    if (data.name) updateData.name = data.name.trim()
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.email !== undefined) updateData.email = data.email
    if (data.pixKey) updateData.pixKey = data.pixKey.trim()
    if (data.pixKeyType) updateData.pixKeyType = data.pixKeyType
    if (data.bankInfo !== undefined) updateData.bankInfo = data.bankInfo ?? Prisma.JsonNull
    if (data.defaultCommissionRate !== undefined) {
      updateData.defaultCommissionRate = new Prisma.Decimal(data.defaultCommissionRate)
    }

    const updated = await prisma.commercialPartner.update({
      where: { id: partnerId },
      data: updateData,
    })

    revalidatePath('/admin/financial/partners')
    return { data: updated, success: true }
  } catch (error) {
    return { error: handleServerError(error, 'updateCommercialPartner') }
  }
}

/**
 * Alterna status ativo/inativo do parceiro.
 */
export async function toggleCommercialPartnerStatus(partnerId: string, isActive: boolean) {
  try {
    const partner = await prisma.commercialPartner.findUnique({
      where: { id: partnerId },
      select: { branchId: true },
    })

    if (!partner) {
      throw new Error('Parceiro comercial não encontrado.')
    }

    const auth = await requireFinancialAuth(partner.branchId)
    await assertBranchMutationAllowed(auth, partner.branchId)

    const updated = await prisma.commercialPartner.update({
      where: { id: partnerId },
      data: { isActive },
    })

    revalidatePath('/admin/financial/partners')
    return { data: updated, success: true }
  } catch (error) {
    return { error: handleServerError(error, 'toggleCommercialPartnerStatus') }
  }
}

/**
 * Resumo financeiro consolidado do parceiro comercial.
 * 
 * Computa:
 * - Volume financeiro originado em crédito rural
 * - Comissões bloqueadas (sob trava de segurança)
 * - Comissões liberadas disponíveis para pagamento
 * - Histórico efetivamente pago
 */
export async function getPartnerCommissionSummary(partnerId: string) {
  try {
    const partner = await prisma.commercialPartner.findUnique({
      where: { id: partnerId },
      include: {
        branch: {
          select: { id: true, name: true, city: true, state: true },
        },
      },
    })

    if (!partner) {
      throw new Error('Parceiro comercial não encontrado.')
    }

    await requireFinancialAuth(partner.branchId)

    // Buscar todas as comissões deste parceiro
    const commissions = await prisma.partnerCommission.findMany({
      where: { partnerId },
      include: {
        receivableTitle: {
          include: {
            producer: { select: { id: true, name: true, document: true } },
            demand: { select: { id: true, serviceType: true, proposalId: true } },
          },
        },
        payableTitles: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            paidAmount: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    let totalVolumeOriginado = new Prisma.Decimal(0)
    let totalComissao = new Prisma.Decimal(0)
    let totalLiberado = new Prisma.Decimal(0)
    let totalPago = new Prisma.Decimal(0)

    for (const c of commissions) {
      totalVolumeOriginado = totalVolumeOriginado.add(c.calculationBasisAmount)
      totalComissao = totalComissao.add(c.totalCommissionAmount)
      totalLiberado = totalLiberado.add(c.releasedAmount)
      totalPago = totalPago.add(c.paidAmount)
    }

    // Saldo bloqueado = Total comissão provisionada - Total já liberado
    const totalBloqueado = totalComissao.sub(totalLiberado)
    // Saldo a pagar = Total liberado - Total efetivamente pago
    const saldoDisponivelSaque = totalLiberado.sub(totalPago)

    return {
      data: serializeDecimals({
        partner,
        metrics: {
          totalVolumeOriginado: totalVolumeOriginado.toNumber(),
          totalComissao: totalComissao.toNumber(),
          totalBloqueado: totalBloqueado.toNumber(),
          totalLiberado: totalLiberado.toNumber(),
          totalPago: totalPago.toNumber(),
          saldoDisponivelSaque: saldoDisponivelSaque.toNumber(),
          totalPropostas: commissions.length,
        },
        commissions,
      }),
    }
  } catch (error) {
    return { error: handleServerError(error, 'getPartnerCommissionSummary') }
  }
}
