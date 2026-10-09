import { formatBRL } from '../formatters'
import { renderPageHeader, renderPageFooter } from './HeaderSection'
import { FinancialEngineResult } from '@/lib/financial-engine'

export interface CashFlowSectionParams {
  customAgroRevenues: any[]
  effectiveAgroRev: number
  projectedAgroRev: number
  operationalExp: number
  familyCosts: number
  existingDebt: number
  engineResult: FinancialEngineResult
  orgName: string
}

export function renderCashFlowSection({
  customAgroRevenues,
  effectiveAgroRev,
  projectedAgroRev,
  operationalExp,
  familyCosts,
  existingDebt,
  engineResult,
  orgName,
}: CashFlowSectionParams): string {
  const hasRevenues = (engineResult.icsd.grossAgroRevenue || 0) > 0 || (engineResult.icsd.nonAgroRevenueTotal || 0) > 0
  const paymentCapacity = engineResult.icsd.paymentCapacity || 0
  const icsdValue = engineResult.icsd.icsdValue || 0

  let solvencyBadgeClass = 'badge-rejected'
  let solvencyBadgeText = 'Fluxo Deficitário'
  let solvencyOpinionText = ''

  if (!hasRevenues) {
    solvencyBadgeClass = 'badge-alert'
    solvencyBadgeText = 'Sem Receitas Comprovadas'
    solvencyOpinionText = 'Não foram computadas receitas operacionais ou histórico produtivo no exercício analisado. A solvência depende da comprovação de renda da safra (notas fiscais ou contratos de comercialização futura).'
  } else if (paymentCapacity <= 0) {
    solvencyBadgeClass = 'badge-rejected'
    solvencyBadgeText = 'Fluxo Deficitário'
    solvencyOpinionText = 'Atenção: Os fluxos projetados apontam déficit operacional. As despesas e encargos superam as entradas líquidas. Recomenda-se alongamento de prazos ou revisão das estimativas de custeio.'
  } else if (icsdValue < 1.20) {
    solvencyBadgeClass = 'badge-alert'
    solvencyBadgeText = 'Capacidade Insuficiente'
    solvencyOpinionText = `A receita operacional é positiva (CP de ${formatBRL(paymentCapacity)}), porém a Capacidade de Pagamento líquida apurada é inferior à margem de segurança regulamentar exigida pelo Banco do Brasil (ICSD apurado de ${icsdValue.toFixed(2)}x < 1,20x corte).`
  } else {
    solvencyBadgeClass = 'badge-approved'
    solvencyBadgeText = 'Fluxo Superavitário'
    solvencyOpinionText = `A exploração agropecuária do proponente demonstra solidez econômico-financeira (ICSD ${icsdValue.toFixed(2)}x), gerando margem operacional livre suficiente para absorver os encargos de novos financiamentos rurais sem comprometer a estabilidade do empreendimento.`
  }

  return `
  <!-- =================================================================== -->
  <!-- PÁGINA 3: FLUXO DE CAIXA E DEMONSTRAÇÃO DA CAPACIDADE DE PAGAMENTO  -->
  <!-- =================================================================== -->
  <div class="page-sheet dossie-page">
    ${renderPageHeader(
      'Demonstração do Fluxo de Caixa e Capacidade de Pagamento (CP)',
      'Confronto entre Receitas Agropecuárias, Custos de Produção, Despesas Familiares e Endividamento Vigente',
      3,
      4,
      'Fluxo de Caixa'
    )}

    <!-- 1. RECEITAS AGROPECUÁRIAS DETALHADAS -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 10px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 3px 8px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase; font-size: 10px;">
        1. Receitas Agropecuárias Efetivas vs. Projetadas (Safras N-1 e N)
      </div>
      <table style="width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 9.5px;">
        <thead>
          <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 4px 6px;">Cultura / Atividade Declarada</th>
            <th style="padding: 4px 6px; text-align: center;">Safra</th>
            <th style="padding: 4px 6px; text-align: right;">Quantidade</th>
            <th style="padding: 4px 6px; text-align: right;">Preço Médio</th>
            <th style="padding: 4px 6px; text-align: right;">Custo Produção</th>
            <th style="padding: 4px 6px; text-align: right;">Receita Líquida</th>
          </tr>
        </thead>
        <tbody>
          ${customAgroRevenues.length > 0 ? customAgroRevenues.map((r: any) => {
            const qty = Number(r.quantity) || 0
            const prc = Number(r.unitPrice) || 0
            const cost = Number(r.productionCostTotal) || 0
            const net = Math.max(0, qty * prc - cost)
            return `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 4px 6px; font-weight: 600;">${r.description || 'Cultura Agrícola'}</td>
              <td style="padding: 4px 6px; text-align: center;">${r.realizationType === 'EFETIVA_HISTORICA' ? 'Efetiva (N-1)' : 'Projetada (N)'}</td>
              <td style="padding: 4px 6px; text-align: right;">${qty} ${r.unit || 'sc'}</td>
              <td style="padding: 4px 6px; text-align: right;">${formatBRL(prc)}</td>
              <td style="padding: 4px 6px; text-align: right; color: #dc2626;">- ${formatBRL(cost)}</td>
              <td style="padding: 4px 6px; text-align: right; font-weight: bold; color: #065f46;">${formatBRL(net)}</td>
            </tr>
            `
          }).join('') : (hasRevenues ? `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 6px; font-weight: 600;">Produção Agropecuária Comprovada (Safra Anterior)</td>
            <td style="padding: 4px 6px; text-align: center;">Efetiva (N-1)</td>
            <td style="padding: 4px 6px; text-align: right;">Conforme NF</td>
            <td style="padding: 4px 6px; text-align: right;">-</td>
            <td style="padding: 4px 6px; text-align: right; color: #dc2626;">- R$ 0,00</td>
            <td style="padding: 4px 6px; text-align: right; font-weight: bold; color: #065f46;">${formatBRL(effectiveAgroRev)}</td>
          </tr>
          ${projectedAgroRev > 0 ? `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 6px; font-weight: 600;">Produção e Safra Vigente Estimada</td>
            <td style="padding: 4px 6px; text-align: center;">Projetada (N)</td>
            <td style="padding: 4px 6px; text-align: right;">Estimada</td>
            <td style="padding: 4px 6px; text-align: right;">-</td>
            <td style="padding: 4px 6px; text-align: right; color: #dc2626;">- ${formatBRL(operationalExp)}</td>
            <td style="padding: 4px 6px; text-align: right; font-weight: bold; color: #065f46;">${formatBRL(Math.max(0, projectedAgroRev - operationalExp))}</td>
          </tr>
          ` : ''}
          ` : `
          <tr>
            <td colspan="6" style="padding: 8px 6px; text-align: center; color: #92400e; background: #fffbeb; font-style: italic;">
              Atenção: Nenhuma receita agropecuária comprovada cadastrada no exercício. O limite de crédito dependerá do aditamento das notas de venda ou contratos futuros.
            </td>
          </tr>
          `)}
          <tr style="background: #f3f4f6; font-weight: bold;">
            <td colspan="5" style="padding: 4px 6px; text-transform: uppercase;">Total de Entradas Líquidas Agropecuárias</td>
            <td style="padding: 4px 6px; text-align: right; color: #065f46; font-size: 10.5px;">${formatBRL(engineResult.icsd.netAgroRevenue)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 2. DESPESAS, ENCARGOS E PASSIVO BANCÁRIO -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 10px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 3px 8px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase; font-size: 10px;">
        2. Demonstrativo das Despesas Operacionais, Familiares e Endividamento Bancário Vigente
      </div>
      <table style="width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 9.5px;">
        <thead>
          <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 4px 6px;">Categoria da Despesa / Obrigação Financeira</th>
            <th style="padding: 4px 6px;">Descrição do Compromisso</th>
            <th style="padding: 4px 6px; text-align: center;">Natureza</th>
            <th style="padding: 4px 6px; text-align: right;">Impacto Anual</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 6px; font-weight: 600;">Custeio Operacional da Atividade</td>
            <td style="padding: 4px 6px; color: #4b5563;">Insumos, combustíveis, sementes, rações e defensivos</td>
            <td style="padding: 4px 6px; text-align: center; color: #6b7280;">Operacional</td>
            <td style="padding: 4px 6px; text-align: right; color: #dc2626;">- ${formatBRL(operationalExp)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 6px; font-weight: 600;">Manutenção Familiar do Produtor</td>
            <td style="padding: 4px 6px; color: #4b5563;">Custo de vida familiar do proponente</td>
            <td style="padding: 4px 6px; text-align: center; color: #6b7280;">Familiar</td>
            <td style="padding: 4px 6px; text-align: right; color: #dc2626;">- ${formatBRL(familyCosts)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 6px; font-weight: 600;">Serviço da Dívida Existente (SCR/BACEN)</td>
            <td style="padding: 4px 6px; color: #4b5563;">Amortizações e juros de operações bancárias ativas</td>
            <td style="padding: 4px 6px; text-align: center; color: #6b7280;">Bancária</td>
            <td style="padding: 4px 6px; text-align: right; color: #dc2626;">- ${formatBRL(existingDebt)}</td>
          </tr>
          <tr style="background: #f3f4f6; font-weight: bold;">
            <td colspan="3" style="padding: 4px 6px; text-transform: uppercase;">Total de Saídas Operacionais e Passivos</td>
            <td style="padding: 4px 6px; text-align: right; color: #dc2626; font-size: 10.5px;">- ${formatBRL(engineResult.icsd.totalExpenses)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 3. DEMONSTRAÇÃO SINTÉTICA DA CAPACIDADE DE PAGAMENTO (CP) -->
    <div style="border: 2px solid ${!hasRevenues ? '#d97706' : (paymentCapacity > 0 ? '#1B4D3E' : '#dc2626')}; border-radius: 6px; padding: 10px; background: ${!hasRevenues ? '#fffdf7' : (paymentCapacity > 0 ? '#fbfdfc' : '#fef2f2')};">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 6px;">
        <span style="font-size: 11px; font-weight: bold; color: ${!hasRevenues ? '#92400e' : (paymentCapacity > 0 ? '#1B4D3E' : '#991b1b')}; text-transform: uppercase;">
          Demonstrativo da Capacidade de Pagamento Líquida Anual (CP)
        </span>
        <span class="${solvencyBadgeClass}">
          ${solvencyBadgeText}
        </span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 10px;">
        <div style="space-y: 3px;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e5e7eb; padding: 2px 0;">
            <span>(+) Total de Receitas Líquidas (Agro + Outras):</span>
            <strong style="color: #065f46;">${formatBRL(engineResult.icsd.totalNetInflows)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e5e7eb; padding: 2px 0;">
            <span>(-) Custos de Vida e Passivos Bancários:</span>
            <strong style="color: #dc2626;">- ${formatBRL(familyCosts + existingDebt)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 3px 0 0 0; font-weight: bold; font-size: 11px;">
            <span>(=) CAPACIDADE DE PAGAMENTO (CP):</span>
            <span style="color: ${paymentCapacity > 0 ? '#065f46' : (!hasRevenues ? '#92400e' : '#dc2626')};">${formatBRL(paymentCapacity)}</span>
          </div>
        </div>

        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px; padding: 6px 8px; font-size: 9.5px; color: #374151; line-height: 1.35;">
          <strong>Diagnóstico da Solvência Operacional:</strong><br />
          ${solvencyOpinionText}
        </div>
      </div>
    </div>

    ${renderPageFooter(orgName, 30)}
  </div>
  `
}
