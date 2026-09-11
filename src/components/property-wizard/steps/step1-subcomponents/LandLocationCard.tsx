'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Control, UseFormSetValue } from 'react-hook-form'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Globe, Search, Loader2 } from 'lucide-react'
import { BRAZILIAN_STATES } from '@/lib/validations/property-wizard'
import { toDMS } from '../../subcomponents/FarmMapModal'

// Code splitting: FarmMapModal carregado dinamicamente no client-side sob demanda
const FarmMapModal = dynamic(
  () => import('../../subcomponents/FarmMapModal').then((mod) => mod.FarmMapModal),
  { ssr: false }
)

interface LandLocationCardProps {
  control: Control<any>
  setValue: UseFormSetValue<any>
  watch: (name: string) => any
}

const TOCANTINS_POLOS = [
  { city: 'Palmas', uf: 'TO', lat: '10°11\'01.63"S', lng: '48°20\'01.11"O' },
  { city: 'Taguatinga', uf: 'TO', lat: '12°24\'17.00"S', lng: '46°34\'17.00"O' },
  { city: 'Porto Nacional', uf: 'TO', lat: '10°42\'29.00"S', lng: '48°25\'02.00"O' },
  { city: 'Araguaína', uf: 'TO', lat: '07°11\'28.00"S', lng: '48°12\'28.00"O' },
  { city: 'Gurupi', uf: 'TO', lat: '11°43\'45.00"S', lng: '49°04\'07.00"O' },
  { city: 'Dianópolis', uf: 'TO', lat: '11°37\'40.00"S', lng: '46°49\'22.00"O' },
]

export function LandLocationCard({ control, setValue, watch }: LandLocationCardProps) {
  const [searchAddressQuery, setSearchAddressQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<Array<any>>([])
  const [isSearchingAddress, setIsSearchingAddress] = useState<boolean>(false)
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false)

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

  const handleSelectAddress = (item: any) => {
    if (item.city) setValue('city', item.city)
    if (item.state) setValue('state', item.state)
    const lat = Number(item.lat)
    const lon = Number(item.lon)
    if (!isNaN(lat)) setValue('latitude', toDMS(lat, true))
    if (!isNaN(lon)) setValue('longitude', toDMS(lon, false))
    setSearchResults([])
    setSearchAddressQuery('')
  }

  return (
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
                        {item.city || (typeof item.displayName === 'string' ? item.displayName.split(',')[0] : '') || item.name || 'Local'} {item.state ? `- ${item.state}` : ''}
                      </span>
                      <span className="text-[11px] text-muted-foreground line-clamp-1">
                        {item.displayName || item.city || ''}
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
                  {TOCANTINS_POLOS.map((polo) => (
                    <button
                      key={polo.city}
                      type="button"
                      onClick={() => {
                        setValue('city', polo.city)
                        setValue('state', polo.uf)
                        setValue('latitude', polo.lat)
                        setValue('longitude', polo.lng)
                      }}
                      className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      {polo.city}
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
                <FormLabel>UF / Estado *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || 'TO'}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="UF">
                        {BRAZILIAN_STATES.find((uf) => uf.value === (field.value || 'TO'))?.label || field.value || 'TO'}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-60">
                    {BRAZILIAN_STATES.map((uf) => (
                      <SelectItem key={uf.value} value={uf.value}>
                        {uf.label}
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
            name="neighborhood"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro / Distrito / Região</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Zona Rural" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="latitude"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Latitude (Geodésica ou Decimal) *</FormLabel>
                <FormControl>
                  <Input
                    placeholder={'Ex: 12°24\'17"S ou -12.4047'}
                    className="font-mono text-xs"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Padrão BB: Graus, Minutos e Segundos (DMS)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="longitude"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Longitude (Geodésica ou Decimal) *</FormLabel>
                <FormControl>
                  <Input
                    placeholder={'Ex: 46°34\'17"O ou -46.5714'}
                    className="font-mono text-xs"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Padrão BB: Graus, Minutos e Segundos (DMS)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* MODAL DO MAPA INTERATIVO (CARREGADO LAZY VIA DYNAMIC) */}
        {isMapModalOpen && (
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
        )}
      </CardContent>
    </Card>
  )
}
