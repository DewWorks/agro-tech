import { AnimalCategoryBB, AnimalPurposeBB, LivestockSpecies, LivestockCategory } from '@prisma/client'

// Mapeamento de Rótulos em Português para Enums Prisma de Categoria BB
export const CATEGORY_BB_LABEL_TO_ENUM: Record<string, AnimalCategoryBB> = {
  'Avestruz': 'AVESTRUZ',
  'Bezerra': 'BEZERRA',
  'Bezerro': 'BEZERRO',
  'Bode': 'BODE',
  'Boi': 'BOI',
  'Boi Carreiro': 'BOI_CARREIRO',
  'Bubalino - Bezerro': 'BUBALINO_BEZERRO',
  'Bubalino - Matriz': 'BUBALINO_MATRIZ',
  'Búfalo': 'BUFALO',
  'Burro': 'BURRO',
  'Cabra': 'CABRA',
  'Carneiro': 'CARNEIRO',
  'Cavalo': 'CAVALO',
  'Codorna': 'CODORNA',
  'Coelho(s)': 'COELHO',
  'Coelho': 'COELHO',
  'Égua': 'EGUA',
  'Franga': 'FRANGA',
  'Frango': 'FRANGO',
  'Galinha': 'GALINHA',
  'Garrota': 'GARROTA',
  'Garrote': 'GARROTE',
  'Javali': 'JAVALI',
  'Leitão': 'LEITAO',
  'Novilha Bovina': 'NOVILHA_BOVINA',
  'Novilha Bubalina': 'NOVILHA_BUBALINA',
  'Novilho Bovino': 'NOVILHO_BOVINO',
  'Ovelha': 'OVELHA',
  'Pato': 'PATO',
  'Porca': 'PORCA',
  'Porco': 'PORCO',
  'Touro': 'TOURO',
  'Vaca': 'VACA',
}

// Mapeamento reverso de Enum Prisma para Rótulo amigável no UI
export const CATEGORY_BB_ENUM_TO_LABEL: Record<AnimalCategoryBB, string> = {
  AVESTRUZ: 'Avestruz',
  BEZERRA: 'Bezerra',
  BEZERRO: 'Bezerro',
  BODE: 'Bode',
  BOI: 'Boi',
  BOI_CARREIRO: 'Boi Carreiro',
  BUBALINO_BEZERRO: 'Bubalino - Bezerro',
  BUBALINO_MATRIZ: 'Bubalino - Matriz',
  BUFALO: 'Búfalo',
  BURRO: 'Burro',
  CABRA: 'Cabra',
  CARNEIRO: 'Carneiro',
  CAVALO: 'Cavalo',
  CODORNA: 'Codorna',
  COELHO: 'Coelho(s)',
  EGUA: 'Égua',
  FRANGA: 'Franga',
  FRANGO: 'Frango',
  GALINHA: 'Galinha',
  GARROTA: 'Garrota',
  GARROTE: 'Garrote',
  JAVALI: 'Javali',
  LEITAO: 'Leitão',
  NOVILHA_BOVINA: 'Novilha Bovina',
  NOVILHA_BUBALINA: 'Novilha Bubalina',
  NOVILHO_BOVINO: 'Novilho Bovino',
  OVELHA: 'Ovelha',
  PATO: 'Pato',
  PORCA: 'Porca',
  PORCO: 'Porco',
  TOURO: 'Touro',
  VACA: 'Vaca',
}

// Mapeamento de Rótulos de Finalidade para Enum Prisma
export const PURPOSE_BB_LABEL_TO_ENUM: Record<string, AnimalPurposeBB> = {
  'Produção de Crias': 'PRODUCAO_DE_CRIAS',
  'Produção de Ovos': 'PRODUCAO_DE_OVOS',
  'Criação': 'CRIACAO',
  'Engorda Para Abate': 'ENGORDA_PARA_ABATE',
  'Criação/Recriação e Abate': 'CRIACAO_RECRIACAO_ABATE',
  'Produção de Leite': 'PRODUCAO_DE_LEITE',
  'Produção de Carne': 'PRODUCAO_DE_CARNE',
  'Produção de Carne e Leite': 'PRODUCAO_DE_CARNE_E_LEITE',
  'Produção de Couros e Afins': 'PRODUCAO_DE_COURO_E_AFINS',
  'Produção de Lã': 'PRODUCAO_DE_LA',
  'Estocagem de Boi': 'ESTOCAGEM_DE_BOI',
  'Animais de Serviços': 'ANIMAIS_DE_SERVICO',
  'Produção de Carne e Lã': 'PRODUCAO_DE_CARNE_E_LA',
  'Produção de Carne e Banha': 'PRODUCAO_DE_CARNE_E_BANHA',
  'Engorda em Confinamento': 'ENGORDA_EM_CONFINAMENTO',
  'Outro': 'OUTRO',
}

// Mapeamento reverso de Enum Prisma para Rótulo amigável no UI
export const PURPOSE_BB_ENUM_TO_LABEL: Record<AnimalPurposeBB, string> = {
  PRODUCAO_DE_CRIAS: 'Produção de Crias',
  PRODUCAO_DE_OVOS: 'Produção de Ovos',
  CRIACAO: 'Criação',
  ENGORDA_PARA_ABATE: 'Engorda Para Abate',
  CRIACAO_RECRIACAO_ABATE: 'Criação/Recriação e Abate',
  PRODUCAO_DE_LEITE: 'Produção de Leite',
  PRODUCAO_DE_CARNE: 'Produção de Carne',
  PRODUCAO_DE_CARNE_E_LEITE: 'Produção de Carne e Leite',
  PRODUCAO_DE_COURO_E_AFINS: 'Produção de Couros e Afins',
  PRODUCAO_DE_LA: 'Produção de Lã',
  ESTOCAGEM_DE_BOI: 'Estocagem de Boi',
  ANIMAIS_DE_SERVICO: 'Animais de Serviços',
  PRODUCAO_DE_CARNE_E_LA: 'Produção de Carne e Lã',
  PRODUCAO_DE_CARNE_E_BANHA: 'Produção de Carne e Banha',
  ENGORDA_EM_CONFINAMENTO: 'Engorda em Confinamento',
  OUTRO: 'Outro',
}

/**
 * Normaliza qualquer valor para o enum AnimalCategoryBB do Prisma de forma segura.
 */
export function normalizeCategoryBB(val?: string | null): AnimalCategoryBB | null {
  if (!val) return null
  const trimmed = val.trim()
  if (CATEGORY_BB_LABEL_TO_ENUM[trimmed]) {
    return CATEGORY_BB_LABEL_TO_ENUM[trimmed]
  }
  // Se já for uma chave do enum (ex: 'VACA')
  if (Object.values(CATEGORY_BB_LABEL_TO_ENUM).includes(trimmed as AnimalCategoryBB)) {
    return trimmed as AnimalCategoryBB
  }
  // Mapeamentos flexíveis adicionais
  const lower = trimmed.toLowerCase()
  if (lower.includes('vaca') || lower.includes('matriz')) return 'VACA'
  if (lower.includes('touro') || lower.includes('reprodutor')) return 'TOURO'
  if (lower.includes('bezerro') || lower.includes('cria')) return 'BEZERRO'
  if (lower.includes('bezerra')) return 'BEZERRA'
  if (lower.includes('garrote')) return 'GARROTE'
  if (lower.includes('garrota')) return 'GARROTA'
  if (lower.includes('novilho')) return 'NOVILHO_BOVINO'
  if (lower.includes('novilha')) return 'NOVILHA_BOVINA'
  if (lower.includes('boi')) return 'BOI'

  return null
}

/**
 * Converte o enum do banco de volta para o rótulo legível do UI.
 */
export function denormalizeCategoryBB(val?: string | null): string {
  if (!val) return 'Vaca'
  const trimmed = val.trim()
  if (CATEGORY_BB_ENUM_TO_LABEL[trimmed as AnimalCategoryBB]) {
    return CATEGORY_BB_ENUM_TO_LABEL[trimmed as AnimalCategoryBB]
  }
  if (CATEGORY_BB_LABEL_TO_ENUM[trimmed]) {
    return trimmed
  }
  return trimmed
}

/**
 * Normaliza qualquer valor para o enum AnimalPurposeBB do Prisma de forma segura.
 */
export function normalizePurposeBB(val?: string | null): AnimalPurposeBB | null {
  if (!val) return null
  const trimmed = val.trim()
  if (PURPOSE_BB_LABEL_TO_ENUM[trimmed]) {
    return PURPOSE_BB_LABEL_TO_ENUM[trimmed]
  }
  if (Object.values(PURPOSE_BB_LABEL_TO_ENUM).includes(trimmed as AnimalPurposeBB)) {
    return trimmed as AnimalPurposeBB
  }
  const lower = trimmed.toLowerCase()
  if (lower.includes('cria') && !lower.includes('recria')) return 'PRODUCAO_DE_CRIAS'
  if (lower.includes('leite')) return 'PRODUCAO_DE_LEITE'
  if (lower.includes('carne') && lower.includes('leite')) return 'PRODUCAO_DE_CARNE_E_LEITE'
  if (lower.includes('carne')) return 'PRODUCAO_DE_CARNE'
  if (lower.includes('abate')) return 'ENGORDA_PARA_ABATE'
  if (lower.includes('confinamento')) return 'ENGORDA_EM_CONFINAMENTO'
  if (lower.includes('serviço') || lower.includes('servico')) return 'ANIMAIS_DE_SERVICO'

  return 'PRODUCAO_DE_CRIAS'
}

/**
 * Converte o enum do banco de volta para o rótulo legível do UI.
 */
export function denormalizePurposeBB(val?: string | null): string {
  if (!val) return 'Produção de Crias'
  const trimmed = val.trim()
  if (PURPOSE_BB_ENUM_TO_LABEL[trimmed as AnimalPurposeBB]) {
    return PURPOSE_BB_ENUM_TO_LABEL[trimmed as AnimalPurposeBB]
  }
  if (PURPOSE_BB_LABEL_TO_ENUM[trimmed]) {
    return trimmed
  }
  return trimmed
}

/**
 * Garante que a categoria relacional LivestockCategory do Prisma seja sempre válida.
 */
export function normalizeLivestockCategory(val?: string | null, categoryBB?: AnimalCategoryBB | null): LivestockCategory {
  const valid: LivestockCategory[] = ['MATRIZES', 'NOVILHO', 'BEZERRO', 'TOURO', 'GARROTE', 'OUTROS']
  if (val && valid.includes(val as LivestockCategory)) {
    return val as LivestockCategory
  }
  if (categoryBB) {
    if (categoryBB === 'VACA' || categoryBB === 'BUBALINO_MATRIZ') return 'MATRIZES'
    if (categoryBB === 'TOURO') return 'TOURO'
    if (categoryBB === 'BEZERRO' || categoryBB === 'BEZERRA' || categoryBB === 'BUBALINO_BEZERRO') return 'BEZERRO'
    if (categoryBB === 'GARROTE' || categoryBB === 'GARROTA') return 'GARROTE'
    if (categoryBB === 'NOVILHO_BOVINO' || categoryBB === 'NOVILHA_BOVINA' || categoryBB === 'NOVILHA_BUBALINA') return 'NOVILHO'
  }
  const str = (val || '').toLowerCase()
  if (str.includes('vaca') || str.includes('matriz')) return 'MATRIZES'
  if (str.includes('touro') || str.includes('reprodutor')) return 'TOURO'
  if (str.includes('bezerro') || str.includes('bezerra')) return 'BEZERRO'
  if (str.includes('garrote') || str.includes('garrota')) return 'GARROTE'
  if (str.includes('novilho') || str.includes('novilha')) return 'NOVILHO'

  return 'MATRIZES'
}

/**
 * Garante que a espécie relacional LivestockSpecies do Prisma seja sempre válida.
 */
export function normalizeLivestockSpecies(val?: string | null, categoryBB?: AnimalCategoryBB | null): LivestockSpecies {
  const valid: LivestockSpecies[] = ['BOVINO', 'OVINO', 'CAPRINO', 'SUINO', 'FRANGO_CAIPIRA', 'EQUINO', 'OUTROS']
  if (val && valid.includes(val as LivestockSpecies)) {
    return val as LivestockSpecies
  }
  if (categoryBB) {
    if (categoryBB === 'BURRO' || categoryBB === 'CAVALO' || categoryBB === 'EGUA') return 'EQUINO'
    if (categoryBB === 'BODE' || categoryBB === 'CABRA') return 'CAPRINO'
    if (categoryBB === 'CARNEIRO' || categoryBB === 'OVELHA') return 'OVINO'
    if (categoryBB === 'PORCA' || categoryBB === 'PORCO' || categoryBB === 'LEITAO') return 'SUINO'
    if (categoryBB === 'GALINHA' || categoryBB === 'FRANGA' || categoryBB === 'FRANGO') return 'FRANGO_CAIPIRA'
  }
  return 'BOVINO'
}
