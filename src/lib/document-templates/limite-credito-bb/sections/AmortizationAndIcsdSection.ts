import { formatBRL } from '../formatters'
import { FinancialEngineResult } from '@/lib/financial-engine'

export interface AmortizationAndIcsdSectionParams {
  system: string
  interestRate: number
  termMonths: number
  graceMonths: number
  engineResult: FinancialEngineResult
  creditLimitRequested?: number
}

export function renderAmortizationAndIcsdSection({
  system,
  interestRate,
  termMonths,
  graceMonths,
  engineResult,
  creditLimitRequested,
}: AmortizationAndIcsdSectionParams): string {
  const requestedAmount = Number(creditLimitRequested || engineResult.ltv.requestedAmount || 0)
  const annualDebtService = Number(engineResult.amortization.annualDebtService || 0)
  const paymentCapacity = Number(engineResult.icsd.paymentCapacity || 0)
  const targetCPForApproval = annualDebtService * 1.20
  const cpDeficit = Math.max(0, targetCPForApproval - paymentCapacity)
  const maxCreditSupportedWithCurrentCP = paymentCapacity > 0 && annualDebtService > 0 && requestedAmount > 0
    ? (paymentCapacity / 1.20) / (annualDebtService / requestedAmount)
    : 0
  const hasRevenues = (engineResult.icsd.grossAgroRevenue || 0) > 0 || (engineResult.icsd.nonAgroRevenueTotal || 0) > 0

  return `
    <!-- 1. CRONOGRAMA DE AMORTIZAÇÃO (PRICE / SAC) -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 8px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 3px 8px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase; font-size: 10px; display: flex; justify-content: space-between;">
        <span>1. Cronograma Estimado do Serviço da Dívida (Tabela ${system})</span>
        <span style="font-size: 9px; color: #4b5563;">Taxa: ${interestRate}% a.a. • Prazo: ${termMonths} meses</span>
      </div>
      <table style="width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 9px;">
        <thead>
          <tr style="background: #f9fafb; color: #374151;">
            <th style="width: 16%; padding: 8px 10px; text-align: left; vertical-align: middle; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Período</th>
            <th style="width: 21%; padding: 8px 10px; text-align: right; vertical-align: middle; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Saldo Inicial</th>
            <th style="width: 18%; padding: 8px 10px; text-align: right; vertical-align: middle; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Juros</th>
            <th style="width: 18%; padding: 8px 10px; text-align: right; vertical-align: middle; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Amortização</th>
            <th style="width: 27%; padding: 8px 10px; text-align: right; vertical-align: middle; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Parcela Total</th>
          </tr>
        </thead>
        <tbody>
          ${engineResult.amortization.schedule.slice(0, 5).map((row) => `
          <tr style="border-bottom: 1px solid #f3f4f6; ${row.period === (graceMonths > 0 ? Math.ceil(graceMonths / 12) + 1 : 1) ? 'background: #fefce8; font-weight: 600;' : ''}">
            <td style="padding: 8px 10px; vertical-align: middle; border-bottom: 1px solid #f3f4f6; white-space: nowrap;">
              Ano ${row.period} ${row.isGracePeriod ? '<span style="font-size:7.5px; color:#d97706;">(Carência)</span>' : ''}
              ${row.period === (graceMonths > 0 ? Math.ceil(graceMonths / 12) + 1 : 1) ? '<span style="font-size:7.5px; color:#b45309;">(Estresse)</span>' : ''}
            </td>
            <td style="padding: 8px 10px; text-align: right; vertical-align: middle; border-bottom: 1px solid #f3f4f6; white-space: nowrap;">${formatBRL(row.openingBalance)}</td>
            <td style="padding: 8px 10px; text-align: right; color: #dc2626; vertical-align: middle; border-bottom: 1px solid #f3f4f6; white-space: nowrap;">${formatBRL(row.interest)}</td>
            <td style="padding: 8px 10px; text-align: right; vertical-align: middle; border-bottom: 1px solid #f3f4f6; white-space: nowrap;">${formatBRL(row.amortization)}</td>
            <td style="padding: 8px 10px; text-align: right; font-weight: bold; color: #1B4D3E; vertical-align: middle; border-bottom: 1px solid #f3f4f6; white-space: nowrap;">${formatBRL(row.totalPayment)}</td>
          </tr>
          `).join('')}
          <tr style="background: #f3f4f6; font-weight: bold; border-top: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db;">
            <td colspan="3" style="padding: 8px 10px; text-transform: uppercase; vertical-align: middle; white-space: nowrap;">Parcela Anual Crítica de Estresse:</td>
            <td colspan="2" style="padding: 8px 10px; text-align: right; color: #1B4D3E; font-size: 10.5px; vertical-align: middle; white-space: nowrap;">
              ${formatBRL(engineResult.amortization.annualDebtService)} / ano
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 2. ÍNDICE DE COBERTURA DO SERVIÇO DA DÍVIDA (ICSD) -->
    <div style="border: 1.5px solid ${engineResult.icsd.isApproved ? '#1B4D3E' : '#dc2626'}; border-radius: 4px; padding: 6px 10px; margin-bottom: 8px; background: ${engineResult.icsd.isApproved ? '#f0fdf4' : '#fef2f2'};">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #111827;">
            2. Índice de Cobertura do Serviço da Dívida (ICSD)
          </span>
          <span style="font-size: 8.5px; color: #6b7280; display: block;">
            Fórmula MCR: ICSD = Capacidade de Pagamento (CP) ÷ Parcela Anual Crítica (SD) • Trava Regulamentar: ≥ 1,20x
          </span>
        </div>
        <span class="${engineResult.icsd.classification === 'APROVADO_CONFORTAVEL' ? 'badge-approved' : engineResult.icsd.classification === 'APROVADO_ALERTA' ? 'badge-alert' : 'badge-rejected'}">
          ${engineResult.icsd.isApproved ? 'Aprovado perante o MCR' : 'Reprovado no Teste de Estresse'}
        </span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 6px; text-align: center;">
        <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 4px; border-radius: 4px;">
          <span style="font-size: 8px; color: #6b7280; text-transform: uppercase;">Capacidade de Pagamento (CP)</span>
          <strong style="font-size: 11px; color: ${paymentCapacity > 0 ? '#065f46' : '#dc2626'}; display: block;">${formatBRL(paymentCapacity)}</strong>
        </div>
        <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 4px; border-radius: 4px;">
          <span style="font-size: 8px; color: #6b7280; text-transform: uppercase;">Parcela Anual da Dívida (SD)</span>
          <strong style="font-size: 11px; color: #dc2626; display: block;">${formatBRL(engineResult.amortization.annualDebtService)}</strong>
        </div>
        <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 4px; border-radius: 4px;">
          <span style="font-size: 8px; color: #6b7280; text-transform: uppercase;">ICSD Apurado (Corte ≥ 1,20)</span>
          <strong style="font-size: 12.5px; color: ${engineResult.icsd.isApproved ? '#065f46' : '#dc2626'}; display: block;">
            ${engineResult.icsd.icsdValue.toFixed(2)}x
          </strong>
        </div>
      </div>
      <p style="margin: 4px 0 0 0; font-size: 8.5px; color: #374151;">
        ${engineResult.icsd.opinionText}
      </p>
    </div>

    <!-- 3. DIRETRIZES PARA REGULARIZAÇÃO E ENQUADRAMENTO TÉCNICO (BLOCO PRESCRITIVO) -->
    <div style="border: 1px solid #111827; border-radius: 4px; padding: 8px 10px; margin-bottom: 10px; background: #f9fafb;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
        <span style="font-size: 10.5px; font-weight: bold; text-transform: uppercase; color: #111827;">
          3. Diretrizes para Regularização e Enquadramento Técnico
        </span>
        <span class="${engineResult.overallStatus === 'APROVADO' ? 'badge-approved' : engineResult.overallStatus === 'APROVADO_COM_RESTRICOES' ? 'badge-alert' : 'badge-rejected'}">
          ${engineResult.overallStatus.replace(/_/g, ' ')}
        </span>
      </div>

      <!-- Quadro Analítico Prescritivo -->
      <div style="display: grid; grid-template-columns: 1fr 1.2fr 1fr; gap: 6px; margin-bottom: 6px; font-size: 8.5px;">
        <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 4px 6px; border-radius: 4px;">
          <div style="color: #6b7280; font-size: 7.5px; text-transform: uppercase;">Lastro Ofertado vs. Exigido</div>
          <div style="font-weight: bold; color: #111827; font-size: 9.5px;">${formatBRL(engineResult.ltv.totalAcceptableCollateral)}</div>
          <div style="font-size: 7.5px; color: ${engineResult.ltv.isApproved ? '#065f46' : '#dc2626'}; font-weight: bold;">
            ${engineResult.ltv.isApproved ? `Conforme (${engineResult.ltv.coverageRatioPercent.toFixed(1)}%)` : `Insuficiente`}
          </div>
        </div>

        <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 4px 6px; border-radius: 4px;">
          <div style="color: #6b7280; font-size: 7.5px; text-transform: uppercase;">Capacidade Pagamento (CP vs. BB)</div>
          <div style="font-weight: bold; color: #111827; font-size: 9.5px;">
            ${formatBRL(paymentCapacity)} <span style="font-weight: normal; color: #6b7280; font-size: 8px;">(Exig: ${formatBRL(targetCPForApproval)})</span>
          </div>
          <div style="font-size: 7.5px; color: ${cpDeficit > 0 ? '#dc2626' : '#065f46'}; font-weight: bold;">
            ${cpDeficit > 0 ? `Déficit apurado: ${formatBRL(cpDeficit)}` : `Margem regulamentar atendida`}
          </div>
        </div>

        <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 4px 6px; border-radius: 4px;">
          <div style="color: #6b7280; font-size: 7.5px; text-transform: uppercase;">Limite Suportado c/ CP Atual</div>
          <div style="font-weight: bold; color: ${maxCreditSupportedWithCurrentCP > 0 ? '#1B4D3E' : '#dc2626'}; font-size: 9.5px;">
            ${maxCreditSupportedWithCurrentCP > 0 ? formatBRL(maxCreditSupportedWithCurrentCP) : 'R$ 0,00'}
          </div>
          <div style="font-size: 7.5px; color: #6b7280;">Trava MCR ICSD ≥ 1,20x</div>
        </div>
      </div>

      <!-- Parecer do Projetista e Orientações para Protocolo -->
      <div style="background: #ffffff; border-left: 3px solid ${engineResult.overallStatus === 'APROVADO' ? '#065f46' : '#dc2626'}; padding: 5px 8px; font-size: 8.5px; color: #1f2937; line-height: 1.35;">
        <strong style="color: #111827;">Parecer do Projetista & Orientações para Protocolo Bancário:</strong>
        <p style="margin: 2px 0 3px 0;">
          ${cpDeficit > 0 
            ? `O proponente possui lastro patrimonial sólido (${formatBRL(engineResult.ltv.totalAcceptableCollateral)} em garantias regulamentares), porém ${!hasRevenues ? 'não computou receitas operacionais no exercício' : 'a capacidade de pagamento apurada é insuficiente para suportar a parcela anual de ' + formatBRL(annualDebtService)}. Para deferimento pelo Banco do Brasil, é indispensável aditar ao cadastro notas fiscais de venda da safra passada ou contratos futuros com margem líquida comprovada de no mínimo <strong>${formatBRL(targetCPForApproval)}</strong>.`
            : `Proposta técnica em plena conformidade com as exigências normativas do MCR. O fluxo de caixa operacional suporta o serviço da dívida com margem de segurança regulamentar.`
          }
        </p>
        <div style="font-size: 8px; color: #4b5563;">
          <strong>Alternativas de Viabilização Técnica:</strong> 
          ${termMonths <= 12 ? `Simular extensão de prazo da operação (ex: 24 a 36 meses se a linha permitir), reduzindo a parcela anual do encargo; ou ` : ``}
          adequar o montante pretendido à capacidade de pagamento atual${maxCreditSupportedWithCurrentCP > 0 ? ` (teto viável: ${formatBRL(maxCreditSupportedWithCurrentCP)})` : ''}.
        </div>
      </div>

      <div style="margin-top: 4px; font-size: 7.5px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 2px;">
        ${engineResult.regulatoryNotes.join(' • ')}
      </div>
    </div>
  `
}
