import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CustomOptions } from '../../types/wizard-types'

interface TechnicalResponsibleFormProps {
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
}

export function TechnicalResponsibleForm({ customOptions, setCustomOptions }: TechnicalResponsibleFormProps) {
  return (
    <div className="space-y-3 pt-3 border-t border-gray-100">
      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
        Responsável Técnico & Dados
      </span>
      
      <div className="space-y-1">
        <Label className="text-[11px] text-gray-600">Responsável Técnico (Owner da Organização)</Label>
        <Input
          value={customOptions.responsibleName}
          onChange={(e) => setCustomOptions(prev => ({ ...prev, responsibleName: e.target.value }))}
          className="h-8 text-xs"
          placeholder="Nome do Responsável Técnico"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-gray-600">Nº do CREA</Label>
          <Input
            value={customOptions.creaNumber}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, creaNumber: e.target.value }))}
            className="h-8 text-xs"
            placeholder="Ex: CREA/TO 12345-D"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-gray-600">Nº da ART/TRT</Label>
          <Input
            value={customOptions.artNumber}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, artNumber: e.target.value }))}
            className="h-8 text-xs"
            placeholder="Ex: ART 2026/0987654"
          />
        </div>
      </div>
    </div>
  )
}
