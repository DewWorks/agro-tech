import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CustomOptions } from '../../../types/wizard-types'

interface ParamsProps {
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
}

export const RENOVAGRO_SUBLINES = [
  'Recuperação de Pastagens Degradadas (MCR 11.7.1.c.I)',
  'Integração Lavoura-Pecuária-Floresta (ILPF)',
  'Sistemas Agroflorestais (SAF)',
  'Manejo de Solo e Água',
  'Aquisição de Matrizes e Reprodutores',
  'Máquinas e Equipamentos de Baixo Carbono'
]

/**
 * Detecta se a sublinha do RenovAgro é voltada a semoventes/equipamentos/itens físicos
 * ou se é voltada a solo/pastagem/terra.
 */
export function isAnimalOrEquipmentSubline(subline?: string): boolean {
  if (!subline) return false
  const s = subline.toLowerCase().trim()
  return (
    s.includes('matriz') ||
    s.includes('reprodutor') ||
    s.includes('animal') ||
    s.includes('animais') ||
    s.includes('semovente') ||
    s.includes('cabeça') ||
    s.includes('cabeca') ||
    s.includes('gado') ||
    s.includes('bovino') ||
    s.includes('máquina') ||
    s.includes('maquina') ||
    s.includes('equipamento') ||
    s.includes('trator') ||
    s.includes('implemento')
  )
}

export function RenovagroParams({ customOptions, setCustomOptions }: ParamsProps) {
  const isAnimalOrEquipment = isAnimalOrEquipmentSubline(customOptions.renovagroSubline)

  // Rótulos e placeholders dinâmicos conforme a sublinha
  const qtyLabel = isAnimalOrEquipment ? 'Item Financiável / Quantidade *' : 'Item Financiável'
  const qtyPlaceholder = isAnimalOrEquipment ? 'Ex: 40' : 'Ex: 40'
  const qtyUnitHint = isAnimalOrEquipment ? 'Cabeças / Unidades' : 'Hectares (ha)'

  const unitCostLabel = isAnimalOrEquipment ? 'Valor Unitário (R$) *' : 'Custo / ha (R$) *'
  const unitCostPlaceholder = isAnimalOrEquipment ? 'Ex: 4000' : 'Ex: 3850'
  const unitCostHint = isAnimalOrEquipment ? 'R$ por cabeça/unidade' : 'R$ por hectare'
  const defaultUnitCost = isAnimalOrEquipment ? 4000 : 3850

  return (
    <div className="space-y-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
          Parâmetros do RenovAgro
        </span>
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded border transition-colors font-medium",
          isAnimalOrEquipment
            ? "text-blue-700 bg-blue-50 border-blue-200"
            : "text-emerald-700 bg-emerald-50 border-emerald-200"
        )}>
          {isAnimalOrEquipment ? 'Investimento em Semoventes / Bens' : 'Recuperação Sustentável (Solo/Pastagem)'}
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
          {RENOVAGRO_SUBLINES.map((sub) => {
            const isSelected = customOptions.renovagroSubline === sub
            let displayLabel = sub
            if (sub.startsWith('Recuperação')) displayLabel = 'Recup. de Pastagens'
            else if (sub.includes('(')) displayLabel = sub.split('(')[0].trim()
            else if (sub.startsWith('Aquisição')) displayLabel = 'Aquisição de Matrizes'
            else if (sub.startsWith('Máquinas')) displayLabel = 'Máquinas / Equipamentos'

            return (
              <button
                key={sub}
                type="button"
                onClick={() => {
                  setCustomOptions(prev => {
                    const wasAnimal = isAnimalOrEquipmentSubline(prev.renovagroSubline)
                    const nowAnimal = isAnimalOrEquipmentSubline(sub)
                    let cost = prev.renovagroCostPerHa
                    // Se estiver no valor padrão anterior, sugere o valor padrão do novo contexto
                    if (!wasAnimal && nowAnimal && (cost === 3500 || cost === 3850 || !cost)) {
                      cost = 4000
                    } else if (wasAnimal && !nowAnimal && (cost === 4000 || !cost)) {
                      cost = 3850
                    }
                    const qty = prev.renovagroAreaHa || 0
                    const total = qty > 0 && cost ? qty * cost : prev.renovagroTotalInvestment
                    return {
                      ...prev,
                      renovagroSubline: sub,
                      renovagroCostPerHa: cost,
                      renovagroTotalInvestment: total,
                      renovagroFinanced: total ? Math.round(total * 0.9) : prev.renovagroFinanced,
                      renovagroOwnResources: total ? Math.round(total * 0.1) : prev.renovagroOwnResources,
                    }
                  })
                }}
                className={cn(
                  "text-[9.5px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer text-left",
                  isSelected
                    ? "bg-emerald-100 text-[#1B4D3E] border-emerald-300 font-semibold"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:text-[#1B4D3E]"
                )}
              >
                {displayLabel}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10.5px] text-gray-600">{qtyLabel}</Label>
            <span className="text-[9px] text-gray-400 font-normal">{qtyUnitHint}</span>
          </div>
          <Input
            type="number"
            value={customOptions.renovagroAreaHa || ''}
            onChange={(e) => {
              const qty = Number(e.target.value)
              setCustomOptions(prev => {
                const cost = prev.renovagroCostPerHa || defaultUnitCost
                const total = qty * cost
                return {
                  ...prev,
                  renovagroAreaHa: qty,
                  renovagroCostPerHa: cost,
                  renovagroTotalInvestment: total,
                  renovagroFinanced: Math.round(total * 0.9),
                  renovagroOwnResources: Math.round(total * 0.1)
                }
              })
            }}
            className="h-8 text-xs"
            placeholder={qtyPlaceholder}
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10.5px] text-gray-600">{unitCostLabel}</Label>
            <span className="text-[9px] text-gray-400 font-normal">{unitCostHint}</span>
          </div>
          <Input
            type="number"
            value={customOptions.renovagroCostPerHa || ''}
            onChange={(e) => {
              const cost = Number(e.target.value)
              setCustomOptions(prev => {
                const qty = prev.renovagroAreaHa || 0
                const total = qty * cost
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
            placeholder={unitCostPlaceholder}
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
          <div className="flex items-center justify-between">
            <Label className="text-[10.5px] text-gray-600">Financiamento (R$) *</Label>
            <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 rounded font-medium">90% Teto</span>
          </div>
          <Input
            type="number"
            value={customOptions.renovagroFinanced || ''}
            onChange={(e) => {
              const val = Number(e.target.value)
              setCustomOptions(prev => ({
                ...prev,
                renovagroFinanced: val,
                renovagroOwnResources: Math.max(0, (prev.renovagroTotalInvestment || 0) - val)
              }))
            }}
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
