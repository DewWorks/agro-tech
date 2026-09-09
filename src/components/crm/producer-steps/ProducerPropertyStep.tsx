'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { MapPin, Plus, Pencil, ExternalLink, ChevronsUpDown, Check } from 'lucide-react'

export interface IbgeLocation {
  id: number
  nome: string
  sigla?: string
}

interface ProducerPropertyStepProps {
  initialData?: any
  formData: any
  handleChange: (field: string, value: string) => void
  states: IbgeLocation[]
  cities: IbgeLocation[]
  openUfSelect: boolean
  setOpenUfSelect: (open: boolean) => void
  openCitySelect: boolean
  setOpenCitySelect: (open: boolean) => void
  citySelectAttemptedWithoutUf: boolean
  setCitySelectAttemptedWithoutUf: (attempted: boolean) => void
}

export function ProducerPropertyStep({
  initialData,
  formData,
  handleChange,
  states,
  cities,
  openUfSelect,
  setOpenUfSelect,
  openCitySelect,
  setOpenCitySelect,
  citySelectAttemptedWithoutUf,
  setCitySelectAttemptedWithoutUf,
}: ProducerPropertyStepProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Seção de Propriedades Vinculadas */}
      <div className="col-span-1 md:col-span-2 space-y-4 p-5 border-2 border-emerald-200 rounded-2xl bg-linear-to-b from-emerald-50/50 to-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#1B4D3E] text-white flex items-center justify-center font-bold shadow-xs">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                Propriedades Rurais Vinculadas
                <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
                  {initialData?.properties?.length || 0} cadastrada(s)
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                Acesse diretamente para editar o levantamento patrimonial completo, máquinas, rebanho e benfeitorias.
              </p>
            </div>
          </div>

          <Link href="/admin/crm/properties/new">
            <Button size="sm" className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-semibold h-9 px-4 gap-1.5 shadow-2xs cursor-pointer">
              <Plus className="h-4 w-4" />
              Nova Propriedade
            </Button>
          </Link>
        </div>

        {/* Cards de Propriedades */}
        {initialData?.properties && initialData.properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {initialData.properties.map((item: any) => {
              const prop = item.property
              if (!prop) return null
              return (
                <div
                  key={prop.id}
                  className="p-4 rounded-xl border-2 border-emerald-100 bg-white hover:border-[#1B4D3E] hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-gray-900 text-sm group-hover:text-[#1B4D3E] transition-colors flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-[#1B4D3E]" />
                          {prop.name || prop.propertyName || 'Sem nome'}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {prop.city && prop.state ? `${prop.city} - ${prop.state}` : 'Localização não informada'}
                        </p>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {item.ownershipType || 'Proprietário'}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Área Total:</span>
                        <span className="font-semibold text-gray-800">
                          {prop.totalArea ? `${Number(prop.totalArea).toFixed(2)} ha` : '0.00 ha'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Pastagens:</span>
                        <span className="font-semibold text-gray-800">
                          {prop.pastureArea ? `${Number(prop.pastureArea).toFixed(2)} ha` : '0.00 ha'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Matrícula:</span>
                        <span className="font-semibold text-gray-800 truncate block">
                          {prop.registrationNumber || 'Pendente'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">CAR:</span>
                        <span className="font-semibold text-gray-800 truncate block">
                          {prop.car || 'Pendente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                    <Link 
                      href={`/admin/crm/properties/${prop.id}/edit`}
                      className="w-full"
                    >
                      <Button
                        type="button"
                        className="w-full bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold text-xs h-9 flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Acessar e Editar Propriedade (5 Etapas)
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50/70 border border-dashed border-gray-200 rounded-xl space-y-2">
            <MapPin className="h-7 w-7 text-gray-400 mx-auto" />
            <p className="text-xs text-gray-600 font-medium">
              Nenhuma propriedade rural cadastrada para este produtor ainda.
            </p>
            <Link href="/admin/crm/properties/new">
              <Button type="button" variant="outline" size="sm" className="text-xs text-[#1B4D3E] border-emerald-300 mt-1 cursor-pointer">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Cadastrar Primeira Propriedade
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-lg font-semibold text-[#1B4D3E]">Edição Rápida dos Dados da Fazenda</h3>
            <p className="text-sm text-muted-foreground mt-0">
              Ajuste os dados cadastrais básicos abaixo ou acesse o dossiê completo acima.
            </p>
          </div>
          {initialData?.properties?.[0]?.property?.id && (
            <Link href={`/admin/crm/properties/${initialData.properties[0].property.id}/edit`}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-bold text-[#1B4D3E] border-emerald-300 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir Levantamento Patrimonial Completo
              </Button>
            </Link>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2 col-span-1 md:col-span-2">
            <Label>Nome da Propriedade</Label>
            <Input 
              value={formData.propertyName}
              onChange={(e) => handleChange('propertyName', e.target.value)}
              placeholder="Ex: Fazenda Boa Esperança"
            />
          </div>
          <div className="space-y-2 flex flex-col">
            <Label>Estado (UF)</Label>
            <Popover open={openUfSelect} onOpenChange={setOpenUfSelect}>
              <PopoverTrigger 
                render={
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between font-normal bg-white h-10",
                      !formData.propertyState && "text-muted-foreground"
                    )}
                  />
                }
              >
                {formData.propertyState ? formData.propertyState : "Selecione o estado..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar estado..." />
                  <CommandList>
                    <CommandEmpty>Nenhum estado encontrado.</CommandEmpty>
                    <CommandGroup>
                      {states.map((s) => (
                        <CommandItem
                          key={s.id}
                          value={`${s.nome} ${s.sigla}`}
                          onSelect={() => {
                            handleChange('propertyState', s.sigla || '')
                            setOpenUfSelect(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.propertyState === s.sigla ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {s.nome} ({s.sigla})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2 flex flex-col">
            <Label>Município</Label>
            <Popover 
              open={openCitySelect} 
              onOpenChange={(val) => {
                if (val && !formData.propertyState) {
                  setCitySelectAttemptedWithoutUf(true)
                  return
                }
                setCitySelectAttemptedWithoutUf(false)
                setOpenCitySelect(val)
              }}
            >
              <PopoverTrigger 
                render={
                  <Button
                    variant="outline"
                    role="combobox"
                    onClick={(e) => {
                      if (!formData.propertyState) {
                        e.preventDefault()
                        setCitySelectAttemptedWithoutUf(true)
                      }
                    }}
                    className={cn(
                      "w-full justify-between font-normal bg-white h-10",
                      !formData.propertyCity && "text-muted-foreground",
                      !formData.propertyState && "opacity-60"
                    )}
                  />
                }
              >
                <span className="truncate block">
                  {formData.propertyCity ? formData.propertyCity : "Selecione o município..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar município..." />
                  <CommandList>
                    <CommandEmpty>Nenhum município encontrado.</CommandEmpty>
                    <CommandGroup>
                      {cities.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.nome}
                          onSelect={() => {
                            handleChange('propertyCity', c.nome)
                            setOpenCitySelect(false)
                            setCitySelectAttemptedWithoutUf(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.propertyCity === c.nome ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {c.nome}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {citySelectAttemptedWithoutUf && !formData.propertyState && (
              <p className="text-xs text-red-500 font-medium">Selecione o estado primeiro.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Área de Pastagem (ha)</Label>
            <Input 
              type="number"
              step="0.01"
              value={formData.pastureArea}
              onChange={(e) => handleChange('pastureArea', e.target.value)}
              placeholder="Ex: 150"
            />
          </div>
        </div>
      </div>

      <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-sm mt-4">
        <h3 className="text-lg font-semibold text-[#1B4D3E]">Dados de Rebanho</h3>
        <p className="text-sm text-muted-foreground mt-0">
          Detalhes do rebanho e rebanho atual.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Total de Cabeças</Label>
            <Input 
              type="number"
              value={formData.totalHeadCount}
              onChange={(e) => handleChange('totalHeadCount', e.target.value)}
              placeholder="Informe total de cabeças"
            />
          </div>
          <div className="space-y-2">
            <Label>Registro ADAPEC da Marca</Label>
            <Input 
              value={formData.brandRegistrationAdapec}
              onChange={(e) => handleChange('brandRegistrationAdapec', e.target.value)}
              placeholder="Ex: 123456"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição da Marca (Visual)</Label>
            <Input 
              value={formData.brandDescription}
              onChange={(e) => handleChange('brandDescription', e.target.value)}
              placeholder="Ex: Letra J, Círculo"
            />
          </div>
          <div className="space-y-2">
            <Label>Localização da Marca</Label>
            <Input 
              value={formData.brandLocation}
              onChange={(e) => handleChange('brandLocation', e.target.value)}
              placeholder="Ex: Perna Esquerda"
            />
          </div>
        </div>
      </div>

      <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-sm mt-4">
        <h3 className="text-lg font-semibold text-[#1B4D3E]">Documentação da Propriedade</h3>
        <p className="text-sm text-muted-foreground mt-0">
          Matrícula, CAR e registro.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Matrícula</Label>
            <Input 
              value={formData.registrationNumber}
              onChange={(e) => handleChange('registrationNumber', e.target.value)}
              placeholder="Número da Matrícula"
            />
          </div>
          <div className="space-y-2">
            <Label>Cartório</Label>
            <Input 
              value={formData.registryOffice}
              onChange={(e) => handleChange('registryOffice', e.target.value)}
              placeholder="Nome do Cartório"
            />
          </div>
          <div className="space-y-2">
            <Label>Número do CAR</Label>
            <Input 
              value={formData.car}
              onChange={(e) => handleChange('car', e.target.value)}
              placeholder="Ex: TO-1234..."
            />
          </div>
        </div>
      </div>

      <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-sm mt-4">
        <h3 className="text-lg font-semibold text-[#1B4D3E]">Dados de Posse e Exploração</h3>
        <p className="text-sm text-muted-foreground mt-0">
          Atividade exercida e tempo de posse para declarações.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Tempo de Posse (Anos)</Label>
            <Input 
              type="number"
              value={formData.possessionYears}
              onChange={(e) => handleChange('possessionYears', e.target.value)}
              placeholder="Ex: 10"
            />
          </div>
          <div className="space-y-2">
            <Label>Atividade Explorada</Label>
            <Input 
              value={formData.explorationActivity}
              onChange={(e) => handleChange('explorationActivity', e.target.value)}
              placeholder="Ex: Pecuária de Corte"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
