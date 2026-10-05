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
      <Input className={`text-xs ${className || ''}`} {...props} />
    </FormField>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  options: { value: string; label: string }[]
}) {
  return (
    <FormField label={label}>
      <Select value={value} onValueChange={(val) => onChange(val || '')}>
        <SelectTrigger className="w-full text-xs font-semibold bg-white border-slate-200">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
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
