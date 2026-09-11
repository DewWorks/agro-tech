/**
 * Utilitários de validação e formatação de máscaras (CPF, CNPJ, Telefone)
 */

export function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]+/g, '')
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false
  const values = cpf.split('').map(Number)
  const calc = (n: number) => {
    let sum = 0
    for (let i = 0; i < n; i++) sum += values[i] * (n + 1 - i)
    return (sum % 11) < 2 ? 0 : 11 - (sum % 11)
  }
  return calc(9) === values[9] && calc(10) === values[10]
}

export function validateCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]+/g, '')
  if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false
  const values = cnpj.split('').map(Number)
  const calc = (n: number, weights: number[]) => {
    let sum = 0
    for (let i = 0; i < n; i++) sum += values[i] * weights[i]
    return (sum % 11) < 2 ? 0 : 11 - (sum % 11)
  }
  return (
    calc(12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === values[12] &&
    calc(13, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === values[13]
  )
}

export function formatCPF(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

export function formatCNPJ(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1')
}

export function getDocumentTypeAndLabel(doc?: string | null, type?: string | null): {
  isCnpj: boolean
  label: 'CPF' | 'CNPJ'
  formatted: string
  digits: string
} {
  const digits = (doc || '').replace(/\D/g, '')
  const isCnpj = type === 'PJ' || digits.length > 11
  const label = isCnpj ? 'CNPJ' : 'CPF'
  const formatted = isCnpj ? formatCNPJ(digits) : formatCPF(digits)
  return { isCnpj, label, formatted, digits }
}
