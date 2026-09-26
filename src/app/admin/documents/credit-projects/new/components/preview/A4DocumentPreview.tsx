import React from 'react'
import { BBHeader } from './blocks/BBHeader'
import { IdentificationBlock } from './blocks/IdentificationBlock'
import { TechnicalTables } from './blocks/TechnicalTables'
import { FinancialBlock } from './blocks/FinancialBlock'
import { SignaturesBlock } from './blocks/SignaturesBlock'

interface A4DocumentPreviewProps {
  documentData?: {
    template: any
    producer: any
    property: any
    organization: any
    options: any
  } | null
  data?: {
    template: any
    producer: any
    property: any
    organization: any
    options: any
  } | null
}

import { DeclarationContent } from './blocks/DeclarationContent'

export const A4DocumentPreview = React.memo(({ documentData, data }: A4DocumentPreviewProps) => {
  const doc = documentData || data
  if (!doc) return null

  const { template, producer, property, organization, options } = doc

  const isLegalTemplate = [
    'AUTORIZACAO_COMPARTILHAMENTO',
    'AUTORIZACAO_SCR',
    'AUTORIZACAO_SICOR',
    'DECLARACAO_POSSE_MANSA',
    'DECLARACAO_REGULARIDADE_AMBIENTAL',
    'DECLARACAO_FORA_BIOMA',
    'ENQUADRAMENTO_CAF',
    'IDENTIFICACAO_ANIMAIS'
  ].includes(template.code)

  return (
    <div 
      className="document-page" 
      style={{ 
        fontFamily: "'Segoe UI', Arial, sans-serif", 
        color: '#1f2937', 
        lineHeight: 1.4, 
        padding: '24px', 
        maxWidth: '800px', 
        margin: '0 auto', 
        background: '#fff', 
        fontSize: '11px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <BBHeader 
        title={template.title} 
        subtitle={isLegalTemplate ? `Declaração Legal • Banco do Brasil` : `Dossiê para ${template.category} • Banco do Brasil`} 
      />
      
      <IdentificationBlock producer={producer} property={property} options={options} />
      
      {isLegalTemplate ? (
        <DeclarationContent 
          templateCode={template.code} 
          producer={producer} 
          property={property} 
          options={options} 
        />
      ) : (
        <>
          <TechnicalTables 
            templateCode={template.code} 
            property={property} 
            options={options} 
          />
          
          <FinancialBlock 
            templateCode={template.code} 
            options={options} 
          />
        </>
      )}
      
      <SignaturesBlock 
        organization={organization} 
        options={options} 
        producer={producer} 
      />
    </div>
  )
})
A4DocumentPreview.displayName = 'A4DocumentPreview'
