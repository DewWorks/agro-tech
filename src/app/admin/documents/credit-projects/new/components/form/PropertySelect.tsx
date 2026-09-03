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

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-[#1B4D3E]" />
          2. Propriedade / Imóvel Beneficiado *
        </span>
        {availableProperties.length > 0 && (
          <span className="text-[10px] text-gray-500">
            {availableProperties.length} vinculada(s)
          </span>
        )}
      </Label>
      {availableProperties.length === 0 ? (
        <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-xs border border-amber-200">
          Este produtor não possui propriedades rurais vinculadas.
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between font-normal text-left text-xs h-9 px-3 bg-white border-gray-200 hover:bg-gray-50 shadow-2xs"
              />
            }
          >
            <span className="truncate">
              {currentProperty
                ? `${currentProperty.name}${currentProperty.registrationNumber ? ` (Matr. ${currentProperty.registrationNumber})` : ''}`
                : "Buscar e selecionar propriedade..."}
            </span>
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
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
      )}
    </div>
  )
}
