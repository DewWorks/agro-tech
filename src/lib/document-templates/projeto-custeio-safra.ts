import { formatCPF, formatCNPJ } from '@/lib/validations'

export interface CusteioSafraDocumentData {
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
    agricultureAreaHa?: number
    accessRoute?: string
  }
  organization: {
    name: string
    cnpj?: string
  }
  branch?: {
    name: string
  }
  options?: {
    cropName?: string
    cropAreaHa?: number
    safraYear?: string
    expectedYieldScHa?: number
    pricePerSc?: number
    interestRate?: number
    agronomistName?: string
    creaNumber?: string
    artNumber?: string
  }
}

export function generateProjetoCusteioSafraHtml(data: CusteioSafraDocumentData): string {
  const p = data.producer
  const prop = data.property
  const opt = data.options || {}
  
  const docFormatted = p.type === 'PF' ? formatCPF(p.document) : formatCNPJ(p.document)
  const safra = opt.safraYear || '2026/2027'
  const crop = opt.cropName || 'Soja Grão (Safra Principal)'
  const areaHa = opt.cropAreaHa || Math.min(250, Math.round(prop.agricultureAreaHa || prop.totalAreaHa || 150))
  const yieldSc = opt.expectedYieldScHa || 62 // 62 sc/ha média de soja
  const priceSc = opt.pricePerSc || 128.00 // R$ 128,00 por saca
  
  const costPerHa = 3850 // R$ 3.850 / ha de custo operacional financiado
  const totalCost = areaHa * costPerHa
  const grossRevenue = areaHa * yieldSc * priceSc
  const netMargin = grossRevenue - totalCost
  const rate = opt.interestRate || 8.0 // Pronamp / Custeio BB

  const agroName = opt.agronomistName || 'Engenheiro Agrônomo RT'
  const crea = opt.creaNumber || 'CREA 12345-D'
  const art = opt.artNumber || 'ART 2026/998877'

  return `
  <div class="document-page" style="font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; line-height: 1.45; padding: 24px; max-width: 800px; margin: 0 auto; background: #fff; font-size: 11px;">
    
    <!-- CABEÇALHO OFICIAL CUSTEIO -->
    <div style="border-bottom: 2px solid #1B4D3E; padding-bottom: 8px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h1 style="font-size: 16px; font-weight: 800; color: #1B4D3E; margin: 0; text-transform: uppercase;">
          PROJETO DE CUSTEIO AGRÍCOLA – SAFRA ${safra}
        </h1>
        <p style="font-size: 10px; color: #6b7280; margin: 2px 0 0 0;">
          Plano de Aplicação e Orçamento Técnico • Banco do Brasil / SICOR
        </p>
      </div>
      <div style="text-align: right; font-size: 10px;">
        <span style="background: #1B4D3E; color: #fff; padding: 3px 8px; border-radius: 4px; font-weight: bold;">
          CUSTEIO SAFRA
        </span>
      </div>
    </div>

    <!-- 01. IDENTIFICAÇÃO -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 10px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase;">
        01 - Identificação do Produtor e Imóvel Beneficiado
      </div>
      <div style="padding: 6px 10px; display: grid; grid-template-columns: 2fr 1fr; gap: 6px;">
        <div><strong>Produtor:</strong> ${p.name || '-'}</div>
        <div><strong>CPF / CNPJ:</strong> ${docFormatted || '-'}</div>
        <div><strong>Propriedade Rural:</strong> ${prop.name || 'Fazenda'} (${prop.city || ''}/${prop.state || ''})</div>
        <div><strong>Matrícula:</strong> ${prop.registrationNumber || 'Pendente'}</div>
      </div>
    </div>

    <!-- 02. CARACTERIZAÇÃO DA LAVOURA -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 10px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase;">
        02 - Caracterização da Cultura e Estimativa de Produção
      </div>
      <div style="padding: 6px 10px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center;">
        <div style="background: #fafafa; border: 1px solid #e5e7eb; padding: 6px; border-radius: 4px;">
          <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Cultura Financiada</div>
          <div style="font-size: 11px; font-weight: bold; color: #1B4D3E;">${crop}</div>
        </div>
        <div style="background: #fafafa; border: 1px solid #e5e7eb; padding: 6px; border-radius: 4px;">
          <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Área de Plantio</div>
          <div style="font-size: 11px; font-weight: bold; color: #1B4D3E;">${areaHa.toFixed(2)} Hectares</div>
        </div>
        <div style="background: #fafafa; border: 1px solid #e5e7eb; padding: 6px; border-radius: 4px;">
          <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Produtividade Esperada</div>
          <div style="font-size: 11px; font-weight: bold; color: #1B4D3E;">${yieldSc} sc / ha</div>
        </div>
        <div style="background: #fafafa; border: 1px solid #e5e7eb; padding: 6px; border-radius: 4px;">
          <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Produção Total Estimada</div>
          <div style="font-size: 11px; font-weight: bold; color: #1B4D3E;">${(areaHa * yieldSc).toLocaleString('pt-BR')} sacas</div>
        </div>
      </div>
    </div>

    <!-- 03. ORÇAMENTO DETALHADO POR HECTARE -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 10px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase;">
        03 - Composição do Orçamento de Custeio (${areaHa.toFixed(2)} ha)
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 10px;">
        <thead>
          <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 4px 8px;">Grupo de Despesa</th>
            <th style="padding: 4px 8px;">Especificação Técnica</th>
            <th style="padding: 4px 8px; text-align: right;">Custo / ha</th>
            <th style="padding: 4px 8px; text-align: right;">Total Grupo (R$)</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px; font-weight: bold;">Sementes Certificadas</td>
            <td style="padding: 4px 8px;">Sementes Tratadas Industriais com Biológicos e Fungicidas</td>
            <td style="padding: 4px 8px; text-align: right;">R$ 680,00</td>
            <td style="padding: 4px 8px; text-align: right;">R$ ${(areaHa * 680).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px; font-weight: bold;">Fertilizantes & Nutrição</td>
            <td style="padding: 4px 8px;">NPK Base no Sulco (02-20-18) + Cobertura Cloreto de Potássio</td>
            <td style="padding: 4px 8px; text-align: right;">R$ 1.520,00</td>
            <td style="padding: 4px 8px; text-align: right;">R$ ${(areaHa * 1520).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px; font-weight: bold;">Defensivos Agrícolas</td>
            <td style="padding: 4px 8px;">Herbicidas Dessecação/Pós + Inseticidas + Fungicidas Sítio-Específicos</td>
            <td style="padding: 4px 8px; text-align: right;">R$ 1.050,00</td>
            <td style="padding: 4px 8px; text-align: right;">R$ ${(areaHa * 1050).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px; font-weight: bold;">Operações e Combustível</td>
            <td style="padding: 4px 8px;">Preparo, Plantio, Pulverizações Terrestres e Colheita Mecanizada</td>
            <td style="padding: 4px 8px; text-align: right;">R$ 600,00</td>
            <td style="padding: 4px 8px; text-align: right;">R$ ${(areaHa * 600).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
          </tr>
          <tr style="background: #f3f4f6; font-weight: bold;">
            <td colspan="3" style="padding: 5px 8px;">VALOR TOTAL DO CUSTEIO A FINANCIAR</td>
            <td style="padding: 5px 8px; text-align: right; color: #1B4D3E; font-size: 11px;">R$ ${totalCost.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 04. RESULTADO FINANCEIRO E FLUXO DE REEMBOLSO -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 16px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase;">
        04 - Demonstração de Viabilidade da Safra e Reembolso
      </div>
      <div style="padding: 8px 10px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center;">
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 6px; border-radius: 4px;">
          <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Receita Bruta Estimada</div>
          <div style="font-size: 12px; font-weight: bold; color: #1B4D3E;">R$ ${grossRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</div>
        </div>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 6px; border-radius: 4px;">
          <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">(-) Custo Operacional</div>
          <div style="font-size: 12px; font-weight: bold; color: #dc2626;">R$ ${totalCost.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</div>
        </div>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 6px; border-radius: 4px;">
          <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Margem Líquida da Safra</div>
          <div style="font-size: 12px; font-weight: bold; color: #065f46;">R$ ${netMargin.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</div>
        </div>
      </div>
      <div style="padding: 6px 10px; font-size: 9.5px; color: #4b5563; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between;">
        <span><strong>Vencimento da Parcela Única:</strong> Pós-Colheita (Abril/Maio)</span>
        <span><strong>Taxa de Juros:</strong> ${rate}% a.a. (Recursos Obrigatórios / Poupança Rural)</span>
      </div>
    </div>

    <!-- ASSINATURAS -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; font-size: 11px; margin-top: 24px;">
      <div>
        <div style="border-bottom: 1px solid #374151; padding-bottom: 4px; margin-bottom: 6px;">
          <strong>${p.name || 'Proponente'}</strong>
        </div>
        <div style="color: #6b7280;">Proponente / Tomador</div>
      </div>
      <div>
        <div style="border-bottom: 1px solid #374151; padding-bottom: 4px; margin-bottom: 6px;">
          <strong>${agroName}</strong>
        </div>
        <div style="color: #6b7280;">${crea} • ${art}</div>
      </div>
    </div>

  </div>
  `
}
