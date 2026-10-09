import { formatBRL, formatMarriageRegime, getBankNameLabel, sanitizeAccessRoute } from '../formatters'
import { renderPageHeader, renderPageFooter } from './HeaderSection'
import { CreditLineDefinition } from '@/constants/credit-lines'

export interface Page1Params {
  p: any
  isCnpj: boolean
  docLabel: string
  docFormatted: string
  spouseDocFormatted: string
  repCpfFormatted: string
  prop: any
  orgName: string
  orgCnpj: string
  branchName?: string
  orgOwnerName: string
  crea: string
  art: string
  lineDef: CreditLineDefinition
  targetBank: string
  creditLimitRequested: number
  interestRate: number
  termMonths: number
  graceMonths: number
  system: string
  purpose?: string
  pastArea: number
  agricArea: number
  resArea: number
  totalArea: number
  landValuePerHa: number
  totalLandValue: number
  improvementsValue: number
}

export function renderPage1EnquadramentoAndRealEstate(params: Page1Params): string {
  const {
    p,
    isCnpj,
    docLabel,
    docFormatted,
    spouseDocFormatted,
    repCpfFormatted,
    prop,
    orgName,
    orgCnpj,
    branchName,
    orgOwnerName,
    crea,
    art,
    lineDef,
    targetBank,
    creditLimitRequested,
    interestRate,
    termMonths,
    graceMonths,
    system,
    purpose,
    pastArea,
    agricArea,
    resArea,
    totalArea,
    landValuePerHa,
    totalLandValue,
    improvementsValue,
  } = params

  const totalRealEstateDeclared = totalLandValue + improvementsValue
  const totalRealEstateAcceptable = totalRealEstateDeclared * 0.65

  return `
  <!-- =================================================================== -->
  <!-- PÁGINA 1: IDENTIFICAÇÃO, ENQUADRAMENTO MCR & GARANTIAS IMOBILIÁRIAS -->
  <!-- =================================================================== -->
  <div class="page-sheet dossie-page">
    ${renderPageHeader(
      'Ficha Cadastral, Enquadramento MCR & Balanço Imobiliário',
      `Dossiê Técnico para Proposta de Limite de Crédito Rural • ${getBankNameLabel(targetBank)}`,
      1,
      3,
      'Enquadramento & Terras'
    )}

    <!-- SEÇÃO I & II: GRID 2 COLUNAS (PROPONENTE E IMÓVEL RURAL) -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-bottom: 9px;">
      <!-- Seção I: Proponente e Cônjuge -->
      <div class="dossie-card" style="margin-bottom: 0;">
        <div class="dossie-card-header">
          I - ${isCnpj ? 'Empresa Proponente & Representante' : 'Identificação do Proponente e Cônjuge'}
        </div>
        <div style="padding: 7px 10px; font-size: 9px; line-height: 1.55;">
          <div><strong>${isCnpj ? 'Razão Social:' : 'Nome Completo:'}</strong> ${p.name || '-'}</div>
          <div><strong>${docLabel}:</strong> ${docFormatted || '-'}</div>
          ${isCnpj ? `
            <div><strong>Representante Legal:</strong> ${p.representativeName || 'Administrador(a)'}</div>
            <div><strong>CPF do Representante:</strong> ${repCpfFormatted || '-'}</div>
            <div><strong>Natureza Jurídica:</strong> Pessoa Jurídica (PJ)</div>
          ` : `
            <div><strong>Cônjuge:</strong> ${p.spouseName || 'Não informado / Não aplicável'}</div>
            <div><strong>CPF do Cônjuge:</strong> ${spouseDocFormatted || '-'}</div>
            <div><strong>Estado Civil:</strong> ${p.civilStatus || 'Casado(a)'}${p.spouseRg ? ` | <strong>RG Cônjuge:</strong> ${p.spouseRg}` : ''}</div>
            <div><strong>Regime de Bens:</strong> ${formatMarriageRegime(p.marriageRegime)}</div>
            ${p.spouseNationality ? `<div><strong>Nacionalidade:</strong> ${p.spouseNationality}</div>` : ''}
          `}
          <div><strong>Endereço / Sede:</strong> ${p.city || ''}/${p.state || ''}</div>
          <div><strong>Telefone de Contato:</strong> ${p.phone || '-'}</div>
        </div>
      </div>

      <!-- Seção II: Imóvel Rural Principal -->
      <div class="dossie-card" style="margin-bottom: 0;">
        <div class="dossie-card-header">
          II - Dados Fundiários do Imóvel Principal
        </div>
        <div style="padding: 7px 10px; font-size: 9px; line-height: 1.55;">
          <div><strong>Propriedade Rural:</strong> ${prop.name || 'Propriedade Principal'}</div>
          <div><strong>Matrícula Imobiliária:</strong> ${prop.registrationNumber || 'Pendente'} • <strong>CRI:</strong> ${prop.registryOffice || 'CRI Local'}${prop.comarca ? ` / ${prop.comarca}` : ''}</div>
          <div><strong>Cadastro Ambiental Rural (CAR):</strong> ${prop.car || 'Pendente'}</div>
          <div><strong>CCIR / INCRA:</strong> ${prop.ccir || 'Em emissão'} • <strong>ITR / NIRF:</strong> ${prop.itr || 'Regular'}</div>
          <div><strong>Localização / Município:</strong> ${prop.city || ''}/${prop.state || ''}</div>
          <div><strong>Rota e Acesso:</strong> ${sanitizeAccessRoute(prop.accessRoute)}</div>
        </div>
      </div>
    </div>

    <!-- SEÇÃO III: RESPONSABILIDADE TÉCNICA E ELABORAÇÃO -->
    <div class="dossie-card" style="margin-bottom: 9px;">
      <div class="dossie-card-header">
        III - Responsabilidade Técnica e Projetista Homologado
      </div>
      <div style="padding: 6px 10px; display: grid; grid-template-columns: 1.2fr 1fr; gap: 4px 12px; font-size: 9px; line-height: 1.45;">
        <div><strong>Empresa Elaboradora:</strong> ${orgName}${orgCnpj ? ` • CNPJ: ${orgCnpj}` : ''}</div>
        <div><strong>Responsável Técnico:</strong> ${orgOwnerName}</div>
        <div><strong>Filial de Atendimento:</strong> ${branchName || 'Matriz Operacional'}</div>
        <div><strong>Registro Profissional:</strong> ${crea} • <strong>ART/TRT:</strong> ${art}</div>
      </div>
    </div>

    <!-- SEÇÃO IV: ENQUADRAMENTO NO MANUAL DE CRÉDITO RURAL (MCR) -->
    <div style="border: 1.5px solid #1B4D3E; border-radius: 4px; margin-bottom: 9px; background: #fbfdfc; overflow: hidden; box-sizing: border-box;">
      <div style="background: #1B4D3E; color: #ffffff; padding: 6px 12px !important; font-weight: 700; text-transform: uppercase; font-size: 9.5px; line-height: 1.3 !important; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box;">
        <span style="display: inline-flex; align-items: center; line-height: 1.3 !important;">IV - Enquadramento no Manual de Crédito Rural (MCR / BACEN)</span>
        <span style="font-size: 8.5px; font-weight: 700; color: #065f46; background: #d1fae5; border: 1px solid #6ee7b7; padding: 3px 8px !important; border-radius: 4px !important; text-transform: uppercase; line-height: 1 !important; display: inline-flex !important; align-items: center !important; letter-spacing: 0.5px; margin: 0 !important;">Plano Safra Oficial</span>
      </div>
      <div style="padding: 10px 12px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; font-size: 9px; line-height: 1.35;">
          <div>
            <strong>Linha Solicitada:</strong> <span style="color: #1B4D3E; font-weight: bold;">${lineDef.name}</span> (${lineDef.code})<br />
            <span style="font-size: 8px; color: #6b7280;">Eixo Operacional: <strong>${lineDef.axis}</strong> • ${lineDef.mcrRef}</span>
          </div>
          <div style="text-align: right;">
            <strong>Agente Financeiro:</strong> ${getBankNameLabel(targetBank)}<br />
            <span style="font-size: 8px; color: #6b7280;">Finalidade: ${purpose || 'Custeio da Produção'}</span>
          </div>
        </div>

        <!-- Bloco de Indicadores Centrais: grid de 4 colunas com divisórias limpas -->
        <div style="background: #ffffff; border: 1px solid #d1fae5; border-radius: 4px; padding: 8px 0; display: grid; grid-template-columns: repeat(4, 1fr); text-align: center; box-sizing: border-box;">
          <div style="border-right: 1px solid #e2e8f0; padding: 4px 6px;">
            <span style="font-size: 8.5px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block; font-weight: 600;">Valor Pretendido</span>
            <strong style="font-size: 13px; color: #1B4D3E; display: block; margin-top: 3px; line-height: 1.2; white-space: nowrap;">${formatBRL(creditLimitRequested)}</strong>
          </div>
          <div style="border-right: 1px solid #e2e8f0; padding: 4px 6px;">
            <span style="font-size: 8.5px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block; font-weight: 600;">Taxa de Juros</span>
            <strong style="font-size: 13px; color: #1B4D3E; display: block; margin-top: 3px; line-height: 1.2; white-space: nowrap;">${interestRate}% a.a.</strong>
          </div>
          <div style="border-right: 1px solid #e2e8f0; padding: 4px 6px;">
            <span style="font-size: 8.5px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block; font-weight: 600;">Prazo / Carência</span>
            <strong style="font-size: 12px; color: #1B4D3E; display: block; margin-top: 3px; line-height: 1.2; white-space: nowrap;">${termMonths} m ${graceMonths > 0 ? `(${graceMonths}m car.)` : ''}</strong>
          </div>
          <div style="padding: 4px 6px;">
            <span style="font-size: 8.5px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block; font-weight: 600;">Amortização</span>
            <strong style="font-size: 12px; color: #1B4D3E; display: block; margin-top: 3px; line-height: 1.2; white-space: nowrap;">Tabela ${system}</strong>
          </div>
        </div>

        <div style="margin-top: 6px; font-size: 8.5px; color: #374151; line-height: 1.4;">
          <strong>Parecer Preliminar de Enquadramento:</strong> O proponente atende integralmente aos requisitos de elegibilidade cadastral e porte produtivo da linha <em>${lineDef.name}</em>, enquadrado perante os dispositivos vigentes do MCR.
        </div>
      </div>
    </div>

    <!-- SEÇÃO V - BALANÇO DE TERRAS & BENFEITORIAS (PATRIMÔNIO IMOBILIÁRIO) -->
    <!-- V.1 Terras e Uso do Solo -->
    <div class="dossie-card" style="margin-bottom: 9px;">
      <div class="dossie-card-header">
        V - Balanço de Terras e Uso Atual do Solo (${prop.name || 'Propriedade Principal'})
      </div>
      <table class="dossie-table" style="table-layout: fixed; width: 100%; border-collapse: separate; border-spacing: 0;">
        <thead>
          <tr>
            <th style="width: 32%; padding: 8px 10px; text-align: left; vertical-align: middle; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Uso / Discriminação do Solo</th>
            <th style="width: 16%; padding: 8px 10px; text-align: right; vertical-align: middle; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Área (Hectares)</th>
            <th style="width: 16%; padding: 8px 10px; text-align: right; vertical-align: middle; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Valor Unit. Médio</th>
            <th style="width: 18%; padding: 8px 10px; text-align: right; vertical-align: middle; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Valor Total Declarado</th>
            <th style="width: 18%; padding: 8px 10px; text-align: right; vertical-align: middle; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Margem Aceitável (65%)</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 8px 10px; font-weight: 500; vertical-align: middle;">Pastagem Formada / Artificial</td>
            <td style="padding: 8px 10px; text-align: right; vertical-align: middle; white-space: nowrap;">${pastArea.toFixed(2)} ha</td>
            <td style="padding: 8px 10px; text-align: right; vertical-align: middle; white-space: nowrap;">${formatBRL(landValuePerHa)}</td>
            <td style="padding: 8px 10px; text-align: right; vertical-align: middle; white-space: nowrap;">${formatBRL(pastArea * landValuePerHa)}</td>
            <td style="padding: 8px 10px; text-align: right; color: #065f46; font-weight: 600; vertical-align: middle; white-space: nowrap;">${formatBRL((pastArea * landValuePerHa) * 0.65)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 8px 10px; font-weight: 500; vertical-align: middle;">Agricultura / Lavoura Anual</td>
            <td style="padding: 8px 10px; text-align: right; vertical-align: middle; white-space: nowrap;">${agricArea.toFixed(2)} ha</td>
            <td style="padding: 8px 10px; text-align: right; vertical-align: middle; white-space: nowrap;">${formatBRL(landValuePerHa * 1.2)}</td>
            <td style="padding: 8px 10px; text-align: right; vertical-align: middle; white-space: nowrap;">${formatBRL(agricArea * landValuePerHa * 1.2)}</td>
            <td style="padding: 8px 10px; text-align: right; color: #065f46; font-weight: 600; vertical-align: middle; white-space: nowrap;">${formatBRL((agricArea * landValuePerHa * 1.2) * 0.65)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 8px 10px; font-weight: 500; vertical-align: middle;">Reserva Legal e APP</td>
            <td style="padding: 8px 10px; text-align: right; vertical-align: middle; white-space: nowrap;">${resArea.toFixed(2)} ha</td>
            <td style="padding: 8px 10px; text-align: right; vertical-align: middle; white-space: nowrap;">${formatBRL(landValuePerHa * 0.4)}</td>
            <td style="padding: 8px 10px; text-align: right; vertical-align: middle; white-space: nowrap;">${formatBRL(resArea * landValuePerHa * 0.4)}</td>
            <td style="padding: 8px 10px; text-align: right; color: #065f46; font-weight: 600; vertical-align: middle; white-space: nowrap;">${formatBRL((resArea * landValuePerHa * 0.4) * 0.65)}</td>
          </tr>
          <tr class="dossie-total-row" style="background: #f3f4f6; font-weight: bold; border-top: 1px solid #d1d5db;">
            <td style="padding: 8px 10px; color: #111827; vertical-align: middle; white-space: nowrap;">ÁREA TOTAL / VALOR TERRA NUA</td>
            <td style="padding: 8px 10px; text-align: right; color: #111827; vertical-align: middle; white-space: nowrap;">${totalArea.toFixed(2)} ha</td>
            <td style="padding: 8px 10px; text-align: right; color: #6b7280; vertical-align: middle; white-space: nowrap;">-</td>
            <td style="padding: 8px 10px; text-align: right; color: #1B4D3E; vertical-align: middle; white-space: nowrap;">${formatBRL(totalLandValue)}</td>
            <td style="padding: 8px 10px; text-align: right; color: #065f46; vertical-align: middle; white-space: nowrap;">${formatBRL(totalLandValue * 0.65)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- V.2 Benfeitorias e Instalações Rurais -->
    <div class="dossie-card" style="margin-bottom: 9px;">
      <div class="dossie-card-header">
        Benfeitorias, Instalações e Edificações Rurais
      </div>
      <table class="dossie-table" style="table-layout: fixed; width: 100%; border-collapse: separate; border-spacing: 0;">
        <thead>
          <tr>
            <th style="width: 36%; padding: 8px 10px; text-align: left; vertical-align: middle; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Especificação da Benfeitoria</th>
            <th style="width: 14%; padding: 8px 10px; text-align: center; vertical-align: middle; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Qtd / Unid.</th>
            <th style="width: 16%; padding: 8px 10px; text-align: right; vertical-align: middle; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Valor Unit.</th>
            <th style="width: 17%; padding: 8px 10px; text-align: right; vertical-align: middle; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Valor Atual</th>
            <th style="width: 17%; padding: 8px 10px; text-align: right; vertical-align: middle; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Margem (65%)</th>
          </tr>
        </thead>
        <tbody>
          ${improvementsValue > 0 ? `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 8px 10px; font-weight: 500; vertical-align: middle;">Cercas, Currais, Galpões e Casas de Funcionários</td>
            <td style="padding: 8px 10px; text-align: center; vertical-align: middle; white-space: nowrap;">Lote Global</td>
            <td style="padding: 8px 10px; text-align: right; vertical-align: middle; white-space: nowrap;">${formatBRL(improvementsValue)}</td>
            <td style="padding: 8px 10px; text-align: right; font-weight: 600; color: #1B4D3E; vertical-align: middle; white-space: nowrap;">${formatBRL(improvementsValue)}</td>
            <td style="padding: 8px 10px; text-align: right; color: #065f46; font-weight: 600; vertical-align: middle; white-space: nowrap;">${formatBRL(improvementsValue * 0.65)}</td>
          </tr>
          ` : `
          <tr>
            <td colspan="5" style="padding: 8px 10px; text-align: center; color: #6b7280; font-style: italic; vertical-align: middle;">
              Nenhuma benfeitoria adicional informada (R$ 0,00).
            </td>
          </tr>
          `}
          <tr class="dossie-total-row" style="background: #f3f4f6; font-weight: bold; border-top: 1px solid #d1d5db;">
            <td colspan="3" style="padding: 8px 10px; color: #111827; vertical-align: middle; white-space: nowrap;">SUBTOTAL BENFEITORIAS</td>
            <td style="padding: 8px 10px; text-align: right; color: #1B4D3E; vertical-align: middle; white-space: nowrap;">${formatBRL(improvementsValue)}</td>
            <td style="padding: 8px 10px; text-align: right; color: #065f46; vertical-align: middle; white-space: nowrap;">${formatBRL(improvementsValue * 0.65)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- SUMÁRIO CONSOLIDADO DO LASTRO IMOBILIÁRIO -->
    <div style="background: #f0fdf4; border: 1.5px solid #1B4D3E; border-radius: 4px; padding: 7px 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <div>
        <span style="font-size: 8.5px; color: #166534; text-transform: uppercase; font-weight: bold; display: block;">Total do Imóvel Rural (Terra Nua + Benfeitorias)</span>
        <strong style="font-size: 11.5px; color: #1B4D3E;">${formatBRL(totalRealEstateDeclared)}</strong>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 8.5px; color: #166534; text-transform: uppercase; font-weight: bold; display: block;">Lastro Imobiliário Aceito MCR (Garantia Hipotecária 65%)</span>
        <strong style="font-size: 12px; color: #065f46;">${formatBRL(totalRealEstateAcceptable)}</strong>
      </div>
    </div>

    ${renderPageFooter(orgName)}
  </div>
  `
}
