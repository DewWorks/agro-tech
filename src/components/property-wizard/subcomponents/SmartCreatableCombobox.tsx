'use client'

import React, { useState } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { normalizeTitleCase } from '@/lib/validations/property-wizard'

interface SmartCreatableComboboxProps {
  value?: string
  onChange: (value: string) => void
  options: readonly string[] | string[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
}

export function SmartCreatableCombobox({
  value = '',
  onChange,
  options,
  placeholder = 'Selecione uma opção...',
  searchPlaceholder = 'Buscar ou digitar novo...',
  emptyText = 'Nenhuma opção encontrada.',
  className,
  disabled = false,
}: SmartCreatableComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  // Garante que o valor atual faça parte das opções se for customizado
  const normalizedSearch = normalizeTitleCase(searchValue)
  const allOptions = React.useMemo(() => {
    const list = [...options]
    if (value && !list.includes(value)) {
      list.unshift(value)
    }
    return list
  }, [options, value])

  const handleSelect = (selectedVal: string) => {
    const normalized = normalizeTitleCase(selectedVal)
    onChange(normalized)
    setOpen(false)
    setSearchValue('')
  }

  const handleCreateCustom = () => {
    if (!normalizedSearch) return
    onChange(normalizedSearch)
    setOpen(false)
    setSearchValue('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal text-left h-10 px-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
              !value && 'text-slate-600 dark:text-slate-300',
              className
            )}
          />
        }
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-50 shadow-lg border-slate-200 dark:border-slate-800" align="start" side="bottom" sideOffset={4}>
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-10 text-sm"
          />
          <CommandList>
            <CommandEmpty className="p-3 text-sm text-center text-slate-700 dark:text-slate-200">
              <p className="mb-2">{emptyText}</p>
              {normalizedSearch && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="w-full text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  onClick={handleCreateCustom}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Adicionar &ldquo;{normalizedSearch}&rdquo;
                </Button>
              )}
            </CommandEmpty>

            <CommandGroup heading="Opções Sugeridas">
              {allOptions.map((opt) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={() => handleSelect(opt)}
                  className="flex items-center justify-between py-2 text-sm cursor-pointer"
                >
                  <span className="truncate">{opt}</span>
                  {value === opt && (
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 ml-2" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>

            {normalizedSearch &&
              !allOptions.some(
                (o) => o.toLowerCase() === normalizedSearch.toLowerCase()
              ) && (
                <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                    onClick={handleCreateCustom}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Criar &ldquo;{normalizedSearch}&rdquo;
                  </Button>
                </div>
              )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
