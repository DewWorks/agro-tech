import { NextResponse } from 'next/server'

// Base offline de municípios e polos agropecuários para resposta instantânea e fallback
const OFFLINE_AGRO_HUBS = [
  // Tocantins (Principais polos agrícolas e cidades)
  { city: 'Palmas', state: 'TO', lat: -10.1838, lon: -48.3336, displayName: 'Palmas, Tocantins, Brasil' },
  { city: 'Taguatinga', state: 'TO', lat: -12.4047, lon: -46.5714, displayName: 'Taguatinga, Tocantins, Brasil' },
  { city: 'Porto Nacional', state: 'TO', lat: -10.7081, lon: -48.4172, displayName: 'Porto Nacional, Tocantins, Brasil' },
  { city: 'Araguaína', state: 'TO', lat: -7.1911, lon: -48.2078, displayName: 'Araguaína, Tocantins, Brasil' },
  { city: 'Gurupi', state: 'TO', lat: -11.7297, lon: -49.0686, displayName: 'Gurupi, Tocantins, Brasil' },
  { city: 'Dianópolis', state: 'TO', lat: -11.6247, lon: -46.8222, displayName: 'Dianópolis, Tocantins, Brasil' },
  { city: 'Paraíso do Tocantins', state: 'TO', lat: -10.1753, lon: -48.8819, displayName: 'Paraíso do Tocantins, Tocantins, Brasil' },
  { city: 'Colinas do Tocantins', state: 'TO', lat: -8.0578, lon: -48.4764, displayName: 'Colinas do Tocantins, Tocantins, Brasil' },
  { city: 'Guaraí', state: 'TO', lat: -8.8353, lon: -48.5108, displayName: 'Guaraí, Tocantins, Brasil' },
  { city: 'Almas', state: 'TO', lat: -11.5739, lon: -47.1703, displayName: 'Almas, Tocantins, Brasil' },
  { city: 'Natividade', state: 'TO', lat: -11.7144, lon: -47.7275, displayName: 'Natividade, Tocantins, Brasil' },
  { city: 'Pedro Afonso', state: 'TO', lat: -8.9692, lon: -48.1764, displayName: 'Pedro Afonso, Tocantins, Brasil' },
  { city: 'Formoso do Araguaia', state: 'TO', lat: -11.7967, lon: -49.5297, displayName: 'Formoso do Araguaia, Tocantins, Brasil' },
  { city: 'Lagoa da Confusão', state: 'TO', lat: -10.7933, lon: -49.6239, displayName: 'Lagoa da Confusão, Tocantins, Brasil' },
  { city: 'Miracema do Tocantins', state: 'TO', lat: -9.5667, lon: -48.3967, displayName: 'Miracema do Tocantins, Tocantins, Brasil' },
  { city: 'Arraias', state: 'TO', lat: -12.9292, lon: -46.9406, displayName: 'Arraias, Tocantins, Brasil' },
  { city: 'Peixe', state: 'TO', lat: -12.0253, lon: -48.5406, displayName: 'Peixe, Tocantins, Brasil' },
  { city: 'Paranã', state: 'TO', lat: -12.6153, lon: -47.8819, displayName: 'Paranã, Tocantins, Brasil' },
  { city: 'Ponte Alta do Tocantins', state: 'TO', lat: -10.7489, lon: -47.5317, displayName: 'Ponte Alta do Tocantins, Tocantins, Brasil' },
  { city: 'Rio Sono', state: 'TO', lat: -9.3517, lon: -47.9039, displayName: 'Rio Sono, Tocantins, Brasil' },
  { city: 'Tocantinópolis', state: 'TO', lat: -6.3267, lon: -47.4189, displayName: 'Tocantinópolis, Tocantins, Brasil' },
  { city: 'Alvorada', state: 'TO', lat: -12.4800, lon: -49.1247, displayName: 'Alvorada, Tocantins, Brasil' },
  { city: 'Figueirópolis', state: 'TO', lat: -12.1311, lon: -49.1739, displayName: 'Figueirópolis, Tocantins, Brasil' },
  { city: 'Cristalândia', state: 'TO', lat: -10.6044, lon: -49.1939, displayName: 'Cristalândia, Tocantins, Brasil' },
  { city: 'Pium', state: 'TO', lat: -10.4439, lon: -49.1839, displayName: 'Pium, Tocantins, Brasil' },
  { city: 'Monte do Carmo', state: 'TO', lat: -10.7639, lon: -48.1139, displayName: 'Monte do Carmo, Tocantins, Brasil' },
  { city: 'Silvanópolis', state: 'TO', lat: -11.1489, lon: -48.1689, displayName: 'Silvanópolis, Tocantins, Brasil' },
  { city: 'Santa Rosa do Tocantins', state: 'TO', lat: -11.4489, lon: -48.1239, displayName: 'Santa Rosa do Tocantins, Tocantins, Brasil' },
  { city: 'Aurora do Tocantins', state: 'TO', lat: -12.7139, lon: -46.5189, displayName: 'Aurora do Tocantins, Tocantins, Brasil' },
  { city: 'Combinado', state: 'TO', lat: -12.7939, lon: -46.6689, displayName: 'Combinado, Tocantins, Brasil' },
  { city: 'Lavandeira', state: 'TO', lat: -12.7889, lon: -46.5089, displayName: 'Lavandeira, Tocantins, Brasil' },
  { city: 'Novo Jardim', state: 'TO', lat: -11.8239, lon: -46.6289, displayName: 'Novo Jardim, Tocantins, Brasil' },
  { city: 'Ponte Alta do Bom Jesus', state: 'TO', lat: -12.0889, lon: -46.4839, displayName: 'Ponte Alta do Bom Jesus, Tocantins, Brasil' },
  { city: 'Taipas do Tocantins', state: 'TO', lat: -12.1889, lon: -46.9839, displayName: 'Taipas do Tocantins, Tocantins, Brasil' },
  { city: 'Conceição do Tocantins', state: 'TO', lat: -12.2189, lon: -47.2989, displayName: 'Conceição do Tocantins, Tocantins, Brasil' },

  // MATOPIBA & Principais Polos do Agronegócio Nacional
  { city: 'Luís Eduardo Magalhães', state: 'BA', lat: -12.0958, lon: -45.7958, displayName: 'Luís Eduardo Magalhães, Bahia, Brasil' },
  { city: 'Barreiras', state: 'BA', lat: -12.1486, lon: -44.9961, displayName: 'Barreiras, Bahia, Brasil' },
  { city: 'Formosa do Rio Preto', state: 'BA', lat: -11.0478, lon: -45.1931, displayName: 'Formosa do Rio Preto, Bahia, Brasil' },
  { city: 'São Desidério', state: 'BA', lat: -12.3619, lon: -44.9733, displayName: 'São Desidério, Bahia, Brasil' },
  { city: 'Correntina', state: 'BA', lat: -13.3436, lon: -44.6369, displayName: 'Correntina, Bahia, Brasil' },
  { city: 'Balsas', state: 'MA', lat: -7.5322, lon: -46.0375, displayName: 'Balsas, Maranhão, Brasil' },
  { city: 'Uruçuí', state: 'PI', lat: -7.2289, lon: -44.5564, displayName: 'Uruçuí, Piauí, Brasil' },
  { city: 'Bom Jesus', state: 'PI', lat: -9.0744, lon: -44.3589, displayName: 'Bom Jesus, Piauí, Brasil' },
  { city: 'Rio Verde', state: 'GO', lat: -17.7917, lon: -50.9192, displayName: 'Rio Verde, Goiás, Brasil' },
  { city: 'Jataí', state: 'GO', lat: -17.8814, lon: -51.7144, displayName: 'Jataí, Goiás, Brasil' },
  { city: 'Cristalina', state: 'GO', lat: -16.7686, lon: -47.6139, displayName: 'Cristalina, Goiás, Brasil' },
  { city: 'Sorriso', state: 'MT', lat: -12.5425, lon: -55.7211, displayName: 'Sorriso, Mato Grosso, Brasil' },
  { city: 'Sinop', state: 'MT', lat: -11.8642, lon: -55.5053, displayName: 'Sinop, Mato Grosso, Brasil' },
  { city: 'Lucas do Rio Verde', state: 'MT', lat: -13.0611, lon: -55.9103, displayName: 'Lucas do Rio Verde, Mato Grosso, Brasil' },
  { city: 'Nova Mutum', state: 'MT', lat: -13.8319, lon: -56.0828, displayName: 'Nova Mutum, Mato Grosso, Brasil' },
  { city: 'Primavera do Leste', state: 'MT', lat: -15.5583, lon: -54.2967, displayName: 'Primavera do Leste, Mato Grosso, Brasil' },
  { city: 'Rondonópolis', state: 'MT', lat: -16.4678, lon: -54.6364, displayName: 'Rondonópolis, Mato Grosso, Brasil' },
  { city: 'Campo Grande', state: 'MS', lat: -20.4697, lon: -54.6201, displayName: 'Campo Grande, Mato Grosso do Sul, Brasil' },
  { city: 'Dourados', state: 'MS', lat: -22.2231, lon: -54.8119, displayName: 'Dourados, Mato Grosso do Sul, Brasil' },
  { city: 'Brasília', state: 'DF', lat: -15.7975, lon: -47.8919, displayName: 'Brasília, Distrito Federal, Brasil' },
  { city: 'Goiânia', state: 'GO', lat: -16.6869, lon: -49.2648, displayName: 'Goiânia, Goiás, Brasil' },
  { city: 'Cuiabá', state: 'MT', lat: -15.6014, lon: -56.0979, displayName: 'Cuiabá, Mato Grosso, Brasil' },
]

function normalizeStr(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const normQuery = normalizeStr(query)

    // 1. Busca imediata no banco offline de cidades (resposta instantânea garantida)
    const offlineMatches = OFFLINE_AGRO_HUBS.filter((h) => {
      const normCity = normalizeStr(h.city)
      const normState = normalizeStr(h.state)
      const normDisplay = normalizeStr(h.displayName)
      return (
        normCity.includes(normQuery) ||
        normQuery.includes(normCity) ||
        normDisplay.includes(normQuery) ||
        (normQuery.length === 2 && normState === normQuery)
      )
    }).map((h, idx) => ({
      id: `offline-${idx}-${h.city}`,
      displayName: h.displayName,
      lat: h.lat,
      lon: h.lon,
      city: h.city,
      state: h.state,
      road: '',
      suburb: '',
    }))

    // Se já encontramos correspondências nos polos agropecuários, retorna imediatamente em 0ms
    if (offlineMatches.length >= 2) {
      return NextResponse.json({ results: offlineMatches })
    }

    // 2. Tenta enriquecer com a API Nominatim OpenStreetMap (com timeout curto de 2.5s)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&countrycodes=br&limit=6&addressdetails=1`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2500)

    let remoteResults: any[] = []

    try {
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'AgroTech-App/1.0 (internal-farm-locator)',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        },
        signal: controller.signal,
      })

      if (response.ok) {
        const data = await response.json()

        const ufMap: Record<string, string> = {
          Tocantins: 'TO',
          Goiás: 'GO',
          Maranhão: 'MA',
          Bahia: 'BA',
          Piauí: 'PI',
          'Mato Grosso': 'MT',
          'Mato Grosso do Sul': 'MS',
          Minas: 'MG',
          'Minas Gerais': 'MG',
          São: 'SP',
          'São Paulo': 'SP',
          Paraná: 'PR',
          'Santa Catarina': 'SC',
          'Rio Grande do Sul': 'RS',
          Pará: 'PA',
          Amazonas: 'AM',
          Rondônia: 'RO',
          Roraima: 'RR',
          Acre: 'AC',
          Amapá: 'AP',
          Ceará: 'CE',
          'Rio Grande do Norte': 'RN',
          Paraíba: 'PB',
          Pernambuco: 'PE',
          Alagoas: 'AL',
          Sergipe: 'SE',
          'Espírito Santo': 'ES',
          'Rio de Janeiro': 'RJ',
          'Distrito Federal': 'DF',
        }

        remoteResults = (Array.isArray(data) ? data : []).map((item: any) => {
          const addr = item.address || {}
          const rawState = addr.state || ''
          const stateCode =
            addr['ISO3166-2-lvl4']?.split('-')[1] ||
            ufMap[rawState] ||
            (rawState.length === 2 ? rawState.toUpperCase() : 'TO')

          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.municipality ||
            addr.county ||
            item.display_name?.split(',')[0] ||
            'Local'

          return {
            id: String(item.place_id || Math.random()),
            displayName: item.display_name || city,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            city,
            state: stateCode,
            road: addr.road || '',
            suburb: addr.suburb || '',
          }
        })
      }
    } catch (e: any) {
      // AbortError ou rede lenta: log amigável sem quebrar o endpoint
      console.warn('[Geocode] Nominatim indisponível ou tempo esgotado, utilizando fallback offline.')
    } finally {
      clearTimeout(timeoutId)
    }

    // 3. Combina resultados (offline prioritário para cidades exatas, seguido por rotas/ruas do Nominatim)
    const combinedMap = new Map<string, any>()

    // Adiciona correspondências locais primeiro
    offlineMatches.forEach((m) => {
      combinedMap.set(`${m.city.toLowerCase()}-${m.state}`, m)
    })

    // Adiciona correspondências remotas
    remoteResults.forEach((r) => {
      const key = `${r.city.toLowerCase()}-${r.state}`
      if (!combinedMap.has(key)) {
        combinedMap.set(key, r)
      } else {
        // Se já existe e a remota tem endereço detalhado, pode complementar
        if (r.road || r.suburb) {
          combinedMap.set(`${key}-${r.id}`, r)
        }
      }
    })

    const results = Array.from(combinedMap.values()).slice(0, 8)
    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error in geocode search route:', error)
    return NextResponse.json({ results: [] })
  }
}
