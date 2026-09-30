'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { formatBRL } from '@/lib/utils/formatters'
import { SimulatorKpiMetricsProps } from '@/types/credit-limit.types'

export function SimulatorKpiMetrics({
  amortization,
  amortizationSystem,
  icsd,
  ltv,
}: SimulatorKpiMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      {/* Parcela Anual */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Parcela Anual do Serviço da Dívida
        </span>
        <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
          {formatBRL(amortization.annualDebtService)}
        </div>
        <span className="text-[10.5px] text-slate-500 mt-1 block">
          {amortizationSystem === 'PRICE'
            ? 'Prestação constante'
            : '1ª Parcela (Decrescente)'}
        </span>
      </div>

      {/* Semáforo ICSD (Trava >= 1.20) */}
      <div
        className={`p-4 rounded-xl border shadow-2xs ${
          icsd.isApproved
            ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
            : 'bg-rose-50/70 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Índice ICSD (Corte ≥ 1,20)
          </span>
          <Badge
            className={`text-[9px] font-bold px-1.5 py-0 ${
              icsd.isApproved
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {icsd.isApproved ? 'Aprovado' : 'Reprovado'}
          </Badge>
        </div>
        <div
          className={`text-xl font-bold font-mono ${
            icsd.isApproved
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-rose-700 dark:text-rose-400'
          }`}
        >
          {icsd.icsdValue.toFixed(2)}x
        </div>
        <span className="text-[10.5px] text-slate-500 mt-1 block">
          CP de {formatBRL(icsd.paymentCapacity)}
        </span>
      </div>

      {/* Cobertura de Garantia (LTV) */}
      <div
        className={`p-4 rounded-xl border shadow-2xs ${
          ltv.isApproved
            ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
            : 'bg-rose-50/70 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Cobertura de Garantia (LTV)
          </span>
          <Badge
            className={`text-[9px] font-bold px-1.5 py-0 ${
              ltv.isApproved
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {ltv.isApproved ? 'Adequado' : 'Insuficiente'}
          </Badge>
        </div>
        <div
          className={`text-xl font-bold font-mono ${
            ltv.isApproved
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-rose-700 dark:text-rose-400'
          }`}
        >
          {ltv.coverageRatioPercent.toFixed(1)}%
        </div>
        <span className="text-[10.5px] text-slate-500 mt-1 block">
          Garantias: {formatBRL(ltv.totalAcceptableCollateral)}
        </span>
      </div>
    </div>
  )
}
