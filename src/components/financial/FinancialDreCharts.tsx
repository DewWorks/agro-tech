'use client'

import React, { useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, BarChart3, LineChart, Calendar, ShieldCheck } from 'lucide-react'

export interface CropYearMonthData {
  monthKey: string
  monthLabel: string
  receitas: number
  despesas: number
  resultado: number
  saldoAcumulado: number
  metaReceita: number
}

export interface CategoryComparisonData {
  categoryName: string
  code: string
  type: 'RECEITA' | 'DESPESA'
  realizado: number
}

interface FinancialDreChartsProps {
  monthlyData: CropYearMonthData[]
  categoryData: {
    receitas: CategoryComparisonData[]
    despesas: CategoryComparisonData[]
  }
  cropYear?: string
  branchName?: string
}

export default function FinancialDreCharts({
  monthlyData,
  categoryData,
  cropYear = '2025/2026',
  branchName = 'Consolidado Grupo LN',
}: FinancialDreChartsProps) {
  const [activeChart, setActiveChart] = useState<'CURVE' | 'CATEGORIES'>('CURVE')

  // Tooltip customizado para a curva de saldo acumulado
  const CustomCurveTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CropYearMonthData
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg text-xs space-y-1.5 min-w-[210px]">
          <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-slate-400 font-mono">Safra {cropYear}</span>
          </div>

          <div className="space-y-1 pt-0.5">
            <div className="flex justify-between text-emerald-700">
              <span className="font-semibold">Receitas do Mês:</span>
              <span className="font-bold">{formatCurrency(data.receitas)}</span>
            </div>

            <div className="flex justify-between text-rose-700">
              <span className="font-semibold">Despesas do Mês:</span>
              <span className="font-bold">{formatCurrency(data.despesas)}</span>
            </div>

            <div className="flex justify-between text-slate-700 border-t border-slate-100 pt-1">
              <span className="font-semibold">Resultado Mensal:</span>
              <span
                className={`font-black ${
                  data.resultado >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {formatCurrency(data.resultado)}
              </span>
            </div>

            <div className="flex justify-between text-slate-900 border-t border-slate-100 pt-1 font-bold">
              <span>Saldo Acumulado:</span>
              <span className="text-emerald-900 font-black">
                {formatCurrency(data.saldoAcumulado)}
              </span>
            </div>

            {data.metaReceita > 0 && (
              <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                <span>Meta Faturamento:</span>
                <span>{formatCurrency(data.metaReceita)}</span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  // Tooltip customizado para categorias
  const CustomCategoryTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs space-y-1">
          <div className="font-bold text-slate-800">
            [{data.code}] {data.categoryName}
          </div>
          <div className="text-slate-500">
            Tipo: {data.type === 'RECEITA' ? 'Receita Operacional' : 'Custo / Despesa'}
          </div>
          <div className="text-sm font-black text-slate-900 pt-1">
            Total Realizado: {formatCurrency(data.realizado)}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
      {/* Topo do Card de Gráficos */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-900">
              Análise Econômico-Financeira da Safra {cropYear}
            </h3>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
              {branchName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Curva temporal de sobrevivência na entressafra e distribuição por centro de resultados.
          </p>
        </div>

        {/* Toggle dos Gráficos */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setActiveChart('CURVE')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
              activeChart === 'CURVE'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LineChart className="h-3.5 w-3.5" />
            Curva de Saldo Acumulado
          </button>
          <button
            type="button"
            onClick={() => setActiveChart('CATEGORIES')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
              activeChart === 'CATEGORIES'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Receitas vs. Custos por Categoria
          </button>
        </div>
      </div>

      {/* GRÁFICO 1: CURVA CONTÍNUA DE SALDO ACUMULADO */}
      {activeChart === 'CURVE' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-800" />
                <span className="font-semibold text-slate-700">Saldo Acumulado (Curva de Caixa)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span>Receitas do Mês</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span>Despesas do Mês</span>
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              * Mutações atômicas consolidadas (excluídas transferências de tesouraria)
            </span>
          </div>

          <div className="h-[320px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4D3E" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1B4D3E" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="monthLabel"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) =>
                    val >= 1000 ? `R$ ${(val / 1000).toFixed(0)}k` : `R$ ${val}`
                  }
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip content={<CustomCurveTooltip />} />

                {/* Barras de Entradas e Saídas Mensais */}
                <Bar dataKey="receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={24} />

                {/* Curva de Saldo Acumulado Contínuo */}
                <Area
                  type="monotone"
                  dataKey="saldoAcumulado"
                  stroke="#1B4D3E"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSaldo)"
                  dot={{ stroke: '#1B4D3E', strokeWidth: 2, r: 3, fill: '#ffffff' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* GRÁFICO 2: RECEITAS VS CUSTOS POR CATEGORIA */}
      {activeChart === 'CATEGORIES' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 pt-2">
          {/* Categorias de Receitas */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Composição de Receitas da Safra
            </h4>

            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData.receitas}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="categoryName"
                    tick={{ fill: '#334155', fontSize: 10, fontWeight: 700 }}
                    width={110}
                  />
                  <Tooltip content={<CustomCategoryTooltip />} />
                  <Bar dataKey="realizado" fill="#1B4D3E" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Categorias de Despesas */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-600" />
              Composição de Custos Diretos e Fixos
            </h4>

            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData.despesas}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="categoryName"
                    tick={{ fill: '#334155', fontSize: 10, fontWeight: 700 }}
                    width={110}
                  />
                  <Tooltip content={<CustomCategoryTooltip />} />
                  <Bar dataKey="realizado" fill="#e11d48" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
