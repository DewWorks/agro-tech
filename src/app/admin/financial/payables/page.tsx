import React from 'react'
import prisma from '@/lib/prisma'
import { getPayableTitles } from '@/actions/financial/payables'
import { getBankAccounts } from '@/actions/financial/settings'
import { requireFinancialAuth } from '@/lib/financial/auth-guard'
import PayablesTableClient from '@/components/financial/PayablesTableClient'
import { formatCurrency } from '@/lib/utils'
import { ArrowUpRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

export const metadata = {
  title: 'Contas a Pagar & Boletos Futuros | AgroTech Financeiro',
  description: 'Apropriação de despesas de projetos, custos fixos e compras parceladas a prazo.',
}

export default async function PayablesPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string; status?: string; expenseType?: string; search?: string }>
}) {
  const resolvedParams = await searchParams
  const branchId = resolvedParams.branchId || null
  const auth = await requireFinancialAuth(branchId)

  const [payablesRes, bankAccountsRes, categories, demands, branches] = await Promise.all([
    getPayableTitles({
      branchId,
      status: (resolvedParams.status as any) || 'ALL',
      expenseType: (resolvedParams.expenseType as any) || 'ALL',
      search: resolvedParams.search,
    }),
    getBankAccounts(branchId),
    prisma.financialCategory.findMany({
      where: {
        organizationId: auth.organizationId,
        type: 'DESPESA',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { code: 'asc' },
    }),
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
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.branch.findMany({
      where: {
        organizationId: auth.organizationId,
        isActive: true,
        ...(auth.isGlobalView ? {} : { id: auth.effectiveBranchId! }),
      },
      select: {
        id: true,
        name: true,
        city: true,
      },
      orderBy: { name: 'asc' },
    }),
  ])

  const payables = payablesRes.data || []
  const bankAccounts = bankAccountsRes.data || []

  // Métricas
  let totalCommitted = 0
  let totalPaid = 0
  let totalOverdue = 0

  payables.forEach((p: any) => {
    const total = Number(p.totalAmount) || 0
    const paid = Number(p.paidAmount) || 0
    totalCommitted += total
    totalPaid += paid
    if (p.status === 'EM_ATRASO') {
      totalOverdue += Math.max(0, total - paid)
    }
  })

  const openBalance = Math.max(0, totalCommitted - totalPaid)

  return (
    <div className="space-y-6">
      {/* Cards de Métricas de Contas a Pagar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Comprometido */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Comprometido</span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {formatCurrency(totalCommitted)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Despesas e boletos apropriados</p>
        </div>

        {/* Total Pago */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Desembolsado</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-emerald-700">
            {formatCurrency(totalPaid)}
          </div>
          <p className="mt-1 text-[11px] text-emerald-600/80">Saídas liquidadas do caixa</p>
        </div>

        {/* Saldo a Liquidar */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Obrigações a Vencer</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-amber-900">
            {formatCurrency(openBalance)}
          </div>
          <p className="mt-1 text-[11px] text-amber-700/80">Boletos e compromissos futuros</p>
        </div>

        {/* Obrigações em Atraso */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Boletos em Atraso</span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-rose-700">
            {formatCurrency(totalOverdue)}
          </div>
          <p className="mt-1 text-[11px] text-rose-600/80">Requer quitação imediata de juros</p>
        </div>
      </div>

      {/* Título de Seção com Subtítulo Explicativo */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Obrigações a Pagar & Despesas da Safra
        </h2>
        <p className="text-xs text-slate-500">
          Controle as saídas operacionais, apropriação de despesas de projetos, agendamento de boletos futuros e quitações com débito em conta corrente.
        </p>
      </div>

      {/* Tabela Interativa de Títulos a Pagar */}
      <PayablesTableClient
        payables={payables}
        bankAccounts={bankAccounts}
        categories={categories}
        demands={demands}
        branches={branches}
        currentBranchId={branchId}
      />
    </div>
  )
}
