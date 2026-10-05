'use client'

import React from 'react'
import Link from 'next/link'
import {
  Receipt,
  TrendingDown,
  ArrowLeftRight,
  SlidersHorizontal,
  FileSpreadsheet,
  ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FinancialQuickActionsProps {
  onOpenExpenseModal?: () => void
  onOpenTransferModal?: () => void
  onOpenExportModal?: () => void
}

export default function FinancialQuickActions({
  onOpenExpenseModal,
  onOpenTransferModal,
  onOpenExportModal,
}: FinancialQuickActionsProps) {
  const actions = [
    {
      title: 'Novo Faturamento Avulso',
      subtitle: 'CAR, AUI, Licenças e Laudos',
      icon: Receipt,
      href: '/admin/financial/receivables/new',
    },
    {
      title: 'Nova Despesa / Boleto',
      subtitle: 'ART, Vistorias e Compras a Prazo',
      icon: TrendingDown,
      onClick: onOpenExpenseModal,
      href: onOpenExpenseModal ? undefined : '/admin/financial/payables',
    },
    {
      title: 'Transferência Interna',
      subtitle: 'Mover recursos entre caixas e bancos',
      icon: ArrowLeftRight,
      onClick: onOpenTransferModal,
      href: onOpenTransferModal ? undefined : '/admin/financial/settings',
    },
    {
      title: 'Configurações do ERP',
      subtitle: 'Taxas, metas de safra e contas',
      icon: SlidersHorizontal,
      href: '/admin/financial/settings',
    },
    {
      title: 'Exportação Contábil',
      subtitle: 'DRE e extrato para contabilidade',
      icon: FileSpreadsheet,
      onClick: onOpenExportModal,
    },
  ]

  const cardClasses = cn(
    'group relative bg-[#113025] hover:bg-[#163d30] text-white rounded-2xl p-4 shadow-sm',
    'hover:shadow-md transition-all duration-200 border border-emerald-900/40 hover:border-emerald-700/60',
    'flex flex-col justify-between gap-3 min-h-[110px]'
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Central de Ações Rápidas & Atalhos
        </h2>
        <span className="text-[11px] text-slate-400 font-medium">Acessos operacionais prioritários</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {actions.map((act) => {
          const Icon = act.icon

          const innerContent = (
            <>
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-white/[0.08] flex items-center justify-center text-white shrink-0 transition-transform duration-200 group-hover:scale-105 group-hover:bg-white/[0.14]">
                  <Icon className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="text-emerald-400/60 group-hover:text-emerald-300 transition-colors">
                  <ArrowUpRight className="w-4 h-4 opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mt-3 block group-hover:text-emerald-200 transition-colors leading-tight">
                  {act.title}
                </h3>
                <p className="text-xs text-emerald-200/60 leading-tight mt-0.5 line-clamp-1">
                  {act.subtitle}
                </p>
              </div>
            </>
          )

          if (act.href) {
            return (
              <Link
                key={act.title}
                href={act.href}
                prefetch={true}
                className={cardClasses}
              >
                {innerContent}
              </Link>
            )
          }

          return (
            <button
              key={act.title}
              type="button"
              onClick={act.onClick}
              className={cn(cardClasses, 'text-left cursor-pointer')}
            >
              {innerContent}
            </button>
          )
        })}
      </div>
    </div>
  )
}
