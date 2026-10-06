'use client'

import React, { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'
import { formatCurrency, cn } from '@/lib/utils'
import {
  TrendingUp,
  ArrowUpDown,
  PieChart as PieChartIcon,
  CalendarClock,
  Scale,
  Users2,
  Target,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type {
  CropYearMonthData,
  CategoryComparisonData,
} from '@/components/financial/FinancialDreCharts'
import type {
  FuturePayableMonthData,
  ServiceMarginData,
  PartnerRankingData,
  CropTargetData,
} from '@/actions/financial/overview'

export type SafraChartVision =
  | 'saldo_acumulado'
  | 'fluxo_mensal'
  | 'dre_categorias'
  | 'boletos_futuros'
  | 'margem_servicos'
  | 'ranking_parceiros'
  | 'metas_safra'

interface ChartVisionConfig {
  id: SafraChartVision
  label: string
  shortLabel: string
  icon: React.ElementType
  explanation: string
}

const CHART_VISIONS: ChartVisionConfig[] = [
  {
    id: 'saldo_acumulado',
    label: 'Curva de Saldo da Safra',
    shortLabel: 'Curva de Saldo',
    icon: TrendingUp,
    explanation:
      '💡 **Como Interpretar:** Demonstra a evolução do caixa acumulado da consultoria ao longo do ano agrícola. Permite prever com segurança se o faturamento concentrado no pico da safra bancária cobrirá as despesas fixas durante os meses de entressafra sem necessidade de capital de terceiros.',
  },
  {
    id: 'fluxo_mensal',
    label: 'Entradas vs. Saídas Operacionais',
    shortLabel: 'Fluxo Operacional',
    icon: ArrowUpDown,
    explanation:
      '💡 **Como Interpretar:** Confronta a movimentação real de caixa mês a mês. Barras verdes superiores às vermelhas indicam geração líquida positiva no período; barras vermelhas superiores apontam momentos de queima de reserva ou investimentos pontuais.',
  },
  {
    id: 'dre_categorias',
    label: 'Composição de Custos e Despesas',
    shortLabel: 'Centros de Custo',
    icon: PieChartIcon,
    explanation:
      '💡 **Como Interpretar:** Expõe os principais centros de custo da consultoria. Ajuda a calibrar se as despesas de deslocamento e vistorias de campo estão compatíveis com os honorários cobrados.',
  },
  {
    id: 'boletos_futuros',
    label: 'Projeção Cronológica de Compras a Prazo',
    shortLabel: 'Boletos Futuros',
    icon: CalendarClock,
    explanation:
      '💡 **Como Interpretar:** Visão antecipada das saídas financeiras já contratadas. Mostra exatamente o montante de dinheiro novo que a filial precisa gerar a cada mês para cobrir suas obrigações com folga de caixa.',
  },
  {
    id: 'margem_servicos',
    label: 'Margem Líquida por Linha de Serviço',
    shortLabel: 'Margem por Serviço',
    icon: Scale,
    explanation:
      '💡 **Como Interpretar:** Avalia qual linha de serviço gera maior rentabilidade líquida para o escritório após a dedução de taxas governamentais, cartórios e comissões.',
  },
  {
    id: 'ranking_parceiros',
    label: 'Volume de Originação e Comissões',
    shortLabel: 'Ranking Parceiros',
    icon: Users2,
    explanation:
      '💡 **Como Interpretar:** Ranking de originação comercial. Identifica os intermediadores de campo mais produtivos e a relação entre o volume aprovado no banco e as comissões pagas pela consultoria.',
  },
  {
    id: 'metas_safra',
    label: 'Termômetro da Safra (Meta vs. Realizado)',
    shortLabel: 'Termômetro da Safra',
    icon: Target,
    explanation:
      '💡 **Como Interpretar:** Mede o atingimento da meta da filial e a eficiência de cobrança, confrontando os honorários pactuados com o valor efetivamente liquidado pelos produtores.',
  },
]

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

export interface FinancialSafraChartsHubProps {
  monthlyData: CropYearMonthData[]
  categoryData: {
    receitas: CategoryComparisonData[]
    despesas: CategoryComparisonData[]
  }
  futurePayablesData?: FuturePayableMonthData[]
  serviceMarginData?: ServiceMarginData[]
  partnerRankingData?: PartnerRankingData[]
  cropTargetData?: CropTargetData
  cropYear?: string
  branchName?: string
}

export default function FinancialSafraChartsHub({
  monthlyData,
  categoryData,
  futurePayablesData = [],
  serviceMarginData = [],
  partnerRankingData = [],
  cropTargetData,
  cropYear = '2025/2026',
  branchName = 'Consolidado Grupo LN',
}: FinancialSafraChartsHubProps) {
  const [mounted, setMounted] = useState(false)
  const [activeVision, setActiveVision] = useState<SafraChartVision>('saldo_acumulado')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-[460px] w-full animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
        <div className="h-8 w-64 bg-slate-100 rounded-md" />
        <div className="h-72 w-full bg-slate-50 rounded-xl" />
        <div className="h-10 w-full bg-slate-100 rounded-lg" />
      </div>
    )
  }

  const currentVisionIndex = CHART_VISIONS.findIndex((v) => v.id === activeVision)
  const currentVisionConfig = CHART_VISIONS[currentVisionIndex >= 0 ? currentVisionIndex : 0]

  const handlePrevVision = () => {
    const nextIdx = (currentVisionIndex - 1 + CHART_VISIONS.length) % CHART_VISIONS.length
    setActiveVision(CHART_VISIONS[nextIdx].id)
  }

  const handleNextVision = () => {
    const nextIdx = (currentVisionIndex + 1) % CHART_VISIONS.length
    setActiveVision(CHART_VISIONS[nextIdx].id)
  }

  // 1. Dados Reais de Fluxo Mensal e Saldo Acumulado (12 Meses da Safra)
  const effectiveMonthlyData: CropYearMonthData[] = monthlyData

  // 2. Dados Reais para Donut de Centros de Custo (dre_categorias)
  const expenseCategories = categoryData?.despesas || []
  const totalDespesasCentros = expenseCategories.reduce((s, c) => s + c.realizado, 0)
  const pieData = expenseCategories
    .filter((c) => c.realizado > 0)
    .map((c) => ({
      name: c.categoryName,
      value: c.realizado,
      percent: totalDespesasCentros > 0 ? (c.realizado / totalDespesasCentros) * 100 : 0,
    }))

  // 3. Dados Reais para Boletos Futuros
  const effectiveFuturePayables: FuturePayableMonthData[] = futurePayablesData || []

  // 4. Dados Reais para Margem por Serviços
  const effectiveServiceMargin: ServiceMarginData[] = serviceMarginData || []

  // 5. Dados Reais para Ranking de Parceiros Comerciais
  const effectivePartnerRanking: PartnerRankingData[] = (partnerRankingData || [])
    .filter(
      (p) => (p.baseHonorarios || p.volumeFinanciado || 0) > 0 || p.comissaoPaga > 0 || p.comissaoTotal > 0
    )
    .map((p) => ({
      ...p,
      baseHonorarios: p.baseHonorarios ?? p.volumeFinanciado ?? 0,
    }))

  // 6. Dados Reais para Metas da Safra (Termômetro)
  const metaMensalBase = cropTargetData?.metaSafra ? Math.round(cropTargetData.metaSafra / 12) : 10000
  const targetDataForComposed = effectiveMonthlyData.map((m) => ({
    monthLabel: m.monthLabel,
    metaMensal: m.metaReceita || metaMensalBase,
    contratado: m.receitas,
    liquidadoCaixa: m.receitas,
  }))

  // Formatter Seguro para o Eixo Y
  const formatYAxisCurrency = (val: number) => {
    if (val === 0) return 'R$ 0'
    if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`
    if (val >= 1000) {
      const isInteger = val % 1000 === 0
      return `R$ ${(val / 1000).toFixed(isInteger ? 0 : 1)}k`
    }
    return `R$ ${val}`
  }

  // Tooltip customizado reutilizável com tipografia elegante
  const CustomGenericTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentItem = payload[0]?.payload
      return (
        <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur-xs p-3 shadow-xl text-xs min-w-[220px] space-y-1.5 z-50">
          <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-slate-400 font-mono">Safra {cropYear}</span>
          </div>
          <div className="space-y-1 pt-0.5">
            {currentItem?.volumeCreditoBancario ? (
              <div className="flex justify-between items-center gap-3 py-0.5 border-b border-slate-50">
                <span className="font-medium text-blue-700 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0 bg-blue-600" />
                  Volume de Crédito Bancário:
                </span>
                <span className="font-bold text-blue-900">
                  {formatCurrency(currentItem.volumeCreditoBancario)}
                </span>
              </div>
            ) : null}
            {payload.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center gap-3">
                <span className="font-medium text-slate-600 flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color || item.fill }}
                  />
                  {item.name}:
                </span>
                <span className="font-bold text-slate-900">
                  {typeof item.value === 'number'
                    ? item.unit === '%'
                      ? `${item.value.toFixed(1)}%`
                      : formatCurrency(item.value)
                    : item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6 transition-all duration-200">
      {/* Cabeçalho do Hub e Seletor de Visões 100% Acessível */}
      <div className="space-y-3.5 border-b border-slate-100 pb-4">
        {/* Linha 1: Título da Visão Ativa e Controles de Navegação Anterior/Próximo */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                {currentVisionConfig.label}
              </h3>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                Safra {cropYear}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {branchName} • Hub Analítico de Gestão e Inteligência Agronômica
            </p>
          </div>

          {/* Contador de Visões e Botões de Alternância Rápida */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <span className="text-[11px] font-medium text-slate-400">
              Visão <strong className="text-slate-800">{currentVisionIndex + 1}</strong> de <strong>{CHART_VISIONS.length}</strong>
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={handlePrevVision}
                className="h-7 w-7 flex items-center justify-center rounded-md text-slate-600 hover:text-emerald-950 hover:bg-white transition-colors"
                title="Visão Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextVision}
                className="h-7 w-7 flex items-center justify-center rounded-md text-slate-600 hover:text-emerald-950 hover:bg-white transition-colors"
                title="Próxima Visão"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Linha 2: Barra Completa com as 7 Pílulas (Quebra Fluida, Zero Truncamento) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {CHART_VISIONS.map((vision, idx) => {
            const Icon = vision.icon
            const isActive = activeVision === vision.id

            return (
              <button
                key={vision.id}
                onClick={() => setActiveVision(vision.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-[#113025] text-white shadow-xs ring-1 ring-emerald-900 font-bold'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                )}
                title={vision.label}
              >
                <span
                  className={cn(
                    'h-4 w-4 rounded-full text-[10px] font-black flex items-center justify-center',
                    isActive ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-200 text-slate-500'
                  )}
                >
                  {idx + 1}
                </span>
                <Icon
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    isActive ? 'text-emerald-300' : 'text-slate-500'
                  )}
                />
                <span>{vision.shortLabel}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Área Central: Renderização do Gráfico Selecionado */}
      <div className="mt-5 h-[340px] w-full">
        {/* 1. Saldo Acumulado (Curva de Saldo da Safra) */}
        {activeVision === 'saldo_acumulado' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={effectiveMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="safraEmeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxisCurrency}
              />
              <Tooltip
                content={<CustomGenericTooltip />}
                cursor={{ stroke: '#047857', strokeWidth: 1.5, strokeDasharray: '3 3' }}
              />
              <Area
                type="monotone"
                dataKey="saldoAcumulado"
                name="Saldo Acumulado em Caixa"
                stroke="#047857"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#safraEmeraldGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* 2. Fluxo Mensal (Entradas vs. Saídas Operacionais) */}
        {activeVision === 'fluxo_mensal' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={effectiveMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxisCurrency}
              />
              <Tooltip content={<CustomGenericTooltip />} cursor={{ fill: 'transparent' }} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
              />
              <Bar dataKey="receitas" name="Receitas Liquidadas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="despesas" name="Despesas Pagas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* 3. DRE Categorias (Composição de Custos e Despesas) */}
        {activeVision === 'dre_categorias' && (
          pieData.length === 0 || totalDespesasCentros === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6 border border-dashed border-slate-200 rounded-xl">
              <PieChartIcon className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">Nenhum rateio de despesas registrado</p>
              <p className="text-xs text-slate-400 mt-1">Não constam saídas financeiras computadas para esta safra.</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between h-full gap-4">
              <div className="w-full sm:w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(Number(value)), 'Valor Realizado']}
                    />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={3}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 space-y-2 pr-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Rateio de Despesas ({formatCurrency(totalDespesasCentros)})
                </p>
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="font-medium text-slate-700 truncate max-w-[180px]">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-[11px]">
                        {item.percent.toFixed(1)}%
                      </span>
                      <strong className="text-slate-900 font-bold">
                        {formatCurrency(item.value)}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* 4. Boletos Futuros (Projeção Cronológica de Compras a Prazo) */}
        {activeVision === 'boletos_futuros' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={effectiveFuturePayables}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxisCurrency}
              />
              <Tooltip content={<CustomGenericTooltip />} cursor={{ fill: 'transparent' }} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
              />
              <Bar dataKey="custosFixos" name="Custos Fixos Recorrentes" stackId="a" fill="#94a3b8" radius={[0, 0, 0, 0]} maxBarSize={36} />
              <Bar dataKey="boletosFuturos" name="Parcelas de Boletos a Pagar" stackId="a" fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* 5. Margem por Serviços (Crédito Rural vs. Pacotes Ambientais) */}
        {activeVision === 'margem_servicos' && (
          effectiveServiceMargin.length === 0 || !effectiveServiceMargin.some((s) => s.faturamento > 0 || s.custosDiretos > 0) ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6 border border-dashed border-slate-200 rounded-xl">
              <Scale className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">Nenhum honorário apropriado por serviço</p>
              <p className="text-xs text-slate-400 mt-1">A margem líquida será calculada conforme a liquidação de honorários e custos diretos.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={effectiveServiceMargin}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="service" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxisCurrency}
                />
                <Tooltip content={<CustomGenericTooltip />} cursor={{ fill: 'transparent' }} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                />
                <Bar dataKey="faturamento" name="Faturamento Bruto" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="custosDiretos" name="Custos Diretos & Comissões" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="margemLiquida" name="Margem Líquida Retida" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )
        )}

        {/* 6. Ranking de Parceiros Comerciais */}
        {activeVision === 'ranking_parceiros' && (
          effectivePartnerRanking.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6 border border-dashed border-slate-200 rounded-xl">
              <Users2 className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">Nenhum parceiro comercial com movimentação</p>
              <p className="text-xs text-slate-400 mt-1">As indicações de projetos e comissões da safra aparecerão listadas aqui.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={effectivePartnerRanking}
                margin={{ top: 10, right: 20, left: 60, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={formatYAxisCurrency}
                />
                <YAxis
                  type="category"
                  dataKey="partnerName"
                  stroke="#475569"
                  fontSize={11}
                  tickLine={false}
                  width={140}
                />
                <Tooltip content={<CustomGenericTooltip />} cursor={{ fill: 'transparent' }} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                />
                <Bar dataKey="baseHonorarios" name="Base de Faturamento (Honorários)" fill="#059669" radius={[0, 4, 4, 0]} maxBarSize={20} />
                <Bar dataKey="comissaoPaga" name="Comissão Paga ao Parceiro" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )
        )}

        {/* 7. Metas da Safra (Termômetro: Previsto vs. Faturado vs. Liquidado) */}
        {activeVision === 'metas_safra' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={targetDataForComposed}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxisCurrency}
              />
              <Tooltip content={<CustomGenericTooltip />} cursor={{ fill: 'transparent' }} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
              />
              <ReferenceLine
                y={metaMensalBase}
                label={{ value: 'Meta Média Mensal', fill: '#059669', fontSize: 10, position: 'insideTopRight' }}
                stroke="#059669"
                strokeDasharray="4 4"
              />
              <Bar dataKey="contratado" name="Honorários Contratados" fill="#93c5fd" radius={[4, 4, 0, 0]} maxBarSize={26} />
              <Line type="monotone" dataKey="liquidadoCaixa" name="Dinheiro em Caixa" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Caixa Explicativa Dinâmica com Linguagem Agronômica e Gerencial */}
      <div className="bg-emerald-50/80 border border-emerald-200/80 p-3.5 rounded-xl text-xs text-emerald-950 mt-3 flex items-start gap-2.5">
        <Sparkles className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <p className="font-normal text-emerald-900">
            {currentVisionConfig.explanation.replace('💡 **Como Interpretar:** ', '')}
          </p>
        </div>
      </div>
    </div>
  )
}
