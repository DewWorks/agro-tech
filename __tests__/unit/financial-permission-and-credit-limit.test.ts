import { getCreditTemplatesList, resolveCreditProjectDocument } from '@/actions/credit-projects'
import { getUserContext } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { propertyWizardSchema, defaultPropertyWizardValues } from '@/lib/validations/property-wizard'

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    producer: { findUnique: jest.fn(), findMany: jest.fn() },
    property: { findUnique: jest.fn() },
    organization: { findUnique: jest.fn() },
    branch: { findUnique: jest.fn() },
    document: { findMany: jest.fn() },
    generatedForm: { create: jest.fn() },
  },
}))

jest.mock('@/lib/auth', () => ({
  getUserContext: jest.fn(),
}))

describe('Módulo Financeiro & Limite de Crédito — Regras de Permissão e Modelo Base', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('1. Regras de Exibição de Templates de Limite de Crédito', () => {
    it('SUPER_ADMIN deve sempre ter acesso a LIMITE_CREDITO_BB mesmo com a permissão desativada no cliente', async () => {
      ;(getUserContext as jest.Mock).mockResolvedValue({
        id: 'user_super_admin',
        role: 'SUPER_ADMIN',
        realRole: 'SUPER_ADMIN',
        organizationId: null,
        organization: null,
      })

      const templates = await getCreditTemplatesList()
      const hasLimiteCredito = templates.some((t) => t.code === 'LIMITE_CREDITO_BB')

      expect(hasLimiteCredito).toBe(true)
    })

    it('Usuário comum (OWNER/ADMIN) sem FINANCIAL_SUMMARY NÃO deve ver LIMITE_CREDITO_BB', async () => {
      ;(getUserContext as jest.Mock).mockResolvedValue({
        id: 'user_owner',
        role: 'OWNER',
        realRole: 'OWNER',
        organizationId: 'org_1',
        organization: {
          id: 'org_1',
          name: 'Fazenda Modelo',
          modules: ['CRM', 'GED'], // NÃO possui FINANCIAL_SUMMARY
        },
      })

      const templates = await getCreditTemplatesList()
      const hasLimiteCredito = templates.some((t) => t.code === 'LIMITE_CREDITO_BB')

      expect(hasLimiteCredito).toBe(false)
      // Deve continuar vendo os outros modelos
      expect(templates.some((t) => t.code === 'CHECKLIST_PROFISSIONAL')).toBe(true)
    })

    it('Usuário comum (OWNER/ADMIN) com FINANCIAL_SUMMARY ativo DEVE ver LIMITE_CREDITO_BB', async () => {
      ;(getUserContext as jest.Mock).mockResolvedValue({
        id: 'user_owner_financial',
        role: 'OWNER',
        realRole: 'OWNER',
        organizationId: 'org_2',
        organization: {
          id: 'org_2',
          name: 'Agropecuária Top',
          modules: ['CRM', 'GED', 'FINANCIAL_SUMMARY'],
        },
      })

      const templates = await getCreditTemplatesList()
      const hasLimiteCredito = templates.some((t) => t.code === 'LIMITE_CREDITO_BB')

      expect(hasLimiteCredito).toBe(true)
    })
  })

  describe('2. Validação da Emissão de Documento LIMITE_CREDITO_BB', () => {
    it('deve barrar a emissão de LIMITE_CREDITO_BB se o cliente não tiver o módulo contratado', async () => {
      ;(getUserContext as jest.Mock).mockResolvedValue({
        id: 'user_regular',
        role: 'ADMIN',
        realRole: 'ADMIN',
        organizationId: 'org_no_fin',
        branchId: 'branch_1',
      })

      ;(prisma.producer.findUnique as jest.Mock).mockResolvedValue({
        id: 'prod_1',
        name: 'João Produtor',
        document: '12345678909',
        type: 'PF',
      })

      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        id: 'prop_1',
        name: 'Fazenda Boa Esperança',
        branchId: 'branch_1',
        branch: { organizationId: 'org_no_fin' },
      })

      ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        id: 'org_no_fin',
        name: 'Empresa Sem Financeiro',
        modules: ['CRM', 'GED'],
        users: [],
      })

      await expect(
        resolveCreditProjectDocument('prod_1', 'prop_1', 'LIMITE_CREDITO_BB', {})
      ).rejects.toThrow('Acesso não autorizado: o módulo Resumo Financeiro & Limites não está ativo')
    })
  })

  describe('3. Validação do Schema do Wizard de Propriedades com Base de Limite de Crédito', () => {
    it('deve aceitar os campos de limite de crédito com os valores padrão corretos', () => {
      const parsed = propertyWizardSchema.safeParse({
        ...defaultPropertyWizardValues,
        name: 'Fazenda Teste',
        branchId: 'branch_1',
        producerId: 'prod_1',
        creditLimitRequested: 250000,
        creditLimitPurpose: 'CUSTEIO_AGRICOLA',
        creditLimitTargetBank: 'BANCO_DO_BRASIL',
        creditLimitTermMonths: 12,
      })

      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.creditLimitRequested).toBe(250000)
        expect(parsed.data.creditLimitPurpose).toBe('CUSTEIO_AGRICOLA')
        expect(parsed.data.creditLimitTargetBank).toBe('BANCO_DO_BRASIL')
        expect(parsed.data.creditLimitTermMonths).toBe(12)
      }
    })

    it('deve rejeitar valor negativo no limite de crédito pretendido', () => {
      const parsed = propertyWizardSchema.safeParse({
        ...defaultPropertyWizardValues,
        name: 'Fazenda Teste',
        branchId: 'branch_1',
        producerId: 'prod_1',
        creditLimitRequested: -5000,
      })

      expect(parsed.success).toBe(false)
    })
  })
})
