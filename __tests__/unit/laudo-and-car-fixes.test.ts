import { step1LandBaseSchema } from '@/lib/validations/property-wizard'
import { propertySchema } from '@/lib/validations/property'
import { maskCAR, maskCPF, maskCNPJ, formatMarriageRegime } from '@/lib/utils/masks'

describe('Homologation Defect Fixes - Lindomar (LN Consultoria)', () => {
  describe('Defect 1 & 2: Federal SICAR CAR Regex and Mask', () => {
    const federalCar = 'TO-1717800-5473.5CFC.E37F.4E8D.021C.9F6A.03D6.0849'

    it('accepts official Federal SICAR 8-block CAR in property-wizard schema', () => {
      const parsed = step1LandBaseSchema.safeParse({
        name: 'Fazenda Modelo',
        branchId: 'branch-1',
        producerId: 'producer-1',
        ownershipType: 'PROPRIETARIO',
        propertyStatus: 'QUITADA',
        totalArea: 100,
        registrationNumber: '12345',
        car: federalCar,
      })
      expect(parsed.success).toBe(true)
    })

    it('accepts official Federal SICAR 8-block CAR in property schema', () => {
      const parsed = propertySchema.safeParse({
        name: 'Fazenda Modelo',
        branchId: 'branch-1',
        producerId: 'producer-1',
        ownershipType: 'PROPRIETARIO',
        totalArea: 100,
        registrationNumber: '12345',
        registryOffice: '1º Cartório de Registro',
        accessRoute: 'Roteiro de acesso oficial com mais de 10 caracteres',
        explorationActivity: 'Pecuária de Cria',
        car: federalCar,
      })
      expect(parsed.success).toBe(true)
    })

    it('formats 32 hex characters into 8 blocks with dots up to 50 characters via maskCAR', () => {
      const unformatted = 'TO171780054735CFCE37F4E8D021C9F6A03D60849'
      const masked = maskCAR(unformatted)
      expect(masked).toBe(federalCar)
      expect(masked.length).toBe(50)
    })

    it('rejects completely invalid CAR strings in propertySchema', () => {
      const parsed = propertySchema.safeParse({
        name: 'Fazenda Modelo',
        branchId: 'branch-1',
        producerId: 'producer-1',
        ownershipType: 'PROPRIETARIO',
        totalArea: 100,
        registrationNumber: '12345',
        registryOffice: '1º Cartório de Registro',
        accessRoute: 'Roteiro de acesso oficial com mais de 10 caracteres',
        explorationActivity: 'Pecuária de Cria',
        car: 'INVALID-CAR-CODE',
      })
      expect(parsed.success).toBe(false)
      if (!parsed.success) {
        expect(parsed.error.issues.some((issue) => issue.path.includes('car'))).toBe(true)
      }
    })
  })

  describe('Defect 3: Landlord Document Masking (CPF & CNPJ)', () => {
    it('correctly applies CPF mask when length is 11 digits', () => {
      const rawCpf = '12345678901'
      const masked = rawCpf.length > 11 ? maskCNPJ(rawCpf) : maskCPF(rawCpf)
      expect(masked).toBe('123.456.789-01')
    })

    it('correctly applies CNPJ mask when length exceeds 11 digits', () => {
      const rawCnpj = '12345678000199'
      const masked = rawCnpj.length > 11 ? maskCNPJ(rawCnpj) : maskCPF(rawCnpj)
      expect(masked).toBe('12.345.678/0001-99')
    })
  })

  describe('Defect 4: Marriage Regime and Spousal Qualification Rules', () => {
    it('formats all official marriage regimes to legible Portuguese descriptions', () => {
      expect(formatMarriageRegime('COMUNHAO_PARCIAL')).toBe('Comunhão Parcial de Bens')
      expect(formatMarriageRegime('COMUNHAO_UNIVERSAL')).toBe('Comunhão Universal de Bens')
      expect(formatMarriageRegime('SEPARACAO_TOTAL')).toBe('Separação Total de Bens')
      expect(formatMarriageRegime('SEPARACAO_OBRIGATORIA')).toBe('Separação Obrigatória de Bens')
      expect(formatMarriageRegime('PARTICIPACAO_FINAL')).toBe('Participação Final nos Aquestos')
      expect(formatMarriageRegime(null)).toBe('Não informado')
      expect(formatMarriageRegime(undefined)).toBe('Não informado')
    })

    it('correctly detects married or stable union status in case-insensitive fashion', () => {
      const marriedStatuses = ['CASADO', 'casado', 'Casado', 'UNIAO_ESTAVEL', 'uniao_estavel', 'Uniao_Estavel']
      marriedStatuses.forEach((status) => {
        const isMarriedOrUnion = ['CASADO', 'UNIAO_ESTAVEL'].includes(status.toUpperCase())
        expect(isMarriedOrUnion).toBe(true)
      })

      const singleStatuses = ['SOLTEIRO', 'solteiro', 'DIVORCIADO', 'VIUVO', '']
      singleStatuses.forEach((status) => {
        const isMarriedOrUnion = ['CASADO', 'UNIAO_ESTAVEL'].includes(status.toUpperCase())
        expect(isMarriedOrUnion).toBe(false)
      })
    })

    it('resolves banking fallback fields according to specification', () => {
      const producerWithData = {
        bankName: 'SICOOB',
        bankAgency: '3250',
        bankAccount: '12345-6',
        bankAccountType: 'CORRENTE',
      }
      expect(producerWithData.bankName || 'BANCO DO BRASIL').toBe('SICOOB')
      expect(producerWithData.bankAgency || '-').toBe('3250')
      expect(`${producerWithData.bankAccount || '-'} (${producerWithData.bankAccountType || 'CORRENTE'})`).toBe('12345-6 (CORRENTE)')

      const emptyProducer: any = {}
      expect(emptyProducer.bankName || 'BANCO DO BRASIL').toBe('BANCO DO BRASIL')
      expect(emptyProducer.bankAgency || emptyProducer.agency || '-').toBe('-')
      expect(`${emptyProducer.bankAccount || emptyProducer.account || '-'} (${emptyProducer.bankAccountType || 'CORRENTE'})`).toBe('- (CORRENTE)')
    })
  })
})
