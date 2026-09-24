import React from 'react'
import { Skeleton } from '@/components/ui/skeletons'

export function DemandKanbanSkeleton() {
  const columns = [
    { title: 'Solicitado', border: 'border-t-slate-400', badgeClass: 'bg-slate-200' },
    { title: 'Em Execução', border: 'border-t-slate-900', badgeClass: 'bg-slate-900' },
    { title: 'Aguardando Docs', border: 'border-t-amber-400', badgeClass: 'bg-amber-100' },
    { title: 'Concluído', border: 'border-t-emerald-600', badgeClass: 'bg-emerald-100' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-150">
      {columns.map((col, idx) => (
        <div
          key={col.title}
          className={`flex flex-col rounded-xl border border-slate-200/90 bg-slate-50/70 border-t-4 ${col.border} min-h-[500px] overflow-hidden`}
        >
          {/* Header da Coluna */}
          <div className="p-3.5 border-b border-slate-200/80 bg-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded-full" />
              <span className="font-bold text-sm text-slate-700">{col.title}</span>
            </div>
            <Skeleton className="w-6 h-5 rounded-full" />
          </div>

          {/* Cards da Coluna com pulso suave */}
          <div className="p-2.5 space-y-3 flex-1 overflow-hidden">
            {Array.from({ length: idx === 0 ? 3 : idx === 1 ? 2 : 1 }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs"
              >
                {/* Top: chips */}
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-24 rounded-lg" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                {/* Título do Serviço */}
                <Skeleton className="h-4 w-3/4 rounded" />
                {/* Produtor & Fazenda */}
                <div className="space-y-1.5 pt-1">
                  <Skeleton className="h-3 w-1/2 rounded" />
                  <Skeleton className="h-3 w-2/3 rounded" />
                </div>
                {/* Barra de Progresso do Checklist */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <Skeleton className="h-2.5 w-16 rounded" />
                    <Skeleton className="h-2.5 w-8 rounded" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
                {/* Rodapé do Card */}
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <Skeleton className="h-7 w-24 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function DemandTableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden animate-in fade-in duration-150">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-4 w-32 hidden md:block" />
            <Skeleton className="h-4 w-28 hidden lg:block" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
