import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { useForm, useFieldArray, FormProvider } from 'react-hook-form'
import { ImprovementTableRow } from '@/components/property-wizard/steps/step3-subcomponents/ImprovementTableRow'
import { LivestockTableRow } from '@/components/property-wizard/steps/step3-subcomponents/LivestockTableRow'
import { MachineryTableRow } from '@/components/property-wizard/steps/step2-subcomponents/MachineryTableRow'
import { Step4FinancialSummary, PURPOSE_OPTIONS, BANK_OPTIONS } from '@/components/property-wizard/steps/Step4FinancialSummary'

function ImprovementTestApp() {
  const methods = useForm({
    defaultValues: {
      improvements: [
        {
          specification: 'Galpão metálico',
          unit: 'm²',
          quantity: 500,
          unitValue: 850,
          totalValue: 425000,
          conservationState: 'BOM',
        },
      ],
    },
  })

  const { fields, remove } = useFieldArray({
    control: methods.control,
    name: 'improvements',
  })

  return (
    <FormProvider {...methods}>
      <button
        data-testid="update-spec"
        onClick={() => {
          methods.setValue('improvements.0.specification', 'Curral em cordoalha', { shouldValidate: true })
          methods.setValue('improvements.0.unit', 'm linear', { shouldValidate: true })
          methods.setValue('improvements.0.unitValue', 405, { shouldValidate: true })
        }}
      >
        Change Spec
      </button>
      <table>
        <tbody>
          {fields.map((fieldItem, index) => (
            <ImprovementTableRow
              key={fieldItem.id}
              index={index}
              fieldItem={fieldItem}
              control={methods.control}
              register={methods.register}
              setValue={methods.setValue}
              remove={remove}
            />
          ))}
        </tbody>
      </table>
    </FormProvider>
  )
}

function LivestockTestApp() {
  const methods = useForm({
    defaultValues: {
      livestocks: [
        {
          category: 'Matrizes (Vacas)',
          purpose: 'Cria',
          breed: 'Nelore',
          quantity: 100,
          unitValue: 5500,
          markingType: 'Ferro Quente',
          markingLocation: 'Perna Traseira Direita',
        },
      ],
    },
  })

  const { fields, remove } = useFieldArray({
    control: methods.control,
    name: 'livestocks',
  })

  return (
    <FormProvider {...methods}>
      <button
        data-testid="update-livestock"
        onClick={() => {
          methods.setValue('livestocks.0.category', 'Touros (Reprodutores)', { shouldValidate: true })
          methods.setValue('livestocks.0.breed', 'Angus', { shouldValidate: true })
        }}
      >
        Change Livestock
      </button>
      <table>
        <tbody>
          {fields.map((fieldItem, index) => (
            <LivestockTableRow
              key={fieldItem.id}
              index={index}
              fieldItem={fieldItem}
              control={methods.control}
              register={methods.register}
              setValue={methods.setValue}
              remove={remove}
            />
          ))}
        </tbody>
      </table>
    </FormProvider>
  )
}

function MachineryTestApp() {
  const methods = useForm({
    defaultValues: {
      machineries: [
        {
          category: 'Trator de Pneus',
          brand: 'John Deere',
          model: '6110J',
          year: 2022,
          value: 250000,
          hasLien: false,
        },
      ],
    },
  })

  const { fields, remove } = useFieldArray({
    control: methods.control,
    name: 'machineries',
  })

  return (
    <FormProvider {...methods}>
      <button
        data-testid="update-machinery"
        onClick={() => {
          methods.setValue('machineries.0.category', 'Colheitadeira', { shouldValidate: true })
          methods.setValue('machineries.0.hasLien', true, { shouldValidate: true })
        }}
      >
        Change Machinery
      </button>
      <table>
        <tbody>
          {fields.map((fieldItem, index) => (
            <MachineryTableRow
              key={fieldItem.id}
              index={index}
              fieldItem={fieldItem}
              control={methods.control}
              register={methods.register}
              setValue={methods.setValue}
              remove={remove}
            />
          ))}
        </tbody>
      </table>
    </FormProvider>
  )
}

describe('Property Wizard Select Reactivity Tests', () => {
  it('updates ImprovementTableRow selects and subtotal reactively', () => {
    render(<ImprovementTestApp />)

    const comboboxes = screen.getAllByRole('combobox')
    expect(comboboxes[0]).toHaveTextContent('Galpão metálico')
    expect(comboboxes[1]).toHaveTextContent('m²')
    expect(comboboxes[2]).toHaveTextContent('Bom')
    expect(screen.getByText(/425\.000,00/)).toBeInTheDocument()

    act(() => {
      screen.getByTestId('update-spec').click()
    })

    expect(comboboxes[0]).toHaveTextContent('Curral em cordoalha')
    expect(comboboxes[1]).toHaveTextContent('m linear')
    expect(screen.getByText(/202\.500,00/)).toBeInTheDocument()
  })

  it('updates LivestockTableRow selects reactively', () => {
    render(<LivestockTestApp />)

    const comboboxes = screen.getAllByRole('combobox')
    expect(comboboxes[0]).toHaveTextContent('Matrizes (Vacas)')
    expect(comboboxes[1]).toHaveTextContent('Cria')
    expect(comboboxes[2]).toHaveTextContent('Nelore')

    act(() => {
      screen.getByTestId('update-livestock').click()
    })

    expect(comboboxes[0]).toHaveTextContent('Touros (Reprodutores)')
    expect(comboboxes[2]).toHaveTextContent('Angus')
  })

  it('updates MachineryTableRow selects and lien fields reactively', () => {
    render(<MachineryTestApp />)

    const combobox = screen.getByRole('combobox')
    expect(combobox).toHaveTextContent('Trator de Pneus')
    expect(screen.getByText('Livre de Ônus')).toBeInTheDocument()

    act(() => {
      screen.getByTestId('update-machinery').click()
    })

    expect(combobox).toHaveTextContent('Colheitadeira')
    expect(screen.getByText('Alienado')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Banco / Credor')).toBeInTheDocument()
  })

  it('guarantees PURPOSE_OPTIONS and BANK_OPTIONS contain zero emojis and have valid Lucide icon components', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/u

    expect(PURPOSE_OPTIONS.length).toBeGreaterThan(0)
    for (const opt of PURPOSE_OPTIONS) {
      expect(emojiRegex.test(opt.label)).toBe(false)
      expect(opt.icon).toBeDefined()
      expect(opt.iconColor).toBeDefined()
    }

    expect(BANK_OPTIONS.length).toBeGreaterThan(0)
    for (const opt of BANK_OPTIONS) {
      expect(emojiRegex.test(opt.label)).toBe(false)
      expect(opt.icon).toBeDefined()
      expect(opt.iconColor).toBeDefined()
    }
  })

  it('renders Step4FinancialSummary select with Portuguese label and icon instead of raw enum or emoji', () => {
    function FinancialTestApp() {
      const methods = useForm({
        defaultValues: {
          totalArea: 100,
          vtnPerHectare: 15000,
          machineries: [],
          improvements: [],
          livestocks: [],
          effectiveAgroRevenue: 500000,
          operationalExpenses: 200000,
          creditLimitRequested: 250000,
          creditLimitPurpose: 'CUSTEIO_AGRICOLA',
          creditLimitTargetBank: 'BANCO_DO_BRASIL',
          creditLimitTermMonths: 12,
        },
      })

      return (
        <FormProvider {...methods}>
          <Step4FinancialSummary form={methods} />
        </FormProvider>
      )
    }

    render(<FinancialTestApp />)

    // Should show Portuguese label and never raw enum or emoji
    expect(screen.getByText('Custeio Agrícola (Safra)')).toBeInTheDocument()
    expect(screen.getByText('Banco do Brasil')).toBeInTheDocument()

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/u
    expect(emojiRegex.test(screen.getByText('Custeio Agrícola (Safra)').textContent || '')).toBe(false)
  })
})
