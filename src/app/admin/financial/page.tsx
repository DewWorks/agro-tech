import React, { Suspense } from 'react'
import Link from 'next/link'
import { requireFinancialAuth } from '@/lib/financial/auth-guard'
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
import FinancialDreCharts from '@/components/financial/FinancialDreCharts'
import FinancialOverviewHeaderClient from '@/components/financial/FinancialOverviewHeaderClient'
import DashboardPendingReceivablesList from '@/components/financial/DashboardPendingReceivablesList'
import FinancialOverviewLoading from './loading'
import { getCachedFinancialOverview } from '@/actions/financial/overview'

async function FinancialOverviewContent({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>
}) {
  const resolvedParams = await searchParams
  const branchId = resolvedParams.branchId || null
  const auth = await requireFinancialAuth(branchId)

  // Consulta ultra-rápida via cache em memória (< 50ms)
  const overview = await getCachedFinancialOverview(branchId || 'ALL', auth.organizationId)
  const {
    metrics,
    monthlyData,
    categoryData,
    pendingReceivables,
    exportData,
    bankAccounts,
    branches,
    categories,
    demands,
    cashTransactions,
  } = overview

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
        {/* Card 1: Carteira de Honorários (com Sincronização de Baixas Parciais) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                CARTEIRA DE HONORÁRIOS
              </span>
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              {metrics.saldoAReceberEmAberto > 0 ? (
                <>
                  <p className="text-2xl font-black text-slate-900">
                    {formatCurrency(metrics.saldoAReceberEmAberto)}
                  </p>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {metrics.percentualQuitadoFormatted}% liquidado ({formatCurrency(metrics.faturamentoRealizado)} de {formatCurrency(metrics.faturamentoPrevisto)})
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-black text-slate-900">
                    {formatCurrency(metrics.faturamentoRealizado)}
                  </p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">
                    100% liquidado ({formatCurrency(metrics.faturamentoRealizado)} de {formatCurrency(metrics.faturamentoPrevisto)})
                  </p>
                </>
              )}
            </div>

            {/* Barra de Progresso de Liquidação */}
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${metrics.percentualQuitado}%` }}
              />
            </div>
          </div>

          {/* Legenda Descritiva */}
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              {metrics.percentualQuitado === 100 ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              )}
              <span>
                {metrics.hasParcialmenteRecebido ? 'PARCIALMENTE_RECEBIDO • ' : ''}
                {metrics.percentualQuitadoFormatted}% liquidado • {metrics.titulosPendentesCount} {metrics.titulosPendentesCount === 1 ? 'título aguardando pagamento' : 'títulos aguardando pagamento'}
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
              {formatCurrency(metrics.despesasRealizadas)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Compromissos futuros de {formatCurrency(metrics.despesasPrevistas)}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-rose-700">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {formatCurrency(Math.max(0, metrics.despesasPrevistas - metrics.despesasRealizadas))} a vencer
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
                metrics.resultadoOperacional >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatCurrency(metrics.resultadoOperacional)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Entradas - Saídas no período corrente
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Saldo em Caixas: {formatCurrency(metrics.saldoTotalDisponivel)}</span>
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
              {formatCurrency(metrics.comissoesLiberadas)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Liberadas para saque imediato via PIX
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{formatCurrency(metrics.comissoesBloqueadas)} sob trava (aguardando produtor)</span>
          </div>
        </div>
      </div>

      {/* Radar de Cobranças e Títulos Pendentes */}
      <DashboardPendingReceivablesList
        pendingTitles={pendingReceivables}
        bankAccounts={bankAccounts}
      />

      {/* Seção Gráfica: Curva de Saldo Acumulado da Safra & Distribuição por Categorias */}
      <FinancialDreCharts
        monthlyData={monthlyData}
        categoryData={categoryData}
        cropYear={metrics.activeCrop}
        branchName={metrics.branchDisplayName}
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
              {formatCurrency(metrics.saldoTotalDisponivel)}
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
