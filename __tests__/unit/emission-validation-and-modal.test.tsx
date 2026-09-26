import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ConfirmEmitModal } from '@/app/admin/documents/credit-projects/new/components/modals/ConfirmEmitModal'
import { toast } from 'sonner'

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}))

describe('ConfirmEmitModal - Validação de Pendências e Download Seguro', () => {
  const defaultProps = {
    isOpen: true,
    setIsOpen: jest.fn(),
    currentProducer: {
      id: 'prod_1',
      name: 'João Silva',
      type: 'PF',
      document: '11144477735',
      phone: '63999998888',
    },
    currentProperty: {
      id: 'prop_1',
      name: 'Fazenda Boa Esperança',
      registrationNumber: '12345',
      car: 'TO-1702109-TEST',
      totalArea: 150,
    },
    currentTemplate: {
      code: 'AUTORIZACAO_COMPARTILHAMENTO',
      title: 'Autorização de Compartilhamento de Dados',
      category: 'Declarações Legais',
    },
    customOptions: {
      propertyRegistrationNumber: '12345',
      propertyCar: 'TO-1702109-TEST',
      responsibleName: 'Engenheiro Agrônomo Teste',
    },
    selectedTemplateCode: 'AUTORIZACAO_COMPARTILHAMENTO',
    defaultOrgName: 'AgroTech Teste',
    defaultOrgCnpj: '00.000.000/0001-91',
    isGeneratingPdf: false,
    handleDownloadPdf: jest.fn(),
    isFormValid: true,
    validationErrors: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve desabilitar o botão de emissão e exibir alerta de pendências quando houver erros de validação', () => {
    render(
      <ConfirmEmitModal
        {...defaultProps}
        isFormValid={false}
        validationErrors={['Matrícula / Registro do Imóvel (CRI) é obrigatório', 'Nº do CAR (Cadastro Ambiental Rural) é obrigatório']}
      />
    )

    expect(screen.getByText(/Existem pendências cadastrais obrigatórias/i)).toBeInTheDocument()
    expect(screen.getByText(/Matrícula \/ Registro do Imóvel \(CRI\) é obrigatório/i)).toBeInTheDocument()
    expect(screen.getByText(/Nº do CAR \(Cadastro Ambiental Rural\) é obrigatório/i)).toBeInTheDocument()

    const emitButton = screen.getByRole('button', { name: /Gerar e Baixar PDF Oficial/i })
    expect(emitButton).toBeDisabled()
  })

  it('não deve acionar a tela de sucesso ou gerar hashes fictícios se handleDownloadPdf falhar ou retornar erro', async () => {
    const handleDownloadMock = jest.fn().mockRejectedValue(new Error('Erro na compilação do PDF'))

    render(
      <ConfirmEmitModal
        {...defaultProps}
        handleDownloadPdf={handleDownloadMock}
        isFormValid={true}
        validationErrors={[]}
      />
    )

    const emitButton = screen.getByRole('button', { name: /Gerar e Baixar PDF Oficial/i })
    expect(emitButton).not.toBeDisabled()

    fireEvent.click(emitButton)

    await waitFor(() => {
      expect(handleDownloadMock).toHaveBeenCalledTimes(1)
      expect(toast.error).toHaveBeenCalledWith('Erro na compilação do PDF')
    })

    // Garante que a tela de sucesso NUNCA foi renderizada
    expect(screen.queryByText(/RESUMO DE GOVERNANÇA E AUTENTICIDADE/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Baixar Novamente/i })).not.toBeInTheDocument()
  })

  it('deve exibir a tela de sucesso apenas quando handleDownloadPdf retornar sucesso com arquivo real', async () => {
    const handleDownloadMock = jest.fn().mockResolvedValue({
      success: true,
      sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      storagePath: 'ged/credit-projects/AUTORIZACAO_COMPARTILHAMENTO/123456.pdf',
      fileName: 'AUTORIZACAO_COMPARTILHAMENTO_Joao_Silva.pdf',
      emittedAt: new Date().toISOString(),
    })

    render(
      <ConfirmEmitModal
        {...defaultProps}
        handleDownloadPdf={handleDownloadMock}
        isFormValid={true}
        validationErrors={[]}
      />
    )

    const emitButton = screen.getByRole('button', { name: /Gerar e Baixar PDF Oficial/i })
    fireEvent.click(emitButton)

    await waitFor(() => {
      expect(screen.getAllByText(/Documento Oficial Gerado e Arquivado com Sucesso!/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0')).toBeInTheDocument()
      expect(screen.getByText('ged/credit-projects/AUTORIZACAO_COMPARTILHAMENTO/123456.pdf')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Baixar Novamente/i })).toBeInTheDocument()
    })
  })
})
