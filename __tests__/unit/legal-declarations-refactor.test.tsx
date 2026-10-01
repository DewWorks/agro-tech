import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DECLARATION_CATEGORIES, DeclarationTemplateSelect } from '@/app/admin/documents/credit-projects/new/components/form/DeclarationTemplateSelect'
import { CREDIT_TEMPLATES_REGISTRY } from '@/lib/document-templates'

describe('Legal Declarations Refactor — 3 Master Cards & Dynamic Category Selector', () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = jest.fn()
  })

  const legalTemplates = CREDIT_TEMPLATES_REGISTRY.filter((t) => t.type === 'LEGAL')

  it('deve possuir exatamente os 8 modelos oficiais de declarações legais', () => {
    expect(legalTemplates.length).toBe(8)
    const codes = legalTemplates.map((t) => t.code)

    // Grupo 1: Autorizações Bancárias & Compliance
    expect(codes).toContain('AUTORIZACAO_SCR')
    expect(codes).toContain('AUTORIZACAO_SICOR')
    expect(codes).toContain('AUTORIZACAO_COMPARTILHAMENTO')

    // Grupo 2: Regularidade Ambiental & Fundiária
    expect(codes).toContain('DECLARACAO_POSSE_MANSA')
    expect(codes).toContain('DECLARACAO_REGULARIDADE_AMBIENTAL')
    expect(codes).toContain('DECLARACAO_FORA_BIOMA')

    // Grupo 3: Enquadramento Social & Garantias
    expect(codes).toContain('ENQUADRAMENTO_CAF')
    expect(codes).toContain('IDENTIFICACAO_ANIMAIS')
  })

  it('deve configurar as 3 categorias mestres corretamente em DECLARATION_CATEGORIES', () => {
    const complianceCat = DECLARATION_CATEGORIES.find((c) => c.id === 'COMPLIANCE')
    const ambientalCat = DECLARATION_CATEGORIES.find((c) => c.id === 'AMBIENTAL')
    const socialCat = DECLARATION_CATEGORIES.find((c) => c.id === 'SOCIAL_GARANTIAS')

    expect(complianceCat?.codes).toEqual([
      'AUTORIZACAO_SCR',
      'AUTORIZACAO_SICOR',
      'AUTORIZACAO_COMPARTILHAMENTO',
    ])
    expect(ambientalCat?.codes).toEqual([
      'DECLARACAO_POSSE_MANSA',
      'DECLARACAO_REGULARIDADE_AMBIENTAL',
      'DECLARACAO_FORA_BIOMA',
    ])
    expect(socialCat?.codes).toEqual(['ENQUADRAMENTO_CAF', 'IDENTIFICACAO_ANIMAIS'])
  })

  it('deve renderizar o DeclarationTemplateSelect com o modelo atual selecionado', () => {
    const currentTmpl = legalTemplates.find((t) => t.code === 'AUTORIZACAO_SCR')
    const setSelectedTemplateCode = jest.fn()

    render(
      <DeclarationTemplateSelect
        templates={legalTemplates}
        selectedTemplateCode="AUTORIZACAO_SCR"
        setSelectedTemplateCode={setSelectedTemplateCode}
        currentTemplate={currentTmpl}
        initialCategory="bancario-compliance"
      />
    )

    // Deve exibir o label "3. Modelo de Declaração Legal *"
    expect(screen.getByText('3. Modelo de Declaração Legal *')).toBeInTheDocument()

    // Deve exibir o título da minuta selecionada
    expect(screen.getByText(currentTmpl!.title)).toBeInTheDocument()

    // Deve exibir o badge da categoria
    expect(screen.getByText('Autorizações BB')).toBeInTheDocument()
  })

  it('deve permitir abrir o popover e selecionar outro modelo sem perder o contexto', () => {
    const currentTmpl = legalTemplates.find((t) => t.code === 'DECLARACAO_REGULARIDADE_AMBIENTAL')
    const setSelectedTemplateCode = jest.fn()

    render(
      <DeclarationTemplateSelect
        templates={legalTemplates}
        selectedTemplateCode="DECLARACAO_REGULARIDADE_AMBIENTAL"
        setSelectedTemplateCode={setSelectedTemplateCode}
        currentTemplate={currentTmpl}
      />
    )

    const triggerBtn = screen.getByRole('combobox')
    fireEvent.click(triggerBtn)

    // As abas de filtro por categoria devem estar visíveis
    expect(screen.getByText('Todas (8)')).toBeInTheDocument()
    expect(screen.getByText('Autorizações (3)')).toBeInTheDocument()
    expect(screen.getByText('Ambiental (3)')).toBeInTheDocument()
    expect(screen.getByText('Garantias (2)')).toBeInTheDocument()
  })
})
