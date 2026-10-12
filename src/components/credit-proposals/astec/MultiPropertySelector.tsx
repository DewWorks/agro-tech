'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { MapPin, Building2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PropertyListItem {
  id: string
  name?: string
  propertyName?: string
  city?: string | null
  state?: string | null
  car?: string | null
  registrationNumber?: string | null
  totalArea?: number | null
}

export interface SelectedPropertyItem {
  propertyId: string
  isEnterpriseLocation: boolean
}

export interface MultiPropertySelectorProps {
  availableProperties: PropertyListItem[]
  selectedProperties: SelectedPropertyItem[]
  onChange: (items: SelectedPropertyItem[]) => void
  disabled?: boolean
  className?: string
}

export function MultiPropertySelector({
  availableProperties,
  selectedProperties,
  onChange,
  disabled = false,
  className,
}: MultiPropertySelectorProps) {
  const isSelected = (propertyId: string) =>
    selectedProperties.some((p) => p.propertyId === propertyId)

  const isEnterprise = (propertyId: string) =>
    selectedProperties.some((p) => p.propertyId === propertyId && p.isEnterpriseLocation)

  const handleToggleProperty = (propertyId: string, checked: boolean) => {
    if (disabled) return
    if (checked) {
      // Se for a primeira propriedade adicionada, marcar como enterpriseLocation por padrão
      const isFirst = selectedProperties.length === 0
      const updated: SelectedPropertyItem[] = [
        ...selectedProperties,
        { propertyId, isEnterpriseLocation: isFirst },
      ]
      onChange(updated)
    } else {
      const remaining = selectedProperties.filter((p) => p.propertyId !== propertyId)
      // Se removeu a propriedade que era enterprise location, passa para a primeira restante se houver
      if (remaining.length > 0 && !remaining.some((p) => p.isEnterpriseLocation)) {
        remaining[0].isEnterpriseLocation = true
      }
      onChange(remaining)
    }
  }

  const handleSetEnterpriseLocation = (propertyId: string) => {
    if (disabled) return
    const updated = selectedProperties.map((p) => ({
      ...p,
      isEnterpriseLocation: p.propertyId === propertyId,
    }))
    onChange(updated)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <Label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#1B4D3E]" />
            Imóveis Rurais Vinculados à Proposta (Composição Patrimonial)
          </Label>
          <p className="text-[11px] text-slate-500">
            Selecione todos os imóveis que compõem a garantia/exploração e eleja o imóvel sede do empreendimento.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold text-slate-600 bg-slate-50 self-start">
          {selectedProperties.length} {selectedProperties.length === 1 ? 'imóvel selecionado' : 'imóveis selecionados'}
        </Badge>
      </div>

      {availableProperties.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
          Nenhum imóvel rural cadastrado para este produtor.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {availableProperties.map((prop) => {
            const selected = isSelected(prop.id)
            const enterprise = isEnterprise(prop.id)
            const propName = prop.propertyName || prop.name || 'Imóvel Rural'

            return (
              <div
                key={prop.id}
                className={cn(
                  'p-3.5 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                  selected
                    ? 'border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-2xs'
                    : 'border-slate-200 bg-white dark:bg-slate-900 opacity-80 hover:opacity-100'
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`prop-${prop.id}`}
                    checked={selected}
                    disabled={disabled}
                    onCheckedChange={(checked) => handleToggleProperty(prop.id, Boolean(checked))}
                    className="mt-0.5 data-[state=checked]:bg-[#1B4D3E] data-[state=checked]:border-[#1B4D3E]"
                  />
                  <div>
                    <label
                      htmlFor={`prop-${prop.id}`}
                      className="font-bold text-slate-900 dark:text-slate-100 cursor-pointer hover:underline flex items-center gap-1.5"
                    >
                      {propName}
                      {prop.totalArea ? (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {Number(prop.totalArea).toFixed(1)} ha
                        </span>
                      ) : null}
                    </label>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                      {prop.city && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {prop.city}{prop.state ? `/${prop.state}` : ''}
                        </span>
                      )}
                      {prop.registrationNumber && (
                        <span>Matrícula: <strong>{prop.registrationNumber}</strong></span>
                      )}
                      {prop.car && (
                        <span className="truncate max-w-[200px]" title={prop.car}>
                          CAR: {prop.car}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {selected && (
                  <div className="sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSetEnterpriseLocation(prop.id)}
                      className={cn(
                        'text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer inline-flex items-center gap-1.5',
                        enterprise
                          ? 'bg-[#1B4D3E] text-white border-[#1B4D3E] shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      )}
                    >
                      <CheckCircle2 className={cn('w-3.5 h-3.5', enterprise ? 'text-emerald-300' : 'text-slate-400')} />
                      <span>
                        {enterprise
                          ? 'Localização do Empreendimento Objeto'
                          : 'Marcar como Objeto da Proposta'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
