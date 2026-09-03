import React, { useState } from 'react'
import { Check, ChevronsUpDown, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { ProducerData } from '../../types/wizard-types'

interface ProducerSelectProps {
  activeProducers: ProducerData[]
  selectedProducerId: string
  setSelectedProducerId: (id: string) => void
  currentProducer: ProducerData | undefined
}

export function ProducerSelect({ activeProducers, selectedProducerId, setSelectedProducerId, currentProducer }: ProducerSelectProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-[#1B4D3E]" />
          1. Produtor Rural (Proponente) *
        </span>
        <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
          Apenas Ativos ({activeProducers.length})
        </span>
      </Label>
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
            {currentProducer
              ? `${currentProducer.name} (${currentProducer.type})`
              : "Buscar e selecionar produtor..."}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0 shadow-lg border-gray-200" align="start">
          <Command>
            <CommandInput placeholder="Buscar produtor por nome ou CPF/CNPJ..." className="text-xs" />
            <CommandList className="max-h-[260px]">
              <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                Nenhum produtor ativo encontrado.
              </CommandEmpty>
              <CommandGroup>
                {activeProducers.map((prod) => {
                  const cmdValue = `${prod.name} ${prod.document || ''} ${prod.type} | ${prod.id}`
                  const isSelected = selectedProducerId === prod.id
                  return (
                    <CommandItem
                      key={prod.id}
                      value={cmdValue}
                      onSelect={() => {
                        setSelectedProducerId(prod.id)
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
                          <p className="font-medium text-gray-900 truncate">{prod.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {prod.document} • {prod.type}
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
