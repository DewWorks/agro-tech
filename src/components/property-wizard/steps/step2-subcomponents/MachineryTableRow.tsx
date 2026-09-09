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
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2 } from 'lucide-react'
import { MACHINERY_CATEGORIES } from '@/lib/validations/property-wizard'

interface MachineryTableRowProps {
  index: number
  fieldItem: any
  register: UseFormRegister<any>
  setValue: UseFormSetValue<any>
  watch: UseFormWatch<any>
  remove: (index: number) => void
}

export const MachineryTableRow = React.memo(function MachineryTableRow({
  index,
  fieldItem,
  register,
  setValue,
  watch,
  remove,
}: MachineryTableRowProps) {
  const hasLien = watch(`machineries.${index}.hasLien`)
  const currentCategory = watch(`machineries.${index}.category`) || fieldItem.category

  return (
    <TableRow className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
      {/* Categoria */}
      <TableCell className="p-2 align-middle">
        <Select
          value={currentCategory}
          onValueChange={(val) =>
            setValue(`machineries.${index}.category`, val || '', { shouldValidate: true })
          }
        >
          <SelectTrigger className="h-9 text-xs w-full">
            <SelectValue placeholder="Selecione">
              {currentCategory}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {MACHINERY_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-xs">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Marca */}
      <TableCell className="p-2 align-middle">
        <Input
          placeholder="Ex: John Deere"
          className="h-9 text-xs"
          {...register(`machineries.${index}.brand`)}
        />
      </TableCell>

      {/* Modelo */}
      <TableCell className="p-2 align-middle">
        <Input
          placeholder="Ex: 6110J"
          className="h-9 text-xs"
          {...register(`machineries.${index}.model`)}
        />
      </TableCell>

      {/* Ano */}
      <TableCell className="p-2 align-middle">
        <Input
          type="number"
          min={1950}
          max={new Date().getFullYear() + 1}
          placeholder="2022"
          className="h-9 text-xs font-mono text-center"
          {...register(`machineries.${index}.year`, { valueAsNumber: true })}
        />
      </TableCell>

      {/* Chassi / Série */}
      <TableCell className="p-2 align-middle">
        <Input
          placeholder="Ex: 1BM6110JJLH00123"
          className="h-9 text-xs font-mono uppercase"
          {...register(`machineries.${index}.chassisSerial`)}
        />
      </TableCell>

      {/* Valor de Mercado */}
      <TableCell className="p-2 align-middle">
        <Input
          type="number"
          step="1000"
          placeholder="R$ 0,00"
          className="h-9 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
          {...register(`machineries.${index}.value`, { valueAsNumber: true })}
        />
      </TableCell>

      {/* Gravame / Penhor */}
      <TableCell className="p-2 align-middle">
        <div className="flex flex-col justify-center gap-1.5 py-0.5">
          <div className="flex items-center space-x-2 h-7">
            <Checkbox
              id={`lien-${index}`}
              checked={hasLien}
              onCheckedChange={(checked) =>
                setValue(`machineries.${index}.hasLien`, !!checked, { shouldValidate: true })
              }
            />
            <label
              htmlFor={`lien-${index}`}
              className="text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
            >
              {hasLien ? 'Alienado' : 'Livre de Ônus'}
            </label>
          </div>
          {hasLien && (
            <Input
              placeholder="Banco / Credor"
              className="h-8 text-xs border-amber-300 bg-amber-50/50 dark:bg-amber-950/20"
              {...register(`machineries.${index}.lienInstitution`)}
            />
          )}
        </div>
      </TableCell>

      {/* Ações */}
      <TableCell className="p-2 align-middle text-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => remove(index)}
          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          title="Remover máquina"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
})

MachineryTableRow.displayName = 'MachineryTableRow'
