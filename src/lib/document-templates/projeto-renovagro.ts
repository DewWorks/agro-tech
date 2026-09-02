import { formatCPF, formatCNPJ } from '@/lib/validations'

export interface RenovAgroDocumentData {
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
    openAreaHa?: number
    pastureAreaHa?: number
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
    projectDate?: string
    subline?: string
    areaToRecoverHa?: number
    totalInvestment?: number
    financedAmount?: number
    ownResources?: number
    termYears?: number
    graceMonths?: number
    interestRate?: number
    agronomistName?: string
    creaNumber?: string
    artNumber?: string
  }
}

export function generateProjetoRenovagroHtml(data: RenovAgroDocumentData): string {
  const p = data.producer
  const prop = data.property
  const opt = data.options || {}
  
  const orgName = data.organization?.name || 'LN - CONSULTORIA E PROJETOS RURAIS'
  const orgCnpj = data.organization?.cnpj ? formatCNPJ(data.organization.cnpj) : ''
  const orgOwnerName = data.organization?.ownerName || opt.agronomistName || 'João Victor Póvoa França'

  const docFormatted = p.type === 'PF' ? formatCPF(p.document) : formatCNPJ(p.document)
  const projectDate = opt.projectDate || new Date().toLocaleDateString('pt-BR')
  const subline = opt.subline || 'Recuperação de Pastagens Degradadas (MCR 11.7.1.c.I)'
  
  const areaRecover = opt.areaToRecoverHa || Math.min(100, Math.round((prop.pastureAreaHa || prop.totalAreaHa || 100) * 0.4))
  const costPerHa = 3500 // R$ 3.500 / ha para recuperação completa (calagem, gesso, adubo, sementes, grade)
  const totalInv = opt.totalInvestment || (areaRecover * costPerHa)
  const financed = opt.financedAmount || (totalInv * 0.9)
  const ownRes = opt.ownResources || (totalInv - financed)
  
  const term = opt.termYears || 8
  const grace = opt.graceMonths || 24
  const rate = opt.interestRate || 10.5
  
  const agroName = orgOwnerName
  const crea = opt.creaNumber || 'CREA/TO 12345-D'
  const art = opt.artNumber || 'ART 2026/0987654'

  return `
  <div class="document-page" style="font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; line-height: 1.45; padding: 24px; max-width: 800px; margin: 0 auto; background: #fff; font-size: 11px;">
    
    <!-- CABEÇALHO OFICIAL RENOVAGRO -->
    <div style="border-bottom: 2px solid #1B4D3E; padding-bottom: 8px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h1 style="font-size: 16px; font-weight: 800; color: #1B4D3E; margin: 0; text-transform: uppercase;">
          PROJETO TÉCNICO – PROGRAMA RenovAgro
        </h1>
        <p style="font-size: 10px; color: #6b7280; margin: 2px 0 0 0;">
          Linha de Financiamento para Agropecuária Sustentável e Baixa Emissão de Carbono • Banco do Brasil / BNDES
        </p>
      </div>
      <div style="text-align: right; font-size: 10px;">
        <span style="background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 4px; font-weight: bold;">
          Data: ${projectDate}
        </span>
      </div>
    </div>

    <!-- 01. PROPONENTE -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 10px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase;">
        01 - Identificação do Proponente
      </div>
      <div style="padding: 6px 10px; display: grid; grid-template-columns: 2fr 1fr; gap: 6px;">
        <div><strong>Nome / Razão Social:</strong> ${p.name || '-'}</div>
        <div><strong>CPF / CNPJ:</strong> ${docFormatted || '-'}</div>
        <div><strong>Endereço / Município:</strong> ${p.city || ''} - ${p.state || ''}</div>
        <div><strong>Telefone:</strong> ${p.phone || '-'}</div>
      </div>
    </div>

    <!-- 02. IMÓVEIS EXPLORADOS E IMÓVEL BENEFICIADO -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 10px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase;">
        02 - Imóvel Beneficiado pelo Investimento
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 10px;">
        <thead>
          <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 4px 8px;">Denominação do Imóvel</th>
            <th style="padding: 4px 8px;">Matrícula / CRI</th>
            <th style="padding: 4px 8px;">CAR</th>
            <th style="padding: 4px 8px; text-align: right;">Área Total</th>
            <th style="padding: 4px 8px; text-align: right;">Área do Projeto</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 5px 8px; font-weight: bold;">${prop.name || 'Fazenda Principal'}</td>
            <td style="padding: 5px 8px;">${prop.registrationNumber || 'Pendente'} (${prop.registryOffice || 'CRI'})</td>
            <td style="padding: 5px 8px;">${prop.car || 'Pendente'}</td>
            <td style="padding: 5px 8px; text-align: right;">${(prop.totalAreaHa || 0).toFixed(2)} ha</td>
            <td style="padding: 5px 8px; text-align: right; color: #1B4D3E; font-weight: bold;">${areaRecover.toFixed(2)} ha</td>
          </tr>
        </tbody>
      </table>
      <div style="padding: 4px 8px; background: #fafafa; border-top: 1px solid #e5e7eb; font-size: 9px; color: #4b5563;">
        <strong>Roteiro de Acesso:</strong> ${prop.accessRoute || 'Partindo da sede do município sede pela rodovia vicinal principal até a entrada da fazenda.'}
      </div>
    </div>

    <!-- 03. ATIVIDADES DESENVOLVIDAS & FINALIDADE -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 10px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase;">
        03 - Enquadramento e Finalidade do Financiamento
      </div>
      <div style="padding: 6px 10px;">
        <div style="margin-bottom: 4px;"><strong>Atividade Principal:</strong> Pecuária de Corte (Cria / Recria / Engorda) e Bovinocultura Sustentável.</div>
        <div><strong>Linha de Enquadramento:</strong> <span style="background: #ecfdf5; color: #065f46; font-weight: bold; padding: 2px 6px; border-radius: 3px;">${subline}</span></div>
      </div>
    </div>

    <!-- 04. PLANO DE INVESTIMENTO E CRONOGRAMA FÍSICO-FINANCEIRO -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 10px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase;">
        04 - Plano de Investimento & Composição de Custos (${areaRecover.toFixed(2)} ha)
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 10px;">
        <thead>
          <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 4px 8px;">Item / Discriminação do Serviço ou Insumo</th>
            <th style="padding: 4px 8px;">Quant./ha</th>
            <th style="padding: 4px 8px; text-align: right;">Custo Unit. Estimado</th>
            <th style="padding: 4px 8px; text-align: right;">Total Item (R$)</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px;">Calagem (Calcário Dolomítico + Aplicação)</td>
            <td style="padding: 4px 8px;">2,5 t/ha</td>
            <td style="padding: 4px 8px; text-align: right;">R$ 220,00 / t</td>
            <td style="padding: 4px 8px; text-align: right;">R$ ${(areaRecover * 550).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px;">Gessagem Agrícola e Fosfatagem Corretiva</td>
            <td style="padding: 4px 8px;">1,0 t/ha</td>
            <td style="padding: 4px 8px; text-align: right;">R$ 800,00 / ha</td>
            <td style="padding: 4px 8px; text-align: right;">R$ ${(areaRecover * 800).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px;">Adubação de Formação NPK + Micronutrientes</td>
            <td style="padding: 4px 8px;">300 kg/ha</td>
            <td style="padding: 4px 8px; text-align: right;">R$ 1.100,00 / ha</td>
            <td style="padding: 4px 8px; text-align: right;">R$ ${(areaRecover * 1100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px;">Sementes Fiscalizadas de Forrageiras (Braquiária / Panicum)</td>
            <td style="padding: 4px 8px;">10 kg/ha</td>
            <td style="padding: 4px 8px; text-align: right;">R$ 350,00 / ha</td>
            <td style="padding: 4px 8px; text-align: right;">R$ ${(areaRecover * 350).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px;">Operações Mecanizadas (Subsolagem, Gradagem e Semeadura)</td>
            <td style="padding: 4px 8px;">Horas/máq</td>
            <td style="padding: 4px 8px; text-align: right;">R$ 700,00 / ha</td>
            <td style="padding: 4px 8px; text-align: right;">R$ ${(areaRecover * 700).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
          </tr>
          <tr style="background: #f3f4f6; font-weight: bold;">
            <td colspan="3" style="padding: 5px 8px;">VALOR TOTAL DO PROJETO</td>
            <td style="padding: 5px 8px; text-align: right; color: #1B4D3E; font-size: 11px;">R$ ${totalInv.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>
      
      <div style="padding: 6px 10px; background: #fafafa; border-top: 1px solid #e5e7eb; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-size: 10px;">
        <div><strong>Recursos Financiados:</strong> R$ ${financed.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</div>
        <div><strong>Recursos Próprios:</strong> R$ ${ownRes.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</div>
        <div><strong>Prazo Total:</strong> ${term} anos</div>
        <div><strong>Carência:</strong> ${grace} meses (Juros: ${rate}% a.a.)</div>
      </div>
    </div>

    <!-- 05. JUSTIFICATIVA AGRONÔMICA E AMBIENTAL -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 16px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase;">
        05 - Justificativa Técnica e Benefícios Ambientais
      </div>
      <div style="padding: 8px 10px; font-size: 10px; text-align: justify; color: #374151;">
        O presente projeto visa recuperar pastagens com avançado grau de degradação física e química no imóvel beneficiado, promovendo a descompactação do solo, correção da acidez mediante calagem e reposição fosfatada. Com a implantação do novo estande de forrageiras de alta capacidade de suporte e manejo rotacionado, a taxa de lotação da fazenda passará de 0,6 UA/ha para 1,8 UA/ha, resultando em sequestro líquido de carbono no solo, redução da pressão por novas aberturas e incremento expressivo na rentabilidade zootécnica da atividade pecuária.
      </div>
    </div>

    <!-- ASSINATURAS E RESPONSABILIDADE TÉCNICA -->
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
