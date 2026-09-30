import { formatMarriageRegime } from '../formatters'

export interface ProponentSectionParams {
  p: any
  isCnpj: boolean
  docLabel: string
  docFormatted: string
  spouseDocFormatted: string
  repCpfFormatted: string
}

export function renderProponentSection({
  p,
  isCnpj,
  docLabel,
  docFormatted,
  spouseDocFormatted,
  repCpfFormatted,
}: ProponentSectionParams): string {
  return `
    <!-- I. IDENTIFICAÇÃO DO PROPONENTE E CÔNJUGE -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 12px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 5px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase; font-size: 11px;">
        ${isCnpj ? 'I - Identificação da Empresa Proponente & Representante Legal' : 'I - Identificação do Proponente e Cônjuge'}
      </div>
      <div style="padding: 8px 12px; display: grid; grid-template-columns: 1.2fr 1fr; gap: 6px 16px; font-size: 11px; line-height: 1.5;">
        <div><strong>${isCnpj ? 'Razão Social:' : 'Nome:'}</strong> ${p.name || '-'}</div>
        <div style="white-space: nowrap;"><strong>${docLabel}:</strong> ${docFormatted || '-'}</div>
        ${isCnpj ? `
          <div><strong>Representante Legal:</strong> ${p.representativeName || 'Administrador(a) / Titular'}</div>
          <div style="white-space: nowrap;"><strong>CPF Representante:</strong> ${repCpfFormatted || '-'}</div>
          <div><strong>Natureza:</strong> Pessoa Jurídica (PJ)</div>
          <div style="white-space: nowrap;"><strong>Telefone:</strong> ${p.phone || '-'}</div>
        ` : `
          <div><strong>Cônjuge:</strong> ${p.spouseName || 'Não informado / Não aplicável'}</div>
          <div style="white-space: nowrap;"><strong>CPF Cônjuge:</strong> ${spouseDocFormatted || '-'}</div>
          <div><strong>Estado Civil:</strong> ${p.civilStatus || 'Solteiro(a)'}${p.spouseRg ? ` | <strong>RG Cônjuge:</strong> ${p.spouseRg}` : ''}</div>
          <div style="white-space: nowrap;"><strong>Regime de Bens:</strong> ${formatMarriageRegime(p.marriageRegime)}</div>
          <div style="white-space: nowrap;"><strong>Telefone:</strong> ${p.phone || '-'}</div>
          ${p.spouseNationality ? `<div><strong>Nacionalidade Cônjuge:</strong> ${p.spouseNationality}</div>` : ''}
        `}
        <div style="grid-column: span 2;"><strong>Endereço / Município:</strong> ${p.street ? p.street + ', ' : ''}${p.city || ''} - ${p.state || ''}</div>
      </div>
    </div>
  `
}

export interface TechnicalResponsibilityParams {
  orgName: string
  orgCnpj: string
  branchName?: string
  orgOwnerName: string
  crea: string
  art: string
}

export function renderTechnicalResponsibilitySection({
  orgName,
  orgCnpj,
  branchName,
  orgOwnerName,
  crea,
  art,
}: TechnicalResponsibilityParams): string {
  return `
    <!-- III. RESPONSABILIDADE TÉCNICA E ELABORAÇÃO -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 12px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 5px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase; font-size: 11px;">
        III - Responsabilidade Técnica e Projetista Homologado
      </div>
      <div style="padding: 8px 12px; display: grid; grid-template-columns: 1.2fr 1fr; gap: 6px 16px; font-size: 10.5px;">
        <div><strong>Empresa Elaboradora:</strong> ${orgName}${orgCnpj ? ` • CNPJ: ${orgCnpj}` : ''}</div>
        <div><strong>Filial Responsável:</strong> ${branchName || 'Matriz Operacional'}</div>
        <div><strong>Responsável Técnico:</strong> ${orgOwnerName}</div>
        <div><strong>Registro Profissional:</strong> ${crea} • <strong>ART/TRT:</strong> ${art}</div>
      </div>
    </div>
  `
}
