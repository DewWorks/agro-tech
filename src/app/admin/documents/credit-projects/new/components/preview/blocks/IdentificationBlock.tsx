import React from 'react'
import { getDocumentTypeAndLabel, formatCPF } from '@/lib/utils/masks'

interface IdentificationBlockProps {
  producer: any
  property: any
}

export const IdentificationBlock = React.memo(({ producer, property }: IdentificationBlockProps) => {
  const { label: docLabel, formatted: docFormatted, isCnpj } = getDocumentTypeAndLabel(producer.document, producer.type)
  const spouseDocFormatted = producer.spouseCpf ? formatCPF(producer.spouseCpf) : ''
  const repCpfFormatted = producer.representativeCpf ? formatCPF(producer.representativeCpf) : ''

  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
      <div style={{ background: '#f3f4f6', padding: '4px 10px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase' }}>
        {isCnpj ? 'I - Identificação da Empresa Proponente & Representante Legal' : 'I - Identificação do Proponente e Cônjuge'}
      </div>
      <div style={{ padding: '8px 12px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6px 16px', fontSize: '11px', lineHeight: '1.5' }}>
        <div><strong>{isCnpj ? 'Razão Social:' : 'Nome:'}</strong> {producer.name || '-'}</div>
        <div style={{ whiteSpace: 'nowrap' }}><strong>{docLabel}:</strong> {docFormatted || '-'}</div>
        
        {isCnpj ? (
          <>
            <div><strong>Representante Legal:</strong> {producer.representativeName || 'Administrador(a) / Titular'}</div>
            <div style={{ whiteSpace: 'nowrap' }}><strong>CPF Representante:</strong> {repCpfFormatted || '-'}</div>
            <div><strong>Natureza:</strong> Pessoa Jurídica (PJ)</div>
            <div style={{ whiteSpace: 'nowrap' }}><strong>Telefone:</strong> {producer.phone || '-'}</div>
          </>
        ) : (
          <>
            <div><strong>Cônjuge:</strong> {producer.spouseName || 'Não informado / Não aplicável'}</div>
            <div style={{ whiteSpace: 'nowrap' }}><strong>CPF Cônjuge:</strong> {spouseDocFormatted || '-'}</div>
            <div>
              <strong>Estado Civil:</strong> {producer.civilStatus || 'Solteiro(a)'}
              {producer.spouseRg ? ` | RG Cônjuge: ${producer.spouseRg}${producer.spouseRgIssuer ? ` (${producer.spouseRgIssuer})` : ''}` : ''}
            </div>
            <div style={{ whiteSpace: 'nowrap' }}>
              <strong>Regime de Bens:</strong> {
                producer.marriageRegime === 'COMUNHAO_PARCIAL' ? 'Comunhão Parcial de Bens' :
                producer.marriageRegime === 'COMUNHAO_UNIVERSAL' ? 'Comunhão Universal de Bens' :
                producer.marriageRegime === 'SEPARACAO_TOTAL' ? 'Separação Total de Bens' :
                producer.marriageRegime === 'PARTICIPACAO_FINAL' ? 'Participação Final nos Aquestos' :
                (producer.marriageRegime || 'Não informado / Não aplicável')
              }
            </div>
            <div><strong>Telefone:</strong> {producer.phone || '-'}</div>
            {producer.spouseNationality ? <div><strong>Nacionalidade Cônjuge:</strong> {producer.spouseNationality}</div> : <div />}
          </>
        )}
        
        <div style={{ gridColumn: 'span 2' }}><strong>Endereço / Município:</strong> {producer.street ? producer.street + ', ' : ''}{producer.city || ''} - {producer.state || ''}</div>
      </div>
    </div>
  )
})
IdentificationBlock.displayName = 'IdentificationBlock'
