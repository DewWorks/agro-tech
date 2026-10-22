'use client'

import React from 'react'
import Link from 'next/link'
import {
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  CircleDollarSign,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  Wallet,
  Calendar,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { CropYearMonthData } from '@/components/financial/FinancialDreCharts'

interface HomeFinancialOverviewProps {
  metrics: {
    faturamentoRealizado: number
    saldoAReceberEmAberto: number
    resultadoOperacional: number
    titulosPendentesCount?: number
  }
  monthlyData: CropYearMonthData[]
}

interface FinancialCustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: string
}

const FinancialCustomTooltip = ({ active, payload, label }: FinancialCustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200/90 bg-white/95 p-3.5 shadow-lg backdrop-blur-xs text-xs space-y-1.5 min-w-[200px]">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-100 pb-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Competência: {label}</span>
        </div>
        <div className="space-y-1 pt-0.5">
          {payload.map((entry, idx) => (
            <div key={`tooltip-${idx}`} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-600 font-medium">{entry.name}:</span>
              </div>
              <span className="font-extrabold text-slate-900 font-mono">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function HomeFinancialOverview({ metrics, monthlyData = [] }: HomeFinancialOverviewProps) {
  // Pegamos até os últimos 6 meses com movimentações ou do ciclo atual da safra
  const chartData = monthlyData.length > 6 ? monthlyData.slice(-6) : monthlyData

  const hasFinancialActivity =
    metrics.faturamentoRealizado > 0 ||
    metrics.saldoAReceberEmAberto > 0 ||
    metrics.resultadoOperacional !== 0 ||
    monthlyData.some((m) => m.receitas > 0 || m.despesas > 0)

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Cabeçalho Executivo com Link para o ERP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#05964F] flex items-center justify-center border border-emerald-200/70">
            <CircleDollarSign className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight flex items-center gap-2">
              <span>Desempenho Financeiro & Fluxo da Safra</span>
              <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                ERP Integrado
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Receitas liquidadas, honorários pendentes e resultado operacional consolidado
            </p>
          </div>
        </div>

        <Link
          href="/admin/financial"
          prefetch={true}
          className="text-xs font-semibold text-[#05964F] hover:text-[#033E20] flex items-center gap-1.5 group transition-colors self-start sm:self-auto px-3 py-1.5 rounded-lg hover:bg-emerald-50/70 border border-emerald-200/60"
        >
          <span>Abrir ERP Financeiro</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Grid de 3 Indicadores Financeiros de Rápido Acesso */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Faturamento Realizado */}
        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-[#05964F]" />
              Faturamento Realizado
            </span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
              Quitado
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
            {formatCurrency(metrics.faturamentoRealizado)}
          </div>
          <p className="text-[10px] text-slate-500">
            Total liquidado em caixa na safra atual
          </p>
        </div>

        {/* Card 2: Saldo a Receber em Aberto */}
        <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/50 to-white p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-amber-600" />
              Saldo a Receber
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
              {metrics.titulosPendentesCount ?? 0} pendentes
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
            {formatCurrency(metrics.saldoAReceberEmAberto)}
          </div>
          <p className="text-[10px] text-slate-500">
            Contratos de honorários e parcelas em aberto
          </p>
        </div>

        {/* Card 3: Resultado Operacional */}
        <div className="rounded-xl border border-slate-200/90 bg-gradient-to-br from-slate-50/60 to-white p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#05964F]" />
              Resultado Operacional
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                metrics.resultadoOperacional >= 0
                  ? 'text-emerald-800 bg-emerald-100/70'
                  : 'text-rose-800 bg-rose-100/70'
              }`}
            >
              {metrics.resultadoOperacional >= 0 ? 'Superávit' : 'Déficit'}
            </span>
          </div>
          <div
            className={`text-xl font-black font-mono tracking-tight ${
              metrics.resultadoOperacional >= 0 ? 'text-[#05964F]' : 'text-rose-600'
            }`}
          >
            {formatCurrency(metrics.resultadoOperacional)}
          </div>
          <p className="text-[10px] text-slate-500">
            Margem líquida após dedução de despesas
          </p>
        </div>
      </div>

      {/* Gráfico de Entradas vs Saídas Mensais */}
      {hasFinancialActivity && chartData.length > 0 ? (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Evolução Mensal: Receitas vs. Despesas vs. Saldo</span>
            <span className="text-[11px] text-slate-400 font-normal">
              Últimos meses da safra
            </span>
          </div>

          <div className="h-[240px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="monthLabel"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={6}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) =>
                    val >= 1000 ? `R$ ${(val / 1000).toFixed(0)}k` : `R$ ${val}`
                  }
                />
                <Tooltip content={<FinancialCustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={32}
                  iconType="circle"
                  formatter={(val) => <span className="text-[11px] text-slate-600">{val}</span>}
                />
                <Bar
                  dataKey="receitas"
                  name="Receitas Realizadas"
                  fill="#05964F"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="despesas"
                  name="Despesas Realizadas"
                  fill="#EF4444"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Line
                  type="monotone"
                  dataKey="resultado"
                  name="Resultado Líquido"
                  stroke="#FFAC00"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#FFAC00', strokeWidth: 1.5, stroke: '#FFFFFF' }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center space-y-2">
          <p className="text-xs font-semibold text-slate-700">
            Nenhuma movimentação financeira lançada nesta filial até o momento.
          </p>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            Cadastre honorários, faturamentos de projetos ou contas a pagar no ERP Financeiro para visualizar gráficos dinâmicos de fluxo de caixa aqui.
          </p>
          <div className="pt-1">
            <Link
              href="/admin/financial"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#05964F] hover:underline"
            >
              <span>Ir para o ERP Financeiro</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomeFinancialOverview
