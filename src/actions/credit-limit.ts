'use server'

import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import {
  generateLimiteCreditoBbHtml,
  LimiteCreditoDocumentData,
} from '@/lib/document-templates/limite-credito-bb'
import { saveCreditAnalysis } from '@/actions/credit-analysis'
import { CREDIT_LINES_CATALOG } from '@/constants/credit-lines'

export interface CreditLimitFilter {
  branchId?: string
  search?: string
  purpose?: string
  bank?: string
  status?: string
}

export interface CreditLimitPropertyItem {
  id: string
  name: string
  propertyName: string | null
  city: string | null
  state: string | null
  totalArea: number
  branchId: string
  branchName: string
  primaryProducerName: string
  primaryProducerDocument: string | null
  landValue: number
  improvementsValue: number
  machineryValue: number
  livestockValue: number
  totalAssets: number
  realEstateCollateral: number
  pledgeCollateral: number
  totalCollateralLimit: number
  effectiveAgroRevenue: number
  projectedAgroRevenue: number
  operationalExpenses: number
  existingDebtService: number
  familyLivingCosts: number
  netMargin: number
  creditLimitRequested: number
  creditLimitPurpose: string
  creditLimitTargetBank: string
  creditLimitTermMonths: number
  estimatedAnnualInstallment: number
  hasFinancialData: boolean
  status: 'COMPATIVEL' | 'REVISAR_PRAZO' | 'INCOMPATIVEL' | 'PENDENTE'
  updatedAt: Date
}

export interface CreditLimitPortfolioKPIs {
  totalRequestedLimit: number
  totalCollateralAvailable: number
  totalAnalyzedProperties: number
  totalProperties: number
  compatibleCount: number
  reviewCount: number
  averageNetMargin: number
}

export interface CreditLimitPortfolioResult {
  success: boolean
  error?: string
  isFinancialModuleDisabledForOrg: boolean
  kpis: CreditLimitPortfolioKPIs
  properties: CreditLimitPropertyItem[]
  branches: { id: string; name: string }[]
}

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
      filters?.branchId && filters.branchId !== 'TODOS' ? filters.branchId : undefined
    const search = filters?.search?.trim()

    // Consulta de propriedades com ativos e vínculos
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
          acc + (Number(cur.quantity || 0) * Number(cur.unitValue || 0)),
        0
      )
      const livestockValue = (prop.livestockList || []).reduce(
        (acc: number, cur: any) =>
          acc + (Number(cur.quantity || 0) * Number(cur.unitValue || 0)),
        0
      )

      const totalAssets = landValue + machineryValue + improvementsValue + livestockValue

      // Margens de Garantia Aceitas (MCR)
      const realEstateCollateral = (landValue + improvementsValue) * 0.65
      const pledgeCollateral = (machineryValue + livestockValue) * 0.5
      const totalCollateralLimit = realEstateCollateral + pledgeCollateral

      // Fluxo Financeiro e Capacidade de Pagamento
      const effectiveAgroRevenue = Number(possessionData.effectiveAgroRevenue) || 0
      const projectedAgroRevenue = Number(possessionData.projectedAgroRevenue) || 0
      const otherRevenues = Number(possessionData.otherRevenues) || 0
      const operationalExpenses = Number(possessionData.operationalExpenses) || 0
      const existingDebtService = Number(possessionData.existingDebtService) || 0
      const familyLivingCosts = Number(possessionData.familyLivingCosts) || 0

      const totalInflows = effectiveAgroRevenue + otherRevenues
      const totalOutflows = operationalExpenses + existingDebtService + familyLivingCosts
      const netMargin = totalInflows - totalOutflows

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

export interface CreditSimulationSaveParams {
  requestedAmount: number
  creditLineCode: string
  creditLimitPurpose: string
  creditLimitTargetBank: string
  termMonths: number
  graceMonths: number
  interestRateAnnual: number
  amortizationSystem: 'PRICE' | 'SAC'
  notes?: string
}

export interface PropertySimulationData {
  property: {
    id: string
    name: string
    propertyName: string | null
    city: string | null
    state: string | null
    registrationNumber: string | null
    car: string | null
    ccir: string | null
    itr: string | null
    totalArea: number
    vtnPerHectare: number
    landValue: number
    branchId: string
    branchName: string
  }
  producer: {
    id: string
    name: string
    document: string
    type: string
    spouseName?: string | null
    spouseCpf?: string | null
    marriageRegime?: string | null
    profession?: string | null
    phone?: string | null
  }
  collateral: {
    landValue: number
    improvementsValue: number
    machineryValue: number
    livestockValue: number
    ruralAssetsTotal: number
    urbanTotal: number
    vehiclesTotal: number
    totalAssets: number
    acceptableCollateral: number
    urbanProperties: any[]
    vehicles: any[]
  }
  cashFlow: {
    effectiveAgroRevenue: number
    projectedAgroRevenue: number
    otherRevenues: number
    operationalExpenses: number
    familyLivingCosts: number
    existingDebtService: number
    netMargin: number
    paymentCapacity: number
    customAgroRevenues: any[]
    customExpenses: any[]
  }
  simulationParams: {
    creditLineCode: string
    creditLimitPurpose: string
    creditLimitTargetBank: string
    requestedAmount: number
    termMonths: number
    graceMonths: number
    interestRateAnnual: number
    amortizationSystem: 'PRICE' | 'SAC'
  }
}

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

export async function getPropertySimulationData(
  propertyId: string
): Promise<{ success: boolean; data?: PropertySimulationData; error?: string }> {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) return { success: false, error: 'Usuário não autenticado' }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        branch: { select: { id: true, name: true, organizationId: true } },
        producers: {
          include: {
            producer: true,
          },
        },
        machineries: true,
        improvementsList: true,
        livestockList: true,
        creditAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!property) {
      return { success: false, error: 'Propriedade não encontrada' }
    }

    const primaryProducer = property.producers[0]?.producer
    if (!primaryProducer) {
      return { success: false, error: 'Propriedade não possui produtor vinculado' }
    }

    const urbanProperties = await prisma.urbanProperty.findMany({
      where: { producerId: primaryProducer.id },
    })

    const vehicles = await prisma.vehicle.findMany({
      where: { producerId: primaryProducer.id },
    })

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
      (acc, i) => acc + (Number(i.quantity || 0) * Number(i.unitValue || 0)),
      0
    )
    const livestockValue = property.livestockList.reduce(
      (acc, l) => acc + (Number(l.quantity || 0) * Number(l.unitValue || 0)),
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
        acc + (u.hasLien ? 0 : (Number(u.marketValue) || 0) * 0.5),
      0
    )
    const vehiclesAcceptable = vehicleList.reduce(
      (acc: number, v: any) =>
        acc + (v.hasLien ? 0 : (Number(v.declaredValue) || 0) * 0.4),
      0
    )

    const acceptableCollateral =
      (landValue + improvementsValue) * 0.65 +
      (machineryValue + livestockValue) * 0.5 +
      urbanAcceptable +
      vehiclesAcceptable

    const effectiveAgroRevenue = Number(poss.effectiveAgroRevenue) || 0
    const projectedAgroRevenue = Number(poss.projectedAgroRevenue) || 0
    const otherRevenues = Number(poss.otherRevenues) || 0
    const operationalExpenses = Number(poss.operationalExpenses) || 0
    const familyLivingCosts = Number(poss.familyLivingCosts) || 0
    const existingDebtService = Number(poss.existingDebtService) || 0

    const baseAgro = projectedAgroRevenue > 0 ? projectedAgroRevenue : effectiveAgroRevenue
    const totalInflows = baseAgro + otherRevenues
    const totalOutflows = operationalExpenses + familyLivingCosts + existingDebtService
    const netMargin = totalInflows - totalOutflows
    const netOperational = Math.max(0, totalInflows - operationalExpenses)
    const paymentCapacity = netOperational - (familyLivingCosts + existingDebtService)

    // Parâmetros de simulação priorizando análise mais recente ou possessionData
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
      requestedAmount: latestAnalysis
        ? Number(latestAnalysis.requestedAmount)
        : Number(poss.creditLimitRequested) || 250000,
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
          totalArea,
          vtnPerHectare,
          landValue,
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
          phone: primaryProducer.phone,
        },
        collateral: {
          landValue,
          improvementsValue,
          machineryValue,
          livestockValue,
          ruralAssetsTotal,
          urbanTotal,
          vehiclesTotal,
          totalAssets,
          acceptableCollateral,
          urbanProperties: urbanList,
          vehicles: vehicleList,
        },
        cashFlow: {
          effectiveAgroRevenue,
          projectedAgroRevenue,
          otherRevenues,
          operationalExpenses,
          familyLivingCosts,
          existingDebtService,
          netMargin,
          paymentCapacity,
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

export async function saveCreditLimitSimulation(
  propertyId: string,
  params: CreditSimulationSaveParams
): Promise<{ success: boolean; error?: string; analysisId?: string }> {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) return { success: false, error: 'Usuário não autenticado' }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        producers: { include: { producer: true } },
        machineries: true,
        improvementsList: true,
        livestockList: true,
      },
    })
    if (!property) return { success: false, error: 'Propriedade não encontrada' }

    const primaryProducer = property.producers[0]?.producer
    if (!primaryProducer) return { success: false, error: 'Produtor não vinculado' }

    const poss = (property.possessionData as any) || {}

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
    const totalArea = Number(property.totalArea) || 0
    const vtnPerHectare = Number(poss.vtnPerHectare) || 0
    const landValue = totalArea * vtnPerHectare
    const improvementsValue = property.improvementsList.reduce(
      (sum, i) => sum + (Number(i.quantity || 0) * Number(i.unitValue || 0)),
      0
    )
    const machineryValue = property.machineries.reduce(
      (sum, m) => sum + (Number(m.value) || 0),
      0
    )
    const livestockValue = property.livestockList.reduce(
      (sum, l) => sum + (Number(l.quantity || 0) * Number(l.unitValue || 0)),
      0
    )

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
      effectiveAgroRevenue: Number(poss.effectiveAgroRevenue) || 0,
      projectedAgroRevenue: Number(poss.projectedAgroRevenue) || 0,
      nonAgroRevenue: Number(poss.otherRevenues) || 0,
      productionCosts: Number(poss.operationalExpenses) || 0,
      familyLivingExpenses: Number(poss.familyLivingCosts) || 0,
      existingDebtService: Number(poss.existingDebtService) || 0,
      landValue,
      improvementsValue,
      machineryValue,
      livestockValue,
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

    if (!property) return { success: false, error: 'Propriedade não encontrada' }

    const producer = property.producers[0]?.producer
    if (!producer) {
      return { success: false, error: 'Produtor não vinculado à propriedade' }
    }

    const urbanProperties = await prisma.urbanProperty.findMany({
      where: { producerId: producer.id },
    })
    const vehicles = await prisma.vehicle.findMany({
      where: { producerId: producer.id },
    })

    const poss = (property.possessionData as any) || {}
    const latestAnalysis = property.creditAnalyses[0]

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
      urbanProperties:
        urbanProperties.length > 0
          ? urbanProperties
          : poss.urbanProperties || [],
      vehicles:
        vehicles.length > 0 ? vehicles : poss.vehicles || [],
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
        accessRoute: poss.accessRoute || undefined,
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

