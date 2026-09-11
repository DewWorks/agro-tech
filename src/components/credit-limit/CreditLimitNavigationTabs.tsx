'use client'

import React from 'react'
import Link from 'next/link'
import { LayoutDashboard, Calculator, FileCheck, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface CreditLimitNavigationTabsProps {
  totalAnalyzed?: number
}

export function CreditLimitNavigationTabs({ totalAnalyzed = 0 }: CreditLimitNavigationTabsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-2">
        {/* Aba 1: Ativa */}
        <Link href="/admin/credit-limit">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[#1B4D3E] text-white shadow-sm transition-all"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Visão Geral & Limites</span>
            {totalAnalyzed > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full font-mono bg-white/20 text-white">
                {totalAnalyzed}
              </span>
            )}
          </button>
        </Link>

        {/* Aba 2: Simulador (Em breve) */}
        <div className="relative group">
          <button
            type="button"
            disabled
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-slate-400 dark:text-slate-500 bg-slate-100/80 dark:bg-slate-800/40 cursor-not-allowed border border-dashed border-slate-200 dark:border-slate-700"
          >
            <Calculator className="h-4 w-4" />
            <span>Simulador de Crédito MCR</span>
            <Badge variant="outline" className="text-[9px] uppercase font-bold text-slate-500 border-slate-300">
              Em breve
            </Badge>
          </button>
        </div>

        {/* Aba 3: Dossiês e Emissão (Link para projetos BB) */}
        <Link href="/admin/documents/credit-projects">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <FileCheck className="h-4 w-4 text-emerald-600" />
            <span>Dossiês & Emissão Bancária</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </Link>
      </div>
    </div>
  )
}
