'use client'

import React from 'react'
import Link from 'next/link'
import { LayoutDashboard, Calculator, FileCheck, ArrowUpRight } from 'lucide-react'

interface CreditLimitNavigationTabsProps {
  totalAnalyzed?: number
  activeTab?: 'overview' | 'simulator'
  onTabChange?: (tab: 'overview' | 'simulator') => void
  propertyId?: string
}

export function CreditLimitNavigationTabs({
  totalAnalyzed = 0,
  activeTab = 'overview',
  onTabChange,
  propertyId,
}: CreditLimitNavigationTabsProps) {
  const isOverview = activeTab === 'overview'
  const isSimulator = activeTab === 'simulator'

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-2">
        {/* Aba 1: Visão Geral & Limites */}
        {onTabChange ? (
          <button
            type="button"
            onClick={() => onTabChange('overview')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              isOverview
                ? 'bg-[#1B4D3E] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Visão Geral & Limites</span>
            {totalAnalyzed > 0 && (
              <span
                className={`ml-1 px-2 py-0.5 text-xs rounded-full font-mono ${
                  isOverview ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {totalAnalyzed}
              </span>
            )}
          </button>
        ) : (
          <Link href="/admin/credit-limit?tab=overview">
            <button
              type="button"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                isOverview
                  ? 'bg-[#1B4D3E] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Visão Geral & Limites</span>
              {totalAnalyzed > 0 && (
                <span
                  className={`ml-1 px-2 py-0.5 text-xs rounded-full font-mono ${
                    isOverview ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {totalAnalyzed}
                </span>
              )}
            </button>
          </Link>
        )}

        {/* Aba 2: Simulador de Crédito MCR (Ativado!) */}
        {onTabChange ? (
          <button
            type="button"
            onClick={() => onTabChange('simulator')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              isSimulator
                ? 'bg-[#1B4D3E] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calculator className="h-4 w-4" />
            <span>Simulador de Crédito MCR</span>
          </button>
        ) : (
          <Link
            href={`/admin/credit-limit?tab=simulator${propertyId ? `&propertyId=${propertyId}` : ''}`}
          >
            <button
              type="button"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                isSimulator
                  ? 'bg-[#1B4D3E] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Calculator className="h-4 w-4" />
              <span>Simulador de Crédito MCR</span>
            </button>
          </Link>
        )}

        {/* Aba 3: Projetos Técnicos & Propostas (Link para esteira de crédito BB) */}
        <Link href="/admin/documents/credit-projects">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <FileCheck className="h-4 w-4 text-emerald-600" />
            <span>Projetos Técnicos & Propostas</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </Link>
      </div>
    </div>
  )
}
