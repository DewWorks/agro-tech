import { formatCPF, formatCNPJ } from '@/lib/validations'

export interface InovAgroDocumentData {
  producer: {
    name: string
    document: string
    type: 'PF' | 'PJ'
    spouseName?: string
    phone?: string
    city?: string
    state?: string
  }
  property: {
    name: string
    registrationNumber?: string
    registryOffice?: string
    car?: string
    city?: string
    state?: string
    totalAreaHa?: number
    accessRoute?: string
  }
  organization: {
    name: string
    cnpj?: string
    ownerName?: string
  }
  branch?: {
    name: string
  }
  options?: {
    responsibleName?: string
    projectDate?: string
    equipmentName?: string
    equipmentSpec?: string
    equipmentCapacity?: string
    systemPowerKw?: number
    cnaeCode?: string
    totalInvestment?: number
    financedAmount?: number
    ownResources?: number
    termYears?: number
    graceMonths?: number
    interestRate?: number
    estimatedMonthlySavings?: number
    estimatedMonthlyGenerationKwh?: number
    agronomistName?: string
    creaNumber?: string
    artNumber?: string
  }
}

export function generateProjetoInovagroHtml(data: InovAgroDocumentData): string {
  const p = data.producer
  const prop = data.property
  const opt = data.options || {}
  
  const orgName = data.organization?.name || 'Organização'
  const orgCnpj = data.organization?.cnpj ? formatCNPJ(data.organization.cnpj) : ''
  const orgOwnerName = data.organization?.ownerName || opt.responsibleName || opt.agronomistName || 'Responsável Técnico'

  const docFormatted = p.type === 'PF' ? formatCPF(p.document) : formatCNPJ(p.document)
  const projectDate = opt.projectDate || new Date().toLocaleDateString('pt-BR')
  
  const equipName = opt.equipmentName || 'Não informado'
  const equipSpec = opt.equipmentSpec || 'Não informado'
  const powerKw = opt.systemPowerKw || 0
  const powerStr = powerKw > 0 ? `${powerKw} kWp` : (opt.equipmentCapacity || 'Pendente')
  
  const totalInv = opt.totalInvestment && opt.totalInvestment > 0 ? opt.totalInvestment : 0
  const financed = totalInv > 0 ? (opt.financedAmount !== undefined ? opt.financedAmount : totalInv * 0.9) : 0
  const ownRes = totalInv > 0 ? (opt.ownResources !== undefined ? opt.ownResources : totalInv - financed) : 0
  
  const term = opt.termYears || 0
  const grace = opt.graceMonths || 0
  const rate = opt.interestRate || 0
  
  const monthlyGenerationKwh = opt.estimatedMonthlyGenerationKwh || (powerKw > 0 ? Math.round(powerKw * 135) : 0)
  const monthlySavings = opt.estimatedMonthlySavings || (powerKw > 0 ? Math.round(monthlyGenerationKwh * 0.95) : 0)
  const annualSavings = monthlySavings * 12
  const paybackStr = totalInv > 0 && annualSavings > 0 ? (totalInv / annualSavings).toFixed(1) + ' anos' : 'Pendente'

  const agroName = orgOwnerName
  const crea = opt.creaNumber || 'Pendente'
  const art = opt.artNumber || 'Pendente'

  return `
  <div class="document-page" style="font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; line-height: 1.45; padding: 24px; max-width: 800px; margin: 0 auto; background: #fff; font-size: 11px;">
    
    <!-- CABEÇALHO OFICIAL INOVAGRO -->
    <div style="border-bottom: 2px solid #1B4D3E; padding-bottom: 8px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h1 style="font-size: 16px; font-weight: 800; color: #1B4D3E; margin: 0; text-transform: uppercase;">
          PROJETO TÉCNICO – PROGRAMA INOVAGRO
        </h1>
        <p style="font-size: 10px; color: #6b7280; margin: 2px 0 0 0;">
          Inovação Tecnológica na Agropecuária • Banco do Brasil / BNDES
        </p>
      </div>
      <div style="text-align: right; font-size: 10px; color: #374151;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 3px 8px; border-radius: 4px; font-weight: 600; color: #15803d;">
          Data: ${projectDate}
        </div>
      </div>
    </div>

    <!-- 01. PROPONENTE -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 10px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase;">
        01 - Identificação do Proponente e Enquadramento CNAE
      </div>
      <div style="padding: 6px 10px; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 6px;">
        <div><strong>Proponente:</strong> ${p.name || '-'}</div>
        <div><strong>CPF / CNPJ:</strong> ${docFormatted || '-'}</div>
        <div><strong>CNAE BNDES:</strong> ${opt.cnaeCode || 'Não informado'}</div>
        <div style="grid-column: span 2;"><strong>Município / UF:</strong> ${p.city || ''} - ${p.state || ''}</div>
        <div><strong>Telefone:</strong> ${p.phone || '-'}</div>
      </div>
    </div>

    <!-- 02. IMÓVEL BENEFICIADO -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 10px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase;">
        02 - Imóvel Beneficiado pelo Investimento
      </div>
      <div style="padding: 6px 10px; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 6px;">
        <div><strong>Propriedade:</strong> ${prop.name || 'Fazenda'}</div>
        <div><strong>Matrícula:</strong> ${prop.registrationNumber || 'Pendente'}</div>
        <div><strong>CAR:</strong> ${prop.car || 'Pendente'}</div>
      </div>
    </div>

    <!-- 03. OBJETO DO FINANCIAMENTO -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 10px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase;">
        03 - Especificação dos Equipamentos e Inovação Tecnológica
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 10px;">
        <thead>
          <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 4px 8px;">Equipamento / Serviço</th>
            <th style="padding: 4px 8px;">Especificação Técnica</th>
            <th style="padding: 4px 8px; text-align: right;">Potência / Capacidade</th>
            <th style="padding: 4px 8px; text-align: right;">Valor Total (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${totalInv > 0 ? `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 6px 8px; font-weight: bold;">${equipName}</td>
            <td style="padding: 6px 8px;">${equipSpec}</td>
            <td style="padding: 6px 8px; text-align: right;">${powerStr}</td>
            <td style="padding: 6px 8px; text-align: right;">R$ ${totalInv.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
          </tr>
          ` : `
          <tr>
            <td colspan="4" style="padding: 14px; text-align: center; color: #b45309; background: #fffbeb; font-weight: 500;">
              ⚠️ Aguardando preenchimento dos equipamentos e valores de investimento no formulário lateral.
            </td>
          </tr>
          `}
          <tr style="background: #f3f4f6; font-weight: bold;">
            <td colspan="3" style="padding: 5px 8px;">VALOR TOTAL DO INVESTIMENTO</td>
            <td style="padding: 5px 8px; text-align: right; color: #1B4D3E; font-size: 11px;">R$ ${totalInv.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>

      <div style="padding: 6px 10px; background: #fafafa; border-top: 1px solid #e5e7eb; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-size: 10px;">
        <div><strong>Recursos Financiados:</strong> R$ ${financed.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</div>
        <div><strong>Recursos Próprios:</strong> R$ ${ownRes.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</div>
        <div><strong>Prazo Total:</strong> ${totalInv > 0 ? term + ' anos' : '-'}</div>
        <div><strong>Carência:</strong> ${totalInv > 0 ? grace + ' meses (Juros: ' + rate + '% a.a.)' : '-'}</div>
      </div>
    </div>

    <!-- 04. VIABILIDADE ECONÔMICA E ENERGÉTICA -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 16px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase;">
        04 - Demonstração de Viabilidade e Economia Operacional
      </div>
      <div style="padding: 8px 10px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center;">
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 6px; border-radius: 4px;">
          <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Geração / Ganho Estimado</div>
          <div style="font-size: 12px; font-weight: bold; color: #1B4D3E;">
            ${monthlyGenerationKwh > 0 ? monthlyGenerationKwh.toLocaleString('pt-BR') + ' kWh / mês' : (powerKw > 0 ? powerStr : 'Sob dimensionamento')}
          </div>
        </div>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 6px; border-radius: 4px;">
          <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Economia Mensal</div>
          <div style="font-size: 12px; font-weight: bold; color: #047857;">
            ${monthlySavings > 0 ? 'R$ ' + monthlySavings.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : 'R$ 0,00'}
          </div>
        </div>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 6px; border-radius: 4px;">
          <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Economia Anual Projetada</div>
          <div style="font-size: 12px; font-weight: bold; color: #047857;">
            ${annualSavings > 0 ? 'R$ ' + annualSavings.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : 'R$ 0,00'}
          </div>
        </div>
      </div>
      <div style="padding: 6px 10px; font-size: 9.5px; color: #4b5563; text-align: justify; border-top: 1px solid #e5e7eb;">
        A implantação da usina solar fotovoltaica reduzirá em mais de 90% os custos com energia elétrica nas atividades de irrigação, ordenha mecânica, resfriamento de leite e bombeamento hídrico da fazenda, garantindo retorno do investimento (Payback) em aproximadamente ${paybackStr} e liberando fluxo de caixa para expansão produtiva.
      </div>
    </div>

    <!-- ASSINATURAS -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; font-size: 11px; margin-top: 24px;">
      <div>
        <div style="border-bottom: 1px solid #374151; padding-bottom: 4px; margin-bottom: 6px;">
          <strong>${p.name || 'Proponente'}</strong>
        </div>
        <div style="color: #111827; font-weight: 600; font-size: 10.5px;">${p.type === 'PJ' ? 'CNPJ' : 'CPF'}: ${docFormatted || p.document || '-'}</div>
        <div style="color: #6b7280; font-size: 10px;">Proponente / Beneficiário</div>
      </div>
      <div>
        <div style="border-bottom: 1px solid #374151; padding-bottom: 4px; margin-bottom: 6px;">
          <strong>${orgOwnerName}</strong>
        </div>
        <div style="color: #111827; font-weight: 600; font-size: 10.5px;">${orgName}</div>
        ${orgCnpj ? `<div style="color: #4b5563; font-size: 10px;">CNPJ: ${orgCnpj}</div>` : ''}
        <div style="color: #6b7280; font-size: 10px;">${crea} • ${art}</div>
      </div>
    </div>

  </div>
  `
}
