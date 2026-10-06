/**
 * Utilitário Puro para Extração do Valor Financiado ou Investimento Total
 * a partir de payloads de formulários emitidos, dossiês e laudos técnicos.
 */
export function extractFinancedAmountFromPayload(p: any): number {
  if (!p || typeof p !== 'object') return 0

  if (Number(p.financedAmount) > 0) return Number(p.financedAmount)
  if (Number(p.renovagroFinanced) > 0) return Number(p.renovagroFinanced)
  if (Number(p.inovagroFinanced) > 0) return Number(p.inovagroFinanced)

  // Custeio Safra: custeioAreaHa * custeioCostPerHa ou custeioQuantity * custeioUnitPrice
  const custeioTotalArea = Number(p.custeioAreaHa || 0) * Number(p.custeioCostPerHa || 0)
  if (custeioTotalArea > 0) return custeioTotalArea

  const custeioTotalQtd = Number(p.custeioQuantity || 0) * Number(p.custeioUnitPrice || 0)
  if (custeioTotalQtd > 0) return custeioTotalQtd

  if (Number(p.valorFinanciado) > 0) return Number(p.valorFinanciado)
  if (Number(p.valorTotal) > 0) return Number(p.valorTotal)
  if (Number(p.amount) > 0) return Number(p.amount)
  if (Number(p.machineryValue) > 0) return Number(p.machineryValue)
  if (Number(p.totalInvestment) > 0) return Number(p.totalInvestment)
  if (Number(p.custeioTotal) > 0) return Number(p.custeioTotal)

  return 0
}
