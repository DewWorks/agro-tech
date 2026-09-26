import React from 'react'

export function HomeDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Carregando painel inicial">
      {/* Skeleton Seção 1: Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded-lg" />
          <div className="flex items-center gap-2">
            <div className="h-4 w-40 bg-slate-200 rounded" />
            <div className="h-4 w-28 bg-slate-200 rounded-full" />
          </div>
        </div>
        <div className="h-10 w-56 bg-slate-200 rounded-xl" />
      </div>

      {/* Skeleton Seção 2: Central de Ações Rápidas */}
      <div className="space-y-3">
        <div className="h-4 w-44 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 h-28 flex flex-col justify-between"
            >
              <div className="w-10 h-10 bg-slate-200 rounded-xl" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-24 bg-slate-200 rounded" />
                <div className="h-2.5 w-32 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton Seção 3: Painel Analítico Integrado em 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 h-[460px] flex flex-col justify-between">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="h-5 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-20 bg-slate-200 rounded" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-16 bg-slate-100 rounded-xl" />
            ))}
          </div>
          <div className="h-14 bg-slate-100 rounded-xl" />
          <div className="space-y-2">
            <div className="h-14 bg-slate-50 border border-slate-100 rounded-xl" />
            <div className="h-14 bg-slate-50 border border-slate-100 rounded-xl" />
            <div className="h-14 bg-slate-50 border border-slate-100 rounded-xl" />
          </div>
        </div>

        {/* Coluna Direita */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 h-[460px] flex flex-col justify-between">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="h-5 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-20 bg-slate-200 rounded" />
          </div>
          <div className="h-20 bg-slate-100 rounded-xl" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-16 bg-slate-100 rounded-xl" />
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-14 bg-slate-50 border border-slate-100 rounded-xl" />
            <div className="h-14 bg-slate-50 border border-slate-100 rounded-xl" />
            <div className="h-14 bg-slate-50 border border-slate-100 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Skeleton Seção 4: Resumo Patrimonial */}
      <div className="space-y-3 pt-2">
        <div className="h-4 w-52 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 h-20 flex items-center gap-3.5"
            >
              <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-12 bg-slate-200 rounded" />
                <div className="h-3 w-28 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
