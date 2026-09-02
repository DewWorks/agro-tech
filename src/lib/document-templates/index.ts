import { generateChecklistProfissionalHtml } from './checklist-profissional'
import { generateLimiteCreditoBbHtml } from './limite-credito-bb'
import { generateProjetoRenovagroHtml } from './projeto-renovagro'
import { generateProjetoInovagroHtml } from './projeto-inovagro'
import { generateProjetoCusteioSafraHtml } from './projeto-custeio-safra'

export interface CreditTemplateMeta {
  code: string
  title: string
  subtitle: string
  category: 'CHECKLIST' | 'PATRIMONIAL' | 'INVESTIMENTO' | 'CUSTEIO'
  bank: string
  description: string
  badgeColor: string
}

export const CREDIT_TEMPLATES_REGISTRY: CreditTemplateMeta[] = [
  {
    code: 'CHECKLIST_PROFISSIONAL',
    title: 'Checklist Profissional de Atendimento',
    subtitle: 'Triagem Documental, Garantias e Esteira de Crédito',
    category: 'CHECKLIST',
    bank: 'Banco do Brasil / Geral',
    description: 'Checklist operacional com conferência de documentos pessoais, fundiários, garantias, projeto técnico e controle de etapas.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    code: 'LIMITE_CREDITO_BB',
    title: 'Ficha Cadastral e Levantamento Patrimonial',
    subtitle: 'Quadro de Terras, Benfeitorias, Semoventes e Capacidade de Pagamento',
    category: 'PATRIMONIAL',
    bank: 'Banco do Brasil',
    description: 'Dossiê patrimonial completo com avaliação de terras, tabela de benfeitorias oficial BB, rebanho por categoria e cálculo de capacidade.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    code: 'PROJETO_RENOVAGRO',
    title: 'Projeto Técnico – Programa RenovAgro',
    subtitle: 'Recuperação de Pastagens e Baixa Emissão de Carbono (MCR 11.7.1)',
    category: 'INVESTIMENTO',
    bank: 'Banco do Brasil / BNDES',
    description: 'Projeto técnico para recuperação de pastagens degradadas, calagem, adubação, sementes e cronograma físico-financeiro de até 10 anos.',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300'
  },
  {
    code: 'PROJETO_INOVAGRO',
    title: 'Projeto Técnico – Programa InovAgro',
    subtitle: 'Energia Solar Fotovoltaica, Automação e Precisão',
    category: 'INVESTIMENTO',
    bank: 'Banco do Brasil / BNDES',
    description: 'Projeto para implantação de usina solar fotovoltaica on-grid, automação e agricultura/pecuária de precisão com análise de viabilidade.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  {
    code: 'PROJETO_CUSTEIO_SAFRA',
    title: 'Projeto e Orçamento de Custeio Safra',
    subtitle: 'Custeio Agrícola e Pecuário (Soja, Milho, Grãos)',
    category: 'CUSTEIO',
    bank: 'Banco do Brasil / SICOR',
    description: 'Orçamento detalhado por hectare com sementes, fertilizantes, defensivos, horas-máquina e fluxo de reembolso pós-colheita.',
    badgeColor: 'bg-green-100 text-green-800 border-green-300'
  }
]

export {
  generateChecklistProfissionalHtml,
  generateLimiteCreditoBbHtml,
  generateProjetoRenovagroHtml,
  generateProjetoInovagroHtml,
  generateProjetoCusteioSafraHtml
}
