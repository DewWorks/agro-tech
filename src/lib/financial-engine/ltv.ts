import {
  RuralCollateralInput,
  UrbanPropertyCollateralInput,
  VehicleCollateralInput,
  LtvResult
} from './types'

/**
 * Fatores regulamentares de ponderação de garantias estabelecidos pelo MCR (Banco Central)
 * e pelas diretrizes de risco de crédito do Banco do Brasil e cooperativas de crédito.
 */
export const COLLATERAL_WEIGHTS = {
  RURAL_REAL_ESTATE: 0.65, // Terra nua e benfeitorias fixas (hipoteca / alienação fiduciária)
  RURAL_PLEDGE: 0.50,      // Penhor rural de máquinas agrícolas e semoventes/rebanho
  URBAN_PROPERTY: 0.50,    // Imóveis urbanos residenciais, comerciais e industriais
  VEHICLES: 0.40           // Veículos automotores, caminhões, caminhonetes e utilitários
} as const

/**
 * Avalia o lastro total de garantias oferecidas pelo produtor rural,
 * calculando o índice de Loan-to-Value (LTV) e o percentual de cobertura aceitável.
 *
 * @param requestedAmount Valor do crédito solicitado/financiado (R$)
 * @param rural RuralCollateralInput (terra, benfeitorias, máquinas e rebanho)
 * @param urban UrbanPropertyCollateralInput[] (imóveis urbanos complementares)
 * @param vehicles VehicleCollateralInput[] (veículos e maquinários registrados)
 */
export function calculateCollateralAndLtv(
  requestedAmount: number,
  rural: RuralCollateralInput,
  urban: UrbanPropertyCollateralInput[] = [],
  vehicles: VehicleCollateralInput[] = []
): LtvResult {
  const req = Math.max(0, Number(requestedAmount) || 0)

  // 1. Garantias Rurais (Patrimônio Rural)
  const land = Math.max(0, Number(rural.landValue) || 0)
  const improvements = Math.max(0, Number(rural.improvementsValue) || 0)
  const machinery = Math.max(0, Number(rural.machineryValue) || 0)
  const livestock = Math.max(0, Number(rural.livestockValue) || 0)

  const ruralLandAndImprovements = land + improvements
  const ruralPenhor = machinery + livestock
  const ruralTotal = ruralLandAndImprovements + ruralPenhor

  const ruralAcceptable = Math.round(
    (ruralLandAndImprovements * COLLATERAL_WEIGHTS.RURAL_REAL_ESTATE +
      ruralPenhor * COLLATERAL_WEIGHTS.RURAL_PLEDGE) *
      100
  ) / 100

  // 2. Garantias Urbanas (Bens Imóveis Urbanos)
  let urbanTotal = 0
  let urbanAcceptable = 0

  for (const item of urban) {
    const val = Math.max(0, Number(item.marketValue) || 0)
    urbanTotal += val

    // Bens com gravame ou alienação fiduciária não compõem margem primária
    if (!item.hasLien && val > 0) {
      urbanAcceptable += Math.round(val * COLLATERAL_WEIGHTS.URBAN_PROPERTY * 100) / 100
    }
  }

  // 3. Veículos e Utilitários
  let vehiclesTotal = 0
  let vehiclesAcceptable = 0

  for (const item of vehicles) {
    const val = Math.max(0, Number(item.declaredValue) || 0)
    vehiclesTotal += val

    if (!item.hasLien && val > 0) {
      vehiclesAcceptable += Math.round(val * COLLATERAL_WEIGHTS.VEHICLES * 100) / 100
    }
  }

  // 4. Consolidação de Lastro
  const totalDeclaredCollateral = Math.round((ruralTotal + urbanTotal + vehiclesTotal) * 100) / 100
  const totalAcceptableCollateral = Math.round((ruralAcceptable + urbanAcceptable + vehiclesAcceptable) * 100) / 100

  // 5. Índices LTV e Cobertura
  let ltvRatioDeclared = 0
  let ltvRatioAcceptable = 0
  let coverageRatioPercent = 0

  if (totalDeclaredCollateral > 0 && req > 0) {
    ltvRatioDeclared = Math.round((req / totalDeclaredCollateral) * 100) / 100
  }

  if (totalAcceptableCollateral > 0 && req > 0) {
    ltvRatioAcceptable = Math.round((req / totalAcceptableCollateral) * 100) / 100
    coverageRatioPercent = Math.round((totalAcceptableCollateral / req) * 10000) / 100
  }

  // Padrão de aprovação bancária: as garantias aceitáveis ponderadas devem cobrir >= 100% do financiamento
  const isApproved = totalAcceptableCollateral >= req && req > 0

  // 6. Parecer Técnico
  let opinionText = ''
  if (req <= 0) {
    opinionText = 'Valor solicitado não informado ou zerado.'
  } else if (isApproved) {
    opinionText = `Garantias satisfatórias. O lastro aceitável apurado de R$ ${totalAcceptableCollateral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cobre ${coverageRatioPercent.toFixed(1)}% do valor solicitado (LTV regulamentar de ${(ltvRatioAcceptable * 100).toFixed(1)}%), atendendo às exigências normativas de mitigação de risco.`
  } else {
    const deficit = Math.max(0, req - totalAcceptableCollateral)
    opinionText = `Lastro de garantia insuficiente. As garantias ponderadas aceitáveis somam R$ ${totalAcceptableCollateral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, gerando um déficit de cobertura de R$ ${deficit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} perante as regras prudenciais do MCR.`
  }

  return {
    ruralLandAndImprovements: Math.round(ruralLandAndImprovements * 100) / 100,
    ruralPenhor: Math.round(ruralPenhor * 100) / 100,
    ruralTotal: Math.round(ruralTotal * 100) / 100,
    ruralAcceptable,

    urbanTotal: Math.round(urbanTotal * 100) / 100,
    urbanAcceptable: Math.round(urbanAcceptable * 100) / 100,

    vehiclesTotal: Math.round(vehiclesTotal * 100) / 100,
    vehiclesAcceptable: Math.round(vehiclesAcceptable * 100) / 100,

    totalDeclaredCollateral,
    totalAcceptableCollateral,

    requestedAmount: req,
    ltvRatioDeclared,
    ltvRatioAcceptable,
    isApproved,
    coverageRatioPercent,
    opinionText
  }
}
