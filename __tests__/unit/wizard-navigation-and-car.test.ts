import {
  step1LandBaseSchema,
  propertyWizardSchema,
  getStepForField,
  STEP_NAMES,
  FIELD_LABELS_MAP,
} from '@/lib/validations/property-wizard'
import { propertySchema } from '@/lib/validations/property'
import { maskCAR } from '@/lib/utils/masks'

describe('Wizard Validation, Navigation Lock and CAR Federal Calibration', () => {
  describe('Tarefa 4: Federal SICAR CAR Validation & Preprocessing', () => {
    const validFormattedCAR = 'TO-1717800-5473.5CFC.E37F.4E8D.021C.9F6A.03D6.0849'
    const carWithSpacesAndLowercase = '  to-1717800-5473.5cfc.e37f.4e8d.021c.9f6a.03d6.0849   '
    const unpunctuated32CharCAR = 'TO-1717800-54735CFCE37F4E8D021C9F6A03D60849'
    const carWithFullAlphaNumeric = 'MT-5107909-A1B2.C3D4.E5F6.G7H8.I9J0.K1L2.M3N4.O5P6'

    it('sanitizes and accepts CAR with extra whitespace and lowercase in propertyWizardSchema', () => {
      const parsed = propertyWizardSchema.safeParse({
        name: 'Fazenda Estrela do Norte',
        branchId: 'branch-1',
        producerId: 'producer-1',
        ownershipType: 'PROPRIETARIO',
        propertyStatus: 'QUITADA',
        totalArea: 250,
        registrationNumber: '98765',
        car: carWithSpacesAndLowercase,
      })
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.car).toBe(validFormattedCAR)
      }
    })

    it('accepts unpunctuated 32-character hash format', () => {
      const parsed = step1LandBaseSchema.safeParse({
        name: 'Fazenda Estrela do Norte',
        branchId: 'branch-1',
        producerId: 'producer-1',
        ownershipType: 'PROPRIETARIO',
        propertyStatus: 'QUITADA',
        totalArea: 250,
        registrationNumber: '98765',
        car: unpunctuated32CharCAR,
      })
      expect(parsed.success).toBe(true)
    })

    it('accepts alphanumeric characters beyond standard hex (full SICAR format)', () => {
      const parsed = step1LandBaseSchema.safeParse({
        name: 'Fazenda Nova Fronteira',
        branchId: 'branch-1',
        producerId: 'producer-1',
        ownershipType: 'PROPRIETARIO',
        propertyStatus: 'QUITADA',
        totalArea: 500,
        registrationNumber: '11223',
        car: carWithFullAlphaNumeric,
      })
      expect(parsed.success).toBe(true)
    })

    it('rejects malformed CAR (e.g. invalid municipal code or insufficient characters)', () => {
      const parsed = step1LandBaseSchema.safeParse({
        name: 'Fazenda Invalida',
        branchId: 'branch-1',
        producerId: 'producer-1',
        ownershipType: 'PROPRIETARIO',
        propertyStatus: 'QUITADA',
        totalArea: 100,
        registrationNumber: '12345',
        car: 'SP-123-INVALID',
      })
      expect(parsed.success).toBe(false)
    })
  })

  describe('Tarefa 3: Cross-Step Error Mapping and Stepper Redirection', () => {
    it('correctly maps fields to their respective Wizard steps', () => {
      // Step 1: Dados Fundiários
      expect(getStepForField('car')).toBe(1)
      expect(getStepForField('registrationNumber')).toBe(1)
      expect(getStepForField('totalArea')).toBe(1)
      expect(getStepForField('vtnPerHectare')).toBe(1)
      expect(getStepForField('city')).toBe(1)

      // Step 2: Máquinas
      expect(getStepForField('machineries')).toBe(2)
      expect(getStepForField('machineries.0.value')).toBe(2)

      // Step 3: Benfeitorias e Rebanho
      expect(getStepForField('improvements')).toBe(3)
      expect(getStepForField('improvements.0.unitValue')).toBe(3)
      expect(getStepForField('livestocks')).toBe(3)
      expect(getStepForField('livestocks.0.quantity')).toBe(3)

      // Step 4: Resumo Financeiro
      expect(getStepForField('effectiveAgroRevenue')).toBe(4)
      expect(getStepForField('projectedAgroRevenue')).toBe(4)
      expect(getStepForField('operationalExpenses')).toBe(4)
      expect(getStepForField('creditLimitRequested')).toBe(4)
    })

    it('has human-readable labels for mapped fields and steps', () => {
      expect(STEP_NAMES[1]).toContain('Dados Fundiários')
      expect(STEP_NAMES[4]).toContain('Resumo Financeiro')
      expect(FIELD_LABELS_MAP['car']).toBe('Código do CAR')
      expect(FIELD_LABELS_MAP['registrationNumber']).toBe('Matrícula')
      expect(FIELD_LABELS_MAP['creditLimitRequested']).toBe('Valor Pretendido')
    })
  })
})
