import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CustomOptions } from '../../../types/wizard-types'

interface ParamsProps {
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
}

const INOVAGRO_EQUIPMENTS = [
  'Gerador Solar Fotovoltaico On-Grid',
  'Trator Agrícola com Piloto Automático',
  'Sistema de Irrigação Automatizado',
  'Estação Meteorológica e Sensores'
]

export function InovagroParams({ customOptions, setCustomOptions }: ParamsProps) {
  return (
    <div className="space-y-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
          Parâmetros do InovAgro
        </span>
        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
          Investimento Tecnológico
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-[10.5px] text-gray-700 font-medium">Equipamento / Objeto *</Label>
          <span className={cn(
            "text-[9.5px] font-medium px-1.5 py-0.2 rounded border",
            customOptions.inovagroEquipment?.trim()
              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
              : "text-amber-700 bg-amber-50 border-amber-200 font-bold"
          )}>
            {customOptions.inovagroEquipment?.trim() ? 'Preenchido' : 'Obrigatório'}
          </span>
        </div>
        <Input
          value={customOptions.inovagroEquipment}
          onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroEquipment: e.target.value }))}
          className={cn("h-8 text-xs", !customOptions.inovagroEquipment?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
          placeholder="Selecione abaixo ou digite..."
        />
        <div className="flex flex-wrap gap-1 pt-0.5">
          {INOVAGRO_EQUIPMENTS.map((eq) => (
            <button
              key={eq}
              type="button"
              onClick={() => setCustomOptions(prev => ({ ...prev, inovagroEquipment: eq }))}
              className={cn(
                "text-[9.5px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer text-left",
                customOptions.inovagroEquipment === eq
                  ? "bg-emerald-100 text-[#1B4D3E] border-emerald-300 font-semibold"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:text-[#1B4D3E]"
              )}
            >
              {eq.split('com')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[10.5px] text-gray-600">Especificação Técnica</Label>
        <Input
          value={customOptions.inovagroSpec}
          onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroSpec: e.target.value }))}
          className="h-8 text-xs"
          placeholder="Ex: Módulos Monocristalinos Tier-1 + Inversor"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Potência (kWp)</Label>
          <Input
            type="number"
            value={customOptions.inovagroPower || ''}
            onChange={(e) => {
              const power = Number(e.target.value)
              setCustomOptions(prev => ({
                ...prev,
                inovagroPower: power,
                inovagroMonthlySavings: power > 0 ? Math.round(power * 135 * 0.95) : prev.inovagroMonthlySavings
              }))
            }}
            className="h-8 text-xs"
            placeholder="Ex: 45"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">CNAE BNDES</Label>
          <Input
            value={customOptions.inovagroCnae}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroCnae: e.target.value }))}
            className="h-8 text-xs"
            placeholder="Ex: 01.50-1/00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10.5px] font-semibold text-gray-800">Investimento Total (R$)</Label>
          <Input
            type="number"
            value={customOptions.inovagroTotalInvestment || ''}
            onChange={(e) => {
              const val = Number(e.target.value)
              setCustomOptions(prev => ({
                ...prev,
                inovagroTotalInvestment: val,
                inovagroFinanced: Math.round(val * 0.9),
                inovagroOwnResources: Math.round(val * 0.1)
              }))
            }}
            className="h-8 text-xs font-semibold"
            placeholder="0,00"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Financiamento (R$)</Label>
          <Input
            type="number"
            value={customOptions.inovagroFinanced || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroFinanced: Number(e.target.value) }))}
            className="h-8 text-xs"
            placeholder="0,00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Recursos Próprios (R$)</Label>
          <Input
            type="number"
            value={customOptions.inovagroOwnResources || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroOwnResources: Number(e.target.value) }))}
            className="h-8 text-xs"
            placeholder="0,00"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Economia Mensal (R$)</Label>
          <Input
            type="number"
            value={customOptions.inovagroMonthlySavings || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroMonthlySavings: Number(e.target.value) }))}
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
              inovagroTermYears: 10,
              inovagroGraceMonths: 24,
              inovagroInterestRate: 12.5
            }))}
            className="text-[9.5px] text-emerald-700 hover:underline cursor-pointer font-medium"
          >
            Usar padrão (10a / 24m / 12.5%)
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-600">Prazo (anos) *</Label>
            <Input
              type="number"
              value={customOptions.inovagroTermYears || ''}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroTermYears: Number(e.target.value) }))}
              className="h-8 text-xs"
              placeholder="Ex: 10"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-600">Carência (m)</Label>
            <Input
              type="number"
              value={customOptions.inovagroGraceMonths || ''}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroGraceMonths: Number(e.target.value) }))}
              className="h-8 text-xs"
              placeholder="Ex: 24"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-600">Juros (% a.a.) *</Label>
            <Input
              type="number"
              step="0.1"
              value={customOptions.inovagroInterestRate || ''}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroInterestRate: Number(e.target.value) }))}
              className="h-8 text-xs"
              placeholder="Ex: 12.5"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
