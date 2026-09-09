import React from 'react'
import { Building2, Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { BB_IMPROVEMENTS_CATALOG } from '@/lib/validations/reference-data'
import { CustomOptions } from '../../../types/wizard-types'

interface Step3CreditImprovementsProps {
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
  onBack: () => void
  onAdvance: () => void
  totalPatrimony: number
}

export function Step3CreditImprovements({
  customOptions,
  setCustomOptions,
  onBack,
  onAdvance,
  totalPatrimony
}: Step3CreditImprovementsProps) {
  const improvementItems = customOptions.improvementItems || []

  const updateImprovements = (items: typeof improvementItems) => {
    const totalVal = items.reduce((acc, imp) => acc + (Number(imp.totalValue) || 0), 0)
    setCustomOptions(prev => ({
      ...prev,
      improvementItems: items,
      improvementsValue: totalVal
    }))
  }

  const addImprovementFromCatalog = (spec: string, unit: string, unitVal: number) => {
    const newItems = [
      ...improvementItems,
      {
        id: Math.random().toString(),
        specification: spec,
        unit: unit,
        quantity: 1,
        unitValue: unitVal,
        totalValue: unitVal,
        conservationState: 'Bom'
      }
    ]
    updateImprovements(newItems)
  }

  const removeImprovement = (idx: number) => {
    const newItems = improvementItems.filter((_, i) => i !== idx)
    updateImprovements(newItems)
  }

  const updateImprovementQuantity = (idx: number, qty: number) => {
    const newItems = [...improvementItems]
    const unitVal = Number(newItems[idx].unitValue || 0)
    newItems[idx] = {
      ...newItems[idx],
      quantity: qty,
      totalValue: Math.round(qty * unitVal)
    }
    updateImprovements(newItems)
  }

  const cattleHeads = Number(customOptions.livestockCattleHeads) || 0
  const cattleHeadPrice = Number(customOptions.livestockCattleHeadValue) || 2800
  const cattleEstimated = cattleHeads * cattleHeadPrice

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#1B4D3E]" />
            Passo 3: Benfeitorias, Instalações & Rebanho
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Selecione no catálogo do Banco do Brasil ou preencha as edificações e semoventes para a avaliação patrimonial.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-muted-foreground block">Patrimônio Bruto Calculado:</span>
          <span className="text-sm font-extrabold text-[#1B4D3E]">
            R$ {totalPatrimony.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Catálogo Rápido do BB */}
      <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
            Catálogo Oficial de Benfeitorias (Banco do Brasil):
          </span>
          <span className="text-[10px] text-emerald-800">Clique para adicionar rapidamente</span>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {BB_IMPROVEMENTS_CATALOG.slice(0, 8).map((cat) => (
            <button
              key={cat.specification}
              type="button"
              onClick={() => addImprovementFromCatalog(cat.specification, cat.unit, cat.suggestedValue)}
              className="text-[10.5px] bg-white hover:bg-emerald-100/80 text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer font-medium shadow-2xs"
            >
              <Plus className="h-3 w-3 text-emerald-700" />
              {cat.specification} (R$ {cat.suggestedValue}/{cat.unit})
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Benfeitorias */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-800 block">
            Benfeitorias Adicionadas ({improvementItems.length})
          </span>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-gray-600">Total Benfeitorias (R$):</Label>
            <Input
              type="number"
              value={customOptions.improvementsValue || ''}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, improvementsValue: Number(e.target.value) }))}
              className="h-8 w-36 text-xs font-bold bg-white text-right"
              placeholder="0,00"
            />
          </div>
        </div>

        {improvementItems.length === 0 ? (
          <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
            <p className="text-xs text-gray-500">
              Nenhuma benfeitoria selecionada. Use o catálogo acima ou digite o valor consolidado.
            </p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-x-auto bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-semibold">
                  <th className="p-3">Especificação da Benfeitoria</th>
                  <th className="p-3 w-28 text-center">Quantidade</th>
                  <th className="p-3 w-20 text-center">Unidade</th>
                  <th className="p-3 text-right">Valor Unitário (R$)</th>
                  <th className="p-3 text-right">Subtotal (R$)</th>
                  <th className="p-3 w-12 text-center">Excluir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {improvementItems.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/60">
                    <td className="p-3 font-medium text-gray-900">{item.specification}</td>
                    <td className="p-2 text-center">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity || ''}
                        onChange={(e) => updateImprovementQuantity(idx, Number(e.target.value))}
                        className="h-8 w-20 mx-auto text-xs text-center font-bold bg-white"
                      />
                    </td>
                    <td className="p-3 text-center text-gray-500 font-mono">{item.unit}</td>
                    <td className="p-3 text-right text-gray-600 font-mono">
                      R$ {Number(item.unitValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-bold text-gray-900 font-mono">
                      R$ {Number(item.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeImprovement(idx)}
                        className="h-7 w-7 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bloco de Semoventes / Rebanho */}
      <div className="p-4 bg-slate-50 border border-gray-200 rounded-xl space-y-3">
        <span className="text-xs font-bold text-gray-800 uppercase tracking-wide block">
          Rebanho Bovino & Semoventes do Imóvel
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-gray-600 font-semibold">Total de Cabeças (Bovinos)</Label>
            <Input
              type="number"
              value={customOptions.livestockCattleHeads || ''}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, livestockCattleHeads: Number(e.target.value) }))}
              className="h-9 text-xs font-bold bg-white"
              placeholder="Ex: 150"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-gray-600 font-semibold">Valor Médio por Cabeça (R$)</Label>
            <Input
              type="number"
              value={customOptions.livestockCattleHeadValue || ''}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, livestockCattleHeadValue: Number(e.target.value) }))}
              className="h-9 text-xs font-bold bg-white"
              placeholder="2800"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-gray-600 font-semibold text-[#1B4D3E]">Total Estimado do Rebanho</Label>
            <div className="h-9 flex items-center px-3 bg-white border border-gray-200 rounded-md text-xs font-bold text-[#1B4D3E]">
              R$ {cattleEstimated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="text-xs h-10 px-5 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar: Máquinas
        </Button>
        <Button
          type="button"
          onClick={onAdvance}
          className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-semibold h-10 px-6 rounded-xl shadow-xs"
        >
          Avançar: Finanças & RT
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>
    </div>
  )
}
