import React, { useState } from 'react'
import { Check, ChevronsUpDown, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { PropertyData } from '../../types/wizard-types'

interface PropertySelectProps {
  availableProperties: PropertyData[]
  selectedPropertyId: string
  setSelectedPropertyId: (id: string) => void
  currentProperty: PropertyData | undefined
}

export function PropertySelect({ availableProperties, selectedPropertyId, setSelectedPropertyId, currentProperty }: PropertySelectProps) {
  const [open, setOpen] = useState(false)
  const hasProperties = availableProperties.length > 0

  return (
    <div className="space-y-1.5 flex flex-col">
      <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between min-h-[24px]">
        <span className="flex items-center gap-1.5 truncate">
          <MapPin className="h-3.5 w-3.5 text-[#1B4D3E] shrink-0" />
          <span className="truncate">2. Propriedade / Imóvel Beneficiado *</span>
        </span>
        <span className={cn(
          "text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0",
          hasProperties
            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
            : "text-amber-700 bg-amber-50 border-amber-200"
        )}>
          {hasProperties ? `${availableProperties.length} vinculada(s)` : '0 vinculada(s)'}
        </span>
      </Label>
      <Popover open={open && hasProperties} onOpenChange={(o) => hasProperties && setOpen(o)}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={!hasProperties}
              className={cn(
                "w-full justify-between font-medium text-left text-xs h-10 px-3.5 bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 rounded-xl shadow-2xs transition-all",
                !hasProperties ? "opacity-60 bg-gray-50 cursor-not-allowed" : "cursor-pointer"
              )}
            />
          }
        >
          <span className="truncate text-gray-800 font-medium">
            {currentProperty
              ? `${currentProperty.name}${currentProperty.registrationNumber ? ` (Matr. ${currentProperty.registrationNumber})` : ''}`
              : hasProperties
                ? "Buscar e selecionar propriedade..."
                : "Produtor sem propriedades vinculadas"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
        </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0 shadow-lg border-gray-200" align="start">
            <Command>
              <CommandInput placeholder="Buscar por nome, matrícula ou município..." className="text-xs" />
              <CommandList className="max-h-[260px]">
                <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                  Nenhuma propriedade encontrada.
                </CommandEmpty>
                <CommandGroup>
                  {availableProperties.map((prop) => {
                    const cmdValue = `${prop.name} ${prop.registrationNumber || ''} ${prop.city || ''} ${prop.state || ''} | ${prop.id}`
                    const isSelected = selectedPropertyId === prop.id
                    return (
                      <CommandItem
                        key={prop.id}
                        value={cmdValue}
                        onSelect={() => {
                          setSelectedPropertyId(prop.id)
                          setOpen(false)
                        }}
                        className="text-xs flex items-center justify-between py-2 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Check
                            className={cn(
                              "h-3.5 w-3.5 text-[#1B4D3E]",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="truncate">
                            <p className="font-medium text-gray-900 truncate">{prop.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {prop.registrationNumber ? `Matr. ${prop.registrationNumber}` : 'Sem matrícula'}
                              {prop.city ? ` • ${prop.city}/${prop.state || ''}` : ''}
                              {prop.totalArea ? ` • ${prop.totalArea} ha` : ''}
                            </p>
                          </div>
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
    </div>
  )
}
