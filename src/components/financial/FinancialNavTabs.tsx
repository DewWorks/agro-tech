'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import {
  BarChart3,
  ArrowDownLeft,
  ArrowUpRight,
  Users2,
  SlidersHorizontal,
  Building2,
  MapPin,
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function FinancialNavTabs({
  currentBranchId,
  branches,
  isExecutive,
}: {
  currentBranchId?: string | null
  branches?: Array<{ id: string; name: string; city: string }>
  isExecutive?: boolean
}) {
  const router = useRouter()
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
    router.push(`${pathname}${query}`)
  }

  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Abas Superiores com Prefetch Ativo e Transição Instantânea */}
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
              prefetch={true}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors duration-150',
                isActive
                  ? 'bg-[#113025] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-emerald-300' : 'text-slate-400')} />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Seletor de Filiais Exclusivo para Diretoria Executiva */}
      {isExecutive && branches && branches.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filial:</span>
          <Select value={branchParam} onValueChange={(val) => handleBranchChange(val || 'ALL')}>
            <SelectTrigger className="h-8 w-[250px] rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-xs focus:ring-1 focus:ring-emerald-600">
              <SelectValue placeholder="Grupo LN (Consolidado)">
                {(() => {
                  const currentBranch = branches.find((b) => b.id === branchParam)
                  if (!currentBranch || branchParam === 'ALL') {
                    return (
                      <span className="flex items-center gap-1.5 truncate">
                        <Building2 className="h-3.5 w-3.5 text-emerald-800 shrink-0" />
                        <span className="truncate">Grupo LN (Consolidado)</span>
                      </span>
                    )
                  }
                  return (
                    <span className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                      <span className="truncate">{currentBranch.name} ({currentBranch.city})</span>
                    </span>
                  )
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                <span className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-emerald-800 shrink-0" />
                  <span>Grupo LN (Consolidado)</span>
                </span>
              </SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>{b.name} ({b.city})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

