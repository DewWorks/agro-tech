import {
  AgroRevenueInput,
  NonAgroRevenueInput,
  ExpenseInput,
  IcsdResult,
  IcsdClassification
} from './types'
import { calculatePaymentCapacity } from './payment-capacity'

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
 * Utiliza o motor matemático centralizado calculatePaymentCapacity (Cláusula 2.2 do Aditivo 003).
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
  const nonAgroRevenueTotal = nonAgroRevenues.reduce((acc, cur) => {
    return acc + (Number(cur.annualAmount) || 0)
  }, 0)

  // Executa o cálculo unificado da Capacidade de Pagamento (Cláusula 2.2)
  const cpResult = calculatePaymentCapacity({
    nonAgroRevenues: nonAgroRevenueTotal,
    customAgroRevenues: agroRevenues,
    customExpenses: expenses,
  })

  const {
    grossAgroRevenue,
    operationalExpenses: totalProductionCosts,
    netAgroRevenue,
    totalGrossInflows,
    totalNetInflows,
    totalLivingAndDebtExpenses,
    totalExpenses,
    paymentCapacity
  } = cpResult

  // Cálculo do ICSD
  const debtService = Math.max(0, Number(annualDebtService) || 0)
  let icsdValue = 0

  if (debtService > 0 && paymentCapacity > 0) {
    icsdValue = Math.round((paymentCapacity / debtService) * 100) / 100
  }

  // Classificação e Parecer de Risco
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
    grossAgroRevenue,
    totalProductionCosts,
    netAgroRevenue,
    nonAgroRevenueTotal,
    totalGrossInflows,
    totalNetInflows,
    totalExpenses: totalLivingAndDebtExpenses,
    paymentCapacity,
    annualDebtService: debtService,
    icsdValue,
    icsdThreshold,
    classification,
    isApproved,
    opinionText
  }
}
