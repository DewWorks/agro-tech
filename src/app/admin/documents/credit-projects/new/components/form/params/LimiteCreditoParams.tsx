import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CustomOptions } from '../../../types/wizard-types'

interface ParamsProps {
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
}

export function LimiteCreditoParams({ customOptions, setCustomOptions }: ParamsProps) {
  return (
    <div className="space-y-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
          Parâmetros Patrimoniais & Finanças
        </span>
        <span className="text-[10px] text-muted-foreground">Ficha Cadastral</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Terra Nua (R$ / ha)</Label>
          <Input
            type="number"
            value={customOptions.estimatedLandValuePerHa || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, estimatedLandValuePerHa: Number(e.target.value) }))}
            className="h-8 text-xs"
            placeholder="0,00"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Benfeitorias (R$)</Label>
          <Input
            type="number"
            value={customOptions.improvementsValue || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, improvementsValue: Number(e.target.value) }))}
            className="h-8 text-xs"
            placeholder="0,00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Máquinas (R$)</Label>
          <Input
            type="number"
            value={customOptions.machineryValue || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, machineryValue: Number(e.target.value) }))}
            className="h-8 text-xs"
            placeholder="0,00"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Receita Bruta Anual (R$)</Label>
          <Input
            type="number"
            value={customOptions.annualRevenue || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, annualRevenue: Number(e.target.value) }))}
            className="h-8 text-xs"
            placeholder="0,00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Custos / Despesas (R$)</Label>
          <Input
            type="number"
            value={customOptions.annualExpenses || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, annualExpenses: Number(e.target.value) }))}
            className="h-8 text-xs"
            placeholder="0,00"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Dívidas SCR / BACEN (R$)</Label>
          <Input
            type="number"
            value={customOptions.existingDebts || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, existingDebts: Number(e.target.value) }))}
            className="h-8 text-xs"
            placeholder="0,00"
          />
        </div>
      </div>
    </div>
  )
}
