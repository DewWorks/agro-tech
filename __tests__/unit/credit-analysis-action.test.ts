jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

import { calculateCreditSimulation } from '@/actions/credit-analysis'
import { CreditLineAxis } from '@/lib/financial-engine'

describe('Credit Analysis Server Action & Authoritative Calculations', () => {
  it('calculates credit simulation for PRICE system and PRONAMP Custeio correctly', async () => {
    const simulation = await calculateCreditSimulation({
      creditLineCode: 'PRONAMP_CUSTEIO',
      requestedAmount: 300000,
      amortizationSystem: 'PRICE',
      totalTermMonths: 12,
      interestRateAnnual: 8.0,
      effectiveAgroRevenue: 800000,
      projectedAgroRevenue: 950000,
      productionCosts: 400000,
      familyLivingExpenses: 60000,
      existingDebtService: 40000,
      landValue: 3000000,
      improvementsValue: 500000,
      machineryValue: 400000,
      livestockValue: 600000,
    })

    expect(simulation).toBeDefined()
    expect(simulation.amortization.system).toBe('PRICE')
    expect(simulation.amortization.annualDebtService).toBeCloseTo(324000, -2) // 300k * 1.08
    expect(simulation.icsd.paymentCapacity).toBeGreaterThan(0)
    expect(simulation.icsd.isApproved).toBe(true)
    expect(simulation.ltv.isApproved).toBe(true)
    expect(simulation.overallStatus).toBe('APROVADO')
  })

  it('incorporates urban properties and vehicles into collateral and LTV', async () => {
    const simulation = await calculateCreditSimulation({
      creditLineCode: 'INVESTE_AGRO',
      requestedAmount: 1000000,
      amortizationSystem: 'SAC',
      totalTermMonths: 60,
      interestRateAnnual: 10.5,
      effectiveAgroRevenue: 1200000,
      productionCosts: 500000,
      landValue: 500000, // Terra insuficiente sozinha (65% = 325k)
      urbanProperties: [
        {
          description: 'Galpão Comercial Goiânia',
          propertyType: 'GALPAO_INDUSTRIAL',
          marketValue: 1000000,
          hasLien: false, // 50% = 500k aceitável
        },
        {
          description: 'Lote Residencial Alienado',
          propertyType: 'TERRENO_LOTE',
          marketValue: 300000,
          hasLien: true, // Gravame = 0
        },
      ],
      vehicles: [
        {
          brand: 'Toyota',
          model: 'Hilux SRX',
          vehicleType: 'CAMINHONETE',
          declaredValue: 300000,
          hasLien: false, // 40% = 120k aceitável
        },
      ],
    })

    // Rural aceitável: 500k * 0.65 = 325k
    // Urbano aceitável: 500k
    // Veículo aceitável: 120k
    // Total aceitável: 325k + 500k + 120k = 945k
    expect(simulation.ltv.urbanTotal).toBe(1300000)
    expect(simulation.ltv.urbanAcceptable).toBe(500000)
    expect(simulation.ltv.vehiclesTotal).toBe(300000)
    expect(simulation.ltv.vehiclesAcceptable).toBe(120000)
    expect(simulation.ltv.totalAcceptableCollateral).toBe(945000)
  })

  it('correctly handles stress test rejection when cash flow is insufficient (ICSD < 1.20)', async () => {
    const simulation = await calculateCreditSimulation({
      creditLineCode: 'PRONAMP_INVESTIMENTO',
      requestedAmount: 1500000,
      amortizationSystem: 'SAC',
      totalTermMonths: 96,
      interestRateAnnual: 8.0,
      effectiveAgroRevenue: 300000, // Receita muito baixa para o montante
      productionCosts: 250000,
      familyLivingExpenses: 60000,
      existingDebtService: 50000,
      landValue: 5000000,
    })

    expect(simulation.icsd.isApproved).toBe(false)
    expect(simulation.icsd.classification).toBe('REPROVADO')
    expect(simulation.overallStatus).toBe('REPROVADO')
  })
})
