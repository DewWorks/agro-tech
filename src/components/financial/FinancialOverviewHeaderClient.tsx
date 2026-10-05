'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { PlusCircle, ArrowUpRight, Wallet, FileSpreadsheet } from 'lucide-react'
import FinancialExportModal, { DreExportData } from '@/components/financial/FinancialExportModal'
import { Button } from '@/components/ui/button'

interface FinancialOverviewHeaderClientProps {
  exportData: DreExportData
}

export default function FinancialOverviewHeaderClient({
  exportData,
}: FinancialOverviewHeaderClientProps) {
  const [exportModalOpen, setExportModalOpen] = useState(false)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Visão Geral & Indicadores de Caixa</h2>
          <p className="text-xs text-slate-500">
            Acompanhamento em tempo real de liquidações, obrigações futuras e resultado operacional.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/financial/receivables/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-900 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Novo Faturamento
          </Link>
          <Link
            href="/admin/financial/payables"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <ArrowUpRight className="h-4 w-4 text-rose-600" />
            Nova Despesa
          </Link>
          <Link
            href="/admin/financial/settings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Wallet className="h-4 w-4 text-emerald-600" />
            Transferência Interna
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setExportModalOpen(true)}
            className="gap-1.5 text-xs font-bold text-slate-700 border-slate-300 hover:bg-slate-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-blue-700" />
            Exportação Contábil
          </Button>
        </div>
      </div>

      <FinancialExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        exportData={exportData}
      />
    </>
  )
}
