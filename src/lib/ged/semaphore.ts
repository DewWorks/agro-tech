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
  OUTORGA_AGUA: 60,
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
 * Mapa de rótulos amigáveis para cada tipo de documento.
 */
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  MATRICULA: 'Matrícula de Imóvel',
  CAR: 'CAR (Cadastro Ambiental Rural)',
  CCIR: 'CCIR',
  ITR: 'ITR (Imposto Territorial Rural)',
  RG_CPF: 'RG / CPF',
  CERTIDAO_CASAMENTO: 'Certidão de Casamento',
  CONTRATO_ARRENDAMENTO: 'Contrato de Arrendamento',
  OUTORGA_AGUA: 'Outorga de Água',
  CND_IBAMA: 'CND IBAMA',
  CND_FEDERAL: 'CND Federal / PGFN',
  DAP_CAF: 'DAP / CAF',
  LAUDO_TECNICO: 'Laudo Técnico',
  OUTROS: 'Outros',
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
