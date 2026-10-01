'use client'

import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Wheat, Plus, Trash2 } from 'lucide-react'

interface AgroRevenuesSectionProps {
  activeForm: UseFormReturn<any>
  showDetailedRevenues: boolean
  setShowDetailedRevenues: (v: boolean | ((prev: boolean) => boolean)) => void
  customAgroFields: any[]
  appendAgro: (val: any) => void
  removeAgro: (idx: number) => void
  formatBRL: (val: number) => string
}

export function AgroRevenuesSection({
  activeForm,
  showDetailedRevenues,
  customAgroFields,
  appendAgro,
  removeAgro,
  formatBRL,
}: AgroRevenuesSectionProps) {
  const { watch, setValue, register } = activeForm

  if (!showDetailedRevenues) return null

  return (
    <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
          <Wheat className="w-3.5 h-3.5 text-emerald-700" />
          Culturas e Atividades Detalhadas da Safra
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            appendAgro({
              activityType: 'AGRICOLA_GRAOS',
              realizationType: 'PROJETADA_SAFRA',
              description: '',
              quantity: 0,
              unit: 'sc',
              unitPrice: 0,
              productionCostTotal: 0,
            })
          }
          className="text-xs h-7 border-emerald-300 text-emerald-800 hover:bg-emerald-100 cursor-pointer gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar Cultura / Safra
        </Button>
      </div>

      {customAgroFields.length === 0 ? (
        <p className="text-xs text-emerald-700/80 italic py-1">
          Você pode usar os campos consolidados abaixo ou discriminar linha a linha (ex: Soja, Milho, Bezerros Nelore).
        </p>
      ) : (
        <div className="space-y-2">
          {customAgroFields.map((field, idx) => {
            const qty = Number(watch(`customAgroRevenues.${idx}.quantity`)) || 0
            const prc = Number(watch(`customAgroRevenues.${idx}.unitPrice`)) || 0
            const cost = Number(watch(`customAgroRevenues.${idx}.productionCostTotal`)) || 0
            const net = Math.max(0, qty * prc - cost)

            return (
              <div
                key={field.id}
                className="p-2.5 bg-white border border-emerald-200 rounded-lg grid grid-cols-1 sm:grid-cols-6 gap-2 items-center"
              >
                <div className="sm:col-span-1">
                  <Label className="text-[10px] text-slate-500">Safra</Label>
                  <Select
                    value={watch(`customAgroRevenues.${idx}.realizationType`) || 'PROJETADA_SAFRA'}
                    onValueChange={(val) => setValue(`customAgroRevenues.${idx}.realizationType`, val)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROJETADA_SAFRA">Projetada (Safra Vigente)</SelectItem>
                      <SelectItem value="EFETIVA_HISTORICA">Efetiva (Safra Anterior)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-[10px] text-slate-500">Cultura / Atividade</Label>
                  <Input
                    placeholder="Ex: Soja Grão Comercial"
                    className="h-8 text-xs"
                    {...register(`customAgroRevenues.${idx}.description`)}
                  />
                </div>

                <div className="sm:col-span-1">
                  <Label className="text-[10px] text-slate-500">Qtd × Preço (R$)</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      placeholder="Qtd"
                      className="h-8 text-xs font-semibold text-slate-900 dark:text-slate-100"
                      {...register(`customAgroRevenues.${idx}.quantity`, { valueAsNumber: true })}
                    />
                    <Input
                      type="number"
                      placeholder="Preço"
                      className="h-8 text-xs font-semibold text-slate-900 dark:text-slate-100"
                      {...register(`customAgroRevenues.${idx}.unitPrice`, { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="sm:col-span-1">
                  <Label className="text-[10px] text-slate-500">Custo Total (R$)</Label>
                  <Input
                    type="number"
                    placeholder="Custo"
                    className="h-8 text-xs font-semibold text-slate-900 dark:text-slate-100"
                    {...register(`customAgroRevenues.${idx}.productionCostTotal`, { valueAsNumber: true })}
                  />
                </div>

                <div className="sm:col-span-1 flex items-center justify-between">
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 block">Líquido</span>
                    <span className="text-xs font-bold text-emerald-700">{formatBRL(net)}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAgro(idx)}
                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
