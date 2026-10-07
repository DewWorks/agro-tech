import {
  formatCPF,
  formatCNPJ,
  formatPhone,
  maskCPF,
  maskCNPJ,
  maskPhone,
  maskCAR,
  maskCCIR,
  maskITR,
  maskCIB,
  maskChassis,
  maskBankAgency,
  maskBankAccount,
  formatMarriageRegime as formatMarriageRegimeMask,
} from './masks'

/**
 * Formata um valor numérico em moeda Real Brasileira (R$ 0.000,00).
 */
export function formatBRL(val: number | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(val) || 0)
}

/**
 * Alias universal para formatBRL
 */
export const formatCurrency = formatBRL

/**
 * Formata uma área em hectares com sufixo 'ha' (ex: "1.250,5 ha" ou "120.0 ha").
 */
export function formatHectares(ha: number | null | undefined, decimals = 1): string {
  const num = Number(ha) || 0
  return `${num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ha`
}

/**
 * Formata um percentual numérico com símbolo '%' (ex: "8.5%" ou "12.00%").
 */
export function formatPercent(val: number | null | undefined, decimals = 1): string {
  const num = Number(val) || 0
  return `${num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`
}

/**
 * Formata o enum do Regime de Casamento para texto oficial legível.
 */
export function formatMarriageRegime(regime?: string | null): string {
  return formatMarriageRegimeMask(regime)
}

/**
 * Retorna o rótulo oficial e amigável da instituição financeira bancária.
 */
export function getBankNameLabel(bank?: string | null): string {
  if (!bank) return 'Não informado'
  switch (bank) {
    case 'BANCO_DO_BRASIL':
      return 'Banco do Brasil S.A.'
    case 'SICREDI':
      return 'Banco Cooperativo Sicredi'
    case 'SICOOB':
      return 'Banco Cooperativo Sicoob'
    case 'BRADESCO_AGRO':
    case 'BRADESCO':
      return 'Banco Bradesco Agro'
    case 'ITAU':
      return 'Itaú BBA'
    case 'SANTANDER':
      return 'Santander Agro'
    case 'CAIXA_ECONOMICA':
    case 'CAIXA':
      return 'Caixa Econômica Federal'
    default:
      return bank.replace(/_/g, ' ')
  }
}

/**
 * Formata datas no padrão pt-BR (DD/MM/AAAA).
 */
export function formatDate(date?: string | Date | null): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}

/**
 * Converte parâmetro de valor monetário vindo da URL ou inputs para número float positivo,
 * aceitando formatos numéricos puros ("103950"), formatados em pt-BR ("103.950,00"), etc.
 */
export function parseUrlAmount(raw?: string | null): number | null {
  if (!raw) return null
  const clean = raw.trim()
  if (!clean) return null

  // Digitação inteira pura (ex: "103950" ou "250000")
  if (/^\d+$/.test(clean)) {
    const n = Number(clean)
    return !isNaN(n) && n > 0 ? n : null
  }

  // Moeda brasileira com separador decimal por vírgula (ex: "103.950,00" ou "103,950")
  if (clean.includes(',')) {
    const normalized = clean.replace(/\./g, '').replace(',', '.')
    const n = parseFloat(normalized)
    return !isNaN(n) && n > 0 ? n : null
  }

  // Ponto como separador de milhar sem vírgula decimal (ex: "103.950")
  if (/\.\d{3}$/.test(clean)) {
    const n = parseFloat(clean.replace(/\./g, ''))
    return !isNaN(n) && n > 0 ? n : null
  }

  // Float padrão (ex: "103950.00")
  const n = parseFloat(clean)
  return !isNaN(n) && n > 0 ? n : null
}

// Re-exporta utilitários de máscaras cadastrais
export {
  formatCPF,
  formatCNPJ,
  formatPhone,
  maskCPF,
  maskCNPJ,
  maskPhone,
  maskCAR,
  maskCCIR,
  maskITR,
  maskCIB,
  maskChassis,
  maskBankAgency,
  maskBankAccount,
}
