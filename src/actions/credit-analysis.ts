'use server'

import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import {
  calculateFullCreditRiskAnalysis,
  AmortizationSystem,
  CreditLineAxis,
  AgroActivityType,
  RevenueRealizationType,
  ExpenseCategory,
  UrbanPropertyType,
  VehicleType,
  LiquidityRating,
  FinancialEngineResult,
  FinancialEngineInput,
} from '@/lib/financial-engine'
import { CREDIT_LINES_CATALOG } from '@/constants/credit-lines'
import {
  CreditSimulationInput,
  SaveCreditAnalysisInput,
  saveCreditAnalysisSchema,
} from '@/lib/validations/credit-analysis'

export type { CreditSimulationInput, SaveCreditAnalysisInput }

/**
 * Executa simulação em tempo real no servidor, garantindo que regras
 * e fórmulas do MCR (ICSD >= 1.20, LTV ponderado) sejam computadas de forma segura.
 */
export async function calculateCreditSimulation(
  payload: CreditSimulationInput
): Promise<FinancialEngineResult> {
  const lineDef = payload.creditLineCode
    ? CREDIT_LINES_CATALOG.find((l) => l.code === payload.creditLineCode)
    : undefined

  const termMonths = payload.totalTermMonths || lineDef?.defaultTermMonths || 12
  const graceMonths = payload.gracePeriodMonths ?? lineDef?.defaultGraceMonths ?? 0
  const interestRate = payload.interestRateAnnual ?? lineDef?.defaultInterestRate ?? 8.0
  const axis = lineDef?.axis || CreditLineAxis.CUSTEIO
  const system = (payload.amortizationSystem || (axis === CreditLineAxis.INVESTIMENTO ? 'SAC' : 'PRICE')) as AmortizationSystem

  const agroRevenues =
    payload.customAgroRevenues && payload.customAgroRevenues.length > 0
      ? payload.customAgroRevenues.map((r) => ({
          activityType: (r.activityType as AgroActivityType) || AgroActivityType.AGRICOLA_GRAOS,
          realizationType: (r.realizationType as RevenueRealizationType) || RevenueRealizationType.PROJETADA_SAFRA,
          description: r.description,
          quantity: r.quantity || 1,
          unit: r.unit || 'un',
          unitPrice: r.unitPrice || 0,
          productionCostTotal: r.productionCostTotal || 0,
        }))
      : [
          ...(payload.effectiveAgroRevenue
            ? [
                {
                  activityType: AgroActivityType.AGRICOLA_GRAOS,
                  realizationType: RevenueRealizationType.EFETIVA_HISTORICA,
                  description: 'Receita Agropecuária Safra Anterior (Efetiva)',
                  quantity: 1,
                  unit: 'un',
                  unitPrice: payload.effectiveAgroRevenue,
                  productionCostTotal: 0,
                },
              ]
            : []),
          ...(payload.projectedAgroRevenue
            ? [
                {
                  activityType: AgroActivityType.AGRICOLA_GRAOS,
                  realizationType: RevenueRealizationType.PROJETADA_SAFRA,
                  description: 'Receita Agropecuária Safra Vigente (Projetada)',
                  quantity: 1,
                  unit: 'un',
                  unitPrice: payload.projectedAgroRevenue,
                  productionCostTotal: payload.productionCosts || 0,
                },
              ]
            : []),
        ]

  const expenses =
    payload.customExpenses && payload.customExpenses.length > 0
      ? payload.customExpenses.map((e) => ({
          category: (e.category as ExpenseCategory) || ExpenseCategory.CUSTEIO_OPERACIONAL,
          description: e.description,
          annualAmount: e.annualAmount || 0,
          installmentValue: e.installmentValue,
          isContinuingLiability: e.isContinuingLiability ?? true,
        }))
      : [
          ...(payload.productionCosts
            ? [
                {
                  category: ExpenseCategory.CUSTEIO_OPERACIONAL,
                  description: 'Custos Operacionais e Produção',
                  annualAmount: payload.productionCosts,
                },
              ]
            : []),
          ...(payload.familyLivingExpenses
            ? [
                {
                  category: ExpenseCategory.MANUTENCAO_FAMILIAR,
                  description: 'Custo de Vida Familiar',
                  annualAmount: payload.familyLivingExpenses,
                },
              ]
            : []),
          ...(payload.existingDebtService
            ? [
                {
                  category: ExpenseCategory.PASSIVO_EXISTENTE_BANCARIO,
                  description: 'Dívidas Bancárias Vigentes',
                  annualAmount: payload.existingDebtService,
                },
              ]
            : []),
        ]

  const input: FinancialEngineInput = {
    requestedAmount: payload.requestedAmount || 0,
    termMonths,
    graceMonths,
    annualInterestRate: interestRate,
    amortizationSystem: system,
    creditLineAxis: axis,
    creditLineCode: payload.creditLineCode || 'PRONAMP_CUSTEIO',
    creditLineName: lineDef?.name || 'PRONAMP - Custeio Agropecuário',
    agroRevenues,
    nonAgroRevenues: payload.nonAgroRevenue
      ? [
          {
            description: 'Outras Receitas Comprovadas',
            annualAmount: payload.nonAgroRevenue,
          },
        ]
      : [],
    expenses,
    ruralCollateral: {
      landValue: payload.landValue || 0,
      improvementsValue: payload.improvementsValue || 0,
      machineryValue: payload.machineryValue || 0,
      livestockValue: payload.livestockValue || 0,
    },
    urbanProperties: (payload.urbanProperties || []).map((u, i) => ({
      description: u.description || `Imóvel Urbano ${i + 1}`,
      propertyType: (u.propertyType as UrbanPropertyType) || UrbanPropertyType.RESIDENCIAL,
      marketValue: u.marketValue || 0,
      hasLien: Boolean(u.hasLien),
      liquidityRating: (u.liquidityRating as LiquidityRating) || LiquidityRating.MEDIA,
    })),
    vehicles: (payload.vehicles || []).map((v, i) => ({
      brand: v.brand || 'Veículo',
      model: v.model || `Utilitário ${i + 1}`,
      vehicleType: (v.vehicleType as VehicleType) || VehicleType.CAMINHONETE,
      declaredValue: v.declaredValue || 0,
      hasLien: Boolean(v.hasLien),
    })),
  }

  return calculateFullCreditRiskAnalysis(input)
}

/**
 * Persiste atomicamente a análise de crédito completa no banco de dados.
 */
export async function saveCreditAnalysis(payload: SaveCreditAnalysisInput) {
  try {
    const user = await getUserContext()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const validation = saveCreditAnalysisSchema.safeParse(payload)
    if (!validation.success) {
      const issues = validation.error.issues.map((i) => i.message).join(', ')
      return { success: false, error: `Dados inválidos: ${issues}` }
    }

    const producer = await prisma.producer.findUnique({
      where: { id: payload.producerId },
      select: {
        id: true,
        name: true,
        branchId: true,
        branch: { select: { id: true, organizationId: true } },
      },
    })

    if (!producer) {
      return { success: false, error: 'Produtor não encontrado' }
    }

    const resolvedBranchId = payload.branchId || user.branchId || producer.branchId
    if (!resolvedBranchId) {
      return { success: false, error: 'Filial de vinculação não especificada' }
    }

    // Calcula simulação autoritativa no servidor
    const riskAnalysis = await calculateCreditSimulation(payload)

    const lineDef = payload.creditLineCode
      ? CREDIT_LINES_CATALOG.find((l) => l.code === payload.creditLineCode)
      : undefined

    const cropYear = payload.cropYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`
    const axis = lineDef?.axis || CreditLineAxis.CUSTEIO
    const targetBank = payload.creditLimitTargetBank || 'BANCO_DO_BRASIL'
    const termMonths = payload.totalTermMonths ?? lineDef?.defaultTermMonths ?? 12
    const graceMonths = payload.gracePeriodMonths ?? lineDef?.defaultGraceMonths ?? 0
    const interestRate = payload.interestRateAnnual ?? lineDef?.defaultInterestRate ?? 8.0
    const system = (payload.amortizationSystem || (axis === CreditLineAxis.INVESTIMENTO ? 'SAC' : 'PRICE')) as AmortizationSystem

    // Gera hash criptográfico do payload para trilha de auditoria bancária
    const sha256Hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ payload, riskAnalysis, timestamp: new Date().toISOString() }))
      .digest('hex')

    const analysis = await (prisma as any).$transaction(async (tx: any) => {
      // 1. Salvar ou atualizar bens secundários do produtor (se informados detalhadamente)
      if (payload.detailedUrbanProperties && payload.detailedUrbanProperties.length > 0) {
        for (const u of payload.detailedUrbanProperties) {
          await tx.urbanProperty.create({
            data: {
              branchId: resolvedBranchId,
              producerId: producer.id,
              propertyType: u.propertyType as UrbanPropertyType,
              description: u.description || 'Imóvel Urbano',
              city: u.city || 'Goiânia',
              state: u.state || 'GO',
              marketValue: u.marketValue,
              hasLien: u.hasLien,
              lienInstitution: u.lienInstitution || null,
              liquidityRating: (u.liquidityRating as LiquidityRating) || LiquidityRating.MEDIA,
            },
          })
        }
      }

      if (payload.detailedVehicles && payload.detailedVehicles.length > 0) {
        for (const v of payload.detailedVehicles) {
          await tx.vehicle.create({
            data: {
              branchId: resolvedBranchId,
              producerId: producer.id,
              vehicleType: v.vehicleType as VehicleType,
              brand: v.brand || 'Marca',
              model: v.model || 'Modelo',
              modelYear: v.modelYear || null,
              licensePlate: v.licensePlate || null,
              declaredValue: v.declaredValue,
              hasLien: v.hasLien,
              lienInstitution: v.lienInstitution || null,
            },
          })
        }
      }

      // 2. Criar ou Atualizar Análise de Crédito
      const creditAnalysisData = {
        branchId: resolvedBranchId,
        producerId: producer.id,
        propertyId: payload.propertyId || null,
        cropYear,
        creditLineCode: payload.creditLineCode || 'PRONAMP_CUSTEIO',
        creditLineName: lineDef?.name || 'PRONAMP - Custeio Agropecuário',
        creditLineAxis: axis as CreditLineAxis,
        targetBank,
        status: riskAnalysis.overallStatus as any,
        requestedAmount: payload.requestedAmount,
        termMonths,
        gracePeriodMonths: graceMonths,
        interestRateAnnual: interestRate,
        amortizationSystem: system,

        annualDebtService: riskAnalysis.amortization.annualDebtService,

        grossRevenueTotal: riskAnalysis.icsd.grossAgroRevenue + riskAnalysis.icsd.nonAgroRevenueTotal,
        netOperationalRevenueTotal: riskAnalysis.icsd.totalNetInflows,
        nonAgroRevenueTotal: riskAnalysis.icsd.nonAgroRevenueTotal,
        totalExpenses: riskAnalysis.icsd.totalExpenses,
        paymentCapacity: riskAnalysis.icsd.paymentCapacity,

        icsdValue: Number(riskAnalysis.icsd.icsdValue.toFixed(4)),
        icsdThreshold: 1.2,
        isIcsdApproved: riskAnalysis.icsd.isApproved,

        ruralCollateralValue: riskAnalysis.ltv.ruralTotal,
        urbanCollateralValue: riskAnalysis.ltv.urbanTotal,
        vehiclesCollateralValue: riskAnalysis.ltv.vehiclesTotal,
        totalCollateralValue: riskAnalysis.ltv.totalDeclaredCollateral,
        totalCollateralAcceptable: riskAnalysis.ltv.totalAcceptableCollateral,
        ltvRatio: Number(riskAnalysis.ltv.coverageRatioPercent.toFixed(2)),
        isLtvApproved: riskAnalysis.ltv.isApproved,

        technicalOpinion: riskAnalysis.summaryOpinion,
        mcrEnquadramentoNotes: riskAnalysis.regulatoryNotes.join('; '),
        payloadSnapshot: payload as any,
        sha256Hash,
        notes: payload.notes || null,
        createdBy: (user as any).fullName || user.email || 'Sistema',
      }

      let caRecord: any
      if (payload.id) {
        caRecord = await tx.creditAnalysis.update({
          where: { id: payload.id },
          data: creditAnalysisData,
        })
        // Limpa itens antigos para re-inserir atualizados
        await tx.agroRevenue.deleteMany({ where: { creditAnalysisId: payload.id } })
        await tx.expense.deleteMany({ where: { creditAnalysisId: payload.id } })
      } else {
        caRecord = await tx.creditAnalysis.create({
          data: creditAnalysisData,
        })
      }

      // 3. Inserir safras e culturas detalhadas
      if (payload.customAgroRevenues && payload.customAgroRevenues.length > 0) {
        for (const ar of payload.customAgroRevenues) {
          const qty = Number(ar.quantity) || 0
          const prc = Number(ar.unitPrice) || 0
          const cost = Number(ar.productionCostTotal) || 0
          const gross = qty * prc
          const net = Math.max(0, gross - cost)

          await tx.agroRevenue.create({
            data: {
              branchId: resolvedBranchId,
              creditAnalysisId: caRecord.id,
              realizationType: (ar.realizationType as RevenueRealizationType) || RevenueRealizationType.PROJETADA_SAFRA,
              activityType: (ar.activityType as AgroActivityType) || AgroActivityType.AGRICOLA_GRAOS,
              description: ar.description || 'Cultura Agrícola',
              quantity: qty,
              unit: ar.unit || 'sc',
              unitPrice: prc,
              grossRevenue: gross,
              productionCostTotal: cost,
              netRevenue: net,
            },
          })
        }
      }

      // 4. Inserir despesas detalhadas se fornecidas
      if (payload.customExpenses && payload.customExpenses.length > 0) {
        for (const ex of payload.customExpenses) {
          await tx.expense.create({
            data: {
              branchId: resolvedBranchId,
              creditAnalysisId: caRecord.id,
              category: ex.category as ExpenseCategory,
              description: ex.description,
              creditorName: ex.creditorName || null,
              installmentValue: ex.installmentValue || null,
              annualAmount: ex.annualAmount,
              isContinuingLiability: ex.isContinuingLiability ?? true,
            },
          })
        }
      }

      return caRecord
    })

    if (payload.propertyId) {
      revalidatePath(`/admin/crm/properties/${payload.propertyId}`)
    }
    revalidatePath(`/admin/crm/producers/${producer.id}`)

    return {
      success: true,
      id: analysis.id,
      riskAnalysis,
    }
  } catch (error: any) {
    console.error('[saveCreditAnalysis] Erro ao salvar análise de crédito:', error)
    return {
      success: false,
      error: error?.message || 'Falha ao salvar análise de crédito.',
    }
  }
}

/**
 * Recupera uma análise de crédito detalhada por ID, com todos os seus relacionamentos.
 */
export async function getCreditAnalysisById(id: string) {
  try {
    const user = await getUserContext()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const analysis = await (prisma as any).creditAnalysis.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true } },
        producer: {
          select: {
            id: true,
            name: true,
            document: true,
            type: true,
            spouseName: true,
            spouseCpf: true,
            marriageRegime: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            propertyName: true,
            city: true,
            state: true,
            totalArea: true,
            car: true,
            ccir: true,
            registrationNumber: true,
          },
        },
        agroRevenues: true,
        nonAgroRevenues: true,
        expenses: true,
      },
    })

    if (!analysis) {
      return { success: false, error: 'Análise de crédito não encontrada' }
    }

    return { success: true, data: analysis }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao consultar análise de crédito' }
  }
}

/**
 * Lista as análises de crédito com suporte a filtros por produtor ou propriedade.
 */
export async function listCreditAnalyses(filters?: {
  producerId?: string
  propertyId?: string
  branchId?: string
}) {
  try {
    const user = await getUserContext()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado', data: [] }
    }

    const where: any = {}
    if (filters?.producerId) where.producerId = filters.producerId
    if (filters?.propertyId) where.propertyId = filters.propertyId
    if (filters?.branchId) where.branchId = filters.branchId
    else if (user.branchId) where.branchId = user.branchId

    const analyses = await (prisma as any).creditAnalysis.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        producer: { select: { id: true, name: true, document: true } },
        property: { select: { id: true, propertyName: true, name: true } },
      },
    })

    return { success: true, data: analyses }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao listar análises de crédito', data: [] }
  }
}
