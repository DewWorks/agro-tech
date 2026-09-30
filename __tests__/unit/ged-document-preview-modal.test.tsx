import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import DocumentPreviewModal from '@/components/ged/DocumentPreviewModal'
import type { DocumentRow } from '@/components/ged/DocumentTable'

// Mock getSignedUrlForView and getSignedUrlForDownload
jest.mock('@/actions/documents', () => ({
  getSignedUrlForView: jest.fn().mockResolvedValue({
    success: true,
    data: { signedUrl: 'https://storage.supabase.co/mock-pdf-url.pdf' },
  }),
  getSignedUrlForDownload: jest.fn().mockResolvedValue({
    success: true,
    data: { signedUrl: 'https://storage.supabase.co/mock-download-url.pdf' },
  }),
}))

const mockDocument: DocumentRow = {
  id: 'doc-123',
  fileName: 'FullStack-JoaoVictor.pdf',
  documentType: 'OUTROS',
  fileSize: 116000,
  mimeType: 'application/pdf',
  storagePath: 'org-1/producers/prod-1/doc-123.pdf',
  issueDate: '2026-01-15T00:00:00.000Z',
  expirationDate: null,
  calculatedStatus: 'INDEFINIDO',
  isInherited: false,
  cropYear: null,
  inheritedFromId: null,
  producer: {
    id: 'prod-1',
    name: 'João Victor Póvoa França',
  },
  property: {
    id: 'prop-1',
    name: 'Fazenda Santa Maria',
  },
}

describe('DocumentPreviewModal (GED) - Integração com UniversalDocumentPreviewModal', () => {
  it('deve utilizar o componente universal com controles de zoom, ajustar e telemetria no rodapé', async () => {
    render(
      <DocumentPreviewModal
        document={mockDocument}
        isOpen={true}
        onClose={jest.fn()}
      />
    )

    // Aguarda carregar a URL segura
    await waitFor(() => {
      expect(screen.getByTitle('FullStack-JoaoVictor.pdf')).toBeInTheDocument()
    })

    // 1. Deve conter os controles do componente universal (Zoom e Ajustar)
    expect(screen.getByTitle('Ajustar à Largura da Tela')).toBeInTheDocument()
    expect(screen.getByTitle('Aumentar Zoom')).toBeInTheDocument()
    expect(screen.getByTitle('Diminuir Zoom')).toBeInTheDocument()
    expect(screen.getByText('Ajustar')).toBeInTheDocument()

    // 2. Deve conter as informações do documento no header
    expect(screen.getByText('FullStack-JoaoVictor.pdf')).toBeInTheDocument()

    // 3. Deve conter a telemetria do rodapé do componente universal
    expect(screen.getByText(/Repositório GED/)).toBeInTheDocument()
    expect(screen.getByText(/Fazenda Santa Maria/)).toBeInTheDocument()

    // 4. Deve conter os botões padronizados
    expect(screen.getByRole('button', { name: /Baixar Arquivo/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Fechar/i }).length).toBeGreaterThanOrEqual(1)
  })

  it('não deve renderizar nada se isOpen for false', () => {
    const { container } = render(
      <DocumentPreviewModal
        document={mockDocument}
        isOpen={false}
        onClose={jest.fn()}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
