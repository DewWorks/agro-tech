import React, { Suspense } from 'react'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { requireFinancialAuth, buildFinancialBranchWhere } from '@/lib/financial/auth-guard'
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Wallet,
  Users2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import FinancialDreCharts, { type CropYearMonthData } from '@/components/financial/FinancialDreCharts'
import FinancialOverviewHeaderClient from '@/components/financial/FinancialOverviewHeaderClient'
import { DreExportData } from '@/components/financial/FinancialExportModal'
import DashboardPendingReceivablesList from '@/components/financial/DashboardPendingReceivablesList'
import FinancialOverviewLoading from './loading'

async function FinancialOverviewContent({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>
}) {
  const resolvedParams = await searchParams
  const branchId = resolvedParams.branchId || null
  const auth = await requireFinancialAuth(branchId)

  const branchWhere = buildFinancialBranchWhere(auth)

  // Paralelização de Queries no Banco de Dados (Eliminação de Waterfall Prisma)
  const [
    receivables,
    payables,
    bankAccounts,
    commissions,
    cashTransactions,
    branchSettings,
    categories,
    branches,
    demands,
    pendingReceivables,
  ] = await Promise.all([
    // 1. Totalizadores de Recebíveis (Projeção Estrita)
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

    // 2. Totalizadores de Pagáveis (Projeção Estrita)
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

    // 5. Transações do Livro-Caixa (Projeção Estrita)
    prisma.cashTransaction.findMany({
      where: {
        ...branchWhere,
        isReversed: false,
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
    auth.effectiveBranchId
      ? prisma.branch
          .findUnique({
            where: { id: auth.effectiveBranchId },
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
        organizationId: auth.organizationId,
        isActive: true,
        ...(auth.isGlobalView ? {} : { id: auth.effectiveBranchId! }),
      },
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    }),

    // 9. Demandas para Apropriação Direta
    prisma.serviceDemand.findMany({
      where: {
        branch: {
          organizationId: auth.organizationId,
          ...(auth.isGlobalView ? {} : { id: auth.effectiveBranchId! }),
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

  // Processamento síncrono em memória das métricas
  let faturamentoBruto = 0
  let descontosComerciais = 0
  let faturamentoPrevisto = 0
  let faturamentoRealizado = 0
  let titulosPendentesCount = 0
  for (const r of receivables) {
    faturamentoBruto += Number(r.grossAmount)
    descontosComerciais += Number(r.discountAmount)
    faturamentoPrevisto += Number(r.netAmount)
    faturamentoRealizado += Number(r.totalReceivedAmount)
    if (r.status !== 'QUITADO') {
      titulosPendentesCount++
    }
  }

  const saldoAReceberEmAberto = Math.max(0, faturamentoPrevisto - faturamentoRealizado)
  const percentualQuitado =
    faturamentoPrevisto > 0
      ? Math.min(100, Math.round((faturamentoRealizado / faturamentoPrevisto) * 100))
      : 100

  const pendingReceivablesMapped = pendingReceivables.map((r) => ({
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
  for (const b of bankAccounts) {
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

  // 8. Construção da Série Temporal de 12 Meses da Safra (Out/25 a Set/26)
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
  ]

  let runningCumulative = 0
  const monthlyData: CropYearMonthData[] = monthNames.map((m) => {
    let rec = 0
    let desp = 0

    cashTransactions.forEach((tx) => {
      const txMonth = tx.transactionDate.toISOString().slice(0, 7)
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

  // 9. Agregação por Categorias
  const receitasCatMap = new Map<string, { code: string; name: string; total: number }>()
  const despesasCatMap = new Map<string, { code: string; name: string; total: number }>()

  cashTransactions.forEach((tx) => {
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

  // Se não houver transações categorizadas ainda, injeta categorias padrão com 0
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

  // 10. Estrutura para Exportação Contábil
  const branchDisplayName = auth.isGlobalView
    ? 'Consolidado Grupo LN'
    : `Filial ${auth.user.branchId || 'Regional'}`

  const exportData: DreExportData = {
    branchName: branchDisplayName,
    cropYear: activeCrop,
    organizationName: 'LN CONSULTORIA E PROJETOS RURAIS',
    cnpj: null,
    generatedAt: new Date().toISOString(),
    dre: {
      receitaBruta: faturamentoBruto || faturamentoPrevisto,
      descontos: descontosComerciais,
      receitaLiquida: faturamentoRealizado,
      custosDiretos: custosDiretosRealizados,
      margemContribuicao,
      despesasFixas: despesasFixasRealizadas,
      resultadoOperacional,
    },
    bankBalances: bankAccounts.map((b) => ({
      bankName: b.bankName,
      accountType: b.accountType,
      balance: Number(b.currentBalance),
    })),
    transactions: cashTransactions.map((tx) => {
      const recTitle = tx.receivableInstallment?.receivableTitle
      const payTitle = tx.payableInstallment?.payableTitle

      return {
        date: tx.transactionDate.toISOString().slice(0, 10),
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

  return (
    <div className="space-y-6">
      {/* Barra de Ações Rápidas & Exportação Contábil */}
      <FinancialOverviewHeaderClient
        exportData={exportData}
        bankAccounts={bankAccounts}
        branches={branches}
        categories={categories}
        demands={demands}
        currentBranchId={branchId}
      />

      {/* Grid de Cards de Métricas Principais (DRE Executivo) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Carteira de Honorários & Faturamento */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Carteira de Honorários & Faturamento
              </span>
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              {faturamentoRealizado === 0 && saldoAReceberEmAberto > 0 ? (
                <>
                  <p className="text-2xl font-black text-slate-900">
                    {formatCurrency(saldoAReceberEmAberto)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatCurrency(faturamentoRealizado)} liquidados de {formatCurrency(faturamentoPrevisto)} previstos
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-black text-slate-900">
                    {formatCurrency(faturamentoRealizado)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatCurrency(saldoAReceberEmAberto)} a receber (Total previsto: {formatCurrency(faturamentoPrevisto)})
                  </p>
                </>
              )}
            </div>

            {/* Barra de Progresso de Liquidação */}
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${percentualQuitado}%` }}
              />
            </div>
          </div>

          {/* Legenda Descritiva */}
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              {percentualQuitado === 100 ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              )}
              <span>
                {percentualQuitado}% quitado • {titulosPendentesCount} {titulosPendentesCount === 1 ? 'título aguardando pagamento' : 'títulos aguardando pagamento'}
              </span>
            </div>
            <Link
              href="/admin/financial/receivables"
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 hover:underline"
            >
              Cobrança →
            </Link>
          </div>
        </div>

        {/* Card 2: Despesas Pagas vs Comprometidas */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Despesas Pagas
            </span>
            <div className="rounded-lg bg-rose-100 p-2 text-rose-800">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">
              {formatCurrency(despesasRealizadas)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Compromissos futuros de {formatCurrency(despesasPrevistas)}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-rose-700">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {formatCurrency(Math.max(0, despesasPrevistas - despesasRealizadas))} a vencer
            </span>
          </div>
        </div>

        {/* Card 3: Resultado Operacional Líquido */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Resultado Líquido (DRE)
            </span>
            <div className="rounded-lg bg-blue-100 p-2 text-blue-800">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p
              className={`text-2xl font-black ${
                resultadoOperacional >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatCurrency(resultadoOperacional)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Entradas - Saídas no período corrente
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Saldo em Caixas: {formatCurrency(saldoTotalDisponivel)}</span>
          </div>
        </div>

        {/* Card 4: Trava de Comissões de Parceiros */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Comissões de Parceiros
            </span>
            <div className="rounded-lg bg-amber-100 p-2 text-amber-800">
              <Users2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">
              {formatCurrency(comissoesLiberadas)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Liberadas para saque imediato via PIX
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{formatCurrency(comissoesBloqueadas)} sob trava (aguardando produtor)</span>
          </div>
        </div>
      </div>

      {/* Radar de Cobranças e Títulos Pendentes */}
      <DashboardPendingReceivablesList
        pendingTitles={pendingReceivablesMapped}
        bankAccounts={bankAccounts}
      />

      {/* Seção Gráfica: Curva de Saldo Acumulado da Safra & Distribuição por Categorias */}
      <FinancialDreCharts
        monthlyData={monthlyData}
        categoryData={categoryData}
        cropYear={activeCrop}
        branchName={branchDisplayName}
      />

      {/* Seção Inferior: Últimos Lançamentos do Livro-Caixa e Saldos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Livro-Caixa Recente */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Últimos Lançamentos de Tesouraria</h3>
              <p className="text-xs text-slate-500">Histórico cronológico de movimentações atômicas</p>
            </div>
            <Link
              href="/admin/financial/settings"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              Ver Extrato Completo →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {cashTransactions.slice(0, 8).length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                Nenhuma movimentação de caixa registrada até o momento.
              </p>
            ) : (
              cashTransactions.slice(0, 8).map((tx) => {
                const isEntrada = tx.type === 'ENTRADA'
                const isSaida = tx.type === 'SAIDA'
                const isTransfer = tx.type === 'TRANSFERENCIA_INTERNA'

                return (
                  <div key={tx.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-lg p-2 ${
                          isEntrada
                            ? 'bg-emerald-50 text-emerald-700'
                            : isSaida
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {isEntrada ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : isSaida ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <Wallet className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{tx.description}</p>
                        <p className="text-[10px] text-slate-400">
                          {tx.bankAccount.bankName} •{' '}
                          {new Date(tx.transactionDate).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(tx.transactionDate).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-xs font-black ${
                          isEntrada
                            ? 'text-emerald-700'
                            : isSaida
                            ? 'text-rose-700'
                            : 'text-blue-700'
                        }`}
                      >
                        {isEntrada ? '+' : isSaida ? '-' : '⇄'}{' '}
                        {formatCurrency(Number(tx.amount))}
                      </p>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {tx.type}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Contas Bancárias e Caixas Físicos */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Saldos de Tesouraria</h3>
            <span className="text-xs font-semibold text-slate-500">
              {bankAccounts.length} conta(s)
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {bankAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">{account.bankName}</p>
                  <p className="text-[10px] font-medium text-slate-400">
                    {account.accountType === 'CAIXA_ESPECIE'
                      ? 'Caixa Físico em Espécie'
                      : 'Conta Corrente Bancária'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-900">
                    {formatCurrency(Number(account.currentBalance))}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 p-3 text-center">
            <p className="text-[11px] font-semibold text-emerald-800">
              Total Líquido Disponível
            </p>
            <p className="text-lg font-black text-emerald-900 mt-0.5">
              {formatCurrency(saldoTotalDisponivel)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FinancialOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>
}) {
  return (
    <Suspense fallback={<FinancialOverviewLoading />}>
      <FinancialOverviewContent searchParams={searchParams} />
    </Suspense>
  )
}

