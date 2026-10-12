'use client'

import React, { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Calendar, Clock, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CommercialDualTermInputProps {
  label: string
  helperText?: string
  totalMonths: number
  onChangeMonths: (months: number) => void
  minMonths?: number
  maxMonths?: number
  className?: string
  disabled?: boolean
}

/**
 * Componente de Prazo Dual (Meses & Anos) sincronizado
 * baseado na convenção do Ano Comercial Agrícola (360 dias = 12 meses = 1 ano).
 */
export function CommercialDualTermInput({
  label,
  helperText = 'Base: Ano Comercial de 360 dias (1 ano = 12 meses)',
  totalMonths,
  onChangeMonths,
  minMonths = 0,
  maxMonths = 240,
  className,
  disabled = false,
}: CommercialDualTermInputProps) {
  // Sincronizar anos internamente com precisão decimal quando fracionário
  const currentMonths = Number(totalMonths) || 0
  const currentYears = (currentMonths / 12)

  const handleMonthsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') {
      onChangeMonths(0)
      return
    }
    const val = parseInt(raw, 10)
    if (!isNaN(val)) {
      const clamped = Math.max(minMonths, Math.min(maxMonths, val))
      onChangeMonths(clamped)
    }
  }

  const handleYearsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(',', '.')
    if (raw === '') {
      onChangeMonths(0)
      return
    }
    const val = parseFloat(raw)
    if (!isNaN(val)) {
      const calculatedMonths = Math.round(val * 12)
      const clamped = Math.max(minMonths, Math.min(maxMonths, calculatedMonths))
      onChangeMonths(clamped)
    }
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#1B4D3E]" />
          {label}
        </Label>
        <span className="text-[10px] text-slate-400 font-medium">360 dias/ano</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Campo Meses */}
        <div className="relative">
          <Input
            type="number"
            min={minMonths}
            max={maxMonths}
            disabled={disabled}
            value={currentMonths === 0 ? '' : currentMonths}
            onChange={handleMonthsChange}
            placeholder="0"
            className="h-9 text-xs pr-12 bg-white dark:bg-slate-900 border-slate-300"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 select-none">
            meses
          </span>
        </div>

        {/* Campo Anos */}
        <div className="relative">
          <Input
            type="number"
            step="0.5"
            min={minMonths / 12}
            max={maxMonths / 12}
            disabled={disabled}
            value={
              currentYears === 0
                ? ''
                : Number.isInteger(currentYears)
                ? currentYears
                : currentYears.toFixed(1)
            }
            onChange={handleYearsChange}
            placeholder="0"
            className="h-9 text-xs pr-10 bg-white dark:bg-slate-900 border-slate-300"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 select-none">
            anos
          </span>
        </div>
      </div>

      {helperText && (
        <p className="text-[10px] text-slate-500 flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
          {helperText}
        </p>
      )}
    </div>
  )
}
