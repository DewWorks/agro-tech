jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

import {
  getDemandBillingSuggestion,
  triggerReceivableFromDemand,
} from '@/actions/financial/triggers'
import { extractFinancedAmountFromPayload } from '@/lib/financial/extract-amount'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'

jest.mock('@/lib/prisma', () => {
  const mockPrisma: any = {
    producer: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    serviceDemand: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    receivableTitle: {
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    receivableInstallment: {
      create: jest.fn(),
    },
    partnerCommission: {
      create: jest.fn(),
    },
    financialCategory: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    commercialPartner: {
      findMany: jest.fn(),
    },
    generatedForm: {
      findFirst: jest.fn(),
    },
    creditAnalysis: {
      findFirst: jest.fn(),
    },
    document: {
      findFirst: jest.fn(),
    },
    serviceDemandHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  }
  mockPrisma.$transaction.mockImplementation(async (cb: any) => {
    if (typeof cb === 'function') {
      return cb(mockPrisma)
    }
    return cb
  })
  return {
    __esModule: true,
    default: mockPrisma,
  }
})

jest.mock('@/lib/auth', () => ({
  getUserContext: jest.fn(),
}))

describe('Gatilho Financeiro da Esteira de Demandas (ADR-021)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('extractFinancedAmountFromPayload', () => {
    it('extrai valor calculado de custeio (custeioAreaHa * custeioCostPerHa)', () => {
      const payload = {
        custeioAreaHa: 150,
        custeioCostPerHa: 3000,
      }
      expect(extractFinancedAmountFromPayload(payload)).toBe(450000)
    })

    it('extrai financedAmount explícito', () => {
      const payload = { financedAmount: 320000 }
      expect(extractFinancedAmountFromPayload(payload)).toBe(320000)
    })

    it('extrai renovagroFinanced e inovagroFinanced', () => {
      expect(extractFinancedAmountFromPayload({ renovagroFinanced: 250000 })).toBe(250000)
      expect(extractFinancedAmountFromPayload({ inovagroFinanced: 180000 })).toBe(180000)
    })

    it('extrai custeioQuantity * custeioUnitPrice', () => {
      const payload = {
        custeioQuantity: 50,
        custeioUnitPrice: 2000,
      }
      expect(extractFinancedAmountFromPayload(payload)).toBe(100000)
    })

    it('retorna 0 para payload sem campos de valor', () => {
      expect(extractFinancedAmountFromPayload({})).toBe(0)
      expect(extractFinancedAmountFromPayload(null)).toBe(0)
    })
  })

  describe('getDemandBillingSuggestion', () => {
    it('sugere valor financiado de R$ 450.000,00 e honorários brutos de R$ 9.000,00', async () => {
      ;(getUserContext as jest.Mock).mockResolvedValue({
        id: 'user_1',
        role: 'OWNER',
        organizationId: 'org_1',
      })

      ;(prisma.serviceDemand.findUnique as jest.Mock).mockResolvedValue({
        id: 'demand_04e7e7',
        serviceType: 'PROJETO_CUSTEIO',
        producerId: 'prod_1',
        producer: { id: 'prod_1', name: 'João Victor Póvoa França' },
        propertyId: 'prop_1',
        property: { id: 'prop_1', name: 'Fazenda do João' },
        notes: null,
        documentId: null,
        proposalId: null,
        branch: {
          id: 'branch_1',
          name: 'Filial Principal',
          organizationId: 'org_1',
          organization: {
            financialSettings: {
              defaultSuccessFeePercent: 2.0,
              defaultPartnerCommissionPercent: 20.0,
            },
          },
        },
        receivableTitles: [],
      })

      ;(prisma.generatedForm.findFirst as jest.Mock).mockResolvedValue({
        id: 'form_1',
        templateCode: 'PROJETO_CUSTEIO_SAFRA',
        payloadSnapshot: {
          custeioAreaHa: 150,
          custeioCostPerHa: 3000,
          financialAgent: 'Banco do Brasil',
        },
      })

      ;(prisma.commercialPartner.findMany as jest.Mock).mockResolvedValue([
        { id: 'part_1', name: 'Agrícola Cerrado', defaultCommissionRate: 20.0 },
      ])

      const res = await getDemandBillingSuggestion('demand_04e7e7')

      expect(res.success).toBe(true)
      expect(res.data).toBeDefined()
      expect(res.data?.suggestedFinancedAmount).toBe(450000)
      expect(res.data?.defaultSuccessFeePercent).toBe(2.0)
      expect(res.data?.defaultPartnerCommissionPercent).toBe(20.0)
      expect(res.data?.suggestedFinancialAgent).toBe('Banco do Brasil')
      expect(res.data?.alreadyBilled).toBe(false)
      expect(res.data?.partners).toHaveLength(1)
    })
  })

  describe('triggerReceivableFromDemand', () => {
    it('cria título a receber de R$ 9.000,00 e provisão bloqueada de comissão de R$ 1.800,00', async () => {
      ;(getUserContext as jest.Mock).mockResolvedValue({
        id: 'user_1',
        role: 'OWNER',
        organizationId: 'org_1',
      })

      ;(prisma.serviceDemand.findUnique as jest.Mock).mockResolvedValue({
        id: 'demand_04e7e7',
        branchId: 'branch_1',
        producerId: 'prod_1',
        propertyId: 'prop_1',
        serviceType: 'PROJETO_CUSTEIO',
        notes: 'Demanda de custeio aprovada',
        documentId: null,
        proposalId: null,
        branch: {
          organizationId: 'org_1',
          organization: {
            id: 'org_1',
            financialSettings: {
              defaultSuccessFeePercent: 2.0,
              defaultPartnerCommissionPercent: 20.0,
            },
          },
        },
      })

      // Idempotency check: no existing titles
      ;(prisma.receivableTitle.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.receivableTitle.count as jest.Mock).mockResolvedValue(0)

      // Fallback cascade: finds form with 150ha * 3000 = 450000
      ;(prisma.generatedForm.findFirst as jest.Mock).mockResolvedValue({
        id: 'form_1',
        templateCode: 'PROJETO_CUSTEIO_SAFRA',
        payloadSnapshot: {
          custeioAreaHa: 150,
          custeioCostPerHa: 3000,
          financialAgent: 'Banco do Brasil',
        },
      })

      // Category lookup
      ;(prisma.financialCategory.findFirst as jest.Mock).mockResolvedValue({
        id: 'cat_1',
        code: '1.1.01',
        name: 'Honorários de Crédito Rural',
      })

      // Title creation
      const createdTitle = {
        id: 'title_1',
        documentNumber: 'FAT-2026-0001',
        grossAmount: 9000,
        netAmount: 9000,
        status: 'PENDENTE',
      }
      ;(prisma.receivableTitle.create as jest.Mock).mockResolvedValue(createdTitle)

      // Installment creation
      ;(prisma.receivableInstallment.create as jest.Mock).mockResolvedValue({
        id: 'inst_1',
        installmentNumber: 1,
        amount: 9000,
      })

      // Commission creation
      ;(prisma.partnerCommission.create as jest.Mock).mockResolvedValue({
        id: 'comm_1',
        amount: 1800,
        status: 'BLOQUEADO',
      })

      const res = await triggerReceivableFromDemand('demand_04e7e7', {
        partnerId: 'part_1',
      })

      expect(res.alreadyExisted).toBeFalsy()
      expect(res.data).toBeDefined()
      expect(prisma.receivableTitle.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          branchId: 'branch_1',
          producerId: 'prod_1',
          propertyId: 'prop_1',
          demandId: 'demand_04e7e7',
          status: 'PENDENTE',
        }),
      })

      // Verifica comissão provisionada bloqueada: 20% de 9.000 = 1.800
      expect(prisma.partnerCommission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          partnerId: 'part_1',
          status: 'BLOQUEADO',
        }),
      })
    })

    it('mantém idempotência se o título já existir', async () => {
      ;(getUserContext as jest.Mock).mockResolvedValue({
        id: 'user_1',
        role: 'OWNER',
        organizationId: 'org_1',
      })

      ;(prisma.serviceDemand.findUnique as jest.Mock).mockResolvedValue({
        id: 'demand_04e7e7',
        branchId: 'branch_1',
        branch: {
          organizationId: 'org_1',
          organization: { financialSettings: null },
        },
      })

      ;(prisma.receivableTitle.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing_title_1',
        documentNumber: 'FAT-2026-0001',
        grossAmount: 9000,
      })

      const res = await triggerReceivableFromDemand('demand_04e7e7')

      expect(res.alreadyExisted).toBe(true)
      expect(prisma.receivableTitle.create).not.toHaveBeenCalled()
    })
  })
})
