import { CreditLineAxis } from '@/lib/financial-engine/types'

export interface CreditLineDefinition {
  code: string
  name: string
  axis: CreditLineAxis
  targetAudience: 'PRONAF' | 'PRONAMP' | 'DEMAIS'
  defaultInterestRate: number // % a.a.
  defaultTermMonths: number
  defaultGraceMonths: number
  maxFinancingPercent: number // ex: 90 ou 100
  description: string
  mcrRef: string
}

/**
 * Catálogo Oficial das 15 Linhas de Crédito Rural Pactuadas no Aditivo 003.
 * Regulamentadas pelas normas vigentes do Manual de Crédito Rural (MCR/BACEN).
 */
export const CREDIT_LINES_CATALOG: CreditLineDefinition[] = [
  // 1. PRONAMP
  {
    code: 'PRONAMP_CUSTEIO',
    name: 'PRONAMP - Custeio Agropecuário',
    axis: CreditLineAxis.CUSTEIO,
    targetAudience: 'PRONAMP',
    defaultInterestRate: 8.0,
    defaultTermMonths: 12,
    defaultGraceMonths: 0,
    maxFinancingPercent: 100,
    description: 'Custeio agrícola e pecuário para médios produtores rurais enquadrados no PRONAMP.',
    mcrRef: 'MCR 11-1'
  },
  {
    code: 'PRONAMP_INVESTIMENTO',
    name: 'PRONAMP - Investimento',
    axis: CreditLineAxis.INVESTIMENTO,
    targetAudience: 'PRONAMP',
    defaultInterestRate: 8.0,
    defaultTermMonths: 96,
    defaultGraceMonths: 24,
    maxFinancingPercent: 90,
    description: 'Investimento fixo e semifixo para modernização da propriedade e aquisição de bens.',
    mcrRef: 'MCR 11-1'
  },

  // 2. PRONAF Mais Alimentos - Investimento Fixo
  {
    code: 'PRONAF_MAIS_ALIMENTOS_FIXO',
    name: 'PRONAF Mais Alimentos - Investimento Fixo',
    axis: CreditLineAxis.INVESTIMENTO,
    targetAudience: 'PRONAF',
    defaultInterestRate: 5.0,
    defaultTermMonths: 120,
    defaultGraceMonths: 36,
    maxFinancingPercent: 100,
    description: 'Construção, reforma ou ampliação de benfeitorias, instalações e obras de infraestrutura rural.',
    mcrRef: 'MCR 10-2'
  },

  // 3. PRONAF Mais Alimentos - Investimento Semifixo
  {
    code: 'PRONAF_MAIS_ALIMENTOS_SEMIFIXO',
    name: 'PRONAF Mais Alimentos - Investimento Semi-Fixo',
    axis: CreditLineAxis.INVESTIMENTO,
    targetAudience: 'PRONAF',
    defaultInterestRate: 5.0,
    defaultTermMonths: 84,
    defaultGraceMonths: 12,
    maxFinancingPercent: 100,
    description: 'Aquisição de tratores, máquinas, implementos e semoventes para a agricultura familiar.',
    mcrRef: 'MCR 10-2'
  },

  // 4. PRONAF Mulher
  {
    code: 'PRONAF_MULHER',
    name: 'PRONAF Mulher',
    axis: CreditLineAxis.INVESTIMENTO,
    targetAudience: 'PRONAF',
    defaultInterestRate: 4.0,
    defaultTermMonths: 120,
    defaultGraceMonths: 36,
    maxFinancingPercent: 100,
    description: 'Financiamento a investimentos orientados ou administrados diretamente por mulheres agricultoras.',
    mcrRef: 'MCR 10-6'
  },

  // 5. PRONAF Jovem
  {
    code: 'PRONAF_JOVEM',
    name: 'PRONAF Jovem',
    axis: CreditLineAxis.INVESTIMENTO,
    targetAudience: 'PRONAF',
    defaultInterestRate: 4.0,
    defaultTermMonths: 120,
    defaultGraceMonths: 36,
    maxFinancingPercent: 100,
    description: 'Investimento para jovens agricultores(as) de 16 a 29 anos integrantes de unidades familiares.',
    mcrRef: 'MCR 10-7'
  },

  // 6. PRONAF B (Microcrédito Produtivo Rural)
  {
    code: 'PRONAF_B',
    name: 'PRONAF B (Microcrédito Produtivo)',
    axis: CreditLineAxis.INVESTIMENTO,
    targetAudience: 'PRONAF',
    defaultInterestRate: 0.5,
    defaultTermMonths: 24,
    defaultGraceMonths: 0,
    maxFinancingPercent: 100,
    description: 'Microcrédito com bônus de adimplência destinado aos agricultores familiares de mais baixa renda.',
    mcrRef: 'MCR 10-3'
  },

  // 7. PRONAF Agroindústria
  {
    code: 'PRONAF_AGROINDUSTRIA',
    name: 'PRONAF Agroindústria',
    axis: CreditLineAxis.INVESTIMENTO,
    targetAudience: 'PRONAF',
    defaultInterestRate: 5.0,
    defaultTermMonths: 120,
    defaultGraceMonths: 36,
    maxFinancingPercent: 100,
    description: 'Investimentos em processamento, agregação de valor e comercialização de produtos agrícolas.',
    mcrRef: 'MCR 10-4'
  },

  // 8. PRONAF Agroecologia
  {
    code: 'PRONAF_AGROECOLOGIA',
    name: 'PRONAF Agroecologia',
    axis: CreditLineAxis.INVESTIMENTO,
    targetAudience: 'PRONAF',
    defaultInterestRate: 3.0,
    defaultTermMonths: 120,
    defaultGraceMonths: 36,
    maxFinancingPercent: 100,
    description: 'Sistemas de produção agroecológica e orgânica certificados.',
    mcrRef: 'MCR 10-5'
  },

  // 9. PRONAF Bioeconomia
  {
    code: 'PRONAF_BIOECONOMIA',
    name: 'PRONAF Bioeconomia',
    axis: CreditLineAxis.INVESTIMENTO,
    targetAudience: 'PRONAF',
    defaultInterestRate: 4.0,
    defaultTermMonths: 120,
    defaultGraceMonths: 36,
    maxFinancingPercent: 100,
    description: 'Tecnologias de energia renovável, biogás, bioinsumos e aproveitamento sustentável da biomassa.',
    mcrRef: 'MCR 10-8'
  },

  // 10. PRONAF A e A/C
  {
    code: 'PRONAF_A_AC',
    name: 'PRONAF Grupos A e A/C',
    axis: CreditLineAxis.INVESTIMENTO,
    targetAudience: 'PRONAF',
    defaultInterestRate: 1.5,
    defaultTermMonths: 120,
    defaultGraceMonths: 36,
    maxFinancingPercent: 100,
    description: 'Crédito de estruturação inicial para assentados da Reforma Agrária e beneficiários do PNCF.',
    mcrRef: 'MCR 10-9'
  },

  // 11. Programa RENOVAGRO
  {
    code: 'RENOVAGRO',
    name: 'Programa RENOVAGRO (Recuperação de Pastagens e ABC)',
    axis: CreditLineAxis.INVESTIMENTO,
    targetAudience: 'DEMAIS',
    defaultInterestRate: 10.5,
    defaultTermMonths: 96,
    defaultGraceMonths: 24,
    maxFinancingPercent: 90,
    description: 'Recuperação de pastagens degradadas, sistemas ILPF, manejo sustentável do solo e semoventes.',
    mcrRef: 'MCR 11-7'
  },

  // 12. Programa INOVAGRO
  {
    code: 'INOVAGRO',
    name: 'Programa INOVAGRO (Inovação Tecnológica)',
    axis: CreditLineAxis.INVESTIMENTO,
    targetAudience: 'DEMAIS',
    defaultInterestRate: 10.5,
    defaultTermMonths: 120,
    defaultGraceMonths: 24,
    maxFinancingPercent: 85,
    description: 'Energia solar fotovoltaica, conectividade no campo, automação e agricultura de precisão.',
    mcrRef: 'MCR 11-5'
  },

  // 13. Programa MODERFROTA
  {
    code: 'MODERFROTA',
    name: 'Programa MODERFROTA',
    axis: CreditLineAxis.INVESTIMENTO,
    targetAudience: 'DEMAIS',
    defaultInterestRate: 12.5,
    defaultTermMonths: 84,
    defaultGraceMonths: 12,
    maxFinancingPercent: 85,
    description: 'Aquisição de tratores, colheitadeiras, pulverizadores e implementos agrícolas.',
    mcrRef: 'MCR 11-4'
  },

  // 14. Investe Agro
  {
    code: 'INVESTE_AGRO',
    name: 'Investe Agro (Geral)',
    axis: CreditLineAxis.INVESTIMENTO,
    targetAudience: 'DEMAIS',
    defaultInterestRate: 12.0,
    defaultTermMonths: 96,
    defaultGraceMonths: 12,
    maxFinancingPercent: 80,
    description: 'Linha ampla de financiamento de investimentos agropecuários com recursos livres e controlados.',
    mcrRef: 'MCR 2-1'
  },

  // 15. PCA (Construção e Ampliação de Armazéns)
  {
    code: 'PCA',
    name: 'Programa PCA (Armazenagem e Silos)',
    axis: CreditLineAxis.INVESTIMENTO,
    targetAudience: 'DEMAIS',
    defaultInterestRate: 10.5,
    defaultTermMonths: 144,
    defaultGraceMonths: 36,
    maxFinancingPercent: 90,
    description: 'Implantação, ampliação e modernização de silos, armazéns e estruturas de secagem de grãos.',
    mcrRef: 'MCR 11-6'
  }
]
