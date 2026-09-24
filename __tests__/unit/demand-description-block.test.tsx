import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DemandDescriptionBlock } from '@/components/demands/DemandDescriptionBlock'

describe('DemandDescriptionBlock — Descrição Unificada e Notas Internas', () => {
  it('deve renderizar a descrição padrão curta sem botão de expandir', () => {
    render(<DemandDescriptionBlock description="Projeto de crédito agrícola safra 2026." />)

    expect(screen.getByText('Descrição:')).toBeInTheDocument()
    expect(screen.getByText('Projeto de crédito agrícola safra 2026.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ver mais/i })).not.toBeInTheDocument()
  })

  it('deve renderizar mensagem amigável quando a descrição for vazia', () => {
    render(<DemandDescriptionBlock description={null} />)

    expect(screen.getByText('Nenhuma descrição detalhada informada.')).toBeInTheDocument()
  })

  it('deve truncar textos longos (> 150 caracteres) e permitir expandir/colapsar', () => {
    const longText =
      'Esta é uma descrição de projeto extremamente detalhada contendo requisitos específicos sobre coordenadas georreferenciadas, zoneamento agroclimático, cronograma de desembolso bancário e laudos de vistoria prévia da área de plantio de soja e milho safrinha.'

    render(<DemandDescriptionBlock description={longText} charLimit={150} />)

    // Inicialmente truncado
    expect(screen.getByRole('button', { name: /ver mais/i })).toBeInTheDocument()
    expect(screen.queryByText(/soja e milho safrinha/)).not.toBeInTheDocument()

    // Clica para expandir
    fireEvent.click(screen.getByRole('button', { name: /ver mais/i }))
    expect(screen.getByRole('button', { name: /colapsar/i })).toBeInTheDocument()
    expect(screen.getByText(/soja e milho safrinha/)).toBeInTheDocument()

    // Clica para colapsar novamente
    fireEvent.click(screen.getByRole('button', { name: /colapsar/i }))
    expect(screen.getByRole('button', { name: /ver mais/i })).toBeInTheDocument()
  })

  it('deve renderizar o bloco de notas internas quando fornecido', () => {
    render(
      <DemandDescriptionBlock
        description="Descrição curta."
        notes="Prioridade urgente para protocolo bancário até sexta-feira."
      />
    )

    expect(screen.getByText('Notas Internas:')).toBeInTheDocument()
    expect(
      screen.getByText('Prioridade urgente para protocolo bancário até sexta-feira.')
    ).toBeInTheDocument()
  })
})
