/**
 * Catálogo Centralizado das 15 Linhas Oficiais de Crédito Rural (Plano Safra / MCR / BNDES / Banco do Brasil).
 * Desenvolvido conforme a Diretriz de Engenharia para a LN Consultoria (Lindomar).
 */

export type CreditLineAxis = 'CUSTEIO' | 'INVESTIMENTO' | 'AMBOS'

export type CreditLineGroup =
  | 'PRONAMP'
  | 'PRONAF'
  | 'RENOVAGRO'
  | 'INOVAGRO'
  | 'MODERFROTA'
  | 'PCA'
  | 'GERAL'

export interface OfficialCreditLine {
  id: string
  code: string
  name: string
  shortName: string
  axis: CreditLineAxis
  group: CreditLineGroup
  description: string
  defaultInterestRate: number // % a.a.
  defaultTermYears: number    // Prazo em anos
  defaultGraceMonths: number  // Carência em meses
  maxTermYears: number
  maxGraceMonths: number
  targetAudience: string
  recommendedTemplate: 'PROJETO_CUSTEIO_SAFRA' | 'PROJETO_RENOVAGRO' | 'PROJETO_INOVAGRO'
  requiresAreaHa: boolean
  requiresUnitOrHeads: boolean
  suggestedItems: string[]
  badgeColor: string
}

export const OFFICIAL_CREDIT_LINES: OfficialCreditLine[] = [
  // 1) PRONAMP (Custeio e Investimento)
  {
    id: 'PRONAMP',
    code: 'PRONAMP',
    name: 'PRONAMP (Custeio e Investimento)',
    shortName: 'PRONAMP',
    axis: 'AMBOS',
    group: 'PRONAMP',
    description: 'Programa Nacional de Apoio ao Médio Produtor Rural. Focado em custeio anual de lavouras e pecuária ou investimentos em máquinas e matrizes.',
    defaultInterestRate: 8.0,
    defaultTermYears: 3,
    defaultGraceMonths: 12,
    maxTermYears: 8,
    maxGraceMonths: 36,
    targetAudience: 'Médios produtores rurais com renda bruta anual de até R$ 3 milhões.',
    recommendedTemplate: 'PROJETO_CUSTEIO_SAFRA',
    requiresAreaHa: true,
    requiresUnitOrHeads: true,
    suggestedItems: [
      'Custeio de Soja, Milho e Grãos',
      'Custeio Pecuário (Recria e Engorda)',
      'Aquisição de Tratores e Implementos',
      'Aquisição de Matrizes e Reprodutores'
    ],
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  },

  // 2) PRONAF Mais Alimentos - Investimento Fixo
  {
    id: 'PRONAF_MAIS_ALIMENTOS_FIXO',
    code: 'PRONAF_MAIS_ALIMENTOS_FIXO',
    name: 'PRONAF Mais Alimentos - Investimento Fixo',
    shortName: 'Mais Alimentos (Fixo)',
    axis: 'INVESTIMENTO',
    group: 'PRONAF',
    description: 'Infraestrutura produtiva durável: galpões, currais, açudagem, eletrificação, poços artesianos e benfeitorias permanentes.',
    defaultInterestRate: 4.5,
    defaultTermYears: 10,
    defaultGraceMonths: 36,
    maxTermYears: 10,
    maxGraceMonths: 36,
    targetAudience: 'Agricultores familiares com Declaração de Aptidão ou CAF/Pronaf ativo.',
    recommendedTemplate: 'PROJETO_RENOVAGRO',
    requiresAreaHa: false,
    requiresUnitOrHeads: true,
    suggestedItems: [
      'Construção de Curral e Brete Hidráulico',
      'Eletrificação e Rede Bifásica/Trifásica',
      'Açudagem e Reservatórios de Água',
      'Barracão e Galpão de Alvenaria'
    ],
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  },

  // 3) PRONAF Mais Alimentos - Investimento Semi-Fixo
  {
    id: 'PRONAF_MAIS_ALIMENTOS_SEMI_FIXO',
    code: 'PRONAF_MAIS_ALIMENTOS_SEMI_FIXO',
    name: 'PRONAF Mais Alimentos - Investimento Semi-Fixo',
    shortName: 'Mais Alimentos (Semi-Fixo)',
    axis: 'INVESTIMENTO',
    group: 'PRONAF',
    description: 'Aquisição de tratores, microtratores, implementos, veículos utilitários de carga e equipamentos agropecuários.',
    defaultInterestRate: 5.0,
    defaultTermYears: 7,
    defaultGraceMonths: 18,
    maxTermYears: 7,
    maxGraceMonths: 24,
    targetAudience: 'Agricultores familiares (CAF ativo) para mecanização e frota produtiva.',
    recommendedTemplate: 'PROJETO_RENOVAGRO',
    requiresAreaHa: false,
    requiresUnitOrHeads: true,
    suggestedItems: [
      'Trator Agrícola até 85cv',
      'Pulverizador e Grade Aradora',
      'Plantadeira e Semeadeira de Precisão',
      'Veículo Utilitário de Carga'
    ],
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  },

  // 4) PRONAF Mulher
  {
    id: 'PRONAF_MULHER',
    code: 'PRONAF_MULHER',
    name: 'PRONAF Mulher',
    shortName: 'Pronaf Mulher',
    axis: 'INVESTIMENTO',
    group: 'PRONAF',
    description: 'Linha exclusiva para investimentos agropecuários e não-agropecuários liderados e geridos por mulheres produtoras rurais.',
    defaultInterestRate: 3.5,
    defaultTermYears: 10,
    defaultGraceMonths: 36,
    maxTermYears: 10,
    maxGraceMonths: 36,
    targetAudience: 'Mulheres agricultoras familiares integrantes de unidade familiar de produção.',
    recommendedTemplate: 'PROJETO_RENOVAGRO',
    requiresAreaHa: false,
    requiresUnitOrHeads: true,
    suggestedItems: [
      'Modernização de Instalações Produtivas',
      'Aquisição de Matrizes Leiteiras e Suínos',
      'Avicultura Colonial e Postura',
      'Processamento e Agroindústria Caseira'
    ],
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  },

  // 5) PRONAF Jovem
  {
    id: 'PRONAF_JOVEM',
    code: 'PRONAF_JOVEM',
    name: 'PRONAF Jovem',
    shortName: 'Pronaf Jovem',
    axis: 'INVESTIMENTO',
    group: 'PRONAF',
    description: 'Estímulo à sucessão familiar e autonomia de jovens no campo para implantação de novos módulos produtivos sustentáveis.',
    defaultInterestRate: 3.5,
    defaultTermYears: 10,
    defaultGraceMonths: 36,
    maxTermYears: 10,
    maxGraceMonths: 36,
    targetAudience: 'Jovens rurais de 16 a 29 anos com formação agrícola ou experiência comprovada.',
    recommendedTemplate: 'PROJETO_RENOVAGRO',
    requiresAreaHa: false,
    requiresUnitOrHeads: true,
    suggestedItems: [
      'Implantação de Módulo Produtivo Agropecuário',
      'Aquisição de Animais e Infraestrutura',
      'Kits de Agricultura Tecnológica e Drones',
      'Equipamentos de Manejo Sustentável'
    ],
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  },

  // 6) PRONAF B (Microcrédito)
  {
    id: 'PRONAF_B',
    code: 'PRONAF_B',
    name: 'PRONAF B (Microcrédito Produtivo Orientado)',
    shortName: 'Pronaf B (Microcrédito)',
    axis: 'AMBOS',
    group: 'PRONAF',
    description: 'Microcrédito de baixíssimo custo com bônus de adimplência para agricultores de menor renda familiar (R$ 50 mil/ano).',
    defaultInterestRate: 0.5,
    defaultTermYears: 2,
    defaultGraceMonths: 12,
    maxTermYears: 3,
    maxGraceMonths: 12,
    targetAudience: 'Famílias rurais enquadradas no Grupo B da agricultura familiar.',
    recommendedTemplate: 'PROJETO_CUSTEIO_SAFRA',
    requiresAreaHa: true,
    requiresUnitOrHeads: true,
    suggestedItems: [
      'Insumos Agrícolas e Adubação Básica',
      'Pequenos Animais (Ovinos, Aves, Suínos)',
      'Ferramental e Pequenas Reformas',
      'Sementes Selecionadas e Cercas'
    ],
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  },

  // 7) PRONAF Agroindústria
  {
    id: 'PRONAF_AGROINDUSTRIA',
    code: 'PRONAF_AGROINDUSTRIA',
    name: 'PRONAF Agroindústria',
    shortName: 'Pronaf Agroindústria',
    axis: 'INVESTIMENTO',
    group: 'PRONAF',
    description: 'Beneficiamento, processamento, pasteurização, embalagem e comercialização da produção agropecuária familiar.',
    defaultInterestRate: 4.5,
    defaultTermYears: 10,
    defaultGraceMonths: 36,
    maxTermYears: 10,
    maxGraceMonths: 36,
    targetAudience: 'Produtores familiares individuais, cooperativas e associações.',
    recommendedTemplate: 'PROJETO_RENOVAGRO',
    requiresAreaHa: false,
    requiresUnitOrHeads: true,
    suggestedItems: [
      'Unidade de Processamento de Queijos/Laticínios',
      'Câmara Fria e Tanque de Resfriamento',
      'Moendas, Despolpadoras e Secadores',
      'Equipamentos de Envase e Rótulos'
    ],
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  },

  // 8) PRONAF Agroecologia
  {
    id: 'PRONAF_AGROECOLOGIA',
    code: 'PRONAF_AGROECOLOGIA',
    name: 'PRONAF Agroecologia',
    shortName: 'Pronaf Agroecologia',
    axis: 'INVESTIMENTO',
    group: 'PRONAF',
    description: 'Financiamento para transição agroecológica, sistemas orgânicos, compostagem, biofábricas e certificação.',
    defaultInterestRate: 3.5,
    defaultTermYears: 10,
    defaultGraceMonths: 36,
    maxTermYears: 10,
    maxGraceMonths: 36,
    targetAudience: 'Produtores familiares em processo de transição ou certificação agroecológica.',
    recommendedTemplate: 'PROJETO_RENOVAGRO',
    requiresAreaHa: true,
    requiresUnitOrHeads: true,
    suggestedItems: [
      'Implantação de Sistema Orgânico e Compostagem',
      'Biofábrica On-Farm de Inóculos',
      'Proteção de Nascentes e Corredores Ecológicos',
      'Quebra-Ventos e Cobertura Verde'
    ],
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  },

  // 9) PRONAF Bioeconomia
  {
    id: 'PRONAF_BIOECONOMIA',
    code: 'PRONAF_BIOECONOMIA',
    name: 'PRONAF Bioeconomia',
    shortName: 'Pronaf Bioeconomia',
    axis: 'INVESTIMENTO',
    group: 'PRONAF',
    description: 'Investimento em energias renováveis (solar/biogás), eficiência hídrica, recuperação vegetal e tecnologias verdes.',
    defaultInterestRate: 3.5,
    defaultTermYears: 10,
    defaultGraceMonths: 36,
    maxTermYears: 10,
    maxGraceMonths: 36,
    targetAudience: 'Agricultores familiares com foco em sustentabilidade energética e conservação.',
    recommendedTemplate: 'PROJETO_INOVAGRO',
    requiresAreaHa: false,
    requiresUnitOrHeads: true,
    suggestedItems: [
      'Microgeração Solar Fotovoltaica',
      'Biodigestores e Tratamento de Resíduos',
      'Sistemas de Captação de Água de Chuva',
      'Reflorestamento de Espécies Nativas'
    ],
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  },

  // 10) PRONAF A e A/C
  {
    id: 'PRONAF_A_AC',
    code: 'PRONAF_A_AC',
    name: 'PRONAF A e A/C (Assentados e Crédito Fundiário)',
    shortName: 'Pronaf A / A/C',
    axis: 'INVESTIMENTO',
    group: 'PRONAF',
    description: 'Estruturação inicial de lotes de reforma agrária (Incra) e beneficiários do PNCF para implantação da infraestrutura produtiva.',
    defaultInterestRate: 1.0,
    defaultTermYears: 10,
    defaultGraceMonths: 36,
    maxTermYears: 10,
    maxGraceMonths: 36,
    targetAudience: 'Assentados do PNRA e beneficiários do PNCF.',
    recommendedTemplate: 'PROJETO_RENOVAGRO',
    requiresAreaHa: true,
    requiresUnitOrHeads: true,
    suggestedItems: [
      'Habitação e Infraestrutura Hídrica Inicial',
      'Implantação de Pastagem e Cercas de Divisão',
      'Aquisição de Rebanho Bovino Inicial',
      'Ferramentas e Correção do Solo'
    ],
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  },

  // 11) Programa RENOVAGRO (Recuperação de Pastagens e Baixo Carbono)
  {
    id: 'RENOVAGRO',
    code: 'RENOVAGRO',
    name: 'Programa RENOVAGRO (Recuperação de Pastagens e Baixo Carbono)',
    shortName: 'RenovAgro (MCR 11.7)',
    axis: 'INVESTIMENTO',
    group: 'RENOVAGRO',
    description: 'Programa oficial de mitigação ambiental e baixa emissão de carbono (MCR 11.7). Foco em solos, calagem, gesso, ILPF e pastagens.',
    defaultInterestRate: 7.0,
    defaultTermYears: 10,
    defaultGraceMonths: 36,
    maxTermYears: 12,
    maxGraceMonths: 48,
    targetAudience: 'Produtores rurais de todos os portes com foco em sustentabilidade produtiva.',
    recommendedTemplate: 'PROJETO_RENOVAGRO',
    requiresAreaHa: true,
    requiresUnitOrHeads: true,
    suggestedItems: [
      'Recuperação de Pastagens Degradadas (MCR 11.7.1.c.I)',
      'Integração Lavoura-Pecuária-Floresta (ILPF)',
      'Sistemas Agroflorestais (SAF)',
      'Manejo de Solo e Água (Calagem e Gessagem)',
      'Aquisição de Matrizes e Reprodutores',
      'Máquinas de Baixo Carbono'
    ],
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  },

  // 12) Programa INOVAGRO (Inovação e Tecnologia Agropecuária)
  {
    id: 'INOVAGRO',
    code: 'INOVAGRO',
    name: 'Programa INOVAGRO (Inovação e Tecnologia Agropecuária)',
    shortName: 'InovAgro (Tecnologia)',
    axis: 'INVESTIMENTO',
    group: 'INOVAGRO',
    description: 'Incentivo à inovação tecnológica: energia solar fotovoltaica, automação, telemetria, irrigação de precisão e softwares.',
    defaultInterestRate: 11.5,
    defaultTermYears: 10,
    defaultGraceMonths: 24,
    maxTermYears: 10,
    maxGraceMonths: 24,
    targetAudience: 'Produtores rurais e cooperativas que investem em automação e geração própria de energia.',
    recommendedTemplate: 'PROJETO_INOVAGRO',
    requiresAreaHa: false,
    requiresUnitOrHeads: true,
    suggestedItems: [
      'Gerador Solar Fotovoltaico On-Grid / Off-Grid',
      'Trator Agrícola com Piloto Automático',
      'Sistema de Irrigação Automatizado (Pivô Central)',
      'Estação Meteorológica e Sensores de Solo'
    ],
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  },

  // 13) Programa MODERFROTA (Tratores e Colheitadeiras)
  {
    id: 'MODERFROTA',
    code: 'MODERFROTA',
    name: 'Programa MODERFROTA (Tratores e Colheitadeiras)',
    shortName: 'Moderfrota',
    axis: 'INVESTIMENTO',
    group: 'MODERFROTA',
    description: 'Modernização da frota de tratores agrícolas, colheitadeiras, pulverizadores automotrizes e plataformas de corte novas ou usadas.',
    defaultInterestRate: 11.5,
    defaultTermYears: 7,
    defaultGraceMonths: 12,
    maxTermYears: 7,
    maxGraceMonths: 14,
    targetAudience: 'Produtores rurais de todos os portes e empresas de serviços agrícolas.',
    recommendedTemplate: 'PROJETO_RENOVAGRO',
    requiresAreaHa: false,
    requiresUnitOrHeads: true,
    suggestedItems: [
      'Trator Agrícola Traçado 4x4 (110cv a 250cv)',
      'Colheitadeira de Grãos com Rotor Axial',
      'Pulverizador Automotriz Autonivelante',
      'Plataforma de Corte de Soja / Milho'
    ],
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  },

  // 14) Investe Agro
  {
    id: 'INVESTE_AGRO',
    code: 'INVESTE_AGRO',
    name: 'Investe Agro (Recursos Livres / Banco do Brasil)',
    shortName: 'Investe Agro',
    axis: 'INVESTIMENTO',
    group: 'GERAL',
    description: 'Linha com recursos livres para investimentos agropecuários com flexibilidade de garantias e prazos sob medida.',
    defaultInterestRate: 12.5,
    defaultTermYears: 6,
    defaultGraceMonths: 18,
    maxTermYears: 8,
    maxGraceMonths: 24,
    targetAudience: 'Produtores rurais correntistas que buscam agilidade na esteira operacional bancária.',
    recommendedTemplate: 'PROJETO_RENOVAGRO',
    requiresAreaHa: false,
    requiresUnitOrHeads: true,
    suggestedItems: [
      'Aquisição de Matrizes Nelore / Angus',
      'Benfeitorias e Cercamento Perimetral',
      'Equipamentos de Ordenha e Silagem',
      'Veículos e Caminhões de Transporte Rural'
    ],
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  },

  // 15) PCA (Construção e Ampliação de Armazéns e Silos)
  {
    id: 'PCA',
    code: 'PCA',
    name: 'PCA (Construção e Ampliação de Armazéns e Silos)',
    shortName: 'PCA (Armazéns & Silos)',
    axis: 'INVESTIMENTO',
    group: 'PCA',
    description: 'Programa oficial do MAPA/BNDES para investimento em capacidade estática de armazenagem, secadores e aeração de grãos.',
    defaultInterestRate: 7.5,
    defaultTermYears: 12,
    defaultGraceMonths: 24,
    maxTermYears: 12,
    maxGraceMonths: 36,
    targetAudience: 'Produtores e cooperativas agrícolas que buscam autonomia de estocagem na fazenda.',
    recommendedTemplate: 'PROJETO_RENOVAGRO',
    requiresAreaHa: false,
    requiresUnitOrHeads: true,
    suggestedItems: [
      'Silo Metálico com Fundo Cônico / Plano',
      'Secador Contínuo de Grãos e Fornalha',
      'Balança Rodoviária 80 Toneladas',
      'Moega e Elevadores de Canecas'
    ],
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  }
]

/**
 * Filtra as linhas oficiais compatíveis com o eixo selecionado.
 * Se o filtro for 'TODOS' ou não informado, retorna todas as 15 linhas.
 */
export function getOfficialCreditLinesByAxis(axis?: CreditLineAxis | 'TODOS'): OfficialCreditLine[] {
  if (!axis || axis === 'TODOS') {
    return OFFICIAL_CREDIT_LINES
  }
  return OFFICIAL_CREDIT_LINES.filter(line => line.axis === axis || line.axis === 'AMBOS')
}

/**
 * Busca uma linha oficial pelo ID ou código.
 */
export function findOfficialCreditLine(idOrCode?: string): OfficialCreditLine | undefined {
  if (!idOrCode) return undefined
  const query = idOrCode.toUpperCase().trim()
  return OFFICIAL_CREDIT_LINES.find(l => l.id.toUpperCase() === query || l.code.toUpperCase() === query)
}

/**
 * Retorna as classes de estilo padronizadas da badge conforme o eixo da linha de crédito.
 * - CUSTEIO: Verde institucional suave
 * - INVESTIMENTO / AMBOS: Cinza/ardósia neutro corporativo
 */
export function getCreditLineBadgeClass(axis: CreditLineAxis): string {
  if (axis === 'CUSTEIO') {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  }
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

