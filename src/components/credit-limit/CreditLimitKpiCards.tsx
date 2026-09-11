'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CreditCard, ShieldCheck, Building2, Scale, TrendingUp } from 'lucide-react'
import { CreditLimitPortfolioKPIs } from '@/actions/credit-limit'

interface CreditLimitKpiCardsProps {
  kpis: CreditLimitPortfolioKPIs
}

export function CreditLimitKpiCards({ kpis }: CreditLimitKpiCardsProps) {
  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Volume Solicitado */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Volume Solicitado
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {formatBRL(kpis.totalRequestedLimit)}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {kpis.totalAnalyzedProperties} proposta(s) cadastrada(s)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Garantias Ofertáveis */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Garantias Ofertáveis
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {formatBRL(kpis.totalCollateralAvailable)}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              65% Imóveis + 50% Máquinas/Semoventes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Propriedades Levantadas */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Propriedades no Hub
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {kpis.totalAnalyzedProperties}
              </h3>
              <span className="text-xs font-medium text-slate-500">
                de {kpis.totalProperties} imóveis
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {kpis.compatibleCount} pré-qualificada(s)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Margem Líquida Média */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Margem Líquida Média
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <Scale className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <h3
              className={`text-2xl font-black tracking-tight ${
                kpis.averageNetMargin >= 0
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatBRL(kpis.averageNetMargin)}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Capacidade de amortização apurada
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
