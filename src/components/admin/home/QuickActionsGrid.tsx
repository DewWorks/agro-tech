'use client'

import React from 'react'
import Link from 'next/link'
import {
  ClipboardCheck,
  Tractor,
  MapPin,
  FileSignature,
  FolderArchive,
  ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickActionItem {
  title: string
  subtitle: string
  href: string
  icon: React.ElementType
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    title: 'Nova Demanda Rural',
    subtitle: 'Abertura de O.S. técnica',
    href: '/admin/demands/new',
    icon: ClipboardCheck,
  },
  {
    title: 'Cadastrar Produtor',
    subtitle: 'Novo cliente no CRM',
    href: '/admin/crm/new',
    icon: Tractor,
  },
  {
    title: 'Mapear Propriedade',
    subtitle: 'Dados fundiários e glebas',
    href: '/admin/crm/properties/new',
    icon: MapPin,
  },
  {
    title: 'Emitir Documento Oficial',
    subtitle: 'Declarações Legais e projetos de crédito',
    href: '/admin/documents/credit-projects/new',
    icon: FileSignature,
  },
  {
    title: 'Explorador do GED',
    subtitle: 'Gestão e upload em nuvem',
    href: '/admin/documents',
    icon: FolderArchive,
  },
]

export function QuickActionsGrid() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Central de Ações Rápidas
        </h2>
        <span className="text-[11px] text-slate-400 font-medium">Acessos operacionais prioritários</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.title}
              href={action.href}
              prefetch={true}
              className={cn(
                'group relative bg-[#1B4D3E] hover:bg-[#143D31] text-white rounded-2xl p-4 shadow-sm',
                'hover:shadow-md transition-all duration-200 border border-[#1B4D3E]/80',
                'flex flex-col justify-between gap-3 min-h-[108px]'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-white/15 text-white border border-white/20 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 group-hover:bg-white/20">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-emerald-200/60 group-hover:text-white transition-colors">
                  <ArrowUpRight className="w-4 h-4 opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white leading-snug group-hover:text-emerald-200 transition-colors">
                  {action.title}
                </h3>
                <p className="text-[11px] text-emerald-100/75 mt-0.5 leading-tight line-clamp-1">
                  {action.subtitle}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
