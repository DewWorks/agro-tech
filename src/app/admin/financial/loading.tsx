import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { MetricCardsSkeleton, TableSkeleton } from '@/components/financial/FinancialSkeletons'

export default function FinancialOverviewLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header / Ações Rápidas */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-3.5 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-44 rounded-lg" />
        </div>
      </div>

      {/* Grid de 4 Cards de Métricas Principais (DRE Executivo) */}
      <MetricCardsSkeleton count={4} />

      {/* Bloco Retangular de Resumo e Tabelas */}
      <TableSkeleton rows={6} />
    </div>
  )
}
