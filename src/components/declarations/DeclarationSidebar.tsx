'use client'

import { useState } from 'react'
import { FileText, ChevronRight, Check, ChevronsUpDown } from 'lucide-react'
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

interface Producer {
  id: string
  name: string
  document: string
  properties: { property: { id: string; name: string; propertyName: string | null } }[]
}

interface Template {
  id: string
  code: string
  title: string
}

interface DeclarationSidebarProps {
  producers: Producer[]
  templates: Template[]
  selectedProducerId: string | null
  selectedPropertyId: string | null
  selectedTemplateCode: string | null
  onSelectProducer: (id: string) => void
  onSelectProperty: (id: string) => void
  onSelectTemplate: (code: string) => void
}

export function DeclarationSidebar({
  producers,
  templates,
  selectedProducerId,
  selectedPropertyId,
  selectedTemplateCode,
  onSelectProducer,
  onSelectProperty,
  onSelectTemplate
}: DeclarationSidebarProps) {
  
  const selectedProducer = producers.find(p => p.id === selectedProducerId)
  const selectedProperty = selectedProducer?.properties.find(pp => pp.property.id === selectedPropertyId)?.property
  const [openProducer, setOpenProducer] = useState(false)
  const [openProperty, setOpenProperty] = useState(false)
  
  return (
    <div className="w-80 flex-shrink-0 flex flex-col gap-6">
      {/* Producer Selection Card */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Produtor (Dados Herdados)
        </h4>
        
        <div className="flex flex-col gap-4">
          <div>
            <Popover open={openProducer} onOpenChange={setOpenProducer}>
              <PopoverTrigger 
                render={
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openProducer}
                    className="w-full justify-between font-normal text-left overflow-hidden text-ellipsis px-3 bg-slate-50 border-slate-200"
                  />
                }
              >
                <span className="truncate">
                  {selectedProducer
                    ? `${selectedProducer.name} - ${selectedProducer.document}`
                    : "Selecione um produtor..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar por nome ou CNPJ/CPF..." />
                  <CommandList>
                    <CommandEmpty>Nenhum produtor encontrado.</CommandEmpty>
                    <CommandGroup>
                      {producers.map((p) => {
                        // Usamos um truque para o cmdk buscar tanto por nome quanto por documento. 
                        // O value concatenado permite pesquisa, e no onSelect extraímos o ID.
                        const cmdValue = `${p.name} ${p.document} | ${p.id}`
                        return (
                          <CommandItem
                            key={p.id}
                            value={cmdValue}
                            onSelect={(currentValue) => {
                              const id = currentValue.split(' | ')[1]
                              onSelectProducer(id)
                              setOpenProducer(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedProducerId === p.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {p.name} - {p.document}
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selectedProducer && selectedProducer.properties.length > 0 && (
            <div>
              <Popover open={openProperty} onOpenChange={setOpenProperty}>
                <PopoverTrigger 
                  render={
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openProperty}
                      className="w-full justify-between font-normal text-left overflow-hidden text-ellipsis px-3 bg-slate-50 border-slate-200"
                    />
                  }
                >
                  <span className="truncate">
                    {selectedProperty
                      ? (selectedProperty.propertyName || selectedProperty.name)
                      : "Selecione a propriedade..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar propriedade..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma propriedade encontrada.</CommandEmpty>
                      <CommandGroup>
                        {selectedProducer.properties.map((pp) => {
                          const name = pp.property.propertyName || pp.property.name
                          const cmdValue = `${name} | ${pp.property.id}`
                          return (
                            <CommandItem
                              key={pp.property.id}
                              value={cmdValue}
                              onSelect={(currentValue) => {
                                const id = currentValue.split(' | ')[1]
                                onSelectProperty(id)
                                setOpenProperty(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedPropertyId === pp.property.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {name}
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex-1">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Repositório de Minutas
        </h4>
        
        <div className="flex flex-col gap-1">
          {templates.map(template => {
            const isActive = selectedTemplateCode === template.code
            return (
              <button
                key={template.code}
                onClick={() => onSelectTemplate(template.code)}
                className={`flex items-center justify-between p-3 rounded-md text-sm transition-colors text-left ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-900 font-medium' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="line-clamp-2">{template.title}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
