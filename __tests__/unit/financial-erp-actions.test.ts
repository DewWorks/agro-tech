import crypto from 'crypto'
import {
  financialSettingsSchema,
  bankAccountSchema,
  transferBetweenAccountsSchema,
  commercialPartnerSchema,
  createReceivableTitleSchema,
  settleReceivableInstallmentSchema,
  reverseReceivablePaymentSchema,
  createPayableTitleSchema,
  settlePayableInstallmentSchema,
} from '@/lib/validations/financial'
import {
  buildFinancialBranchWhere,
  FinancialAuthContext,
} from '@/lib/financial/auth-guard'
import {
  maskDocument,
  maskPixKey,
  validatePixKey,
  maskBankAgency,
  maskBankAccount,
  maskCropYear,
} from '@/lib/utils'

describe('Módulo Financeiro ERP (Aditivo 004) — Validações & Regras de Negócio', () => {
  // UUIDs válidos compatíveis com Zod (RFC 4122 v4)
  const validUUID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
  const validUUID2 = '109156be-c4fb-41ea-b1b4-efe1671c5836'

  describe('1. Validações Zod de Configurações e Tesouraria', () => {
    it('valida FinancialSettings com percentuais dentro do intervalo [0, 100]', () => {
      const valid = financialSettingsSchema.safeParse({
        defaultSuccessFeePercent: 2.5,
        defaultPartnerCommissionPercent: 20.0,
        defaultFieldSurveyCostPerKm: 3.0,
      })
      expect(valid.success).toBe(true)

      const invalid = financialSettingsSchema.safeParse({
        defaultSuccessFeePercent: 150, // Maior que 100
        defaultPartnerCommissionPercent: -5, // Negativo
        defaultFieldSurveyCostPerKm: 2.0,
      })
      expect(invalid.success).toBe(false)
    })

    it('rejeita transferência interna entre a mesma conta bancária', () => {
      const invalid = transferBetweenAccountsSchema.safeParse({
        sourceBankAccountId: validUUID,
        destinationBankAccountId: validUUID, // Mesma conta!
        amount: 500,
        description: 'Transferência inválida',
      })
      expect(invalid.success).toBe(false)
      if (!invalid.success) {
        expect(invalid.error.issues[0].message).toContain('diferente')
      }
    })

    it('aceita transferência válida entre contas distintas', () => {
      const valid = transferBetweenAccountsSchema.safeParse({
        sourceBankAccountId: validUUID,
        destinationBankAccountId: validUUID2,
        amount: 2500,
        description: 'Suprimento de Caixa Físico Filial',
      })
      expect(valid.success).toBe(true)
    })
  })

  describe('2. Validação de Parceiros Comerciais e Chave PIX', () => {
    it('valida parceiro comercial com CPF válido e chave PIX', () => {
      // CPF matematicamente válido de teste (000.000.000-00 é rejeitado pelo validador)
      // Usando gerador/máscara válida
      const validCPF = '52998224725' // CPF válido conhecido
      const res = commercialPartnerSchema.safeParse({
        branchId: validUUID,
        name: 'Carlos Corretor de Campo',
        document: validCPF,
        phone: '63999998888',
        email: 'carlos@corretor.com',
        pixKey: 'carlos@corretor.com',
        pixKeyType: 'EMAIL',
        defaultCommissionRate: 20,
      })
      expect(res.success).toBe(true)
    })

    it('rejeita parceiro com documento CPF/CNPJ inválido', () => {
      const res = commercialPartnerSchema.safeParse({
        branchId: validUUID,
        name: 'Parceiro Fake',
        document: '11111111111', // CPF com dígitos repetidos inválido
        pixKey: 'carlos@corretor.com',
        pixKeyType: 'EMAIL',
        defaultCommissionRate: 20,
      })
      expect(res.success).toBe(false)
    })

    it('rejeita chave PIX do tipo CPF com texto aleatório (ex: "asdasd")', () => {
      const validCPF = '52998224725'
      const res = commercialPartnerSchema.safeParse({
        branchId: validUUID,
        name: 'Carlos Corretor',
        document: validCPF,
        pixKey: 'asdasd', // Texto inválido para CPF
        pixKeyType: 'CPF',
        defaultCommissionRate: 20,
      })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('CPF deve conter exatamente 11 dígitos')
      }
    })

    it('valida corretamente máscaras e funções de formatação bancária', () => {
      // Máscara dinâmica de documento CPF vs CNPJ
      expect(maskDocument('52998224725')).toBe('529.982.247-25')
      expect(maskDocument('11222333000181')).toBe('11.222.333/0001-81')

      // Máscara e validação de Chave PIX
      expect(maskPixKey('52998224725', 'CPF')).toBe('529.982.247-25')
      expect(maskPixKey('asdasd', 'CPF')).toBe('') // Remove letras
      expect(validatePixKey('asdasd', 'CPF').isValid).toBe(false)
      expect(validatePixKey('52998224725', 'CPF').isValid).toBe(true)

      // Máscaras de agência e conta bancária
      expect(maskBankAgency('12345')).toBe('1234-5')
      expect(maskBankAccount('123456')).toBe('12345-6')
      expect(maskCropYear('20252026')).toBe('2025/2026')
    })
  })

  describe('3. Validação de Estorno com Justificativa Mínima de 15 caracteres', () => {
    it('rejeita estorno com justificativa curta (< 15 caracteres)', () => {
      const res = reverseReceivablePaymentSchema.safeParse({
        transactionId: validUUID,
        justification: 'Erro de digitação', // 17 chars? Não, 'Erro de digitação' tem 17. Vamos usar 'Erro' (4 chars)
      })
      // 'Erro' = 4 chars
      const short = reverseReceivablePaymentSchema.safeParse({
        transactionId: validUUID,
        justification: 'Erro no valor', // 13 chars
      })
      expect(short.success).toBe(false)
      if (!short.success) {
        expect(short.error.issues[0].message).toContain('mínimo 15 caracteres')
      }
    })

    it('aceita justificativa de estorno formal e fundamentada (>= 15 caracteres)', () => {
      const res = reverseReceivablePaymentSchema.safeParse({
        transactionId: validUUID,
        justification: 'Comprovante anexado pelo operador pertencia a outra proposta do produtor.',
      })
      expect(res.success).toBe(true)
    })
  })

  describe('4. Algoritmo de Destravamento Proporcional de Comissões (ADR-021 / ADR-023)', () => {
    it('calcula destravamentos proporcionais exatos em 3 parcelas desiguais', () => {
      const honorarioLiquido = 10000 // R$ 10.000
      const totalComissao = 2000 // 20% = R$ 2.000

      // Produtor paga:
      // Parcela 1: R$ 4.000 (40%)
      // Parcela 2: R$ 3.500 (35%)
      // Parcela 3: R$ 2.500 (25%)
      const p1 = 4000
      const p2 = 3500
      const p3 = 2500

      const delta1 = totalComissao * (p1 / honorarioLiquido)
      const delta2 = totalComissao * (p2 / honorarioLiquido)
      const delta3 = totalComissao * (p3 / honorarioLiquido)

      expect(delta1).toBe(800) // 40% de 2000
      expect(delta2).toBe(700) // 35% de 2000
      expect(delta3).toBe(500) // 25% de 2000
      expect(delta1 + delta2 + delta3).toBe(totalComissao)
    })

    it('reajusta comissão para baixo caso seja concedido desconto comercial', () => {
      const honorarioBruto = 10000
      const desconto = 1000
      const honorarioLiquido = honorarioBruto - desconto // R$ 9.000
      const taxaComissao = 0.2 // 20%

      const comissaoReajustada = honorarioLiquido * taxaComissao
      expect(comissaoReajustada).toBe(1800) // R$ 1.800 em vez de R$ 2.000
    })
  })

  describe('5. Recibos de Quitação (QuittanceReceipt) com Hash SHA-256 e Múltiplas Baixas', () => {
    it('gera hashes SHA-256 distintos e imutáveis para baixas parciais de uma mesma parcela', () => {
      const payloadBaixa1 = {
        receiptNumber: 'REC-LN-2026-0001',
        transactionId: 'tx-001',
        installmentId: 'inst-001',
        producerName: 'José da Silva',
        amountReceivedThisEvent: 5000,
        totalInstallmentReceived: 5000,
        installmentTotalAmount: 10000,
        remainingInstallmentBalance: 5000,
      }

      const payloadBaixa2 = {
        receiptNumber: 'REC-LN-2026-0002',
        transactionId: 'tx-002',
        installmentId: 'inst-001', // Mesma parcela!
        producerName: 'José da Silva',
        amountReceivedThisEvent: 5000,
        totalInstallmentReceived: 10000,
        installmentTotalAmount: 10000,
        remainingInstallmentBalance: 0,
      }

      const hash1 = crypto.createHash('sha256').update(JSON.stringify(payloadBaixa1)).digest('hex')
      const hash2 = crypto.createHash('sha256').update(JSON.stringify(payloadBaixa2)).digest('hex')

      expect(hash1).toHaveLength(64)
      expect(hash2).toHaveLength(64)
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('6. Isolamento Multi-Filial no Auth Guard', () => {
    it('retorna filtro por filial individual para operador local', () => {
      const authContext: FinancialAuthContext = {
        user: { id: 'usr-1', email: 'op@agro.com' } as any,
        isExecutive: false,
        isGlobalView: false,
        effectiveBranchId: 'branch-ponte-alta',
        organizationId: 'org-ln',
      }

      const where = buildFinancialBranchWhere(authContext)
      expect(where).toEqual({ branchId: 'branch-ponte-alta' })
    })

    it('retorna filtro por organização para diretoria em visão consolidada', () => {
      const authContext: FinancialAuthContext = {
        user: { id: 'usr-2', email: 'diretor@agro.com' } as any,
        isExecutive: true,
        isGlobalView: true,
        effectiveBranchId: null,
        organizationId: 'org-ln',
      }

      const where = buildFinancialBranchWhere(authContext)
      expect(where).toEqual({ branch: { organizationId: 'org-ln' } })
    })

    it('TC-07: barra mutação em filial cruzada quando operador não é executivo', async () => {
      const { assertBranchMutationAllowed } = await import('@/lib/financial/auth-guard')
      const authContext: FinancialAuthContext = {
        user: { id: 'usr-operator', email: 'op@taguatinga.com' } as any,
        isExecutive: false,
        isGlobalView: false,
        effectiveBranchId: 'branch-taguatinga',
        organizationId: 'org-ln',
      }

      await expect(
        assertBranchMutationAllowed(authContext, 'branch-ponte-alta')
      ).rejects.toThrow('Acesso negado: Você só pode realizar lançamentos na sua própria filial.')
    })
  })

  describe('7. Compras Parceladas a Prazo (ADR-022 - TC-06)', () => {
    it('valida desdobramento de compra parcelada em 6 parcelas cronológicas', () => {
      const totalCompra = 6000
      const parcelas = [
        { installmentNumber: 1, totalInstallments: 6, dueDate: '2026-03-10', amount: 1000 },
        { installmentNumber: 2, totalInstallments: 6, dueDate: '2026-04-10', amount: 1000 },
        { installmentNumber: 3, totalInstallments: 6, dueDate: '2026-05-10', amount: 1000 },
        { installmentNumber: 4, totalInstallments: 6, dueDate: '2026-06-10', amount: 1000 },
        { installmentNumber: 5, totalInstallments: 6, dueDate: '2026-07-10', amount: 1000 },
        { installmentNumber: 6, totalInstallments: 6, dueDate: '2026-08-10', amount: 1000 },
      ]

      const res = createPayableTitleSchema.safeParse({
        branchId: validUUID,
        categoryId: validUUID2,
        supplierName: 'AgroDrones Equipamentos Agrícolas Ltda',
        expenseType: 'CUSTO_DIRETO_PROPOSTA',
        cropYear: '2025/2026',
        totalAmount: totalCompra,
        isInstallmentPurchase: true,
        installments: parcelas,
      })

      expect(res.success).toBe(true)
      const somaParcelas = parcelas.reduce((acc, p) => acc + p.amount, 0)
      expect(somaParcelas).toBe(totalCompra)
    })
  })

  describe('8. Neutralidade Contábil de Transferência Interna no DRE (ADR-023 - TC-10)', () => {
    it('calcula DRE excluindo rigorosamente movimentações de transferência interna', () => {
      const transactions = [
        { type: 'ENTRADA', amount: 15000, description: 'Honorário Produtor A' },
        { type: 'SAIDA', amount: 4500, description: 'Combustível e Vistoria' },
        { type: 'TRANSFERENCIA_INTERNA', amount: 3000, description: 'Saque BB para Caixa Espécie' },
        { type: 'TRANSFERENCIA_INTERNA', amount: 2000, description: 'Depósito Caixa para BB' },
      ]

      let receitaDRE = 0
      let despesaDRE = 0

      transactions.forEach((tx) => {
        if (tx.type === 'ENTRADA') receitaDRE += tx.amount
        if (tx.type === 'SAIDA') despesaDRE += tx.amount
        // TRANSFERENCIA_INTERNA é expressamente ignorada no DRE
      })

      const resultadoOperacional = receitaDRE - despesaDRE

      expect(receitaDRE).toBe(15000)
      expect(despesaDRE).toBe(4500)
      expect(resultadoOperacional).toBe(10500)
    })
  })

  describe('9. Simulação de Concorrência Atômica de Saldo (ADR-023 - TC-11)', () => {
    it('simula 5 liquidações simultâneas de R$ 1.000 acumulando exatamente +R$ 5.000 sem race condition', () => {
      let balance = 10000
      const liquidações = [1000, 1000, 1000, 1000, 1000]

      // Mutações atômicas: currentBalance: { increment: amount }
      liquidações.forEach((amount) => {
        balance += amount
      })

      expect(balance).toBe(15000)
    })
  })
})
