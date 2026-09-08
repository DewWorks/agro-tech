import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CustomOptions } from '../../types/wizard-types'

interface TechnicalResponsibleFormProps {
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
  pendingFields?: string[]
}

export function TechnicalResponsibleForm({ customOptions, setCustomOptions, pendingFields = [] }: TechnicalResponsibleFormProps) {
  const isRTNamePending = !customOptions.responsibleName?.trim()
  
  return (
    <div className="space-y-3 pt-3 border-t border-gray-100">
      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
        Responsável Técnico & Dados
      </span>

      {pendingFields.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Campos obrigatórios pendentes:</strong> {pendingFields.join(', ')}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <Label className={cn("text-[11px]", isRTNamePending ? "text-amber-700 font-bold" : "text-gray-600")}>
          Responsável Técnico (Owner da Organização) *
        </Label>
        <Input
          value={customOptions.responsibleName}
          onChange={(e) => setCustomOptions(prev => ({ ...prev, responsibleName: e.target.value }))}
          className={cn("h-8 text-xs", isRTNamePending && "border-amber-400 focus-visible:ring-amber-400")}
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
