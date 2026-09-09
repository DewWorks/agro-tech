import React from 'react'

interface TechnicalTablesProps {
  templateCode: string
  property: any
  options: any
}

export const TechnicalTables = React.memo(({ templateCode, property, options }: TechnicalTablesProps) => {
  if (templateCode === 'LIMITE_CREDITO_BB') {
    const pastArea = property.pastureAreaHa || 0
    const agricArea = property.agricultureAreaHa || 0
    const resArea = property.preservationAreaHa || 0
    const totalArea = property.totalAreaHa > 0 ? property.totalAreaHa : (pastArea + agricArea + resArea)
    const landValuePerHa = options.estimatedLandValuePerHa || 0
    const totalLandValue = totalArea * landValuePerHa

    const improvementsVal = options.improvementsValue || 0
    const machineryVal = options.machineryValue || 0
    const machineryItems = options.machineryItems || []
    const improvementItems = options.improvementItems || []
    
    const cattleHeads = options.livestockCattleHeads || property.livestockData?.totalCattle || 0
    const cattleHeadValue = options.livestockCattleHeadValue || 2800
    const totalCattleValue = cattleHeads * cattleHeadValue

    const totalPatrimony = totalLandValue + improvementsVal + machineryVal + totalCattleValue

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
        {/* II - TERRAS E USO DO SOLO */}
        <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ background: '#f3f4f6', padding: '4px 10px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase' }}>
            II - Discriminação de Terras e Uso Atual do Solo ({property.name || 'Propriedade Principal'})
          </div>
          <div style={{ padding: '6px 10px', background: '#fafafa', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
            <span><strong>Matrícula:</strong> {property.registrationNumber || 'Pendente'} ({property.registryOffice || 'CRI Local'})</span>
            <span><strong>CAR:</strong> {property.car || 'Pendente'}</span>
            <span><strong>Localização:</strong> {property.city || ''}/{property.state || ''}</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '10px' }}>
                <th style={{ padding: '4px 8px' }}>Uso / Discriminação do Solo</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Área (Hectares)</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Valor Unit. Médio (R$/ha)</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Valor Total Estimado</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '4px 8px' }}>Pastagem Formada / Artificial</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{pastArea.toFixed(2)} ha</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>R$ {landValuePerHa.toLocaleString('pt-BR')}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>R$ {(pastArea * landValuePerHa).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
              </tr>
              {agricArea > 0 && (
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '4px 8px' }}>Agricultura / Lavouras Anuais</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{agricArea.toFixed(2)} ha</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>R$ {(landValuePerHa * 1.2).toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>R$ {(agricArea * landValuePerHa * 1.2).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
                </tr>
              )}
              {resArea > 0 && (
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '4px 8px' }}>Reserva Legal & APP</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{resArea.toFixed(2)} ha</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>R$ {(landValuePerHa * 0.4).toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>R$ {(resArea * landValuePerHa * 0.4).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
                </tr>
              )}
              <tr style={{ background: '#f3f4f6', fontWeight: 'bold' }}>
                <td style={{ padding: '5px 8px' }}>ÁREA TOTAL DO IMÓVEL (VTN)</td>
                <td style={{ padding: '5px 8px', textAlign: 'right' }}>{totalArea.toFixed(2)} ha</td>
                <td style={{ padding: '5px 8px', textAlign: 'right' }}>-</td>
                <td style={{ padding: '5px 8px', textAlign: 'right', color: '#1B4D3E' }}>R$ {totalLandValue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* III - BENFEITORIAS E INSTALAÇÕES */}
        <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ background: '#f3f4f6', padding: '4px 10px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
            <span>III - Benfeitorias e Instalações (Referência BB)</span>
            <span style={{ color: '#1B4D3E' }}>Total: R$ {improvementsVal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
          </div>
          {improvementItems.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '10px' }}>
                  <th style={{ padding: '4px 8px' }}>Especificação</th>
                  <th style={{ padding: '4px 8px', textAlign: 'right' }}>Quant./Dimensão</th>
                  <th style={{ padding: '4px 8px', textAlign: 'right' }}>Valor Unit.</th>
                  <th style={{ padding: '4px 8px', textAlign: 'right' }}>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {improvementItems.map((item: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '4px 8px' }}>{item.specification}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{item.quantity} {item.unit}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>R$ {Number(item.unitValue || 0).toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>R$ {Number(item.totalValue || 0).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '6px 10px', fontSize: '10px', color: improvementsVal > 0 ? '#111827' : '#6b7280' }}>
              {improvementsVal > 0 
                ? `Benfeitorias e instalações gerais avaliadas no montante de R$ ${improvementsVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
                : 'Nenhuma benfeitoria informada (R$ 0,00).'}
            </div>
          )}
        </div>

        {/* IV - MÁQUINAS E EQUIPAMENTOS */}
        <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ background: '#f3f4f6', padding: '4px 10px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
            <span>IV - Máquinas, Veículos e Implementos</span>
            <span style={{ color: '#1B4D3E' }}>Total: R$ {machineryVal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
          </div>
          {machineryItems.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '10px' }}>
                  <th style={{ padding: '4px 8px' }}>Equipamento / Marca / Modelo</th>
                  <th style={{ padding: '4px 8px', textAlign: 'center' }}>Ano</th>
                  <th style={{ padding: '4px 8px' }}>Chassi / Nº Série</th>
                  <th style={{ padding: '4px 8px', textAlign: 'right' }}>Valor Estimado</th>
                </tr>
              </thead>
              <tbody>
                {machineryItems.map((m: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '4px 8px' }}>{m.type} - {m.brand} {m.model}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>{m.year}</td>
                    <td style={{ padding: '4px 8px' }}>{m.chassi || 'N/I'}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>R$ {Number(m.value || 0).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '6px 10px', fontSize: '10px', color: machineryVal > 0 ? '#111827' : '#6b7280' }}>
              {machineryVal > 0 
                ? `Frota e parque de maquinários avaliados no montante de R$ ${machineryVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
                : 'Nenhum maquinário cadastrado (R$ 0,00).'}
            </div>
          )}
        </div>

        {/* SEMOVENTES / REBANHO & RESUMO PATRIMONIAL */}
        <div style={{ border: '1px solid #1B4D3E', borderRadius: '4px', overflow: 'hidden', background: '#f8fafc' }}>
          <div style={{ background: '#1B4D3E', padding: '4px 10px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
            <span>Resumo Patrimonial Geral Avaliado</span>
            <span>R$ {totalPatrimony.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ padding: '6px 10px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '10px' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Terras (VTN):</span>
              <strong>R$ {totalLandValue.toLocaleString('pt-BR')}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Benfeitorias:</span>
              <strong>R$ {improvementsVal.toLocaleString('pt-BR')}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Máquinas:</span>
              <strong>R$ {machineryVal.toLocaleString('pt-BR')}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Semoventes ({cattleHeads} cab):</span>
              <strong>R$ {totalCattleValue.toLocaleString('pt-BR')}</strong>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (templateCode === 'PROJETO_INOVAGRO') {
    return (
      <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
        <div style={{ background: '#f3f4f6', padding: '4px 10px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase' }}>
          II - Especificação Técnica do Sistema / Equipamento
        </div>
        <div style={{ padding: '8px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <div><strong>Objeto da Inovação / Equipamento:</strong> {options.equipmentName || '-'}</div>
          <div><strong>Modelo / Especificação:</strong> {options.equipmentSpec || '-'}</div>
          <div><strong>Potência Instalada (kW/cv):</strong> {options.systemPowerKw ? options.systemPowerKw.toFixed(2) : '-'}</div>
          <div><strong>CNAE da Atividade Beneficiada:</strong> {options.cnaeCode || '-'}</div>
        </div>
      </div>
    )
  }

  if (templateCode === 'PROJETO_CUSTEIO_SAFRA') {
    return (
      <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
        <div style={{ background: '#f3f4f6', padding: '4px 10px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase' }}>
          II - Parâmetros Técnicos da Lavoura (Ano Safra {options.safraYear || 'N/A'})
        </div>
        <div style={{ padding: '8px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <div><strong>Cultura:</strong> {options.cropName || '-'}</div>
          <div><strong>Área de Plantio:</strong> {options.cropAreaHa ? `${options.cropAreaHa} ha` : '-'}</div>
          <div><strong>Produtividade Esperada:</strong> {options.expectedYieldScHa ? `${options.expectedYieldScHa} sc/ha` : '-'}</div>
          <div><strong>Gleba / Roteiro:</strong> {property.accessRoute || '-'}</div>
        </div>
      </div>
    )
  }

  if (templateCode === 'PROJETO_RENOVAGRO') {
    return (
      <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
        <div style={{ background: '#f3f4f6', padding: '4px 10px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase' }}>
          II - Dados Técnicos da Área a Recuperar
        </div>
        <div style={{ padding: '8px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <div><strong>Sublinha do Programa:</strong> {options.subline || '-'}</div>
          <div><strong>Área a Recuperar:</strong> {options.areaToRecoverHa ? `${options.areaToRecoverHa} ha` : '-'}</div>
          <div><strong>Matrícula Alvo:</strong> {property.registrationNumber || '-'}</div>
          <div><strong>Localização / Roteiro:</strong> {property.accessRoute || '-'}</div>
        </div>
      </div>
    )
  }

  if (templateCode === 'CHECKLIST_PROFISSIONAL') {
    return (
      <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
        <div style={{ background: '#f3f4f6', padding: '4px 10px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase' }}>
          II - Identificação do Imóvel e da Operação
        </div>
        <div style={{ padding: '8px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <div><strong>Propriedade / Imóvel Beneficiado:</strong> {property.name || '-'}</div>
          <div><strong>Matrícula (CRI):</strong> {property.registrationNumber || '-'} - {property.registryOffice || '-'}</div>
          <div><strong>Nº do CAR:</strong> {property.car || '-'}</div>
          <div><strong>Área Total:</strong> {property.totalAreaHa ? `${property.totalAreaHa} ha` : '-'}</div>
          <div><strong>Atividade Principal:</strong> {property.explorationActivity || '-'}</div>
          <div><strong>Roteiro de Acesso:</strong> {property.accessRoute || '-'}</div>
          
          <div style={{ gridColumn: 'span 2', height: '1px', background: '#e5e7eb', margin: '4px 0' }}></div>
          
          <div><strong>Instituição Financeira:</strong> {options.targetBank || '-'}</div>
          <div><strong>Finalidade Principal:</strong> {options.purpose || '-'}</div>
        </div>
        
        <div style={{ background: '#f3f4f6', padding: '4px 10px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', borderTop: '1px solid #d1d5db', textTransform: 'uppercase' }}>
          III - Checklist Documental (Para Conferência do RT)
        </div>
        <div style={{ padding: '8px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div><input type="checkbox" checked readOnly style={{ marginRight: '6px' }}/> Documentos Pessoais (RG, CPF, CNH)</div>
          <div><input type="checkbox" checked readOnly style={{ marginRight: '6px' }}/> Comprovante de Estado Civil</div>
          <div><input type="checkbox" checked readOnly style={{ marginRight: '6px' }}/> Certidão de Inteiro Teor (Matrícula)</div>
          <div><input type="checkbox" checked readOnly style={{ marginRight: '6px' }}/> CAR / CCIR / ITR</div>
          <div><input type="checkbox" checked readOnly style={{ marginRight: '6px' }}/> Declaração de Posse Mansa / Contratos</div>
          <div><input type="checkbox" checked readOnly style={{ marginRight: '6px' }}/> Licenciamento / Regularidade Ambiental</div>
        </div>
      </div>
    )
  }

  return null
})
TechnicalTables.displayName = 'TechnicalTables'
