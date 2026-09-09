import { generateChecklistProfissionalHtml } from './checklist-profissional'
import { generateLimiteCreditoBbHtml } from './limite-credito-bb'
import { generateProjetoRenovagroHtml } from './projeto-renovagro'
import { generateProjetoInovagroHtml } from './projeto-inovagro'
import { generateProjetoCusteioSafraHtml } from './projeto-custeio-safra'

export interface CreditTemplateMeta {
  code: string
  title: string
  subtitle: string
  type: 'CREDIT' | 'LEGAL'
  category: 'CHECKLIST' | 'PATRIMONIAL' | 'INVESTIMENTO' | 'CUSTEIO' | 'AUTORIZACAO' | 'DECLARACAO'
  bank: string
  description: string
  badgeColor: string
}

export const CREDIT_TEMPLATES_REGISTRY: CreditTemplateMeta[] = [
  {
    code: 'CHECKLIST_PROFISSIONAL',
    title: 'Checklist Profissional de Atendimento',
    subtitle: 'Triagem Documental, Garantias e Esteira de Crédito',
    type: 'CREDIT',
    category: 'CHECKLIST',
    bank: 'Banco do Brasil / Geral',
    description: 'Checklist operacional com conferência de documentos pessoais, fundiários, garantias, projeto técnico e controle de etapas.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    code: 'LIMITE_CREDITO_BB',
    title: 'Ficha Cadastral e Levantamento Patrimonial',
    subtitle: 'Quadro de Terras, Benfeitorias, Semoventes e Capacidade de Pagamento',
    type: 'CREDIT',
    category: 'PATRIMONIAL',
    bank: 'Banco do Brasil',
    description: 'Dossiê patrimonial completo com avaliação de terras, tabela de benfeitorias oficial BB, rebanho por categoria e cálculo de capacidade.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    code: 'PROJETO_RENOVAGRO',
    title: 'Projeto Técnico – Programa RenovAgro',
    subtitle: 'Recuperação de Pastagens e Baixa Emissão de Carbono (MCR 11.7.1)',
    type: 'CREDIT',
    category: 'INVESTIMENTO',
    bank: 'Banco do Brasil / BNDES',
    description: 'Projeto técnico para recuperação de pastagens degradadas, calagem, adubação, sementes e cronograma físico-financeiro de até 10 anos.',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300'
  },
  {
    code: 'PROJETO_INOVAGRO',
    title: 'Projeto Técnico – Programa InovAgro',
    subtitle: 'Energia Solar Fotovoltaica, Automação e Precisão',
    type: 'CREDIT',
    category: 'INVESTIMENTO',
    bank: 'Banco do Brasil / BNDES',
    description: 'Projeto para implantação de usina solar fotovoltaica on-grid, automação e agricultura/pecuária de precisão com análise de viabilidade.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  {
    code: 'PROJETO_CUSTEIO_SAFRA',
    title: 'Projeto e Orçamento de Custeio Safra',
    subtitle: 'Custeio Agrícola e Pecuário (Soja, Milho, Grãos)',
    type: 'CREDIT',
    category: 'CUSTEIO',
    bank: 'Banco do Brasil / SICOR',
    description: 'Orçamento detalhado por hectare com sementes, fertilizantes, defensivos, horas-máquina e fluxo de reembolso pós-colheita.',
    badgeColor: 'bg-green-100 text-green-800 border-green-300'
  },
  {
    code: 'AUTORIZACAO_COMPARTILHAMENTO',
    title: 'Autorização de Compartilhamento de Dados',
    subtitle: 'Concordância para compartilhamento de dados cadastrais',
    type: 'LEGAL',
    category: 'AUTORIZACAO',
    bank: 'Banco do Brasil',
    description: 'Autorização formal para o Banco do Brasil consultar e compartilhar dados do cliente com outras instituições financeiras e parceiros.',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300'
  },
  {
    code: 'AUTORIZACAO_SCR',
    title: 'Autorização para Consulta ao SCR',
    subtitle: 'Sistema de Informações de Crédito do Banco Central',
    type: 'LEGAL',
    category: 'AUTORIZACAO',
    bank: 'Banco do Brasil',
    description: 'Autorização obrigatória para que o banco consulte o histórico de crédito do produtor no SCR.',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300'
  },
  {
    code: 'AUTORIZACAO_SICOR',
    title: 'Autorização para Consulta ao SICOR',
    subtitle: 'Sistema de Operações do Crédito Rural e Proagro',
    type: 'LEGAL',
    category: 'AUTORIZACAO',
    bank: 'Banco do Brasil',
    description: 'Autorização para acesso aos dados de operações de crédito rural registradas no SICOR.',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300'
  },
  {
    code: 'DECLARACAO_POSSE_MANSA',
    title: 'Declaração de Posse Mansa e Pacífica',
    subtitle: 'Comprovação de uso contínuo da terra',
    type: 'LEGAL',
    category: 'DECLARACAO',
    bank: 'Banco do Brasil',
    description: 'Declaração para áreas sem titulação definitiva atestando a posse sem litígio para acesso a financiamento.',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-300'
  },
  {
    code: 'DECLARACAO_REGULARIDADE_AMBIENTAL',
    title: 'Declaração de Regularidade Ambiental',
    subtitle: 'Conformidade com a legislação ambiental',
    type: 'LEGAL',
    category: 'DECLARACAO',
    bank: 'Banco do Brasil / IBAMA',
    description: 'Atesta que a propriedade cumpre a legislação ambiental e não possui embargos ou autuações pendentes.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    code: 'DECLARACAO_FORA_BIOMA',
    title: 'Declaração de Imóvel Fora do Bioma',
    subtitle: 'Adequação ambiental regional (Amazônia/Pantanal)',
    type: 'LEGAL',
    category: 'DECLARACAO',
    bank: 'Banco do Brasil',
    description: 'Atesta que o imóvel financiado não se encontra em biomas com restrições específicas do Banco Central.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    code: 'ENQUADRAMENTO_CAF',
    title: 'Enquadramento CAF / Pronaf',
    subtitle: 'Cadastro Nacional da Agricultura Familiar',
    type: 'LEGAL',
    category: 'DECLARACAO',
    bank: 'Banco do Brasil / MDA',
    description: 'Formulário para verificação e enquadramento do produtor nos limites e requisitos do PRONAF.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    code: 'IDENTIFICACAO_ANIMAIS',
    title: 'Identificação de Animais em Garantia',
    subtitle: 'Rebanho vinculado à operação de crédito',
    type: 'LEGAL',
    category: 'DECLARACAO',
    bank: 'Banco do Brasil',
    description: 'Ficha para listagem, marcação e detalhamento do rebanho oferecido como garantia na operação.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
  }
]

export {
  generateChecklistProfissionalHtml,
  generateLimiteCreditoBbHtml,
  generateProjetoRenovagroHtml,
  generateProjetoInovagroHtml,
  generateProjetoCusteioSafraHtml
}
