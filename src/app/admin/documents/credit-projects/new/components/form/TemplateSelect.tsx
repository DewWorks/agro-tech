import React, { useState } from 'react'
import { Check, ChevronsUpDown, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { CreditTemplateMeta } from '@/lib/document-templates'

interface TemplateSelectProps {
  templates: CreditTemplateMeta[]
  selectedTemplateCode: string
  setSelectedTemplateCode: (code: string) => void
  currentTemplate: CreditTemplateMeta | undefined
}

export function TemplateSelect({ templates, selectedTemplateCode, setSelectedTemplateCode, currentTemplate }: TemplateSelectProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-1.5 flex flex-col">
      <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between min-h-[24px]">
        <span className="flex items-center gap-1.5 truncate">
          <Landmark className="h-3.5 w-3.5 text-[#1B4D3E] shrink-0" />
          <span className="truncate">3. Modelo Oficial Banco do Brasil *</span>
        </span>
        <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
          Padrão BB / SICOR
        </span>
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-medium text-left text-xs h-10 px-3.5 bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 rounded-xl shadow-2xs transition-all cursor-pointer"
            />
          }
        >
          <span className="truncate text-gray-800 font-medium">
            {currentTemplate ? currentTemplate.title : "Buscar e selecionar modelo..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0 shadow-lg border-gray-200" align="start">
          <Command>
            <CommandInput placeholder="Buscar modelo (ex: Checklist, Custeio, RenovAgro...)" className="text-xs" />
            <CommandList className="max-h-[280px]">
              <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                Nenhum modelo encontrado.
              </CommandEmpty>
              <CommandGroup>
                {templates.map((tmpl) => {
                  const cmdValue = `${tmpl.title} ${tmpl.category} ${tmpl.description || ''} | ${tmpl.code}`
                  const isSelected = selectedTemplateCode === tmpl.code
                  return (
                    <CommandItem
                      key={tmpl.code}
                      value={cmdValue}
                      onSelect={() => {
                        setSelectedTemplateCode(tmpl.code)
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
                          <p className="font-medium text-gray-900 truncate">{tmpl.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {tmpl.category} • {tmpl.bank}
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
