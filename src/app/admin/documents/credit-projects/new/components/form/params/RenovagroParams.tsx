import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CustomOptions } from '../../../types/wizard-types'

interface ParamsProps {
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
}

const RENOVAGRO_SUBLINES = [
  'Recuperação de Pastagens Degradadas (MCR 11.7.1.c.I)',
  'Integração Lavoura-Pecuária-Floresta (ILPF)',
  'Sistemas Agroflorestais (SAF)',
  'Manejo de Solo e Água'
]

export function RenovagroParams({ customOptions, setCustomOptions }: ParamsProps) {
  return (
    <div className="space-y-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
          Parâmetros do RenovAgro
        </span>
        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
          Recuperação Sustentável
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-[10.5px] text-gray-700 font-medium">Sublinha do Programa *</Label>
          <span className={cn(
            "text-[9.5px] font-medium px-1.5 py-0.2 rounded border",
            customOptions.renovagroSubline?.trim()
              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
              : "text-amber-700 bg-amber-50 border-amber-200 font-bold"
          )}>
            {customOptions.renovagroSubline?.trim() ? 'Preenchido' : 'Obrigatório'}
          </span>
        </div>
        <Input
          value={customOptions.renovagroSubline}
          onChange={(e) => setCustomOptions(prev => ({ ...prev, renovagroSubline: e.target.value }))}
          className={cn("h-8 text-xs", !customOptions.renovagroSubline?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
          placeholder="Selecione abaixo ou digite..."
        />
        <div className="flex flex-wrap gap-1 pt-0.5">
          {RENOVAGRO_SUBLINES.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setCustomOptions(prev => ({ ...prev, renovagroSubline: sub }))}
              className={cn(
                "text-[9.5px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer text-left",
                customOptions.renovagroSubline === sub
                  ? "bg-emerald-100 text-[#1B4D3E] border-emerald-300 font-semibold"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:text-[#1B4D3E]"
              )}
            >
              {sub.startsWith('Recuperação') ? 'Recup. de Pastagens' : sub.split('(')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Área a Recuperar (ha) *</Label>
          <Input
            type="number"
            value={customOptions.renovagroAreaHa || ''}
            onChange={(e) => {
              const area = Number(e.target.value)
              setCustomOptions(prev => {
                const cost = prev.renovagroCostPerHa || 3500
                const total = area * cost
                return {
                  ...prev,
                  renovagroAreaHa: area,
                  renovagroCostPerHa: cost,
                  renovagroTotalInvestment: total,
                  renovagroFinanced: Math.round(total * 0.9),
                  renovagroOwnResources: Math.round(total * 0.1)
                }
              })
            }}
            className="h-8 text-xs"
            placeholder="Ex: 50"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Custo / ha (R$) *</Label>
          <Input
            type="number"
            value={customOptions.renovagroCostPerHa || ''}
            onChange={(e) => {
              const cost = Number(e.target.value)
              setCustomOptions(prev => {
                const total = prev.renovagroAreaHa * cost
                return {
                  ...prev,
                  renovagroCostPerHa: cost,
                  renovagroTotalInvestment: total,
                  renovagroFinanced: Math.round(total * 0.9),
                  renovagroOwnResources: Math.round(total * 0.1)
                }
              })
            }}
            className="h-8 text-xs"
            placeholder="Ex: 3500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10.5px] font-semibold text-gray-800">Investimento Total (R$) *</Label>
          <Input
            type="number"
            value={customOptions.renovagroTotalInvestment || ''}
            onChange={(e) => {
              const val = Number(e.target.value)
              setCustomOptions(prev => ({
                ...prev,
                renovagroTotalInvestment: val,
                renovagroFinanced: Math.round(val * 0.9),
                renovagroOwnResources: Math.round(val * 0.1)
              }))
            }}
            className="h-8 text-xs font-semibold"
            placeholder="0,00"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Financiamento (R$) *</Label>
          <Input
            type="number"
            value={customOptions.renovagroFinanced || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, renovagroFinanced: Number(e.target.value) }))}
            className="h-8 text-xs"
            placeholder="0,00"
          />
        </div>
      </div>

      <div className="space-y-1 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 font-medium">Condições Financeiras *</span>
          <button
            type="button"
            onClick={() => setCustomOptions(prev => ({
              ...prev,
              renovagroTermYears: 8,
              renovagroGraceMonths: 24,
              renovagroInterestRate: 10.5
            }))}
            className="text-[9.5px] text-emerald-700 hover:underline cursor-pointer font-medium"
          >
            Usar padrão (8a / 24m / 10.5%)
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-600">Prazo (anos) *</Label>
            <Input
              type="number"
              value={customOptions.renovagroTermYears || ''}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, renovagroTermYears: Number(e.target.value) }))}
              className="h-8 text-xs"
              placeholder="Ex: 8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-600">Carência (m)</Label>
            <Input
              type="number"
              value={customOptions.renovagroGraceMonths || ''}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, renovagroGraceMonths: Number(e.target.value) }))}
              className="h-8 text-xs"
              placeholder="Ex: 24"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-600">Juros (% a.a.) *</Label>
            <Input
              type="number"
              step="0.1"
              value={customOptions.renovagroInterestRate || ''}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, renovagroInterestRate: Number(e.target.value) }))}
              className="h-8 text-xs"
              placeholder="Ex: 10.5"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
