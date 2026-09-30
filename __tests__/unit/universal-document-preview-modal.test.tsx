import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { UniversalDocumentPreviewModal } from '@/components/documents/UniversalDocumentPreviewModal'

describe('UniversalDocumentPreviewModal - Componente Modular de Pré-Visualização', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Pré-Visualização do Dossiê Técnico — Fazenda Santa Maria',
    subtitle: 'João da Silva',
    dpiInfo: 'Resolução Nativa 336 DPI • 3 Páginas Padronizadas • Conformidade BACEN/MCR',
    pages: [
      <div key="1" data-testid="page-1">Página 1 - Enquadramento e Dados Fundiários</div>,
      <div key="2" data-testid="page-2">Página 2 - Balanço de Bens e Rendas</div>,
      <div key="3" data-testid="page-3">Página 3 - Parecer e Assinaturas Homologadas</div>,
    ],
    onConfirm: jest.fn(),
    primaryActionLabel: 'Confirmar e Baixar Documento Oficial (PDF)',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve renderizar o título, subtítulo e resolução técnica explicada no rodapé', () => {
    render(<UniversalDocumentPreviewModal {...defaultProps} />)

    expect(
      screen.getByText('Pré-Visualização do Dossiê Técnico — Fazenda Santa Maria')
    ).toBeInTheDocument()
    expect(screen.getByText('• João da Silva')).toBeInTheDocument()
    expect(
      screen.getByText(/Resolução Nativa 336 DPI • 3 Páginas Padronizadas • Conformidade BACEN\/MCR/)
    ).toBeInTheDocument()
    expect(
      screen.getByText('Confirmar e Baixar Documento Oficial (PDF)')
    ).toBeInTheDocument()
  })

  it('deve navegar entre as folhas usando os botões de paginação', () => {
    render(<UniversalDocumentPreviewModal {...defaultProps} />)

    // Inicialmente na Folha 1
    expect(screen.getByText('Folha 01 de 03')).toBeInTheDocument()
    expect(screen.getByTestId('page-1')).toBeInTheDocument()
    expect(screen.queryByTestId('page-2')).not.toBeInTheDocument()

    // Avança para a página 2
    const nextBtn = screen.getByTitle('Próxima Página (Seta Direita)')
    fireEvent.click(nextBtn)

    expect(screen.getByText('Folha 02 de 03')).toBeInTheDocument()
    expect(screen.getByTestId('page-2')).toBeInTheDocument()

    // Volta para a página 1
    const prevBtn = screen.getByTitle('Página Anterior (Seta Esquerda)')
    fireEvent.click(prevBtn)

    expect(screen.getByText('Folha 01 de 03')).toBeInTheDocument()
    expect(screen.getByTestId('page-1')).toBeInTheDocument()
  })

  it('deve alternar entre visualização Folha Única e Todas as Folhas (rolagem contínua)', () => {
    render(<UniversalDocumentPreviewModal {...defaultProps} />)

    const toggleModeBtn = screen.getByTitle('Ver rolagem contínua de todas as folhas')
    fireEvent.click(toggleModeBtn)

    // Em modo contínuo, todas as 3 páginas devem estar visíveis simultaneamente
    expect(screen.getByTestId('page-1')).toBeInTheDocument()
    expect(screen.getByTestId('page-2')).toBeInTheDocument()
    expect(screen.getByTestId('page-3')).toBeInTheDocument()
    expect(screen.getByText('Todas as 3 Folhas')).toBeInTheDocument()

    // Clica novamente para voltar a folha única
    const singleModeBtn = screen.getByTitle('Ver folha por folha')
    fireEvent.click(singleModeBtn)

    expect(screen.getByText('Folha 01 de 03')).toBeInTheDocument()
    expect(screen.queryByTestId('page-2')).not.toBeInTheDocument()
  })

  it('deve ajustar e alterar o nível de zoom', () => {
    render(<UniversalDocumentPreviewModal {...defaultProps} />)

    const zoomInBtn = screen.getByTitle('Aumentar Zoom')
    const zoomOutBtn = screen.getByTitle('Diminuir Zoom')
    const fitBtn = screen.getByTitle('Ajustar à Largura da Tela')

    // Testa aumentar zoom
    fireEvent.click(zoomInBtn)
    // Testa botão de ajustar
    fireEvent.click(fitBtn)
    // Testa diminuir zoom
    fireEvent.click(zoomOutBtn)

    expect(screen.getByText('Ajustar')).toBeInTheDocument()
  })

  it('deve disparar onConfirm ao clicar no botão primário de emissão', async () => {
    render(<UniversalDocumentPreviewModal {...defaultProps} />)

    const confirmBtn = screen.getByText('Confirmar e Baixar Documento Oficial (PDF)')
    fireEvent.click(confirmBtn)

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('deve chamar onClose ao clicar no botão Fechar ou no ícone X', () => {
    render(<UniversalDocumentPreviewModal {...defaultProps} />)

    const closeBtn = screen.getByText('Fechar')
    fireEvent.click(closeBtn)
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)

    const xBtn = screen.getByTitle('Fechar Visualizador (Esc)')
    fireEvent.click(xBtn)
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2)
  })

  it('deve exibir tela de carregamento com skeleton e mensagens personalizadas', () => {
    render(
      <UniversalDocumentPreviewModal
        {...defaultProps}
        isLoading={true}
        loadingTitle="Compilando Dossiê em Alta Resolução..."
        loadingSubtitle="Calculando indicadores MCR e gerando tabelas patrimoniais."
      />
    )

    expect(screen.getByText('Compilando Dossiê em Alta Resolução...')).toBeInTheDocument()
    expect(
      screen.getByText('Calculando indicadores MCR e gerando tabelas patrimoniais.')
    ).toBeInTheDocument()
  })

  it('deve renderizar badges executivas e ações secundárias', () => {
    const handleSecondary = jest.fn()
    render(
      <UniversalDocumentPreviewModal
        {...defaultProps}
        badges={<span data-testid="badge-test">ICSD Aprovado</span>}
        secondaryActions={[
          {
            label: 'Editar no CRM',
            onClick: handleSecondary,
          },
        ]}
      />
    )

    expect(screen.getByTestId('badge-test')).toBeInTheDocument()
    const secondaryBtn = screen.getByText('Editar no CRM')
    fireEvent.click(secondaryBtn)
    expect(handleSecondary).toHaveBeenCalledTimes(1)
  })

  it('não deve renderizar nada se isOpen for false', () => {
    const { container } = render(
      <UniversalDocumentPreviewModal {...defaultProps} isOpen={false} />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
