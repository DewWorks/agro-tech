import {
  normalizeCategoryBB,
  denormalizeCategoryBB,
  normalizePurposeBB,
  denormalizePurposeBB,
  normalizeLivestockCategory,
  normalizeLivestockSpecies
} from '@/lib/validations/livestock-mapper'
import { generateLimiteCreditoBbHtml, LimiteCreditoDocumentData } from '@/lib/document-templates/limite-credito-bb'

describe('Livestock and Spouse Persistence & Document Emission Tests', () => {
  describe('Livestock Enum Normalizers and Denormalizers', () => {
    it('should normalize UI labels to Prisma AnimalCategoryBB enums', () => {
      expect(normalizeCategoryBB('Vaca')).toBe('VACA')
      expect(normalizeCategoryBB('Novilha Bovina')).toBe('NOVILHA_BOVINA')
      expect(normalizeCategoryBB('Novilha')).toBe('NOVILHA_BOVINA')
      expect(normalizeCategoryBB('Bezerro')).toBe('BEZERRO')
      expect(normalizeCategoryBB('Touro')).toBe('TOURO')
      expect(normalizeCategoryBB('Garrote')).toBe('GARROTE')
      expect(normalizeCategoryBB('BOI')).toBe('BOI')
      expect(normalizeCategoryBB('UNKNOWN_VALUE')).toBeNull()
      expect(normalizeCategoryBB(undefined)).toBeNull()
    })

    it('should denormalize Prisma AnimalCategoryBB enums back to Portuguese UI labels', () => {
      expect(denormalizeCategoryBB('VACA')).toBe('Vaca')
      expect(denormalizeCategoryBB('NOVILHA_BOVINA')).toBe('Novilha Bovina')
      expect(denormalizeCategoryBB('BEZERRO')).toBe('Bezerro')
      expect(denormalizeCategoryBB('TOURO')).toBe('Touro')
      expect(denormalizeCategoryBB('GARROTE')).toBe('Garrote')
      expect(denormalizeCategoryBB('BOI')).toBe('Boi')
    })

    it('should normalize UI labels to Prisma AnimalPurposeBB enums', () => {
      expect(normalizePurposeBB('Produção de Crias')).toBe('PRODUCAO_DE_CRIAS')
      expect(normalizePurposeBB('Engorda Para Abate')).toBe('ENGORDA_PARA_ABATE')
      expect(normalizePurposeBB('Engorda em Confinamento')).toBe('ENGORDA_EM_CONFINAMENTO')
      expect(normalizePurposeBB('Produção de Leite')).toBe('PRODUCAO_DE_LEITE')
      expect(normalizePurposeBB('Animais de Serviços')).toBe('ANIMAIS_DE_SERVICO')
      expect(normalizePurposeBB('UNKNOWN')).toBe('PRODUCAO_DE_CRIAS')
    })

    it('should denormalize Prisma AnimalPurposeBB enums back to Portuguese UI labels', () => {
      expect(denormalizePurposeBB('PRODUCAO_DE_CRIAS')).toBe('Produção de Crias')
      expect(denormalizePurposeBB('ENGORDA_PARA_ABATE')).toBe('Engorda Para Abate')
      expect(denormalizePurposeBB('ENGORDA_EM_CONFINAMENTO')).toBe('Engorda em Confinamento')
      expect(denormalizePurposeBB('PRODUCAO_DE_LEITE')).toBe('Produção de Leite')
      expect(denormalizePurposeBB('ANIMAIS_DE_SERVICO')).toBe('Animais de Serviços')
    })

    it('should normalize species and category enums safely', () => {
      expect(normalizeLivestockSpecies('Bovino')).toBe('BOVINO')
      expect(normalizeLivestockSpecies('OVINO')).toBe('OVINO')
      expect(normalizeLivestockSpecies('UNKNOWN')).toBe('BOVINO')

      expect(normalizeLivestockCategory('Vaca')).toBe('MATRIZES')
      expect(normalizeLivestockCategory('Touro')).toBe('TOURO')
      expect(normalizeLivestockCategory('Bezerro')).toBe('BEZERRO')
      expect(normalizeLivestockCategory('Novilho')).toBe('NOVILHO')
    })
  })

  describe('Document Generation: Limite de Crédito BB with Spouse & Livestock', () => {
    it('should render spouse, civil status, marriage regime, and outorga uxoria signature when married', () => {
      const mockData: LimiteCreditoDocumentData = {
        producer: {
          name: 'João da Silva',
          document: '123.456.789-00',
          type: 'PF',
          civilStatus: 'CASADO',
          marriageRegime: 'COMUNHAO_PARCIAL',
          spouseName: 'Maria da Silva',
          spouseCpf: '987.654.321-00',
          spouseRg: '1234567 SSP/TO',
          spouseNationality: 'Brasileira',
          phone: '(63) 99999-1111',
          street: 'Fazenda Esperança',
          city: 'Palmas',
          state: 'TO',
        },
        property: {
          name: 'Fazenda Santa Rita',
          registrationNumber: '12345',
          registryOffice: 'CRI Palmas',
          car: 'TO-12345678',
          city: 'Palmas',
          state: 'TO',
          totalAreaHa: 500,
          pastureAreaHa: 300,
          agricultureAreaHa: 100,
          preservationAreaHa: 100,
        },
        organization: {
          name: 'AgroTech Consultoria',
          cnpj: '12.345.678/0001-90',
          ownerName: 'Dr. Agrônomo RT',
        },
        options: {
          responsibleName: 'Dr. Agrônomo RT',
          creaNumber: '123456-D/TO',
          artNumber: '2026/001',
          estimatedLandValuePerHa: 15000,
          improvementsValue: 120000,
          machineryValue: 450000,
        }
      }

      const html = generateLimiteCreditoBbHtml(mockData)

      // Cônjuge verification in Section I
      expect(html).toContain('João da Silva')
      expect(html).toContain('Maria da Silva')
      expect(html).toContain('987.654.321-00')
      expect(html).toContain('Comunhão Parcial de Bens')
      expect(html).toContain('1234567 SSP/TO')
      expect(html).toContain('Brasileira')

      // Outorga Uxória signature in Section VI
      expect(html).toContain('Assinatura do Cônjuge (Outorga Uxória)')
    })

    it('should format itemized semoventes table with category, breed, quantity, BRL currency, and avoid page breaks', () => {
      const mockData: LimiteCreditoDocumentData = {
        producer: {
          name: 'Carlos Fazendeiro',
          document: '111.222.333-44',
          type: 'PF',
          civilStatus: 'SOLTEIRO',
          city: 'Araguaína',
          state: 'TO',
        },
        property: {
          name: 'Fazenda Bela Vista',
          city: 'Araguaína',
          state: 'TO',
          totalAreaHa: 200,
          pastureAreaHa: 150,
          livestockList: [
            {
              categoryBB: 'VACA',
              purposeBB: 'PRODUCAO_DE_CRIAS',
              breed: 'Nelore PO',
              quantity: 80,
              ageMonths: 36,
              avgWeightKg: 450,
              unitValue: 3500,
              brandingType: 'FERRO_QUENTE',
              brandingLocation: 'Perna Traseira Esquerda',
            },
            {
              categoryBB: 'TOURO',
              purposeBB: 'REPRODUCAO',
              breed: 'Angus',
              quantity: 5,
              ageMonths: 48,
              avgWeightKg: 800,
              unitValue: 12000,
              brandingType: 'FERRO_QUENTE',
              brandingLocation: 'Paleta Esquerda',
            }
          ]
        },
        organization: {
          name: 'AgroTech Consultoria',
        },
        options: {
          estimatedLandValuePerHa: 10000,
        }
      }

      const html = generateLimiteCreditoBbHtml(mockData)

      // Section IV Semoventes table
      expect(html).toContain('IV - Semoventes e Rebanho Bovino')
      expect(html).toContain('Categoria (BB)')
      expect(html).toContain('Finalidade')
      expect(html).toContain('Nelore PO')
      expect(html).toContain('Angus')
      expect(html).toContain('85 cab') // 80 + 5 heads
      expect(html).toContain('page-break-inside: avoid; break-inside: avoid;')

      // Safe currency formatting checks (340.000,00 total = 80*3500 + 5*12000 = 280000 + 60000)
      expect(html).toContain('R$ 340.000,00')
      expect(html).toContain('R$ 280.000,00')
      expect(html).toContain('R$ 60.000,00')
    })
  })
})
