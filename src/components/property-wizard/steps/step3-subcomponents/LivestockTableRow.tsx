'use client'

import React from 'react'
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form'
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
  LIVESTOCK_CATEGORIES,
  LIVESTOCK_BREEDS,
  LIVESTOCK_PURPOSES,
  LIVESTOCK_MARKINGS,
  LIVESTOCK_MARKING_LOCATIONS,
} from '@/lib/validations/property-wizard'

interface LivestockTableRowProps {
  index: number
  fieldItem: any
  register: UseFormRegister<any>
  setValue: UseFormSetValue<any>
  watch: UseFormWatch<any>
  remove: (index: number) => void
}

export const LivestockTableRow = React.memo(function LivestockTableRow({
  index,
  fieldItem,
  register,
  setValue,
  watch,
  remove,
}: LivestockTableRowProps) {
  const currentCategory = watch(`livestocks.${index}.category`) || fieldItem.category || 'Matrizes (Vacas)'
  const currentPurpose = watch(`livestocks.${index}.purpose`) || fieldItem.purpose || 'Cria'
  const currentBreed = watch(`livestocks.${index}.breed`) || fieldItem.breed || 'Nelore'
  const currentMarking = watch(`livestocks.${index}.markingType`) || fieldItem.markingType || 'Ferro Quente'
  const currentMarkingLocation = watch(`livestocks.${index}.markingLocation`) || fieldItem.markingLocation || 'Perna Traseira Direita'

  const qty = Number(watch(`livestocks.${index}.quantity`)) || 0
  const unitVal = Number(watch(`livestocks.${index}.unitValue`)) || 0
  const rowTotal = Math.round(qty * unitVal * 100) / 100

  return (
    <TableRow className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
      {/* Categoria */}
      <TableCell className="p-2 align-middle">
        <Select
          value={currentCategory}
          onValueChange={(val) => setValue(`livestocks.${index}.category`, val, { shouldValidate: true })}
        >
          <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {LIVESTOCK_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="text-xs">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Finalidade */}
      <TableCell className="p-2 align-middle">
        <Select
          value={currentPurpose}
          onValueChange={(val) => setValue(`livestocks.${index}.purpose`, val, { shouldValidate: true })}
        >
          <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full">
            <SelectValue placeholder="Finalidade" />
          </SelectTrigger>
          <SelectContent>
            {LIVESTOCK_PURPOSES.map((p) => (
              <SelectItem key={p} value={p} className="text-xs">
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Raça */}
      <TableCell className="p-2 align-middle">
        <Select
          value={currentBreed}
          onValueChange={(val) => setValue(`livestocks.${index}.breed`, val, { shouldValidate: true })}
        >
          <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full">
            <SelectValue placeholder="Raça" />
          </SelectTrigger>
          <SelectContent>
            {LIVESTOCK_BREEDS.map((b) => (
              <SelectItem key={b} value={b} className="text-xs">
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          onValueChange={(val) => setValue(`livestocks.${index}.markingType`, val, { shouldValidate: true })}
        >
          <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full">
            <SelectValue placeholder="Marcação" />
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
          onValueChange={(val) => setValue(`livestocks.${index}.markingLocation`, val, { shouldValidate: true })}
        >
          <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full">
            <SelectValue placeholder="Local" />
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
