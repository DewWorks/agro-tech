import React from 'react'
import { getDocumentTypeAndLabel, formatCPF } from '@/lib/utils/masks'

interface SignaturesBlockProps {
  organization: any
  options: any
  producer: any
}

export const SignaturesBlock = React.memo(({ organization, options, producer }: SignaturesBlockProps) => {
  const { label: docLabel, formatted: docFormatted, isCnpj } = getDocumentTypeAndLabel(producer?.document, producer?.type)

  return (
    <div style={{ marginTop: '30px', pageBreakInside: 'avoid' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px', fontSize: '10px' }}>
        Declaramos que as informações prestadas são expressões da verdade.
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #111827', margin: '0 20px', paddingTop: '4px' }}>
            <strong>{producer?.name || 'Proponente'}</strong><br/>
            <span style={{ whiteSpace: 'nowrap' }}>{docLabel}: {docFormatted || '-'}</span><br/>
            {isCnpj && producer?.representativeCpf ? (
              <span style={{ fontSize: '9px', color: '#374151', whiteSpace: 'nowrap', display: 'inline-block' }}>
                Rep. Legal CPF: {formatCPF(producer.representativeCpf)}
              </span>
            ) : null}
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #111827', margin: '0 20px', paddingTop: '4px' }}>
            <strong>{organization.ownerName || options.responsibleName || 'Responsável Técnico'}</strong><br/>
            Responsável Técnico<br/>
            CREA: {options.creaNumber || 'Pendente'}
          </div>
        </div>
      </div>
    </div>
  )
})
SignaturesBlock.displayName = 'SignaturesBlock'
