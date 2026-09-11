import { getCreditLimitPortfolioData } from '@/actions/credit-limit'
import { getUserContext } from '@/lib/auth'
import prisma from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    property: { findMany: jest.fn() },
    organization: { findFirst: jest.fn() },
    branch: { findMany: jest.fn() },
  },
}))

jest.mock('@/lib/auth', () => ({
  getUserContext: jest.fn(),
}))

describe('Módulo de Limite de Crédito — Permissões e Regras MCR', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('1. Regras de Acesso e Permissão (FINANCIAL_SUMMARY)', () => {
    it('bloqueia usuário comum (OWNER/ADMIN) se a organização não tiver o módulo FINANCIAL_SUMMARY', async () => {
      ;(getUserContext as jest.Mock).mockResolvedValue({
        id: 'user_regular',
        role: 'OWNER',
        realRole: 'OWNER',
        organizationId: 'org_1',
        organization: {
          id: 'org_1',
          name: 'Cliente Sem Módulo Financeiro',
          modules: ['CRM', 'GED'],
        },
      })

      const res = await getCreditLimitPortfolioData()

      expect(res.success).toBe(false)
      expect(res.error).toContain('o módulo financeiro não está contratado')
      expect(res.properties).toEqual([])
    })

    it('permite acesso ao SUPER_ADMIN mesmo com o módulo financeiro desligado no cliente', async () => {
      ;(getUserContext as jest.Mock).mockResolvedValue({
        id: 'user_super_admin',
        role: 'SUPER_ADMIN',
        realRole: 'SUPER_ADMIN',
        organizationId: 'org_1',
        organization: {
          id: 'org_1',
          name: 'Cliente Sem Módulo',
          modules: ['CRM', 'GED'], // Desligado
        },
      })

      ;(prisma.branch.findMany as jest.Mock).mockResolvedValue([
        { id: 'branch_1', name: 'Matriz' },
      ])

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      const res = await getCreditLimitPortfolioData()

      expect(res.success).toBe(true)
      expect(res.isFinancialModuleDisabledForOrg).toBe(true)
    })

    it('permite acesso a usuário comum se a organização possuir o módulo FINANCIAL_SUMMARY contratado', async () => {
      ;(getUserContext as jest.Mock).mockResolvedValue({
        id: 'user_regular_licensed',
        role: 'OWNER',
        realRole: 'OWNER',
        organizationId: 'org_licensed',
        organization: {
          id: 'org_licensed',
          name: 'Cliente com Financeiro Ativo',
          modules: ['CRM', 'GED', 'FINANCIAL_SUMMARY'],
        },
      })

      ;(prisma.branch.findMany as jest.Mock).mockResolvedValue([
        { id: 'branch_1', name: 'Matriz' },
      ])

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      const res = await getCreditLimitPortfolioData()

      expect(res.success).toBe(true)
      expect(res.isFinancialModuleDisabledForOrg).toBe(false)
    })
  })

  describe('2. Cálculos de Margens de Garantia MCR e Capacidade de Pagamento', () => {
    it('calcula corretamente 65% para garantias imobiliárias e 50% para penhor', async () => {
      ;(getUserContext as jest.Mock).mockResolvedValue({
        id: 'user_test',
        role: 'OWNER',
        realRole: 'OWNER',
        organizationId: 'org_test',
        organization: {
          id: 'org_test',
          name: 'Org Teste',
          modules: ['FINANCIAL_SUMMARY'],
        },
      })

      ;(prisma.branch.findMany as jest.Mock).mockResolvedValue([
        { id: 'branch_1', name: 'Matriz' },
      ])

      // 100 ha * 10.000 = 1.000.000 terra
      // 200.000 benfeitorias => total imóvel = 1.200.000 * 65% = 780.000
      // 300.000 máquinas + 100.000 gado => total semovente/máquina = 400.000 * 50% = 200.000
      // Total Garantias = 980.000
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'prop_1',
          name: 'Fazenda Esperança',
          propertyName: 'Gleba A',
          city: 'Palmas',
          state: 'TO',
          totalArea: 100,
          branchId: 'branch_1',
          branch: { id: 'branch_1', name: 'Matriz' },
          producers: [
            {
              producer: { id: 'prod_1', name: 'João da Silva', document: '12345678901' },
            },
          ],
          possessionData: {
            vtnPerHectare: 10000,
            effectiveAgroRevenue: 800000,
            operationalExpenses: 300000,
            existingDebtService: 50000,
            familyLivingCosts: 50000,
            creditLimitRequested: 200000,
            creditLimitPurpose: 'CUSTEIO_AGRICOLA',
            creditLimitTargetBank: 'BANCO_DO_BRASIL',
            creditLimitTermMonths: 12,
          },
          machineries: [{ value: 300000 }],
          improvementsList: [{ quantity: 1, unitValue: 200000 }],
          livestockList: [{ quantity: 100, unitValue: 1000 }],
          updatedAt: new Date(),
        },
      ])

      const res = await getCreditLimitPortfolioData()

      expect(res.success).toBe(true)
      expect(res.properties.length).toBe(1)
      const prop = res.properties[0]

      expect(prop.landValue).toBe(1000000)
      expect(prop.improvementsValue).toBe(200000)
      expect(prop.realEstateCollateral).toBe(780000) // (1.000.000 + 200.000) * 0.65
      expect(prop.machineryValue).toBe(300000)
      expect(prop.livestockValue).toBe(100000)
      expect(prop.pledgeCollateral).toBe(200000) // (300.000 + 100.000) * 0.50
      expect(prop.totalCollateralLimit).toBe(980000) // 780.000 + 200.000

      // Margem Líquida: 800.000 - (300.000 + 50.000 + 50.000) = 400.000
      expect(prop.netMargin).toBe(400000)
      expect(prop.status).toBe('COMPATIVEL')

      // KPIs
      expect(res.kpis.totalRequestedLimit).toBe(200000)
      expect(res.kpis.totalCollateralAvailable).toBe(980000)
      expect(res.kpis.compatibleCount).toBe(1)
    })
  })

  describe('3. Diretriz de Ausência Estrita de Emojis', () => {
    it('garante que não existem emojis no código-fonte das telas e componentes de limite de crédito', () => {
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/u

      // Textos fixos das abas e seções
      const tabLabels = [
        'Visão Geral & Limites',
        'Simulador de Crédito MCR',
        'Dossiês & Emissão Bancária',
        'Volume Solicitado',
        'Garantias Ofertáveis',
        'Propriedades no Hub',
        'Margem Líquida Média',
      ]

      for (const label of tabLabels) {
        expect(emojiRegex.test(label)).toBe(false)
      }
    })
  })
})
