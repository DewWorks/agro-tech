import React from 'react'
import { getReceivableTitles } from '@/actions/financial/receivables'
import { getBankAccounts } from '@/actions/financial/settings'
import ReceivablesTableClient from '@/components/financial/ReceivablesTableClient'
import { formatCurrency } from '@/lib/utils'
import { ArrowDownLeft, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

export const metadata = {
  title: 'Contas a Receber | AgroTech Financeiro',
  description: 'Controle de honorários de crédito rural, pacotes avulsos e liquidações declaratórias.',
}

export default async function ReceivablesPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string; status?: string; search?: string }>
}) {
  const resolvedParams = await searchParams
  const branchId = resolvedParams.branchId || null

  const [titlesRes, bankAccountsRes] = await Promise.all([
    getReceivableTitles({
      branchId,
      status: (resolvedParams.status as any) || 'ALL',
      search: resolvedParams.search,
    }),
    getBankAccounts(branchId),
  ])

  const titles = titlesRes.data || []
  const bankAccounts = bankAccountsRes.data || []

  // Métricas da tela
  let totalNet = 0
  let totalReceived = 0
  let totalOverdue = 0

  titles.forEach((t: any) => {
    const net = Number(t.netAmount) || 0
    const rec = Number(t.totalReceivedAmount) || 0
    totalNet += net
    totalReceived += rec
    if (t.status === 'EM_ATRASO') {
      totalOverdue += Math.max(0, net - rec)
    }
  })

  const openBalance = Math.max(0, totalNet - totalReceived)

  return (
    <div className="space-y-6">
      {/* Cards de Métricas de Contas a Receber */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Faturado */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Faturamento Líquido</span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {formatCurrency(totalNet)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Total gerado em honorários e pacotes</p>
        </div>

        {/* Total Liquidado */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Liquidado</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-emerald-700">
            {formatCurrency(totalReceived)}
          </div>
          <p className="mt-1 text-[11px] text-emerald-600/80">Entradas consolidadas no caixa</p>
        </div>

        {/* Saldo em Aberto */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Saldo a Receber</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-blue-900">
            {formatCurrency(openBalance)}
          </div>
          <p className="mt-1 text-[11px] text-blue-600/80">Parcelas a vencer e em cobrança</p>
        </div>

        {/* Em Atraso */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Carteira em Atraso</span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-rose-700">
            {formatCurrency(totalOverdue)}
          </div>
          <p className="mt-1 text-[11px] text-rose-600/80">Requer ação de cobrança preventiva</p>
        </div>
      </div>

      {/* Tabela Interativa de Títulos a Receber */}
      <ReceivablesTableClient
        titles={titles}
        bankAccounts={bankAccounts}
        currentBranchId={branchId}
      />
    </div>
  )
}
