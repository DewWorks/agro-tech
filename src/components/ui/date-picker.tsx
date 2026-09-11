'use client'

import * as React from 'react'
import {
  format,
  parseISO,
  isValid,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addYears,
  subYears,
  addDays,
  setMonth,
  setYear,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Sparkles,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface DatePickerProps {
  /** Valor no formato ISO 'YYYY-MM-DD' ou objeto Date */
  value?: string | Date | null
  /** Retorna a data selecionada no formato ISO 'YYYY-MM-DD' (ou '' ao limpar) */
  onChange?: (value: string) => void
  /** Placeholder quando vazio */
  placeholder?: string
  /** Se o campo está desabilitado */
  disabled?: boolean
  /** Classes CSS adicionais para o trigger */
  className?: string
  /** Se exibe os atalhos rápidos (+30d, +1 ano, etc.) */
  showPresets?: boolean
  /** Data mínima selecionável */
  minDate?: Date
  /** Data máxima selecionável */
  maxDate?: Date
  /** Alinhamento do popover */
  align?: 'start' | 'center' | 'end'
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const WEEKDAY_NAMES = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export function DatePicker({
  value,
  onChange,
  placeholder = 'Selecione a data...',
  disabled = false,
  className,
  showPresets = true,
  minDate,
  maxDate,
  align = 'start',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState<boolean>(false)
  const [viewMode, setViewMode] = React.useState<'days' | 'months'>('days')

  // Converte a prop value para objeto Date válido
  const selectedDate = React.useMemo<Date | null>(() => {
    if (!value) return null
    if (value instanceof Date) return isValid(value) ? value : null
    if (typeof value === 'string' && value.trim()) {
      // Suporta YYYY-MM-DD
      const parsed = parseISO(value.trim())
      if (isValid(parsed)) return parsed
      // Suporta DD/MM/YYYY
      const parts = value.trim().split('/')
      if (parts.length === 3) {
        const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
        if (isValid(d)) return d
      }
    }
    return null
  }, [value])

  // Mês de referência em exibição no calendário
  const [viewDate, setViewDate] = React.useState<Date>(() => selectedDate || new Date())

  // Sincroniza viewDate com selectedDate ao abrir
  React.useEffect(() => {
    if (isOpen && selectedDate) {
      setViewDate(selectedDate)
      setViewMode('days')
    }
  }, [isOpen, selectedDate])

  const handleSelectDate = (date: Date) => {
    if (disabled) return
    if (minDate && date < minDate) return
    if (maxDate && date > maxDate) return

    const isoStr = format(date, 'yyyy-MM-dd')
    onChange?.(isoStr)
    setIsOpen(false)
  }

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    onChange?.('')
  }

  // Gera os dias do mês atual incluindo dias de preenchimento da semana
  const daysInMonth = React.useMemo(() => {
    const monthStart = startOfMonth(viewDate)
    const monthEnd = endOfMonth(monthStart)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Domingo
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [viewDate])

  // Presets práticos (especialmente úteis para prazos e validades de documentos)
  const presets = [
    { label: 'Hoje', days: 0 },
    { label: '+30d', days: 30 },
    { label: '+6 meses', months: 6 },
    { label: '+1 ano', years: 1 },
    { label: '+2 anos', years: 2 },
    { label: '+5 anos', years: 5 },
  ]

  const handleApplyPreset = (preset: { days?: number; months?: number; years?: number }) => {
    let target = new Date()
    if (preset.days) target = addDays(target, preset.days)
    if (preset.months) target = addMonths(target, preset.months)
    if (preset.years) target = addYears(target, preset.years)
    handleSelectDate(target)
  }

  const currentYear = viewDate.getFullYear()
  const yearsList = React.useMemo(() => {
    const startYear = Math.max(1970, currentYear - 10)
    const endYear = currentYear + 20
    const list: number[] = []
    for (let y = startYear; y <= endYear; y++) {
      list.push(y)
    }
    return list
  }, [currentYear])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-normal text-left shadow-2xs transition-all outline-none select-none cursor-pointer',
          'hover:bg-muted/40 focus-visible:border-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-600/20',
          'disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900 dark:border-slate-800',
          className
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          {selectedDate ? (
            <span className="text-gray-900 dark:text-gray-100 font-medium font-mono text-xs sm:text-sm">
              {format(selectedDate, 'dd/MM/yyyy')}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs sm:text-sm">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {selectedDate && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear()}
              className="p-1 rounded-md text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Limpar data"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        side="bottom"
        sideOffset={6}
        className="w-[320px] p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95"
      >
        {/* BARRA SUPERIOR DE PRESETS RÁPIDOS */}
        {showPresets && (
          <div className="pb-3 mb-3 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              <span>Atalhos Rápidos de Validade</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-700 transition-all cursor-pointer shadow-2xs"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CABEÇALHO DO MÊS E ANO */}
        <div className="flex items-center justify-between gap-1 mb-3">
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewDate((d) => subYears(d, 1))}
              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900 rounded-lg cursor-pointer"
              title="Ano anterior"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewDate((d) => subMonths(d, 1))}
              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900 rounded-lg cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Botão de Alternar Modo de Visualização (Mês/Ano) */}
          <button
            type="button"
            onClick={() => setViewMode((m) => (m === 'days' ? 'months' : 'days'))}
            className="px-2.5 py-1 text-xs font-bold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>
              {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
          </button>

          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewDate((d) => addMonths(d, 1))}
              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900 rounded-lg cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewDate((d) => addYears(d, 1))}
              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900 rounded-lg cursor-pointer"
              title="Próximo ano"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* MODO 1: DIAS DO MÊS */}
        {viewMode === 'days' ? (
          <div>
            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-1.5 text-center">
              {WEEKDAY_NAMES.map((w, idx) => (
                <div
                  key={idx}
                  className="text-[11px] font-bold text-gray-400 dark:text-slate-500 py-0.5 select-none"
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Grid dos 42 dias */}
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((day, idx) => {
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                const isCurrentMonth = isSameMonth(day, viewDate)
                const isCurrentDay = isToday(day)
                const isDisabled =
                  (minDate && day < minDate) || (maxDate && day > maxDate) || disabled

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelectDate(day)}
                    className={cn(
                      'h-8 w-8 text-xs font-medium rounded-lg flex items-center justify-center transition-all cursor-pointer select-none relative',
                      // Dia selecionado
                      isSelected &&
                        'bg-[#1B4D3E] text-white font-bold shadow-xs hover:bg-[#153D31] dark:bg-emerald-600 dark:hover:bg-emerald-700',
                      // Dia não selecionado do mês atual
                      !isSelected &&
                        isCurrentMonth &&
                        'text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-900 dark:hover:text-emerald-200',
                      // Dia de mês anterior ou seguinte
                      !isSelected &&
                        !isCurrentMonth &&
                        'text-gray-300 dark:text-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800/40',
                      // Hoje
                      !isSelected && isCurrentDay && 'border border-emerald-500 font-bold text-emerald-800 dark:text-emerald-400',
                      // Desabilitado
                      isDisabled && 'opacity-30 cursor-not-allowed hover:bg-transparent'
                    )}
                  >
                    <span>{day.getDate()}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* MODO 2: SELETOR RÁPIDO DE MÊS E ANO */
          <div className="py-2 space-y-3 animate-in fade-in zoom-in-95">
            {/* Seletor rápido de ano */}
            <div className="flex items-center justify-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-800">
              <span className="text-xs text-muted-foreground font-medium">Ano:</span>
              <select
                value={viewDate.getFullYear()}
                onChange={(e) => setViewDate((d) => setYear(d, Number(e.target.value)))}
                className="text-xs font-bold bg-gray-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none"
              >
                {yearsList.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Grid dos 12 meses */}
            <div className="grid grid-cols-3 gap-1.5">
              {MONTH_NAMES.map((m, idx) => {
                const isSelectedMonth = viewDate.getMonth() === idx
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setViewDate((d) => setMonth(d, idx))
                      setViewMode('days')
                    }}
                    className={cn(
                      'py-2 px-1 text-xs rounded-lg font-medium transition-colors cursor-pointer select-none text-center',
                      isSelectedMonth
                        ? 'bg-[#1B4D3E] text-white font-bold shadow-xs'
                        : 'hover:bg-emerald-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'
                    )}
                  >
                    {m.slice(0, 3)}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* RODAPÉ DO CALENDÁRIO */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleClear()}
            className="h-7 px-2.5 text-xs text-gray-400 hover:text-rose-600 cursor-pointer"
          >
            Limpar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleSelectDate(new Date())}
            className="h-7 px-2.5 text-xs font-semibold text-[#1B4D3E] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
          >
            Hoje
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
