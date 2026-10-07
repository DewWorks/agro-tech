'use server'

import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import {
  generateLimiteCreditoBbHtml,
  LimiteCreditoDocumentData,
} from '@/lib/document-templates/limite-credito-bb'
import { saveCreditAnalysis, checkProducerCreditAnalysis } from '@/actions/credit-analysis'
import { CREDIT_LINES_CATALOG } from '@/constants/credit-lines'
import { COLLATERAL_WEIGHTS, calculatePaymentCapacity } from '@/lib/financial-engine'
import { sanitizeAccessRoute } from '@/lib/document-templates/limite-credito-bb/formatters'
import type {
  CreditLimitFilter,
  CreditLimitPropertyItem,
  CreditLimitPortfolioKPIs,
  CreditLimitPortfolioResult,
  CreditSimulationSaveParams,
  PropertySimulationData,
} from '@/types/credit-limit.types'

export type {
  CreditLimitFilter,
  CreditLimitPropertyItem,
  CreditLimitPortfolioKPIs,
  CreditLimitPortfolioResult,
  CreditSimulationSaveParams,
  PropertySimulationData,
}

/**
 * Consulta otimizada e unificada que extrai o snapshot financeiro e patrimonial
 * de uma propriedade rural (terra, benfeitorias, máquinas, semoventes, urbanos e fluxo de caixa).
 * Compartilhado entre a simulação de risco e a emissão do dossiê oficial (Single Source of Truth).
 */
export async function fetchPropertyFinancialSnapshot(propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      branch: { include: { organization: true } },
      producers: { include: { producer: true } },
      machineries: true,
      improvementsList: true,
      livestockList: true,
      creditAnalyses: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!property) return null

  const primaryProducer = property.producers[0]?.producer
  if (!primaryProducer) return null

  const [urbanProperties, vehicles] = await Promise.all([
    prisma.urbanProperty.findMany({
      where: { producerId: primaryProducer.id },
    }),
    prisma.vehicle.findMany({
      where: { producerId: primaryProducer.id },
    }),
  ])

  const poss = (property.possessionData as any) || {}
  const latestAnalysis = property.creditAnalyses[0]

  const totalArea = Number(property.totalArea) || 0
  const vtnPerHectare = Number(poss.vtnPerHectare) || 0
  const landValue = Math.round(totalArea * vtnPerHectare * 100) / 100

  const machineryValue = property.machineries.reduce(
    (acc, m) => acc + (Number(m.value) || 0),
    0
  )
  const improvementsValue = property.improvementsList.reduce(
    (acc, i) => acc + Number(i.quantity || 0) * Number(i.unitValue || 0),
    0
  )
  const livestockValue = property.livestockList.reduce(
    (acc, l) => acc + Number(l.quantity || 0) * Number(l.unitValue || 0),
    0
  )
  const ruralAssetsTotal = landValue + machineryValue + improvementsValue + livestockValue

  const urbanList =
    urbanProperties.length > 0 ? urbanProperties : poss.urbanProperties || []
  const vehicleList =
    vehicles.length > 0 ? vehicles : poss.vehicles || []

  const urbanTotal = urbanList.reduce(
    (acc: number, u: any) => acc + (Number(u.marketValue) || 0),
    0
  )
  const vehiclesTotal = vehicleList.reduce(
    (acc: number, v: any) => acc + (Number(v.declaredValue) || 0),
    0
  )
  const totalAssets = ruralAssetsTotal + urbanTotal + vehiclesTotal

  const urbanAcceptable = urbanList.reduce(
    (acc: number, u: any) =>
      acc + (u.hasLien ? 0 : (Number(u.marketValue) || 0) * COLLATERAL_WEIGHTS.URBAN_PROPERTY),
    0
  )
  const vehiclesAcceptable = vehicleList.reduce(
    (acc: number, v: any) =>
      acc + (v.hasLien ? 0 : (Number(v.declaredValue) || 0) * COLLATERAL_WEIGHTS.VEHICLES),
    0
  )

  const acceptableCollateral =
    (landValue + improvementsValue) * COLLATERAL_WEIGHTS.RURAL_REAL_ESTATE +
    (machineryValue + livestockValue) * COLLATERAL_WEIGHTS.RURAL_PLEDGE +
    urbanAcceptable +
    vehiclesAcceptable

  const effectiveAgroRevenue = Number(poss.effectiveAgroRevenue) || 0
  const projectedAgroRevenue = Number(poss.projectedAgroRevenue) || 0
  const otherRevenues = Number(poss.otherRevenues) || 0
  const operationalExpenses = Number(poss.operationalExpenses) || 0
  const familyLivingCosts = Number(poss.familyLivingCosts) || 0
  const existingDebtService = Number(poss.existingDebtService) || 0

  const cpResult = calculatePaymentCapacity({
    effectiveAgroRevenue,
    projectedAgroRevenue,
    operationalExpenses,
    nonAgroRevenues: otherRevenues,
    familyLivingCosts,
    existingDebtService,
    customAgroRevenues: poss.customAgroRevenues,
    customExpenses: poss.customExpenses,
  })

  const netMargin = cpResult.paymentCapacity
  const paymentCapacity = cpResult.paymentCapacity

  return {
    property,
    primaryProducer,
    urbanProperties: urbanList,
    vehicles: vehicleList,
    poss,
    latestAnalysis,
    financials: {
      totalArea,
      vtnPerHectare,
      landValue,
      machineryValue,
      improvementsValue,
      livestockValue,
      ruralAssetsTotal,
      urbanTotal,
      vehiclesTotal,
      totalAssets,
      urbanAcceptable,
      vehiclesAcceptable,
      acceptableCollateral,
      effectiveAgroRevenue,
      projectedAgroRevenue,
      otherRevenues,
      operationalExpenses,
      familyLivingCosts,
      existingDebtService,
      netMargin,
      paymentCapacity,
    },
  }
}

/**
 * Consulta a carteira consolidada de propriedades para a visão de portfólio.
 */
export async function getCreditLimitPortfolioData(
  filters?: CreditLimitFilter
): Promise<CreditLimitPortfolioResult> {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) {
      return {
        success: false,
        error: 'Usuário não autenticado',
        isFinancialModuleDisabledForOrg: false,
        kpis: {
          totalRequestedLimit: 0,
          totalCollateralAvailable: 0,
          totalAnalyzedProperties: 0,
          totalProperties: 0,
          compatibleCount: 0,
          reviewCount: 0,
          averageNetMargin: 0,
        },
        properties: [],
        branches: [],
      }
    }

    const isSuperAdmin =
      dbUser.role === 'SUPER_ADMIN' || (dbUser as any).realRole === 'SUPER_ADMIN'
    const isOrgFinancialEnabled = (dbUser.organization?.modules || []).includes(
      'FINANCIAL_SUMMARY'
    )
    const hasFinancialModule = isSuperAdmin || isOrgFinancialEnabled
    const isFinancialModuleDisabledForOrg = isSuperAdmin && !isOrgFinancialEnabled

    if (!hasFinancialModule) {
      return {
        success: false,
        error:
          'Acesso negado: o módulo financeiro não está contratado para esta organização.',
        isFinancialModuleDisabledForOrg: false,
        kpis: {
          totalRequestedLimit: 0,
          totalCollateralAvailable: 0,
          totalAnalyzedProperties: 0,
          totalProperties: 0,
          compatibleCount: 0,
          reviewCount: 0,
          averageNetMargin: 0,
        },
        properties: [],
        branches: [],
      }
    }

    // Resolver organização (suporta Super Admin global)
    let targetOrgId = dbUser.organizationId
    if (!targetOrgId && isSuperAdmin) {
      const fallbackOrg =
        (await prisma.organization.findFirst({
          where: { name: { contains: 'LN - CONSULTORIA', mode: 'insensitive' } },
        })) || (await prisma.organization.findFirst())
      targetOrgId = fallbackOrg?.id || null
    }

    if (!targetOrgId) {
      return {
        success: false,
        error: 'Organização não encontrada.',
        isFinancialModuleDisabledForOrg,
        kpis: {
          totalRequestedLimit: 0,
          totalCollateralAvailable: 0,
          totalAnalyzedProperties: 0,
          totalProperties: 0,
          compatibleCount: 0,
          reviewCount: 0,
          averageNetMargin: 0,
        },
        properties: [],
        branches: [],
      }
    }

    // Buscar filiais da organização
    const branches = await prisma.branch.findMany({
      where: { organizationId: targetOrgId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })

    const branchIdFilter =
      filters?.branchId && filters.branchId !== 'TODAS'
        ? filters.branchId
        : undefined
    const search = filters?.search?.trim()

    // Buscar propriedades pertencentes à organização
    const propertiesData = await prisma.property.findMany({
      where: {
        branch: {
          organizationId: targetOrgId,
          ...(branchIdFilter ? { id: branchIdFilter } : {}),
        },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { propertyName: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
                { registrationNumber: { contains: search, mode: 'insensitive' } },
                {
                  producers: {
                    some: {
                      producer: {
                        name: { contains: search, mode: 'insensitive' },
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        branch: { select: { id: true, name: true } },
        producers: {
          include: {
            producer: { select: { id: true, name: true, document: true } },
          },
        },
        machineries: true,
        improvementsList: true,
        livestockList: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Processamento e cálculo das regras MCR para cada propriedade
    const processedList: CreditLimitPropertyItem[] = propertiesData.map((prop) => {
      const possessionData = (prop.possessionData as any) || {}
      const totalArea = Number(prop.totalArea) || 0
      const vtnPerHectare = Number(possessionData.vtnPerHectare) || 0
      const landValue = Math.round(totalArea * vtnPerHectare * 100) / 100

      const machineryValue = (prop.machineries || []).reduce(
        (acc: number, cur: any) => acc + (Number(cur.value) || 0),
        0
      )
      const improvementsValue = (prop.improvementsList || []).reduce(
        (acc: number, cur: any) =>
          acc + Number(cur.quantity || 0) * Number(cur.unitValue || 0),
        0
      )
      const livestockValue = (prop.livestockList || []).reduce(
        (acc: number, cur: any) =>
          acc + Number(cur.quantity || 0) * Number(cur.unitValue || 0),
        0
      )

      const totalAssets = landValue + machineryValue + improvementsValue + livestockValue

      // Margens de Garantia Aceitas (MCR)
      const realEstateCollateral =
        (landValue + improvementsValue) * COLLATERAL_WEIGHTS.RURAL_REAL_ESTATE
      const pledgeCollateral =
        (machineryValue + livestockValue) * COLLATERAL_WEIGHTS.RURAL_PLEDGE
      const totalCollateralLimit = realEstateCollateral + pledgeCollateral

      // Fluxo Financeiro e Capacidade de Pagamento
      const effectiveAgroRevenue = Number(possessionData.effectiveAgroRevenue) || 0
      const projectedAgroRevenue = Number(possessionData.projectedAgroRevenue) || 0
      const otherRevenues = Number(possessionData.otherRevenues) || 0
      const operationalExpenses = Number(possessionData.operationalExpenses) || 0
      const existingDebtService = Number(possessionData.existingDebtService) || 0
      const familyLivingCosts = Number(possessionData.familyLivingCosts) || 0

      const cpResult = calculatePaymentCapacity({
        effectiveAgroRevenue,
        projectedAgroRevenue,
        operationalExpenses,
        nonAgroRevenues: otherRevenues,
        familyLivingCosts,
        existingDebtService,
        customAgroRevenues: possessionData.customAgroRevenues,
        customExpenses: possessionData.customExpenses,
      })

      const netMargin = cpResult.paymentCapacity

      // Parâmetros de Limite de Crédito
      const creditLimitRequested = Number(possessionData.creditLimitRequested) || 0
      const creditLimitPurpose =
        possessionData.creditLimitPurpose || 'CUSTEIO_AGRICOLA'
      const creditLimitTargetBank =
        possessionData.creditLimitTargetBank || 'BANCO_DO_BRASIL'
      const creditLimitTermMonths =
        Number(possessionData.creditLimitTermMonths) || 12

      const termYears = Math.max(1, creditLimitTermMonths / 12)
      const estimatedAnnualInstallment =
        creditLimitTermMonths <= 12
          ? creditLimitRequested * 1.095
          : creditLimitRequested / termYears +
            creditLimitRequested * 0.105 * 0.55

      const hasFinancialData =
        creditLimitRequested > 0 ||
        operationalExpenses > 0 ||
        effectiveAgroRevenue > 0 ||
        totalAssets > 0

      let status: 'COMPATIVEL' | 'REVISAR_PRAZO' | 'INCOMPATIVEL' | 'PENDENTE' =
        'PENDENTE'
      if (creditLimitRequested > 0) {
        if (netMargin >= estimatedAnnualInstallment) {
          status = 'COMPATIVEL'
        } else if (netMargin > 0) {
          status = 'REVISAR_PRAZO'
        } else {
          status = 'INCOMPATIVEL'
        }
      }

      // Produtor principal
      const primaryProducer = prop.producers[0]?.producer

      return {
        id: prop.id,
        name: prop.name,
        propertyName: prop.propertyName,
        city: prop.city,
        state: prop.state,
        totalArea,
        branchId: prop.branchId,
        branchName: prop.branch.name,
        producerId: primaryProducer?.id || null,
        primaryProducerName: primaryProducer?.name || 'Não vinculado',
        primaryProducerDocument: primaryProducer?.document || null,
        landValue,
        improvementsValue,
        machineryValue,
        livestockValue,
        totalAssets,
        realEstateCollateral,
        pledgeCollateral,
        totalCollateralLimit,
        effectiveAgroRevenue,
        projectedAgroRevenue,
        operationalExpenses,
        existingDebtService,
        familyLivingCosts,
        netMargin,
        creditLimitRequested,
        creditLimitPurpose,
        creditLimitTargetBank,
        creditLimitTermMonths,
        estimatedAnnualInstallment,
        hasFinancialData,
        status,
        updatedAt: prop.updatedAt,
      }
    })

    // Filtros adicionais em memória (finalidade, banco, status)
    let filteredList = processedList
    if (filters?.purpose && filters.purpose !== 'TODOS') {
      filteredList = filteredList.filter((p) => p.creditLimitPurpose === filters.purpose)
    }
    if (filters?.bank && filters.bank !== 'TODOS') {
      filteredList = filteredList.filter((p) => p.creditLimitTargetBank === filters.bank)
    }
    if (filters?.status && filters.status !== 'TODOS') {
      filteredList = filteredList.filter((p) => p.status === filters.status)
    }

    // Consolidação de KPIs sobre a base filtrada
    const totalRequestedLimit = filteredList.reduce(
      (acc, cur) => acc + cur.creditLimitRequested,
      0
    )
    const totalCollateralAvailable = filteredList.reduce(
      (acc, cur) => acc + cur.totalCollateralLimit,
      0
    )
    const analyzedProperties = filteredList.filter((p) => p.hasFinancialData)
    const totalAnalyzedProperties = analyzedProperties.length
    const compatibleCount = filteredList.filter((p) => p.status === 'COMPATIVEL').length
    const reviewCount = filteredList.filter((p) => p.status === 'REVISAR_PRAZO').length

    const averageNetMargin =
      totalAnalyzedProperties > 0
        ? analyzedProperties.reduce((acc, cur) => acc + cur.netMargin, 0) /
          totalAnalyzedProperties
        : 0

    return {
      success: true,
      isFinancialModuleDisabledForOrg,
      kpis: {
        totalRequestedLimit,
        totalCollateralAvailable,
        totalAnalyzedProperties,
        totalProperties: filteredList.length,
        compatibleCount,
        reviewCount,
        averageNetMargin,
      },
      properties: filteredList,
      branches,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao carregar carteira de limite de crédito',
      isFinancialModuleDisabledForOrg: false,
      kpis: {
        totalRequestedLimit: 0,
        totalCollateralAvailable: 0,
        totalAnalyzedProperties: 0,
        totalProperties: 0,
        compatibleCount: 0,
        reviewCount: 0,
        averageNetMargin: 0,
      },
      properties: [],
      branches: [],
    }
  }
}

/**
 * Retorna as propriedades disponíveis para o Select do Simulador de Limite.
 */
export async function getPropertiesForCreditLimitSelect(): Promise<
  Array<{
    id: string
    name: string
    propertyName: string | null
    city: string | null
    state: string | null
    totalArea: number
    producerName: string
    producerDocument: string | null
    producerId: string
  }>
> {
  const dbUser = await getUserContext()
  if (!dbUser) return []

  const isSuperAdmin =
    dbUser.role === 'SUPER_ADMIN' || (dbUser as any).realRole === 'SUPER_ADMIN'
  let targetOrgId = dbUser.organizationId
  if (!targetOrgId && isSuperAdmin) {
    const fallbackOrg =
      (await prisma.organization.findFirst({
        where: { name: { contains: 'LN - CONSULTORIA', mode: 'insensitive' } },
      })) || (await prisma.organization.findFirst())
    targetOrgId = fallbackOrg?.id || null
  }
  if (!targetOrgId) return []

  const properties = await prisma.property.findMany({
    where: {
      branch: { organizationId: targetOrgId },
    },
    select: {
      id: true,
      name: true,
      propertyName: true,
      city: true,
      state: true,
      totalArea: true,
      producers: {
        select: {
          producer: {
            select: { id: true, name: true, document: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return properties.map((p) => {
    const primaryProducer = p.producers[0]?.producer
    return {
      id: p.id,
      name: p.propertyName || p.name,
      propertyName: p.propertyName,
      city: p.city,
      state: p.state,
      totalArea: Number(p.totalArea) || 0,
      producerName: primaryProducer?.name || 'Não vinculado',
      producerDocument: primaryProducer?.document || null,
      producerId: primaryProducer?.id || '',
    }
  })
}

/**
 * Retorna todos os dados analíticos necessários para a simulação de risco MCR da propriedade.
 * Consome o snapshot financeiro unificado (Single Source of Truth).
 */
export async function getPropertySimulationData(
  propertyId: string
): Promise<{ success: boolean; data?: PropertySimulationData; error?: string }> {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) return { success: false, error: 'Usuário não autenticado' }

    const snapshot = await fetchPropertyFinancialSnapshot(propertyId)
    if (!snapshot) {
      return { success: false, error: 'Propriedade ou produtor não encontrado' }
    }

    const {
      property,
      primaryProducer,
      urbanProperties,
      vehicles,
      poss,
      latestAnalysis,
      financials,
    } = snapshot

    const lineCode =
      latestAnalysis?.creditLineCode ||
      poss.creditLineCode ||
      'PRONAMP_CUSTEIO'
    const lineDef = CREDIT_LINES_CATALOG.find((l) => l.code === lineCode)

    const simulationParams = {
      creditLineCode: lineCode,
      creditLimitPurpose: poss.creditLimitPurpose || 'CUSTEIO_AGRICOLA',
      creditLimitTargetBank:
        latestAnalysis?.targetBank ||
        poss.creditLimitTargetBank ||
        'BANCO_DO_BRASIL',
      requestedAmount:
        latestAnalysis && Number(latestAnalysis.requestedAmount) > 100
          ? Number(latestAnalysis.requestedAmount)
          : Number(poss.creditLimitRequested) > 100
          ? Number(poss.creditLimitRequested)
          : 250000,
      termMonths:
        latestAnalysis?.termMonths ||
        Number(poss.creditLimitTermMonths) ||
        lineDef?.defaultTermMonths ||
        12,
      graceMonths:
        latestAnalysis?.gracePeriodMonths ??
        (poss.gracePeriodMonths !== undefined
          ? Number(poss.gracePeriodMonths)
          : lineDef?.defaultGraceMonths ?? 0),
      interestRateAnnual: latestAnalysis
        ? Number(latestAnalysis.interestRateAnnual)
        : Number(poss.interestRateAnnual) || lineDef?.defaultInterestRate || 8.0,
      amortizationSystem: (latestAnalysis?.amortizationSystem ||
        poss.amortizationSystem ||
        'PRICE') as 'PRICE' | 'SAC',
    }

    return {
      success: true,
      data: {
        property: {
          id: property.id,
          name: property.name,
          propertyName: property.propertyName,
          city: property.city,
          state: property.state,
          registrationNumber: property.registrationNumber,
          car: property.car,
          ccir: property.ccir,
          itr: property.itr,
          totalArea: financials.totalArea,
          vtnPerHectare: financials.vtnPerHectare,
          landValue: financials.landValue,
          branchId: property.branchId,
          branchName: property.branch.name,
        },
        producer: {
          id: primaryProducer.id,
          name: primaryProducer.name,
          document: primaryProducer.document,
          type: primaryProducer.type,
          spouseName: primaryProducer.spouseName,
          spouseCpf: primaryProducer.spouseCpf,
          marriageRegime: primaryProducer.marriageRegime,
          profession: primaryProducer.profession,
          representativeCpf: primaryProducer.representativeCpf || null,
          representativeName: (primaryProducer as any).representativeName || null,
          phone: primaryProducer.phone,
        },
        collateral: {
          landValue: financials.landValue,
          improvementsValue: financials.improvementsValue,
          machineryValue: financials.machineryValue,
          livestockValue: financials.livestockValue,
          ruralAssetsTotal: financials.ruralAssetsTotal,
          urbanTotal: financials.urbanTotal,
          vehiclesTotal: financials.vehiclesTotal,
          totalAssets: financials.totalAssets,
          acceptableCollateral: financials.acceptableCollateral,
          urbanProperties,
          vehicles,
        },
        cashFlow: {
          effectiveAgroRevenue: financials.effectiveAgroRevenue,
          projectedAgroRevenue: financials.projectedAgroRevenue,
          otherRevenues: financials.otherRevenues,
          operationalExpenses: financials.operationalExpenses,
          familyLivingCosts: financials.familyLivingCosts,
          existingDebtService: financials.existingDebtService,
          netMargin: financials.netMargin,
          paymentCapacity: financials.paymentCapacity,
          customAgroRevenues: poss.customAgroRevenues || [],
          customExpenses: poss.customExpenses || [],
        },
        simulationParams,
      },
    }
  } catch (error: any) {
    console.error('[getPropertySimulationData] Error:', error)
    return {
      success: false,
      error: error?.message || 'Erro ao carregar dados da propriedade',
    }
  }
}

/**
 * Salva as alterações de simulação no possessionData da propriedade
 * e persiste uma análise formal no banco de dados.
 */
export async function saveCreditLimitSimulation(
  propertyId: string,
  params: CreditSimulationSaveParams
): Promise<{ success: boolean; error?: string; analysisId?: string }> {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) return { success: false, error: 'Usuário não autenticado' }

    const snapshot = await fetchPropertyFinancialSnapshot(propertyId)
    if (!snapshot) {
      return { success: false, error: 'Propriedade ou produtor não encontrado' }
    }
    const { property, primaryProducer, poss, financials } = snapshot

    // 1. Atualizar possessionData na propriedade
    const updatedPossession = {
      ...poss,
      creditLineCode: params.creditLineCode,
      creditLimitRequested: params.requestedAmount,
      creditLimitPurpose: params.creditLimitPurpose,
      creditLimitTargetBank: params.creditLimitTargetBank,
      creditLimitTermMonths: params.termMonths,
      gracePeriodMonths: params.graceMonths,
      interestRateAnnual: params.interestRateAnnual,
      amortizationSystem: params.amortizationSystem,
      creditLimitNotes: params.notes || poss.creditLimitNotes || '',
    }

    await prisma.property.update({
      where: { id: propertyId },
      data: { possessionData: updatedPossession },
    })

    // 2. Persistir análise de crédito relacional formal no banco
    const res = await saveCreditAnalysis({
      producerId: primaryProducer.id,
      propertyId: property.id,
      branchId: property.branchId,
      cropYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
      creditLineCode: params.creditLineCode,
      creditLimitTargetBank: params.creditLimitTargetBank,
      requestedAmount: params.requestedAmount,
      amortizationSystem: params.amortizationSystem,
      totalTermMonths: params.termMonths,
      gracePeriodMonths: params.graceMonths,
      interestRateAnnual: params.interestRateAnnual,
      effectiveAgroRevenue: financials.effectiveAgroRevenue,
      projectedAgroRevenue: financials.projectedAgroRevenue,
      nonAgroRevenue: financials.otherRevenues,
      productionCosts: financials.operationalExpenses,
      familyLivingExpenses: financials.familyLivingCosts,
      existingDebtService: financials.existingDebtService,
      landValue: financials.landValue,
      improvementsValue: financials.improvementsValue,
      machineryValue: financials.machineryValue,
      livestockValue: financials.livestockValue,
      customAgroRevenues: poss.customAgroRevenues || [],
      customExpenses: poss.customExpenses || [],
    })

    revalidatePath('/admin/credit-limit')
    revalidatePath(`/admin/crm/properties/${propertyId}`)

    return {
      success: true,
      analysisId: res.id,
    }
  } catch (error: any) {
    console.error('[saveCreditLimitSimulation] Error:', error)
    return {
      success: false,
      error: error?.message || 'Erro ao salvar simulação de crédito',
    }
  }
}

/**
 * Gera o código HTML completo do Dossiê Técnico Oficial de Limite de Crédito.
 * Reutiliza a projeção unificada de dados de fetchPropertyFinancialSnapshot.
 */
export async function generateCreditLimitDossierHtml(
  propertyId: string,
  customParams?: any
): Promise<{
  success: boolean
  html?: string
  producerName?: string
  propertyName?: string
  fileName?: string
  error?: string
}> {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) return { success: false, error: 'Usuário não autenticado' }

    const snapshot = await fetchPropertyFinancialSnapshot(propertyId)
    if (!snapshot) return { success: false, error: 'Propriedade ou produtor não encontrado' }

    const {
      property,
      primaryProducer: producer,
      urbanProperties,
      vehicles,
      poss,
      latestAnalysis,
    } = snapshot

    const mergedOptions = {
      ...poss,
      ...(latestAnalysis
        ? {
            creditLineCode: latestAnalysis.creditLineCode,
            creditLimitRequested: Number(latestAnalysis.requestedAmount),
            creditLimitTermMonths: latestAnalysis.termMonths,
            gracePeriodMonths: latestAnalysis.gracePeriodMonths,
            interestRateAnnual: Number(latestAnalysis.interestRateAnnual),
            amortizationSystem: latestAnalysis.amortizationSystem,
            creditLimitTargetBank: latestAnalysis.targetBank,
          }
        : {}),
      urbanProperties,
      vehicles,
      estimatedLandValuePerHa: poss.vtnPerHectare || 0,
      estimatedCattleHeadValue: poss.estimatedCattleHeadValue || 2800,
      ...customParams,
    }

    const docData: LimiteCreditoDocumentData = {
      producer: {
        name: producer.name,
        document: producer.document,
        type: producer.type as 'PF' | 'PJ',
        spouseName: producer.spouseName || undefined,
        spouseCpf: producer.spouseCpf || undefined,
        spouseRg: producer.spouseRg || undefined,
        marriageRegime: producer.marriageRegime || undefined,
        profession: producer.profession || undefined,
        representativeCpf: producer.representativeCpf || undefined,
        representativeName: (producer as any).representativeName || undefined,
        phone: producer.phone || undefined,
        city: property.city || undefined,
        state: property.state || undefined,
      },
      property: {
        name: property.propertyName || property.name,
        registrationNumber: property.registrationNumber || undefined,
        registryOffice: property.registryOffice || undefined,
        car: property.car || undefined,
        ccir: property.ccir || undefined,
        itr: property.itr || undefined,
        city: property.city || undefined,
        state: property.state || undefined,
        totalAreaHa: Number(property.totalArea) || 0,
        pastureAreaHa: property.pastureArea
          ? Number(property.pastureArea)
          : undefined,
        agricultureAreaHa:
          property.productiveArea && property.pastureArea
            ? Math.max(
                0,
                Number(property.productiveArea) - Number(property.pastureArea)
              )
            : undefined,
        preservationAreaHa: property.preserveArea
          ? Number(property.preserveArea)
          : undefined,
        accessRoute: sanitizeAccessRoute(poss.accessRoute),
        machineries: property.machineries.map((m) => ({
          model: m.model || undefined,
          brand: m.brand || undefined,
          specification: m.specification || undefined,
          year: m.year ? Number(m.year) : undefined,
          value: Number(m.value) || 0,
          hasLien: m.hasLien,
          lienInstitution: m.lienInstitution || undefined,
        })),
        improvementsList: property.improvementsList.map((i) => ({
          specification: i.specification,
          quantity: Number(i.quantity) || 0,
          unitValue: Number(i.unitValue) || 0,
          unit: i.unit || undefined,
          observation: i.observation || undefined,
        })),
        livestockList: property.livestockList.map((l) => ({
          category: l.category,
          categoryBB: (l.categoryBB || l.category) as any,
          purposeBB: (l.purposeBB || l.purpose || undefined) as any,
          quantity: Number(l.quantity) || 0,
          unitValue: Number(l.unitValue) || 0,
          avgWeightKg: l.avgWeightKg ? Number(l.avgWeightKg) : undefined,
          brandingType: l.brandingType || undefined,
          brandingLocation: l.brandingLocation || undefined,
        })),
      },
      organization: {
        name: property.branch.organization.name,
        cnpj: property.branch.organization.cnpj || undefined,
        ownerName: (property.branch.organization as any).ownerName || undefined,
      },
      branch: {
        name: property.branch.name,
      },
      options: mergedOptions,
    }

    const html = generateLimiteCreditoBbHtml(docData)
    const sanitizedPropName = (property.propertyName || property.name).replace(
      /[^a-zA-Z0-9_-]/g,
      '_'
    )
    const fileName = `Dossie_Limite_Credito_${sanitizedPropName}_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`

    return {
      success: true,
      html,
      producerName: producer.name,
      propertyName: property.propertyName || property.name,
      fileName,
    }
  } catch (error: any) {
    console.error('[generateCreditLimitDossierHtml] Error:', error)
    return {
      success: false,
      error: error?.message || 'Erro ao gerar dossiê de limite de crédito',
    }
  }
}

/**
 * Agrupa e paraleliza todas as consultas necessárias para inicializar o Simulador MCR
 * quando parâmetros como producerId, propertyId, amount ou creditLine são fornecidos na URL.
 * Elimina buscas sequenciais em cascata com Promise.all.
 */
export async function getSimulationInitialBundle({
  producerId,
  propertyId,
  cropYear,
}: {
  producerId?: string | null
  propertyId?: string | null
  cropYear?: string
}): Promise<{
  success: boolean
  producer?: any
  properties?: any[]
  resolvedPropertyId?: string | null
  simulationData?: PropertySimulationData | null
  analysis?: any
  error?: string
}> {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) return { success: false, error: 'Usuário não autenticado' }

    // Paraleliza as consultas independentes
    const [producer, producerProperties, propertySimulationResult, creditAnalysisResult] =
      await Promise.all([
        producerId
          ? prisma.producer.findUnique({
              where: { id: producerId },
              select: {
                id: true,
                name: true,
                document: true,
                type: true,
                phone: true,
                branchId: true,
              },
            })
          : Promise.resolve(null),
        producerId
          ? prisma.producerProperty.findMany({
              where: { producerId },
              include: {
                property: {
                  select: {
                    id: true,
                    name: true,
                    propertyName: true,
                    city: true,
                    state: true,
                    totalArea: true,
                    branchId: true,
                  },
                },
              },
            })
          : Promise.resolve([]),
        propertyId
          ? getPropertySimulationData(propertyId)
          : Promise.resolve(null),
        producerId
          ? checkProducerCreditAnalysis({
              producerId,
              propertyId: propertyId || undefined,
              cropYear,
            })
          : Promise.resolve(null),
      ])

    let simulationData = propertySimulationResult?.success ? propertySimulationResult.data : null
    let resolvedPropertyId = propertyId || null

    // Se propertyId não foi fornecido mas o produtor possui propriedades vinculadas
    if (!simulationData && producerProperties && producerProperties.length > 0) {
      const firstProp = (producerProperties[0] as any)?.property
      if (firstProp) {
        resolvedPropertyId = firstProp.id
        const autoFetch = await getPropertySimulationData(firstProp.id)
        if (autoFetch.success && autoFetch.data) {
          simulationData = autoFetch.data
        }
      }
    }

    return {
      success: true,
      producer,
      properties: (producerProperties as any[]).map((pp: any) => pp.property).filter(Boolean),
      resolvedPropertyId,
      simulationData,
      analysis: creditAnalysisResult?.success ? creditAnalysisResult.analysis : null,
    }
  } catch (error: any) {
    console.error('[getSimulationInitialBundle] Erro:', error)
    return { success: false, error: error?.message || 'Erro ao carregar pacote de simulação' }
  }
}
