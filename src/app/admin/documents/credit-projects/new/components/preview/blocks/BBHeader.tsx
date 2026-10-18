import React from 'react'

interface BBHeaderProps {
  title: string
  subtitle: string
  organization?: {
    name?: string
    tradeName?: string
    logoHorizontalUrl?: string
    logoHorizontalBase64?: string
    primaryColorHex?: string
  } | null
}

export const BBHeader = React.memo(({ title, subtitle, organization }: BBHeaderProps) => {
  const companyName = organization?.tradeName || organization?.name || 'LN Consultoria e Projetos Rurais'
  const primaryColor = organization?.primaryColorHex || '#1B4D3E'
  const logo = organization?.logoHorizontalBase64 || organization?.logoHorizontalUrl

  return (
    <div
      className="dossie-header-container"
      style={{
        minHeight: '52px',
        maxHeight: '52px',
        height: '52px',
        borderBottom: `2px solid ${primaryColor}`,
        paddingBottom: '4px',
        marginBottom: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '50px', overflow: 'hidden' }}>
        <div
          style={{
            width: '170px',
            height: '50px',
            minWidth: '170px',
            maxWidth: '170px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {logo ? (
            <img
              src={logo}
              alt={companyName}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                objectPosition: 'left center',
                display: 'block',
                margin: 0,
                padding: 0,
              }}
            />
          ) : (
            <div
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: primaryColor,
                textTransform: 'uppercase',
                lineHeight: 1.1,
                letterSpacing: '-0.3px',
              }}
            >
              {companyName}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1
            style={{
              fontSize: '13.5px',
              fontWeight: 800,
              color: primaryColor,
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
          <p style={{ fontSize: '8.5px', color: '#4b5563', margin: '2px 0 0 0', fontWeight: 600, lineHeight: 1.2 }}>
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  )
})

BBHeader.displayName = 'BBHeader'
