import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { formatCPF, formatCNPJ } from "./validations"
export {
  maskDocument,
  maskPixKey,
  validatePixKey,
  maskPhone,
  maskBankAgency,
  maskBankAccount,
  maskCropYear,
  maskPercentage,
  maskCurrencyInput,
  parseCurrencyInput,
} from "./utils/masks"

export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(num) ? 0 : num)
}

/**
 * Converte recursivamente instâncias Prisma Decimal em números primitivos
 * para permitir passagem segura entre Server Components e Client Components no Next.js (RSC).
 */
export function serializeDecimals<T>(data: T): T {
  if (data === null || data === undefined) return data

  // Detecta objetos Prisma Decimal / Decimal.js
  if (
    typeof data === 'object' &&
    data !== null &&
    'toNumber' in data &&
    typeof (data as any).toNumber === 'function'
  ) {
    return (data as any).toNumber()
  }

  // Detecta Decimal desserializado com propriedades internas d, e, s
  if (
    typeof data === 'object' &&
    data !== null &&
    's' in data &&
    'e' in data &&
    'd' in data &&
    Array.isArray((data as any).d)
  ) {
    return Number(data) as unknown as T
  }

  if (Array.isArray(data)) {
    return data.map(serializeDecimals) as unknown as T
  }

  if (data instanceof Date) {
    return data
  }

  if (typeof data === 'object') {
    const result: any = {}
    for (const [key, value] of Object.entries(data)) {
      result[key] = serializeDecimals(value)
    }
    return result
  }

  return data
}

