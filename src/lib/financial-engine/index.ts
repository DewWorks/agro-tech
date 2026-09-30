import {
  FinancialEngineInput,
  FinancialEngineResult
} from './types'
import { calculateAmortization } from './amortization'
import { calculatePaymentCapacityAndIcsd } from './icsd'
import { calculateCollateralAndLtv } from './ltv'
import { evaluateMcrCompliance } from './compliance'

export * from './types'
export * from './amortization'
export * from './payment-capacity'
export * from './icsd'
export * from './ltv'
export * from './compliance'

/**
 * Orquestrador principal do Motor Financeiro e Risco Bancário.
 * Executa em cadeia o cronograma de amortização, a capacidade de pagamento (ICSD),
 * o balanço de garantias e LTV ponderado, e a validação de compliance MCR.
 */
export function calculateFullCreditRiskAnalysis(
  input: FinancialEngineInput
): FinancialEngineResult {
  // 1. Simulação de Amortização Financeira
  const amortization = calculateAmortization(
    input.requestedAmount,
    input.annualInterestRate,
    input.termMonths,
    input.graceMonths || 0,
    input.amortizationSystem
  )

  // 2. Capacidade de Pagamento e Teste de Estresse (ICSD)
  const icsd = calculatePaymentCapacityAndIcsd(
    input.agroRevenues,
    input.nonAgroRevenues || [],
    input.expenses,
    amortization.annualDebtService
  )

  // 3. Lastro de Garantias e Loan-to-Value (LTV)
  const ltv = calculateCollateralAndLtv(
    input.requestedAmount,
    input.ruralCollateral,
    input.urbanProperties || [],
    input.vehicles || []
  )

  // 4. Compliance e Parecer Normativo
  const compliance = evaluateMcrCompliance(
    input.creditLineCode,
    input.creditLineAxis,
    input.requestedAmount,
    icsd.isApproved,
    ltv.isApproved
  )

  // 5. Decisão Geral de Risco
  let overallStatus: 'APROVADO' | 'APROVADO_COM_RESTRICOES' | 'REPROVADO'
  let summaryOpinion = ''

  if (icsd.isApproved && ltv.isApproved) {
    if (icsd.classification === 'APROVADO_CONFORTAVEL') {
      overallStatus = 'APROVADO'
      summaryOpinion = `Proposta plenamente aprovada. Apresenta solvência operacional robusta (ICSD ${icsd.icsdValue.toFixed(2)}) e cobertura satisfatória de garantias regulamentares (LTV aceitável de ${(ltv.ltvRatioAcceptable * 100).toFixed(1)}%). Atende aos dispositivos normativos do MCR/BACEN.`
    } else {
      overallStatus = 'APROVADO_COM_RESTRICOES'
      summaryOpinion = `Proposta aprovável com ressalvas. O ICSD de ${icsd.icsdValue.toFixed(2)} atende ao mínimo regulatório, mas recomenda-se acompanhamento técnico da safra e eventual reforço de garantia pignoratícia.`
    }
  } else if (!icsd.isApproved && ltv.isApproved) {
    overallStatus = 'REPROVADO'
    summaryOpinion = `Proposta com restrição técnica de solvência. Embora as garantias patrimoniais sejam suficientes (cobertura de ${ltv.coverageRatioPercent.toFixed(1)}%), a capacidade de pagamento gerada não cobre o serviço anual da dívida na proporção mínima exigida (ICSD ${icsd.icsdValue.toFixed(2)} < 1.20).`
  } else if (icsd.isApproved && !ltv.isApproved) {
    overallStatus = 'APROVADO_COM_RESTRICOES'
    summaryOpinion = `Proposta com capacidade de pagamento aprovada (ICSD ${icsd.icsdValue.toFixed(2)}), porém com deficiência de lastro de garantia real/pignoratícia. Recomenda-se adicionar avalistas, alienação de veículos ou bens imóveis adicionais.`
  } else {
    overallStatus = 'REPROVADO'
    summaryOpinion = `Proposta reprovada em duplo critério: insuficiência de fluxo de caixa operacional (ICSD ${icsd.icsdValue.toFixed(2)} < 1.20) e carência de garantias regulamentares aceitáveis perante as normas do crédito rural.`
  }

  return {
    amortization,
    icsd,
    ltv,
    overallStatus,
    summaryOpinion,
    regulatoryNotes: [
      compliance.enquadramentoText,
      ...compliance.mcrArticles.map((art) => `Dispositivo: ${art}`),
      ...compliance.warnings
    ],
    calculatedAt: new Date().toISOString()
  }
}
