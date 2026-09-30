'use client'

import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, Building, Car, Plus, Trash2 } from 'lucide-react'

interface SecondaryCollateralSectionProps {
  activeForm: UseFormReturn<any>
  urbanFields: any[]
  appendUrban: (val: any) => void
  removeUrban: (idx: number) => void
  vehicleFields: any[]
  appendVehicle: (val: any) => void
  removeVehicle: (idx: number) => void
}

export function SecondaryCollateralSection({
  activeForm,
  urbanFields,
  appendUrban,
  removeUrban,
  vehicleFields,
  appendVehicle,
  removeVehicle,
}: SecondaryCollateralSectionProps) {
  const { watch, setValue, register } = activeForm

  return (
    <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20 shadow-xs">
      <CardHeader className="pb-3 border-b border-blue-100 dark:border-blue-900/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-900 dark:text-blue-300">
            <Building2 className="w-4 h-4 text-blue-600" />
            Bens Secundários de Garantia (Imóveis Urbanos & Frotas)
          </CardTitle>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-[10px]">
            Lastro Complementar MCR
          </Badge>
        </div>
        <CardDescription className="text-xs text-blue-800/80 dark:text-blue-300/80">
          Cadastre imóveis urbanos (margem aceitável de 50%) e veículos (margem aceitável de 40%) livres de alienação fiduciária.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* 1. Imóveis Urbanos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              Imóveis Urbanos ({urbanFields.length})
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendUrban({
                  propertyType: 'RESIDENCIAL',
                  description: '',
                  city: '',
                  state: 'GO',
                  marketValue: 0,
                  hasLien: false,
                  liquidityRating: 'MEDIA',
                })
              }
              className="text-xs h-7 border-blue-200 text-blue-700 hover:bg-blue-100 cursor-pointer gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Imóvel Urbano
            </Button>
          </div>

          {urbanFields.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              Nenhum imóvel urbano adicionado. Clique no botão acima caso deseje reforçar as garantias com bens de cidade.
            </p>
          ) : (
            <div className="space-y-2">
              {urbanFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="p-3 bg-white dark:bg-slate-900 border border-blue-200 rounded-lg grid grid-cols-1 sm:grid-cols-6 gap-2 items-center"
                >
                  <div className="sm:col-span-1">
                    <Label className="text-[10px] text-slate-500">Tipo</Label>
                    <Select
                      value={watch(`urbanProperties.${idx}.propertyType`) || 'RESIDENCIAL'}
                      onValueChange={(val) => setValue(`urbanProperties.${idx}.propertyType`, val)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RESIDENCIAL">Residencial</SelectItem>
                        <SelectItem value="COMERCIAL">Comercial</SelectItem>
                        <SelectItem value="TERRENO_LOTE">Terreno/Lote</SelectItem>
                        <SelectItem value="GALPAO_INDUSTRIAL">Galpão</SelectItem>
                        <SelectItem value="OUTRO">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-[10px] text-slate-500">Descrição do Imóvel</Label>
                    <Input
                      placeholder="Ex: Apartamento Setor Bueno"
                      className="h-8 text-xs"
                      {...register(`urbanProperties.${idx}.description`)}
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <Label className="text-[10px] text-slate-500">Cidade/UF</Label>
                    <Input
                      placeholder="Ex: Goiânia/GO"
                      className="h-8 text-xs"
                      {...register(`urbanProperties.${idx}.city`)}
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <Label className="text-[10px] text-slate-500">Valor de Mercado (R$)</Label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      className="h-8 text-xs font-mono"
                      {...register(`urbanProperties.${idx}.marketValue`, { valueAsNumber: true })}
                    />
                  </div>

                  <div className="sm:col-span-1 flex items-center justify-between pt-3 sm:pt-0">
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={Boolean(watch(`urbanProperties.${idx}.hasLien`))}
                        onCheckedChange={(checked) => setValue(`urbanProperties.${idx}.hasLien`, checked)}
                        id={`urban-lien-${idx}`}
                      />
                      <Label htmlFor={`urban-lien-${idx}`} className="text-[10px] text-slate-600 cursor-pointer">
                        Alienado
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUrban(idx)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Veículos e Frotas */}
        <div className="space-y-3 pt-3 border-t border-blue-100 dark:border-blue-900/50">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-blue-600" />
              Veículos & Utilitários ({vehicleFields.length})
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendVehicle({
                  vehicleType: 'CAMINHONETE',
                  brand: '',
                  model: '',
                  modelYear: new Date().getFullYear(),
                  licensePlate: '',
                  declaredValue: 0,
                  hasLien: false,
                })
              }
              className="text-xs h-7 border-blue-200 text-blue-700 hover:bg-blue-100 cursor-pointer gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Veículo
            </Button>
          </div>

          {vehicleFields.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              Nenhum veículo cadastrado para lastro. Caminhonetes, caminhões e utilitários podem compor até 40% de garantia.
            </p>
          ) : (
            <div className="space-y-2">
              {vehicleFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="p-3 bg-white dark:bg-slate-900 border border-blue-200 rounded-lg grid grid-cols-1 sm:grid-cols-6 gap-2 items-center"
                >
                  <div className="sm:col-span-1">
                    <Label className="text-[10px] text-slate-500">Tipo</Label>
                    <Select
                      value={watch(`vehicles.${idx}.vehicleType`) || 'CAMINHONETE'}
                      onValueChange={(val) => setValue(`vehicles.${idx}.vehicleType`, val)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CAMINHONETE">Caminhonete</SelectItem>
                        <SelectItem value="CAMINHAO">Caminhão</SelectItem>
                        <SelectItem value="AUTOMOVEL">Automóvel</SelectItem>
                        <SelectItem value="TRATOR_UTILITARIO">Trator Utilitário</SelectItem>
                        <SelectItem value="CARRETA">Carreta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-[10px] text-slate-500">Marca / Modelo</Label>
                    <Input
                      placeholder="Ex: Toyota Hilux SRX"
                      className="h-8 text-xs"
                      {...register(`vehicles.${idx}.model`)}
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <Label className="text-[10px] text-slate-500">Placa / Ano</Label>
                    <Input
                      placeholder="Ex: BRA2E19 (2024)"
                      className="h-8 text-xs"
                      {...register(`vehicles.${idx}.licensePlate`)}
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <Label className="text-[10px] text-slate-500">Valor Declarado (R$)</Label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      className="h-8 text-xs font-mono"
                      {...register(`vehicles.${idx}.declaredValue`, { valueAsNumber: true })}
                    />
                  </div>

                  <div className="sm:col-span-1 flex items-center justify-between pt-3 sm:pt-0">
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={Boolean(watch(`vehicles.${idx}.hasLien`))}
                        onCheckedChange={(checked) => setValue(`vehicles.${idx}.hasLien`, checked)}
                        id={`vehicle-lien-${idx}`}
                      />
                      <Label htmlFor={`vehicle-lien-${idx}`} className="text-[10px] text-slate-600 cursor-pointer">
                        Alienado
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVehicle(idx)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
