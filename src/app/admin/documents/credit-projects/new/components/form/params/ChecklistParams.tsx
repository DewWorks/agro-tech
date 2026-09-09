import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CustomOptions } from '../../../types/wizard-types'

interface ParamsProps {
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
}

export function ChecklistParams({ customOptions, setCustomOptions }: ParamsProps) {
  return (
    <div className="space-y-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
          Parâmetros do Atendimento
        </span>
        <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
          Esteira & Dossiê
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Instituição Financeira</Label>
          <Input
            value={customOptions.targetBank}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, targetBank: e.target.value }))}
            className="h-8 text-xs"
            placeholder="Banco do Brasil"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Finalidade Principal</Label>
          <Input
            value={customOptions.purpose}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, purpose: e.target.value }))}
            className="h-8 text-xs"
            placeholder="Custeio / Investimento"
          />
        </div>
      </div>
    </div>
  )
}
