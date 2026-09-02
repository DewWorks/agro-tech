import { formatCPF, formatCNPJ } from '@/lib/validations'

export interface LimiteCreditoDocumentData {
  producer: {
    name: string
    document: string
    type: 'PF' | 'PJ'
    spouseName?: string
    spouseCpf?: string
    phone?: string
    civilStatus?: string
    profession?: string
    street?: string
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
    preservationAreaHa?: number
    pastureAreaHa?: number
    agricultureAreaHa?: number
    accessRoute?: string
    livestockData?: {
      totalCattle?: number
      brandRegistrationAdapec?: string
      brandDescription?: string
      brandLocation?: string
      categories?: Record<string, number>
    }
  }
  organization: {
    name: string
    cnpj?: string
  }
  branch?: {
    name: string
  }
  options?: {
    estimatedLandValuePerHa?: number
    improvementsValue?: number
    machineryValue?: number
    annualRevenue?: number
    annualExpenses?: number
    existingDebts?: number
  }
}

export function generateLimiteCreditoBbHtml(data: LimiteCreditoDocumentData): string {
  const p = data.producer
  const prop = data.property
  const opt = data.options || {}
  
  const docFormatted = p.type === 'PF' ? formatCPF(p.document) : formatCNPJ(p.document)
  const spouseDocFormatted = p.spouseCpf ? formatCPF(p.spouseCpf) : ''
  
  const pastArea = prop.pastureAreaHa || 0
  const agricArea = prop.agricultureAreaHa || 0
  const resArea = prop.preservationAreaHa || 0
  const totalArea = prop.totalAreaHa && prop.totalAreaHa > 0 ? prop.totalAreaHa : (pastArea + agricArea + resArea)

  const landValuePerHa = opt.estimatedLandValuePerHa || 12000
  const totalLandValue = totalArea * landValuePerHa

  const totalCattle = prop.livestockData?.totalCattle || 0
  const cattleEstimatedValue = totalCattle * 3500

  const improvementsValue = opt.improvementsValue !== undefined ? opt.improvementsValue : 0
  const machineryValue = opt.machineryValue !== undefined ? opt.machineryValue : 0

  const totalPatrimony = totalLandValue + cattleEstimatedValue + improvementsValue + machineryValue

  const annualRev = opt.annualRevenue || 0
  const annualExp = opt.annualExpenses || 0
  const debts = opt.existingDebts || 0
  const netCapacity = annualRev - annualExp - debts

  return `
  <div class="document-page" style="font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; line-height: 1.4; padding: 24px; max-width: 800px; margin: 0 auto; background: #fff; font-size: 11px;">
    
    <!-- CABEÇALHO OFICIAL -->
    <div style="border-bottom: 2px solid #1B4D3E; padding-bottom: 8px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 style="font-size: 16px; font-weight: 800; color: #1B4D3E; margin: 0; text-transform: uppercase;">
          Ficha Cadastral e Levantamento Patrimonial
        </h1>
        <p style="font-size: 10px; color: #6b7280; margin: 2px 0 0 0;">
          Dossiê para Proposta de Limite de Crédito Rural • Banco do Brasil
        </p>
      </div>
      <div style="text-align: right;">
        <span style="background: #1B4D3E; color: #fff; font-weight: bold; font-size: 10px; padding: 4px 8px; border-radius: 4px;">
          LIMITE DE CRÉDITO BB
        </span>
      </div>
    </div>

    <!-- I. IDENTIFICAÇÃO DO PROPONENTE -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 12px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase;">
        I - Identificação do Proponente e Cônjuge
      </div>
      <div style="padding: 8px 10px; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 6px;">
        <div><strong>Nome / Razão Social:</strong> ${p.name || '-'}</div>
        <div><strong>CPF / CNPJ:</strong> ${docFormatted || '-'}</div>
        <div><strong>Estado Civil:</strong> ${p.civilStatus || 'Casado(a)'}</div>
        <div style="grid-column: span 2;"><strong>Cônjuge:</strong> ${p.spouseName || 'Não informado / Não aplicável'}</div>
        <div><strong>CPF Cônjuge:</strong> ${spouseDocFormatted || '-'}</div>
        <div style="grid-column: span 2;"><strong>Endereço / Município:</strong> ${p.street ? p.street + ', ' : ''}${p.city || ''} - ${p.state || ''}</div>
        <div><strong>Telefone:</strong> ${p.phone || '-'}</div>
      </div>
    </div>

    <!-- II. PATRIMÔNIO FUNDIÁRIO (TERRAS) -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 12px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase;">
        II - Discriminação de Terras e Uso Atual do Solo (${prop.name || 'Propriedade Principal'})
      </div>
      <div style="padding: 6px 10px; background: #fafafa; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between;">
        <span><strong>Matrícula:</strong> ${prop.registrationNumber || 'Pendente'} (${prop.registryOffice || 'CRI Local'})</span>
        <span><strong>CAR:</strong> ${prop.car || 'Pendente'}</span>
        <span><strong>Localização:</strong> ${prop.city || ''}/${prop.state || ''}</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 10px;">
            <th style="padding: 4px 8px;">Uso / Discriminação do Solo</th>
            <th style="padding: 4px 8px; text-align: right;">Área (Hectares)</th>
            <th style="padding: 4px 8px; text-align: right;">Valor Unit. Médio (R$/ha)</th>
            <th style="padding: 4px 8px; text-align: right;">Valor Total Estimado</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px;">Pastagem Formada / Artificial</td>
            <td style="padding: 4px 8px; text-align: right;">${pastArea.toFixed(2)} ha</td>
            <td style="padding: 4px 8px; text-align: right;">R$ ${landValuePerHa.toLocaleString('pt-BR')}</td>
            <td style="padding: 4px 8px; text-align: right;">R$ ${(pastArea * landValuePerHa).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px;">Agricultura / Lavoura Anual</td>
            <td style="padding: 4px 8px; text-align: right;">${agricArea.toFixed(2)} ha</td>
            <td style="padding: 4px 8px; text-align: right;">R$ ${(landValuePerHa * 1.2).toLocaleString('pt-BR')}</td>
            <td style="padding: 4px 8px; text-align: right;">R$ ${(agricArea * landValuePerHa * 1.2).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px;">Reserva Legal e APP</td>
            <td style="padding: 4px 8px; text-align: right;">${resArea.toFixed(2)} ha</td>
            <td style="padding: 4px 8px; text-align: right;">R$ ${(landValuePerHa * 0.4).toLocaleString('pt-BR')}</td>
            <td style="padding: 4px 8px; text-align: right;">R$ ${(resArea * landValuePerHa * 0.4).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
          </tr>
          <tr style="background: #f3f4f6; font-weight: bold;">
            <td style="padding: 5px 8px;">ÁREA TOTAL DO IMÓVEL</td>
            <td style="padding: 5px 8px; text-align: right;">${totalArea.toFixed(2)} ha</td>
            <td style="padding: 5px 8px; text-align: right;">-</td>
            <td style="padding: 5px 8px; text-align: right; color: #1B4D3E;">R$ ${totalLandValue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- III. BENFEITORIAS E INSTALAÇÕES (TABELA BB) -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 12px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase;">
        III - Benfeitorias e Instalações (Referência Banco do Brasil)
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 10px;">
            <th style="padding: 4px 8px;">Tipo da Benfeitoria</th>
            <th style="padding: 4px 8px;">Dimensão / Quant.</th>
            <th style="padding: 4px 8px;">Estado de Conservação</th>
            <th style="padding: 4px 8px; text-align: right;">Valor Estimado</th>
          </tr>
        </thead>
        <tbody>
          ${improvementsValue > 0 ? `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 4px 8px;">Benfeitorias, Edificações e Cercas Avaliadas</td>
            <td style="padding: 4px 8px;">Conforme Vistoria</td>
            <td style="padding: 4px 8px;">Bom Estado Geral</td>
            <td style="padding: 4px 8px; text-align: right;">R$ ${improvementsValue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
          </tr>
          ` : `
          <tr>
            <td colspan="4" style="padding: 8px; text-align: center; color: #6b7280; font-style: italic;">
              Nenhuma benfeitoria informada (R$ 0,00). Informe o valor no painel de parâmetros para compor a garantia.
            </td>
          </tr>
          `}
          <tr style="background: #f3f4f6; font-weight: bold;">
            <td colspan="3" style="padding: 5px 8px;">TOTAL BENFEITORIAS</td>
            <td style="padding: 5px 8px; text-align: right; color: #1B4D3E;">R$ ${improvementsValue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- IV. SEMOVENTES (REBANHO BOVINO) -->
    <div style="border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 12px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 4px 10px; font-weight: bold; color: #111827; border-bottom: 1px solid #d1d5db; text-transform: uppercase; display: flex; justify-content: space-between;">
        <span>IV - Semoventes e Rebanho Bovino</span>
        <span style="font-size: 10px; color: #4b5563;">Registro ADAPEC: ${prop.livestockData?.brandRegistrationAdapec || 'Não informado / Pendente'}</span>
      </div>
      <div style="padding: 8px 10px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center;">
        <div style="background: #fafafa; border: 1px solid #e5e7eb; padding: 6px; border-radius: 4px;">
          <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Matrizes / Vacas</div>
          <div style="font-size: 13px; font-weight: bold; color: #1B4D3E;">${totalCattle > 0 ? Math.round(totalCattle * 0.45) : 0} cab</div>
        </div>
        <div style="background: #fafafa; border: 1px solid #e5e7eb; padding: 6px; border-radius: 4px;">
          <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Novilhas / Novilhos</div>
          <div style="font-size: 13px; font-weight: bold; color: #1B4D3E;">${totalCattle > 0 ? Math.round(totalCattle * 0.30) : 0} cab</div>
        </div>
        <div style="background: #fafafa; border: 1px solid #e5e7eb; padding: 6px; border-radius: 4px;">
          <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Bezerros / Cria</div>
          <div style="font-size: 13px; font-weight: bold; color: #1B4D3E;">${totalCattle > 0 ? Math.round(totalCattle * 0.22) : 0} cab</div>
        </div>
        <div style="background: #fafafa; border: 1px solid #e5e7eb; padding: 6px; border-radius: 4px;">
          <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Touros / Reprodutores</div>
          <div style="font-size: 13px; font-weight: bold; color: #1B4D3E;">${totalCattle > 0 ? Math.max(1, Math.round(totalCattle * 0.03)) : 0} cab</div>
        </div>
      </div>
      <div style="padding: 6px 10px; background: #f3f4f6; display: flex; justify-content: space-between; font-weight: bold;">
        <span>Total de Cabeças Cadastradas: ${totalCattle} cabeças</span>
        <span style="color: #1B4D3E;">Valor Estimado Rebanho: R$ ${cattleEstimatedValue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
      </div>
    </div>

    <!-- V. SÍNTESE PATRIMONIAL E CAPACIDADE DE PAGAMENTO -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
      
      <div style="border: 1px solid #d1d5db; border-radius: 4px; padding: 10px; background: #f9fafb;">
        <h3 style="margin: 0 0 6px 0; font-size: 11px; color: #111827; font-weight: bold; text-transform: uppercase;">
          Síntese do Patrimônio Agropecuário
        </h3>
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e5e7eb;">
          <span>1. Terras (Uso Atual):</span>
          <strong>R$ ${totalLandValue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e5e7eb;">
          <span>2. Benfeitorias e Instalações:</span>
          <strong>R$ ${improvementsValue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e5e7eb;">
          <span>3. Máquinas e Implementos:</span>
          <strong>R$ ${machineryValue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e5e7eb;">
          <span>4. Semoventes (Bovinos):</span>
          <strong>R$ ${cattleEstimatedValue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0 0 0; font-weight: bold; color: #1B4D3E; font-size: 12px;">
          <span>PATRIMÔNIO TOTAL BRUTO:</span>
          <span>R$ ${totalPatrimony.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div style="border: 1px solid #d1d5db; border-radius: 4px; padding: 10px; background: #f9fafb;">
        <h3 style="margin: 0 0 6px 0; font-size: 11px; color: #111827; font-weight: bold; text-transform: uppercase;">
          Demonstração da Capacidade de Pagamento
        </h3>
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e5e7eb;">
          <span>Receita Bruta Agropecuária Anual:</span>
          <strong>R$ ${annualRev.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e5e7eb;">
          <span>(-) Custos Operacionais / Custeio:</span>
          <span style="color: #dc2626;">- R$ ${annualExp.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e5e7eb;">
          <span>(-) Dívidas Existentes (SCR / BACEN):</span>
          <span style="color: #dc2626;">- R$ ${debts.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0 0 0; font-weight: bold; color: #065f46; font-size: 12px;">
          <span>CAPACIDADE LÍQUIDA ANUAL:</span>
          <span>R$ ${netCapacity.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
        </div>
      </div>

    </div>

    <!-- DECLARAÇÃO E ASSINATURA -->
    <div style="font-size: 10px; color: #4b5563; text-align: justify; margin-bottom: 24px;">
      Declaro, sob as penas da lei, que as informações cadastrais e os bens patrimoniais acima discriminados são a expressão fiel da verdade e refletem a real situação fundiária, zootécnica e financeira da propriedade rural, autorizando a instituição financeira a realizar as devidas averiguações perante os órgãos competentes e consulta ao SCR/BACEN.
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; font-size: 11px;">
      <div>
        <div style="border-bottom: 1px solid #374151; padding-bottom: 4px; margin-bottom: 6px;">
          <strong>${p.name || 'Proponente'}</strong>
        </div>
        <div style="color: #6b7280;">Assinatura do Proponente</div>
      </div>
      <div>
        <div style="border-bottom: 1px solid #374151; padding-bottom: 4px; margin-bottom: 6px;">
          <strong>${p.spouseName ? p.spouseName : 'Responsável Técnico'}</strong>
        </div>
        <div style="color: #6b7280;">${p.spouseName ? 'Assinatura do Cônjuge' : 'Consultor AgroTech'}</div>
      </div>
    </div>

  </div>
  `
}
