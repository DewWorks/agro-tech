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
  ANIMAL_CATEGORIES_BB,
  ANIMAL_PURPOSES_BB,
  LIVESTOCK_BREEDS,
  LIVESTOCK_MARKINGS,
  LIVESTOCK_MARKING_LOCATIONS,
} from '@/lib/validations/reference-data'
import { SmartCreatableCombobox } from '../../subcomponents/SmartCreatableCombobox'

interface LivestockTableRowProps {
  index: number
  fieldItem: any
  register: UseFormRegister<any>
  setValue: UseFormSetValue<any>
  watch?: UseFormWatch<any>
  control?: any
  remove: (index: number) => void
}

export const LivestockTableRow = React.memo(function LivestockTableRow({
  index,
  fieldItem,
  register,
  setValue,
  control: propControl,
  remove,
}: LivestockTableRowProps) {
  const context = useFormContext()
  const control = propControl || context?.control

  const currentCategory = useWatch({
    control,
    name: `livestocks.${index}.category`,
    defaultValue: fieldItem.category || 'Vaca',
  })
  const currentPurpose = useWatch({
    control,
    name: `livestocks.${index}.purpose`,
    defaultValue: fieldItem.purpose || 'Produção de Crias',
  })
  const currentBreed = useWatch({
    control,
    name: `livestocks.${index}.breed`,
    defaultValue: fieldItem.breed || 'Nelore',
  })
  const currentMarking = useWatch({
    control,
    name: `livestocks.${index}.markingType`,
    defaultValue: fieldItem.markingType || fieldItem.brandingType || 'Ferro Quente',
  })
  const currentMarkingLocation = useWatch({
    control,
    name: `livestocks.${index}.markingLocation`,
    defaultValue: fieldItem.markingLocation || fieldItem.brandingLocation || 'Perna Traseira Direita',
  })

  const qty = Number(useWatch({
    control,
    name: `livestocks.${index}.quantity`,
    defaultValue: fieldItem.quantity || 0,
  })) || 0
  const unitVal = Number(useWatch({
    control,
    name: `livestocks.${index}.unitValue`,
    defaultValue: fieldItem.unitValue || 0,
  })) || 0
  const rowTotal = Math.round(qty * unitVal * 100) / 100

  return (
    <TableRow className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
      {/* Categoria BB */}
      <TableCell className="p-2 align-middle min-w-[160px]">
        <Select
          value={currentCategory}
          onValueChange={(val) => {
            if (!val) return
            setValue(`livestocks.${index}.category`, val, { shouldValidate: true })
            setValue(`livestocks.${index}.categoryBB`, val, { shouldValidate: true })
          }}
        >
          <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full">
            <SelectValue placeholder="Selecione Categoria BB">
              {currentCategory}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {ANIMAL_CATEGORIES_BB.map((c) => (
              <SelectItem key={c} value={c} className="text-xs">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Finalidade BB */}
      <TableCell className="p-2 align-middle min-w-[150px]">
        <Select
          value={currentPurpose}
          onValueChange={(val) => {
            if (!val) return
            setValue(`livestocks.${index}.purpose`, val, { shouldValidate: true })
            setValue(`livestocks.${index}.purposeBB`, val, { shouldValidate: true })
          }}
        >
          <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full">
            <SelectValue placeholder="Finalidade BB">
              {currentPurpose}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {ANIMAL_PURPOSES_BB.map((p) => (
              <SelectItem key={p} value={p} className="text-xs">
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Raça (Combobox Aberto) */}
      <TableCell className="p-2 align-middle min-w-[140px]">
        <SmartCreatableCombobox
          value={currentBreed}
          onChange={(val) => {
            setValue(`livestocks.${index}.breed`, val, { shouldValidate: true })
          }}
          options={LIVESTOCK_BREEDS}
          placeholder="Raça"
          searchPlaceholder="Buscar ou digitar raça..."
          className="h-9 text-xs"
        />
      </TableCell>

      {/* Cabeças */}
      <TableCell className="p-2 align-middle">
        <Input
          type="number"
          min="0"
          {...register(`livestocks.${index}.quantity`, { valueAsNumber: true })}
          className="h-9 text-xs text-center font-mono font-bold bg-white dark:bg-slate-900"
        />
      </TableCell>

      {/* Idade */}
      <TableCell className="p-2 align-middle">
        <Input
          type="number"
          min="0"
          placeholder="m"
          {...register(`livestocks.${index}.ageMonths`, { valueAsNumber: true })}
          className="h-9 text-xs text-center font-mono bg-white dark:bg-slate-900"
        />
      </TableCell>

      {/* Peso */}
      <TableCell className="p-2 align-middle">
        <Input
          type="number"
          min="0"
          placeholder="kg"
          {...register(`livestocks.${index}.avgWeightKg`, { valueAsNumber: true })}
          className="h-9 text-xs text-center font-mono bg-white dark:bg-slate-900"
        />
      </TableCell>

      {/* Valor Unitário */}
      <TableCell className="p-2 align-middle">
        <Input
          type="number"
          step="any"
          {...register(`livestocks.${index}.unitValue`, { valueAsNumber: true })}
          className="h-9 text-xs font-mono bg-white dark:bg-slate-900"
        />
      </TableCell>

      {/* Total Calculado */}
      <TableCell className="p-2 align-middle">
        <div className="h-9 flex items-center font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
          R$ {rowTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </TableCell>

      {/* Marcação */}
      <TableCell className="p-2 align-middle">
        <Select
          value={currentMarking}
          onValueChange={(val) => {
            if (!val) return
            setValue(`livestocks.${index}.markingType`, val, { shouldValidate: true })
            setValue(`livestocks.${index}.brandingType`, val, { shouldValidate: true })
          }}
        >
          <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full">
            <SelectValue placeholder="Marcação">
              {currentMarking}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LIVESTOCK_MARKINGS.map((m) => (
              <SelectItem key={m} value={m} className="text-xs">
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Local da Marca */}
      <TableCell className="p-2 align-middle">
        <Select
          value={currentMarkingLocation}
          onValueChange={(val) => {
            if (!val) return
            setValue(`livestocks.${index}.markingLocation`, val, { shouldValidate: true })
            setValue(`livestocks.${index}.brandingLocation`, val, { shouldValidate: true })
          }}
        >
          <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full">
            <SelectValue placeholder="Local">
              {currentMarkingLocation}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LIVESTOCK_MARKING_LOCATIONS.map((loc) => (
              <SelectItem key={loc} value={loc} className="text-xs">
                {loc}
              </SelectItem>
            ))}
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

LivestockTableRow.displayName = 'LivestockTableRow'
