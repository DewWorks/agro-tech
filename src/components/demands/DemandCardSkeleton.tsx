'use client'

import React from 'react'
import { Loader2, ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeletons'
import { cn } from '@/lib/utils'

interface DemandCardSkeletonProps {
  serviceTitle?: string
  producerName?: string
  targetStatusLabel?: string
  className?: string
}

export function DemandCardSkeleton({
  serviceTitle,
  producerName,
  targetStatusLabel,
  className,
}: DemandCardSkeletonProps) {
  return (
    <div
      className={cn(
        'relative bg-white/95 rounded-xl border-2 border-dashed border-slate-400 shadow-md p-4 flex flex-col justify-between overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-all select-none',
        className
      )}
    >
      {/* Faixa superior com Badge de Serviço e Indicador de Processamento */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {serviceTitle ? (
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80 truncate max-w-[180px]">
            {serviceTitle}
          </span>
        ) : (
          <Skeleton className="h-5 w-28 rounded-md bg-slate-100" />
        )}

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-semibold animate-pulse shrink-0">
          <Loader2 className="w-3 h-3 animate-spin text-slate-300" />
          <span>Movendo...</span>
        </div>
      </div>

      {/* Identificação do Produtor / Propriedade */}
      <div className="space-y-1.5 mb-3">
        {producerName ? (
          <div className="text-sm font-bold text-slate-800 truncate flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span className="truncate">{producerName}</span>
          </div>
        ) : (
          <Skeleton className="h-5 w-36 rounded-md" />
        )}
        <Skeleton className="h-3.5 w-24 rounded-md" />
      </div>

      {/* Linhas de Metadados simuladas */}
      <div className="pt-2 border-t border-slate-100 space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Barra de Progresso do GED Simulada */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-2.5 w-14" />
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-400/80 animate-pulse rounded-full w-3/4" />
        </div>
      </div>

      {/* Rodapé com Indicador de Conclusão da Ação */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
          <span>{targetStatusLabel || 'Atualizando etapa'}</span>
          <ArrowRight className="w-3 h-3 text-emerald-600 animate-pulse" />
        </span>
      </div>
    </div>
  )
}
