'use client'

import React from 'react'
import { Control } from 'react-hook-form'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldAlert, Compass } from 'lucide-react'
import {
  IMPENHORABILIDADE_OPTIONS,
  CONSERVATION_STATES,
} from '@/lib/validations/reference-data'

interface LandLegalRiskCardProps {
  control: Control<any>
}

export function LandLegalRiskCard({ control }: LandLegalRiskCardProps) {
  return (
    <>
      {/* 5. INDICADORES DE RISCO BANCÁRIO & SITUAÇÃO JURÍDICA */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <ShieldAlert className="w-5 h-5 text-emerald-600" />
            Indicadores de Risco Bancário e Situação Jurídica
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name="impenhorabilidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status de Penhorabilidade *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || 'PENHORAVEL'}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Penhorabilidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {IMPENHORABILIDADE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="conservationState"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado Geral de Conservação</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || 'BOM'}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Conservação" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CONSERVATION_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="condominiumType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Condomínio</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || 'INEXISTENTE'}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Condomínio" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INEXISTENTE">Inexistente (Individual)</SelectItem>
                    <SelectItem value="PRO_DIVISO">Pró-Diviso (Área demarcada)</SelectItem>
                    <SelectItem value="PRO_INDIVISO">Pró-Indiviso (Comum)</SelectItem>
                    <SelectItem value="BEM_COMUM">Bem Comum</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <FormField
              control={control}
              name="hasLien"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 bg-slate-50/50 dark:bg-slate-900/30">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-0.5">
                    <FormLabel className="text-xs font-semibold">Possui Gravame / Hipoteca</FormLabel>
                    <FormDescription className="text-[10px]">
                      Consta ônus na matrícula do CRI
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="hasInsurance"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 bg-slate-50/50 dark:bg-slate-900/30">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-0.5">
                    <FormLabel className="text-xs font-semibold">Seguro Rural Contratado</FormLabel>
                    <FormDescription className="text-[10px]">
                      Apólice de seguro vigente
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="isBorderProperty"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 bg-slate-50/50 dark:bg-slate-900/30">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-0.5">
                    <FormLabel className="text-xs font-semibold">Faixa de Fronteira</FormLabel>
                    <FormDescription className="text-[10px]">
                      Imóvel em raio de segurança nacional
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* 6. ROTEIRO DE ACESSO E CONFRONTAÇÕES */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Compass className="w-5 h-5 text-emerald-600" />
            Roteiro de Acesso & Confrontações Perimétricas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <FormField
            control={control}
            name="accessRoute"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Roteiro Detalhado de Acesso (Vistoria / Laudo)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ex: Saindo de Taguatinga sentido Dianópolis pela TO-050, seguir 15km de asfalto, entrar à direita na estrada vicinal do Córrego Grande e percorrer 8km até a porteira de entrada."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Indique rodovias, quilometragens, pontos de referência e condições das estradas vicinais.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-3">
              Confrontações e Limites da Propriedade
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <FormField
                control={control}
                name="confrontants.north"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Norte</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Córrego das Pedras" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="confrontants.south"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Sul</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Fazenda Santa Maria" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="confrontants.east"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Leste</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Rodovia TO-050" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="confrontants.west"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Oeste</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Rio da Conceição" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
