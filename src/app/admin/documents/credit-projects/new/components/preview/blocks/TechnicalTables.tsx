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

    return (
      <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
        <div style={{ background: '#f3f4f6', padding: '4px 10px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase' }}>
          II - Discriminação de Terras e Uso Atual do Solo ({property.name || 'Propriedade Principal'})
        </div>
        <div style={{ padding: '6px 10px', background: '#fafafa', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
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
            <tr style={{ background: '#f3f4f6', fontWeight: 'bold' }}>
              <td style={{ padding: '5px 8px' }}>ÁREA TOTAL DO IMÓVEL</td>
              <td style={{ padding: '5px 8px', textAlign: 'right' }}>{totalArea.toFixed(2)} ha</td>
              <td style={{ padding: '5px 8px', textAlign: 'right' }}>-</td>
              <td style={{ padding: '5px 8px', textAlign: 'right', color: '#1B4D3E' }}>R$ {totalLandValue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
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

  return null
})
TechnicalTables.displayName = 'TechnicalTables'
