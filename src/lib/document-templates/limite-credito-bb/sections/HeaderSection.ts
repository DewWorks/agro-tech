import { getBankNameLabel, formatBRL } from '../formatters'
import { CreditLineDefinition } from '@/constants/credit-lines'

export function renderPageHeader(
  title: string,
  subtitle: string,
  pageNumber: number,
  totalPages: number = 3,
  pageSubtitle: string = 'Enquadramento'
): string {
  return `
    <div style="border-bottom: 2px solid #1B4D3E; padding-bottom: 5px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <h1 style="font-size: 14.5px; font-weight: 800; color: #1B4D3E; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
          ${title}
        </h1>
        <p style="font-size: 9.5px; color: #4b5563; margin: 1px 0 0 0; font-weight: 600;">
          ${subtitle}
        </p>
      </div>
      <div style="text-align: right; font-size: 8.5px; color: #6b7280; line-height: 1.25;">
        <span style="font-weight: bold; color: #1B4D3E;">Dossiê Técnico de Crédito</span><br />
        Folha 0${pageNumber} / 0${totalPages} • ${pageSubtitle}
      </div>
    </div>
  `
}

export function renderPageFooter(orgName: string, _marginTop?: number): string {
  return `
    <div class="dossie-footer">
      <span>AgroTech Systems • Módulo de Análise e Limites de Crédito</span>
      <span>${orgName} • Emitido em ${new Date().toLocaleDateString('pt-BR')}</span>
    </div>
  `
}

export function renderPropertyIdentificationSection(prop: any): string {
  return `
    <!-- II. IDENTIFICAÇÃO DO IMÓVEL RURAL PRINCIPAL -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 12px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 5px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase; font-size: 11px;">
        II - Identificação do Imóvel Rural Principal (${prop.name || 'Propriedade Principal'})
      </div>
      <div style="padding: 8px 12px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 12px; font-size: 10.5px;">
        <div><strong>Matrícula:</strong> ${prop.registrationNumber || 'Pendente'}</div>
        <div><strong>CRI / Comarca:</strong> ${prop.registryOffice || 'CRI Local'}${prop.comarca ? ` / ${prop.comarca}` : ''}</div>
        <div><strong>CAR:</strong> ${prop.car || 'Pendente'}</div>
        <div><strong>CCIR / INCRA:</strong> ${prop.ccir || 'Em emissão'}</div>
        <div><strong>ITR / NIRF:</strong> ${prop.itr || 'Regular'}</div>
        <div><strong>Localização:</strong> ${prop.city || ''}/${prop.state || ''}</div>
        <div style="grid-column: span 3;"><strong>Rota de Acesso:</strong> ${prop.accessRoute || 'Acesso principal via rodovia estadual/municipal transitável o ano todo.'}</div>
      </div>
    </div>
  `
}

export interface McrClassificationParams {
  lineDef: CreditLineDefinition
  targetBank: string
  creditLimitRequested: number
  interestRate: number
  termMonths: number
  graceMonths: number
  system: string
  purpose?: string
}

export function renderMcrClassificationSection({
  lineDef,
  targetBank,
  creditLimitRequested,
  interestRate,
  termMonths,
  graceMonths,
  system,
  purpose,
}: McrClassificationParams): string {
  return `
    <!-- IV. ENQUADRAMENTO TÉCNICO NO MANUAL DE CRÉDITO RURAL (MCR) -->
    <div style="border: 1px solid #1B4D3E; border-radius: 4px; margin-bottom: 12px; overflow: hidden; background: #fbfdfc;">
      <div style="background: #1B4D3E; color: #ffffff; padding: 6px 10px; font-weight: bold; text-transform: uppercase; font-size: 11px; display: flex; justify-content: space-between;">
        <span>IV - Enquadramento no Manual de Crédito Rural (MCR / BACEN)</span>
        <span style="font-size: 10px; font-weight: normal; color: #a7f3d0;">Plano Safra Oficial</span>
      </div>
      <div style="padding: 10px 12px; space-y: 6px;">
        <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 8px; margin-bottom: 8px; font-size: 11px;">
          <div>
            <strong>Linha Solicitada:</strong> <span style="color: #1B4D3E; font-weight: bold;">${lineDef.name}</span> (${lineDef.code})<br />
            <span style="font-size: 10px; color: #6b7280;">Eixo Operacional: <strong>${lineDef.axis}</strong> • ${lineDef.mcrRef}</span>
          </div>
          <div style="text-align: right;">
            <strong>Agente Financeiro:</strong> ${getBankNameLabel(targetBank)}<br />
            <span style="font-size: 10px; color: #6b7280;">Finalidade: ${purpose || 'Custeio da Produção'}</span>
          </div>
        </div>

        <div style="background: #ffffff; border: 1px solid #d1fae5; border-radius: 4px; padding: 8px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center;">
          <div style="border-right: 1px solid #e5e7eb;">
            <span style="font-size: 9px; color: #6b7280; text-transform: uppercase; display: block;">Valor Pretendido</span>
            <strong style="font-size: 13px; color: #1B4D3E;">${formatBRL(creditLimitRequested)}</strong>
          </div>
          <div style="border-right: 1px solid #e5e7eb;">
            <span style="font-size: 9px; color: #6b7280; text-transform: uppercase; display: block;">Taxa de Juros</span>
            <strong style="font-size: 13px; color: #1B4D3E;">${interestRate}% a.a.</strong>
          </div>
          <div style="border-right: 1px solid #e5e7eb;">
            <span style="font-size: 9px; color: #6b7280; text-transform: uppercase; display: block;">Prazo Total / Carência</span>
            <strong style="font-size: 12px; color: #1B4D3E;">${termMonths} m ${graceMonths > 0 ? `(${graceMonths}m car.)` : ''}</strong>
          </div>
          <div>
            <span style="font-size: 9px; color: #6b7280; text-transform: uppercase; display: block;">Amortização</span>
            <strong style="font-size: 13px; color: #1B4D3E;">Tabela ${system}</strong>
          </div>
        </div>

        <div style="margin-top: 8px; font-size: 9.5px; color: #4b5563; line-height: 1.4;">
          <strong>Parecer Preliminar de Enquadramento:</strong> O proponente atende aos requisitos de elegibilidade cadastral e porte produtivo da linha <em>${lineDef.name}</em>, estando plenamente respaldado pelos dispositivos vigentes do MCR.
        </div>
      </div>
    </div>
  `
}
