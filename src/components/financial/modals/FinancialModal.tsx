import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { CurrencyInput } from '@/components/ui/currency-input'
import { cn } from '@/lib/utils'

export function FinancialModal({
  isOpen,
  onClose,
  title,
  maxWidth = 'sm:max-w-md',
  loading,
  submitLabel = 'Confirmar',
  submitDisabled,
  submitVariant = 'emerald',
  onSubmit,
  children,
}: {
  isOpen: boolean
  onClose: () => void
  title: React.ReactNode
  maxWidth?: string
  loading?: boolean
  submitLabel?: string
  submitDisabled?: boolean
  submitVariant?: 'emerald' | 'rose'
  onSubmit?: () => void
  children: React.ReactNode
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle
            className={`text-base font-bold flex items-center gap-2 ${
              submitVariant === 'rose' ? 'text-rose-800' : 'text-slate-900'
            }`}
          >
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">{children}</div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          {onSubmit && (
            <Button
              type="button"
              className={
                submitVariant === 'rose'
                  ? 'bg-rose-700 hover:bg-rose-800 text-white font-bold'
                  : 'bg-emerald-800 hover:bg-emerald-900 text-white font-bold'
              }
              onClick={onSubmit}
              disabled={loading || submitDisabled}
            >
              {loading ? 'Processando...' : submitLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function FormField({
  label,
  children,
  error,
}: {
  label: string
  children: React.ReactNode
  error?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-700 block">{label}</label>
      {children}
      {error && <span className="text-[10px] text-rose-600 block">{error}</span>}
    </div>
  )
}

export function InputField({
  label,
  error,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; error?: string }) {
  return (
    <FormField label={label} error={error}>
      <Input className={cn('text-xs h-9', className)} {...props} />
    </FormField>
  )
}

export function DateField({
  label,
  value,
  onChange,
  error,
  placeholder = 'Selecione a data...',
  disabled,
  className,
}: {
  label: string
  value?: string | Date | null
  onChange: (val: string) => void
  error?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  return (
    <FormField label={label} error={error}>
      <DatePicker
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        showPresets={false}
        className={cn('h-9 text-xs font-semibold w-full', className)}
      />
    </FormField>
  )
}

export function CurrencyField({
  label,
  value,
  onChangeValue,
  error,
  placeholder = '0,00',
  disabled,
  className,
}: {
  label: string
  value: number | undefined | null
  onChangeValue: (val: number) => void
  error?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  return (
    <FormField label={label} error={error}>
      <CurrencyInput
        value={value}
        onChangeValue={onChangeValue}
        placeholder={placeholder}
        disabled={disabled}
        className={cn('text-xs font-bold h-9', className)}
      />
    </FormField>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  placeholder,
  options,
  error,
}: {
  label: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  options: { value: string; label: string }[]
  error?: string
}) {
  const selectedLabel = options.find((o) => o.value === value)?.label
  return (
    <FormField label={label} error={error}>
      <Select value={value} onValueChange={(val) => onChange(val || '')}>
        <SelectTrigger className="w-full text-xs font-semibold bg-white border-slate-200 h-9">
          <SelectValue placeholder={placeholder}>
            {selectedLabel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="z-[100]">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  )
}
