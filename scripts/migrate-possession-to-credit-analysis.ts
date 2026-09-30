import 'dotenv/config'
import prisma from '../src/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  AnalysisStatus,
  CreditLineAxis,
  AgroActivityType,
  RevenueRealizationType,
  ExpenseCategory,
  AmortizationSystem,
} from '../src/lib/financial-engine'

interface LegacyPossessionData {
  possessionYears?: number
  vtnPerHectare?: number
  totalLandValue?: number
  effectiveAgroRevenue?: number
  projectedAgroRevenue?: number
  otherRevenues?: number
  operationalExpenses?: number
  existingDebtService?: number
  familyLivingCosts?: number
  creditLimitRequested?: number
  creditLimitPurpose?: string
  creditLimitTargetBank?: string
  creditLimitTermMonths?: number
  creditLimitNotes?: string
  accessRoute?: string
}

async function migratePossessionToCreditAnalysis() {
  console.log('🚀 Iniciando migração suave de possessionData para CreditAnalysis...')

  const properties = await prisma.property.findMany({
    where: {
      possessionData: {
        not: Prisma.JsonNull
      }
    },
    include: {
      producers: {
        include: {
          producer: true
        }
      },
      machineries: true,
      improvementsList: true,
      livestockList: true
    }
  })

  console.log(`🔍 Total de propriedades com possessionData encontradas: ${properties.length}`)

  let migratedCount = 0
  let skippedCount = 0

  for (const prop of properties) {
    const poss = (prop.possessionData as unknown as LegacyPossessionData) || {}

    const hasFinancialData =
      (Number(poss.creditLimitRequested) || 0) > 0 ||
      (Number(poss.effectiveAgroRevenue) || 0) > 0 ||
      (Number(poss.projectedAgroRevenue) || 0) > 0 ||
      (Number(poss.otherRevenues) || 0) > 0 ||
      (Number(poss.operationalExpenses) || 0) > 0 ||
      (Number(poss.existingDebtService) || 0) > 0 ||
      (Number(poss.familyLivingCosts) || 0) > 0

    if (!hasFinancialData) {
      skippedCount++
      continue
    }

    // Identificar produtor vinculado
    const primaryProducer = prop.producers[0]?.producer
    if (!primaryProducer) {
      console.warn(`⚠️ Propriedade ${prop.name} (${prop.id}) tem dados financeiros mas nenhum produtor vinculado. Ignorando...`)
      skippedCount++
      continue
    }

    const cropYear = '2025/2026'

    // Verificar se já existe análise migrada
    const existingAnalysis = await (prisma as any).creditAnalysis.findFirst({
      where: {
        propertyId: prop.id,
        producerId: primaryProducer.id,
        cropYear
      }
    })

    if (existingAnalysis) {
      console.log(`ℹ️ Análise para propriedade ${prop.name} (${cropYear}) já existe. Pulando...`)
      skippedCount++
      continue
    }

    // Mapear dados financeiros
    const requestedAmount = Number(poss.creditLimitRequested) || 0
    const termMonths = Number(poss.creditLimitTermMonths) || 12
    const targetBank = poss.creditLimitTargetBank || 'BANCO_DO_BRASIL'
    const purpose = poss.creditLimitPurpose || 'CUSTEIO_AGRICOLA'
    const isInvestimento = purpose.toUpperCase().includes('INVESTIMENTO')
    const creditLineAxis = isInvestimento ? CreditLineAxis.INVESTIMENTO : CreditLineAxis.CUSTEIO

    const effectiveAgroRev = Number(poss.effectiveAgroRevenue) || 0
    const projectedAgroRev = Number(poss.projectedAgroRevenue) || 0
    const otherRev = Number(poss.otherRevenues) || 0
    const opExpense = Number(poss.operationalExpenses) || 0
    const debtService = Number(poss.existingDebtService) || 0
    const familyLiving = Number(poss.familyLivingCosts) || 0

    // Cálculos de garantias
    const vtnPerHa = Number(poss.vtnPerHectare) || Number(prop.vtnValuePerHa) || 0
    const totalArea = Number(prop.totalArea) || 0
    const landValue = Math.round(totalArea * vtnPerHa * 100) / 100

    const machineryVal = (prop.machineries || []).reduce(
      (acc: number, cur: any) => acc + (Number(cur.value) || 0),
      0
    )
    const improvementsVal = (prop.improvementsList || []).reduce(
      (acc: number, cur: any) =>
        acc + (Number(cur.quantity || 0) * Number(cur.unitValue || 0)),
      0
    )
    const livestockVal = (prop.livestockList || []).reduce(
      (acc: number, cur: any) =>
        acc + (Number(cur.quantity || 0) * Number(cur.unitValue || 0)),
      0
    )

    const ruralCollateral = landValue + improvementsVal + machineryVal + livestockVal
    const ruralAcceptable = (landValue + improvementsVal) * 0.65 + (machineryVal + livestockVal) * 0.50

    // Criar registro na nova modelagem relacional
    await (prisma as any).$transaction(async (tx: any) => {
      const analysis = await tx.creditAnalysis.create({
        data: {
          branchId: prop.branchId,
          producerId: primaryProducer.id,
          propertyId: prop.id,
          cropYear,
          status: AnalysisStatus.RASCUNHO,
          targetBank,
          creditLineCode: purpose,
          creditLineName: isInvestimento ? 'Investimento Agropecuário' : 'Custeio Agropecuário',
          creditLineAxis,
          requestedAmount,
          termMonths,
          interestRateAnnual: isInvestimento ? 10.5 : 9.5,
          amortizationSystem: isInvestimento ? AmortizationSystem.SAC : AmortizationSystem.PRICE,
          grossRevenueTotal: effectiveAgroRev + otherRev,
          netOperationalRevenueTotal: Math.max(0, effectiveAgroRev - opExpense),
          nonAgroRevenueTotal: otherRev,
          totalExpenses: opExpense + debtService + familyLiving,
          ruralCollateralValue: ruralCollateral,
          totalCollateralValue: ruralCollateral,
          totalCollateralAcceptable: ruralAcceptable,
          notes: poss.creditLimitNotes || `Migrado automaticamente de dados legados de posse da propriedade ${prop.name}`,
          createdBy: prop.createdBy || 'SYSTEM_MIGRATION'
        }
      })

      // Inserir receita histórica se houver
      if (effectiveAgroRev > 0) {
        await tx.agroRevenue.create({
          data: {
            branchId: prop.branchId,
            creditAnalysisId: analysis.id,
            realizationType: RevenueRealizationType.EFETIVA_HISTORICA,
            activityType: AgroActivityType.AGRICOLA_GRAOS,
            description: `Receita Agrícola Safra Anterior (${prop.name})`,
            quantity: 1,
            unit: 'un',
            unitPrice: effectiveAgroRev,
            grossRevenue: effectiveAgroRev,
            productionCostTotal: opExpense,
            netRevenue: Math.max(0, effectiveAgroRev - opExpense)
          }
        })
      }

      // Inserir receita projetada se houver
      if (projectedAgroRev > 0) {
        await tx.agroRevenue.create({
          data: {
            branchId: prop.branchId,
            creditAnalysisId: analysis.id,
            realizationType: RevenueRealizationType.PROJETADA_SAFRA,
            activityType: AgroActivityType.AGRICOLA_GRAOS,
            description: `Receita Agrícola Safra Projetada (${prop.name})`,
            quantity: 1,
            unit: 'un',
            unitPrice: projectedAgroRev,
            grossRevenue: projectedAgroRev,
            productionCostTotal: opExpense,
            netRevenue: Math.max(0, projectedAgroRev - opExpense)
          }
        })
      }

      // Inserir receita não-agro se houver
      if (otherRev > 0) {
        await tx.nonAgroRevenue.create({
          data: {
            branchId: prop.branchId,
            creditAnalysisId: analysis.id,
            description: 'Outras Rendas Declaradas (Legado)',
            annualAmount: otherRev,
            proofDocumentNotes: 'Migrado do cadastro legado'
          }
        })
      }

      // Inserir despesas
      if (familyLiving > 0) {
        await tx.expense.create({
          data: {
            branchId: prop.branchId,
            creditAnalysisId: analysis.id,
            category: ExpenseCategory.MANUTENCAO_FAMILIAR,
            description: 'Manutenção Familiar Declarada',
            annualAmount: familyLiving,
            isContinuingLiability: true
          }
        })
      }

      if (debtService > 0) {
        await tx.expense.create({
          data: {
            branchId: prop.branchId,
            creditAnalysisId: analysis.id,
            category: ExpenseCategory.PASSIVO_EXISTENTE_BANCARIO,
            description: 'Passivo / Endividamento Bancário Vigente',
            annualAmount: debtService,
            isContinuingLiability: true
          }
        })
      }
    })

    migratedCount++
    console.log(`✅ Propriedade ${prop.name} migrada para CreditAnalysis com sucesso!`)
  }

  console.log(`\n🎉 Migração concluída!`)
  console.log(`- Registros migrados: ${migratedCount}`)
  console.log(`- Registros ignorados / já existentes: ${skippedCount}`)
}

migratePossessionToCreditAnalysis()
  .catch((e) => {
    console.error('❌ Erro durante a migração:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
