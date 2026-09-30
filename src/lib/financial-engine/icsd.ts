import {
  AgroRevenueInput,
  NonAgroRevenueInput,
  ExpenseInput,
  IcsdResult,
  IcsdClassification
} from './types'

/**
 * Nota de corte regulatória e prudencial das cooperativas e bancos de fomento (MCR).
 * Operações com ICSD inferior a 1,20 representam risco de inadimplência inaceitável.
 */
export const DEFAULT_ICSD_THRESHOLD = 1.20
export const COMFORTABLE_ICSD_THRESHOLD = 1.30

/**
 * Calcula a Capacidade de Pagamento (CP) e o Índice de Cobertura do Serviço da Dívida (ICSD),
 * gerando a classificação bancária e o parecer técnico fundamentado.
 *
 * @param agroRevenues Lista de receitas agrícolas e pecuárias
 * @param nonAgroRevenues Lista de receitas não-agropecuárias comprovadas
 * @param expenses Lista de despesas familiares, operacionais e passivos existentes
 * @param annualDebtService Parcela anual de referência do serviço da dívida (R$)
 * @param icsdThreshold Nota de corte mínima (padrão 1.20)
 */
export function calculatePaymentCapacityAndIcsd(
  agroRevenues: AgroRevenueInput[],
  nonAgroRevenues: NonAgroRevenueInput[] = [],
  expenses: ExpenseInput[] = [],
  annualDebtService: number,
  icsdThreshold: number = DEFAULT_ICSD_THRESHOLD
): IcsdResult {
  // 1. Receitas Agropecuárias
  let grossAgroRevenue = 0
  let totalProductionCosts = 0

  for (const rev of agroRevenues) {
    const qty = Number(rev.quantity) || 0
    const price = Number(rev.unitPrice) || 0
    const gross = Math.round(qty * price * 100) / 100
    const cost = Number(rev.productionCostTotal) || 0

    grossAgroRevenue += gross
    totalProductionCosts += cost
  }

  const netAgroRevenue = Math.max(0, grossAgroRevenue - totalProductionCosts)

  // 2. Receitas Não-Agropecuárias
  const nonAgroRevenueTotal = nonAgroRevenues.reduce((acc, cur) => {
    return acc + (Number(cur.annualAmount) || 0)
  }, 0)

  const totalGrossInflows = grossAgroRevenue + nonAgroRevenueTotal
  const totalNetInflows = netAgroRevenue + nonAgroRevenueTotal

  // 3. Despesas Gerais e Passivos Vigentes
  const totalExpenses = expenses.reduce((acc, cur) => {
    return acc + (Number(cur.annualAmount) || 0)
  }, 0)

  // 4. Capacidade de Pagamento (CP) Líquida
  const paymentCapacity = Math.round((totalNetInflows - totalExpenses) * 100) / 100

  // 5. Cálculo do ICSD
  const debtService = Math.max(0, Number(annualDebtService) || 0)
  let icsdValue = 0

  if (debtService > 0 && paymentCapacity > 0) {
    icsdValue = Math.round((paymentCapacity / debtService) * 100) / 100
  }

  // 6. Classificação e Parecer de Risco
  let classification: IcsdClassification
  let isApproved = false
  let opinionText = ''

  if (paymentCapacity <= 0) {
    classification = 'REPROVADO'
    isApproved = false
    opinionText = `Proposta inviável. A capacidade de pagamento calculada é deficitária ou nula (R$ ${paymentCapacity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}), indicando que os custos operacionais e passivos existentes superam as receitas líquidas projetadas.`
  } else if (icsdValue >= COMFORTABLE_ICSD_THRESHOLD) {
    classification = 'APROVADO_CONFORTAVEL'
    isApproved = true
    opinionText = `Proposta aprovada com margem confortável. O ICSD apurado de ${icsdValue.toFixed(2)} supera com folga a exigência mínima de ${icsdThreshold.toFixed(2)}, demonstrando capacidade robusta de honrar o serviço da dívida anual de R$ ${debtService.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} com sobra operacional.`
  } else if (icsdValue >= icsdThreshold) {
    classification = 'APROVADO_ALERTA'
    isApproved = true
    opinionText = `Proposta aprovável no limite prudencial. O ICSD apurado de ${icsdValue.toFixed(2)} atende à nota de corte do MCR (${icsdThreshold.toFixed(2)}), porém situa-se em faixa de atenção. Recomenda-se reforço de garantias reais ou análise de alongamento de prazo para mitigar o encargo anual.`
  } else {
    classification = 'REPROVADO'
    isApproved = false
    opinionText = `Proposta reprovada por insuficiência de cobertura. O ICSD apurado de ${icsdValue.toFixed(2)} ficou abaixo da nota de corte regulamentar de ${icsdThreshold.toFixed(2)}. O fluxo de caixa disponível não oferece a margem de segurança mínima exigida pelas normas do crédito rural.`
  }

  return {
    grossAgroRevenue: Math.round(grossAgroRevenue * 100) / 100,
    totalProductionCosts: Math.round(totalProductionCosts * 100) / 100,
    netAgroRevenue: Math.round(netAgroRevenue * 100) / 100,
    nonAgroRevenueTotal: Math.round(nonAgroRevenueTotal * 100) / 100,
    totalGrossInflows: Math.round(totalGrossInflows * 100) / 100,
    totalNetInflows: Math.round(totalNetInflows * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    paymentCapacity,
    annualDebtService: debtService,
    icsdValue,
    icsdThreshold,
    classification,
    isApproved,
    opinionText
  }
}
