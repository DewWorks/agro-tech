'use client'

import { useEffect, useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { CREDIT_LINES_CATALOG } from '@/constants/credit-lines'
import {
  calculateFullCreditRiskAnalysis,
  AmortizationSystem,
  CreditLineAxis,
  AgroActivityType,
  RevenueRealizationType,
  ExpenseCategory,
  UrbanPropertyType,
  VehicleType,
} from '@/lib/financial-engine'

export function useFinancialSummaryCalculations(activeForm: UseFormReturn<any>) {
  const { watch, setValue } = activeForm

  // Observa os ativos dos Steps anteriores
  const totalArea = Number(watch('totalArea')) || 0
  const vtnPerHectare = Number(watch('vtnPerHectare')) || 0
  const machineries = watch('machineries') || []
  const improvements = watch('improvements') || []
  const livestocks = watch('livestocks') || []

  // Observa bens secundários e fluxos dinâmicos
  const urbanProperties = watch('urbanProperties') || []
  const vehicles = watch('vehicles') || []
  const customAgroRevenues = watch('customAgroRevenues') || []

  // Observa os inputs de fluxo financeiro
  const effectiveAgroRevenue = Number(watch('effectiveAgroRevenue')) || 0
  const projectedAgroRevenue = Number(watch('projectedAgroRevenue')) || 0
  const otherRevenues = Number(watch('otherRevenues')) || 0
  const operationalExpenses = Number(watch('operationalExpenses')) || 0
  const existingDebtService = Number(watch('existingDebtService')) || 0
  const familyLivingCosts = Number(watch('familyLivingCosts')) || 0

  // Observa parâmetros do Motor Financeiro (Aditivo 003)
  const creditLimitRequested = Number(watch('creditLimitRequested')) || 0
  const creditLimitPurpose = watch('creditLimitPurpose') || 'CUSTEIO_AGRICOLA'
  const creditLimitTargetBank = watch('creditLimitTargetBank') || 'BANCO_DO_BRASIL'
  const creditLimitTermMonths = Number(watch('creditLimitTermMonths')) || 12
  const amortizationSystem = (watch('amortizationSystem') || 'PRICE') as AmortizationSystem
  const creditLineCode = watch('creditLineCode') || 'PRONAMP_CUSTEIO'
  const interestRateAnnual = Number(watch('interestRateAnnual')) || 8.0
  const gracePeriodMonths = Number(watch('gracePeriodMonths')) || 0

  // Cálculos Automáticos dos Ativos Rurais
  const landValue = Math.round(totalArea * vtnPerHectare * 100) / 100

  const machineryValue = machineries.reduce(
    (acc: number, cur: any) => acc + (Number(cur.value) || 0),
    0
  )

  const improvementsValue = improvements.reduce(
    (acc: number, cur: any) => acc + (Number(cur.quantity || 0) * Number(cur.unitValue || 0)),
    0
  )

  const livestockValue = livestocks.reduce(
    (acc: number, cur: any) => acc + (Number(cur.quantity || 0) * Number(cur.unitValue || 0)),
    0
  )

  const ruralAssetsTotal = landValue + machineryValue + improvementsValue + livestockValue

  // Cálculos dos Bens Secundários (Urbanos e Veículos)
  const urbanTotal = urbanProperties.reduce(
    (acc: number, cur: any) => acc + (Number(cur.marketValue) || 0),
    0
  )
  const urbanAcceptable = urbanProperties.reduce(
    (acc: number, cur: any) => acc + (cur.hasLien ? 0 : (Number(cur.marketValue) || 0) * 0.5),
    0
  )

  const vehiclesTotal = vehicles.reduce(
    (acc: number, cur: any) => acc + (Number(cur.declaredValue) || 0),
    0
  )
  const vehiclesAcceptable = vehicles.reduce(
    (acc: number, cur: any) => acc + (cur.hasLien ? 0 : (Number(cur.declaredValue) || 0) * 0.4),
    0
  )

  const totalAssetsWithSecondary = ruralAssetsTotal + urbanTotal + vehiclesTotal

  const mcrAcceptableCollateral =
    (landValue + improvementsValue) * 0.65 +
    (machineryValue + livestockValue) * 0.5 +
    urbanAcceptable +
    vehiclesAcceptable

  // Atualiza campos computados no formulário
  useEffect(() => {
    setValue('computedLandValue', landValue)
    setValue('computedImprovementsValue', improvementsValue)
    setValue('computedMachineryValue', machineryValue)
    setValue('computedLivestockValue', livestockValue)
    setValue('computedTotalAssets', totalAssetsWithSecondary)
  }, [landValue, improvementsValue, machineryValue, livestockValue, totalAssetsWithSecondary, setValue])

  // Se o usuário preencher receitas detalhadas em customAgroRevenues, sincroniza
  useEffect(() => {
    if (customAgroRevenues.length > 0) {
      let sumEffective = 0
      let sumProjected = 0
      let sumCosts = 0

      for (const item of customAgroRevenues) {
        const gross = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
        const cost = Number(item.productionCostTotal) || 0
        sumCosts += cost
        if (item.realizationType === 'EFETIVA_HISTORICA') {
          sumEffective += gross
        } else {
          sumProjected += gross
        }
      }

      if (sumEffective > 0) setValue('effectiveAgroRevenue', sumEffective)
      if (sumProjected > 0) setValue('projectedAgroRevenue', sumProjected)
      if (sumCosts > 0 && operationalExpenses === 0) setValue('operationalExpenses', sumCosts)
    }
  }, [customAgroRevenues, operationalExpenses, setValue])

  // Formatação em Reais
  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  // Motor Matemático e Risco Bancário Executado em Tempo Real
  const riskAnalysis = useMemo(() => {
    if (creditLimitRequested <= 0) return null

    const agroRevs =
      customAgroRevenues.length > 0
        ? customAgroRevenues.map((r: any) => ({
            description: r.description || 'Cultura',
            activityType: (r.activityType || 'AGRICOLA_GRAOS') as AgroActivityType,
            realizationType: (r.realizationType || 'PROJETADA_SAFRA') as RevenueRealizationType,
            quantity: Number(r.quantity) || 0,
            unit: r.unit || 'sc',
            unitPrice: Number(r.unitPrice) || 0,
            productionCostTotal: Number(r.productionCostTotal) || 0,
          }))
        : [
            {
              description: 'Receita Operacional Consolidada',
              activityType: 'AGRICOLA_GRAOS' as AgroActivityType,
              realizationType: 'PROJETADA_SAFRA' as RevenueRealizationType,
              quantity: 1,
              unit: 'un',
              unitPrice: projectedAgroRevenue > 0 ? projectedAgroRevenue : effectiveAgroRevenue,
              productionCostTotal: operationalExpenses,
            },
          ]

    const selectedLine = CREDIT_LINES_CATALOG.find((l) => l.code === creditLineCode)
    const axis = selectedLine
      ? selectedLine.axis
      : creditLimitTermMonths <= 12
      ? CreditLineAxis.CUSTEIO
      : CreditLineAxis.INVESTIMENTO

    return calculateFullCreditRiskAnalysis({
      requestedAmount: creditLimitRequested,
      termMonths: creditLimitTermMonths,
      graceMonths: gracePeriodMonths,
      annualInterestRate: interestRateAnnual,
      amortizationSystem,
      creditLineAxis: axis,
      creditLineCode,
      creditLineName: selectedLine?.name || 'Linha Agro',
      agroRevenues: agroRevs,
      nonAgroRevenues: otherRevenues > 0 ? [{ description: 'Outras Rendas', annualAmount: otherRevenues }] : [],
      expenses: [
        {
          category: ExpenseCategory.CUSTEIO_OPERACIONAL,
          description: 'Custo Operacional',
          annualAmount: operationalExpenses,
        },
        {
          category: ExpenseCategory.MANUTENCAO_FAMILIAR,
          description: 'Manutenção Familiar',
          annualAmount: familyLivingCosts,
        },
        {
          category: ExpenseCategory.PASSIVO_EXISTENTE_BANCARIO,
          description: 'Endividamento Bancário Vigente',
          annualAmount: existingDebtService,
        },
      ],
      ruralCollateral: {
        landValue,
        improvementsValue,
        machineryValue,
        livestockValue,
      },
      urbanProperties: urbanProperties.map((u: any) => ({
        description: u.description || 'Imóvel Urbano',
        propertyType: (u.propertyType || 'RESIDENCIAL') as UrbanPropertyType,
        marketValue: Number(u.marketValue) || 0,
        hasLien: Boolean(u.hasLien),
        liquidityRating: u.liquidityRating || 'MEDIA',
      })),
      vehicles: vehicles.map((v: any) => ({
        brand: v.brand || '',
        model: v.model || '',
        vehicleType: (v.vehicleType || 'CAMINHONETE') as VehicleType,
        declaredValue: Number(v.declaredValue) || 0,
        hasLien: Boolean(v.hasLien),
      })),
    })
  }, [
    creditLimitRequested,
    creditLimitTermMonths,
    gracePeriodMonths,
    interestRateAnnual,
    amortizationSystem,
    creditLineCode,
    customAgroRevenues,
    projectedAgroRevenue,
    effectiveAgroRevenue,
    operationalExpenses,
    otherRevenues,
    familyLivingCosts,
    existingDebtService,
    landValue,
    improvementsValue,
    machineryValue,
    livestockValue,
    urbanProperties,
    vehicles,
  ])

  return {
    totalArea,
    machineriesCount: machineries.length,
    improvementsCount: improvements.length,
    livestocksCount: livestocks.length,
    landValue,
    machineryValue,
    improvementsValue,
    livestockValue,
    ruralAssetsTotal,
    urbanTotal,
    vehiclesTotal,
    totalAssetsWithSecondary,
    mcrAcceptableCollateral,
    creditLineCode,
    amortizationSystem,
    creditLimitPurpose,
    creditLimitTargetBank,
    riskAnalysis,
    formatBRL,
  }
}
