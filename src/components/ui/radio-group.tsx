'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface RadioGroupContextValue {
  value?: string
  name?: string
  disabled?: boolean
  onValueChange?: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({})

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  defaultValue?: string
  name?: string
  disabled?: boolean
  onValueChange?: (value: string) => void
}

export function RadioGroup({
  className,
  value: controlledValue,
  defaultValue,
  name: explicitName,
  disabled,
  onValueChange,
  ...props
}: RadioGroupProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || '')
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue
  const generatedId = React.useId()
  const name = explicitName || `radio-group-${generatedId}`

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(newValue)
      }
      onValueChange?.(newValue)
    },
    [isControlled, onValueChange]
  )

  return (
    <RadioGroupContext.Provider value={{ value, name, disabled, onValueChange: handleValueChange }}>
      <div role="radiogroup" className={cn('grid gap-2', className)} {...props} />
    </RadioGroupContext.Provider>
  )
}

export interface RadioGroupItemProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, id, disabled: itemDisabled, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    const isChecked = context.value === value
    const isDisabled = itemDisabled || context.disabled

    return (
      <div className="relative inline-flex items-center justify-center shrink-0">
        <input
          ref={ref}
          type="radio"
          name={context.name}
          id={id}
          value={value}
          checked={isChecked}
          disabled={isDisabled}
          onChange={() => context.onValueChange?.(value)}
          className={cn(
            'peer h-4 w-4 rounded-full border border-slate-300 text-[#1B4D3E] focus:ring-[#1B4D3E] focus:ring-2 focus:ring-offset-1 dark:border-slate-700 dark:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50 accent-[#1B4D3E] cursor-pointer',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
RadioGroupItem.displayName = 'RadioGroupItem'
