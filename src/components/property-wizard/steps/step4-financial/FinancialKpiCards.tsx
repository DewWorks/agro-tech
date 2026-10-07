'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  PieChart,
  Building,
  ChevronDown,
  ChevronUp,
  LandPlot,
  Tractor,
  Warehouse,
  Beef,
  Landmark,
} from 'lucide-react'

interface FinancialKpiCardsProps {
  landValue: number
  totalArea: number
  machineryValue: number
  machineriesCount: number
  improvementsValue: number
  improvementsCount: number
  livestockValue: number
  livestocksCount: number
  totalAssetsWithSecondary: number
  ruralAssetsTotal: number
  urbanTotal: number
  vehiclesTotal: number
  mcrAcceptableCollateral: number
  formatBRL: (val: number) => string
  showSecondaryAssets: boolean
  setShowSecondaryAssets: (v: boolean | ((prev: boolean) => boolean)) => void
}

export function FinancialKpiCards({
  landValue,
  totalArea,
  machineryValue,
  machineriesCount,
  improvementsValue,
  improvementsCount,
  livestockValue,
  livestocksCount,
  totalAssetsWithSecondary,
  ruralAssetsTotal,
  urbanTotal,
  vehiclesTotal,
  mcrAcceptableCollateral,
  formatBRL,
  showSecondaryAssets,
  setShowSecondaryAssets,
}: FinancialKpiCardsProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Composição Patrimonial e Lastro de Garantias
          </h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowSecondaryAssets(!showSecondaryAssets)}
          className="text-xs text-emerald-800 hover:text-emerald-900 hover:bg-emerald-50 gap-1.5 cursor-pointer"
        >
          <Building className="w-3.5 h-3.5" />
          {showSecondaryAssets ? 'Ocultar Bens Secundários' : '+ Bens Secundários (Urbanos/Frotas)'}
          {showSecondaryAssets ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
        Valores consolidados em tempo real a partir dos Steps 1, 2 e 3 + Bens Complementares para composição de garantia.
      </p>

      {/* Grid de Cards de Ativos Rurais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Card Terra Nua */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
            <LandPlot className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Terra Nua (Step 1)
            </span>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">
              {formatBRL(landValue)}
            </p>
            <span className="text-[10px] text-slate-600 dark:text-slate-300">
              {totalArea} ha cadastrados
            </span>
          </div>
        </div>

        {/* Card Máquinas */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
            <Tractor className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Máquinas (Step 2)
            </span>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">
              {formatBRL(machineryValue)}
            </p>
            <span className="text-[10px] text-slate-600 dark:text-slate-300">
              {machineriesCount} equipamento(s)
            </span>
          </div>
        </div>

        {/* Card Benfeitorias */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center shrink-0">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Benfeitorias (Step 3)
            </span>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">
              {formatBRL(improvementsValue)}
            </p>
            <span className="text-[10px] text-slate-600 dark:text-slate-300">
              {improvementsCount} instalação(ões)
            </span>
          </div>
        </div>

        {/* Card Rebanho */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-[#1B4D3E] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Beef className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Semoventes (Step 3)
            </span>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">
              {formatBRL(livestockValue)}
            </p>
            <span className="text-[10px] text-slate-600 dark:text-slate-300">
              {livestocksCount} lote(s) de animais
            </span>
          </div>
        </div>
      </div>

      {/* Card Master: Patrimônio Total e Margem de Alavancagem */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-[#1B4D3E] via-teal-800 to-emerald-700 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="w-6 h-6 text-emerald-200" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
              Patrimônio Bruto Total Avaliado
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            {formatBRL(totalAssetsWithSecondary)}
          </h2>
          <p className="text-xs text-emerald-100/80 mt-0.5">
            Rural: {formatBRL(ruralAssetsTotal)}
            {urbanTotal > 0 && ` • Imóveis Urbanos: ${formatBRL(urbanTotal)}`}
            {vehiclesTotal > 0 && ` • Veículos: ${formatBRL(vehiclesTotal)}`}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-lg border border-white/20 text-xs text-right">
          <div className="text-emerald-100 font-medium">Lastro Ponderado Aceitável (MCR)</div>
          <div className="font-bold text-white text-base">
            {formatBRL(mcrAcceptableCollateral)}
          </div>
          <div className="text-[10px] text-emerald-200 mt-0.5">
            Base de garantias livres de gravame
          </div>
        </div>
      </div>
    </div>
  )
}
