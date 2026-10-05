/**
 * Utilitários de validação e formatação de máscaras (CPF, CNPJ, Telefone, CAR, CCIR, ITR, RG, etc.)
 * e higienização recursiva de payloads para integridade do banco de dados.
 */

export function validateCPF(cpf: string): boolean {
  cpf = (cpf || '').replace(/[^\d]+/g, '')
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
  cnpj = (cnpj || '').replace(/[^\d]+/g, '')
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
  if (!value) return ''
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

export const maskCPF = formatCPF

export function formatCNPJ(value: string): string {
  if (!value) return ''
  return value
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

export const maskCNPJ = formatCNPJ

export function formatPhone(value: string): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '').slice(0, 11)
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

export const maskPhone = formatPhone

/**
 * Máscara alfanumérica para RG, bloqueando caracteres especiais e limitando a 14 caracteres.
 */
export function maskRG(value: string): string {
  if (!value) return ''
  return value
    .replace(/[^a-zA-Z0-9.-]/g, '')
    .slice(0, 14)
    .toUpperCase()
}

/**
 * Máscara para Órgão Emissor e UF (ex: SSP/TO, PC/GO), limitando a 8 caracteres.
 */
export function maskIssuerUF(value: string): string {
  if (!value) return ''
  const clean = value.replace(/[^a-zA-Z0-9/]/g, '').toUpperCase()
  const parts = clean.split('/')
  if (parts.length > 1) {
    const org = parts[0].slice(0, 5)
    const uf = parts[1].slice(0, 2)
    return `${org}/${uf}`
  }
  if (clean.length > 5 && !clean.includes('/')) {
    return `${clean.slice(0, clean.length - 2)}/${clean.slice(-2)}`.slice(0, 8)
  }
  return clean.slice(0, 8)
}

/**
 * Máscara para Matrícula / Registro de Imóvel: estritamente numérico, máximo 8 dígitos.
 */
export function maskRegistrationNumber(value: string): string {
  if (!value) return ''
  return value.replace(/\D/g, '').slice(0, 8)
}

/**
 * Máscara progressiva para o Recibo do CAR no padrão oficial SICAR Federal:
 * UF-1234567-XXXX.XXXX.XXXX.XXXX.XXXX.XXXX.XXXX.XXXX (máx 50 caracteres)
 */
export function maskCAR(value: string): string {
  if (!value) return ''
  const raw = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  if (raw.length === 0) return ''

  // UF (2 caracteres)
  const uf = raw.slice(0, 2)
  if (raw.length <= 2) return uf

  // Código do Município (7 dígitos numéricos)
  const mun = raw.slice(2, 9)
  if (raw.length <= 9) return `${uf}-${mun}`

  // Hash federal: até 8 blocos de 4 caracteres hexadecimais (32 caracteres no total)
  const hashPart = raw.slice(9, 41)
  const blocks: string[] = []
  for (let i = 0; i < hashPart.length; i += 4) {
    blocks.push(hashPart.slice(i, i + 4))
  }

  return `${uf}-${mun}-${blocks.join('.')}`.slice(0, 50)
}

/**
 * Formata o enum do Regime de Casamento para texto oficial legível.
 */
export function formatMarriageRegime(regime?: string | null): string {
  if (!regime) return 'Não informado'
  const normalized = regime.toUpperCase()
  switch (normalized) {
    case 'COMUNHAO_PARCIAL':
      return 'Comunhão Parcial de Bens'
    case 'COMUNHAO_UNIVERSAL':
      return 'Comunhão Universal de Bens'
    case 'SEPARACAO_TOTAL':
      return 'Separação Total de Bens'
    case 'SEPARACAO_OBRIGATORIA':
      return 'Separação Obrigatória de Bens'
    case 'PARTICIPACAO_FINAL':
      return 'Participação Final nos Aquestos'
    default:
      return regime.replace(/_/g, ' ')
  }
}

/**
 * Máscara para CCIR (INCRA): 13 dígitos numéricos no formato 000.000.000.000-0
 */
export function maskCCIR(value: string): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '').slice(0, 13)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, '$1.$2')
  if (digits.length <= 9) return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3')
  if (digits.length <= 12) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3.$4')
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3.$4-$5')
}

/**
 * Mascara para CIB (Cadastro Imobiliario Brasileiro) e ITR / NIRF (Receita Federal):
 * - Padrao oficial CIB (Receita Federal 2026 em diante): 7 caracteres alfanumericos + hifen + 1 caractere verificador alfanumerico (AAAAAAA-D), ex: XEHVEZ5-T.
 * - Padrao legado NIRF/ITR: 8 digitos numericos, tambem compativel e formatado como AAAAAAA-D (ex: 1234567-8) ou 0.000.000-0.
 * Converte automaticamente para maiusculas e limita a 8 caracteres alfanumericos uteis.
 */
export function maskITR(value: string): string {
  if (!value) return ''
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
  if (clean.length <= 7) return clean
  return `${clean.slice(0, 7)}-${clean.slice(7, 8)}`
}

export const maskCIB = maskITR

/**
 * Máscara para Chassi / Número de Série de Máquinas: alfanumérico em maiúsculas sem espaços, máx 25 chars.
 */
export function maskChassis(value: string): string {
  if (!value) return ''
  return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25).toUpperCase()
}

/**
 * Máscara para Agência Bancária (com dígito verificador opcional): ex: 1234-5 ou 12345-6, máx 7 chars.
 */
export function maskBankAgency(value: string): string {
  if (!value) return ''
  const clean = value.replace(/[^0-9xX]/g, '').toUpperCase().slice(0, 6)
  if (clean.length > 4) {
    return `${clean.slice(0, clean.length - 1)}-${clean.slice(-1)}`
  }
  return clean
}

/**
 * Máscara para Conta Bancária (com dígito verificador): ex: 12345678-9, máx 14 chars.
 */
export function maskBankAccount(value: string): string {
  if (!value) return ''
  const clean = value.replace(/[^0-9xX]/g, '').toUpperCase().slice(0, 13)
  if (clean.length > 1) {
    return `${clean.slice(0, clean.length - 1)}-${clean.slice(-1)}`
  }
  return clean
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

/**
 * Máscara dinâmica para Documento (CPF ou CNPJ):
 * Se até 11 dígitos -> aplica formatação de CPF (000.000.000-00)
 * Se mais de 11 dígitos -> aplica formatação de CNPJ (00.000.000/0000-00)
 */
export function maskDocument(value: string): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 11) {
    return formatCPF(digits)
  }
  return formatCNPJ(digits)
}

/**
 * Máscara dinâmica para Chave PIX de acordo com o tipo:
 * - CPF: 000.000.000-00 (somente números)
 * - CNPJ: 00.000.000/0000-00 (somente números)
 * - TELEFONE: (00) 00000-0000 (somente números)
 * - EMAIL: minúsculas, sem espaços, máx 80 caracteres
 * - ALEATORIA: caracteres alfanuméricos com hífens (UUID/EVP), máx 36 caracteres
 */
export function maskPixKey(
  value: string,
  keyType: 'CPF' | 'CNPJ' | 'TELEFONE' | 'EMAIL' | 'ALEATORIA' | string
): string {
  if (!value) return ''
  switch (keyType) {
    case 'CPF':
      return formatCPF(value.replace(/\D/g, '').slice(0, 11))
    case 'CNPJ':
      return formatCNPJ(value.replace(/\D/g, '').slice(0, 14))
    case 'TELEFONE':
      return formatPhone(value.replace(/\D/g, '').slice(0, 11))
    case 'EMAIL':
      return value.trim().toLowerCase().slice(0, 80)
    case 'ALEATORIA':
      return value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 36)
    default:
      return value
  }
}

/**
 * Validação rigorosa para Chave PIX de acordo com o tipo selecionado.
 */
export function validatePixKey(
  key: string,
  keyType: 'CPF' | 'CNPJ' | 'TELEFONE' | 'EMAIL' | 'ALEATORIA' | string
): {
  isValid: boolean
  error?: string
} {
  if (!key || !key.trim()) {
    return { isValid: false, error: 'Chave PIX obrigatória' }
  }

  const clean = key.trim()

  switch (keyType) {
    case 'CPF': {
      const digits = clean.replace(/\D/g, '')
      if (digits.length !== 11) {
        return { isValid: false, error: 'CPF deve conter exatamente 11 dígitos' }
      }
      if (!validateCPF(digits)) {
        return { isValid: false, error: 'CPF inválido (dígitos verificadores incorretos)' }
      }
      return { isValid: true }
    }
    case 'CNPJ': {
      const digits = clean.replace(/\D/g, '')
      if (digits.length !== 14) {
        return { isValid: false, error: 'CNPJ deve conter exatamente 14 dígitos' }
      }
      if (!validateCNPJ(digits)) {
        return { isValid: false, error: 'CNPJ inválido (dígitos verificadores incorretos)' }
      }
      return { isValid: true }
    }
    case 'TELEFONE': {
      const digits = clean.replace(/\D/g, '')
      if (digits.length < 10 || digits.length > 11) {
        return { isValid: false, error: 'Telefone deve conter DDD + 8 ou 9 dígitos' }
      }
      return { isValid: true }
    }
    case 'EMAIL': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(clean)) {
        return { isValid: false, error: 'E-mail inválido (ex: financeiro@empresa.com)' }
      }
      return { isValid: true }
    }
    case 'ALEATORIA': {
      const cleaned = clean.replace(/[^a-zA-Z0-9-]/g, '')
      if (cleaned.length < 32) {
        return { isValid: false, error: 'Chave aleatória EVP deve possuir no mínimo 32 caracteres' }
      }
      return { isValid: true }
    }
    default:
      return { isValid: true }
  }
}

/**
 * Máscara para Ano Safra (ex: 2025/2026):
 */
export function maskCropYear(value: string): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 4) return digits
  return `${digits.slice(0, 4)}/${digits.slice(4, 8)}`
}

/**
 * Máscara para Percentual (ex: 20, 20.5, 100):
 */
export function maskPercentage(value: string): string {
  if (!value) return ''
  let clean = value.replace(/[^0-9.,]/g, '').replace(',', '.')
  const parts = clean.split('.')
  if (parts.length > 2) {
    clean = `${parts[0]}.${parts.slice(1).join('')}`
  }
  const num = parseFloat(clean)
  if (!isNaN(num) && num > 100) return '100'
  return clean
}

/**
 * Máscara de Moeda Real (BRL) para digitação em inputs:
 * Formata em tempo real como centavos:
 * "1" -> "0,01"
 * "10" -> "0,10"
 * "100" -> "1,00"
 * "125000" -> "1.250,00"
 */
export function maskCurrencyInput(value: string | number): string {
  if (value === null || value === undefined || value === '') return ''
  const digits = String(value).replace(/\D/g, '')
  if (!digits) return ''
  const numberValue = parseInt(digits, 10) / 100
  return numberValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Converte string formatada de moeda para número float:
 * "1.250,50" -> 1250.5
 */
export function parseCurrencyInput(value: string): number {
  if (!value) return 0
  const clean = value.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : num
}


/**
 * Helper recursivo que percorre objetos e arrays convertendo qualquer string vazia ""
 * ou contendo apenas espaços para null. Mantém instâncias de Date, Buffer e tipos primitivos intactos.
 */
export function sanitizePayload<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T
  }

  if (typeof data === 'string') {
    const trimmed = data.trim()
    return (trimmed === '' ? null : trimmed) as unknown as T
  }

  if (typeof data !== 'object') {
    return data
  }

  if (data instanceof Date || (typeof Buffer !== 'undefined' && Buffer.isBuffer(data))) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizePayload(item)) as unknown as T
  }

  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    result[key] = sanitizePayload(value)
  }
  return result as T
}
