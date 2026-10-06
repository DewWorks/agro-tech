import { PrismaClient, Prisma } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function reconcileFinancialBalances() {
  console.log('🔄 Iniciando Reconciliação Financeira Estrita (Reset de Dados de Teste)...')

  // 1. Localiza o Título a Receber FAT-2026-0001
  let receivableTitle = await prisma.receivableTitle.findFirst({
    where: {
      documentNumber: 'FAT-2026-0001',
    },
    include: {
      installments: true,
      commissions: true,
      branch: true,
    },
  })

  if (!receivableTitle) {
    receivableTitle = await prisma.receivableTitle.findFirst({
      include: {
        installments: true,
        commissions: true,
        branch: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  if (!receivableTitle) {
    console.error('❌ Nenhum título a receber encontrado no banco de dados para reconciliação.')
    process.exit(1)
  }

  const branchId = receivableTitle.branchId
  console.log(`📄 Título a Receber Localizado: ${receivableTitle.documentNumber} na filial ${receivableTitle.branch.name} (${branchId})`)

  // 2. Localiza a conta bancária Sicredi da MESMA filial do título
  const sicrediAccount = await prisma.bankAccount.findFirst({
    where: {
      branchId,
      OR: [
        { bankCode: '748' },
        { bankName: { contains: 'Sicredi', mode: 'insensitive' } },
      ],
    },
  })

  if (!sicrediAccount) {
    console.error(`❌ Conta bancária Sicredi não encontrada na filial ${branchId}.`)
    process.exit(1)
  }

  console.log(`🏦 Conta Sicredi localizada: ${sicrediAccount.bankName} (ID: ${sicrediAccount.id})`)
  console.log(`   Saldo acumulado anterior em conta: R$ ${Number(sicrediAccount.currentBalance).toFixed(2)}`)

  // 3. Normaliza o Título a Receber para R$ 8.500,00 100% quitado
  const validGross = new Prisma.Decimal(8500)
  await prisma.receivableTitle.update({
    where: { id: receivableTitle.id },
    data: {
      grossAmount: validGross,
      discountAmount: new Prisma.Decimal(0),
      netAmount: validGross,
      totalReceivedAmount: validGross,
      status: 'QUITADO',
    },
  })

  // Atualiza parcela 1 para R$ 8.500,00 quitada no Sicredi
  let primaryRecInstallment = receivableTitle.installments[0]
  if (primaryRecInstallment) {
    primaryRecInstallment = await prisma.receivableInstallment.update({
      where: { id: primaryRecInstallment.id },
      data: {
        amount: validGross,
        receivedAmount: validGross,
        status: 'QUITADO',
        bankAccountId: sicrediAccount.id,
        receivedAt: new Date(),
      },
    })
  } else {
    primaryRecInstallment = await prisma.receivableInstallment.create({
      data: {
        receivableTitleId: receivableTitle.id,
        installmentNumber: 1,
        totalInstallments: 1,
        dueDate: new Date(),
        amount: validGross,
        receivedAmount: validGross,
        status: 'QUITADO',
        bankAccountId: sicrediAccount.id,
        receivedAt: new Date(),
      },
    })
  }

  // Remove parcelas extras duplicadas do título se houver
  if (receivableTitle.installments.length > 1) {
    const extraIds = receivableTitle.installments.slice(1).map((i) => i.id)
    await prisma.cashTransaction.deleteMany({
      where: { receivableInstallmentId: { in: extraIds } },
    })
    await prisma.receivableInstallment.deleteMany({
      where: { id: { in: extraIds } },
    })
  }

  // 4. Localiza ou atualiza o Parceiro Comercial Agro Cerrado
  let partner = await prisma.commercialPartner.findFirst({
    where: {
      branchId,
      name: { contains: 'Agro Cerrado', mode: 'insensitive' },
    },
  })

  if (!partner) {
    partner = await prisma.commercialPartner.findFirst({
      where: { branchId },
    })
  }

  const commissionAmount = new Prisma.Decimal(1700) // 20% de R$ 8.500 = R$ 1.700

  // 5. Normaliza a Comissão do Parceiro: Total R$ 1.700, Liberado R$ 1.700, Pago R$ 1.700 (Status: PAGO)
  let commission = await prisma.partnerCommission.findFirst({
    where: {
      receivableTitleId: receivableTitle.id,
    },
  })

  if (commission) {
    commission = await prisma.partnerCommission.update({
      where: { id: commission.id },
      data: {
        partnerId: partner?.id || commission.partnerId,
        calculationBasisAmount: validGross,
        commissionPercent: new Prisma.Decimal(20.0),
        totalCommissionAmount: commissionAmount,
        releasedAmount: commissionAmount,
        paidAmount: commissionAmount,
        status: 'PAGO',
      },
    })
  } else if (partner) {
    commission = await prisma.partnerCommission.create({
      data: {
        branchId,
        partnerId: partner.id,
        receivableTitleId: receivableTitle.id,
        receivableInstallmentId: primaryRecInstallment.id,
        calculationBasisAmount: validGross,
        commissionPercent: new Prisma.Decimal(20.0),
        totalCommissionAmount: commissionAmount,
        releasedAmount: commissionAmount,
        paidAmount: commissionAmount,
        status: 'PAGO',
      },
    })
  }

  console.log(`🤝 Comissão do Parceiro reconciliada: Total R$ 1.700 | Liberado R$ 1.700 | Pago R$ 1.700 (Status: PAGO)`)

  // 6. Localiza ou cria a Categoria de Despesa de Comissões
  let commCategory = await prisma.financialCategory.findFirst({
    where: {
      organizationId: receivableTitle.branch.organizationId,
      type: 'DESPESA',
      name: { contains: 'Comiss', mode: 'insensitive' },
    },
  })

  if (!commCategory) {
    commCategory = await prisma.financialCategory.findFirst({
      where: { organizationId: receivableTitle.branch.organizationId, type: 'DESPESA' },
    })
  }

  // 7. Limpa títulos a pagar duplicados de testes anteriores de comissão nesta filial
  const oldPayables = await prisma.payableTitle.findMany({
    where: {
      branchId,
      expenseType: 'COMISSAO_PARCEIRO',
    },
    include: { installments: true },
  })

  for (const op of oldPayables) {
    const instIds = op.installments.map((i) => i.id)
    await prisma.cashTransaction.deleteMany({
      where: { payableInstallmentId: { in: instIds } },
    })
    await prisma.payableInstallment.deleteMany({
      where: { id: { in: instIds } },
    })
  }
  await prisma.payableTitle.deleteMany({
    where: {
      branchId,
      expenseType: 'COMISSAO_PARCEIRO',
    },
  })

  // Cria 1 único Título a Pagar canônico de R$ 1.700,00 100% PAGO
  const payableTitle = await prisma.payableTitle.create({
    data: {
      branchId,
      categoryId: commCategory?.id || '',
      partnerCommissionId: commission?.id,
      supplierName: partner?.name || 'Parceiro Comercial Agro Cerrado',
      supplierDocument: partner?.document || '33.444.555/0001-22',
      documentNumber: 'COM-REC-LN-2026-0001',
      expenseType: 'COMISSAO_PARCEIRO',
      cropYear: receivableTitle.cropYear,
      totalAmount: commissionAmount,
      paidAmount: commissionAmount,
      status: 'PAGO',
      notes: 'Repasse integral de comissão de 20% sobre o título FAT-2026-0001.',
    },
  })

  const primaryPayInstallment = await prisma.payableInstallment.create({
    data: {
      payableTitleId: payableTitle.id,
      installmentNumber: 1,
      totalInstallments: 1,
      dueDate: new Date(),
      amount: commissionAmount,
      paidAmount: commissionAmount,
      status: 'QUITADO',
      bankAccountId: sicrediAccount.id,
      paidAt: new Date(),
    },
  })

  // 8. Limpeza de CashTransaction do Sicredi (Remove os lançamentos duplicados de testes que somaram 16.300)
  const deletedTx = await prisma.cashTransaction.deleteMany({
    where: {
      bankAccountId: sicrediAccount.id,
    },
  })
  console.log(`🧹 Removidas ${deletedTx.count} movimentações antigas/repetidas da conta Sicredi.`)

  // Cria as 2 movimentações canônicas estritas do livro-caixa:
  // 1. Entrada de R$ 8.500,00
  const entryTx = await prisma.cashTransaction.create({
    data: {
      branchId,
      bankAccountId: sicrediAccount.id,
      type: 'ENTRADA',
      amount: validGross,
      description: `Liquidação integral de honorários - ${receivableTitle.documentNumber} (${receivableTitle.serviceSubtype || 'Projeto de Custeio'})`,
      receivableInstallmentId: primaryRecInstallment.id,
      operatorId: 'sys-reconcile',
      transactionDate: new Date(),
    },
  })

  // 2. Saída de R$ 1.700,00
  const exitTx = await prisma.cashTransaction.create({
    data: {
      branchId,
      bankAccountId: sicrediAccount.id,
      type: 'SAIDA',
      amount: commissionAmount,
      description: `Repasse de comissão via PIX - ${partner?.name || 'Parceiro Comercial Agro Cerrado'}`,
      payableInstallmentId: primaryPayInstallment.id,
      operatorId: 'sys-reconcile',
      transactionDate: new Date(),
    },
  })

  console.log(`✅ Registrada Entrada Válida: +R$ ${Number(entryTx.amount).toFixed(2)} (${entryTx.description})`)
  console.log(`✅ Registrada Saída Válida:   -R$ ${Number(exitTx.amount).toFixed(2)} (${exitTx.description})`)

  // 9. Atualiza o saldo bancário da conta Sicredi para exatamente R$ 6.800,00
  const correctBalance = validGross.sub(commissionAmount) // 8500 - 1700 = 6800
  const updatedSicredi = await prisma.bankAccount.update({
    where: { id: sicrediAccount.id },
    data: {
      initialBalance: new Prisma.Decimal(0),
      currentBalance: correctBalance,
    },
  })

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`🎉 RECONCILIAÇÃO CONCLUÍDA COM SUCESSO!`)
  console.log(`   Conta: ${updatedSicredi.bankName}`)
  console.log(`   Entradas Reais:  R$ 8.500,00`)
  console.log(`   Saídas Reais:    R$ 1.700,00`)
  console.log(`   Saldo Conciliado: R$ ${Number(updatedSicredi.currentBalance).toFixed(2)}`)
  console.log(`   Comissões Pagas:  R$ 1.700,00 | Liberado Pendente: R$ 0,00`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

reconcileFinancialBalances()
  .catch((err) => {
    console.error('❌ Erro durante a reconciliação:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
