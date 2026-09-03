import React from 'react'

interface BBHeaderProps {
  title: string
  subtitle: string
}

export const BBHeader = React.memo(({ title, subtitle }: BBHeaderProps) => {
  return (
    <div style={{ borderBottom: '2px solid #1B4D3E', paddingBottom: '8px', marginBottom: '14px' }}>
      <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#1B4D3E', margin: 0, textTransform: 'uppercase' }}>
        {title}
      </h1>
      <p style={{ fontSize: '10px', color: '#6b7280', margin: '2px 0 0 0' }}>
        {subtitle}
      </p>
    </div>
  )
})
BBHeader.displayName = 'BBHeader'
