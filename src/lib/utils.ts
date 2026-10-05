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

