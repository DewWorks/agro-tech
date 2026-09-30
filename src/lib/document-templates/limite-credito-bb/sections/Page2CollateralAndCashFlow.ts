import { formatBRL } from '../formatters'
import { renderPageHeader, renderPageFooter } from './HeaderSection'
import { denormalizeCategoryBB, denormalizePurposeBB } from '@/lib/validations/livestock-mapper'
import { FinancialEngineResult } from '@/lib/financial-engine'

export interface Page2Params {
  prop: any
  cattleEstimatedValue: number
  totalCattle: number
  livestockItems: any[]
  cattleHeadValue: number
  machineryValue?: number
  urbanProperties: any[]
  vehicles: any[]
  engineResult: FinancialEngineResult
  creditLimitRequested: number
  orgName: string
  customAgroRevenues: any[]
  effectiveAgroRev: number
  projectedAgroRev: number
  operationalExp: number
  familyCosts: number
  existingDebt: number
}

export function renderPage2CollateralAndCashFlow(params: Page2Params): string {
  const {
    prop,
    cattleEstimatedValue,
    totalCattle,
    livestockItems,
    cattleHeadValue,
    machineryValue = 0,
    urbanProperties,
    vehicles,
    engineResult,
    creditLimitRequested,
    orgName,
    customAgroRevenues,
    effectiveAgroRev,
    projectedAgroRev,
    operationalExp,
    familyCosts,
    existingDebt,
  } = params

  // 1. Deduplicar e agrupar semoventes por lote/categoria
  const groupedLivestockMap = new Map<string, any>()
  if (livestockItems && livestockItems.length > 0) {
    for (const item of livestockItems) {
      const catLabel = item.category || denormalizeCategoryBB(item.categoryBB) || item.categoryBB || 'Bovino'
      const purpLabel = denormalizePurposeBB(item.purposeBB) || item.purposeBB || 'Produção'
      const breed = item.breed || 'Nelore PO'
      const unitVal = Number(item.unitValue) || cattleHeadValue || 0
      const brandInfo = [item.brandingType, item.brandingLocation].filter(Boolean).join(' - ') || prop.livestockData?.brandLocation || 'Conforme Ficha'
      const key = `${catLabel}__${purpLabel}__${breed}__${unitVal}__${brandInfo}`

      const qty = Number(item.quantity) || 0
      const age = item.ageMonths ? `${item.ageMonths} m` : ''
      const weight = item.avgWeightKg ? `${item.avgWeightKg} kg` : ''

      if (groupedLivestockMap.has(key)) {
        const existing = groupedLivestockMap.get(key)
        existing.quantity += qty
        existing.total += qty * unitVal
      } else {
        groupedLivestockMap.set(key, {
          catLabel,
          purpLabel,
          breed,
          quantity: qty,
          age,
          weight,
          unitVal,
          total: qty * unitVal,
          brandInfo,
        })
      }
    }
  }
  const consolidatedLivestock = Array.from(groupedLivestockMap.values())

  // 2. Solvência e Receitas
  const hasRevenues =
    (engineResult.icsd.grossAgroRevenue || 0) > 0 ||
    (engineResult.icsd.nonAgroRevenueTotal || 0) > 0 ||
    effectiveAgroRev > 0 ||
    projectedAgroRev > 0 ||
    (customAgroRevenues && customAgroRevenues.length > 0)

  const paymentCapacity = engineResult.icsd.paymentCapacity || 0
  const icsdValue = engineResult.icsd.icsdValue || 0

  let solvencyBadgeClass = 'badge-rejected'
  let solvencyBadgeText = 'Fluxo Deficitário'
  let solvencyOpinionText = ''

  if (!hasRevenues) {
    solvencyBadgeClass = 'badge-alert'
    solvencyBadgeText = 'Sem Receitas Comprovadas'
    solvencyOpinionText =
      'Não foram computadas receitas operacionais ou histórico produtivo no exercício analisado. A solvência depende da comprovação de renda da safra (notas fiscais ou contratos de comercialização futura).'
  } else if (paymentCapacity <= 0) {
    solvencyBadgeClass = 'badge-rejected'
    solvencyBadgeText = 'Fluxo Deficitário'
    solvencyOpinionText =
      'Atenção: Os fluxos projetados apontam déficit operacional. As despesas e encargos superam as entradas líquidas. Recomenda-se alongamento de prazos ou revisão das estimativas de custeio.'
  } else if (icsdValue < 1.20) {
    solvencyBadgeClass = 'badge-alert'
    solvencyBadgeText = 'Capacidade Insuficiente'
    solvencyOpinionText = `A receita operacional é positiva (CP de ${formatBRL(paymentCapacity)}), porém a Capacidade de Pagamento líquida apurada é inferior à margem regulamentar exigida pelo Banco do Brasil (ICSD apurado de ${icsdValue.toFixed(2)}x < 1,20x corte).`
  } else {
    solvencyBadgeClass = 'badge-approved'
    solvencyBadgeText = 'Fluxo Superavitário'
    solvencyOpinionText = `A exploração agropecuária do proponente demonstra solidez econômico-financeira (ICSD ${icsdValue.toFixed(2)}x), gerando margem livre suficiente para absorver os encargos sem comprometer a estabilidade do empreendimento.`
  }

  // Máquinas cadastradas
  const machineries = prop.machineries || []
  const totalMachineryDeclared = machineries.length > 0
    ? machineries.reduce((acc: number, m: any) => acc + (Number(m.value) || 0), 0)
    : machineryValue
  const totalMachineryAcceptable = machineries.length > 0
    ? machineries.reduce((acc: number, m: any) => acc + (m.hasLien ? 0 : (Number(m.value) || 0) * 0.50), 0)
    : (machineryValue * 0.50)

  return `
  <!-- =================================================================== -->
  <!-- PÁGINA 2: GARANTIAS PIGNORATÍCIAS, LTV E DEMONSTRAÇÃO FLUXO DE CAIXA -->
  <!-- =================================================================== -->
  <div class="page-sheet dossie-page">
    ${renderPageHeader(
      'Garantias Pignoratícias, LTV e Demonstração do Fluxo de Caixa',
      'Dimensionamento do Rebanho, Máquinas, Frotas, Lastro Ponderado MCR e Capacidade de Pagamento',
      2,
      3,
      'Garantias & Fluxo de Caixa'
    )}

    <!-- SEÇÃO VI - SEMOVENTES & MÁQUINAS -->
    <!-- VI.1 Semoventes e Rebanho Bovino (Ponderação MCR 50%) -->
    <div class="dossie-card" style="margin-bottom: 9px; page-break-inside: avoid; break-inside: avoid;">
      <div class="dossie-card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <span>VI - Semoventes e Rebanho Bovino (Ponderação MCR 50%)</span>
        <span style="font-size: 8.5px; color: #4b5563; font-weight: normal;">Registro ADAPEC: <strong>${prop.livestockData?.brandRegistrationAdapec || 'Regular'}</strong></span>
      </div>

      ${consolidatedLivestock.length > 0 ? `
      <table class="dossie-table" style="table-layout: fixed;">
        <colgroup>
          <col style="width: 17%;">
          <col style="width: 17%;">
          <col style="width: 13%;">
          <col style="width: 9%;">
          <col style="width: 10%;">
          <col style="width: 14%;">
          <col style="width: 20%;">
        </colgroup>
        <thead>
          <tr>
            <th style="padding: 4.5px 6px;">Categoria (BB)</th>
            <th style="padding: 4.5px 6px;">Finalidade</th>
            <th style="padding: 4.5px 6px;">Raça</th>
            <th style="padding: 4.5px 6px; text-align: center;">Qtd</th>
            <th style="padding: 4.5px 6px; text-align: center;">Peso / Idade</th>
            <th style="padding: 4.5px 6px; text-align: right;">Valor Unit.</th>
            <th style="padding: 4.5px 6px; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${consolidatedLivestock.map((item: any) => `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 4px 6px; font-weight: 600; color: #111827; vertical-align: middle;">
                <div>${item.catLabel}</div>
                <span style="display: block; font-size: 7.5px; color: #6b7280; font-weight: normal;">Marca: ${item.brandInfo}</span>
              </td>
              <td style="padding: 4px 6px; color: #4b5563; vertical-align: middle;">${item.purpLabel}</td>
              <td style="padding: 4px 6px; color: #374151; vertical-align: middle;">${item.breed}</td>
              <td style="padding: 4px 6px; text-align: center; font-weight: bold; color: #111827; vertical-align: middle;">${item.quantity}</td>
              <td style="padding: 4px 6px; text-align: center; color: #4b5563; vertical-align: middle;">${item.weight || item.age || '-'}</td>
              <td style="padding: 4px 6px; text-align: right; color: #374151; vertical-align: middle;">${formatBRL(item.unitVal)}</td>
              <td style="padding: 4px 6px; text-align: right; font-weight: 600; color: #1B4D3E; vertical-align: middle;">${formatBRL(item.total)}</td>
            </tr>
          `).join('')}
          <tr class="dossie-total-row" style="background: #f3f4f6; font-weight: bold; border-top: 1px solid #d1d5db;">
            <td colspan="3" style="padding: 7px 6px; text-transform: uppercase; color: #111827;">Total Rebanho Declarado</td>
            <td style="padding: 7px 6px; text-align: center; color: #1B4D3E; font-size: 10px;">${totalCattle} cab</td>
            <td style="padding: 7px 6px; text-align: center; font-size: 8px; color: #6b7280;">Margem 50%:</td>
            <td colspan="2" style="padding: 7px 6px; text-align: right; color: #1B4D3E; font-size: 10px;">
              ${formatBRL(cattleEstimatedValue)} <span style="font-size: 8px; color: #065f46; font-weight: bold; margin-left: 3px;">(${formatBRL(cattleEstimatedValue * 0.50)})</span>
            </td>
          </tr>
        </tbody>
      </table>
      ` : `
      <div style="padding: 8px 12px; display: flex; justify-content: space-between; font-weight: bold; font-size: 9.5px;">
        <span>Total de Cabeças Cadastradas: ${totalCattle} cab</span>
        <span style="color: #1B4D3E;">Valor Estimado Rebanho: ${formatBRL(cattleEstimatedValue)} (Margem 50%: ${formatBRL(cattleEstimatedValue * 0.50)})</span>
      </div>
      `}
    </div>

    <!-- VI.2 Máquinas e Equipamentos Agrícolas (Ponderação MCR 50%) -->
    <div class="dossie-card" style="margin-bottom: 9px;">
      <div class="dossie-card-header">
        Máquinas, Tratores e Implementos Agrícolas (Ponderação MCR 50%)
      </div>
      <table class="dossie-table">
        <thead>
          <tr>
            <th style="padding: 4.5px 8px;">Especificação / Equipamento</th>
            <th style="padding: 4.5px 8px;">Marca / Modelo</th>
            <th style="padding: 4.5px 8px; text-align: center;">Ano</th>
            <th style="padding: 4.5px 8px; text-align: right;">Valor Declarado</th>
            <th style="padding: 4.5px 8px; text-align: center;">Gravame / Penhor</th>
            <th style="padding: 4.5px 8px; text-align: right;">Margem MCR (50%)</th>
          </tr>
        </thead>
        <tbody>
          ${machineries.length > 0 ? machineries.map((m: any) => `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 4.5px 8px; font-weight: 500;">${m.specification || 'Máquina Agrícola'}</td>
              <td style="padding: 4.5px 8px;">${m.brand || '-'} / ${m.model || '-'}</td>
              <td style="padding: 4.5px 8px; text-align: center;">${m.year || '-'}</td>
              <td style="padding: 4.5px 8px; text-align: right;">${formatBRL(Number(m.value) || 0)}</td>
              <td style="padding: 4.5px 8px; text-align: center; color: ${m.hasLien ? '#dc2626' : '#065f46'}; font-weight: bold;">
                ${m.hasLien ? `Alienado (${m.lienInstitution || 'Banco'})` : 'Livre de Ônus'}
              </td>
              <td style="padding: 4.5px 8px; text-align: right; color: #065f46; font-weight: 600;">
                ${formatBRL(m.hasLien ? 0 : (Number(m.value) || 0) * 0.50)}
              </td>
            </tr>
          `).join('') : (machineryValue > 0 ? `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 4.5px 8px; font-weight: 500;">Lote de Tratores e Implementos Agrícolas da Propriedade</td>
              <td style="padding: 4.5px 8px;">Conforme Relação Cadastrada</td>
              <td style="padding: 4.5px 8px; text-align: center;">-</td>
              <td style="padding: 4.5px 8px; text-align: right; font-weight: bold;">${formatBRL(machineryValue)}</td>
              <td style="padding: 4.5px 8px; text-align: center; color: #065f46; font-weight: bold;">Livre de Ônus</td>
              <td style="padding: 4.5px 8px; text-align: right; color: #065f46; font-weight: bold;">${formatBRL(machineryValue * 0.50)}</td>
            </tr>
          ` : `
            <tr>
              <td colspan="6" style="padding: 6px 8px; text-align: center; color: #6b7280; font-style: italic;">
                Nenhum maquinário agrícola oferecido em garantia pignoratícia (R$ 0,00).
              </td>
            </tr>
          `)}
          ${(machineries.length > 0 || machineryValue > 0) ? `
          <tr class="dossie-total-row" style="background: #f3f4f6; font-weight: bold; border-top: 1px solid #d1d5db;">
            <td colspan="3" style="padding: 7px 8px; color: #111827; text-transform: uppercase;">Subtotal Máquinas & Equipamentos</td>
            <td style="padding: 7px 8px; text-align: right; color: #1B4D3E;">${formatBRL(totalMachineryDeclared)}</td>
            <td style="padding: 7px 8px; text-align: center; color: #6b7280; font-size: 8px;">Margem MCR:</td>
            <td style="padding: 7px 8px; text-align: right; color: #065f46;">${formatBRL(totalMachineryAcceptable)}</td>
          </tr>
          ` : ''}
        </tbody>
      </table>
    </div>

    <!-- VI.3 Bens Complementares de Lastro (Imóveis Urbanos & Frotas) -->
    ${(urbanProperties.length > 0 || vehicles.length > 0) ? `
    <div class="dossie-card" style="margin-bottom: 9px; page-break-inside: avoid; break-inside: avoid;">
      <div class="dossie-card-header" style="background: #1e3a8a; color: #ffffff;">
        VI.3 - Bens Complementares de Lastro (Imóveis Urbanos & Frotas - Ponderações MCR 50% / 40%)
      </div>
      <table class="dossie-table">
        <thead>
          <tr>
            <th style="padding: 4.5px 8px;">Categoria / Discriminação</th>
            <th style="padding: 4.5px 8px;">Identificação / Cidade / Placa</th>
            <th style="padding: 4.5px 8px; text-align: center;">Gravame</th>
            <th style="padding: 4.5px 8px; text-align: right;">Valor Declarado</th>
            <th style="padding: 4.5px 8px; text-align: right;">Margem MCR</th>
          </tr>
        </thead>
        <tbody>
          ${urbanProperties.map((u: any, idx: number) => `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 4.5px 8px; font-weight: 500;">Imóvel Urbano (${u.propertyType || 'Residencial'})</td>
              <td style="padding: 4.5px 8px;">${u.description || `Imóvel Urbano ${idx + 1}`} • ${u.city || ''}/${u.state || ''}</td>
              <td style="padding: 4.5px 8px; text-align: center; color: ${u.hasLien ? '#dc2626' : '#065f46'}; font-weight: bold;">
                ${u.hasLien ? 'Alienado' : 'Livre de Ônus'}
              </td>
              <td style="padding: 4.5px 8px; text-align: right;">${formatBRL(Number(u.marketValue) || 0)}</td>
              <td style="padding: 4.5px 8px; text-align: right; color: #065f46; font-weight: 600;">
                ${formatBRL(u.hasLien ? 0 : (Number(u.marketValue) || 0) * 0.50)} (50%)
              </td>
            </tr>
          `).join('')}
          ${vehicles.map((v: any, idx: number) => `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 4.5px 8px; font-weight: 500;">Veículo Automotor (${v.vehicleType || 'Caminhonete'})</td>
              <td style="padding: 4.5px 8px;">${v.brand || ''} ${v.model || `Veículo ${idx + 1}`}${v.licensePlate ? ` • Placa: ${v.licensePlate}` : ''}</td>
              <td style="padding: 4.5px 8px; text-align: center; color: ${v.hasLien ? '#dc2626' : '#065f46'}; font-weight: bold;">
                ${v.hasLien ? 'Alienado' : 'Livre de Ônus'}
              </td>
              <td style="padding: 4.5px 8px; text-align: right;">${formatBRL(Number(v.declaredValue) || 0)}</td>
              <td style="padding: 4.5px 8px; text-align: right; color: #065f46; font-weight: 600;">
                ${formatBRL(v.hasLien ? 0 : (Number(v.declaredValue) || 0) * 0.40)} (40%)
              </td>
            </tr>
          `).join('')}
          <tr class="dossie-total-row" style="background: #f1f5f9; font-weight: bold; border-top: 1px solid #cbd5e1;">
            <td colspan="3" style="padding: 6px 8px; text-transform: uppercase; color: #1e3a8a;">Subtotal Bens Complementares</td>
            <td style="padding: 6px 8px; text-align: right; color: #1e3a8a;">
              ${formatBRL(
                urbanProperties.reduce((acc: number, u: any) => acc + (Number(u.marketValue) || 0), 0) +
                vehicles.reduce((acc: number, v: any) => acc + (Number(v.declaredValue) || 0), 0)
              )}
            </td>
            <td style="padding: 6px 8px; text-align: right; color: #065f46;">
              ${formatBRL(
                urbanProperties.reduce((acc: number, u: any) => acc + (u.hasLien ? 0 : (Number(u.marketValue) || 0) * 0.50), 0) +
                vehicles.reduce((acc: number, v: any) => acc + (v.hasLien ? 0 : (Number(v.declaredValue) || 0) * 0.40), 0)
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    ` : ''}

    <!-- SEÇÃO VII: CONSOLIDAÇÃO DO LASTRO & LOAN-TO-VALUE (LTV) -->
    <div style="border: 1.5px solid #1B4D3E; border-radius: 4px; padding: 7px 10px; background: #f0fdf4; margin-bottom: 9px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
        <span style="font-size: 9.5px; color: #1B4D3E; font-weight: bold; text-transform: uppercase;">
          VII - Consolidação de Garantias e Balanço Loan-to-Value (LTV)
        </span>
        <span class="${engineResult.ltv.isApproved ? 'badge-approved' : 'badge-rejected'}">
          ${engineResult.ltv.isApproved ? 'Garantias Aprovadas' : 'Garantias Insuficientes'}
        </span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center;">
        <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 4px 6px; border-radius: 4px;">
          <span style="font-size: 8px; color: #6b7280; text-transform: uppercase;">Patrimônio Declarado</span>
          <strong style="font-size: 11px; color: #111827; display: block;">${formatBRL(engineResult.ltv.totalDeclaredCollateral)}</strong>
        </div>
        <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 4px 6px; border-radius: 4px;">
          <span style="font-size: 8px; color: #6b7280; text-transform: uppercase;">Lastro Aceito (MCR)</span>
          <strong style="font-size: 11px; color: #065f46; display: block;">${formatBRL(engineResult.ltv.totalAcceptableCollateral)}</strong>
        </div>
        <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 4px 6px; border-radius: 4px;">
          <span style="font-size: 8px; color: #6b7280; text-transform: uppercase;">Crédito Pretendido</span>
          <strong style="font-size: 11px; color: #1B4D3E; display: block;">${formatBRL(creditLimitRequested)}</strong>
        </div>
        <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 4px 6px; border-radius: 4px;">
          <span style="font-size: 8px; color: #6b7280; text-transform: uppercase;">Cobertura (LTV)</span>
          <strong style="font-size: 12px; color: ${engineResult.ltv.isApproved ? '#065f46' : '#dc2626'}; display: block;">
            ${engineResult.ltv.coverageRatioPercent.toFixed(1)}%
          </strong>
        </div>
      </div>
      <p style="margin: 5px 0 0 0; font-size: 8.5px; color: #374151; line-height: 1.4;">
        ${engineResult.ltv.opinionText}
      </p>
    </div>

    <!-- SEÇÃO VIII: FLUXO DE CAIXA OPERACIONAL -->
    <!-- VIII.1 Receitas Agropecuárias -->
    <div class="dossie-card" style="margin-bottom: 9px;">
      <div class="dossie-card-header">
        VIII - Fluxo de Caixa Operacional (Receitas Efetivas Safra N-1 vs. Projetadas Safra N)
      </div>
      ${customAgroRevenues.length > 0 ? `
      <table class="dossie-table">
        <thead>
          <tr>
            <th style="padding: 4.5px 8px;">Cultura / Atividade</th>
            <th style="padding: 4.5px 8px; text-align: center;">Safra</th>
            <th style="padding: 4.5px 8px; text-align: right;">Quantidade</th>
            <th style="padding: 4.5px 8px; text-align: right;">Preço Médio</th>
            <th style="padding: 4.5px 8px; text-align: right;">Custo Produção</th>
            <th style="padding: 4.5px 8px; text-align: right;">Receita Líquida</th>
          </tr>
        </thead>
        <tbody>
          ${customAgroRevenues.map((r: any) => {
            const qty = Number(r.quantity) || 0
            const prc = Number(r.unitPrice) || 0
            const cost = Number(r.productionCostTotal) || 0
            const net = Math.max(0, qty * prc - cost)
            return `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 4.5px 8px; font-weight: 500;">${r.description || 'Cultura Agrícola'}</td>
              <td style="padding: 4.5px 8px; text-align: center;">${r.realizationType === 'EFETIVA_HISTORICA' ? 'Efetiva (N-1)' : 'Projetada (N)'}</td>
              <td style="padding: 4.5px 8px; text-align: right;">${qty} ${r.unit || 'sc'}</td>
              <td style="padding: 4.5px 8px; text-align: right;">${formatBRL(prc)}</td>
              <td style="padding: 4.5px 8px; text-align: right; color: #dc2626;">- ${formatBRL(cost)}</td>
              <td style="padding: 4.5px 8px; text-align: right; font-weight: 600; color: #065f46;">${formatBRL(net)}</td>
            </tr>
            `
          }).join('')}
        </tbody>
      </table>
      ` : (hasRevenues ? `
      <table class="dossie-table">
        <tbody>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 5px 8px; font-weight: 500;">Produção Agropecuária Comprovada (Safra Anterior)</td>
            <td style="padding: 5px 8px; text-align: center;">Efetiva (N-1)</td>
            <td style="padding: 5px 8px; text-align: right; font-weight: bold; color: #065f46;">${formatBRL(effectiveAgroRev)}</td>
          </tr>
        </tbody>
      </table>
      ` : `
      <div style="padding: 7px 10px; font-size: 8.5px; color: #4b5563; font-style: italic; background: #ffffff;">
        Não foram cadastradas receitas operacionais ou histórico de safra comprovada no exercício analisado (R$ 0,00). A comprovação da renda para deferimento depende da apresentação de notas fiscais ou contratos de venda futura no CRM.
      </div>
      `)}
    </div>

    <!-- VIII.2 Despesas Operacionais, Manutenção Familiar e Passivos -->
    <div class="dossie-card" style="margin-bottom: 9px;">
      <div class="dossie-card-header">
        Custos Operacionais, Manutenção Familiar e Passivos Vigentes
      </div>
      <table class="dossie-table">
        <tbody>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px;">Custos Operacionais e Insumos da Atividade Agrícola:</td>
            <td style="padding: 4px 8px; text-align: right; color: #dc2626; font-weight: 600;">- ${formatBRL(operationalExp)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px;">Manutenção Familiar e Custo de Vida do Produtor:</td>
            <td style="padding: 4px 8px; text-align: right; color: #dc2626; font-weight: 600;">- ${formatBRL(familyCosts)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px;">Endividamento Bancário Vigente e Amortizações Anuais:</td>
            <td style="padding: 4px 8px; text-align: right; color: #dc2626; font-weight: 600;">- ${formatBRL(existingDebt)}</td>
          </tr>
          <tr class="dossie-total-row" style="background: #fef2f2; font-weight: bold; border-top: 1px solid #fca5a5;">
            <td style="padding: 7px 8px; color: #991b1b;">TOTAL DE OBRIGAÇÕES ANUAIS APURADAS:</td>
            <td style="padding: 7px 8px; text-align: right; color: #dc2626;">- ${formatBRL(operationalExp + familyCosts + existingDebt)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- VIII.3 Demonstrativo da Capacidade de Pagamento Líquida Anual (CP) -->
    <div style="border: 1.5px solid ${paymentCapacity > 0 ? '#1B4D3E' : (!hasRevenues ? '#d97706' : '#dc2626')}; border-radius: 4px; padding: 7px 10px; background: ${paymentCapacity > 0 ? '#f0fdf4' : (!hasRevenues ? '#fffbeb' : '#fef2f2')}; margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
        <span style="font-size: 9.5px; font-weight: bold; color: ${!hasRevenues ? '#92400e' : (paymentCapacity > 0 ? '#1B4D3E' : '#991b1b')}; text-transform: uppercase;">
          Demonstrativo da Capacidade de Pagamento Líquida Anual (CP)
        </span>
        <span class="${solvencyBadgeClass}">
          ${solvencyBadgeText}
        </span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 10px; font-size: 9px;">
        <div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e5e7eb; padding: 2.5px 0;">
            <span>(+) Total de Entradas Líquidas:</span>
            <strong style="color: #065f46;">${formatBRL(engineResult.icsd.totalNetInflows)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e5e7eb; padding: 2.5px 0;">
            <span>(-) Custos de Vida e Passivos:</span>
            <strong style="color: #dc2626;">- ${formatBRL(familyCosts + existingDebt)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 3px 0 0 0; font-weight: bold; font-size: 10px;">
            <span>(=) CAPACIDADE DE PAGAMENTO (CP):</span>
            <span style="color: ${paymentCapacity > 0 ? '#065f46' : (!hasRevenues ? '#92400e' : '#dc2626')};">${formatBRL(paymentCapacity)}</span>
          </div>
        </div>

        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px; padding: 5px 8px; font-size: 8.5px; color: #374151; line-height: 1.4;">
          <strong>Diagnóstico da Solvência Operacional:</strong><br />
          ${solvencyOpinionText}
        </div>
      </div>
    </div>

    ${renderPageFooter(orgName)}
  </div>
  `
}
