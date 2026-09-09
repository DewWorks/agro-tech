import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&countrycodes=br&limit=6&addressdetails=1`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'AgroTech-App/1.0 (internal-farm-locator)',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json({ results: [] })
    }

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

    const results = (Array.isArray(data) ? data : []).map((item: any) => {
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
        ''

      return {
        id: String(item.place_id || Math.random()),
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        city,
        state: stateCode,
        road: addr.road || '',
        suburb: addr.suburb || '',
      }
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error in geocode search route:', error)
    return NextResponse.json({ results: [] })
  }
}
