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
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Resumo Patrimonial & Governança da Organização
        </h2>
        <span className="text-[11px] text-slate-400 font-medium">Bases cadastrais consolidadas</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Produtores Rurais */}
        <Link
          href="/admin/crm"
          prefetch={true}
          className="group bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:border-[#1B4D3E]/40 transition-all flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1B4D3E] flex items-center justify-center border border-emerald-100/70 shrink-0 transition-transform duration-200 group-hover:scale-105">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 leading-none block">
                {summary.totalProducers}
              </span>
              <span className="text-xs font-semibold text-slate-600 mt-1 block">
                Produtores Rurais
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1B4D3E] group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* Card 2: Imóveis Rurais & Área */}
        <Link
          href="/admin/crm/properties"
          prefetch={true}
          className="group bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:border-[#1B4D3E]/40 transition-all flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1B4D3E] flex items-center justify-center border border-emerald-100/70 shrink-0 transition-transform duration-200 group-hover:scale-105">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 leading-none block">
                {summary.totalProperties}
              </span>
              <span className="text-xs font-semibold text-slate-600 mt-1 block">
                Imóveis ({summary.formattedHectares} ha)
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1B4D3E] group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* Card 3: Filiais Ativas */}
        <Link
          href="/admin/branches"
          prefetch={true}
          className="group bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:border-[#1B4D3E]/40 transition-all flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1B4D3E] flex items-center justify-center border border-emerald-100/70 shrink-0 transition-transform duration-200 group-hover:scale-105">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 leading-none block">
                {summary.totalBranches}
              </span>
              <span className="text-xs font-semibold text-slate-600 mt-1 block">
                Filiais Ativas
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1B4D3E] group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* Card 4: Usuários Registrados */}
        <Link
          href="/admin/users"
          prefetch={true}
          className="group bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:border-[#1B4D3E]/40 transition-all flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1B4D3E] flex items-center justify-center border border-emerald-100/70 shrink-0 transition-transform duration-200 group-hover:scale-105">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 leading-none block">
                {summary.totalUsers}
              </span>
              <span className="text-xs font-semibold text-slate-600 mt-1 block">
                Usuários no Sistema
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1B4D3E] group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </div>
  )
}
