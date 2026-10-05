'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  BarChart3,
  ArrowDownLeft,
  ArrowUpRight,
  Users2,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TabItem {
  label: string
  href: string
  icon: React.ElementType
  exact?: boolean
}

const TABS: TabItem[] = [
  {
    label: 'Visão Geral (DRE)',
    href: '/admin/financial',
    icon: BarChart3,
    exact: true,
  },
  {
    label: 'Contas a Receber',
    href: '/admin/financial/receivables',
    icon: ArrowDownLeft,
  },
  {
    label: 'Contas a Pagar',
    href: '/admin/financial/payables',
    icon: ArrowUpRight,
  },
  {
    label: 'Parceiros & Comissões',
    href: '/admin/financial/partners',
    icon: Users2,
  },
  {
    label: 'Configurações & Caixa',
    href: '/admin/financial/settings',
    icon: SlidersHorizontal,
  },
]

export default function FinancialNavTabs({
  currentBranchId,
  branches,
  isExecutive,
}: {
  currentBranchId?: string | null
  branches?: Array<{ id: string; name: string; city: string }>
  isExecutive?: boolean
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const branchParam = searchParams.get('branchId') || currentBranchId || 'ALL'

  const buildHref = (baseHref: string) => {
    if (branchParam && branchParam !== 'ALL') {
      return `${baseHref}?branchId=${branchParam}`
    }
    return baseHref
  }

  const handleBranchChange = (newBranchId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newBranchId === 'ALL') {
      params.delete('branchId')
    } else {
      params.set('branchId', newBranchId)
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    window.location.href = `${pathname}${query}`
  }

  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Abas Superiores */}
      <nav className="flex flex-wrap items-center gap-1.5" aria-label="Navegação Financeira">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              href={buildHref(tab.href)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all',
                isActive
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-emerald-200' : 'text-slate-400')} />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Seletor de Filiais Exclusivo para Diretoria Executiva */}
      {isExecutive && branches && branches.length > 0 && (
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-500">Filial:</span>
          <select
            value={branchParam}
            onChange={(e) => handleBranchChange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs focus:border-emerald-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">🏢 Grupo LN (Consolidado)</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                📍 {b.name} ({b.city})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
