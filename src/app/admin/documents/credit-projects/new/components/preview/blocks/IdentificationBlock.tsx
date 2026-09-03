import React from 'react'
import { formatCPF, formatCNPJ } from '../../../utils/wizard-utils'

interface IdentificationBlockProps {
  producer: any
  property: any
}

export const IdentificationBlock = React.memo(({ producer, property }: IdentificationBlockProps) => {
  const docFormatted = producer.type === 'PF' ? formatCPF(producer.document) : formatCNPJ(producer.document)
  const spouseDocFormatted = producer.spouseCpf ? formatCPF(producer.spouseCpf) : ''

  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
      <div style={{ background: '#f3f4f6', padding: '4px 10px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase' }}>
        I - Identificação do Proponente e Cônjuge
      </div>
      <div style={{ padding: '8px 10px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '6px' }}>
        <div><strong>Nome / Razão Social:</strong> {producer.name || '-'}</div>
        <div><strong>CPF / CNPJ:</strong> {docFormatted || '-'}</div>
        <div><strong>Estado Civil:</strong> {producer.civilStatus || 'Casado(a)'}</div>
        <div style={{ gridColumn: 'span 2' }}><strong>Cônjuge:</strong> {producer.spouseName || 'Não informado / Não aplicável'}</div>
        <div><strong>CPF Cônjuge:</strong> {spouseDocFormatted || '-'}</div>
        <div style={{ gridColumn: 'span 2' }}><strong>Endereço / Município:</strong> {producer.street ? producer.street + ', ' : ''}{producer.city || ''} - {producer.state || ''}</div>
        <div><strong>Telefone:</strong> {producer.phone || '-'}</div>
      </div>
    </div>
  )
})
IdentificationBlock.displayName = 'IdentificationBlock'
