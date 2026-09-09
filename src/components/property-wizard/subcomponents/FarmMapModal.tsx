'use client'

import React, { useState, useEffect, useRef } from 'react'
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
    return dec
  }
  return null
}

const QUICK_CITIES = [
  { name: 'Palmas - TO', lat: -10.1838, lng: -48.3336, city: 'Palmas', state: 'TO' },
  { name: 'Taguatinga - TO', lat: -12.4047, lng: -46.5714, city: 'Taguatinga', state: 'TO' },
  { name: 'Porto Nacional - TO', lat: -10.7081, lng: -48.4172, city: 'Porto Nacional', state: 'TO' },
  { name: 'Araguaína - TO', lat: -7.1911, lng: -48.2078, city: 'Araguaína', state: 'TO' },
  { name: 'Gurupi - TO', lat: -11.7297, lng: -49.0686, city: 'Gurupi', state: 'TO' },
  { name: 'Dianópolis - TO', lat: -11.6247, lng: -46.8222, city: 'Dianópolis', state: 'TO' },
]

export function FarmMapModal({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  initialCity = '',
  initialState = 'TO',
  onConfirm,
}: FarmMapModalProps) {
  const parsedLat = parseCoordinate(initialLat) ?? -10.184
  const parsedLng = parseCoordinate(initialLng) ?? -48.333

  const [currentLat, setCurrentLat] = useState<number>(parsedLat)
  const [currentLng, setCurrentLng] = useState<number>(parsedLng)
  const [selectedCity, setSelectedCity] = useState<string>(initialCity)
  const [selectedState, setSelectedState] = useState<string>(initialState)
  const [hasMarker, setHasMarker] = useState<boolean>(
    Boolean(initialLat && initialLng)
  )

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [suggestions, setSuggestions] = useState<Array<any>>([])
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [showDropdown, setShowDropdown] = useState<boolean>(false)

  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (isOpen) {
      const lat = parseCoordinate(initialLat) ?? -10.184
      const lng = parseCoordinate(initialLng) ?? -48.333
      setCurrentLat(lat)
      setCurrentLng(lng)
      setSelectedCity(initialCity)
      setSelectedState(initialState)
      setHasMarker(Boolean(initialLat && initialLng))
      setSearchQuery('')
      setSuggestions([])
      setShowDropdown(false)
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
        console.error('Error fetching suggestions in map modal:', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Escutar mensagens do iframe quando o usuário clica ou arrasta o pin no mapa
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'MAP_CLICKED') {
        const lat = Number(e.data.lat)
        const lng = Number(e.data.lng)
        if (!isNaN(lat) && !isNaN(lng)) {
          setCurrentLat(lat)
          setCurrentLng(lng)
          setHasMarker(true)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const selectPlace = (item: { lat: number; lon?: number; lng?: number; city?: string; state?: string; displayName?: string; name?: string }) => {
    const lat = item.lat
    const lng = item.lon ?? item.lng ?? currentLng
    setCurrentLat(lat)
    setCurrentLng(lng)
    setHasMarker(true)
    if (item.city) setSelectedCity(item.city)
    if (item.state) setSelectedState(item.state)
    setSearchQuery(item.displayName || item.name || '')
    setShowDropdown(false)

    // Enviar mensagem para o iframe reposicionar o mapa e o pin
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'SET_MAP_CENTER',
          lat,
          lng,
        },
        '*'
      )
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

  // HTML auto-contido do Leaflet para o iframe
  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #e5e7eb; }
    .custom-pin {
      background: #1B4D3E;
      color: white;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 14px rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px !important;
      height: 36px !important;
      font-size: 18px;
      font-weight: bold;
      animation: bounce 0.4s ease;
      cursor: grab;
    }
    .custom-pin:active {
      cursor: grabbing;
    }
    @keyframes bounce {
      0% { transform: translateY(-16px); }
      100% { transform: translateY(0); }
    }
    .leaflet-control-layers {
      border-radius: 10px !important;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25) !important;
      font-family: system-ui, sans-serif !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      padding: 6px 10px !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var initialLat = ${currentLat};
    var initialLng = ${currentLng};
    var hasMarker = ${hasMarker};

    // Camadas de Mapa (Ruas e Satélite de Alta Resolução)
    var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    });

    var satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '© Esri Satellite'
    });

    var map = L.map('map', {
      center: [initialLat, initialLng],
      zoom: hasMarker ? 14 : 9,
      layers: [satellite] // Começar em Satélite
    });

    var baseMaps = {
      "Satélite (Fotografia Aérea)": satellite,
      "Mapa de Ruas & Estradas": osm
    };

    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

    var pinIcon = L.divIcon({
      className: 'custom-pin',
      html: '📍',
      iconSize: [36, 36],
      iconAnchor: [18, 34]
    });

    var marker = null;

    function setPin(lat, lng) {
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
        marker.on('dragend', function(e) {
          var pos = e.target.getLatLng();
          window.parent.postMessage({ type: 'MAP_CLICKED', lat: pos.lat, lng: pos.lng }, '*');
        });
      }
      window.parent.postMessage({ type: 'MAP_CLICKED', lat: lat, lng: lng }, '*');
    }

    if (hasMarker) {
      setPin(initialLat, initialLng);
    }

    map.on('click', function(e) {
      setPin(e.latlng.lat, e.latlng.lng);
    });

    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'SET_MAP_CENTER') {
        map.flyTo([e.data.lat, e.data.lng], 14, { duration: 1.2 });
        setPin(e.data.lat, e.data.lng);
      }
    });
  </script>
</body>
</html>
  `

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
                Pesquise por cidade/rodovia ou clique em qualquer ponto do mapa (Satélite) para posicionar o pin na sede da fazenda.
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
                            {item.city || item.displayName.split(',')[0]}
                          </span>
                          {item.state && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                              {item.state}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {item.displayName}
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
              Cidades Sugeridas:
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

        {/* Visualizador do Mapa (Ocupa todo o espaço vertical disponível) */}
        <div className="relative flex-1 w-full min-h-[420px] bg-slate-100">
          <iframe
            ref={iframeRef}
            srcDoc={mapHtml}
            className="w-full h-full border-0 block"
            title="Farm Location Map"
          />

          {/* Badge Informativo Flutuante com as Coordenadas Atuais */}
          <div className="absolute bottom-4 left-4 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-emerald-400/80 dark:border-emerald-700 px-4 py-2.5 rounded-2xl shadow-xl flex flex-wrap items-center gap-3 text-xs">
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
