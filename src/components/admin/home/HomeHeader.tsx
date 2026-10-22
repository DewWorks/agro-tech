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

export interface HomeHeaderBranding {
  tradeName?: string | null
  logoHorizontalUrl?: string | null
  logoIconUrl?: string | null
  logoDarkUrl?: string | null
  primaryColorHex?: string | null
  accentColorHex?: string | null
}

interface HomeHeaderProps {
  userName?: string
  activeBranchName: string
  branches: Array<{ id: string; name: string }>
  currentBranchId?: string
  isOwnerOrSuperAdmin: boolean
  isLNClient?: boolean
  branding?: HomeHeaderBranding
}

export function HomeHeader({
  userName,
  activeBranchName,
  branches,
  currentBranchId,
  isOwnerOrSuperAdmin,
  isLNClient,
  branding,
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

  // RENDERIZAÇÃO EXCLUSIVA PARA O CLIENTE LN CONSULTORIA: Banner com painel de fundo fotográfico agrícola e logo oficial
  if (isLNClient) {
    const logoSrc = branding?.logoHorizontalUrl || '/extracted_branding/logo_horizontal.png'
    const tradeName = branding?.tradeName || 'LN Consultoria e Projetos Rurais'

    return (
      <div
        className="relative overflow-hidden rounded-2xl border border-[#FFAC00]/30 shadow-md print:hidden text-white transition-all duration-300"
        style={{
          backgroundImage: `url('/extracted_branding/ln_banner_bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
        }}
      >
        {/* Camada de Gradiente Transparente com o Verde Oficial Espanhol (#05964F) e tons floresta */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#022417]/92 via-[#05964F]/80 to-[#021f14]/94 backdrop-blur-[0.5px]" />

        {/* Efeito sutil de brilho no topo com o Laranja Letícia Flag (#FFAC00) */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FFAC00] to-transparent opacity-80" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 p-6 sm:p-8">
          <div className="space-y-2 min-w-0 flex-1">
            {/* Etiqueta Superior com Data e Selo LN Consultoria */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <div className="flex items-center gap-1.5 text-emerald-100">
                <Calendar className="h-4 w-4 shrink-0 text-[#FFAC00]" />
                <span>{formattedDate}</span>
              </div>
              <span className="text-emerald-400/50 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5 bg-[#FFAC00]/20 text-[#FFAC00] border border-[#FFAC00]/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs">
                <span>{tradeName}</span>
              </div>
            </div>

            {/* Saudação Personalizada */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {greeting}, {firstName}!
            </h1>

            {/* Descrição e Subtítulo */}
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
              Unidade ativa: <strong className="text-white font-semibold">{activeBranchName}</strong> • Painel executivo e central de comando AgroTech.
            </p>
          </div>

          {/* Área Direita: Logo Oficial LN Consultoria em Card Elevado & Seletor de Filial */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 self-start md:self-auto">
            {/* Logo Oficial da LN Consultoria */}
            <div className="flex items-center justify-center bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-xs border border-white/60 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoSrc}
                alt={tradeName}
                className="h-8 sm:h-9 w-auto object-contain max-w-[200px]"
              />
            </div>

            {/* Seletor de Filiais */}
            {isOwnerOrSuperAdmin && branches.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider hidden xl:inline">
                  Unidade:
                </span>
                <Select value={selectedValue} onValueChange={handleBranchChange}>
                  <SelectTrigger className="w-full sm:w-[220px] md:w-[250px] h-10 text-xs font-medium bg-white text-slate-900 border-emerald-800/40 shadow-xs rounded-xl focus:ring-emerald-400">
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
            )}
          </div>
        </div>
      </div>
    )
  }

  // RENDERIZAÇÃO PADRÃO (DEMAIS CLIENTES): PageHeaderBanner Institucional
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
