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
import { Button } from '@/components/ui/button'
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
  Search,
  Loader2,
  Globe,
} from 'lucide-react'
import {
  PropertyWizardFormValues,
  RURAL_ACTIVITIES,
  BRAZILIAN_STATES,
} from '@/lib/validations/property-wizard'
import {
  IMPENHORABILIDADE_OPTIONS,
  CONSERVATION_STATES,
} from '@/lib/validations/reference-data'
import { SmartCreatableCombobox } from '../subcomponents/SmartCreatableCombobox'
import { FarmMapModal, toDMS } from '../subcomponents/FarmMapModal'

const OWNERSHIP_LABELS: Record<string, string> = {
  PROPRIETARIO: 'Proprietário',
  ARRENDATARIO: 'Arrendatário',
  COMODATARIO: 'Comodatário',
  PARCEIRO: 'Parceiro / Meeiro',
  CONDOMINO: 'Condômino',
  USUFRUTUARIO: 'Usufrutuário',
  POSSEIRO: 'Posseiro',
}

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

  // Estados para busca de endereço e mapa interativo
  const [searchAddressQuery, setSearchAddressQuery] = React.useState<string>('')
  const [searchResults, setSearchResults] = React.useState<Array<any>>([])
  const [isSearchingAddress, setIsSearchingAddress] = React.useState<boolean>(false)
  const [isMapModalOpen, setIsMapModalOpen] = React.useState<boolean>(false)

  // Debounced search para API de geocodificação
  useEffect(() => {
    if (!searchAddressQuery || searchAddressQuery.trim().length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingAddress(true)
      try {
        const res = await fetch(
          `/api/geocode/search?q=${encodeURIComponent(searchAddressQuery)}`
        )
        const data = await res.json()
        setSearchResults(data.results || [])
      } catch (e) {
        console.error('Error fetching geocode:', e)
      } finally {
        setIsSearchingAddress(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [searchAddressQuery])

  useEffect(() => {
    const area = Number(totalArea) || 0
    const vtn = Number(vtnPerHectare) || 0
    setValue('totalLandValue', Math.round(area * vtn * 100) / 100)
  }, [totalArea, vtnPerHectare, setValue])

  const handleSelectAddress = (item: any) => {
    if (item.city) setValue('city', item.city)
    if (item.state) setValue('state', item.state)
    setValue('latitude', toDMS(item.lat, true))
    setValue('longitude', toDMS(item.lon, false))
    setSearchResults([])
    setSearchAddressQuery('')
  }

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
                      <SelectValue placeholder="Selecione a filial">
                        {branches.find((b) => b.id === field.value)?.name}
                      </SelectValue>
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
                      <SelectValue placeholder="Selecione o produtor rural">
                        {(() => {
                          const p = producers.find((prod) => prod.id === field.value)
                          return p ? `${p.name} ${p.document ? `(${p.document})` : ''}` : undefined
                        })()}
                      </SelectValue>
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
                      <SelectValue placeholder="Vínculo com a terra">
                        {OWNERSHIP_LABELS[field.value] || field.value}
                      </SelectValue>
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
          {/* BARRA DE PESQUISA DE ENDEREÇO & BOTÃO DO MAPA */}
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-[#1B4D3E] dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  Localizador Inteligente & Georreferenciamento
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Pesquise por município, vila ou rodovia, ou abra o mapa com satélite para marcar a sede da fazenda com um pin.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMapModalOpen(true)}
                className="bg-white dark:bg-slate-900 border-emerald-500 text-[#1B4D3E] dark:text-emerald-400 hover:bg-emerald-100/50 font-semibold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                Marcar Ponto no Mapa (Pin)
              </Button>
            </div>

            {/* Input de Busca de Endereço via API */}
            <div className="relative">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  value={searchAddressQuery}
                  onChange={(e) => setSearchAddressQuery(e.target.value)}
                  placeholder="Buscar endereço ou município via API (ex: Rodovia TO-050, Taguatinga, Palmas...)"
                  className="pl-9 pr-9 h-9 text-xs bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800"
                />
                {isSearchingAddress && (
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {/* Lista flutuante de resultados da busca */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800 animate-in fade-in zoom-in-95">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectAddress(item)}
                      className="w-full text-left p-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors flex items-start gap-2.5 cursor-pointer text-xs"
                    >
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-gray-800 dark:text-gray-100 block">
                          {item.city || item.displayName.split(',')[0]} {item.state ? `- ${item.state}` : ''}
                        </span>
                        <span className="text-[11px] text-muted-foreground line-clamp-1">
                          {item.displayName}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField
              control={control}
              name="city"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <div className="flex items-center justify-between">
                    <FormLabel>Município *</FormLabel>
                    <span className="text-[10px] text-muted-foreground">Ou escolha um polo abaixo</span>
                  </div>
                  <FormControl>
                    <Input placeholder="Ex: Taguatinga" {...field} />
                  </FormControl>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {[
                      { city: 'Palmas', uf: 'TO', lat: '10°11\'01.63"S', lng: '48°20\'01.11"O' },
                      { city: 'Taguatinga', uf: 'TO', lat: '12°24\'17.00"S', lng: '46°34\'17.00"O' },
                      { city: 'Porto Nacional', uf: 'TO', lat: '10°42\'29.00"S', lng: '48°25\'02.00"O' },
                      { city: 'Araguaína', uf: 'TO', lat: '07°11\'28.00"S', lng: '48°12\'28.00"O' },
                      { city: 'Gurupi', uf: 'TO', lat: '11°43\'47.00"S', lng: '49°04\'07.00"O' },
                      { city: 'Dianópolis', uf: 'TO', lat: '11°37\'29.00"S', lng: '46°49\'20.00"O' },
                    ].map((c) => (
                      <button
                        key={c.city}
                        type="button"
                        onClick={() => {
                          setValue('city', c.city)
                          setValue('state', c.uf)
                          if (!watch('latitude')) setValue('latitude', c.lat)
                          if (!watch('longitude')) setValue('longitude', c.lng)
                        }}
                        className="text-[10.5px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-gray-600 transition-colors border border-gray-200 cursor-pointer font-medium"
                      >
                        {c.city}
                      </button>
                    ))}
                  </div>
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
                  <Select onValueChange={field.onChange} value={field.value || 'TO'}>
                    <FormControl>
                      <SelectTrigger className="w-full font-mono font-medium">
                        <SelectValue placeholder="UF">
                          {field.value || 'TO'}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60">
                      {BRAZILIAN_STATES.map((st) => (
                        <SelectItem key={st.value} value={st.value}>
                          {st.label}
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

          <FarmMapModal
            isOpen={isMapModalOpen}
            onClose={() => setIsMapModalOpen(false)}
            initialLat={watch('latitude')}
            initialLng={watch('longitude')}
            initialCity={watch('city')}
            initialState={watch('state')}
            onConfirm={({ formattedLat, formattedLng, city, state }) => {
              setValue('latitude', formattedLat)
              setValue('longitude', formattedLng)
              if (city) setValue('city', city)
              if (state) setValue('state', state)
            }}
          />

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
                      <SelectValue placeholder="Selecione a condição legal">
                        {IMPENHORABILIDADE_OPTIONS.find((opt) => opt.value === field.value)?.label}
                      </SelectValue>
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
                      <SelectValue placeholder="Estado de conservação">
                        {CONSERVATION_STATES.find((opt) => opt.value === field.value)?.label}
                      </SelectValue>
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
