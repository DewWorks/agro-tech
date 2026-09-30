import { formatBRL } from '../formatters'
import { FinancialEngineResult } from '@/lib/financial-engine'

export interface AmortizationAndIcsdSectionParams {
  system: string
  interestRate: number
  termMonths: number
  graceMonths: number
  engineResult: FinancialEngineResult
}

export function renderAmortizationAndIcsdSection({
  system,
  interestRate,
  termMonths,
  graceMonths,
  engineResult,
}: AmortizationAndIcsdSectionParams): string {
  return `
    <!-- 1. CRONOGRAMA DE AMORTIZAÇÃO (PRICE / SAC) -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 12px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase; font-size: 10.5px; display: flex; justify-content: space-between;">
        <span>1. Cronograma Estimado do Serviço da Dívida (Tabela ${system})</span>
        <span style="font-size: 10px; color: #4b5563;">Taxa: ${interestRate}% a.a. • Prazo: ${termMonths} meses</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 9.5px;">
        <thead>
          <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #374151;">
            <th style="padding: 4px 6px;">Período / Ano</th>
            <th style="padding: 4px 6px; text-align: right;">Saldo Inicial</th>
            <th style="padding: 4px 6px; text-align: right;">Juros Anuais</th>
            <th style="padding: 4px 6px; text-align: right;">Amortização</th>
            <th style="padding: 4px 6px; text-align: right;">Parcela Total</th>
            <th style="padding: 4px 6px; text-align: right;">Saldo Final</th>
          </tr>
        </thead>
        <tbody>
          ${engineResult.amortization.schedule.slice(0, 10).map((row) => `
          <tr style="border-bottom: 1px solid #f3f4f6; ${row.period === (graceMonths > 0 ? Math.ceil(graceMonths / 12) + 1 : 1) ? 'background: #fefce8; font-weight: 600;' : ''}">
            <td style="padding: 4px 6px;">
              Ano ${row.period} ${row.isGracePeriod ? '<span style="font-size:8px; color:#d97706;">(Carência)</span>' : ''}
              ${row.period === (graceMonths > 0 ? Math.ceil(graceMonths / 12) + 1 : 1) ? '<span style="font-size:8px; color:#b45309;">(Estresse)</span>' : ''}
            </td>
            <td style="padding: 4px 6px; text-align: right;">${formatBRL(row.openingBalance)}</td>
            <td style="padding: 4px 6px; text-align: right; color: #dc2626;">${formatBRL(row.interest)}</td>
            <td style="padding: 4px 6px; text-align: right;">${formatBRL(row.amortization)}</td>
            <td style="padding: 4px 6px; text-align: right; font-weight: bold; color: #1B4D3E;">${formatBRL(row.totalPayment)}</td>
            <td style="padding: 4px 6px; text-align: right;">${formatBRL(row.closingBalance)}</td>
          </tr>
          `).join('')}
          <tr style="background: #f3f4f6; font-weight: bold;">
            <td colspan="4" style="padding: 5px 6px; text-transform: uppercase;">Parcela Anual Crítica de Estresse Financeiro:</td>
            <td colspan="2" style="padding: 5px 6px; text-align: right; color: #1B4D3E; font-size: 11px;">
              ${formatBRL(engineResult.amortization.annualDebtService)} / ano
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 2. ÍNDICE DE COBERTURA DO SERVIÇO DA DÍVIDA (ICSD) -->
    <div style="border: 1.5px solid ${engineResult.icsd.isApproved ? '#1B4D3E' : '#dc2626'}; border-radius: 4px; padding: 10px; margin-bottom: 12px; background: ${engineResult.icsd.isApproved ? '#f0fdf4' : '#fef2f2'};">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #111827;">
            2. Índice de Cobertura do Serviço da Dívida (ICSD)
          </span>
          <span style="font-size: 9.5px; color: #6b7280; display: block;">
            Fórmula: ICSD = Capacidade de Pagamento (CP) ÷ Parcela Anual Crítica (SD)
          </span>
        </div>
        <span class="${engineResult.icsd.classification === 'APROVADO_CONFORTAVEL' ? 'badge-approved' : engineResult.icsd.classification === 'APROVADO_ALERTA' ? 'badge-alert' : 'badge-rejected'}">
          ${engineResult.icsd.isApproved ? 'Aprovado perante o MCR' : 'Reprovado no Teste de Estresse'}
        </span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; text-align: center;">
        <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 6px; border-radius: 4px;">
          <span style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Capacidade de Pagamento (CP)</span>
          <strong style="font-size: 12px; color: #065f46; display: block;">${formatBRL(engineResult.icsd.paymentCapacity)}</strong>
        </div>
        <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 6px; border-radius: 4px;">
          <span style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Parcela Anual da Dívida (SD)</span>
          <strong style="font-size: 12px; color: #dc2626; display: block;">${formatBRL(engineResult.amortization.annualDebtService)}</strong>
        </div>
        <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 6px; border-radius: 4px;">
          <span style="font-size: 9px; color: #6b7280; text-transform: uppercase;">ICSD Apurado (Corte ≥ 1,20)</span>
          <strong style="font-size: 14px; color: ${engineResult.icsd.isApproved ? '#065f46' : '#dc2626'}; display: block;">
            ${engineResult.icsd.icsdValue.toFixed(2)}x
          </strong>
        </div>
      </div>
      <p style="margin: 6px 0 0 0; font-size: 9.5px; color: #374151;">
        ${engineResult.icsd.opinionText}
      </p>
    </div>

    <!-- 3. PARECER CONCLUSIVO DE RISCO BANCÁRIO -->
    <div style="border: 1px solid #111827; border-radius: 4px; padding: 10px; margin-bottom: 16px; background: #f9fafb;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #111827;">
          3. Parecer Técnico Conclusivo e Parecer Automatizado de Risco
        </span>
        <span class="${engineResult.overallStatus === 'APROVADO' ? 'badge-approved' : engineResult.overallStatus === 'APROVADO_COM_RESTRICOES' ? 'badge-alert' : 'badge-rejected'}">
          ${engineResult.overallStatus.replace(/_/g, ' ')}
        </span>
      </div>
      <p style="margin: 0; font-size: 10px; color: #1f2937; text-align: justify; line-height: 1.45;">
        ${engineResult.summaryOpinion}
      </p>
      <div style="margin-top: 6px; font-size: 8.5px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 4px;">
        ${engineResult.regulatoryNotes.join(' • ')}
      </div>
    </div>
  `
}
