import React, { useState } from 'react'
import { MapPin, AlertTriangle, CheckCircle2, ChevronsUpDown, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { CustomOptions } from '../../types/wizard-types'
import { RURAL_ACTIVITIES, normalizeTitleCase } from '@/lib/validations/property'

interface PropertyDataFormProps {
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
}

export function PropertyDataForm({ customOptions, setCustomOptions }: PropertyDataFormProps) {
  const isPending = !customOptions.propertyRegistrationNumber?.trim() || 
                    !customOptions.propertyCar?.trim() || 
                    !customOptions.propertyTotalArea || 
                    !customOptions.propertyAccessRoute?.trim() || 
                    !customOptions.propertyActivity?.trim()

  const [openActivity, setOpenActivity] = useState(false)
  const [activitySearch, setActivitySearch] = useState('')
  const normalizedActivitySearch = normalizeTitleCase(activitySearch)

  return (
    <div className="p-3 bg-slate-50/80 border border-gray-200 rounded-lg space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-[#1B4D3E]" />
          Dados Fundiários do Imóvel
        </span>
        {isPending ? (
          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Pendências Cadastrais
          </span>
        ) : (
          <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Imóvel Regular
          </span>
        )}
      </div>

      {isPending && (
        <p className="text-[10px] text-amber-800 bg-amber-50/90 p-2 rounded border border-amber-200 leading-tight">
          ⚠️ Preencha os dados fundiários pendentes abaixo para regularizar e emitir o documento oficial:
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Matrícula / Registro *</Label>
          <Input
            value={customOptions.propertyRegistrationNumber || ''}
            onChange={(e) => {
              const numericValue = e.target.value.replace(/\D/g, '')
              setCustomOptions(prev => ({ ...prev, propertyRegistrationNumber: numericValue }))
            }}
            className={cn("h-8 text-xs", !customOptions.propertyRegistrationNumber?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
            placeholder="Ex: 12345"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Cartório de Registro (CRI)</Label>
          <Input
            value={customOptions.propertyRegistryOffice || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyRegistryOffice: e.target.value }))}
            className="h-8 text-xs"
            placeholder="Ex: CRI de Palmas - TO"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Nº do CAR (Recibo) *</Label>
          <Input
            value={customOptions.propertyCar || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyCar: e.target.value.toUpperCase() }))}
            className={cn("h-8 text-xs uppercase", !customOptions.propertyCar?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
            placeholder="Ex: TO-1700000-XXXXXXXX"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Área Total do Imóvel (ha) *</Label>
          <Input
            type="number"
            step="0.01"
            value={customOptions.propertyTotalArea || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyTotalArea: Number(e.target.value) }))}
            className={cn("h-8 text-xs", (!customOptions.propertyTotalArea || Number(customOptions.propertyTotalArea) <= 0) && "border-amber-400 focus-visible:ring-amber-400")}
            placeholder="Ex: 1500.50"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[10.5px] text-gray-600">Atividade Principal do Imóvel *</Label>
        <Popover open={openActivity} onOpenChange={setOpenActivity}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "w-full justify-between h-8 text-xs font-normal bg-white",
                  !customOptions.propertyActivity && "text-muted-foreground",
                  !customOptions.propertyActivity?.trim() && "border-amber-400"
                )}
              />
            }
          >
            <span className="truncate">
              {customOptions.propertyActivity || "Selecione ou digite a atividade..."}
            </span>
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Buscar ou adicionar atividade..." 
                value={activitySearch}
                onValueChange={setActivitySearch}
              />
              <CommandList>
                <CommandEmpty className="p-2">
                  {normalizedActivitySearch ? (
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                      onClick={() => {
                        setCustomOptions(prev => ({ ...prev, propertyActivity: normalizedActivitySearch }))
                        setOpenActivity(false)
                        setActivitySearch("") 
                      }}
                    >
                      + Adicionar "{normalizedActivitySearch}"
                    </Button>
                  ) : (
                    "Digite para pesquisar ou adicionar"
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {RURAL_ACTIVITIES.map(activity => (
                    <CommandItem
                      value={activity}
                      key={activity}
                      onSelect={() => {
                        setCustomOptions(prev => ({ ...prev, propertyActivity: activity }))
                        setOpenActivity(false)
                      }}
                      className="text-xs"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3 w-3",
                          activity === customOptions.propertyActivity ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {activity}
                    </CommandItem>
                  ))}
                  {customOptions.propertyActivity && !RURAL_ACTIVITIES.includes(customOptions.propertyActivity) && (
                    <CommandItem 
                      value={customOptions.propertyActivity} 
                      key={customOptions.propertyActivity} 
                      onSelect={() => setOpenActivity(false)}
                      className="text-xs"
                    >
                      <Check className="mr-2 h-3 w-3 opacity-100" />
                      {customOptions.propertyActivity}
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-1">
        <Label className="text-[10.5px] text-gray-600">Roteiro de Acesso à Propriedade *</Label>
        <Input
          value={customOptions.propertyAccessRoute || ''}
          onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyAccessRoute: e.target.value }))}
          className={cn("h-8 text-xs", !customOptions.propertyAccessRoute?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
          placeholder="Ex: Partindo de Palmas pela TO-050 por 45km..."
        />
      </div>
    </div>
  )
}
