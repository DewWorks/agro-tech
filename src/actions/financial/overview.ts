import { unstable_cache } from 'next/cache'
import prisma from '@/lib/prisma'
import { serializeDecimals } from '@/lib/utils'
import { resolveOperators, type OperatorInfo } from '@/lib/financial/audit-operator'
import type { CropYearMonthData, CategoryComparisonData } from '@/components/financial/FinancialDreCharts'
import type { DreExportData } from '@/components/financial/FinancialExportModal'
import type { DashboardPendingReceivable } from '@/components/financial/DashboardPendingReceivablesList'

export interface FuturePayableMonthData {
  monthKey: string
  monthLabel: string
  custosFixos: number
  boletosFuturos: number
  total: number
}

export interface ServiceMarginData {
  service: string
  faturamento: number
  custosDiretos: number
  margemLiquida: number
  margemPercent: number
}

export interface PartnerRankingData {
  partnerName: string
  volumeFinanciado: number
  volumeCreditoBancario?: number
  baseHonorarios?: number
  comissaoPaga: number
  comissaoTotal: number
}

export interface CropTargetData {
  metaSafra: number
  faturadoContratado: number
  liquidadoCaixa: number
  percentualAtingido: number
}

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
  futurePayablesData: FuturePayableMonthData[]
  serviceMarginData: ServiceMarginData[]
  partnerRankingData: PartnerRankingData[]
  cropTargetData: CropTargetData
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
    operator?: OperatorInfo
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
    futurePayablesRaw,
    commercialPartnersRaw,
  ] = await Promise.all([
    // 1. Totalizadores de Recebíveis
    prisma.receivableTitle.findMany({
      where: {
        ...branchWhere,
        status: { not: 'CANCELADO' },
      },
      select: {
        originType: true,
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
        initialBalance: true,
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
        isReversed: true,
        transactionDate: true,
        operatorId: true,
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
                expenseType: true,
                category: { select: { name: true, code: true, isDirectProjectCost: true } },
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

    // 11. Boletos e Compras a Prazo Futuras
    prisma.payableInstallment.findMany({
      where: {
        payableTitle: {
          ...branchWhere,
          status: { not: 'CANCELADO' },
        },
        status: { in: ['A_VENCER', 'EM_ATRASO'] },
      },
      select: {
        amount: true,
        paidAmount: true,
        dueDate: true,
        payableTitle: {
          select: { expenseType: true },
        },
      },
    }),

    // 12. Ranking de Parceiros Comerciais
    prisma.commercialPartner.findMany({
      where: {
        ...branchWhere,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        commissions: {
          where: { status: { not: 'CANCELADO' } },
          select: {
            calculationBasisAmount: true,
            totalCommissionAmount: true,
            releasedAmount: true,
            paidAmount: true,
            receivableTitle: {
              select: {
                financedAmount: true,
                grossAmount: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
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

  // Safra ativa: utiliza a configurada na filial ou deriva do ciclo atual (Outubro/2026 = Safra 2026/2027)
  const now = new Date()
  const currentCalYear = now.getFullYear()
  const derivedSafraStart = now.getMonth() >= 9 ? currentCalYear : currentCalYear - 1
  const defaultSafraYear = `${derivedSafraStart}/${derivedSafraStart + 1}`

  const activeCrop =
    branchSettings?.activeCropYear && branchSettings.activeCropYear !== '2025/2026'
      ? branchSettings.activeCropYear
      : defaultSafraYear

  const [safraStartStr, safraEndStr] = activeCrop.split('/')
  const safraStartYear = parseInt(safraStartStr, 10) || derivedSafraStart
  const safraEndYear = parseInt(safraEndStr, 10) || safraStartYear + 1

  // 12 Meses exatos do ciclo da safra: Outubro (Ano 1) a Setembro (Ano 2)
  const monthNames = [
    { key: `${safraStartYear}-10`, label: `Out/${String(safraStartYear).slice(2)}` },
    { key: `${safraStartYear}-11`, label: `Nov/${String(safraStartYear).slice(2)}` },
    { key: `${safraStartYear}-12`, label: `Dez/${String(safraStartYear).slice(2)}` },
    { key: `${safraEndYear}-01`, label: `Jan/${String(safraEndYear).slice(2)}` },
    { key: `${safraEndYear}-02`, label: `Fev/${String(safraEndYear).slice(2)}` },
    { key: `${safraEndYear}-03`, label: `Mar/${String(safraEndYear).slice(2)}` },
    { key: `${safraEndYear}-04`, label: `Abr/${String(safraEndYear).slice(2)}` },
    { key: `${safraEndYear}-05`, label: `Mai/${String(safraEndYear).slice(2)}` },
    { key: `${safraEndYear}-06`, label: `Jun/${String(safraEndYear).slice(2)}` },
    { key: `${safraEndYear}-07`, label: `Jul/${String(safraEndYear).slice(2)}` },
    { key: `${safraEndYear}-08`, label: `Ago/${String(safraEndYear).slice(2)}` },
    { key: `${safraEndYear}-09`, label: `Set/${String(safraEndYear).slice(2)}` },
  ]

  const totalInitialBalance = bankAccountsRaw.reduce((sum, b) => sum + Number(b.initialBalance || 0), 0)
  let runningCumulative = totalInitialBalance
  const monthlyData: CropYearMonthData[] = monthNames.map((m) => {
    let rec = 0
    let desp = 0

    cashTransactionsRaw.forEach((tx) => {
      if (tx.isReversed) return
      const txDate = new Date(tx.transactionDate)
      const txYear = txDate.getUTCFullYear()
      const txMonthNum = String(txDate.getUTCMonth() + 1).padStart(2, '0')
      const txMonth = `${txYear}-${txMonthNum}`
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

  if (categoryData.receitas.length === 0 && faturamentoRealizado > 0) {
    categoryData.receitas = [
      { categoryName: 'Honorários e Serviços Técnicos', code: '1.1.01', type: 'RECEITA', realizado: faturamentoRealizado },
    ]
  }
  if (categoryData.despesas.length === 0 && despesasRealizadas > 0) {
    categoryData.despesas = [
      { categoryName: 'Custos e Despesas Operacionais', code: '2.1.01', type: 'DESPESA', realizado: despesasRealizadas },
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

  // 4. Projeção Cronológica de Compras a Prazo (Próximos 6 meses)
  const futurePayablesMap = new Map<string, { label: string; boletos: number }>()
  const monthNamesPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  
  const currentDate = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const key = `${y}-${m}`
    const label = `${monthNamesPt[d.getMonth()]}/${String(y).slice(2)}`
    futurePayablesMap.set(key, { label, boletos: 0 })
  }

  for (const inst of futurePayablesRaw) {
    const d = new Date(inst.dueDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (futurePayablesMap.has(key)) {
      const remaining = Math.max(0, Number(inst.amount) - Number(inst.paidAmount))
      futurePayablesMap.get(key)!.boletos += remaining
    }
  }

  const futurePayablesData: FuturePayableMonthData[] = Array.from(futurePayablesMap.entries()).map(([monthKey, val]) => {
    return {
      monthKey,
      monthLabel: val.label,
      custosFixos: despesasFixasRealizadas,
      boletosFuturos: Math.round(val.boletos * 100) / 100,
      total: Math.round((despesasFixasRealizadas + val.boletos) * 100) / 100,
    }
  })

  // 5. Margem Líquida por Linha de Serviço: Crédito Rural vs. Pacotes Ambientais (Dados Reais)
  let creditoFaturamento = 0
  let creditoCustos = 0
  let ambientalFaturamento = 0
  let ambientalCustos = 0

  for (const r of receivables) {
    const val = Number(r.grossAmount)
    const isCredito = r.originType === 'ESTEIRA_CREDITO' || !r.category?.code?.startsWith('REC-02')
    if (isCredito) {
      creditoFaturamento += val
    } else {
      ambientalFaturamento += val
    }
  }

  for (const tx of cashTransactionsRaw) {
    if (tx.type === 'SAIDA' && !tx.isReversed) {
      const isDirect =
        tx.payableInstallment?.payableTitle?.category?.isDirectProjectCost ||
        tx.payableInstallment?.payableTitle?.expenseType === 'COMISSAO_PARCEIRO'
      if (isDirect) {
        creditoCustos += Number(tx.amount)
      } else {
        ambientalCustos += Number(tx.amount)
      }
    }
  }

  const creditoMargem = Math.max(0, creditoFaturamento - creditoCustos)
  const ambientalMargem = Math.max(0, ambientalFaturamento - ambientalCustos)

  const serviceMarginData: ServiceMarginData[] = [
    {
      service: 'Crédito Rural Bancário',
      faturamento: creditoFaturamento,
      custosDiretos: creditoCustos,
      margemLiquida: creditoMargem,
      margemPercent: creditoFaturamento > 0 ? Math.round((creditoMargem / creditoFaturamento) * 1000) / 10 : 0,
    },
    {
      service: 'Pacotes Ambientais (CAR/AUI)',
      faturamento: ambientalFaturamento,
      custosDiretos: ambientalCustos,
      margemLiquida: ambientalMargem,
      margemPercent: ambientalFaturamento > 0 ? Math.round((ambientalMargem / ambientalFaturamento) * 1000) / 10 : 0,
    },
  ]

  // 6. Ranking de Parceiros Comerciais (Base de Honorários vs. Volume de Crédito vs. Comissão Paga)
  const partnerRankingData: PartnerRankingData[] = commercialPartnersRaw.map((p) => {
    let vol = 0
    let creditoBancario = 0
    let paid = 0
    let totalComm = 0
    for (const c of p.commissions) {
      vol += Number(c.calculationBasisAmount)
      paid += Number(c.paidAmount)
      totalComm += Number(c.totalCommissionAmount)
      if (c.receivableTitle?.financedAmount) {
        creditoBancario += Number(c.receivableTitle.financedAmount)
      }
    }
    return {
      partnerName: p.name,
      volumeFinanciado: vol,
      volumeCreditoBancario: creditoBancario > 0 ? creditoBancario : undefined,
      baseHonorarios: vol,
      comissaoPaga: paid,
      comissaoTotal: totalComm,
    }
  }).sort((a, b) => (b.baseHonorarios || b.volumeFinanciado) - (a.baseHonorarios || a.volumeFinanciado))

  // 7. Termômetro da Safra (Previsto vs. Faturado vs. Liquidado)
  const metaSafra = monthlyTarget > 0 ? monthlyTarget * 12 : 120000
  const cropTargetData: CropTargetData = {
    metaSafra,
    faturadoContratado: faturamentoBruto,
    liquidadoCaixa: faturamentoRealizado,
    percentualAtingido: metaSafra > 0 ? Math.round((faturamentoRealizado / metaSafra) * 1000) / 10 : 0,
  }

  // Resolução de operadores para trilha de auditoria e lançamentos recentes
  const operatorIds = cashTransactionsRaw.map((tx) => tx.operatorId).filter(Boolean)
  const operatorsMap = await resolveOperators(operatorIds)

  const cashTransactions = cashTransactionsRaw.map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: Number(tx.amount),
    description: tx.description,
    transactionDate: tx.transactionDate.toISOString(),
    bankAccount: { bankName: tx.bankAccount.bankName },
    operator: operatorsMap.get(tx.operatorId) || {
      id: tx.operatorId,
      name: 'Operador Financeiro',
      email: 'financeiro@agrotech.com',
      avatarUrl: null,
    },
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
    futurePayablesData,
    serviceMarginData,
    partnerRankingData,
    cropTargetData,
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
  ['financial-overview-data-v6'],
  { tags: ['financial-data'], revalidate: 3600 }
)
