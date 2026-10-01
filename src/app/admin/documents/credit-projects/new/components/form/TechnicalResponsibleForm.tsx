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
  isCreaRequired?: boolean
}

export function TechnicalResponsibleForm({ 
  customOptions, 
  setCustomOptions, 
  pendingFields = [],
  isCreaRequired = false
}: TechnicalResponsibleFormProps) {
  const isRTNamePending = !customOptions.responsibleName?.trim()
  const isCreaPending = isCreaRequired && !customOptions.creaNumber?.trim()
  const isArtPending = isCreaRequired && !customOptions.artNumber?.trim()
  
  return (
    <div className="space-y-4 pt-3 border-t border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
          Responsável Técnico & Dados
        </span>
        {!isCreaRequired && (
          <span className="text-[11px] text-muted-foreground font-medium">
            (Registro CREA / ART dispensado para este modelo)
          </span>
        )}
      </div>

      {pendingFields.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Campos obrigatórios pendentes:</strong> {pendingFields.join(', ')}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className={cn("text-[11px]", isRTNamePending ? "text-amber-700 font-bold" : "text-gray-600")}>
            Responsável Técnico (Owner da Organização) *
          </Label>
          <span
            className={cn(
              "text-[9.5px] font-medium px-1.5 py-0.2 rounded border transition-colors",
              !isRTNamePending
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : "text-amber-700 bg-amber-50 border-amber-200 font-bold"
            )}
          >
            {!isRTNamePending ? 'Preenchido' : 'Obrigatório'}
          </span>
        </div>
        <Input
          id="field-responsible-name"
          value={customOptions.responsibleName || ''}
          onChange={(e) => setCustomOptions(prev => ({ ...prev, responsibleName: e.target.value }))}
          className={cn(
            "h-8 text-xs transition-colors",
            isRTNamePending
              ? "border-amber-400 bg-amber-50/20 focus-visible:ring-amber-400 focus:border-amber-500"
              : "border-gray-200 bg-white focus-visible:ring-emerald-500"
          )}
          placeholder="Nome do Responsável Técnico"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className={cn("text-[11px]", isCreaPending ? "text-amber-700 font-bold" : "text-gray-600")}>
              Nº do CREA {isCreaRequired ? '*' : '(Opcional)'}
            </Label>
            {isCreaRequired && (
              <span
                className={cn(
                  "text-[9.5px] font-medium px-1.5 py-0.2 rounded border transition-colors",
                  !isCreaPending
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-amber-700 bg-amber-50 border-amber-200 font-bold"
                )}
              >
                {!isCreaPending ? 'Preenchido' : 'Obrigatório'}
              </span>
            )}
          </div>
          <Input
            id="field-crea-number"
            value={customOptions.creaNumber || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, creaNumber: e.target.value }))}
            className={cn(
              "h-8 text-xs transition-colors",
              isCreaPending
                ? "border-amber-400 bg-amber-50/20 focus-visible:ring-amber-400 focus:border-amber-500"
                : "border-gray-200 bg-white focus-visible:ring-emerald-500"
            )}
            placeholder={isCreaRequired ? "Obrigatório: CREA/TO 12345-D" : "Opcional: Ex: CREA/TO 12345-D"}
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className={cn("text-[11px]", isArtPending ? "text-amber-700 font-bold" : "text-gray-600")}>
              Nº da ART/TRT {isCreaRequired ? '*' : '(Opcional)'}
            </Label>
            {isCreaRequired && (
              <span
                className={cn(
                  "text-[9.5px] font-medium px-1.5 py-0.2 rounded border transition-colors",
                  !isArtPending
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-amber-700 bg-amber-50 border-amber-200 font-bold"
                )}
              >
                {!isArtPending ? 'Preenchido' : 'Obrigatório'}
              </span>
            )}
          </div>
          <Input
            id="field-art-number"
            value={customOptions.artNumber || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, artNumber: e.target.value }))}
            className={cn(
              "h-8 text-xs transition-colors",
              isArtPending
                ? "border-amber-400 bg-amber-50/20 focus-visible:ring-amber-400 focus:border-amber-500"
                : "border-gray-200 bg-white focus-visible:ring-emerald-500"
            )}
            placeholder={isCreaRequired ? "Obrigatório: ART 2026/0987654" : "Opcional: Ex: ART 2026/0987654"}
          />
        </div>
      </div>
    </div>
  )
}
