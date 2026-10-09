export {
  formatBRL,
  formatCurrency,
  formatHectares,
  formatPercent,
  formatMarriageRegime,
  getBankNameLabel,
  formatDate,
} from '@/lib/utils/formatters'

/**
 * Sanitiza o roteiro de acesso ao imóvel rural, removendo concatenações duplicadas,
 * repetições de parágrafos, frases ou fragmentos colados e normalizando espaços.
 */
export function sanitizeAccessRoute(route?: string | null): string {
  if (!route || !route.trim()) {
    return 'Acesso principal via rodovia estadual/municipal transitável o ano todo.'
  }
  let cleaned = route.trim().replace(/\s+/g, ' ')

  // 1. Detecta duplicação exata por concatenação com ou sem separador
  // Ex: "Partindo de Palmas...Partindo de Palmas..." ou "Partindo de Palmas... Partindo de Palmas..."
  const len = cleaned.length
  if (len >= 16) {
    const match = cleaned.match(/^([\s\S]{8,}?)[.;\s\-_–—]*\1$/i)
    if (match && match[1]) {
      cleaned = match[1].trim()
    } else {
      const mid = Math.floor(len / 2)
      const firstHalf = cleaned.slice(0, mid).trim()
      const secondHalf = cleaned.slice(mid).trim()
      if (firstHalf === secondHalf || secondHalf.startsWith(firstHalf) || firstHalf.endsWith(secondHalf)) {
        cleaned = firstHalf
      }
    }
  }

  // 2. Trata fragmentos repetidos no início colados sem espaço (ex: "45kmPartindo de Palmas pela TO-050 por 45km")
  const gluedPrefixMatch = cleaned.match(/^(\d+\s*(?:km|m|ha)?|[A-Za-z0-9_-]{2,12})\s*([A-Za-z][\s\S]+)$/i)
  if (gluedPrefixMatch) {
    const [, prefix, rest] = gluedPrefixMatch
    if (
      rest.length >= 15 &&
      (rest.toLowerCase().endsWith(prefix.toLowerCase()) || rest.toLowerCase().includes(prefix.toLowerCase()))
    ) {
      cleaned = rest.trim()
    }
  }

  // 3. Remove sentenças adjacentes duplicadas (ex: "Texto. Texto.")
  const sentences = cleaned.split(/(?<=[.!?])\s+/)
  if (sentences.length > 1) {
    const uniqueSentences: string[] = []
    for (const s of sentences) {
      const trimmed = s.trim()
      if (
        trimmed &&
        (uniqueSentences.length === 0 ||
          uniqueSentences[uniqueSentences.length - 1].toLowerCase() !== trimmed.toLowerCase())
      ) {
        uniqueSentences.push(trimmed)
      }
    }
    cleaned = uniqueSentences.join(' ')
  }

  return cleaned.trim() || 'Acesso principal via rodovia estadual/municipal transitável o ano todo.'
}

/**
 * Formata de forma limpa e desduplicada o campo "Gleba / Roteiro".
 * Evita repetições, concatenações coladas sem espaço e separa por " • ".
 */
export function formatGlebaRoteiro(gleba?: string | null, roteiro?: string | null): string {
  const cleanGleba = gleba ? gleba.trim() : ''
  const rawRoteiro = roteiro ? roteiro.trim() : ''
  const cleanRoteiro = sanitizeAccessRoute(rawRoteiro)

  const isDefaultRoteiro = cleanRoteiro === 'Acesso principal via rodovia estadual/municipal transitável o ano todo.'

  if (!cleanGleba && (!rawRoteiro || isDefaultRoteiro)) {
    return cleanRoteiro || '-'
  }

  if (!cleanGleba) {
    return cleanRoteiro
  }

  if (!rawRoteiro || isDefaultRoteiro) {
    return cleanGleba
  }

  const gLower = cleanGleba.toLowerCase()
  const rLower = cleanRoteiro.toLowerCase()

  if (gLower === rLower) {
    return cleanRoteiro
  }

  if (rLower.startsWith(gLower) || rLower.includes(gLower)) {
    return cleanRoteiro
  }

  if (gLower.endsWith(rLower) || gLower.includes(rLower)) {
    return cleanGleba
  }

  return [cleanGleba, cleanRoteiro].filter(Boolean).join(' • ')
}

