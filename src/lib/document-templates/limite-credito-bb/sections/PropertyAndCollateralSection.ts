import { formatBRL } from '../formatters'
import { renderPageHeader, renderPageFooter } from './HeaderSection'
import { denormalizeCategoryBB, denormalizePurposeBB } from '@/lib/validations/livestock-mapper'
import { FinancialEngineResult } from '@/lib/financial-engine'

export interface PropertyAndCollateralSectionParams {
  prop: any
  totalArea: number
  pastArea: number
  agricArea: number
  resArea: number
  landValuePerHa: number
  totalLandValue: number
  improvementsValue: number
  cattleEstimatedValue: number
  totalCattle: number
  livestockItems: any[]
  hasLivestockItems: boolean
  cattleHeadValue: number
  urbanProperties: any[]
  vehicles: any[]
  engineResult: FinancialEngineResult
  creditLimitRequested: number
  orgName: string
}

export function renderPropertyAndCollateralSection({
  prop,
  totalArea,
  pastArea,
  agricArea,
  resArea,
  landValuePerHa,
  totalLandValue,
  improvementsValue,
  cattleEstimatedValue,
  totalCattle,
  livestockItems,
  hasLivestockItems,
  cattleHeadValue,
  urbanProperties,
  vehicles,
  engineResult,
  creditLimitRequested,
  orgName,
}: PropertyAndCollateralSectionParams): string {
  return `
  <!-- =================================================================== -->
  <!-- PÁGINA 2: DEMONSTRATIVO DE GARANTIAS REAIS & LOAN-TO-VALUE (LTV)    -->
  <!-- =================================================================== -->
  <div class="dossie-page">
    ${renderPageHeader(
      'Quadro Demonstrativo de Garantias Reais & Ponderação MCR',
      'Dimensionamento do Lastro Patrimonial (Rural, Urbano e Frotas) para Alavancagem Bancária',
      2,
      4,
      'Garantias & LTV'
    )}

    <!-- II. PATRIMÔNIO FUNDIÁRIO (TERRAS) -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 10px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase; font-size: 10.5px;">
        II - Discriminação de Terras e Uso Atual do Solo (${prop.name || 'Propriedade Principal'})
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 10px;">
        <thead>
          <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 4px 8px;">Uso / Discriminação do Solo</th>
            <th style="padding: 4px 8px; text-align: right;">Área (Hectares)</th>
            <th style="padding: 4px 8px; text-align: right;">Valor Unit. Médio</th>
            <th style="padding: 4px 8px; text-align: right;">Valor Total Declarado</th>
            <th style="padding: 4px 8px; text-align: right;">Margem Aceitável (65%)</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px;">Pastagem Formada / Artificial</td>
            <td style="padding: 4px 8px; text-align: right;">${pastArea.toFixed(2)} ha</td>
            <td style="padding: 4px 8px; text-align: right;">${formatBRL(landValuePerHa)}</td>
            <td style="padding: 4px 8px; text-align: right;">${formatBRL(pastArea * landValuePerHa)}</td>
            <td style="padding: 4px 8px; text-align: right; color: #065f46;">${formatBRL((pastArea * landValuePerHa) * 0.65)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px;">Agricultura / Lavoura Anual</td>
            <td style="padding: 4px 8px; text-align: right;">${agricArea.toFixed(2)} ha</td>
            <td style="padding: 4px 8px; text-align: right;">${formatBRL(landValuePerHa * 1.2)}</td>
            <td style="padding: 4px 8px; text-align: right;">${formatBRL(agricArea * landValuePerHa * 1.2)}</td>
            <td style="padding: 4px 8px; text-align: right; color: #065f46;">${formatBRL((agricArea * landValuePerHa * 1.2) * 0.65)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px;">Reserva Legal e APP</td>
            <td style="padding: 4px 8px; text-align: right;">${resArea.toFixed(2)} ha</td>
            <td style="padding: 4px 8px; text-align: right;">${formatBRL(landValuePerHa * 0.4)}</td>
            <td style="padding: 4px 8px; text-align: right;">${formatBRL(resArea * landValuePerHa * 0.4)}</td>
            <td style="padding: 4px 8px; text-align: right; color: #065f46;">${formatBRL((resArea * landValuePerHa * 0.4) * 0.65)}</td>
          </tr>
          <tr style="background: #f3f4f6; font-weight: bold;">
            <td style="padding: 4px 8px;">ÁREA TOTAL / VALOR TERRA NUA</td>
            <td style="padding: 4px 8px; text-align: right;">${totalArea.toFixed(2)} ha</td>
            <td style="padding: 4px 8px; text-align: right;">-</td>
            <td style="padding: 4px 8px; text-align: right; color: #1B4D3E;">${formatBRL(totalLandValue)}</td>
            <td style="padding: 4px 8px; text-align: right; color: #065f46;">${formatBRL(totalLandValue * 0.65)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- III. BENFEITORIAS E INSTALAÇÕES (TABELA BB) -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 10px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase; font-size: 10.5px;">
        III - Benfeitorias e Instalações (Referência Banco do Brasil)
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 10px;">
        <thead>
          <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 4px 8px;">Especificação da Instalação</th>
            <th style="padding: 4px 8px;">Dimensão / Quant.</th>
            <th style="padding: 4px 8px;">Estado de Conservação</th>
            <th style="padding: 4px 8px; text-align: right;">Valor Estimado</th>
            <th style="padding: 4px 8px; text-align: right;">Margem MCR (65%)</th>
          </tr>
        </thead>
        <tbody>
          ${improvementsValue > 0 ? `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px;">Instalações, Galpões, Currais e Cercas Avaliadas</td>
            <td style="padding: 4px 8px;">Conforme Vistoria</td>
            <td style="padding: 4px 8px;">Bom Estado Geral</td>
            <td style="padding: 4px 8px; text-align: right;">${formatBRL(improvementsValue)}</td>
            <td style="padding: 4px 8px; text-align: right; color: #065f46;">${formatBRL(improvementsValue * 0.65)}</td>
          </tr>
          ` : `
          <tr>
            <td colspan="5" style="padding: 6px 8px; text-align: center; color: #6b7280; font-style: italic;">
              Nenhuma benfeitoria adicional informada (R$ 0,00).
            </td>
          </tr>
          `}
          <tr style="background: #f3f4f6; font-weight: bold;">
            <td colspan="3" style="padding: 4px 8px;">SUBTOTAL BENFEITORIAS</td>
            <td style="padding: 4px 8px; text-align: right; color: #1B4D3E;">${formatBRL(improvementsValue)}</td>
            <td style="padding: 4px 8px; text-align: right; color: #065f46;">${formatBRL(improvementsValue * 0.65)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- IV. SEMOVENTES (REBANHO BOVINO) -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 10px; overflow: hidden; page-break-inside: avoid; break-inside: avoid;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase; display: flex; justify-content: space-between; align-items: center; font-size: 10.5px;">
        <span>IV - Semoventes e Rebanho Bovino</span>
        <span style="font-size: 9.5px; color: #4b5563;">Registro ADAPEC: ${prop.livestockData?.brandRegistrationAdapec || 'Não informado / Pendente'}</span>
      </div>

      ${hasLivestockItems ? `
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 9.5px;">
        <thead>
          <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 9px; text-transform: uppercase; color: #374151;">
            <th style="padding: 4px 6px;">Categoria (BB)</th>
            <th style="padding: 4px 6px;">Finalidade</th>
            <th style="padding: 4px 6px;">Raça</th>
            <th style="padding: 4px 6px; text-align: center;">Qtd (Cab.)</th>
            <th style="padding: 4px 6px; text-align: center;">Idade</th>
            <th style="padding: 4px 6px; text-align: center;">Peso Médio</th>
            <th style="padding: 4px 6px; text-align: right;">Valor Unit.</th>
            <th style="padding: 4px 6px; text-align: right;">Total Estimado</th>
            <th style="padding: 4px 6px;">Marca e Local</th>
          </tr>
        </thead>
        <tbody>
          ${livestockItems.map((item: any) => {
            const qty = Number(item.quantity) || 0
            const unitVal = Number(item.unitValue) || cattleHeadValue || 0
            const tot = qty * unitVal
            const catLabel = item.category || denormalizeCategoryBB(item.categoryBB) || item.categoryBB || 'Bovino'
            const purpLabel = denormalizePurposeBB(item.purposeBB) || item.purposeBB || 'Produção'
            const brandInfo = [item.brandingType, item.brandingLocation].filter(Boolean).join(' - ') || prop.livestockData?.brandLocation || 'Conforme Ficha'
            return `
            <tr style="border-bottom: 1px solid #f3f4f6; page-break-inside: avoid; break-inside: avoid;">
              <td style="padding: 4px 6px; font-weight: 600; color: #111827;">${catLabel}</td>
              <td style="padding: 4px 6px; color: #4b5563;">${purpLabel}</td>
              <td style="padding: 4px 6px;">${item.breed || 'Nelore PO'}</td>
              <td style="padding: 4px 6px; text-align: center; font-weight: bold;">${qty}</td>
              <td style="padding: 4px 6px; text-align: center;">${item.ageMonths ? `${item.ageMonths} m` : '-'}</td>
              <td style="padding: 4px 6px; text-align: center;">${item.avgWeightKg ? `${item.avgWeightKg} kg` : '-'}</td>
              <td style="padding: 4px 6px; text-align: right;">${formatBRL(unitVal)}</td>
              <td style="padding: 4px 6px; text-align: right; font-weight: 600; color: #1B4D3E;">${formatBRL(tot)}</td>
              <td style="padding: 4px 6px; font-size: 8.5px; color: #6b7280;">${brandInfo}</td>
            </tr>
            `
          }).join('')}
          <tr style="background: #f3f4f6; font-weight: bold; border-top: 1px solid #d1d5db;">
            <td colspan="3" style="padding: 4px 6px; text-transform: uppercase;">Total Rebanho Declarado</td>
            <td style="padding: 4px 6px; text-align: center; color: #1B4D3E; font-size: 10.5px;">${totalCattle} cab</td>
            <td colspan="3"></td>
            <td style="padding: 4px 6px; text-align: right; color: #1B4D3E; font-size: 10.5px;">${formatBRL(cattleEstimatedValue)}</td>
            <td style="font-size: 9px; color: #065f46; font-weight: bold;">Margem 50%: ${formatBRL(cattleEstimatedValue * 0.50)}</td>
          </tr>
        </tbody>
      </table>
      ` : `
      <div style="padding: 8px 10px; display: flex; justify-content: space-between; font-weight: bold;">
        <span>Total de Cabeças Cadastradas: ${totalCattle} cab</span>
        <span style="color: #1B4D3E;">Valor Estimado Rebanho: ${formatBRL(cattleEstimatedValue)}</span>
      </div>
      `}
    </div>

    <!-- V. BENS SECUNDÁRIOS DE GARANTIA (URBANOS & VEÍCULOS) -->
    ${(urbanProperties.length > 0 || vehicles.length > 0) ? `
    <div style="border: 1px solid #3b82f6; border-radius: 4px; margin-bottom: 10px; overflow: hidden; background: #f8fafc;">
      <div style="background: #1e40af; color: #ffffff; padding: 4px 10px; font-weight: bold; text-transform: uppercase; font-size: 10px; display: flex; justify-content: space-between;">
        <span>V - Bens Complementares de Lastro (Imóveis Urbanos & Veículos)</span>
        <span style="font-size: 9px; color: #93c5fd;">Garantia Secundária</span>
      </div>
      <div style="padding: 6px 10px; font-size: 9.5px;">
        ${urbanProperties.map((u: any, idx: number) => `
          <div style="display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px dashed #e2e8f0;">
            <span><strong>Imóvel Urbano ${idx + 1}:</strong> ${u.description || 'Residencial'} (${u.city || ''}/${u.state || ''}) ${u.hasLien ? '<span style="color:red">[Alienado]</span>' : '<span style="color:green">[Livre]</span>'}</span>
            <span>Valor: ${formatBRL(u.marketValue)} | Margem 50%: <strong style="color: #1e40af;">${formatBRL(u.hasLien ? 0 : Number(u.marketValue) * 0.50)}</strong></span>
          </div>
        `).join('')}
        ${vehicles.map((v: any, idx: number) => `
          <div style="display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px dashed #e2e8f0;">
            <span><strong>Veículo ${idx + 1}:</strong> ${v.brand || ''} ${v.model || 'Utilitário'} ${v.licensePlate ? `(${v.licensePlate})` : ''} ${v.hasLien ? '<span style="color:red">[Alienado]</span>' : '<span style="color:green">[Livre]</span>'}</span>
            <span>Valor: ${formatBRL(v.declaredValue)} | Margem 40%: <strong style="color: #1e40af;">${formatBRL(v.hasLien ? 0 : Number(v.declaredValue) * 0.40)}</strong></span>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- SÍNTESE DO BALANÇO DE GARANTIAS & COBERTURA LTV -->
    <div style="border: 1.5px solid #1B4D3E; border-radius: 4px; padding: 10px; background: #f0fdf4;">
      <h3 style="margin: 0 0 6px 0; font-size: 11px; color: #1B4D3E; font-weight: bold; text-transform: uppercase; display: flex; justify-content: space-between;">
        <span>Consolidação de Garantias e Balanço Loan-to-Value (LTV)</span>
        <span class="${engineResult.ltv.isApproved ? 'badge-approved' : 'badge-rejected'}">
          ${engineResult.ltv.isApproved ? 'Garantias Aprovadas' : 'Garantias Insuficientes'}
        </span>
      </h3>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center; margin-top: 6px;">
        <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 5px; border-radius: 4px;">
          <span style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Patrimônio Total Declarado</span>
          <strong style="font-size: 12px; color: #111827; display: block;">${formatBRL(engineResult.ltv.totalDeclaredCollateral)}</strong>
        </div>
        <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 5px; border-radius: 4px;">
          <span style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Lastro Ponderado Aceito (MCR)</span>
          <strong style="font-size: 12px; color: #065f46; display: block;">${formatBRL(engineResult.ltv.totalAcceptableCollateral)}</strong>
        </div>
        <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 5px; border-radius: 4px;">
          <span style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Crédito Pretendido</span>
          <strong style="font-size: 12px; color: #1B4D3E; display: block;">${formatBRL(creditLimitRequested)}</strong>
        </div>
        <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 5px; border-radius: 4px;">
          <span style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Índice de Cobertura (LTV)</span>
          <strong style="font-size: 13px; color: ${engineResult.ltv.isApproved ? '#065f46' : '#dc2626'}; display: block;">
            ${engineResult.ltv.coverageRatioPercent.toFixed(1)}%
          </strong>
        </div>
      </div>
      <p style="margin: 6px 0 0 0; font-size: 9.5px; color: #4b5563;">
        ${engineResult.ltv.opinionText}
      </p>
    </div>

    ${renderPageFooter(orgName, 20)}
  </div>
  `
}
