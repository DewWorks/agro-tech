import { formatCPF } from '@/lib/validations'
import { renderPageFooter } from './HeaderSection'

export interface SignaturesSectionParams {
  p: any
  isCnpj: boolean
  docLabel: string
  docFormatted: string
  spouseDocFormatted: string
  orgOwnerName: string
  orgName: string
  crea: string
  art: string
}

export function renderSignaturesSection({
  p,
  isCnpj,
  docLabel,
  docFormatted,
  spouseDocFormatted,
  orgOwnerName,
  orgName,
  crea,
  art,
}: SignaturesSectionParams): string {
  return `
    <!-- 4. DECLARAÇÃO E ASSINATURAS FORMAIS -->
    <div style="font-size: 9.5px; color: #4b5563; text-align: justify; margin-bottom: 24px; line-height: 1.35;">
      Declaro, sob as penas da lei, que as informações cadastrais, levantamento fundiário, bens patrimoniais, estimativas zootécnicas e dados de fluxo financeiro constantes deste Dossiê Técnico são a expressão fiel da verdade e refletem a real capacidade do empreendimento rural, autorizando o comitê de crédito da instituição financeira a realizar as devidas averiguações perante os órgãos competentes e consulta ao SCR/BACEN.
    </div>

    <div style="display: grid; grid-template-columns: ${p.spouseName ? '1fr 1fr 1fr' : '1fr 1fr'}; gap: 20px; text-align: center; font-size: 10.5px;">
      <!-- Assinatura do Proponente -->
      <div>
        <div style="border-bottom: 1px solid #374151; padding-bottom: 4px; margin-bottom: 6px;">
          <strong>${p.name || 'Proponente'}</strong>
        </div>
        <div style="color: #111827; font-weight: 600; font-size: 10px; white-space: nowrap;">${docLabel}: ${docFormatted || '-'}</div>
        ${isCnpj && p.representativeCpf ? `<div style="color: #374151; font-size: 9px; white-space: nowrap;">Rep. Legal CPF: ${formatCPF(p.representativeCpf)}</div>` : ''}
        <div style="color: #6b7280; font-size: 9.5px;">Assinatura do Proponente</div>
      </div>

      <!-- Assinatura do Cônjuge (Outorga Uxória) -->
      ${p.spouseName ? `
      <div>
        <div style="border-bottom: 1px solid #374151; padding-bottom: 4px; margin-bottom: 6px;">
          <strong>${p.spouseName}</strong>
        </div>
        <div style="color: #111827; font-weight: 600; font-size: 10px; white-space: nowrap;">CPF: ${spouseDocFormatted || '-'}</div>
        <div style="color: #6b7280; font-size: 9.5px;">Assinatura do Cônjuge (Outorga Uxória)</div>
      </div>
      ` : ''}

      <!-- Responsável Técnico / Elaborador -->
      <div>
        <div style="border-bottom: 1px solid #374151; padding-bottom: 4px; margin-bottom: 6px;">
          <strong>${orgOwnerName}</strong>
        </div>
        <div style="color: #111827; font-weight: 600; font-size: 10px;">${orgName}</div>
        <div style="color: #4b5563; font-size: 9px;">${crea} • ART: ${art}</div>
        <div style="color: #6b7280; font-size: 9.5px;">Responsável Técnico / Elaborador</div>
      </div>
    </div>

    ${renderPageFooter(orgName, 24)}
  `
}
