'use server'

import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'

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
