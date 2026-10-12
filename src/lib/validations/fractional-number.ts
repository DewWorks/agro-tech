import { z } from 'zod'

/**
 * Utilitário de parsing robusto para números fracionários em formatos brasileiros (vírgula)
 * ou internacionais (ponto), suportando separadores de milhar (ex: "1.250,50", "0,5", "0,05", "0.005").
 */
export function parseFractionalNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (!trimmed) return 0
    // Se contém vírgula e ponto (ex: 1.250,50)
    if (trimmed.includes('.') && trimmed.includes(',')) {
      const sanitized = trimmed.replace(/\./g, '').replace(',', '.')
      const num = parseFloat(sanitized)
      return isNaN(num) ? 0 : num
    }
    // Se contém apenas vírgula (ex: 0,5 ou 1250,5)
    if (trimmed.includes(',')) {
      const sanitized = trimmed.replace(',', '.')
      const num = parseFloat(sanitized)
      return isNaN(num) ? 0 : num
    }
    // Caso padrão com ponto ou inteiro
    const num = parseFloat(trimmed)
    return isNaN(num) ? 0 : num
  }
  return 0
}

/**
 * Validador Zod para números fracionários com coerção resiliente.
 */
export const zFractionalNumber = (minVal = 0, errorMsg?: string) =>
  z.preprocess(
    (val) => parseFractionalNumber(val),
    z.number().min(minVal, errorMsg || `O valor mínimo permitido é ${minVal}`)
  )

export const zOptionalFractionalNumber = () =>
  z.preprocess((val) => {
    if (val === null || val === undefined || val === '') return null
    return parseFractionalNumber(val)
  }, z.number().nullable().optional())
