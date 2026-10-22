'use client'

import React from 'react'
import Link from 'next/link'
import { Tractor, MapPin, Building2, Users, ArrowRight } from 'lucide-react'

interface PatrimonialSummaryFooterProps {
  summary: {
    totalProducers: number
    totalProperties: number
    totalHectares: number
    formattedHectares: string
    totalBranches: number
    totalUsers: number
  }
}

export function PatrimonialSummaryFooter({ summary }: PatrimonialSummaryFooterProps) {
  return (
    <div className="space-y-3">
      {/* Cabeçalho da Seção Padronizado no Verde Institucional */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1B4D3E]" />
          <h2 className="text-xs font-bold text-[#1B4D3E] uppercase tracking-wider">
            Resumo Patrimonial & Governança da Organização
          </h2>
        </div>
        <span className="text-[11px] text-[#1B4D3E] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 font-semibold w-fit">
          Bases cadastrais consolidadas
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Produtores Rurais */}
        <Link
          href="/admin/crm"
          prefetch={true}
          className="group relative bg-white border border-slate-200/90 hover:border-[#1B4D3E] rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#1B4D3E] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#1B4D3E] border border-emerald-100/80 flex items-center justify-center shrink-0 group-hover:bg-[#1B4D3E] group-hover:text-white group-hover:border-[#1B4D3E] transition-all duration-200 shadow-2xs">
              <Tractor className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            </div>
            <div className="min-w-0">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none tracking-tight block">
                {summary.totalProducers}
              </span>
              <span className="text-xs font-bold text-slate-700 group-hover:text-[#1B4D3E] transition-colors mt-1 block truncate">
                Produtores Rurais
              </span>
              <span className="text-[10px] text-slate-400 font-medium block truncate">
                Cadastros ativos no CRM
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-[#1B4D3E] group-hover:bg-emerald-50 transition-all shrink-0">
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Card 2: Imóveis Rurais & Área */}
        <Link
          href="/admin/crm/properties"
          prefetch={true}
          className="group relative bg-white border border-slate-200/90 hover:border-[#1B4D3E] rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#1B4D3E] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#1B4D3E] border border-emerald-100/80 flex items-center justify-center shrink-0 group-hover:bg-[#1B4D3E] group-hover:text-white group-hover:border-[#1B4D3E] transition-all duration-200 shadow-2xs">
              <MapPin className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            </div>
            <div className="min-w-0">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none tracking-tight block">
                {summary.totalProperties}
              </span>
              <span className="text-xs font-bold text-slate-700 group-hover:text-[#1B4D3E] transition-colors mt-1 block truncate">
                Imóveis ({summary.formattedHectares} ha)
              </span>
              <span className="text-[10px] text-slate-400 font-medium block truncate">
                Área fundiária total mapeada
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-[#1B4D3E] group-hover:bg-emerald-50 transition-all shrink-0">
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Card 3: Filiais Ativas */}
        <Link
          href="/admin/branches"
          prefetch={true}
          className="group relative bg-white border border-slate-200/90 hover:border-[#1B4D3E] rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#1B4D3E] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#1B4D3E] border border-emerald-100/80 flex items-center justify-center shrink-0 group-hover:bg-[#1B4D3E] group-hover:text-white group-hover:border-[#1B4D3E] transition-all duration-200 shadow-2xs">
              <Building2 className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            </div>
            <div className="min-w-0">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none tracking-tight block">
                {summary.totalBranches}
              </span>
              <span className="text-xs font-bold text-slate-700 group-hover:text-[#1B4D3E] transition-colors mt-1 block truncate">
                Filiais Ativas
              </span>
              <span className="text-[10px] text-slate-400 font-medium block truncate">
                Unidades operacionais
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-[#1B4D3E] group-hover:bg-emerald-50 transition-all shrink-0">
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Card 4: Usuários Registrados */}
        <Link
          href="/admin/users"
          prefetch={true}
          className="group relative bg-white border border-slate-200/90 hover:border-[#1B4D3E] rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#1B4D3E] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#1B4D3E] border border-emerald-100/80 flex items-center justify-center shrink-0 group-hover:bg-[#1B4D3E] group-hover:text-white group-hover:border-[#1B4D3E] transition-all duration-200 shadow-2xs">
              <Users className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            </div>
            <div className="min-w-0">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none tracking-tight block">
                {summary.totalUsers}
              </span>
              <span className="text-xs font-bold text-slate-700 group-hover:text-[#1B4D3E] transition-colors mt-1 block truncate">
                Usuários no Sistema
              </span>
              <span className="text-[10px] text-slate-400 font-medium block truncate">
                Acessos com permissão
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-[#1B4D3E] group-hover:bg-emerald-50 transition-all shrink-0">
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  )
}

export const PatrimonialSummaryHeader = PatrimonialSummaryFooter
export default PatrimonialSummaryFooter
