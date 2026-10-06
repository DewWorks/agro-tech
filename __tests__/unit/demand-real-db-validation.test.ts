import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { getDemandBillingSuggestion, triggerReceivableFromDemand } from '@/actions/financial/triggers'

jest.mock('@/lib/auth', () => ({
  getUserContext: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('Validação E2E com Banco de Dados Real — Demanda #04E7E7', () => {
  const demandId = '45b09ff1-4a28-4c97-a67d-3a1d0f04e7e7'
  let partnerId: string

  beforeAll(async () => {
    // Mock user context as SUPER_ADMIN
    ;(getUserContext as jest.Mock).mockResolvedValue({
      id: '21ff2bac-38e8-4f7c-9af2-9860f7270087',
      role: 'SUPER_ADMIN',
      email: 'joaovictorpfr@gmail.com',
      organizationId: '6a9a6282-b20e-4138-8e12-0643798f5be2',
    })

    // Garantir que existe um parceiro comercial ativo
    const branch = await prisma.branch.findUnique({
      where: { id: '5f3f37e4-4822-44d7-b9f1-cb338185bf4a' },
    })

    if (!branch) throw new Error('Branch não encontrada')

    let partner = await prisma.commercialPartner.findFirst({
      where: { branchId: branch.id },
    })

    if (!partner) {
      partner = await prisma.commercialPartner.create({
        data: {
          branchId: branch.id,
          name: 'Parceiro Comercial Agro Cerrado',
          document: '33.444.555/0001-22',
          pixKey: '33444555000122',
          pixKeyType: 'CNPJ',
          defaultCommissionRate: 20.0,
          isActive: true,
        },
      })
    }

    partnerId = partner.id

    // Limpar títulos prévios para garantir isolamento
    const existingTitles = await prisma.receivableTitle.findMany({
      where: { demandId },
    })
    for (const t of existingTitles) {
      await prisma.partnerCommission.deleteMany({ where: { receivableTitleId: t.id } })
      await prisma.receivableInstallment.deleteMany({ where: { receivableTitleId: t.id } })
      await prisma.receivableTitle.delete({ where: { id: t.id } })
    }
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('1. Deve sugerir automaticamente R$ 450.000,00 de valor financiado a partir do projeto emitido', async () => {
    const suggestionRes = await getDemandBillingSuggestion(demandId)
    console.log('RESULTADO DA SUGESTÃO:', suggestionRes)

    expect(suggestionRes.success).toBe(true)
    expect(suggestionRes.data).toBeDefined()
    expect(suggestionRes.data?.suggestedFinancedAmount).toBe(450000)
    expect(suggestionRes.data?.suggestedFinancialAgent).toBe('Banco do Brasil')
    expect(suggestionRes.data?.defaultSuccessFeePercent).toBe(2.0)
    expect(suggestionRes.data?.partners.length).toBeGreaterThan(0)
  })

  it('2. Deve disparar faturamento gerando Título a Receber de R$ 9.000,00 e Provisão Bloqueada de R$ 1.800,00', async () => {

    const triggerRes = await triggerReceivableFromDemand(demandId, {
      partnerId,
      successFeePercent: 2.0,
      partnerCommissionPercent: 20.0,
    })

    console.log('RESULTADO DO TRIGGER:', triggerRes)

    expect(triggerRes.alreadyExisted).toBeFalsy()
    expect(triggerRes.data).toBeDefined()

    // Verificar no banco de dados real
    const titleInDb = await prisma.receivableTitle.findFirst({
      where: { demandId },
      include: {
        installments: true,
        commissions: {
          include: { partner: true },
        },
        category: true,
        producer: true,
        property: true,
      },
    })

    expect(titleInDb).toBeDefined()
    expect(Number(titleInDb?.grossAmount)).toBe(9000.00)
    expect(Number(titleInDb?.netAmount)).toBe(9000.00)
    expect(Number(titleInDb?.financedAmount)).toBe(450000.00)
    expect(Number(titleInDb?.successFeePercent)).toBe(2.0)
    expect(titleInDb?.status).toBe('PENDENTE')
    expect(titleInDb?.category.code).toBe('1.1.01')
    expect(titleInDb?.producer.name).toBe('João Victor Póvoa França')
    expect(titleInDb?.property?.name).toBe('Fazenda do João')

    // Verificar parcelas
    expect(titleInDb?.installments).toHaveLength(1)
    expect(Number(titleInDb?.installments[0].amount)).toBe(9000.00)
    expect(titleInDb?.installments[0].status).toBe('A_VENCER')

    // Verificar comissão do parceiro: provisão bloqueada (20% de 9.000 = 1.800)
    expect(titleInDb?.commissions).toHaveLength(1)
    const comm = titleInDb?.commissions[0]
    expect(comm?.status).toBe('BLOQUEADO') // Trava de segurança (ADR-021 / Aditivo 004)
    expect(Number(comm?.totalCommissionAmount)).toBe(1800.00)
    expect(Number(comm?.commissionPercent)).toBe(20.0)
    expect(comm?.partner.id).toBe(partnerId)

    console.log('VALIDAÇÃO NO BANCO DE DADOS REAL BEM-SUCEDIDA!')
    console.log({
      documentNumber: titleInDb?.documentNumber,
      grossAmount: Number(titleInDb?.grossAmount),
      commissionAmount: Number(comm?.totalCommissionAmount),
      commissionStatus: comm?.status,
    })
  })

  it('3. Deve manter idempotência se executado novamente', async () => {
    const triggerAgain = await triggerReceivableFromDemand(demandId, {
      partnerId,
    })

    expect(triggerAgain.alreadyExisted).toBe(true)
    console.log('IDEMPOTÊNCIA VALIDADA:', triggerAgain.message)
  })
})
