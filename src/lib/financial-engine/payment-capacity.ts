/**
 * Módulo puro de cálculo da Capacidade de Pagamento (CP).
 * Formalizado e unificado conforme a Cláusula 2.2 do Termo Aditivo Nº 003:
 *
 * Receita Líquida Agro = (Receita Efetiva + Receita Projetada) - Custos Operacionais
 * CP = (Receita Líquida Agro + Rendas Não-Agro) - (Custo de Vida Familiar + Passivos Bancários)
 *
 * Utilizado como Fonte Única da Verdade (Single Source of Truth) entre CRM,
 * Simulador de Limite e Emissão do Dossiê Técnico Oficial (PDF).
 */

export interface PaymentCapacityCustomAgroRevenue {
  quantity?: number | string | null
  unitPrice?: number | string | null
  productionCostTotal?: number | string | null
  realizationType?: string | null
  description?: string | null
  activityType?: string | null
  unit?: string | null
}

export interface PaymentCapacityCustomExpense {
  category?: string | null
  description?: string | null
  annualAmount?: number | string | null
  installmentValue?: number | string | null
  isContinuingLiability?: boolean | null
}

export interface PaymentCapacityInput {
  effectiveAgroRevenue?: number | string | null
  projectedAgroRevenue?: number | string | null
  operationalExpenses?: number | string | null
  nonAgroRevenues?: number | string | null
  familyLivingCosts?: number | string | null
  existingDebtService?: number | string | null
  customAgroRevenues?: PaymentCapacityCustomAgroRevenue[] | null
  customExpenses?: PaymentCapacityCustomExpense[] | null
}

export interface PaymentCapacityResult {
  effectiveAgroRevenue: number
  projectedAgroRevenue: number
  grossAgroRevenue: number
  operationalExpenses: number
  netAgroRevenue: number
  nonAgroRevenues: number
  totalGrossInflows: number
  totalNetInflows: number
  familyLivingCosts: number
  existingDebtService: number
  totalLivingAndDebtExpenses: number
  totalExpenses: number
  paymentCapacity: number
  isPositive: boolean
}

/**
 * Função matemática pura que consolida receitas, custos operacionais e encargos familiares/passivos
 * para apurar a Capacidade de Pagamento Líquida (CP) estritamente segundo o Aditivo 003.
 */
export function calculatePaymentCapacity(input: PaymentCapacityInput): PaymentCapacityResult {
  let effectiveAgro = Math.max(0, Number(input.effectiveAgroRevenue) || 0)
  let projectedAgro = Math.max(0, Number(input.projectedAgroRevenue) || 0)
  let operationalExp = Math.max(0, Number(input.operationalExpenses) || 0)
  const nonAgro = Math.max(0, Number(input.nonAgroRevenues) || 0)
  let familyCosts = Math.max(0, Number(input.familyLivingCosts) || 0)
  let debtService = Math.max(0, Number(input.existingDebtService) || 0)

  // 1. Processar itens discriminados de receitas agropecuárias (se houver)
  if (input.customAgroRevenues && input.customAgroRevenues.length > 0) {
    let customEffectiveSum = 0
    let customProjectedSum = 0
    let customCostsSum = 0

    for (const r of input.customAgroRevenues) {
      const qty = Number(r.quantity) || 0
      const price = Number(r.unitPrice) || 0
      const gross = Math.round(qty * price * 100) / 100
      const cost = Math.max(0, Number(r.productionCostTotal) || 0)

      customCostsSum += cost
      if (r.realizationType === 'EFETIVA_HISTORICA') {
        customEffectiveSum += gross
      } else {
        customProjectedSum += gross
      }
    }

    if (customEffectiveSum > 0 || customProjectedSum > 0) {
      effectiveAgro = customEffectiveSum
      projectedAgro = customProjectedSum
    }
    if (customCostsSum > 0) {
      operationalExp = customCostsSum
    }
  }

  // 2. Processar despesas customizadas detalhadas (se houver)
  if (input.customExpenses && input.customExpenses.length > 0) {
    let customFamilySum = 0
    let customDebtSum = 0
    let customOperationalSum = 0

    for (const e of input.customExpenses) {
      const amt = Math.max(0, Number(e.annualAmount) || 0)
      const cat = (e.category || '').toUpperCase()

      if (cat.includes('MANUTENCAO') || cat.includes('FAMILIAR')) {
        customFamilySum += amt
      } else if (cat.includes('PASSIVO') || cat.includes('BANCARIO') || cat.includes('DIVIDA')) {
        customDebtSum += amt
      } else if (cat.includes('CUSTEIO') || cat.includes('OPERACIONAL') || cat.includes('PRODUCAO')) {
        customOperationalSum += amt
      }
    }

    if (customFamilySum > 0) familyCosts = customFamilySum
    if (customDebtSum > 0) debtService = customDebtSum
    if (customOperationalSum > 0 && operationalExp === 0) operationalExp = customOperationalSum
  }

  // 3. Aplicação rigorosa da fórmula contratual (Cláusula 2.2 do Aditivo 003):
  // Receita Bruta Agro = Receita Efetiva + Receita Projetada
  const grossAgroRevenue = Math.round((effectiveAgro + projectedAgro) * 100) / 100

  // Receita Líquida Agro = (Receita Efetiva + Receita Projetada) - Custos Operacionais
  const netAgroRevenue = Math.max(0, Math.round((grossAgroRevenue - operationalExp) * 100) / 100)

  // Total Entradas Brutas
  const totalGrossInflows = Math.round((grossAgroRevenue + nonAgro) * 100) / 100

  // Total Receitas Líquidas (Entradas Líquidas = Receita Líquida Agro + Rendas Não-Agro)
  const totalNetInflows = Math.round((netAgroRevenue + nonAgro) * 100) / 100

  // Encargos Familiares e Passivos Vigentes
  const totalLivingAndDebtExpenses = Math.round((familyCosts + debtService) * 100) / 100

  // Despesas Totais Consolidadas (Custos de Produção + Custo Familiar + Dívidas)
  const totalExpenses = Math.round((operationalExp + totalLivingAndDebtExpenses) * 100) / 100

  // Capacidade de Pagamento Líquida (CP)
  // CP = (Receita Líquida Agro + Rendas Não-Agro) - (Custo de Vida Familiar + Passivos Bancários)
  const paymentCapacity = Math.round((totalNetInflows - totalLivingAndDebtExpenses) * 100) / 100

  return {
    effectiveAgroRevenue: effectiveAgro,
    projectedAgroRevenue: projectedAgro,
    grossAgroRevenue,
    operationalExpenses: operationalExp,
    netAgroRevenue,
    nonAgroRevenues: nonAgro,
    totalGrossInflows,
    totalNetInflows,
    familyLivingCosts: familyCosts,
    existingDebtService: debtService,
    totalLivingAndDebtExpenses,
    totalExpenses,
    paymentCapacity,
    isPositive: paymentCapacity > 0,
  }
}
