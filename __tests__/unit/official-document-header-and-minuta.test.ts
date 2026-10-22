import { buildOfficialDocumentHeaderHtml } from '@/lib/pdf/build-document-header'
import Handlebars from 'handlebars'
import { renderHook } from '@testing-library/react'
import { useCreditProjectCalculations } from '@/app/admin/documents/credit-projects/new/hooks/sub-hooks/useCreditProjectCalculations'

describe('Injetor Universal de Cabeçalho Institucional & Minutas Legais', () => {
  const dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

  it('buildOfficialDocumentHeaderHtml deve gerar o cabeçalho rígido de 52px com a logo em Base64 e cor primária', () => {
    const html = buildOfficialDocumentHeaderHtml({
      logoBase64: dummyBase64,
      companyName: 'DevWorks',
      primaryColor: '#050E94',
      documentTitle: 'Autorização para Consulta ao SCR',
      documentSubtitle: 'Declaração Legal • Banco do Brasil / Regulamentar'
    })

    expect(html).toContain('class="official-doc-header"')
    expect(html).toContain('min-height: 52px; max-height: 52px; height: 52px;')
    expect(html).toContain('border-bottom: 2px solid #050E94')
    expect(html).toContain('width: 170px; height: 50px; min-width: 170px; max-width: 170px;')
    expect(html).toContain(`<img \n              src="${dummyBase64}" \n              alt="DevWorks"`)
    expect(html).toContain('Autorização para Consulta ao SCR')
    expect(html).toContain('Declaração Legal • Banco do Brasil / Regulamentar')
    expect(html).toContain('Conformidade MCR / BACEN')
  })

  it('buildOfficialDocumentHeaderHtml deve renderizar fallback tipográfico quando logoBase64 for nulo', () => {
    const html = buildOfficialDocumentHeaderHtml({
      logoBase64: null,
      companyName: 'DevWorks',
      primaryColor: '#050E94',
      documentTitle: 'Declaração de Posse Mansa e Pacífica'
    })

    expect(html).toContain('min-height: 52px; max-height: 52px; height: 52px;')
    expect(html).toContain('DevWorks')
    expect(html).toContain('color: #050E94')
    expect(html).not.toContain('<img')
  })

  it('deve compilar o template AUTORIZACAO_SCR com o cabeçalho oficial e as seções na cor primária (#050E94)', () => {
    const headerHtml = buildOfficialDocumentHeaderHtml({
      logoBase64: dummyBase64,
      companyName: 'DevWorks',
      primaryColor: '#050E94',
      documentTitle: 'Autorização para Consulta ao SCR'
    })

    const templateContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        {{{HEADER_OFICIAL}}}
        <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff;">
          I - IDENTIFICAÇÃO DO PROPONENTE
        </div>
        <div>
          Nome: {{NOME_PRODUTOR}} | Documento: {{PRODUCER_DOCUMENT_WITH_TYPE}}
        </div>
        <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff;">
          II - TERMO DE AUTORIZAÇÃO
        </div>
        <div>
          Empresa: {{NOME_EMPRESA}} | CNPJ: {{CNPJ_EMPRESA}}
        </div>
      </div>
    `

    const templateData = {
      HEADER_OFICIAL: headerHtml,
      COR_PRIMARIA: '#050E94',
      NOME_EMPRESA: 'DevWorks',
      CNPJ_EMPRESA: '54.399.111/0001-41',
      NOME_PRODUTOR: 'Produtor Teste',
      PRODUCER_DOCUMENT_WITH_TYPE: 'CPF: 123.456.789-00'
    }

    const compiled = Handlebars.compile(templateContent)
    const resultHtml = compiled(templateData)

    expect(resultHtml).toContain('class="official-doc-header"')
    expect(resultHtml).toContain(dummyBase64)
    expect(resultHtml).toContain('border-bottom: 2px solid #050E94')
    expect(resultHtml).toContain('background-color: #050E94')
    expect(resultHtml).toContain('I - IDENTIFICAÇÃO DO PROPONENTE')
    expect(resultHtml).toContain('II - TERMO DE AUTORIZAÇÃO')
    expect(resultHtml).toContain('Produtor Teste')
    expect(resultHtml).toContain('CPF: 123.456.789-00')
    expect(resultHtml).toContain('DevWorks')
    expect(resultHtml).toContain('54.399.111/0001-41')
  })

  it('deve remover cabeçalhos legados em texto puro como <h1>{{EMPRESA_NOME}}</h1> e prependar {{{HEADER_OFICIAL}}}', () => {
    const legacyTemplate = `
      <div>
        <h1>{{EMPRESA_NOME}}</h1>
        <h2>Declaração</h2>
        <p>Conteúdo da minuta...</p>
      </div>
    `

    let cleaned = legacyTemplate.replace(/<h[12][^>]*>\s*\{\{\s*(EMPRESA_NOME|NOME_EMPRESA|ORGANIZATION_NAME|RAZAO_SOCIAL)\s*\}\}\s*<\/h[12]>/gi, '').trim()
    expect(cleaned).not.toContain('{{EMPRESA_NOME}}')

    if (!cleaned.includes('{{{HEADER_OFICIAL}}}')) {
      const outerDivMatch = cleaned.match(/^(\s*<div[^>]*>)/i)
      if (outerDivMatch) {
        cleaned = cleaned.slice(0, outerDivMatch[0].length) + '\n{{{HEADER_OFICIAL}}}\n' + cleaned.slice(outerDivMatch[0].length)
      }
    }

    expect(cleaned).toContain('{{{HEADER_OFICIAL}}}')
  })

  it('useCreditProjectCalculations deve preservar a logomarca Base64 e a cor #050E94 no documentData.organization', () => {
    const mockProducer: any = {
      id: 'prod-1',
      name: 'João Victor Póvoa França',
      document: '12345678900',
      type: 'PF',
      properties: []
    }

    const mockProperty: any = {
      id: 'prop-1',
      name: 'Fazenda Modelo',
      city: 'Gurupi',
      state: 'TO',
    }

    const mockTemplate: any = {
      code: 'AUTORIZACAO_SCR',
      title: 'Autorização para Consulta ao SCR',
      type: 'LEGAL',
      category: 'Autorizações BB'
    }

    const mockOrganization = {
      id: '6a9a6282-b20e-4138-8e12-0643798f5be2',
      name: 'DevWorks',
      tradeName: 'DevWorks',
      cnpj: '54.399.111/0001-41',
      logoHorizontalUrl: 'https://storage/logo.png',
      logoHorizontalBase64: dummyBase64,
      primaryColorHex: '#050E94',
      accentColorHex: '#FFAC00',
      ownerName: 'João Victor Póvoa França'
    }

    const { result } = renderHook(() =>
      useCreditProjectCalculations({
        currentProducer: mockProducer,
        currentProperty: mockProperty,
        currentTemplate: mockTemplate,
        customOptions: {} as any,
        organization: mockOrganization,
        selectedTemplateCode: 'AUTORIZACAO_SCR'
      })
    )

    const doc = result.current.documentData
    expect(doc).not.toBeNull()
    expect(doc?.organization.logoHorizontalBase64).toBe(dummyBase64)
    expect(doc?.organization.primaryColorHex).toBe('#050E94')
    expect(doc?.organization.name).toBe('DevWorks')
    expect(doc?.organization.tradeName).toBe('DevWorks')
    expect(doc?.organization.cnpj).toBe('54.399.111/0001-41')
  })
})
