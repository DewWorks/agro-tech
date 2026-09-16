import {
  step1LandBaseSchema,
  step1LandSchema,
  improvementItemSchema,
  livestockItemSchema,
} from '@/lib/validations/property-wizard'
import {
  ANIMAL_CATEGORIES_BB,
  ANIMAL_PURPOSES_BB,
  LIVESTOCK_BREEDS,
  BB_IMPROVEMENTS_CATALOG,
  CREDIT_BANKS,
  EDUCATION_LEVEL_OPTIONS,
  PROPERTY_STATUS_OPTIONS,
} from '@/lib/validations/reference-data'

describe('Cadastral Update & Analytical Dossier - Phase 2 Tests', () => {
  describe('Reference Data & Catalog Invariants', () => {
    it('guarantees ANIMAL_CATEGORIES_BB contains exactly 32 official Banco do Brasil categories', () => {
      expect(ANIMAL_CATEGORIES_BB.length).toBe(32)
      expect(ANIMAL_CATEGORIES_BB).toContain('Avestruz')
      expect(ANIMAL_CATEGORIES_BB).toContain('Vaca')
      expect(ANIMAL_CATEGORIES_BB).toContain('Touro')
      expect(ANIMAL_CATEGORIES_BB).toContain('Novilha Bovina')
      expect(ANIMAL_CATEGORIES_BB).toContain('Garrote')
    })

    it('guarantees ANIMAL_PURPOSES_BB contains exactly 16 official Banco do Brasil purposes', () => {
      expect(ANIMAL_PURPOSES_BB.length).toBe(16)
      expect(ANIMAL_PURPOSES_BB).toContain('Produção de Crias')
      expect(ANIMAL_PURPOSES_BB).toContain('Engorda em Confinamento')
      expect(ANIMAL_PURPOSES_BB).toContain('Produção de Leite')
      expect(ANIMAL_PURPOSES_BB).toContain('Animais de Serviços')
    })

    it('guarantees Nelore Mocho is excluded and replaced with standard Nelore and other breeds', () => {
      expect(LIVESTOCK_BREEDS).not.toContain('Nelore Mocho')
      expect(LIVESTOCK_BREEDS).toContain('Nelore')
      expect(LIVESTOCK_BREEDS).toContain('Caipira')
      expect(LIVESTOCK_BREEDS).toContain('Melhorados')
    })

    it('guarantees Pastagem Artificial exists in BB_IMPROVEMENTS_CATALOG with unit ha and formation cost', () => {
      const pasture = BB_IMPROVEMENTS_CATALOG.find((c) => c.specification === 'Pastagem Artificial')
      expect(pasture).toBeDefined()
      expect(pasture?.unit).toBe('ha')
      expect(pasture?.suggestedValue).toBe(2500)
    })

    it('provides valid options for credit banks, education levels, and property status', () => {
      expect(CREDIT_BANKS.length).toBeGreaterThanOrEqual(10)
      expect(EDUCATION_LEVEL_OPTIONS.length).toBe(8)
      expect(PROPERTY_STATUS_OPTIONS.length).toBe(2)
      expect(PROPERTY_STATUS_OPTIONS.map(p => p.value)).toEqual(['QUITADA', 'FINANCIADA'])
    })
  })

  describe('Zod Schema Validations - Step 1 Land & Tenure', () => {
    const validOwnerBase = {
      name: 'Fazenda Boa Esperança',
      branchId: 'branch-1',
      producerId: 'producer-1',
      ownershipType: 'PROPRIETARIO',
      propertyStatus: 'QUITADA',
      totalArea: 500,
      productiveArea: 300,
      pastureArea: 150,
      preserveArea: 50,
      vtnPerHectare: 8500,
      totalLandValue: 4250000,
      registrationNumber: '12345',
      registryOffice: '1º Ofício',
      comarca: 'Taguatinga',
      car: 'TO-1720903-ABCD1234EF',
      ccir: '9999999999999',
      itr: '88888888',
      city: 'Taguatinga',
      state: 'TO',
      accessRoute: 'Rodovia TO-050 km 15',
      confrontantNorth: 'Córrego das Pedras',
      confrontantSouth: 'Fazenda Santa Maria',
      confrontantEast: 'Rodovia TO-050',
      confrontantWest: 'Rio da Conceição',
      impenhorabilidade: 'PENHORAVEL',
    }

    it('successfully parses valid owner property with native VTN, confrontations and status', () => {
      const parsed = step1LandBaseSchema.safeParse(validOwnerBase)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.propertyStatus).toBe('QUITADA')
        expect(parsed.data.confrontantNorth).toBe('Córrego das Pedras')
        expect(parsed.data.vtnPerHectare).toBe(8500)
      }
    })

    it('rejects tenure when exploredAreaHa exceeds totalArea for non-owners', () => {
      const invalidTenure = {
        ...validOwnerBase,
        ownershipType: 'ARRENDATARIO',
        totalArea: 200,
        exploredAreaHa: 250, // Erro: maior que totalArea
        contractStartDate: '2024-01-01',
        contractEndDate: '2027-12-31',
      }
      const parsed = step1LandSchema.safeParse(invalidTenure)
      expect(parsed.success).toBe(false)
      if (!parsed.success) {
        const error = parsed.error.issues.find((i) => i.path.includes('exploredAreaHa'))
        expect(error).toBeDefined()
        expect(error?.message).toContain('não pode ser superior à área total')
      }
    })

    it('rejects tenure when contractEndDate is before or equal to contractStartDate', () => {
      const invalidDates = {
        ...validOwnerBase,
        ownershipType: 'PARCEIRO',
        totalArea: 500,
        exploredAreaHa: 300,
        contractStartDate: '2026-05-01',
        contractEndDate: '2025-05-01', // Erro: término antes do início
      }
      const parsed = step1LandSchema.safeParse(invalidDates)
      expect(parsed.success).toBe(false)
      if (!parsed.success) {
        const error = parsed.error.issues.find((i) => i.path.includes('contractEndDate'))
        expect(error).toBeDefined()
        expect(error?.message).toContain('posterior à data inicial')
      }
    })

    it('accepts valid non-owner contract when exploredAreaHa <= totalArea and contractEndDate > contractStartDate', () => {
      const validTenure = {
        ...validOwnerBase,
        ownershipType: 'COMODATARIO',
        totalArea: 500,
        exploredAreaHa: 350,
        contractStartDate: '2024-01-01',
        contractEndDate: '2029-12-31',
        landlordName: 'José da Silva Santos',
        landlordDocument: '123.456.789-00',
        contractType: 'COMODATO',
      }
      const parsed = step1LandSchema.safeParse(validTenure)
      expect(parsed.success).toBe(true)
    })
  })

  describe('Zod Schema Validations - Improvements & Livestock', () => {
    it('parses Pastagem Artificial with isArtificialPasture and unit ha', () => {
      const pastureImp = {
        specification: 'Pastagem Artificial',
        unit: 'ha',
        quantity: 150,
        unitValue: 2500,
        totalValue: 375000,
        conservationState: 'BOM',
        isArtificialPasture: true,
      }
      const parsed = improvementItemSchema.safeParse(pastureImp)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.isArtificialPasture).toBe(true)
        expect(parsed.data.unit).toBe('ha')
      }
    })

    it('parses livestock with official BB category, purpose, and branding details', () => {
      const live = {
        species: 'BOVINO',
        category: 'Vaca',
        categoryBB: 'Vaca',
        purpose: 'Produção de Crias',
        purposeBB: 'Produção de Crias',
        breed: 'Nelore',
        quantity: 80,
        unitValue: 4500,
        totalValue: 360000,
        markingType: 'Ferro Quente',
        brandingType: 'Ferro Quente',
        markingLocation: 'Perna Traseira Direita',
        brandingLocation: 'Perna Traseira Direita',
      }
      const parsed = livestockItemSchema.safeParse(live)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.breed).toBe('Nelore')
        expect(parsed.data.brandingType).toBe('Ferro Quente')
      }
    })
  })
})
