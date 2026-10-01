'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CustomOptions } from '../../../types/wizard-types'
import { findOfficialCreditLine } from '@/lib/constants/credit-lines-catalog'

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
  'Máquinas e Equipamentos de Baixo Carbono',
  'Construção de Silos e Armazenagem (PCA)',
]

/**
 * Detecta se a sublinha ou a linha oficial envolve semoventes, máquinas, equipamentos ou infraestrutura física,
 * ou se é voltada a solo, pastagem e recuperação vegetal.
 */
export function isAnimalOrEquipmentSubline(subline?: string, lineId?: string): boolean {
  if (lineId === 'MODERFROTA' || lineId === 'PCA' || lineId === 'PRONAF_MAIS_ALIMENTOS_SEMI_FIXO' || lineId === 'PRONAF_MAIS_ALIMENTOS_FIXO') {
    return true
  }
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
    s.includes('implemento') ||
    s.includes('colheitadeira') ||
    s.includes('silo') ||
    s.includes('armazém') ||
    s.includes('armazem') ||
    s.includes('construção') ||
    s.includes('construcao')
  )
}

export function RenovagroParams({ customOptions, setCustomOptions }: ParamsProps) {
  const currentLine = findOfficialCreditLine(customOptions.creditLineId)
  const isAnimalOrEquipment = isAnimalOrEquipmentSubline(customOptions.renovagroSubline, customOptions.creditLineId)

  // Rótulos e placeholders dinâmicos que reagem à destinação técnica
  const qtyLabel = isAnimalOrEquipment
    ? 'Item Financiável / Quantidade *'
    : 'Área a Recuperar / Explorada (ha) *'
  const qtyPlaceholder = isAnimalOrEquipment ? 'Ex: 40' : 'Ex: 50'
  const qtyUnitHint = isAnimalOrEquipment ? 'Cabeças / Unidades' : 'Hectares (ha)'

  const unitCostLabel = isAnimalOrEquipment
    ? 'Valor Unitário (R$) *'
    : 'Custo por Hectare (R$) *'
  const unitCostPlaceholder = isAnimalOrEquipment ? 'Ex: 4000' : 'Ex: 3850'
  const unitCostHint = isAnimalOrEquipment ? 'R$ por cabeça / unidade' : 'R$ por hectare'
  const defaultUnitCost = isAnimalOrEquipment ? 4000 : 3850

  // Itens sugeridos para seleção rápida
  const suggestedPills = currentLine?.suggestedItems && currentLine.suggestedItems.length > 0
    ? currentLine.suggestedItems
    : RENOVAGRO_SUBLINES

  // Estados de pendência dos campos obrigatórios
  const isSublinePending = !customOptions.renovagroSubline?.trim()
  const isAreaPending = !customOptions.renovagroAreaHa || Number(customOptions.renovagroAreaHa) <= 0
  const isCostPending = !customOptions.renovagroCostPerHa || Number(customOptions.renovagroCostPerHa) <= 0
  const isTotalPending = !customOptions.renovagroTotalInvestment || Number(customOptions.renovagroTotalInvestment) <= 0
  const isFinancedPending = !customOptions.renovagroFinanced || Number(customOptions.renovagroFinanced) <= 0

  return (
    <div className="space-y-4 pt-3 border-t border-gray-100">
      {/* Banner de Identificação do Eixo de Investimento */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wide block">
            Parâmetros de Investimento Rural
          </span>
          <span className="text-[11px] text-muted-foreground">
            {currentLine ? currentLine.name : 'Programa RENOVAGRO / Linhas de Investimento'}
          </span>
        </div>
        <span
          className={cn(
            'text-[10px] px-2 py-0.5 rounded-full border transition-colors font-semibold',
            isAnimalOrEquipment
              ? 'text-blue-700 bg-blue-50 border-blue-200'
              : 'text-emerald-700 bg-emerald-50 border-emerald-200'
          )}
        >
          {isAnimalOrEquipment ? 'Bens Físicos / Semoventes / Máquinas' : 'Manejo Sustentável (Solo / Pastagem)'}
        </span>
      </div>

      {/* Sublinha / Finalidade Técnica */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-gray-700 font-semibold">
            {isAnimalOrEquipment ? 'Finalidade / Item Financiado *' : 'Sublinha do Programa / Destinação *'}
          </Label>
          <span
            className={cn(
              'text-[9.5px] font-medium px-1.5 py-0.2 rounded border transition-colors',
              !isSublinePending
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-amber-700 bg-amber-50 border-amber-200 font-bold'
            )}
          >
            {!isSublinePending ? 'Preenchido' : 'Obrigatório'}
          </span>
        </div>
        <Input
          id="field-renovagro-subline"
          value={customOptions.renovagroSubline || ''}
          onChange={(e) => setCustomOptions((prev) => ({ ...prev, renovagroSubline: e.target.value }))}
          className={cn(
            'h-9 text-xs transition-colors',
            isSublinePending
              ? 'border-amber-400 bg-amber-50/20 focus-visible:ring-amber-400 focus:border-amber-500'
              : 'border-gray-200 bg-white focus-visible:ring-emerald-500'
          )}
          placeholder="Selecione abaixo ou digite a especificação..."
        />
        <div className="flex flex-wrap gap-1 pt-0.5">
          {suggestedPills.map((sub) => {
            const isSelected = customOptions.renovagroSubline === sub
            return (
              <button
                key={sub}
                type="button"
                onClick={() => {
                  setCustomOptions((prev) => {
                    const wasAnimal = isAnimalOrEquipmentSubline(prev.renovagroSubline, prev.creditLineId)
                    const nowAnimal = isAnimalOrEquipmentSubline(sub, prev.creditLineId)
                    let cost = prev.renovagroCostPerHa
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
                  'text-[9.5px] px-2 py-1 rounded-md border transition-all cursor-pointer text-left',
                  isSelected
                    ? 'bg-emerald-100 text-[#1B4D3E] border-emerald-300 font-bold shadow-2xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:text-[#1B4D3E]'
                )}
              >
                {sub}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid de Quantidade e Valor Unitário Reativo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-gray-700 font-semibold">{qtyLabel}</Label>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'text-[9.5px] font-medium px-1.5 py-0.2 rounded border transition-colors',
                  !isAreaPending
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-amber-700 bg-amber-50 border-amber-200 font-bold'
                )}
              >
                {!isAreaPending ? 'Preenchido' : 'Obrigatório'}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">{qtyUnitHint}</span>
            </div>
          </div>
          <Input
            id="field-renovagro-area"
            type="number"
            value={customOptions.renovagroAreaHa || ''}
            onChange={(e) => {
              const qty = Number(e.target.value)
              setCustomOptions((prev) => {
                const cost = prev.renovagroCostPerHa || defaultUnitCost
                const total = qty * cost
                return {
                  ...prev,
                  renovagroAreaHa: qty,
                  renovagroCostPerHa: cost,
                  renovagroTotalInvestment: total,
                  renovagroFinanced: Math.round(total * 0.9),
                  renovagroOwnResources: Math.round(total * 0.1),
                }
              })
            }}
            className={cn(
              'h-9 text-xs transition-colors',
              isAreaPending
                ? 'border-amber-400 bg-amber-50/20 focus-visible:ring-amber-400 focus:border-amber-500'
                : 'border-gray-200 bg-white focus-visible:ring-emerald-500'
            )}
            placeholder={qtyPlaceholder}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-gray-700 font-semibold">{unitCostLabel}</Label>
            <span className="text-[10px] text-gray-500 font-medium">{unitCostHint}</span>
          </div>
          <Input
            id="field-renovagro-cost"
            type="number"
            value={customOptions.renovagroCostPerHa || ''}
            onChange={(e) => {
              const cost = Number(e.target.value)
              setCustomOptions((prev) => {
                const qty = prev.renovagroAreaHa || 0
                const total = qty * cost
                return {
                  ...prev,
                  renovagroCostPerHa: cost,
                  renovagroTotalInvestment: total,
                  renovagroFinanced: Math.round(total * 0.9),
                  renovagroOwnResources: Math.round(total * 0.1),
                }
              })
            }}
            className={cn(
              'h-9 text-xs transition-colors',
              isCostPending
                ? 'border-amber-400 bg-amber-50/20 focus-visible:ring-amber-400 focus:border-amber-500'
                : 'border-gray-200 bg-white focus-visible:ring-emerald-500'
            )}
            placeholder={unitCostPlaceholder}
          />
        </div>
      </div>

      {/* Investimento Total e Financiamento (90% teto) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-gray-900">Investimento Total (R$) *</Label>
            <span
              className={cn(
                'text-[9.5px] font-medium px-1.5 py-0.2 rounded border transition-colors',
                !isTotalPending
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-amber-700 bg-amber-50 border-amber-200 font-bold'
              )}
            >
              {!isTotalPending ? 'Preenchido' : 'Obrigatório'}
            </span>
          </div>
          <Input
            id="field-renovagro-total"
            type="number"
            value={customOptions.renovagroTotalInvestment || ''}
            onChange={(e) => {
              const val = Number(e.target.value)
              setCustomOptions((prev) => ({
                ...prev,
                renovagroTotalInvestment: val,
                renovagroFinanced: Math.round(val * 0.9),
                renovagroOwnResources: Math.round(val * 0.1),
              }))
            }}
            className={cn(
              'h-9 text-xs font-bold transition-colors',
              isTotalPending
                ? 'border-amber-400 bg-amber-50/20 focus-visible:ring-amber-400 focus:border-amber-500 text-amber-900'
                : 'border-gray-200 bg-white text-[#1B4D3E] focus-visible:ring-emerald-500'
            )}
            placeholder="0,00"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-gray-700">Valor Financiado Solicitado (R$) *</Label>
            <span className="text-[9px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
              90% Teto
            </span>
          </div>
          <Input
            id="field-renovagro-financed"
            type="number"
            value={customOptions.renovagroFinanced || ''}
            onChange={(e) => {
              const val = Number(e.target.value)
              setCustomOptions((prev) => ({
                ...prev,
                renovagroFinanced: val,
                renovagroOwnResources: Math.max(0, (prev.renovagroTotalInvestment || 0) - val),
              }))
            }}
            className={cn(
              'h-9 text-xs transition-colors',
              isFinancedPending
                ? 'border-amber-400 bg-amber-50/20 focus-visible:ring-amber-400 focus:border-amber-500'
                : 'border-gray-200 bg-white focus-visible:ring-emerald-500'
            )}
            placeholder="0,00"
          />
        </div>
      </div>

      {/* Recursos Próprios (Contrapartida) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
        <span className="text-gray-600 font-medium">Contrapartida de Recursos Próprios (10%):</span>
        <span className="font-bold text-gray-900">
          R$ {(customOptions.renovagroOwnResources || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Condições Financeiras (Prazo, Carência, Juros) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700">Condições Regulamentares do Financiamento *</span>
          <button
            type="button"
            onClick={() =>
              setCustomOptions((prev) => ({
                ...prev,
                renovagroTermYears: currentLine?.defaultTermYears || 10,
                renovagroGraceMonths: currentLine?.defaultGraceMonths || 36,
                renovagroInterestRate: currentLine?.defaultInterestRate || 7.0,
              }))
            }
            className="text-[10px] text-emerald-700 hover:underline cursor-pointer font-semibold"
          >
            Restaurar taxas da linha ({currentLine?.defaultInterestRate || 7.0}% a.a.)
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-600">Prazo Total (anos) *</Label>
            <Input
              id="field-renovagro-term"
              type="number"
              value={customOptions.renovagroTermYears || ''}
              onChange={(e) =>
                setCustomOptions((prev) => ({ ...prev, renovagroTermYears: Number(e.target.value) }))
              }
              className={cn(
                "h-8 text-xs font-semibold transition-colors",
                (!customOptions.renovagroTermYears || Number(customOptions.renovagroTermYears) <= 0)
                  ? "border-amber-400 bg-amber-50/20 focus-visible:ring-amber-400 focus:border-amber-500"
                  : "border-gray-200 bg-white focus-visible:ring-emerald-500"
              )}
              placeholder={`Ex: ${currentLine?.defaultTermYears || 10}`}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-gray-600">Carência (meses)</Label>
            <Input
              id="field-renovagro-grace"
              type="number"
              value={customOptions.renovagroGraceMonths || ''}
              onChange={(e) =>
                setCustomOptions((prev) => ({ ...prev, renovagroGraceMonths: Number(e.target.value) }))
              }
              className="h-8 text-xs font-semibold bg-white border-gray-200 focus-visible:ring-emerald-500"
              placeholder={`Ex: ${currentLine?.defaultGraceMonths || 36}`}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-gray-600">Juros (% a.a.) *</Label>
            <Input
              id="field-renovagro-interest"
              type="number"
              step="0.1"
              value={customOptions.renovagroInterestRate || ''}
              onChange={(e) =>
                setCustomOptions((prev) => ({ ...prev, renovagroInterestRate: Number(e.target.value) }))
              }
              className={cn(
                "h-8 text-xs font-bold transition-colors",
                (!customOptions.renovagroInterestRate || Number(customOptions.renovagroInterestRate) <= 0)
                  ? "border-amber-400 bg-amber-50/20 focus-visible:ring-amber-400 focus:border-amber-500"
                  : "border-gray-200 bg-white text-emerald-800 focus-visible:ring-emerald-500"
              )}
              placeholder={`Ex: ${currentLine?.defaultInterestRate || 7.0}`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
