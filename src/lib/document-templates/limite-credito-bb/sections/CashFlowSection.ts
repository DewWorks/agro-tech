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
  return `
  <!-- =================================================================== -->
  <!-- PÁGINA 3: FLUXO DE CAIXA E DEMONSTRAÇÃO DA CAPACIDADE DE PAGAMENTO  -->
  <!-- =================================================================== -->
  <div class="dossie-page">
    ${renderPageHeader(
      'Demonstração do Fluxo de Caixa e Capacidade de Pagamento (CP)',
      'Confronto entre Receitas Agropecuárias, Custos de Produção, Despesas Familiares e Endividamento Vigente',
      3,
      4,
      'Fluxo de Caixa'
    )}

    <!-- 1. RECEITAS AGROPECUÁRIAS DETALHADAS -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 12px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase; font-size: 10.5px;">
        1. Receitas Agropecuárias Efetivas vs. Projetadas (Safras N-1 e N)
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 10px;">
        <thead>
          <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 5px 8px;">Cultura / Atividade Declarada</th>
            <th style="padding: 5px 8px; text-align: center;">Safra</th>
            <th style="padding: 5px 8px; text-align: right;">Quantidade</th>
            <th style="padding: 5px 8px; text-align: right;">Preço Médio</th>
            <th style="padding: 5px 8px; text-align: right;">Custo Produção</th>
            <th style="padding: 5px 8px; text-align: right;">Receita Líquida</th>
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
              <td style="padding: 5px 8px; font-weight: 600;">${r.description || 'Cultura Agrícola'}</td>
              <td style="padding: 5px 8px; text-align: center;">${r.realizationType === 'EFETIVA_HISTORICA' ? 'Efetiva (N-1)' : 'Projetada (N)'}</td>
              <td style="padding: 5px 8px; text-align: right;">${qty} ${r.unit || 'sc'}</td>
              <td style="padding: 5px 8px; text-align: right;">${formatBRL(prc)}</td>
              <td style="padding: 5px 8px; text-align: right; color: #dc2626;">- ${formatBRL(cost)}</td>
              <td style="padding: 5px 8px; text-align: right; font-weight: bold; color: #065f46;">${formatBRL(net)}</td>
            </tr>
            `
          }).join('') : `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 5px 8px; font-weight: 600;">Produção Agropecuária Comprovada (Safra Anterior)</td>
            <td style="padding: 5px 8px; text-align: center;">Efetiva (N-1)</td>
            <td style="padding: 5px 8px; text-align: right;">Conforme NF</td>
            <td style="padding: 5px 8px; text-align: right;">-</td>
            <td style="padding: 5px 8px; text-align: right; color: #dc2626;">- R$ 0,00</td>
            <td style="padding: 5px 8px; text-align: right; font-weight: bold; color: #065f46;">${formatBRL(effectiveAgroRev)}</td>
          </tr>
          ${projectedAgroRev > 0 ? `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 5px 8px; font-weight: 600;">Produção e Safra Vigente Estimada</td>
            <td style="padding: 5px 8px; text-align: center;">Projetada (N)</td>
            <td style="padding: 5px 8px; text-align: right;">Estimada</td>
            <td style="padding: 5px 8px; text-align: right;">-</td>
            <td style="padding: 5px 8px; text-align: right; color: #dc2626;">- ${formatBRL(operationalExp)}</td>
            <td style="padding: 5px 8px; text-align: right; font-weight: bold; color: #065f46;">${formatBRL(Math.max(0, projectedAgroRev - operationalExp))}</td>
          </tr>
          ` : ''}
          `}
          <tr style="background: #f3f4f6; font-weight: bold;">
            <td colspan="5" style="padding: 5px 8px; text-transform: uppercase;">Total de Entradas Líquidas Agropecuárias</td>
            <td style="padding: 5px 8px; text-align: right; color: #065f46; font-size: 11px;">${formatBRL(engineResult.icsd.netAgroRevenue)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 2. DESPESAS, ENCARGOS E PASSIVO BANCÁRIO -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 14px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase; font-size: 10.5px;">
        2. Deduções, Custo de Vida Familiar e Endividamento Bancário Vigente
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 10px;">
        <thead>
          <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 5px 8px;">Categoria do Encargo</th>
            <th style="padding: 5px 8px;">Descrição do Passivo / Credor</th>
            <th style="padding: 5px 8px; text-align: right;">Impacto Anual (R$)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 5px 8px; font-weight: 600;">Custos Operacionais & Insumos</td>
            <td style="padding: 5px 8px;">Fertilizantes, defensivos, sementes, combustível e manutenção</td>
            <td style="padding: 5px 8px; text-align: right; color: #dc2626;">- ${formatBRL(engineResult.icsd.totalProductionCosts)}</td>
          </tr>
          <tr style="border-top: 1px solid #f3f4f6;">
            <td style="padding: 5px 8px; font-weight: 600;">Manutenção Familiar / Pró-labore</td>
            <td style="padding: 5px 8px;">Custo de vida do produtor e manutenção da unidade familiar</td>
            <td style="padding: 5px 8px; text-align: right; color: #dc2626;">- ${formatBRL(familyCosts)}</td>
          </tr>
          <tr style="border-top: 1px solid #f3f4f6;">
            <td style="padding: 5px 8px; font-weight: 600;">Serviço da Dívida Preexistente</td>
            <td style="padding: 5px 8px;">Financiamentos vigentes informados no SCR / Banco Central</td>
            <td style="padding: 5px 8px; text-align: right; color: #dc2626;">- ${formatBRL(existingDebt)}</td>
          </tr>
          <tr style="background: #f3f4f6; font-weight: bold;">
            <td colspan="2" style="padding: 5px 8px; text-transform: uppercase;">Total de Saídas e Despesas Anuais</td>
            <td style="padding: 5px 8px; text-align: right; color: #dc2626; font-size: 11px;">- ${formatBRL(engineResult.icsd.totalExpenses)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 3. DEMONSTRAÇÃO SINTÉTICA DA CAPACIDADE DE PAGAMENTO (CP) -->
    <div style="border: 2px solid #1B4D3E; border-radius: 6px; padding: 12px; background: #fbfdfc;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #d1fae5; padding-bottom: 6px; margin-bottom: 8px;">
        <span style="font-size: 12px; font-weight: bold; color: #1B4D3E; text-transform: uppercase;">
          Demonstrativo da Capacidade de Pagamento Líquida Anual (CP)
        </span>
        <span class="${engineResult.icsd.paymentCapacity >= 0 ? 'badge-approved' : 'badge-rejected'}">
          ${engineResult.icsd.paymentCapacity >= 0 ? 'Fluxo Superavitário' : 'Fluxo Deficitário'}
        </span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 11px;">
        <div style="space-y: 4px;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e5e7eb; padding: 3px 0;">
            <span>(+) Total de Receitas Líquidas (Agro + Não Agro):</span>
            <strong style="color: #065f46;">${formatBRL(engineResult.icsd.totalNetInflows)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e5e7eb; padding: 3px 0;">
            <span>(-) Custos de Vida e Passivos Bancários:</span>
            <strong style="color: #dc2626;">- ${formatBRL(familyCosts + existingDebt)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0 0 0; font-weight: bold; font-size: 12px;">
            <span>(=) CAPACIDADE DE PAGAMENTO LÍQUIDA (CP):</span>
            <span style="color: ${engineResult.icsd.paymentCapacity >= 0 ? '#065f46' : '#dc2626'};">${formatBRL(engineResult.icsd.paymentCapacity)}</span>
          </div>
        </div>

        <div style="background: #ffffff; border: 1px solid #d1fae5; border-radius: 4px; padding: 8px; font-size: 10px; color: #374151; line-height: 1.4;">
          <strong>Parecer da Solvência Operacional:</strong>
          ${engineResult.icsd.paymentCapacity >= 0
            ? 'A exploração agropecuária do proponente demonstra solidez econômico-financeira, gerando margem operacional livre suficiente para absorver os encargos de novos financiamentos rurais sem comprometer a estabilidade do empreendimento.'
            : 'Atenção: Os fluxos projetados apontam déficit operacional. Recomenda-se alongamento de prazos ou revisão das estimativas de custeio.'}
        </div>
      </div>
    </div>

    ${renderPageFooter(orgName, 30)}
  </div>
  `
}
