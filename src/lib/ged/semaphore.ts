import { differenceInCalendarDays } from 'date-fns'

// ---------------------------------------------------------------
// Tipos e Constantes do Semáforo de Validades
// ---------------------------------------------------------------

export type DocumentStatus = 'VALIDO' | 'ALERTA' | 'VENCIDO' | 'INDEFINIDO'

/**
 * Janelas de alerta diferenciadas por tipo de documento (em dias).
 * Documentos não listados usam a janela DEFAULT de 60 dias.
 */
export const ALERT_WINDOWS: Record<string, number> = {
  MATRICULA: 7,
  CND_IBAMA: 15,
  CND_FEDERAL: 30,
  CERTIDAO_INTEIRO_TEOR: 30,
  CERTIDAO_ONUS_REAIS: 30,
  CND_PROPRIETARIO: 30,
  CND_CONJUGE: 30,
  OUTORGA_AGUA: 60,
  OUTORGA_AGUA_DUI: 60,
  LICENCA_AMBIENTAL_OPERACAO: 60,
  LICENCA_AMBIENTAL_INSTALACAO: 60,
  DEFAULT: 60,
}

/**
 * Configuração visual de cada status do semáforo.
 */
export const STATUS_CONFIG: Record<DocumentStatus, {
  color: string
  bg: string
  icon: string
  label: string
}> = {
  VALIDO: {
    color: '#16A34A',
    bg: 'rgba(22, 163, 74, 0.12)',
    icon: 'CheckCircle2',
    label: 'Válido',
  },
  ALERTA: {
    color: '#EAB308',
    bg: 'rgba(234, 179, 8, 0.12)',
    icon: 'AlertTriangle',
    label: 'Em Alerta',
  },
  VENCIDO: {
    color: '#DC2626',
    bg: 'rgba(220, 38, 38, 0.12)',
    icon: 'XCircle',
    label: 'Vencido',
  },
  INDEFINIDO: {
    color: '#94A3B8',
    bg: 'rgba(148, 163, 184, 0.12)',
    icon: 'MinusCircle',
    label: 'Sem validade',
  },
}

/**
 * Mapa de rótulos amigáveis para cada tipo de documento (37 categorias bancárias).
 */
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  // Principais / Qualificação Base
  MATRICULA: 'Matrícula de Imóvel',
  CAR: 'CAR (Cadastro Ambiental Rural)',
  CCIR: 'CCIR (INCRA)',
  ITR: 'ITR (Imposto Territorial Rural)',
  RG_CPF: 'RG / CPF',
  CERTIDAO_CASAMENTO: 'Certidão de Casamento',
  CONTRATO_ARRENDAMENTO: 'Contrato de Arrendamento Rural',
  OUTORGA_AGUA: 'Outorga de Água',
  CND_IBAMA: 'CND IBAMA',
  CND_FEDERAL: 'CND Federal / PGFN',
  DAP_CAF: 'DAP / CAF',
  LAUDO_TECNICO: 'Laudo Técnico / Vistoria',
  OUTROS: 'Outros Documentos',

  // Pessoais e Fiscais Expandidos
  AUTORIZACAO_COMPARTILHAMENTO: 'Autorização de Compartilhamento',
  AUTORIZACAO_SCR: 'Autorização Consulta SCR (BACEN)',
  AUTORIZACAO_SICOR: 'Autorização Consulta SICOR',
  CPF_RG_PROPRIETARIO: 'RG / CPF do Proprietário',
  CPF_RG_CONJUGE: 'RG / CPF do Cônjuge',
  CND_PROPRIETARIO: 'CND do Proprietário',
  CND_CONJUGE: 'CND do Cônjuge',
  COMPROVANTE_RESIDENCIA: 'Comprovante de Residência',
  IMPOSTO_RENDA: 'Declaração de Imposto de Renda',

  // Propriedade e Posse
  CERTIDAO_INTEIRO_TEOR: 'Certidão de Inteiro Teor',
  CERTIDAO_CADEIA_DOMINIAL: 'Certidão de Cadeia Dominial',
  CERTIDAO_ONUS_REAIS: 'Certidão de Ônus Reais',
  TITULO_DOMINIO: 'Título de Domínio',
  ESCRITURA_COMPRA_VENDA: 'Escritura de Compra e Venda',
  ESCRITURA_DOACAO: 'Escritura de Doação',
  ESCRITURA_PERMUTA: 'Escritura de Permuta',
  ESCRITURA_CESSAO_HEREDITARIO: 'Escritura de Cessão de Direitos Hereditários',
  ESCRITURA_INVENTARIO: 'Escritura de Inventário / Partilha',
  INSCRICAO_ESTADUAL: 'Inscrição Estadual',
  CONTRATO_CESSAO_USO: 'Contrato de Cessão de Uso',

  // Ambientais e Técnicos
  OUTORGA_AGUA_DUI: 'Declaração de Uso Insignificante de Água (DUI)',
  LICENCA_AMBIENTAL_OPERACAO: 'Licença Ambiental de Operação (LO)',
  LICENCA_AMBIENTAL_INSTALACAO: 'Licença Ambiental de Instalação (LI)',
  LICENCA_AMBIENTAL_AEF: 'Autorização de Exploração Florestal (AEF)',
}

// ---------------------------------------------------------------
// Função Principal do Semáforo
// ---------------------------------------------------------------

/**
 * Calcula o status semafórico de um documento com base na data
 * de validade e no tipo documental (que define a janela de alerta).
 *
 * @param expirationDate - Data de expiração do documento (null = sem validade)
 * @param documentType   - Tipo do documento (usado para definir a janela de alerta)
 * @returns O status semafórico: VALIDO | ALERTA | VENCIDO | INDEFINIDO
 */
export function calculateDocumentStatus(
  expirationDate: Date | null | undefined,
  documentType?: string
): DocumentStatus {
  // Documentos sem data de validade (RG, CPF, Contratos permanentes)
  if (!expirationDate) return 'INDEFINIDO'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const target = new Date(expirationDate)
  target.setHours(0, 0, 0, 0)

  const daysRemaining = differenceInCalendarDays(target, today)

  // Vencido
  if (daysRemaining <= 0) return 'VENCIDO'

  // Determinar a janela de alerta conforme o tipo de documento
  const alertWindow = (documentType && ALERT_WINDOWS[documentType])
    ? ALERT_WINDOWS[documentType]
    : ALERT_WINDOWS.DEFAULT

  // Dentro da janela de alerta
  if (daysRemaining <= alertWindow) return 'ALERTA'

  // Válido
  return 'VALIDO'
}

/**
 * Calcula os dias restantes até a expiração.
 * Retorna null se não houver data de validade.
 * Retorna valor negativo se já estiver vencido.
 */
export function daysUntilExpiration(expirationDate: Date | null | undefined): number | null {
  if (!expirationDate) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const target = new Date(expirationDate)
  target.setHours(0, 0, 0, 0)

  return differenceInCalendarDays(target, today)
}

/**
 * Retorna o texto amigável da contagem regressiva.
 * Ex: "Vence em 12 dias", "Vencido há 5 dias", "Sem validade"
 */
export function getExpirationText(expirationDate: Date | null | undefined): string {
  const days = daysUntilExpiration(expirationDate)
  if (days === null) return 'Sem validade'
  if (days < 0) return `Vencido há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}`
  if (days === 0) return 'Vence hoje'
  return `Vence em ${days} dia${days !== 1 ? 's' : ''}`
}
