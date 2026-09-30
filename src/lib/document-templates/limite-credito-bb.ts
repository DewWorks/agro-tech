import { formatCPF, formatCNPJ } from '@/lib/validations'
import { getDocumentTypeAndLabel } from '@/lib/utils/masks'
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
} from '@/lib/financial-engine'
import { CREDIT_LINES_CATALOG } from '@/constants/credit-lines'

import { documentStyles } from './limite-credito-bb/styles'
import { getBankNameLabel } from './limite-credito-bb/formatters'
import {
  renderPageHeader,
  renderPageFooter,
  renderPropertyIdentificationSection,
  renderMcrClassificationSection,
} from './limite-credito-bb/sections/HeaderSection'
import {
  renderProponentSection,
  renderTechnicalResponsibilitySection,
} from './limite-credito-bb/sections/ProponentSection'
import { renderPropertyAndCollateralSection } from './limite-credito-bb/sections/PropertyAndCollateralSection'
import { renderCashFlowSection } from './limite-credito-bb/sections/CashFlowSection'
import { renderAmortizationAndIcsdSection } from './limite-credito-bb/sections/AmortizationAndIcsdSection'
import { renderSignaturesSection } from './limite-credito-bb/sections/SignaturesSection'

export interface LimiteCreditoDocumentData {
  producer: {
    name: string
    document: string
    type: 'PF' | 'PJ'
    spouseName?: string
    spouseCpf?: string
    spouseRg?: string
    marriageRegime?: string
    spouseNationality?: string
    spouseEducationLevel?: string
    representativeCpf?: string
    representativeName?: string
    phone?: string
    civilStatus?: string
    profession?: string
    street?: string
    city?: string
    state?: string
  }
  property: {
    name: string
    registrationNumber?: string
    registryOffice?: string
    comarca?: string
    car?: string
    ccir?: string
    itr?: string
    city?: string
    state?: string
    totalAreaHa?: number
    openAreaHa?: number
    preservationAreaHa?: number
    pastureAreaHa?: number
    agricultureAreaHa?: number
    accessRoute?: string
    machineries?: Array<{
      specification?: string
      brand?: string
      model?: string
      year?: number
      value?: number
      hasLien?: boolean
      lienInstitution?: string
    }>
    improvementsList?: Array<{
      specification?: string
      unit?: string
      quantity?: number
      unitValue?: number
      conservationState?: string
      observation?: string
    }>
    livestockData?: {
      totalCattle?: number
      brandRegistrationAdapec?: string
      brandDescription?: string
      brandLocation?: string
      categories?: Record<string, number>
    }
    livestockList?: Array<{
      species?: string
      category?: string
      categoryBB?: string
      purposeBB?: string
      breed?: string
      quantity: number
      ageMonths?: number | null
      avgWeightKg?: number | null
      unitValue?: number | null
      brandingType?: string | null
      brandingLocation?: string | null
      observation?: string | null
    }>
  }
  organization: {
    name: string
    cnpj?: string
    ownerName?: string
  }
  branch?: {
    name: string
  }
  options?: {
    responsibleName?: string
    creaNumber?: string
    artNumber?: string
    estimatedLandValuePerHa?: number
    estimatedCattleHeadValue?: number
    improvementsValue?: number
    machineryValue?: number
    annualRevenue?: number
    annualExpenses?: number
    existingDebts?: number
    hasFinancialModule?: boolean
    livestockItems?: Array<any>
    creditLimitRequested?: number
    creditLimitPurpose?: string
    creditLimitTargetBank?: string
    creditLimitTermMonths?: number
    gracePeriodMonths?: number
    interestRateAnnual?: number
    amortizationSystem?: 'PRICE' | 'SAC'
    creditLineCode?: string
    urbanProperties?: Array<any>
    vehicles?: Array<any>
    customAgroRevenues?: Array<any>
    customExpenses?: Array<any>
    effectiveAgroRevenue?: number
    projectedAgroRevenue?: number
    familyLivingCosts?: number
    operationalExpenses?: number
    existingDebtService?: number
    [key: string]: any
  }
}

export function generateLimiteCreditoBbHtml(data: LimiteCreditoDocumentData): string {
  const p = data.producer
  const prop = data.property
  const opt = data.options || {}

  const orgName = data.organization?.name || 'LN Consultoria e Projetos'
  const orgCnpj = data.organization?.cnpj ? formatCNPJ(data.organization.cnpj) : ''
  const orgOwnerName = data.organization?.ownerName || opt.responsibleName || 'Lindomar Pereira Cardoso'
  const crea = opt.creaNumber || 'CREA-TO / Visto'
  const art = opt.artNumber || 'ART-2026/89412'

  const { label: docLabel, formatted: docFormatted, isCnpj } = getDocumentTypeAndLabel(p.document, p.type)
  const spouseDocFormatted = p.spouseCpf ? formatCPF(p.spouseCpf) : ''
  const repCpfFormatted = p.representativeCpf ? formatCPF(p.representativeCpf) : ''

  const pastArea = prop.pastureAreaHa || 0
  const agricArea = prop.agricultureAreaHa || 0
  const resArea = prop.preservationAreaHa || 0
  const totalArea = prop.totalAreaHa && prop.totalAreaHa > 0 ? prop.totalAreaHa : pastArea + agricArea + resArea

  const landValuePerHa = opt.estimatedLandValuePerHa && opt.estimatedLandValuePerHa > 0 ? opt.estimatedLandValuePerHa : 0
  const totalLandValue = totalArea * landValuePerHa

  const livestockItems: any[] = prop.livestockList || opt.livestockItems || []
  const hasLivestockItems = livestockItems.length > 0
  const totalCattleFromList = livestockItems.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 0), 0)
  const totalCattle = hasLivestockItems ? totalCattleFromList : prop.livestockData?.totalCattle || 0
  const cattleHeadValue = opt.estimatedCattleHeadValue && opt.estimatedCattleHeadValue > 0 ? opt.estimatedCattleHeadValue : 0

  const totalValueFromList = livestockItems.reduce((acc: number, item: any) => {
    const qty = Number(item.quantity) || 0
    const uVal = Number(item.unitValue) || cattleHeadValue || 0
    return acc + qty * uVal
  }, 0)

  const cattleEstimatedValue = hasLivestockItems
    ? totalValueFromList
    : totalCattle > 0 && cattleHeadValue > 0
    ? totalCattle * cattleHeadValue
    : 0

  const improvementsList = prop.improvementsList || []
  const computedImprovementsValue = improvementsList.length > 0
    ? improvementsList.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitValue) || 0), 0)
    : 0
  const improvementsValue = opt.improvementsValue !== undefined && opt.improvementsValue > 0
    ? opt.improvementsValue
    : computedImprovementsValue

  const machineriesList = prop.machineries || []
  const computedMachineryValue = machineriesList.length > 0
    ? machineriesList.reduce((acc, m) => acc + (Number(m.value) || 0), 0)
    : 0
  const machineryValue = opt.machineryValue !== undefined && opt.machineryValue > 0
    ? opt.machineryValue
    : computedMachineryValue

  const urbanProperties = opt.urbanProperties || []
  const vehicles = opt.vehicles || []
  const customAgroRevenues = opt.customAgroRevenues || []
  const customExpenses = opt.customExpenses || []

  // Parâmetros de Crédito e Enquadramento
  const creditLineCode = opt.creditLineCode || 'PRONAMP_CUSTEIO'
  const lineDef = CREDIT_LINES_CATALOG.find((l) => l.code === creditLineCode) || CREDIT_LINES_CATALOG[0]
  const targetBank = opt.creditLimitTargetBank || 'BANCO_DO_BRASIL'
  const creditLimitRequested = opt.creditLimitRequested !== undefined && opt.creditLimitRequested > 0
    ? Number(opt.creditLimitRequested)
    : 250000
  const termMonths = opt.creditLimitTermMonths || lineDef.defaultTermMonths || 12
  const graceMonths = opt.gracePeriodMonths ?? lineDef.defaultGraceMonths ?? 0
  const interestRate = opt.interestRateAnnual ?? lineDef.defaultInterestRate ?? 8.0
  const system = (opt.amortizationSystem || (lineDef.axis === CreditLineAxis.INVESTIMENTO ? 'SAC' : 'PRICE')) as AmortizationSystem

  // Rendas e despesas consolidadas
  const effectiveAgroRev = opt.effectiveAgroRevenue || opt.annualRevenue || 0
  const projectedAgroRev = opt.projectedAgroRevenue || 0
  const nonAgroRev = opt.otherRevenues || 0
  const operationalExp = opt.operationalExpenses || opt.annualExpenses || 0
  const existingDebt = opt.existingDebtService || opt.existingDebts || 0
  const familyCosts = opt.familyLivingCosts || 0

  // Executa o Motor Financeiro Completo
  const engineResult = calculateFullCreditRiskAnalysis({
    requestedAmount: creditLimitRequested,
    termMonths,
    graceMonths,
    annualInterestRate: interestRate,
    amortizationSystem: system,
    creditLineAxis: lineDef.axis,
    creditLineCode: lineDef.code,
    creditLineName: lineDef.name,
    agroRevenues: customAgroRevenues.length > 0
      ? customAgroRevenues.map((r: any) => ({
          activityType: (r.activityType as AgroActivityType) || AgroActivityType.AGRICOLA_GRAOS,
          realizationType: (r.realizationType as RevenueRealizationType) || RevenueRealizationType.PROJETADA_SAFRA,
          description: r.description || 'Cultura Agrícola',
          quantity: Number(r.quantity) || 1,
          unit: r.unit || 'sc',
          unitPrice: Number(r.unitPrice) || 0,
          productionCostTotal: Number(r.productionCostTotal) || 0,
        }))
      : [
          ...(effectiveAgroRev > 0 ? [{
            activityType: AgroActivityType.AGRICOLA_GRAOS,
            realizationType: RevenueRealizationType.EFETIVA_HISTORICA,
            description: 'Receita Agropecuária Safra Anterior (Efetiva)',
            quantity: 1,
            unit: 'un',
            unitPrice: effectiveAgroRev,
            productionCostTotal: 0,
          }] : []),
          ...(projectedAgroRev > 0 ? [{
            activityType: AgroActivityType.AGRICOLA_GRAOS,
            realizationType: RevenueRealizationType.PROJETADA_SAFRA,
            description: 'Receita Agropecuária Safra Vigente (Projetada)',
            quantity: 1,
            unit: 'un',
            unitPrice: projectedAgroRev,
            productionCostTotal: operationalExp,
          }] : []),
        ],
    nonAgroRevenues: nonAgroRev > 0 ? [{ description: 'Outras Receitas Comprovadas', annualAmount: nonAgroRev }] : [],
    expenses: customExpenses.length > 0
      ? customExpenses.map((e: any) => ({
          category: (e.category as ExpenseCategory) || ExpenseCategory.CUSTEIO_OPERACIONAL,
          description: e.description || 'Despesa',
          annualAmount: Number(e.annualAmount) || 0,
          installmentValue: Number(e.installmentValue) || null,
          isContinuingLiability: e.isContinuingLiability ?? true,
        }))
      : [
          ...(operationalExp > 0 ? [{ category: ExpenseCategory.CUSTEIO_OPERACIONAL, description: 'Custos de Produção e Custeio Operacional', annualAmount: operationalExp }] : []),
          ...(familyCosts > 0 ? [{ category: ExpenseCategory.MANUTENCAO_FAMILIAR, description: 'Manutenção Familiar Anual', annualAmount: familyCosts }] : []),
          ...(existingDebt > 0 ? [{ category: ExpenseCategory.PASSIVO_EXISTENTE_BANCARIO, description: 'Serviço da Dívida e Passivo Bancário Existente', annualAmount: existingDebt }] : []),
        ],
    ruralCollateral: {
      landValue: totalLandValue,
      improvementsValue,
      machineryValue,
      livestockValue: cattleEstimatedValue,
    },
    urbanProperties: urbanProperties.map((u: any, i: number) => ({
      description: u.description || `Imóvel Urbano ${i + 1}`,
      propertyType: (u.propertyType as UrbanPropertyType) || UrbanPropertyType.RESIDENCIAL,
      marketValue: Number(u.marketValue) || 0,
      hasLien: Boolean(u.hasLien),
      liquidityRating: (u.liquidityRating as LiquidityRating) || LiquidityRating.MEDIA,
    })),
    vehicles: vehicles.map((v: any, i: number) => ({
      brand: v.brand || 'Veículo',
      model: v.model || `Utilitário ${i + 1}`,
      vehicleType: (v.vehicleType as VehicleType) || VehicleType.CAMINHONETE,
      declaredValue: Number(v.declaredValue) || 0,
      hasLien: Boolean(v.hasLien),
    })),
  })

  return `
  ${documentStyles}

  <!-- =================================================================== -->
  <!-- PÁGINA 1: FOLHA DE ROSTO E ENQUADRAMENTO TÉCNICO NORMATIVO (MCR)    -->
  <!-- =================================================================== -->
  <div class="dossie-page">
    ${renderPageHeader(
      'Ficha Cadastral e Levantamento Patrimonial',
      `Dossiê para Proposta de Limite de Crédito Rural • ${getBankNameLabel(targetBank)}`,
      1,
      4,
      'Enquadramento'
    )}

    ${renderProponentSection({
      p,
      isCnpj,
      docLabel,
      docFormatted,
      spouseDocFormatted,
      repCpfFormatted,
    })}

    ${renderPropertyIdentificationSection(prop)}

    ${renderTechnicalResponsibilitySection({
      orgName,
      orgCnpj,
      branchName: data.branch?.name,
      orgOwnerName,
      crea,
      art,
    })}

    ${renderMcrClassificationSection({
      lineDef,
      targetBank,
      creditLimitRequested,
      interestRate,
      termMonths,
      graceMonths,
      system,
      purpose: opt.creditLimitPurpose,
    })}

    ${renderPageFooter(orgName, 30)}
  </div>

  <div class="html2pdf__page-break" style="height: 0; page-break-after: always; break-after: page;"></div>

  ${renderPropertyAndCollateralSection({
    prop,
    totalArea,
    pastArea,
    agricArea,
    resArea,
    landValuePerHa,
    totalLandValue,
    improvementsValue,
    cattleEstimatedValue,
    totalCattle,
    livestockItems,
    hasLivestockItems,
    cattleHeadValue,
    urbanProperties,
    vehicles,
    engineResult,
    creditLimitRequested,
    orgName,
  })}

  <div class="html2pdf__page-break" style="height: 0; page-break-after: always; break-after: page;"></div>

  ${renderCashFlowSection({
    customAgroRevenues,
    effectiveAgroRev,
    projectedAgroRev,
    operationalExp,
    familyCosts,
    existingDebt,
    engineResult,
    orgName,
  })}

  <div class="html2pdf__page-break" style="height: 0; page-break-after: always; break-after: page;"></div>

  <!-- =================================================================== -->
  <!-- PÁGINA 4: SERVIÇO DA DÍVIDA, ÍNDICE ICSD & PARECER CONCLUSIVO       -->
  <!-- =================================================================== -->
  <div class="dossie-page">
    ${renderPageHeader(
      'Serviço da Dívida, ICSD e Parecer Técnico Conclusivo',
      'Cronograma de Amortização Bancária • Teste de Estresse Financeiro (Trava ≥ 1,20) • Assinaturas',
      4,
      4,
      'Parecer Conclusivo'
    )}

    ${renderAmortizationAndIcsdSection({
      system,
      interestRate,
      termMonths,
      graceMonths,
      engineResult,
    })}

    ${renderSignaturesSection({
      p,
      isCnpj,
      docLabel,
      docFormatted,
      spouseDocFormatted,
      orgOwnerName,
      orgName,
      crea,
      art,
    })}
  </div>
  `
}
