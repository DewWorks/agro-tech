import React from 'react'
import { denormalizeCategoryBB, denormalizePurposeBB } from '@/lib/validations/livestock-mapper'
import { maskRegistrationNumber, maskCAR, maskChassis } from '@/lib/utils/masks'
import { isAnimalOrEquipmentSubline } from '../../form/params/RenovagroParams'
import { formatGlebaRoteiro, sanitizeAccessRoute } from '@/lib/document-templates/limite-credito-bb/formatters'

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
    
    const livestockItems: any[] = options.livestockItems || property.livestockList || property.livestocks || []
    const hasLivestockItems = livestockItems.length > 0

    const cattleHeadValue = options.livestockCattleHeadValue || 2800
    const cattleHeads = hasLivestockItems
      ? livestockItems.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 0), 0)
      : (options.livestockCattleHeads || property.livestockData?.totalCattle || 0)

    const totalCattleValue = hasLivestockItems
      ? livestockItems.reduce((acc: number, item: any) => acc + ((Number(item.quantity) || 0) * (Number(item.unitValue) || cattleHeadValue)), 0)
      : (cattleHeads * cattleHeadValue)

    const totalPatrimony = totalLandValue + improvementsVal + machineryVal + totalCattleValue
    const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
        {/* II - TERRAS E USO DO SOLO */}
        <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ background: '#f3f4f6', padding: '4px 10px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase' }}>
            II - Discriminação de Terras e Uso Atual do Solo ({property.name || 'Propriedade Principal'})
          </div>
          <div style={{ padding: '6px 10px', background: '#fafafa', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
            <span><strong>Matrícula:</strong> {property.registrationNumber ? maskRegistrationNumber(property.registrationNumber) : 'Pendente'} ({property.registryOffice || 'CRI Local'})</span>
            <span><strong>CAR:</strong> {property.car ? maskCAR(property.car) : 'Pendente'}</span>
            <span><strong>Localização:</strong> {property.city || ''}/{property.state || ''}</span>
          </div>
          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f9fafb', fontSize: '10px' }}>
                <th style={{ width: '32%', padding: '8px 10px', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Uso / Discriminação do Solo</th>
                <th style={{ width: '18%', padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Área (Hectares)</th>
                <th style={{ width: '24%', padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Valor Unit. Médio (R$/ha)</th>
                <th style={{ width: '26%', padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Valor Total Estimado</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '8px 10px', verticalAlign: 'middle' }}>Pastagem Formada / Artificial</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{pastArea.toFixed(2)} ha</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{formatBRL(landValuePerHa)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{formatBRL(pastArea * landValuePerHa)}</td>
              </tr>
              {agricArea > 0 && (
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 10px', verticalAlign: 'middle' }}>Agricultura / Lavouras Anuais</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{agricArea.toFixed(2)} ha</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{formatBRL(landValuePerHa * 1.2)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{formatBRL(agricArea * landValuePerHa * 1.2)}</td>
                </tr>
              )}
              {resArea > 0 && (
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 10px', verticalAlign: 'middle' }}>Reserva Legal & APP</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{resArea.toFixed(2)} ha</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{formatBRL(landValuePerHa * 0.4)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{formatBRL(resArea * landValuePerHa * 0.4)}</td>
                </tr>
              )}
              <tr style={{ background: '#f3f4f6', fontWeight: 'bold' }}>
                <td style={{ padding: '8px 10px', verticalAlign: 'middle' }}>ÁREA TOTAL DO IMÓVEL (VTN)</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{totalArea.toFixed(2)} ha</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>-</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#1B4D3E', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{formatBRL(totalLandValue)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* III - BENFEITORIAS E INSTALAÇÕES */}
        <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ background: '#f3f4f6', padding: '6px 12px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', lineHeight: 1.3 }}>
            <span>III - Benfeitorias e Instalações (Referência BB)</span>
            <span style={{ color: '#1B4D3E' }}>Total: {formatBRL(improvementsVal)}</span>
          </div>
          {improvementItems.length > 0 ? (
            <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f9fafb', fontSize: '10px' }}>
                  <th style={{ width: '36%', padding: '8px 10px', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Especificação</th>
                  <th style={{ width: '22%', padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Quant./Dimensão</th>
                  <th style={{ width: '20%', padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Valor Unit.</th>
                  <th style={{ width: '22%', padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {improvementItems.map((item: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 10px', verticalAlign: 'middle' }}>{item.specification}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{item.quantity} {item.unit}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{formatBRL(Number(item.unitValue || 0))}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{formatBRL(Number(item.totalValue || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '8px 12px', fontSize: '10px', color: improvementsVal > 0 ? '#111827' : '#6b7280' }}>
              {improvementsVal > 0 
                ? `Benfeitorias e instalações gerais avaliadas no montante de ${formatBRL(improvementsVal)}.`
                : 'Nenhuma benfeitoria informada (R$ 0,00).'}
            </div>
          )}
        </div>

        {/* IV - MÁQUINAS E EQUIPAMENTOS */}
        <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ background: '#f3f4f6', padding: '6px 12px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', lineHeight: 1.3 }}>
            <span>IV - Máquinas, Veículos e Implementos</span>
            <span style={{ color: '#1B4D3E' }}>Total: {formatBRL(machineryVal)}</span>
          </div>
          {machineryItems.length > 0 ? (
            <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f9fafb', fontSize: '10px' }}>
                  <th style={{ width: '38%', padding: '8px 10px', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Equipamento / Marca / Modelo</th>
                  <th style={{ width: '12%', padding: '8px 10px', textAlign: 'center', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Ano</th>
                  <th style={{ width: '26%', padding: '8px 10px', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Chassi / Nº Série</th>
                  <th style={{ width: '24%', padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Valor Estimado</th>
                </tr>
              </thead>
              <tbody>
                {machineryItems.map((m: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 10px', verticalAlign: 'middle' }}>{m.type} - {m.brand} {m.model}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{m.year}</td>
                    <td style={{ padding: '8px 10px', verticalAlign: 'middle' }}>{m.chassi ? maskChassis(m.chassi) : 'N/I'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{formatBRL(Number(m.value || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '8px 12px', fontSize: '10px', color: machineryVal > 0 ? '#111827' : '#6b7280' }}>
              {machineryVal > 0 
                ? `Frota e parque de maquinários avaliados no montante de ${formatBRL(machineryVal)}.`
                : 'Nenhum maquinário cadastrado (R$ 0,00).'}
            </div>
          )}
        </div>

        {/* V - SEMOVENTES E REBANHO BOVINO */}
        <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', overflow: 'hidden', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <div style={{ background: '#f3f4f6', padding: '6px 12px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: 1.3 }}>
            <span>V - Semoventes e Rebanho Bovino</span>
            <span style={{ color: '#1B4D3E' }}>Total ({cattleHeads} cab): {formatBRL(totalCattleValue)}</span>
          </div>
          {hasLivestockItems ? (
            <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', fontSize: '9.5px' }}>
              <thead>
                <tr style={{ background: '#f9fafb', fontSize: '9px', textTransform: 'uppercase', color: '#374151' }}>
                  <th style={{ width: '16%', padding: '8px 6px', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Categoria (BB)</th>
                  <th style={{ width: '14%', padding: '8px 6px', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Finalidade</th>
                  <th style={{ width: '12%', padding: '8px 6px', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Raça</th>
                  <th style={{ width: '9%', padding: '8px 6px', textAlign: 'center', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Qtd (Cab.)</th>
                  <th style={{ width: '8%', padding: '8px 6px', textAlign: 'center', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Idade</th>
                  <th style={{ width: '8%', padding: '8px 6px', textAlign: 'center', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Peso Médio</th>
                  <th style={{ width: '12%', padding: '8px 6px', textAlign: 'right', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Valor Unit.</th>
                  <th style={{ width: '13%', padding: '8px 6px', textAlign: 'right', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Total Estimado</th>
                  <th style={{ width: '8%', padding: '8px 6px', verticalAlign: 'middle', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Marca e Local</th>
                </tr>
              </thead>
              <tbody>
                {livestockItems.map((item: any, idx: number) => {
                  const qty = Number(item.quantity) || 0
                  const unitVal = Number(item.unitValue) || cattleHeadValue
                  const tot = qty * unitVal
                  const cat = item.category || denormalizeCategoryBB(item.categoryBB) || item.categoryBB || 'Bovino'
                  const purp = denormalizePurposeBB(item.purposeBB) || item.purposeBB || 'Produção'
                  const brandInfo = [item.brandingType, item.brandingLocation].filter(Boolean).join(' - ') || property.livestockData?.brandLocation || 'Conforme Ficha'
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <td style={{ padding: '8px 6px', fontWeight: 600, color: '#111827', verticalAlign: 'middle' }}>{cat}</td>
                      <td style={{ padding: '8px 6px', color: '#4b5563', verticalAlign: 'middle' }}>{purp}</td>
                      <td style={{ padding: '8px 6px', verticalAlign: 'middle' }}>{item.breed || 'Nelore'}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 'bold', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{qty}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{item.ageMonths ? `${item.ageMonths}m` : '-'}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{item.avgWeightKg ? `${item.avgWeightKg}kg` : '-'}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{formatBRL(unitVal)}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600, color: '#1B4D3E', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{formatBRL(tot)}</td>
                      <td style={{ padding: '8px 6px', fontSize: '8.5px', color: '#6b7280', verticalAlign: 'middle' }}>{brandInfo}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '8px 12px', fontSize: '10px', color: cattleHeads > 0 ? '#111827' : '#6b7280' }}>
              {cattleHeads > 0
                ? `Rebanho com estimativa total de ${cattleHeads} cabeças avaliadas em ${formatBRL(totalCattleValue)}.`
                : 'Nenhum animal informado (0 cabeças).'}
            </div>
          )}
        </div>

        {/* RESUMO PATRIMONIAL GERAL */}
        <div style={{ border: '1px solid #1B4D3E', borderRadius: '4px', overflow: 'hidden', background: '#f8fafc' }}>
          <div style={{ background: '#1B4D3E', padding: '4px 10px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
            <span>Resumo Patrimonial Geral Avaliado</span>
            <span>{formatBRL(totalPatrimony)}</span>
          </div>
          <div style={{ padding: '6px 10px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '10px' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Terras (VTN):</span>
              <strong>{formatBRL(totalLandValue)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Benfeitorias:</span>
              <strong>{formatBRL(improvementsVal)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Máquinas:</span>
              <strong>{formatBRL(machineryVal)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Semoventes ({cattleHeads} cab):</span>
              <strong>{formatBRL(totalCattleValue)}</strong>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (templateCode === 'PROJETO_INOVAGRO') {
    return (
      <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '14px', overflow: 'hidden' }}>
        <div style={{ background: '#f3f4f6', padding: '6px 14px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase' }}>
          II - Especificação Técnica do Sistema / Equipamento
        </div>
        <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '11px', lineHeight: 1.4 }}>
          <div><strong>Objeto da Inovação / Equipamento:</strong> {options.equipmentName || '-'}</div>
          <div><strong>Modelo / Especificação:</strong> {options.equipmentSpec || '-'}</div>
          <div><strong>Potência Instalada (kW/cv):</strong> {options.systemPowerKw ? options.systemPowerKw.toFixed(2) : '-'}</div>
          <div><strong>CNAE da Atividade Beneficiada:</strong> {options.cnaeCode || '-'}</div>
        </div>
      </div>
    )
  }

  if (templateCode === 'PROJETO_CUSTEIO_SAFRA') {
    const glebaValue = options?.gleba || options?.glebaName || property?.gleba || property?.glebaName || ''
    const roteiroValue = property?.accessRoute || options?.propertyAccessRoute || options?.accessRoute || ''
    const glebaRoteiro = formatGlebaRoteiro(glebaValue, roteiroValue)

    return (
      <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '14px', overflow: 'hidden' }}>
        <div style={{ background: '#f3f4f6', padding: '6px 14px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase' }}>
          II - Parâmetros Técnicos da Lavoura (Ano Safra {options.safraYear || 'N/A'})
        </div>
        <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '11px', lineHeight: 1.4 }}>
          <div><strong>Cultura:</strong> {options.cropName || '-'}</div>
          <div><strong>Área de Plantio:</strong> {options.cropAreaHa ? `${options.cropAreaHa} ha` : '-'}</div>
          <div><strong>Produtividade Esperada:</strong> {options.expectedYieldScHa ? `${options.expectedYieldScHa} sc/ha` : '-'}</div>
          <div><strong>Gleba / Roteiro:</strong> {glebaRoteiro}</div>
        </div>
      </div>
    )
  }

  if (templateCode === 'PROJETO_RENOVAGRO') {
    const isAnimal = isAnimalOrEquipmentSubline(options.subline)
    const glebaValue = options?.gleba || options?.glebaName || property?.gleba || property?.glebaName || ''
    const roteiroValue = property?.accessRoute || options?.propertyAccessRoute || options?.accessRoute || ''
    const glebaRoteiro = formatGlebaRoteiro(glebaValue, roteiroValue)

    return (
      <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '14px', overflow: 'hidden' }}>
        <div style={{ background: '#f3f4f6', padding: '6px 14px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase' }}>
          {isAnimal ? 'II - Dados Técnicos do Investimento (Semoventes / Bens)' : 'II - Dados Técnicos da Área a Recuperar'}
        </div>
        <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '11px', lineHeight: 1.4 }}>
          <div><strong>Sublinha do Programa:</strong> {options.subline || '-'}</div>
          <div><strong>{isAnimal ? 'Item Financiável / Quantidade:' : 'Área a Recuperar:'}</strong> {options.areaToRecoverHa ? `${options.areaToRecoverHa} ${isAnimal ? 'un/cab' : 'ha'}` : '-'}</div>
          <div><strong>Matrícula Alvo:</strong> {property.registrationNumber ? maskRegistrationNumber(property.registrationNumber) : '-'}</div>
          <div><strong>Localização / Roteiro:</strong> {glebaRoteiro}</div>
        </div>
      </div>
    )
  }

  if (templateCode === 'CHECKLIST_PROFISSIONAL') {
    const glebaValue = options?.gleba || options?.glebaName || property?.gleba || property?.glebaName || ''
    const roteiroValue = property?.accessRoute || options?.propertyAccessRoute || options?.accessRoute || ''
    const glebaRoteiro = formatGlebaRoteiro(glebaValue, roteiroValue)

    return (
      <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '14px', overflow: 'hidden' }}>
        <div style={{ background: '#f3f4f6', padding: '6px 14px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase' }}>
          II - Identificação do Imóvel e da Operação
        </div>
        <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '11px', lineHeight: 1.4 }}>
          <div><strong>Propriedade / Imóvel Beneficiado:</strong> {property.name || '-'}</div>
          <div><strong>Matrícula (CRI):</strong> {property.registrationNumber ? maskRegistrationNumber(property.registrationNumber) : '-'} - {property.registryOffice || '-'}</div>
          <div><strong>Nº do CAR:</strong> {property.car ? maskCAR(property.car) : '-'}</div>
          <div><strong>Área Total:</strong> {property.totalAreaHa ? `${property.totalAreaHa} ha` : '-'}</div>
          <div><strong>Atividade Principal:</strong> {property.explorationActivity || '-'}</div>
          <div><strong>Roteiro de Acesso:</strong> {glebaRoteiro}</div>
          
          <div style={{ gridColumn: 'span 2', height: '1px', background: '#e5e7eb', margin: '4px 0' }}></div>
          
          <div><strong>Instituição Financeira:</strong> {options.targetBank || '-'}</div>
          <div><strong>Finalidade Principal:</strong> {options.purpose || '-'}</div>
        </div>
        
        <div style={{ background: '#f3f4f6', padding: '6px 14px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', borderTop: '1px solid #d1d5db', textTransform: 'uppercase' }}>
          III - Checklist Documental (Para Conferência do RT)
        </div>
        <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '11px', lineHeight: 1.4 }}>
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
