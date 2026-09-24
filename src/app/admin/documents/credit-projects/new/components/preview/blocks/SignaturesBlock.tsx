import React from 'react'
import { getDocumentTypeAndLabel, formatCPF } from '@/lib/utils/masks'

interface SignaturesBlockProps {
  organization: any
  options: any
  producer: any
}

export const SignaturesBlock = React.memo(({ organization, options, producer }: SignaturesBlockProps) => {
  const { label: docLabel, formatted: docFormatted, isCnpj } = getDocumentTypeAndLabel(producer?.document, producer?.type)
  const spouseDocFormatted = producer?.spouseCpf ? formatCPF(producer.spouseCpf) : ''
  const hasSpouse = Boolean(producer?.spouseName && !isCnpj)

  return (
    <div style={{ marginTop: '30px', pageBreakInside: 'avoid' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px', fontSize: '10px' }}>
        Declaramos que as informações prestadas são expressões da verdade.
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: hasSpouse ? '1fr 1fr 1fr' : '1fr 1fr', gap: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #111827', margin: '0 10px', paddingTop: '4px' }}>
            <strong>{producer?.name || 'Proponente'}</strong><br/>
            <span style={{ whiteSpace: 'nowrap' }}>{docLabel}: {docFormatted || '-'}</span><br/>
            {isCnpj && producer?.representativeCpf ? (
              <span style={{ fontSize: '9px', color: '#374151', whiteSpace: 'nowrap', display: 'inline-block' }}>
                Rep. Legal CPF: {formatCPF(producer.representativeCpf)}
              </span>
            ) : null}
            <div style={{ fontSize: '9.5px', color: '#6b7280', marginTop: '2px' }}>Proponente</div>
          </div>
        </div>

        {hasSpouse ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #111827', margin: '0 10px', paddingTop: '4px' }}>
              <strong>{producer.spouseName}</strong><br/>
              <span style={{ whiteSpace: 'nowrap' }}>CPF: {spouseDocFormatted || '-'}</span><br/>
              {producer.spouseRg ? (
                <span style={{ fontSize: '9px', color: '#374151', whiteSpace: 'nowrap', display: 'inline-block' }}>
                  RG: {producer.spouseRg}
                </span>
              ) : null}
              <div style={{ fontSize: '9.5px', color: '#6b7280', marginTop: '2px' }}>Cônjuge (Outorga Uxória)</div>
            </div>
          </div>
        ) : null}
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #111827', margin: '0 10px', paddingTop: '4px' }}>
            <strong>{organization.ownerName || options.responsibleName || 'Responsável Técnico'}</strong><br/>
            Responsável Técnico<br/>
            CREA: {options.creaNumber || 'Pendente'}
            <div style={{ fontSize: '9.5px', color: '#6b7280', marginTop: '2px' }}>Elaborador / RT</div>
          </div>
        </div>
      </div>
    </div>
  )
})
SignaturesBlock.displayName = 'SignaturesBlock'
