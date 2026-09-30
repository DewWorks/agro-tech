import { CreditLineAxis } from './types'

export interface ComplianceCheckResult {
  isCompliant: boolean
  mcrArticles: string[]
  enquadramentoText: string
  warnings: string[]
}

/**
 * Mapeia as fundamentações legais e os artigos do Manual de Crédito Rural (MCR/BACEN)
 * aplicáveis a cada linha de crédito e modalidade de financiamento.
 */
export function evaluateMcrCompliance(
  creditLineCode: string,
  axis: CreditLineAxis,
  requestedAmount: number,
  isIcsdApproved: boolean,
  isLtvApproved: boolean
): ComplianceCheckResult {
  const code = (creditLineCode || '').toUpperCase().trim()
  const articles: string[] = ['MCR 3-2 (Orçamento, Plano e Projeto)', 'MCR 3-3 (Garantias)']
  const warnings: string[] = []

  let enquadramentoText = ''

  if (code.includes('PRONAF')) {
    articles.push('MCR 10-1 (PRONAF - Disposições Gerais)')
    articles.push('MCR 10-2 (Condições Específicas do PRONAF)')
    enquadramentoText = 'Operação amparada pelo Programa Nacional de Fortalecimento da Agricultura Familiar (PRONAF), com exigência de CAF/DAP ativa e conformidade aos tetos de faturamento anual da unidade familiar.'
    if (requestedAmount > 500000) {
      warnings.push('Atenção: O valor solicitado supera o limite teto tradicional para a maioria das sublinhas do PRONAF. Verifique se o enquadramento prevê dotação coletiva ou modalidade especial.')
    }
  } else if (code.includes('PRONAMP')) {
    articles.push('MCR 11-1 (PRONAMP - Médio Produtor Rural)')
    enquadramentoText = 'Operação amparada pelo Programa Nacional de Apoio ao Médio Produtor Rural (PRONAMP), com taxa de juros subsidiada e teto operacional fixado pelo Plano Safra vigente.'
    if (axis === CreditLineAxis.CUSTEIO && requestedAmount > 1500000) {
      warnings.push('Atenção: Custeio PRONAMP possui teto regulamentar de R$ 1.500.000,00 por beneficiário/safra no território nacional.')
    }
  } else if (code.includes('RENOVAGRO') || code.includes('ABC')) {
    articles.push('MCR 11-7 (Programa RenovAgro / Agropecuária Sustentável)')
    enquadramentoText = 'Operação enquadrada no Programa de Financiamento a Sistemas de Produção Agropecuária Sustentáveis (RenovAgro), voltada à recuperação de pastagens degradadas, sistemas ILPF e práticas conservacionistas de solo e água.'
  } else if (code.includes('MODERFROTA')) {
    articles.push('MCR 11-4 (Programa MODERFROTA)')
    enquadramentoText = 'Operação enquadrada no MODERFROTA para aquisição de tratores, colheitadeiras, pulverizadores e equipamentos novos ou usados, com alienação fiduciária dos bens adquiridos.'
  } else if (code.includes('INOVAGRO')) {
    articles.push('MCR 11-5 (Programa INOVAGRO)')
    enquadramentoText = 'Operação enquadrada no INOVAGRO para incorporação de inovação tecnológica nas propriedades rurais, conectividade rural e agricultura de precisão.'
  } else if (code.includes('PCA')) {
    articles.push('MCR 11-6 (Programa para Construção e Ampliação de Armazéns - PCA)')
    enquadramentoText = 'Operação enquadrada no PCA para investimentos em infraestrutura de armazenagem de grãos, pré-limpeza, secadores e silos graneleiros.'
  } else {
    articles.push('MCR 2-1 (Normas Gerais de Crédito Rural)')
    enquadramentoText = `Operação enquadrada nas Linhas Gerais do Crédito Rural com recursos livres ou controlados, na modalidade de ${axis === CreditLineAxis.INVESTIMENTO ? 'Investimento' : 'Custeio'}.`
  }

  if (!isIcsdApproved) {
    warnings.push('Restrição Regulatória: Não conformidade com o Índice de Cobertura do Serviço da Dívida (ICSD < 1,20). Concessão desaconselhada.')
  }

  if (!isLtvApproved) {
    warnings.push('Alerta de Garantia: O percentual de cobertura ponderada de garantias reais/pignoratícias está abaixo de 100% do montante solicitado.')
  }

  const isCompliant = isIcsdApproved && isLtvApproved && warnings.length === 0

  return {
    isCompliant,
    mcrArticles: articles,
    enquadramentoText,
    warnings
  }
}
