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
 * repetições de parágrafos ou frases e normalizando espaços.
 */
export function sanitizeAccessRoute(route?: string | null): string {
  if (!route || !route.trim()) {
    return 'Acesso principal via rodovia estadual/municipal transitável o ano todo.'
  }
  let cleaned = route.trim()

  // 1. Detecta duplicação exata por concatenação com ou sem separador
  // Ex: "Partindo de Palmas...Partindo de Palmas..." ou "Partindo de Palmas... Partindo de Palmas..."
  const len = cleaned.length
  if (len >= 20) {
    const match = cleaned.match(/^([\s\S]{10,}?)[.;\s\-_–—]+?\1$/i)
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

  // 2. Remove sentenças adjacentes duplicadas
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
