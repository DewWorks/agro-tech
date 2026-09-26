'use client'

import React from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Building2, Calendar } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'

interface HomeHeaderProps {
  userName?: string
  activeBranchName: string
  branches: Array<{ id: string; name: string }>
  currentBranchId?: string
  isOwnerOrSuperAdmin: boolean
}

export function HomeHeader({
  userName,
  activeBranchName,
  branches,
  currentBranchId,
  isOwnerOrSuperAdmin,
}: HomeHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentHour = new Date().getHours()
  let greeting = 'Olá'
  if (currentHour < 12) {
    greeting = 'Bom dia'
  } else if (currentHour < 18) {
    greeting = 'Boa tarde'
  } else {
    greeting = 'Boa noite'
  }

  const firstName = userName ? userName.trim().split(' ')[0] : 'Gestor'

  // Data formatada por extenso em português
  const rawDate = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
  const formattedDate = rawDate.charAt(0).toUpperCase() + rawDate.slice(1)

  const handleBranchChange = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === 'ALL') {
      params.delete('branchId')
    } else {
      params.set('branchId', value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const selectedValue = currentBranchId || 'ALL'

  return (
    <PageHeaderBanner
      badge={formattedDate}
      badgeIcon={<Calendar className="h-4 w-4 shrink-0 text-emerald-300" />}
      title={`${greeting}, ${firstName}!`}
      description={`Unidade ativa: ${activeBranchName} • Painel executivo e central de comando AgroTech.`}
      actions={
        isOwnerOrSuperAdmin && branches.length > 0 ? (
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider hidden lg:inline">
              Unidade:
            </span>
            <Select value={selectedValue} onValueChange={handleBranchChange}>
              <SelectTrigger className="w-[230px] sm:w-[260px] h-10 text-xs font-medium bg-white text-slate-900 border-emerald-800/40 shadow-xs rounded-xl focus:ring-emerald-400">
                <SelectValue placeholder="Todas as Filiais">
                  <span className="flex items-center gap-2 truncate text-slate-900">
                    <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">{activeBranchName}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                <SelectItem value="ALL" className="text-xs font-semibold text-slate-900 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Todas as Filiais (Consolidado)</span>
                  </div>
                </SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-xs text-slate-700 cursor-pointer">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : undefined
      }
    />
  )
}
