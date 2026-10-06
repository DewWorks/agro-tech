import { unstable_cache } from 'next/cache'
import prisma from '@/lib/prisma'
import { serializeDecimals } from '@/lib/utils'
import type { CropYearMonthData, CategoryComparisonData } from '@/components/financial/FinancialDreCharts'
import type { DreExportData } from '@/components/financial/FinancialExportModal'
import type { DashboardPendingReceivable } from '@/components/financial/DashboardPendingReceivablesList'

export interface FinancialOverviewData {
  metrics: {
    faturamentoBruto: number
    descontosComerciais: number
    faturamentoPrevisto: number
    faturamentoRealizado: number
    saldoAReceberEmAberto: number
    percentualQuitado: number
    percentualQuitadoFormatted: string
    titulosPendentesCount: number
    hasParcialmenteRecebido: boolean
    despesasPrevistas: number
    despesasRealizadas: number
    custosDiretosRealizados: number
    despesasFixasRealizadas: number
    margemContribuicao: number
    resultadoOperacional: number
    saldoTotalDisponivel: number
    comissoesBloqueadas: number
    comissoesLiberadas: number
    comissoesPagas: number
    monthlyTarget: number
    activeCrop: string
    branchDisplayName: string
  }
  monthlyData: CropYearMonthData[]
  categoryData: {
    receitas: CategoryComparisonData[]
    despesas: CategoryComparisonData[]
  }
  pendingReceivables: DashboardPendingReceivable[]
  exportData: DreExportData
  bankAccounts: Array<{
    id: string
    bankName: string
    agency: string | null
    accountNumber: string | null
    accountType: string
    currentBalance: number
  }>
  branches: Array<{
    id: string
    name: string
    city: string
  }>
  categories: Array<{
    id: string
    name: string
    code: string
  }>
  demands: Array<{
    id: string
    serviceType: string
    producer: { name: string }
  }>
  cashTransactions: Array<{
    id: string
    type: string
    amount: number
    description: string
    transactionDate: string
    bankAccount: { bankName: string }
  }>
}

/**
 * Consulta e consolidação canônica dos dados do Dashboard Financeiro (DRE).
 */
export async function fetchFinancialOverview(
  branchId?: string | null,
  organizationId?: string
): Promise<FinancialOverviewData> {
  const isGlobalView = !branchId || branchId === 'ALL'
  const effectiveBranchId = isGlobalView ? null : branchId

  // Cláusula branchWhere compatível com isolamento multi-tenant
  const branchWhere = isGlobalView
    ? organizationId
      ? { branch: { organizationId } }
      : {}
    : { branchId: effectiveBranchId! }

  // Paralelização de Queries no Banco de Dados
  const [
    receivables,
    payables,
    bankAccountsRaw,
    commissions,
    cashTransactionsRaw,
    branchSettings,
    categoriesRaw,
    branchesRaw,
    demandsRaw,
    pendingReceivablesRaw,
  ] = await Promise.all([
    // 1. Totalizadores de Recebíveis
    prisma.receivableTitle.findMany({
      where: {
        ...branchWhere,
        status: { not: 'CANCELADO' },
      },
      select: {
        grossAmount: true,
        discountAmount: true,
        netAmount: true,
        totalReceivedAmount: true,
        status: true,
        category: { select: { id: true, name: true, code: true } },
      },
    }),

    // 2. Totalizadores de Pagáveis
    prisma.payableTitle.findMany({
      where: {
        ...branchWhere,
        status: { not: 'CANCELADO' },
      },
      select: {
        totalAmount: true,
        paidAmount: true,
        status: true,
        expenseType: true,
        category: { select: { id: true, name: true, code: true } },
      },
    }),

    // 3. Saldo em Contas Bancárias e Caixas
    prisma.bankAccount.findMany({
      where: {
        ...branchWhere,
        isActive: true,
      },
      select: {
        id: true,
        bankName: true,
        agency: true,
        accountNumber: true,
        accountType: true,
        currentBalance: true,
      },
      orderBy: { bankName: 'asc' },
    }),

    // 4. Total de Comissões de Parceiros
    prisma.partnerCommission.findMany({
      where: {
        ...branchWhere,
        status: { not: 'CANCELADO' },
      },
      select: {
        totalCommissionAmount: true,
        releasedAmount: true,
        paidAmount: true,
        status: true,
      },
    }),

    // 5. Transações do Livro-Caixa (exclui estornadas e transferências internas conforme requisito)
    prisma.cashTransaction.findMany({
      where: {
        ...branchWhere,
        isReversed: false,
        type: { not: 'TRANSFERENCIA_INTERNA' },
      },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        transactionDate: true,
        bankAccount: { select: { bankName: true } },
        receivableInstallment: {
          select: {
            receivableTitle: {
              select: {
                documentNumber: true,
                producer: { select: { name: true } },
                category: { select: { name: true, code: true } },
              },
            },
          },
        },
        payableInstallment: {
          select: {
            payableTitle: {
              select: {
                documentNumber: true,
                supplierName: true,
                category: { select: { name: true, code: true } },
              },
            },
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
    }),

    // 6. Configurações da Filial (Metas)
    effectiveBranchId
      ? prisma.branch
          .findUnique({
            where: { id: effectiveBranchId },
            select: { financialBranchSettings: true },
          })
          .then((b) => b?.financialBranchSettings ?? null)
      : Promise.resolve(null),

    // 7. Categorias para Modais Rápidos
    prisma.financialCategory.findMany({
      orderBy: { code: 'asc' },
      select: { id: true, name: true, code: true },
    }),

    // 8. Filiais
    prisma.branch.findMany({
      where: {
        ...(organizationId ? { organizationId } : {}),
        isActive: true,
        ...(effectiveBranchId ? { id: effectiveBranchId } : {}),
      },
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    }),

    // 9. Demandas para Apropriação Direta
    prisma.serviceDemand.findMany({
      where: {
        branch: {
          ...(organizationId ? { organizationId } : {}),
          ...(effectiveBranchId ? { id: effectiveBranchId } : {}),
        },
      },
      select: {
        id: true,
        serviceType: true,
        producer: { select: { name: true } },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    }),

    // 10. Top 5 Títulos a Receber Pendentes (Para o Radar de Cobrança da Home)
    prisma.receivableTitle.findMany({
      where: {
        ...branchWhere,
        status: { in: ['PENDENTE', 'PARCIALMENTE_RECEBIDO', 'EM_ATRASO'] },
      },
      select: {
        id: true,
        documentNumber: true,
        serviceSubtype: true,
        originType: true,
        grossAmount: true,
        netAmount: true,
        totalReceivedAmount: true,
        status: true,
        producer: { select: { id: true, name: true, document: true } },
        partner: { select: { id: true, name: true } },
        installments: {
          where: { status: { in: ['A_VENCER', 'VENCE_HOJE', 'EM_ATRASO'] } },
          orderBy: { dueDate: 'asc' },
          select: {
            id: true,
            installmentNumber: true,
            totalInstallments: true,
            dueDate: true,
            amount: true,
            receivedAmount: true,
            status: true,
          },
        },
        commissions: {
          select: {
            id: true,
            totalCommissionAmount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  // Processamento de métricas em memória
  let faturamentoBruto = 0
  let descontosComerciais = 0
  let faturamentoPrevisto = 0
  let faturamentoRealizado = 0
  let titulosPendentesCount = 0
  let hasParcialmenteRecebido = false

  for (const r of receivables) {
    faturamentoBruto += Number(r.grossAmount)
    descontosComerciais += Number(r.discountAmount)
    faturamentoPrevisto += Number(r.netAmount)
    faturamentoRealizado += Number(r.totalReceivedAmount)
    if (r.status !== 'QUITADO') {
      titulosPendentesCount++
    }
    if (r.status === 'PARCIALMENTE_RECEBIDO') {
      hasParcialmenteRecebido = true
    }
  }

  const saldoAReceberEmAberto = Math.max(0, faturamentoPrevisto - faturamentoRealizado)
  const percentualQuitadoNum =
    faturamentoPrevisto > 0
      ? (faturamentoRealizado / faturamentoPrevisto) * 100
      : 100
  const percentualQuitado = Math.min(100, Math.round(percentualQuitadoNum))
  const percentualQuitadoFormatted = percentualQuitadoNum.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

  let despesasPrevistas = 0
  let despesasRealizadas = 0
  let custosDiretosRealizados = 0
  let despesasFixasRealizadas = 0

  for (const p of payables) {
    const tot = Number(p.totalAmount)
    const paid = Number(p.paidAmount)
    despesasPrevistas += tot
    despesasRealizadas += paid
    if (p.expenseType === 'CUSTO_DIRETO_PROPOSTA' || p.expenseType === 'COMISSAO_PARCEIRO') {
      custosDiretosRealizados += paid
    } else {
      despesasFixasRealizadas += paid
    }
  }

  const margemContribuicao = faturamentoRealizado - custosDiretosRealizados
  const resultadoOperacional = faturamentoRealizado - despesasRealizadas

  let saldoTotalDisponivel = 0
  for (const b of bankAccountsRaw) {
    saldoTotalDisponivel += Number(b.currentBalance)
  }

  let comissoesBloqueadas = 0
  let comissoesLiberadas = 0
  let comissoesPagas = 0

  for (const c of commissions) {
    const total = Number(c.totalCommissionAmount)
    const rel = Number(c.releasedAmount)
    const paid = Number(c.paidAmount)
    comissoesBloqueadas += Math.max(0, total - rel)
    comissoesLiberadas += Math.max(0, rel - paid)
    comissoesPagas += paid
  }

  const monthlyTarget = Number(branchSettings?.monthlyRevenueTarget || 60000.0)
  const activeCrop = branchSettings?.activeCropYear || '2025/2026'

  // Série Temporal de Meses contemplando o ciclo da safra e o mês corrente (Out/26 em diante)
  const monthNames = [
    { key: '2025-10', label: 'Out/25' },
    { key: '2025-11', label: 'Nov/25' },
    { key: '2025-12', label: 'Dez/25' },
    { key: '2026-01', label: 'Jan/26' },
    { key: '2026-02', label: 'Fev/26' },
    { key: '2026-03', label: 'Mar/26' },
    { key: '2026-04', label: 'Abr/26' },
    { key: '2026-05', label: 'Mai/26' },
    { key: '2026-06', label: 'Jun/26' },
    { key: '2026-07', label: 'Jul/26' },
    { key: '2026-08', label: 'Ago/26' },
    { key: '2026-09', label: 'Set/26' },
    { key: '2026-10', label: 'Out/26' },
    { key: '2026-11', label: 'Nov/26' },
    { key: '2026-12', label: 'Dez/26' },
  ]

  let runningCumulative = 0
  const monthlyData: CropYearMonthData[] = monthNames.map((m) => {
    let rec = 0
    let desp = 0

    cashTransactionsRaw.forEach((tx) => {
      const txDate = new Date(tx.transactionDate)
      const txMonth = txDate.toISOString().slice(0, 7)
      if (txMonth === m.key) {
        if (tx.type === 'ENTRADA') rec += Number(tx.amount)
        if (tx.type === 'SAIDA') desp += Number(tx.amount)
      }
    })

    const netMonth = rec - desp
    runningCumulative += netMonth

    return {
      monthKey: m.key,
      monthLabel: m.label,
      receitas: rec,
      despesas: desp,
      resultado: netMonth,
      saldoAcumulado: runningCumulative,
      metaReceita: monthlyTarget,
    }
  })

  // Agregação por Categorias
  const receitasCatMap = new Map<string, { code: string; name: string; total: number }>()
  const despesasCatMap = new Map<string, { code: string; name: string; total: number }>()

  cashTransactionsRaw.forEach((tx) => {
    const val = Number(tx.amount)
    if (tx.type === 'ENTRADA') {
      const cat = tx.receivableInstallment?.receivableTitle?.category
      const catName = cat?.name || 'Honorários e Serviços Técnicos'
      const catCode = cat?.code || '1.1.01'
      const prev = receitasCatMap.get(catName) || { code: catCode, name: catName, total: 0 }
      prev.total += val
      receitasCatMap.set(catName, prev)
    } else if (tx.type === 'SAIDA') {
      const cat = tx.payableInstallment?.payableTitle?.category
      const catName = cat?.name || 'Custos Operacionais Gerais'
      const catCode = cat?.code || '2.2.01'
      const prev = despesasCatMap.get(catName) || { code: catCode, name: catName, total: 0 }
      prev.total += val
      despesasCatMap.set(catName, prev)
    }
  })

  const categoryData = {
    receitas: Array.from(receitasCatMap.values()).map((c) => ({
      categoryName: c.name,
      code: c.code,
      type: 'RECEITA' as const,
      realizado: c.total,
    })),
    despesas: Array.from(despesasCatMap.values()).map((c) => ({
      categoryName: c.name,
      code: c.code,
      type: 'DESPESA' as const,
      realizado: c.total,
    })),
  }

  if (categoryData.receitas.length === 0) {
    categoryData.receitas = [
      { categoryName: 'Honorários de Crédito', code: '1.1.01', type: 'RECEITA', realizado: faturamentoRealizado },
      { categoryName: 'Pacotes CAR & AUI', code: '1.2.01', type: 'RECEITA', realizado: 0 },
    ]
  }
  if (categoryData.despesas.length === 0) {
    categoryData.despesas = [
      { categoryName: 'Custos Diretos Projetos', code: '2.1.01', type: 'DESPESA', realizado: custosDiretosRealizados },
      { categoryName: 'Despesas Fixas Filial', code: '2.2.01', type: 'DESPESA', realizado: despesasFixasRealizadas },
    ]
  }

  const branchDisplayName = isGlobalView
    ? 'Consolidado Grupo LN'
    : `Filial ${effectiveBranchId?.slice(0, 8) || 'Regional'}`

  const pendingReceivables: DashboardPendingReceivable[] = pendingReceivablesRaw.map((r) => ({
    id: r.id,
    documentNumber: r.documentNumber,
    serviceSubtype: r.serviceSubtype,
    originType: r.originType,
    grossAmount: Number(r.grossAmount),
    netAmount: Number(r.netAmount),
    totalReceivedAmount: Number(r.totalReceivedAmount),
    status: r.status,
    producer: {
      id: r.producer.id,
      name: r.producer.name,
      document: r.producer.document,
    },
    partner: r.partner ? { id: r.partner.id, name: r.partner.name } : null,
    installments: r.installments.map((inst) => ({
      id: inst.id,
      installmentNumber: inst.installmentNumber,
      totalInstallments: inst.totalInstallments,
      dueDate: inst.dueDate,
      amount: Number(inst.amount),
      receivedAmount: Number(inst.receivedAmount),
      status: inst.status,
    })),
    commissions: r.commissions.map((c) => ({
      id: c.id,
      totalCommissionAmount: Number(c.totalCommissionAmount),
      status: c.status,
    })),
  }))

  const bankAccounts = bankAccountsRaw.map((b) => ({
    id: b.id,
    bankName: b.bankName,
    agency: b.agency,
    accountNumber: b.accountNumber,
    accountType: b.accountType,
    currentBalance: Number(b.currentBalance),
  }))

  const exportData: DreExportData = {
    branchName: branchDisplayName,
    cropYear: activeCrop,
    organizationName: 'LN CONSULTORIA E PROJETOS RURAIS',
    cnpj: null,
    generatedAt: new Date().toISOString(),
    dre: {
      receitaBruta: faturamentoBruto,
      descontos: descontosComerciais,
      receitaLiquida: faturamentoPrevisto,
      custosDiretos: custosDiretosRealizados,
      margemContribuicao,
      despesasFixas: despesasFixasRealizadas,
      resultadoOperacional,
    },
    bankBalances: bankAccountsRaw.map((b) => ({
      bankName: b.bankName,
      accountType: b.accountType,
      balance: Number(b.currentBalance),
    })),
    transactions: cashTransactionsRaw.map((tx) => {
      const recTitle = tx.receivableInstallment?.receivableTitle
      const payTitle = tx.payableInstallment?.payableTitle
      const txDate = new Date(tx.transactionDate)
      return {
        date: txDate.toISOString().slice(0, 10),
        type: tx.type,
        categoryCode: recTitle?.category?.code || payTitle?.category?.code || 'N/A',
        categoryName: recTitle?.category?.name || payTitle?.category?.name || 'Tesouraria',
        documentNumber: recTitle?.documentNumber || payTitle?.documentNumber || 'S/N',
        entityName: recTitle?.producer?.name || payTitle?.supplierName || tx.description,
        costCenter: branchDisplayName,
        bankName: tx.bankAccount.bankName,
        amount: Number(tx.amount),
      }
    }),
  }

  const branches = branchesRaw.map((b) => ({
    id: b.id,
    name: b.name,
    city: b.city,
  }))

  const categories = categoriesRaw.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
  }))

  const demands = demandsRaw.map((d) => ({
    id: d.id,
    serviceType: d.serviceType,
    producer: { name: d.producer.name },
  }))

  const cashTransactions = cashTransactionsRaw.map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: Number(tx.amount),
    description: tx.description,
    transactionDate: tx.transactionDate.toISOString(),
    bankAccount: { bankName: tx.bankAccount.bankName },
  }))

  return serializeDecimals({
    metrics: {
      faturamentoBruto,
      descontosComerciais,
      faturamentoPrevisto,
      faturamentoRealizado,
      saldoAReceberEmAberto,
      percentualQuitado,
      percentualQuitadoFormatted,
      titulosPendentesCount,
      hasParcialmenteRecebido,
      despesasPrevistas,
      despesasRealizadas,
      custosDiretosRealizados,
      despesasFixasRealizadas,
      margemContribuicao,
      resultadoOperacional,
      saldoTotalDisponivel,
      comissoesBloqueadas,
      comissoesLiberadas,
      comissoesPagas,
      monthlyTarget,
      activeCrop,
      branchDisplayName,
    },
    monthlyData,
    categoryData,
    pendingReceivables,
    exportData,
    bankAccounts,
    branches,
    categories,
    demands,
    cashTransactions,
  })
}

/**
 * Versão cacheada em memória de alta performance (< 50ms) via unstable_cache com tag 'financial-data'.
 */
export const getCachedFinancialOverview = unstable_cache(
  async (branchId: string = 'ALL', organizationId?: string) =>
    fetchFinancialOverview(branchId, organizationId),
  ['financial-overview-data'],
  { tags: ['financial-data'], revalidate: 3600 }
)
