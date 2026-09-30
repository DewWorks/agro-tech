export function formatBRL(val: number | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0)
}

export function formatMarriageRegime(regime?: string | null): string {
  if (!regime) return 'Não informado'
  switch (regime) {
    case 'COMUNHAO_PARCIAL':
      return 'Comunhão Parcial de Bens'
    case 'COMUNHAO_UNIVERSAL':
      return 'Comunhão Universal de Bens'
    case 'SEPARACAO_TOTAL':
      return 'Separação Total de Bens'
    case 'PARTICIPACAO_FINAL':
      return 'Participação Final nos Aquestos'
    default:
      return regime
  }
}

export function getBankNameLabel(bank: string): string {
  switch (bank) {
    case 'BANCO_DO_BRASIL':
      return 'Banco do Brasil S.A.'
    case 'SICREDI':
      return 'Banco Cooperativo Sicredi'
    case 'SICOOB':
      return 'Banco Cooperativo Sicoob'
    case 'BRADESCO_AGRO':
      return 'Banco Bradesco Agro'
    case 'CAIXA_ECONOMICA':
      return 'Caixa Econômica Federal'
    default:
      return bank.replace(/_/g, ' ')
  }
}
