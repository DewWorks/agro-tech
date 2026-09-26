jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

import { recordDocumentEmission } from '@/actions/credit-projects'
import { saveGeneratedPdfMetadata } from '@/actions/legal-documents'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    producer: { findUnique: jest.fn() },
    generatedForm: { create: jest.fn(), findFirst: jest.fn() },
  },
}))

jest.mock('@/lib/auth', () => ({
  getUserContext: jest.fn(),
}))

describe('Governança de Emissão e Persistência de Formulários Gerados', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('recordDocumentEmission', () => {
    it('deve persistir GeneratedForm com sha256Hash e storagePdfPath e revalidar a rota do dashboard do owner', async () => {
      ;(getUserContext as jest.Mock).mockResolvedValue({
        id: 'user_1',
        branchId: 'branch_1',
        role: 'CONSULTANT',
      })

      ;(prisma.producer.findUnique as jest.Mock).mockResolvedValue({
        id: 'prod_1',
        branchId: 'branch_1',
      })

      ;(prisma.generatedForm.create as jest.Mock).mockResolvedValue({
        id: 'form_123',
        sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      })

      const res = await recordDocumentEmission({
        producerId: 'prod_1',
        propertyId: 'prop_1',
        templateCode: 'LIMITE_CREDITO_BB',
        payload: { test: true },
        storagePdfPath: 'ged/credit-projects/LIMITE_CREDITO_BB/test.pdf',
        sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      })

      expect(res.success).toBe(true)
      expect(prisma.generatedForm.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          branchId: 'branch_1',
          producerId: 'prod_1',
          propertyId: 'prop_1',
          templateCode: 'LIMITE_CREDITO_BB',
          storagePdfPath: 'ged/credit-projects/LIMITE_CREDITO_BB/test.pdf',
          sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith('/admin/dashboard/owner')
    })
  })

  describe('saveGeneratedPdfMetadata', () => {
    it('deve registrar formulário legal com sha256Hash e chamar revalidatePath', async () => {
      ;(getUserContext as jest.Mock).mockResolvedValue({
        id: 'user_2',
        branchId: 'branch_2',
        role: 'CONSULTANT',
      })

      ;(prisma.producer.findUnique as jest.Mock).mockResolvedValue({
        id: 'prod_2',
        branchId: 'branch_2',
      })

      ;(prisma.generatedForm.create as jest.Mock).mockResolvedValue({
        id: 'form_456',
      })

      await saveGeneratedPdfMetadata({
        producerId: 'prod_2',
        propertyId: 'prop_2',
        templateCode: 'DECLARACAO_CONJUNTA',
        templateVersion: 1,
        payloadSnapshot: { declared: true },
        storagePdfPath: 'declarations/decl_123.pdf',
        sha256Hash: 'aabbcc112233',
      })

      expect(prisma.generatedForm.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          branchId: 'branch_2',
          producerId: 'prod_2',
          propertyId: 'prop_2',
          templateCode: 'DECLARACAO_CONJUNTA',
          storagePdfPath: 'declarations/decl_123.pdf',
          sha256Hash: 'aabbcc112233',
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith('/admin/dashboard/owner')
    })
  })
})
