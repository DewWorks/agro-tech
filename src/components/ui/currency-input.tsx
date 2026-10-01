'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | undefined | null
  onChangeValue: (value: number) => void
  prefix?: string
  containerClassName?: string
}

/**
 * Converte valor numérico em string formatada no padrão brasileiro (10.000.000,00)
 */
export function formatCurrencyBRL(
  val: number | undefined | null,
  includeDecimals = true
): string {
  if (val === undefined || val === null || isNaN(val) || val === 0) {
    return ''
  }
  return Number(val).toLocaleString('pt-BR', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })
}

/**
 * Converte string digitada pelo operador ("10.000.000,50" ou "10000000") para número float
 */
export function parseCurrencyBRL(text: string): number {
  if (!text) return 0
  // Remove tudo que não for dígito ou vírgula
  const clean = text.replace(/[^\d,]/g, '')
  if (!clean) return 0

  if (clean.includes(',')) {
    const parts = clean.split(',')
    const intPart = parts[0] ? parts[0].replace(/\D/g, '') : '0'
    const decPart = parts[1] ? parts[1].replace(/\D/g, '').slice(0, 2) : '00'
    const num = parseFloat(`${intPart}.${decPart}`)
    return isNaN(num) ? 0 : num
  } else {
    const num = parseFloat(clean)
    return isNaN(num) ? 0 : num
  }
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      onChangeValue,
      prefix = 'R$',
      placeholder = '0,00',
      className,
      containerClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState<string>(() => {
      return value ? formatCurrencyBRL(value, true) : ''
    })
    const [isFocused, setIsFocused] = React.useState(false)

    // Sincroniza se o valor mudar externamente (ex: carregar de API, botões de teste, presets)
    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(value ? formatCurrencyBRL(value, true) : '')
      }
    }, [value, isFocused])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value

      // Limpeza de campo
      if (!raw.trim()) {
        setDisplayValue('')
        onChangeValue(0)
        return
      }

      // Permite dígitos e vírgula. Se o usuário digitar ponto, tratamos como vírgula (padrão teclado numérico)
      const sanitized = raw.replace(/\./g, '').replace(/[^\d,]/g, '')

      const parts = sanitized.split(',')
      const intDigits = parts[0] ? parts[0].replace(/\D/g, '') : ''
      const decDigits = parts.length > 1 ? parts[1].replace(/\D/g, '').slice(0, 2) : null

      const formattedInt = intDigits ? Number(intDigits).toLocaleString('pt-BR') : ''

      let nextDisplay = formattedInt
      if (decDigits !== null) {
        nextDisplay += `,${decDigits}`
      }

      setDisplayValue(nextDisplay)

      const numValue = parseCurrencyBRL(nextDisplay)
      onChangeValue(numValue)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Se pressionar ponto (.) ou vírgula (,) e ainda não houver vírgula, insere separador decimal
      if ((e.key === '.' || e.key === ',') && !displayValue.includes(',')) {
        e.preventDefault()
        const base = displayValue || '0'
        const next = `${base},`
        setDisplayValue(next)
        onChangeValue(parseCurrencyBRL(next))
      }
      props.onKeyDown?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      if (value && value > 0) {
        setDisplayValue(formatCurrencyBRL(value, true))
      } else {
        setDisplayValue('')
      }
      props.onBlur?.(e)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      // Seleciona todo o conteúdo ao focar para facilitar substituição direta
      e.target.select()
      props.onFocus?.(e)
    }

    return (
      <div className={cn('relative flex items-center w-full', containerClassName)}>
        {prefix && (
          <div className="absolute left-0 top-0 bottom-0 flex items-center pl-3 pointer-events-none text-slate-400 dark:text-slate-500 font-semibold text-xs select-none">
            {prefix}
          </div>
        )}
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            prefix ? 'pl-9' : 'pl-3',
            'pr-3 text-xs h-9 font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/20 transition-all placeholder:text-slate-400 placeholder:font-normal',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'
