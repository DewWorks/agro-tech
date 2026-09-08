'use client'

import React, { useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LandPlot,
  FileText,
  MapPin,
  ShieldAlert,
  Compass,
  Building2,
  HelpCircle,
} from 'lucide-react'
import {
  PropertyWizardFormValues,
  RURAL_ACTIVITIES,
} from '@/lib/validations/property-wizard'
import {
  IMPENHORABILIDADE_OPTIONS,
  CONSERVATION_STATES,
} from '@/lib/validations/reference-data'
import { SmartCreatableCombobox } from '../subcomponents/SmartCreatableCombobox'

interface Step1LandProps {
  form: UseFormReturn<any>
  producers: Array<{ id: string; name: string; document?: string }>
  branches: Array<{ id: string; name: string }>
}

export function Step1Land({ form, producers, branches }: Step1LandProps) {
  const { control, watch, setValue } = form

  // Observadores para cálculo automático de Valor da Terra Nua
  const totalArea = watch('totalArea')
  const vtnPerHectare = watch('vtnPerHectare')

  useEffect(() => {
    const area = Number(totalArea) || 0
    const vtn = Number(vtnPerHectare) || 0
    setValue('totalLandValue', Math.round(area * vtn * 100) / 100)
  }, [totalArea, vtnPerHectare, setValue])

  return (
    <div className="space-y-6">
      {/* 1. IDENTIFICAÇÃO E PROPRIETÁRIO */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Identificação da Propriedade e Titularidade
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Nome da Fazenda / Imóvel Rural *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Fazenda Boa Esperança" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="branchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Filial de Atendimento *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a filial" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
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
            name="producerId"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Produtor Titular Vinculado *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o produtor rural" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {producers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.document ? `(${p.document})` : ''}
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
            name="ownershipType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Vínculo *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Vínculo com a terra" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PROPRIETARIO">Proprietário</SelectItem>
                    <SelectItem value="ARRENDATARIO">Arrendatário</SelectItem>
                    <SelectItem value="COMODATARIO">Comodatário</SelectItem>
                    <SelectItem value="PARCEIRO">Parceiro / Meeiro</SelectItem>
                    <SelectItem value="CONDOMINO">Condômino</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="explorationPercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>% Exploração do Produtor</FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={100} {...field} />
                </FormControl>
                <FormDescription>Geralmente 100%</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="possessionYears"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anos de Posse / Exploração</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="Ex: 5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="explorationActivity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Atividade Principal (Smart Combobox) *</FormLabel>
                <FormControl>
                  <SmartCreatableCombobox
                    value={field.value}
                    onChange={field.onChange}
                    options={RURAL_ACTIVITIES}
                    placeholder="Selecione ou digite a atividade"
                    searchPlaceholder="Buscar ou cadastrar atividade..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* 2. REGISTROS LEGAIS E DOCUMENTAIS (COM MÁSCARAS) */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <FileText className="w-5 h-5 text-emerald-600" />
            Documentação Fundiária & Registros Oficiais
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name="registrationNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matrícula (Apenas Números) *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 2718"
                    {...field}
                    onChange={(e) => {
                      // Bloqueio físico de caracteres não numéricos
                      const numOnly = e.target.value.replace(/\D/g, '')
                      field.onChange(numOnly)
                    }}
                  />
                </FormControl>
                <FormDescription>CRI - Sem letras ou pontos</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="registryOffice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cartório de Registro (CRI) *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 1º Ofício de Registro de Imóveis" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="comarca"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comarca do Cartório *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Taguatinga" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="car"
            render={({ field }) => (
              <FormItem className="md:col-span-3">
                <FormLabel>Código do CAR (Cadastro Ambiental Rural) *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: TO-1700000-ABCD.1234.EF56.7890.1234.5678.90AB"
                    className="font-mono uppercase text-xs"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase().trim())}
                  />
                </FormControl>
                <FormDescription>
                  Padrão federal: UF-CódigoMunicípio-Hash.Hash.Hash.Hash.Hash.Hash.Hash
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="ccir"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CCIR (Código INCRA - 13 dígitos) *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 0000276332244"
                    maxLength={13}
                    className="font-mono"
                    {...field}
                    onChange={(e) => {
                      const num = e.target.value.replace(/\D/g, '').slice(0, 13)
                      field.onChange(num)
                    }}
                  />
                </FormControl>
                <FormDescription>{field.value?.length || 0}/13 dígitos</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="itr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ITR / NIRF (Receita Federal - 8 dígitos) *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 54444829"
                    maxLength={8}
                    className="font-mono"
                    {...field}
                    onChange={(e) => {
                      const num = e.target.value.replace(/\D/g, '').slice(0, 8)
                      field.onChange(num)
                    }}
                  />
                </FormControl>
                <FormDescription>{field.value?.length || 0}/8 dígitos</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="ruralModules"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Módulos Fiscais / Rurais</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Ex: 2.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* 3. ÁREAS (ha) E NATUREZA DA TERRA (VTN) */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <LandPlot className="w-5 h-5 text-emerald-600" />
            Balanço de Áreas e Avaliação da Terra Nua (VTN)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <FormField
              control={control}
              name="totalArea"
              render={({ field }) => (
                <FormItem className="col-span-2 md:col-span-1">
                  <FormLabel className="text-emerald-700 dark:text-emerald-400 font-bold">
                    Área Total (ha) *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      className="border-emerald-500/40 font-bold"
                      placeholder="Ex: 500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="consolidatedArea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Área Consolidada (ha)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 350" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="productiveArea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agricultura / Lavoura (ha)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 200" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="pastureArea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pastagens (ha)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 150" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="preserveArea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reserva Legal & APP (ha)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Cálculo do Valor da Terra Nua */}
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <FormField
              control={control}
              name="vtnPerHectare"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-emerald-800 dark:text-emerald-300 font-semibold">
                    Valor da Terra Nua - VTN (R$ / ha)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="100"
                      placeholder="Ex: 25000"
                      className="bg-white dark:bg-slate-900 border-emerald-300"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Valor médio de mercado local por hectare</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-white dark:bg-slate-900 p-3 rounded-md border border-emerald-300/60 dark:border-emerald-800 flex flex-col justify-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Valor Total da Terra Nua (Cálculo Automático)
              </span>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(Number(watch('totalLandValue')) || 0)}
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                {totalArea || 0} ha × R$ {Number(vtnPerHectare || 0).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. LOCALIZAÇÃO, ROTEIRO E CONFRONTAÇÕES */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <MapPin className="w-5 h-5 text-emerald-600" />
            Localização Geodésica e Roteiro de Acesso
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField
              control={control}
              name="city"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Município *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Taguatinga" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UF *</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={2}
                      placeholder="TO"
                      className="uppercase"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude (Sede)</FormLabel>
                  <FormControl>
                    <Input placeholder={'Ex: 12°21\'03.13"S'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude (Sede)</FormLabel>
                  <FormControl>
                    <Input placeholder={'Ex: 46°11\'49.63"O'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="accessRoute"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Roteiro Detalhado de Acesso (Exigência Bancária) *</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Ex: Partindo de Taguatinga-TO pela rodovia TO-110 sentido Povoado Junco por 26 km, entrar à esquerda na estrada vicinal por mais 12 km até a sede da fazenda."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Mínimo 10 caracteres. Crucial para as vistorias prévias do Banco do Brasil e Sicredi.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confrontações */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1 mb-2">
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              Confrontações do Perímetro (Vizinhos / Limítrofes)
            </span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <FormField
                control={control}
                name="confrontantNorth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Norte</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Riacho do Ouro" className="text-xs" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="confrontantSouth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Sul</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Fazenda Bruteiro" className="text-xs" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="confrontantEast"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Leste</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Estrada Vicinal" className="text-xs" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="confrontantWest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Oeste</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Lote 387 Taguatinga" className="text-xs" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. INDICADORES DE RISCO E COMPLIANCE BANCÁRIO */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <ShieldAlert className="w-5 h-5 text-emerald-600" />
            Indicadores de Risco & Compliance Bancário
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="impenhorabilidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condição de Impenhorabilidade</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a condição legal" />
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Estado de conservação" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CONSERVATION_STATES.map((opt) => (
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

          <div className="md:col-span-2 pt-2 flex flex-wrap gap-6 items-center">
            <FormField
              control={control}
              name="hasLien"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-medium cursor-pointer">
                    Possui Gravame / Ônus com Terceiros?
                  </FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="hasInsurance"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-medium cursor-pointer">
                    Possui Seguro Agrícola / Patrimonial?
                  </FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="isBorderProperty"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-medium cursor-pointer">
                    Propriedade em Faixa de Fronteira / Limítrofe?
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
