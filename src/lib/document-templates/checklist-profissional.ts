import { formatCPF, formatCNPJ } from '@/lib/validations'

export interface ChecklistDocumentData {
  producer: {
    name: string
    document: string
    type: 'PF' | 'PJ'
    spouseName?: string
    spouseCpf?: string
    phone?: string
    city?: string
    state?: string
    street?: string
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
    phone?: string
    ownerName?: string
  }
  branch?: {
    name: string
  }
  options?: {
    targetBank?: string
    purpose?: string
    entryDate?: string
    responsibleName?: string
    agronomistCrea?: string
    itemsState?: Record<string, boolean>
  }
}

export function generateChecklistProfissionalHtml(data: ChecklistDocumentData): string {
  const p = data.producer
  const prop = data.property
  const opt = data.options || {}
  
  const orgName = data.organization?.name || 'LN - CONSULTORIA E PROJETOS RURAIS'
  const orgCnpj = data.organization?.cnpj ? formatCNPJ(data.organization.cnpj) : ''
  const orgOwnerName = data.organization?.ownerName || opt.responsibleName || 'João Victor Póvoa França'

  const docFormatted = p.type === 'PF' ? formatCPF(p.document) : formatCNPJ(p.document)
  const spouseDocFormatted = p.spouseCpf ? formatCPF(p.spouseCpf) : ''
  const bank = opt.targetBank || 'Banco do Brasil'
  const purpose = opt.purpose || 'Custeio / Investimento Agropecuário'
  const entryDate = opt.entryDate || new Date().toLocaleDateString('pt-BR')
  const responsible = orgOwnerName

  return `
  <div class="document-page" style="font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; line-height: 1.5; padding: 24px; max-width: 800px; margin: 0 auto; background: #fff;">
    
    <!-- CABEÇALHO OFICIAL -->
    <div style="border-bottom: 2px solid #1B4D3E; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h1 style="font-size: 18px; font-weight: 800; color: #1B4D3E; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
          Checklist de Atendimento – Projeto de Crédito Rural
        </h1>
        <p style="font-size: 11px; color: #6b7280; margin: 4px 0 0 0;">
          ${data.organization.name} ${data.branch?.name ? '• ' + data.branch.name : ''} • Esteira Operacional de Crédito
        </p>
      </div>
      <div style="text-align: right; font-size: 11px; color: #374151;">
        <span style="display: inline-block; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 4px; font-weight: bold;">
          Foco ${bank}
        </span>
      </div>
    </div>

    <!-- QUADRO DE IDENTIFICAÇÃO -->
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; font-size: 12px;">
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px; margin-bottom: 6px;">
        <div><strong>Cliente / Proponente:</strong> ${p.name || '________________________________________'}</div>
        <div><strong>CPF / CNPJ:</strong> ${docFormatted || '______________________'}</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px;">
        <div><strong>Instituição Financeira:</strong> ${bank}</div>
        <div><strong>Data de Entrada:</strong> ${entryDate}</div>
      </div>
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px; margin-bottom: 6px;">
        <div><strong>Imóvel Rural:</strong> ${prop.name || '__________________________'} (${prop.city || ''}/${prop.state || ''})</div>
        <div><strong>Matrícula:</strong> ${prop.registrationNumber ? prop.registrationNumber + ' (' + (prop.registryOffice || 'CRI') + ')' : 'Pendente'}</div>
      </div>
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px;">
        <div><strong>Finalidade Principal:</strong> ${purpose}</div>
        <div><strong>Responsável Técnico:</strong> ${responsible}</div>
      </div>
    </div>

    <!-- SEÇÕES DO CHECKLIST -->
    <div style="display: flex; flex-direction: column; gap: 16px; font-size: 12px;">
      
      <!-- 1. DOCUMENTAÇÃO PESSOAL -->
      <div style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
        <div style="background: #1B4D3E; color: #fff; padding: 6px 12px; font-weight: bold; font-size: 12px; text-transform: uppercase;">
          1. Documentação Pessoal do Proponente e Cônjuge
        </div>
        <div style="padding: 10px 14px; background: #fff; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" checked style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>CPF e RG ou CNH (Proponente)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" ${p.spouseName ? 'checked' : ''} style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>CPF e RG ou CNH (Cônjuge / Outorga)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" ${p.spouseName ? 'checked' : ''} style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>Certidão de Casamento / União Estável</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" checked style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>Comprovante de Endereço Atualizado</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" checked style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>Declaração de IRPF + Recibo de Entrega</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" checked style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>Autorização de Consulta SCR / BACEN</span>
          </div>
        </div>
      </div>

      <!-- 2. DOCUMENTAÇÃO DA PROPRIEDADE -->
      <div style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
        <div style="background: #1B4D3E; color: #fff; padding: 6px 12px; font-weight: bold; font-size: 12px; text-transform: uppercase;">
          2. Documentação Fundiária e Ambiental da Propriedade
        </div>
        <div style="padding: 10px 14px; background: #fff; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" ${prop.registrationNumber ? 'checked' : ''} style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>Certidão de Inteiro Teor da Matrícula (atualizada)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" checked style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>CCIR - Certificado de Cadastro de Imóvel Rural Vigente</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" checked style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>ITR - Imposto Territorial Rural (DIAT / DIAC)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" ${prop.car ? 'checked' : ''} style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>CAR - Cadastro Ambiental Rural (Ativo / Homologado)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" checked style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>Mapa / Croqui Georreferenciado com Poligonal</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" ${prop.accessRoute ? 'checked' : ''} style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>Roteiro de Acesso detalhado desde o Centro da Cidade</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>Contrato de Arrendamento / Comodato / Parceria (se houver)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>Outorga de Água / DUI / Dispensa (quando aplicável)</span>
          </div>
        </div>
      </div>

      <!-- 3. DOCUMENTAÇÃO DA GARANTIA -->
      <div style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
        <div style="background: #1B4D3E; color: #fff; padding: 6px 12px; font-weight: bold; font-size: 12px; text-transform: uppercase;">
          3. Documentação das Garantias Vinculadas
        </div>
        <div style="padding: 10px 14px; background: #fff; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>Certidão de Ônus Reais e Ações (< 30 dias)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>Certidão de Cadeia Dominial Quinzenária</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>Comprovante de Exploração Pecuária (ADAPEC / INDEF)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>Nota Fiscal e Fotos de Máquinas / Equipamentos</span>
          </div>
        </div>
      </div>

      <!-- 4. DOCUMENTOS TÉCNICOS DO PROJETO -->
      <div style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
        <div style="background: #1B4D3E; color: #fff; padding: 6px 12px; font-weight: bold; font-size: 12px; text-transform: uppercase;">
          4. Documentos Técnicos e Orçamentários do Projeto
        </div>
        <div style="padding: 10px 14px; background: #fff; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" checked style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>Orçamento Discriminado com Cotações</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" checked style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>Memorial Descritivo e Justificativa Agronômica</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" checked style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>Plano de Investimento e Cronograma Físico-Financeiro</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" checked style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>ART / TRT com Comprovante de Pagamento</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>Laudo de Análise Química e Física de Solo (0-20 e 20-40cm)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" style="accent-color: #1B4D3E; width: 14px; height: 14px;" />
            <span>Demonstração de Capacidade de Pagamento / Fluxo de Caixa</span>
          </div>
        </div>
      </div>

      <!-- 5. TABELA DE CONTROLE INTERNO DO ESCRITÓRIO -->
      <div style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
        <div style="background: #374151; color: #fff; padding: 6px 12px; font-weight: bold; font-size: 12px; text-transform: uppercase;">
          5. Controle Interno e Acompanhamento da Esteira
        </div>
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 11px;">
          <thead>
            <tr style="background: #f3f4f6; border-bottom: 1px solid #e5e7eb;">
              <th style="padding: 6px 12px;">Etapa Operacional</th>
              <th style="padding: 6px 12px;">Data Prevista / Realizada</th>
              <th style="padding: 6px 12px;">Responsável / Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 6px 12px; font-weight: 600;">1. Atendimento Inicial & Triagem</td>
              <td style="padding: 6px 12px;">${entryDate}</td>
              <td style="padding: 6px 12px; color: #065f46; font-weight: bold;">Concluído</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 6px 12px; font-weight: 600;">2. Recebimento e Conferência de Documentos</td>
              <td style="padding: 6px 12px;">___ / ___ / ______</td>
              <td style="padding: 6px 12px;">Em Validação</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 6px 12px; font-weight: 600;">3. Elaboração do Projeto Técnico & ART</td>
              <td style="padding: 6px 12px;">___ / ___ / ______</td>
              <td style="padding: 6px 12px;">${responsible}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 6px 12px; font-weight: 600;">4. Assinatura do Cliente e Protocolo no Banco</td>
              <td style="padding: 6px 12px;">___ / ___ / ______</td>
              <td style="padding: 6px 12px;">Agência ${bank}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 6px 12px; font-weight: 600;">5. Parecer e Aprovação de Crédito (SICOR)</td>
              <td style="padding: 6px 12px;">___ / ___ / ______</td>
              <td style="padding: 6px 12px;">Comitê de Crédito</td>
            </tr>
            <tr>
              <td style="padding: 6px 12px; font-weight: 600;">6. Contratação e Liberação de Recursos</td>
              <td style="padding: 6px 12px;">___ / ___ / ______</td>
              <td style="padding: 6px 12px;">Conta Corrente Vinculada</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- ASSINATURAS -->
    <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; font-size: 11px;">
      <div>
        <div style="border-bottom: 1px solid #374151; padding-bottom: 4px; margin-bottom: 6px;">
          <strong>${p.name || 'Produtor Rural Proponente'}</strong>
        </div>
        <div style="color: #111827; font-weight: 600; font-size: 10.5px;">${p.type === 'PJ' ? 'CNPJ' : 'CPF'}: ${docFormatted || p.document || '-'}</div>
        <div style="color: #6b7280; font-size: 10px;">Assinatura do Proponente</div>
      </div>
      <div>
        <div style="border-bottom: 1px solid #374151; padding-bottom: 4px; margin-bottom: 6px;">
          <strong>${orgOwnerName}</strong>
        </div>
        <div style="color: #111827; font-weight: 600; font-size: 10.5px;">${orgName}</div>
        ${orgCnpj ? `<div style="color: #4b5563; font-size: 10px;">CNPJ: ${orgCnpj}</div>` : ''}
        <div style="color: #6b7280; font-size: 10px;">Responsável Técnico / Elaborador</div>
      </div>
    </div>

  </div>
  `
}
