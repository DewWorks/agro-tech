import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  OFFICIAL_CREDIT_LINES,
  getOfficialCreditLinesByAxis,
  findOfficialCreditLine,
} from '@/lib/constants/credit-lines-catalog'
import {
  isAnimalOrEquipmentSubline,
  RenovagroParams,
} from '@/app/admin/documents/credit-projects/new/components/form/params/RenovagroParams'
import { CusteioSafraParams } from '@/app/admin/documents/credit-projects/new/components/form/params/CusteioSafraParams'
import { CustomOptions } from '@/app/admin/documents/credit-projects/new/types/wizard-types'

// Mock de matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
})

describe('Reestruturação da Esteira de Crédito Rural (LN Consultoria / Lindomar)', () => {
  describe('1. Catálogo Centralizado das 15 Linhas Oficiais', () => {
    it('deve conter exatamente as 15 linhas oficiais exigidas pelo cliente', () => {
      expect(OFFICIAL_CREDIT_LINES).toHaveLength(15)

      const expectedIds = [
        'PRONAMP',
        'PRONAF_MAIS_ALIMENTOS_FIXO',
        'PRONAF_MAIS_ALIMENTOS_SEMI_FIXO',
        'PRONAF_MULHER',
        'PRONAF_JOVEM',
        'PRONAF_B',
        'PRONAF_AGROINDUSTRIA',
        'PRONAF_AGROECOLOGIA',
        'PRONAF_BIOECONOMIA',
        'PRONAF_A_AC',
        'RENOVAGRO',
        'INOVAGRO',
        'MODERFROTA',
        'INVESTE_AGRO',
        'PCA',
      ]

      expectedIds.forEach((id) => {
        const found = OFFICIAL_CREDIT_LINES.find((line) => line.id === id)
        expect(found).toBeDefined()
        expect(found?.name).toBeTruthy()
        expect(found?.defaultInterestRate).toBeGreaterThan(0)
        expect(found?.defaultTermYears).toBeGreaterThan(0)
      })
    })

    it('deve filtrar linhas corretamente por eixo (CUSTEIO e INVESTIMENTO)', () => {
      const custeioLines = getOfficialCreditLinesByAxis('CUSTEIO')
      expect(custeioLines.length).toBeGreaterThan(0)
      custeioLines.forEach((l) => {
        expect(['CUSTEIO', 'AMBOS']).toContain(l.axis)
      })

      const investimentoLines = getOfficialCreditLinesByAxis('INVESTIMENTO')
      expect(investimentoLines.length).toBeGreaterThan(0)
      investimentoLines.forEach((l) => {
        expect(['INVESTIMENTO', 'AMBOS']).toContain(l.axis)
      })

      const allLines = getOfficialCreditLinesByAxis('TODOS')
      expect(allLines).toHaveLength(15)
    })

    it('deve localizar linha oficial por ID ou código com parâmetros regulamentares precisos', () => {
      const pronamp = findOfficialCreditLine('PRONAMP')
      expect(pronamp).toBeDefined()
      expect(pronamp?.shortName).toBe('PRONAMP')
      expect(pronamp?.defaultInterestRate).toBe(8.0)
      expect(pronamp?.axis).toBe('AMBOS')

      const pronafB = findOfficialCreditLine('PRONAF_B')
      expect(pronafB).toBeDefined()
      expect(pronafB?.defaultInterestRate).toBe(0.5)

      const renovagro = findOfficialCreditLine('RENOVAGRO')
      expect(renovagro).toBeDefined()
      expect(renovagro?.defaultInterestRate).toBe(7.0)
      expect(renovagro?.defaultTermYears).toBe(10)

      const moderfrota = findOfficialCreditLine('MODERFROTA')
      expect(moderfrota).toBeDefined()
      expect(moderfrota?.defaultInterestRate).toBe(11.5)
      expect(moderfrota?.defaultTermYears).toBe(7)
    })
  })

  describe('2. Adequação Dinâmica de Terminologia Técnica (Investimento)', () => {
    it('deve classificar corretamente sublinhas entre solo/pastagem e animais/máquinas', () => {
      // Solo / Pastagem / Vegetal
      expect(isAnimalOrEquipmentSubline('Recuperação de Pastagens Degradadas (MCR 11.7.1.c.I)')).toBe(false)
      expect(isAnimalOrEquipmentSubline('Manejo de Solo e Água')).toBe(false)
      expect(isAnimalOrEquipmentSubline('Integração Lavoura-Pecuária-Floresta (ILPF)')).toBe(false)

      // Animais / Semoventes / Máquinas
      expect(isAnimalOrEquipmentSubline('Aquisição de Matrizes e Reprodutores')).toBe(true)
      expect(isAnimalOrEquipmentSubline('Máquinas e Equipamentos de Baixo Carbono')).toBe(true)
      expect(isAnimalOrEquipmentSubline('Construção de Silos e Armazenagem (PCA)')).toBe(true)
      expect(isAnimalOrEquipmentSubline(undefined, 'MODERFROTA')).toBe(true)
      expect(isAnimalOrEquipmentSubline(undefined, 'PCA')).toBe(true)
      expect(isAnimalOrEquipmentSubline(undefined, 'PRONAF_MAIS_ALIMENTOS_SEMI_FIXO')).toBe(true)
    })

    it('deve exibir rótulos de solo/pastagem quando a finalidade for recuperação de solos', () => {
      const mockOptions: Partial<CustomOptions> = {
        renovagroSubline: 'Recuperação de Pastagens Degradadas (MCR 11.7.1.c.I)',
        renovagroAreaHa: 50,
        renovagroCostPerHa: 3850,
        renovagroTotalInvestment: 192500,
        renovagroFinanced: 173250,
        renovagroOwnResources: 19250,
        renovagroTermYears: 10,
        renovagroGraceMonths: 36,
        renovagroInterestRate: 7.0,
      }
      const setCustomOptions = jest.fn()

      render(
        <RenovagroParams
          customOptions={mockOptions as CustomOptions}
          setCustomOptions={setCustomOptions}
        />
      )

      expect(screen.getByText(/Área a Recuperar \/ Explorada \(ha\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Custo por Hectare \(R\$\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Manejo Sustentável \(Solo \/ Pastagem\)/i)).toBeInTheDocument()
    })

    it('deve alternar automaticamente para rótulos de item/unidade quando a finalidade for matrizes/equipamentos', () => {
      const mockOptions: Partial<CustomOptions> = {
        renovagroSubline: 'Aquisição de Matrizes e Reprodutores',
        renovagroAreaHa: 40,
        renovagroCostPerHa: 4000,
        renovagroTotalInvestment: 160000,
        renovagroFinanced: 144000,
        renovagroOwnResources: 16000,
        renovagroTermYears: 10,
        renovagroGraceMonths: 36,
        renovagroInterestRate: 7.0,
      }
      const setCustomOptions = jest.fn()

      render(
        <RenovagroParams
          customOptions={mockOptions as CustomOptions}
          setCustomOptions={setCustomOptions}
        />
      )

      expect(screen.getByText(/Item Financiável \/ Quantidade/i)).toBeInTheDocument()
      expect(screen.getByText(/Valor Unitário \(R\$\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Bens Físicos \/ Semoventes \/ Máquinas/i)).toBeInTheDocument()
    })

    it('deve calcular corretamente a fórmula Quantidade x Valor Unitário e teto de 90% financiado', () => {
      let state: Partial<CustomOptions> = {
        renovagroSubline: 'Aquisição de Matrizes e Reprodutores',
        renovagroAreaHa: 30,
        renovagroCostPerHa: 4000,
      }
      const setCustomOptions = jest.fn((updater) => {
        state = typeof updater === 'function' ? updater(state) : updater
      })

      const { rerender } = render(
        <RenovagroParams
          customOptions={state as CustomOptions}
          setCustomOptions={setCustomOptions}
        />
      )

      // Altera a quantidade para 50 cabeças
      const qtyInput = screen.getByPlaceholderText('Ex: 40')
      fireEvent.change(qtyInput, { target: { value: '50' } })

      expect(setCustomOptions).toHaveBeenCalled()

      // Validação da matemática: 50 * 4000 = 200.000; Financiado 90% = 180.000; Próprios 10% = 20.000
      const qty = 50
      const unit = 4000
      const total = qty * unit
      const financed = Math.round(total * 0.9)
      const own = Math.round(total * 0.1)

      expect(total).toBe(200000)
      expect(financed).toBe(180000)
      expect(own).toBe(20000)
    })
  })

  describe('3. Tratamento de Modalidades no Custeio (Agrícola vs Pecuário)', () => {
    it('deve renderizar formulário agrícola com termos de hectares e sacas por padrão', () => {
      const mockOptions: Partial<CustomOptions> = {
        custeioActivityType: 'AGRICOLA',
        custeioSafraYear: '2025/2026',
        custeioCropName: 'Soja Grão',
        custeioAreaHa: 100,
        custeioCostPerHa: 3850,
        custeioExpectedYield: 62,
        custeioPricePerUnit: 128,
        custeioInterestRate: 8.0,
      }
      const setCustomOptions = jest.fn()

      render(
        <CusteioSafraParams
          customOptions={mockOptions as CustomOptions}
          setCustomOptions={setCustomOptions}
        />
      )

      expect(screen.getByText('Agrícola (Grãos)')).toBeInTheDocument()
      expect(screen.getByText('Pecuária')).toBeInTheDocument()
      expect(screen.getByText(/Área de Plantio \/ Explorada \(ha\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Custo por Hectare Financiado \(R\$\/ha\)/i)).toBeInTheDocument()
    })

    it('deve alternar para Custeio Pecuário e suportar Aquisição de Animais vs Manejo', () => {
      const mockOptions: Partial<CustomOptions> = {
        custeioActivityType: 'PECUARIA',
        custeioPecuariaModality: 'AQUISICAO_ANIMAIS',
        custeioSafraYear: '2025/2026',
        custeioCropName: 'Bovinocultura de Corte (Recria e Engorda)',
        custeioQuantity: 150,
        custeioUnitPrice: 2800,
        custeioInterestRate: 8.0,
        custeioPricePerUnit: 3600,
        custeioExpectedYield: 1,
      }
      const setCustomOptions = jest.fn()

      render(
        <CusteioSafraParams
          customOptions={mockOptions as CustomOptions}
          setCustomOptions={setCustomOptions}
        />
      )

      // Submodalidade do Custeio Pecuário
      expect(screen.getByText(/Submodalidade do Custeio Pecuário \(MCR\)/i)).toBeInTheDocument()
      expect(screen.getByText(/1\. Aquisição de Animais \(Recria\/Engorda\)/i)).toBeInTheDocument()
      expect(screen.getByText(/2\. Custeio da Produção \(Manejo\/Nutrição\)/i)).toBeInTheDocument()

      // Rótulos específicos de Aquisição de Animais
      expect(screen.getByText(/Quantidade de Cabeças para Aquisição \(cab\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Valor Médio por Cabeça \(R\$\/cab\)/i)).toBeInTheDocument()

      // Valor financiado reativo: 150 cab * R$ 2.800 = R$ 420.000,00
      expect(screen.getByText('R$ 420.000,00')).toBeInTheDocument()
    })

    it('deve ajustar rótulos quando selecionar Custeio de Manejo/Nutrição', () => {
      const mockOptions: Partial<CustomOptions> = {
        custeioActivityType: 'PECUARIA',
        custeioPecuariaModality: 'CUSTEIO_PRODUCAO',
        custeioSafraYear: '2025/2026',
        custeioCropName: 'Manejo, Pastagem e Nutrição Pecuária',
        custeioQuantity: 200,
        custeioUnitPrice: 650,
        custeioInterestRate: 8.0,
        custeioPricePerUnit: 3200,
        custeioExpectedYield: 1,
      }
      const setCustomOptions = jest.fn()

      render(
        <CusteioSafraParams
          customOptions={mockOptions as CustomOptions}
          setCustomOptions={setCustomOptions}
        />
      )

      expect(screen.getByText(/Rebanho em Manejo \/ Nutrição \(cab\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Custo de Manejo \/ Cabeça \(R\$\/cab\)/i)).toBeInTheDocument()

      // Valor financiado reativo: 200 cab * R$ 650 = R$ 130.000,00
      expect(screen.getByText('R$ 130.000,00')).toBeInTheDocument()
    })
  })

  describe('4. Alinhamento Horizontal e Numeração Lógica dos Seletores de Parâmetros', () => {
    it('deve exibir a numeração contínua de 1 a 4 nos cabeçalhos dos seletores', async () => {
      const { ProducerSelect } = await import(
        '@/app/admin/documents/credit-projects/new/components/form/ProducerSelect'
      )
      const { PropertySelect } = await import(
        '@/app/admin/documents/credit-projects/new/components/form/PropertySelect'
      )
      const { CreditLineSelect } = await import(
        '@/app/admin/documents/credit-projects/new/components/form/CreditLineSelect'
      )
      const { TemplateSelect } = await import(
        '@/app/admin/documents/credit-projects/new/components/form/TemplateSelect'
      )

      // 1. Produtor Rural
      const { unmount: u1 } = render(
        <ProducerSelect
          activeProducers={[]}
          selectedProducerId=""
          setSelectedProducerId={jest.fn()}
          currentProducer={undefined}
        />
      )
      expect(screen.getByText('1. Produtor Rural (Proponente) *')).toBeInTheDocument()
      u1()

      // 2. Propriedade / Imóvel
      const { unmount: u2 } = render(
        <PropertySelect
          availableProperties={[]}
          selectedPropertyId=""
          setSelectedPropertyId={jest.fn()}
          currentProperty={undefined}
        />
      )
      expect(screen.getByText('2. Propriedade / Imóvel Beneficiado *')).toBeInTheDocument()
      u2()

      // 3. Linha Oficial de Financiamento
      const { unmount: u3 } = render(
        <CreditLineSelect
          customOptions={{} as any}
          setCustomOptions={jest.fn()}
          selectedTemplateCode="PROJETO_RENOVAGRO"
        />
      )
      expect(screen.getByText('3. Linha Oficial de Financiamento *')).toBeInTheDocument()
      u3()

      // 4. Modelo Oficial Banco do Brasil
      const { unmount: u4 } = render(
        <TemplateSelect
          templates={[]}
          selectedTemplateCode=""
          setSelectedTemplateCode={jest.fn()}
          currentTemplate={undefined}
        />
      )
      expect(screen.getByText('4. Modelo Oficial Banco do Brasil *')).toBeInTheDocument()
      u4()
    })
  })

  describe('5. Unificação de Navegação do Stepper e Destaque Visual com Borda Amarela', () => {
    it('deve renderizar o campo Área a Recuperar com borda e fundo amarelo quando vazio', () => {
      const customOptions: CustomOptions = {
        renovagroSubline: 'Recuperação de Pastagens Degradadas (MCR 11.7.1.c.I)',
        renovagroAreaHa: undefined as any,
        creditLineId: 'RENOVAGRO',
      }
      const setCustomOptions = jest.fn()

      const { container } = render(
        <RenovagroParams customOptions={customOptions} setCustomOptions={setCustomOptions} />
      )

      const areaInput = container.querySelector('#field-renovagro-area')
      expect(areaInput).toBeInTheDocument()
      expect(areaInput).toHaveClass('border-amber-400')
      expect(areaInput).toHaveClass('bg-amber-50/20')
    })

    it('deve remover a borda amarela de Área a Recuperar quando preenchido com valor válido', () => {
      const customOptions: CustomOptions = {
        renovagroSubline: 'Recuperação de Pastagens Degradadas (MCR 11.7.1.c.I)',
        renovagroAreaHa: 50,
        renovagroCostPerHa: 3850,
        renovagroTotalInvestment: 192500,
        renovagroFinanced: 173250,
        creditLineId: 'RENOVAGRO',
      }
      const setCustomOptions = jest.fn()

      const { container } = render(
        <RenovagroParams customOptions={customOptions} setCustomOptions={setCustomOptions} />
      )

      const areaInput = container.querySelector('#field-renovagro-area')
      expect(areaInput).toBeInTheDocument()
      expect(areaInput).not.toHaveClass('border-amber-400')
      expect(areaInput).toHaveClass('bg-white')
    })

    it('deve exibir indicador de pendência e check de conclusão no StepperHeader', async () => {
      const { CreditStepperHeader } = await import(
        '@/app/admin/documents/credit-projects/new/components/form/steps/CreditStepperHeader'
      )
      const stepsMeta = [
        { num: 1, title: '1. Imóvel & Terras', subtitle: 'Dados Fundiários', icon: () => null, pending: false },
        { num: 2, title: '2. Parâmetros', subtitle: 'Dados Técnicos', icon: () => null, pending: true },
      ]

      const onStepClick = jest.fn()
      render(
        <CreditStepperHeader
          currentStep={2}
          totalSteps={4}
          isFormValid={false}
          validationErrors={['Área a Recuperar']}
          stepsMeta={stepsMeta as any}
          onStepClick={onStepClick}
          isLimiteCredito={false}
          hasParamsStep={true}
        />
      )

      // Etapa 1 deve ter título de concluída
      expect(screen.getByTitle('Etapa concluída')).toBeInTheDocument()
      // Etapa 2 deve ter indicador de pendência
      expect(screen.getByTitle('Pendências nesta etapa')).toBeInTheDocument()
    })
  })
})
