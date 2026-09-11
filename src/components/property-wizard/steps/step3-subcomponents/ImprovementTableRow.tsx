'use client'

import React from 'react'
import { UseFormRegister, UseFormSetValue, UseFormWatch, useWatch, useFormContext, Control } from 'react-hook-form'
import { TableCell, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2 } from 'lucide-react'
import {
  BB_IMPROVEMENTS_CATALOG,
  IMPROVEMENT_UNITS,
} from '@/lib/validations/property-wizard'

const CONSERVATION_LABELS: Record<string, string> = {
  OTIMO: 'Ótimo',
  BOM: 'Bom',
  REGULAR: 'Regular',
  RUIM: 'Ruim',
  NOVO: 'Novo',
}

interface ImprovementTableRowProps {
  index: number
  fieldItem: any
  register: UseFormRegister<any>
  setValue: UseFormSetValue<any>
  watch?: UseFormWatch<any>
  control?: any
  remove: (index: number) => void
}

export const ImprovementTableRow = React.memo(function ImprovementTableRow({
  index,
  fieldItem,
  register,
  setValue,
  control: propControl,
  remove,
}: ImprovementTableRowProps) {
  const context = useFormContext()
  const control = propControl || context?.control

  const currentSpec = useWatch({
    control,
    name: `improvements.${index}.specification`,
    defaultValue: fieldItem.specification || '',
  })
  const currentUnit = useWatch({
    control,
    name: `improvements.${index}.unit`,
    defaultValue: fieldItem.unit || 'm²',
  })
  const currentConservation = useWatch({
    control,
    name: `improvements.${index}.conservationState`,
    defaultValue: fieldItem.conservationState || 'BOM',
  })
  const qty = Number(useWatch({
    control,
    name: `improvements.${index}.quantity`,
    defaultValue: fieldItem.quantity || 0,
  })) || 0
  const unitVal = Number(useWatch({
    control,
    name: `improvements.${index}.unitValue`,
    defaultValue: fieldItem.unitValue || 0,
  })) || 0
  const subtotal = Math.round(qty * unitVal * 100) / 100

  return (
    <TableRow className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
      {/* Especificação */}
      <TableCell className="p-2 align-middle">
        <Select
          value={currentSpec}
          onValueChange={(val) => {
            if (!val) return
            setValue(`improvements.${index}.specification`, val, { shouldValidate: true })
            const cat = BB_IMPROVEMENTS_CATALOG.find((c) => c.specification === val)
            if (cat) {
              setValue(`improvements.${index}.unit`, cat.unit, { shouldValidate: true })
              setValue(`improvements.${index}.unitValue`, cat.suggestedValue, { shouldValidate: true })
            }
          }}
        >
          <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full">
            <SelectValue placeholder="Selecione a benfeitoria">
              {currentSpec}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {BB_IMPROVEMENTS_CATALOG.map((cat) => (
              <SelectItem key={cat.specification} value={cat.specification} className="text-xs">
                {cat.specification} ({cat.unit})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Unidade */}
      <TableCell className="p-2 align-middle">
        <Select
          value={currentUnit}
          onValueChange={(val) => {
            if (!val) return
            setValue(`improvements.${index}.unit`, val, { shouldValidate: true })
          }}
        >
          <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full">
            <SelectValue placeholder="Un.">
              {currentUnit}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {IMPROVEMENT_UNITS.map((u) => (
              <SelectItem key={u} value={u} className="text-xs">
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Quantidade */}
      <TableCell className="p-2 align-middle">
        <Input
          type="number"
          step="any"
          {...register(`improvements.${index}.quantity`, { valueAsNumber: true })}
          className="h-9 text-xs text-center font-mono font-bold bg-white dark:bg-slate-900"
        />
      </TableCell>

      {/* Valor Unitário */}
      <TableCell className="p-2 align-middle">
        <Input
          type="number"
          step="any"
          {...register(`improvements.${index}.unitValue`, { valueAsNumber: true })}
          className="h-9 text-xs font-mono bg-white dark:bg-slate-900"
        />
      </TableCell>

      {/* Subtotal Calculado */}
      <TableCell className="p-2 align-middle">
        <div className="h-9 flex items-center font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
          R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </TableCell>

      {/* Estado de Conservação */}
      <TableCell className="p-2 align-middle">
        <Select
          value={currentConservation}
          onValueChange={(val) => {
            if (!val) return
            setValue(`improvements.${index}.conservationState`, val, { shouldValidate: true })
          }}
        >
          <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <SelectValue placeholder="Conservação">
              {CONSERVATION_LABELS[currentConservation] || currentConservation}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OTIMO">Ótimo</SelectItem>
            <SelectItem value="BOM">Bom</SelectItem>
            <SelectItem value="REGULAR">Regular</SelectItem>
            <SelectItem value="RUIM">Ruim</SelectItem>
            <SelectItem value="NOVO">Novo</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>

      {/* Ações */}
      <TableCell className="p-2 text-center align-middle">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => remove(index)}
          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
})

ImprovementTableRow.displayName = 'ImprovementTableRow'
