'use client'

import React, { useState, useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import type * as LType from 'leaflet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, Search, Layers, Check, Loader2, Compass, Navigation } from 'lucide-react'

interface FarmMapModalProps {
  isOpen: boolean
  onClose: () => void
  initialLat?: string | number
  initialLng?: string | number
  initialCity?: string
  initialState?: string
  onConfirm: (data: {
    lat: number
    lng: number
    formattedLat: string
    formattedLng: string
    city?: string
    state?: string
  }) => void
}

export function toDMS(coordinate: number, isLat: boolean): string {
  if (coordinate === undefined || coordinate === null || isNaN(coordinate)) {
    return isLat ? '00°00\'00.00"S' : '00°00\'00.00"O'
  }
  const absolute = Math.abs(coordinate)
  const degrees = Math.floor(absolute)
  const minutesNotTruncated = (absolute - degrees) * 60
  const minutes = Math.floor(minutesNotTruncated)
  const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2)
  const direction = isLat
    ? coordinate >= 0
      ? 'N'
      : 'S'
    : coordinate >= 0
    ? 'L'
    : 'O'
  return `${degrees}°${minutes.toString().padStart(2, '0')}'${seconds}"${direction}`
}

export function parseCoordinate(
  coordStr?: string | number | null
): number | null {
  if (coordStr === undefined || coordStr === null || coordStr === '') return null
  if (typeof coordStr === 'number') return isNaN(coordStr) ? null : coordStr
  const str = String(coordStr).trim()
  const num = parseFloat(str)
  if (!isNaN(num) && /^-?\d+(\.\d+)?$/.test(str)) {
    return num
  }
  const match = str.match(/(\d+)[°\s]+(\d+)['\s]+([\d.]+)?["\s]*([NSEOWL])?/i)
  if (match) {
    const deg = parseFloat(match[1]) || 0
    const min = parseFloat(match[2]) || 0
    const sec = parseFloat(match[3]) || 0
    const dir = (match[4] || '').toUpperCase()
    let dec = deg + min / 60 + sec / 3600
    if (dir === 'S' || dir === 'O' || dir === 'W') {
      dec = -dec
    }
    return isNaN(dec) ? null : dec
  }
  return null
}

const QUICK_CITIES = [
  { name: 'Palmas - TO', lat: -10.1838, lng: -48.3336, city: 'Palmas', state: 'TO' },
  { name: 'Taguatinga - TO', lat: -12.4047, lng: -46.5714, city: 'Taguatinga', state: 'TO' },
  { name: 'Porto Nacional - TO', lat: -10.7081, lng: -48.4172, city: 'Porto Nacional', state: 'TO' },
  { name: 'Dianópolis - TO', lat: -11.6247, lng: -46.8222, city: 'Dianópolis', state: 'TO' },
  { name: 'Gurupi - TO', lat: -11.7297, lng: -49.0686, city: 'Gurupi', state: 'TO' },
  { name: 'Araguaína - TO', lat: -7.1911, lng: -48.2078, city: 'Araguaína', state: 'TO' },
  { name: 'Paraíso - TO', lat: -10.1753, lng: -48.8819, city: 'Paraíso do Tocantins', state: 'TO' },
  { name: 'Luís Eduardo - BA', lat: -12.0958, lng: -45.7958, city: 'Luís Eduardo Magalhães', state: 'BA' },
  { name: 'Formosa do Rio Preto - BA', lat: -11.0478, lng: -45.1931, city: 'Formosa do Rio Preto', state: 'BA' },
]

function resolveInitialCoords(initialLat?: string | number, initialLng?: string | number, initialCity?: string) {
  const pLat = parseCoordinate(initialLat)
  const pLng = parseCoordinate(initialLng)
  if (pLat !== null && pLng !== null) {
    return { lat: pLat, lng: pLng }
  }

  // Se não há coordenadas preenchidas, busca correspondência com o município selecionado
  if (initialCity && initialCity.trim()) {
    const norm = initialCity.trim().toLowerCase()
    const found = QUICK_CITIES.find(
      (c) => c.city.toLowerCase().includes(norm) || norm.includes(c.city.toLowerCase())
    )
    if (found) {
      return { lat: found.lat, lng: found.lng }
    }
  }

  // Padrão Tocantins (Palmas / Centro do Estado)
  return { lat: -10.1838, lng: -48.3336 }
}

export function FarmMapModal({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  initialCity = '',
  initialState = 'TO',
  onConfirm,
}: FarmMapModalProps) {
  const initialResolved = resolveInitialCoords(initialLat, initialLng, initialCity)

  const [currentLat, setCurrentLat] = useState<number>(initialResolved.lat)
  const [currentLng, setCurrentLng] = useState<number>(initialResolved.lng)
  const [selectedCity, setSelectedCity] = useState<string>(initialCity)
  const [selectedState, setSelectedState] = useState<string>(initialState)
  const [mapLoading, setMapLoading] = useState<boolean>(true)

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [suggestions, setSuggestions] = useState<Array<any>>([])
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [showDropdown, setShowDropdown] = useState<boolean>(false)

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<LType.Map | null>(null)
  const markerRef = useRef<LType.Marker | null>(null)

  // Inicializa o mapa Leaflet nativamente no React ao abrir o diálogo
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    const resolved = resolveInitialCoords(initialLat, initialLng, initialCity)
    setCurrentLat(resolved.lat)
    setCurrentLng(resolved.lng)
    setSelectedCity(initialCity)
    setSelectedState(initialState)
    setSearchQuery('')
    setSuggestions([])
    setShowDropdown(false)
    setMapLoading(true)

    const resizeTimers: NodeJS.Timeout[] = []
    let resizeListener: (() => void) | null = null

    async function initLeafletMap() {
      try {
        const L = (await import('leaflet')).default

        if (!isMounted || !mapContainerRef.current) return

        // Destrói instância anterior se houver para evitar conflitos de _leaflet_id
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove()
          } catch {}
          mapInstanceRef.current = null
        }

        if (mapContainerRef.current) {
          try {
            delete (mapContainerRef.current as any)._leaflet_id
          } catch {}
        }

        // Camadas de Satélite e Ruas
        const satellite = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            maxZoom: 19,
            attribution: '© Esri Satellite',
          }
        )

        const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        })

        const googleHybrid = L.tileLayer(
          'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          {
            maxZoom: 20,
            attribution: '© Google',
          }
        )

        if (!isMounted || !mapContainerRef.current) return

        const map = L.map(mapContainerRef.current, {
          center: [resolved.lat, resolved.lng],
          zoom: 13,
          layers: [satellite],
          zoomControl: true,
        })

        const baseMaps = {
          'Satélite Esri': satellite,
          'Google Híbrido': googleHybrid,
          'Ruas & Rodovias': osm,
        }

        L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(map)

        // Marcador visual (Pin) arrastável
        const pinIcon = L.divIcon({
          className: 'custom-pin-marker',
          html: `
            <div style="
              background: #10b981;
              color: white;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 4px 16px rgba(0,0,0,0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              width: 38px;
              height: 38px;
              cursor: grab;
              user-select: none;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 36],
        })

        const marker = L.marker([resolved.lat, resolved.lng], {
          icon: pinIcon,
          draggable: true,
        }).addTo(map)

        // Ao arrastar o pin, atualiza as coordenadas no estado React
        marker.on('dragend', (e) => {
          if (!isMounted) return
          const pos = e.target.getLatLng()
          setCurrentLat(pos.lat)
          setCurrentLng(pos.lng)
        })

        // Ao clicar em qualquer local do mapa, move o pin
        map.on('click', (e) => {
          if (!isMounted) return
          marker.setLatLng(e.latlng)
          setCurrentLat(e.latlng.lat)
          setCurrentLng(e.latlng.lng)
        })

        mapInstanceRef.current = map
        markerRef.current = marker
        setMapLoading(false)

        // Redimensionamentos protegidos para sincronizar com as animações de abertura do Radix Dialog
        const safeForceResize = () => {
          if (!isMounted) return
          const currentMap = mapInstanceRef.current as any
          if (currentMap && currentMap._mapPane && currentMap._loaded) {
            try {
              currentMap.invalidateSize(true)
            } catch (e) {
              // Silencia erros transitórios durante animação de desmontagem
            }
          }
        }

        resizeListener = safeForceResize
        window.addEventListener('resize', safeForceResize)

        resizeTimers.push(setTimeout(safeForceResize, 60))
        resizeTimers.push(setTimeout(safeForceResize, 180))
        resizeTimers.push(setTimeout(safeForceResize, 380))
        resizeTimers.push(setTimeout(safeForceResize, 750))
        resizeTimers.push(setTimeout(safeForceResize, 1300))
      } catch (err) {
        console.error('[FarmMapModal] Erro ao instanciar Leaflet:', err)
        setMapLoading(false)
      }
    }

    // Pequeno atraso para garantir que o container DOM já possui dimensões no Dialog
    const initTimer = setTimeout(initLeafletMap, 30)

    return () => {
      isMounted = false
      clearTimeout(initTimer)
      resizeTimers.forEach(clearTimeout)
      if (resizeListener) {
        window.removeEventListener('resize', resizeListener)
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch {}
        mapInstanceRef.current = null
      }
      markerRef.current = null
    }
  }, [isOpen, initialLat, initialLng, initialCity, initialState])

  // Debounced search para sugestões de cidades enquanto digita
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(
          `/api/geocode/search?q=${encodeURIComponent(searchQuery.trim())}`
        )
        const data = await res.json()
        const results = data.results || []
        setSuggestions(results)
        setShowDropdown(results.length > 0)
      } catch (err) {
        console.warn('Erro ao buscar sugestões no mapa:', err)
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const selectPlace = (item: {
    lat: number
    lon?: number
    lng?: number
    city?: string
    state?: string
    displayName?: string
    name?: string
  }) => {
    const lat = Number(item.lat)
    const lng = Number(item.lon ?? item.lng ?? currentLng)
    if (isNaN(lat) || isNaN(lng)) return

    setCurrentLat(lat)
    setCurrentLng(lng)
    if (item.city) setSelectedCity(item.city)
    if (item.state) setSelectedState(item.state)
    setSearchQuery(item.displayName || item.name || item.city || '')
    setShowDropdown(false)

    // Reposiciona mapa e pin instantaneamente de forma segura
    const map = mapInstanceRef.current as any
    if (map && map._mapPane && map._loaded) {
      try {
        map.invalidateSize(true)
        map.flyTo([lat, lng], 14, { duration: 1.0 })
      } catch (e) {
        // Silencia exceções transitórias de renderização do Leaflet
      }
    }
    if (markerRef.current) {
      try {
        markerRef.current.setLatLng([lat, lng])
      } catch (e) {}
    }
  }

  const handleConfirm = () => {
    onConfirm({
      lat: currentLat,
      lng: currentLng,
      formattedLat: toDMS(currentLat, true),
      formattedLng: toDMS(currentLng, false),
      city: selectedCity,
      state: selectedState,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-5xl md:max-w-6xl lg:max-w-7xl h-[90vh] max-h-[850px] p-0 flex flex-col overflow-hidden rounded-2xl border border-emerald-900/20 shadow-2xl bg-white dark:bg-slate-900">
        <DialogHeader className="p-4 pb-3 border-b border-gray-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-[#1B4D3E] dark:text-emerald-400 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Localização Geodésica da Fazenda no Mapa
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                O pin já está posicionado. Arraste-o ou clique no mapa para definir a sede da fazenda com precisão.
              </DialogDescription>
            </div>

            {/* Campo de Busca Rápida com Sugestões de Cidades */}
            <div className="relative w-full md:w-96">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                  placeholder="Digite cidade, município ou rodovia..."
                  className="pl-9 pr-9 h-9 text-xs bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-700 shadow-2xs font-medium"
                />
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {/* Dropdown de Sugestões de Cidades e Locais */}
              {showDropdown && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectPlace(item)}
                      className="w-full text-left p-3 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors flex items-start gap-2.5 cursor-pointer text-xs"
                    >
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-gray-800 dark:text-gray-100 truncate">
                            {item.city || (typeof item.displayName === 'string' ? item.displayName.split(',')[0] : '') || item.name || 'Local'}
                          </span>
                          {item.state && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                              {item.state}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {item.displayName || item.city || ''}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Atalhos Rápidos para Cidades do Tocantins / Polo */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-emerald-600" />
              Polos Sugeridos:
            </span>
            {QUICK_CITIES.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => selectPlace(c)}
                className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 hover:border-emerald-400 text-gray-700 dark:text-gray-300 font-medium transition-colors cursor-pointer shadow-2xs"
              >
                {c.name}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Visualizador Nativo do Mapa Leaflet */}
        <div className="relative flex-1 w-full min-h-[420px] bg-slate-900 overflow-hidden">
          {mapLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 text-white gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <span className="text-xs text-slate-300">Carregando mapa e camadas de satélite...</span>
            </div>
          )}

          {/* Container DOM do Leaflet */}
          <div
            ref={mapContainerRef}
            className="w-full h-full min-h-[420px] z-0 [&_.leaflet-control-layers]:rounded-xl [&_.leaflet-control-layers]:shadow-lg [&_.leaflet-control-layers]:border [&_.leaflet-control-layers]:border-slate-200 [&_.custom-pin-marker]:!border-0 [&_.custom-pin-marker]:!bg-transparent"
          />

          {/* Badge Informativo Flutuante com as Coordenadas Atuais */}
          <div className="absolute bottom-4 left-4 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-emerald-400/80 dark:border-emerald-700 px-4 py-2.5 rounded-2xl shadow-xl flex flex-wrap items-center gap-3 text-xs pointer-events-auto">
            <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 font-bold">
              <Compass className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Sede da Fazenda:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <span className="bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-semibold">
                Lat: {toDMS(currentLat, true)} ({currentLat.toFixed(6)})
              </span>
              <span className="bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-semibold">
                Long: {toDMS(currentLng, false)} ({currentLng.toFixed(6)})
              </span>
              {selectedCity && (
                <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-300 text-gray-700 dark:text-gray-300 font-sans font-medium">
                  {selectedCity} {selectedState ? `- ${selectedState}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 pt-3 border-t border-gray-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Alterne entre Satélite e Ruas no botão superior direito do mapa.</span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-9 px-4 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="text-xs h-9 px-5 rounded-xl bg-[#1B4D3E] hover:bg-[#143B2F] text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Confirmar Coordenadas & Localização
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
