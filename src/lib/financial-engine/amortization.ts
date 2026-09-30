import { AmortizationSystem, AmortizationResult, InstallmentScheduleItem } from './types'

/**
 * Calcula a amortização financeira (Sistemas PRICE e SAC) adaptada aos padrões
 * operacionais do crédito rural (fluxos e parcelas de vencimento anual).
 *
 * @param principal Valor solicitado/financiado (R$)
 * @param annualInterestRatePercent Taxa de juros anual nominal (ex: 10.5 para 10.5% a.a.)
 * @param termMonths Prazo total da operação em meses (ex: 12, 60, 96, 120)
 * @param graceMonths Período de carência em meses (ex: 0, 12, 24, 36)
 * @param system Sistema de amortização escolhido (PRICE ou SAC)
 */
export function calculateAmortization(
  principal: number,
  annualInterestRatePercent: number,
  termMonths: number,
  graceMonths: number = 0,
  system: AmortizationSystem = AmortizationSystem.PRICE
): AmortizationResult {
  const p = Math.max(0, Number(principal) || 0)
  const i = Math.max(0, (Number(annualInterestRatePercent) || 0) / 100)
  const totalMonths = Math.max(1, Number(termMonths) || 12)
  const graceM = Math.max(0, Math.min(Number(graceMonths) || 0, totalMonths - 1))

  // No crédito rural brasileiro, as operações são estruturadas em ciclos de safra (anuais)
  const totalYears = Math.max(1, Math.ceil(totalMonths / 12))
  const graceYears = Math.floor(graceM / 12)
  const amortizingYears = Math.max(1, totalYears - graceYears)

  const schedule: InstallmentScheduleItem[] = []
  let currentBalance = p
  let totalInterest = 0
  let totalPaid = 0
  let annualDebtService = 0

  if (totalYears === 1) {
    // Operação de Safra / Custeio Anual (1 parcela no vencimento)
    const interest = Math.round(currentBalance * i * 100) / 100
    const payment = Math.round((currentBalance + interest) * 100) / 100
    schedule.push({
      period: 1,
      label: 'Safra 1 (12m)',
      isGracePeriod: false,
      openingBalance: currentBalance,
      amortization: currentBalance,
      interest,
      totalPayment: payment,
      closingBalance: 0
    })
    totalInterest = interest
    totalPaid = payment
    annualDebtService = payment
  } else if (system === AmortizationSystem.PRICE) {
    // Sistema Francês de Amortização (PRICE) com prestações constantes pós-carência
    // Cálculo da prestação constante: PMT = VP * [ i * (1+i)^n / ((1+i)^n - 1) ]
    let pmt = 0
    if (i > 0) {
      const factor = Math.pow(1 + i, amortizingYears)
      pmt = Math.round((currentBalance * (i * factor) / (factor - 1)) * 100) / 100
    } else {
      pmt = Math.round((currentBalance / amortizingYears) * 100) / 100
    }

    annualDebtService = pmt

    for (let yr = 1; yr <= totalYears; yr++) {
      const isGrace = yr <= graceYears
      const opening = currentBalance
      const interest = Math.round(opening * i * 100) / 100

      let amortization = 0
      let payment = 0

      if (isGrace) {
        // Durante a carência bancária rural, o tomador arca com os juros anuais da operação
        amortization = 0
        payment = interest
        currentBalance = opening
      } else {
        if (yr === totalYears) {
          // Última parcela absorve eventuais arredondamentos de centavos
          amortization = opening
          payment = Math.round((amortization + interest) * 100) / 100
          currentBalance = 0
        } else {
          payment = pmt
          amortization = Math.round(Math.min(opening, payment - interest) * 100) / 100
          currentBalance = Math.max(0, Math.round((opening - amortization) * 100) / 100)
        }
      }

      totalInterest += interest
      totalPaid += payment

      schedule.push({
        period: yr,
        label: `Ano ${yr}${isGrace ? ' (Carência)' : ''}`,
        isGracePeriod: isGrace,
        openingBalance: opening,
        amortization,
        interest,
        totalPayment: payment,
        closingBalance: currentBalance
      })
    }
  } else {
    // Sistema de Amortização Constante (SAC) com quotas fixas e juros decrescentes
    const fixedAmortization = Math.round((currentBalance / amortizingYears) * 100) / 100

    for (let yr = 1; yr <= totalYears; yr++) {
      const isGrace = yr <= graceYears
      const opening = currentBalance
      const interest = Math.round(opening * i * 100) / 100

      let amortization = 0
      let payment = 0

      if (isGrace) {
        amortization = 0
        payment = interest
        currentBalance = opening
      } else {
        if (yr === totalYears) {
          amortization = opening
        } else {
          amortization = Math.min(opening, fixedAmortization)
        }
        payment = Math.round((amortization + interest) * 100) / 100
        currentBalance = Math.max(0, Math.round((opening - amortization) * 100) / 100)

        // No SAC, a parcela de teste de estresse bancário é a do Ano 1 pós-carência (maior encargo)
        if (annualDebtService === 0) {
          annualDebtService = payment
        }
      }

      totalInterest += interest
      totalPaid += payment

      schedule.push({
        period: yr,
        label: `Ano ${yr}${isGrace ? ' (Carência)' : ''}`,
        isGracePeriod: isGrace,
        openingBalance: opening,
        amortization,
        interest,
        totalPayment: payment,
        closingBalance: currentBalance
      })
    }
  }

  return {
    system,
    principal: p,
    annualInterestRate: annualInterestRatePercent,
    termMonths: totalMonths,
    graceMonths: graceM,
    annualDebtService: Math.round(annualDebtService * 100) / 100,
    schedule,
    totalInterestPaid: Math.round(totalInterest * 100) / 100,
    totalAmountPaid: Math.round(totalPaid * 100) / 100
  }
}
