import { z } from 'zod'

// ============================================================================
// 10 TIPOS DE SERVIÇOS RURAIS OFICIAIS (SUGESTÕES CLIENTE - PÁG. 1)
// ============================================================================

export const RURAL_SERVICE_TYPES = [
  'PROJETO_CUSTEIO',
  'PROJETO_INVESTIMENTO',
  'LIMITE_CREDITO',
  'PRORROGACAO_DIVIDAS',
  'CADASTRO_AMBIENTAL_RURAL',
  'LEVANTAMENTO_TOPOGRAFICO',
  'LAUDO_TECNICO',
  'ORCAMENTO_SERVICOS',
  'VISITA_TECNICA',
  'OUTORGA_LICENCA_AMBIENTAL',
  'OUTROS',
] as const

export type RuralServiceTypeCode = (typeof RURAL_SERVICE_TYPES)[number]

// ============================================================================
// FLUXO DE ESTADOS CANÔNICOS (SUGESTÕES CLIENTE - PÁG. 2)
// ============================================================================

export const DEMAND_STATUSES = [
  'SOLICITADO',
  'EM_EXECUCAO',
  'AGUARDANDO_DOCUMENTACAO',
  'CONCLUIDO',
  'CANCELADO',
] as const

export type DemandStatusCode = (typeof DEMAND_STATUSES)[number]

export const DEMAND_PRIORITIES = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'] as const
export type DemandPriorityCode = (typeof DEMAND_PRIORITIES)[number]

// ============================================================================
// CATÁLOGO DETALHADO DOS 10 SERVIÇOS RURAIS & DOCUMENTAÇÃO SUGERIDA
// ============================================================================

export interface RuralServiceMeta {
  code: RuralServiceTypeCode
  label: string
  description: string
  defaultDocuments: string[]
  estimatedDaysDefault: number
}

export const RURAL_SERVICES_CATALOG: Record<RuralServiceTypeCode, RuralServiceMeta> = {
  PROJETO_CUSTEIO: {
    code: 'PROJETO_CUSTEIO',
    label: 'Projeto de Custeio',
    description: 'Projeto de custeio agrícola ou pecuário para financiamento de safra ou rebanho.',
    defaultDocuments: [
      'Matrícula Atualizada (CRI)',
      'CAR - Cadastro Ambiental Rural',
      'CCIR Quitado',
      'ITR / DIAT',
      'DAP / CAF Ativo',
      'Orçamento / Cotação de Insumos',
    ],
    estimatedDaysDefault: 15,
  },
  PROJETO_INVESTIMENTO: {
    code: 'PROJETO_INVESTIMENTO',
    label: 'Projeto de Investimento',
    description: 'Financiamento de tratores, colheitadeiras, implementos, infraestrutura ou solo.',
    defaultDocuments: [
      'Matrícula Atualizada (CRI)',
      'CAR - Cadastro Ambiental Rural',
      'Proposta Comercial do Fornecedor / Concessionária',
      'Memorial Descritivo da Benfeitoria',
      'CND Federal / Receita Federal',
    ],
    estimatedDaysDefault: 20,
  },
  LIMITE_CREDITO: {
    code: 'LIMITE_CREDITO',
    label: 'Limite de Crédito / Limite Técnico',
    description: 'Abertura, renovação ou ampliação de limite operacional bancário (SICOR/MCR).',
    defaultDocuments: [
      'Documento de Identidade (RG/CNH) do Produtor',
      'Documentos do Cônjuge (RG/CPF)',
      'Comprovante de Residência Atualizado',
      'Declaração de IRPF / Recibo de Entrega',
      'Extratos Bancários Recentes',
    ],
    estimatedDaysDefault: 10,
  },
  PRORROGACAO_DIVIDAS: {
    code: 'PRORROGACAO_DIVIDAS',
    label: 'Prorrogação de Dívidas',
    description: 'Alongamento de parcelas de crédito rural por perda de safra, seca ou mercado.',
    defaultDocuments: [
      'Cédula de Produto Rural (CPR) ou Contrato de Financiamento',
      'Laudo Técnico de Perda de Safra / Frustração',
      'Notificação Bancária de Vencimento',
      'Demonstrativo de Fluxo de Caixa',
    ],
    estimatedDaysDefault: 12,
  },
  CADASTRO_AMBIENTAL_RURAL: {
    code: 'CADASTRO_AMBIENTAL_RURAL',
    label: 'Cadastro Ambiental Rural (CAR)',
    description: 'Inscrição, retificação ou desembargo de CAR junto ao órgão ambiental.',
    defaultDocuments: [
      'Certidão de Inteiro Teor da Matrícula',
      'Polígono Georreferenciado (.kml / .shp)',
      'Documento de Identidade do Proprietário',
      'CCIR Atualizado',
    ],
    estimatedDaysDefault: 10,
  },
  LEVANTAMENTO_TOPOGRAFICO: {
    code: 'LEVANTAMENTO_TOPOGRAFICO',
    label: 'Levantamento Topográfico',
    description: 'Georreferenciamento de precisão (SIGEF/INCRA), demarcação e medição perimétrica.',
    defaultDocuments: [
      'Matrícula do Imóvel',
      'Confrontações e Relação de Vizinhos',
      'Ponto de Amarração e Coordenadas de Referência',
    ],
    estimatedDaysDefault: 25,
  },
  LAUDO_TECNICO: {
    code: 'LAUDO_TECNICO',
    label: 'Laudo Técnico',
    description: 'Laudo de avaliação patrimonial (solo, benfeitorias, semoventes ou máquinas).',
    defaultDocuments: [
      'Matrícula Atualizada (CRI)',
      'Relação de Máquinas com Número de Chassi',
      'Inventário do Rebanho',
      'Roteiro Detalhado de Acesso',
    ],
    estimatedDaysDefault: 8,
  },
  ORCAMENTO_SERVICOS: {
    code: 'ORCAMENTO_SERVICOS',
    label: 'Orçamento de Serviços',
    description: 'Proposta comercial de honorários técnicos de consultoria e projetos rurais.',
    defaultDocuments: [
      'Descrição Preliminar da Demanda',
      'Dados Básicos de Contato do Cliente',
    ],
    estimatedDaysDefault: 3,
  },
  VISITA_TECNICA: {
    code: 'VISITA_TECNICA',
    label: 'Visita Técnica de Campo',
    description: 'Vistoria in loco, diagnóstico de solo, pastagens, rebanho e acompanhamento.',
    defaultDocuments: [
      'Roteiro de Acesso à Propriedade',
      'Contato do Encarregado / Gerente Local',
    ],
    estimatedDaysDefault: 5,
  },
  OUTORGA_LICENCA_AMBIENTAL: {
    code: 'OUTORGA_LICENCA_AMBIENTAL',
    label: 'Outorga / DUI / Licença Ambiental',
    description: 'Licenciamento de recursos hídricos (DUI/outorga) ou licença de operação.',
    defaultDocuments: [
      'CAR Homologado',
      'Projeto Técnico Hidrológico',
      'Análise Laboratorial de Água',
      'ART do Responsável Técnico',
    ],
    estimatedDaysDefault: 30,
  },
  OUTROS: {
    code: 'OUTROS',
    label: 'Outros Serviços Rurais',
    description: 'Demandas agronômicas, ambientais ou zootécnicas sob medida.',
    defaultDocuments: [],
    estimatedDaysDefault: 7,
  },
}

export const DEMAND_STATUS_METAS: Record<
  DemandStatusCode,
  { label: string; color: string; description: string }
> = {
  SOLICITADO: {
    label: 'Serviço Solicitado',
    color: 'blue',
    description: 'Demanda recebida e aguardando triagem ou início dos trabalhos técnicos.',
  },
  EM_EXECUCAO: {
    label: 'Em Execução',
    color: 'purple',
    description: 'Trabalho técnico em andamento (cálculos, laudos, visitas ou montagem).',
  },
  AGUARDANDO_DOCUMENTACAO: {
    label: 'Aguardando Documentação',
    color: 'amber',
    description: 'Processo pausado aguardando envio de documentos pendentes pelo produtor.',
  },
  CONCLUIDO: {
    label: 'Concluído',
    color: 'emerald',
    description: 'Serviço finalizado, validado e entregue ao produtor ou protocolado no banco.',
  },
  CANCELADO: {
    label: 'Cancelado',
    color: 'slate',
    description: 'Demanda arquivada ou cancelada pelo cliente.',
  },
}

// ============================================================================
// CONTROLE DE PRAZOS & HELPER PURO DE SLA
// ============================================================================

export type SlaStatus =
  | 'NO_PRAZO'
  | 'ALERTA'
  | 'ATRASADO'
  | 'CONCLUIDO_NO_PRAZO'
  | 'CONCLUIDO_COM_ATRASO'

export interface SlaInfo {
  status: SlaStatus
  daysRemaining: number | null
  daysDelayed: number | null
  label: string
}

export function calculateSlaInfo(
  estimatedDeliveryDate?: Date | string | null,
  completionDate?: Date | string | null,
  currentStatus: DemandStatusCode = 'SOLICITADO',
  referenceDate: Date = new Date()
): SlaInfo {
  if (!estimatedDeliveryDate) {
    return {
      status: 'NO_PRAZO',
      daysRemaining: null,
      daysDelayed: null,
      label: 'Sem Prazo Definido',
    }
  }

  const estimated = new Date(estimatedDeliveryDate)
  const estTime = new Date(estimated.getFullYear(), estimated.getMonth(), estimated.getDate()).getTime()

  // Se já concluído
  if (currentStatus === 'CONCLUIDO') {
    const completed = completionDate ? new Date(completionDate) : referenceDate
    const compTime = new Date(completed.getFullYear(), completed.getMonth(), completed.getDate()).getTime()
    const isLate = compTime > estTime

    if (isLate) {
      const diffMs = compTime - estTime
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      return {
        status: 'CONCLUIDO_COM_ATRASO',
        daysRemaining: 0,
        daysDelayed: days,
        label: `Concluído com ${days} dia(s) de atraso`,
      }
    }

    return {
      status: 'CONCLUIDO_NO_PRAZO',
      daysRemaining: null,
      daysDelayed: 0,
      label: 'Concluído no Prazo',
    }
  }

  // Em andamento
  const refTime = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate()).getTime()
  const diffMs = estTime - refTime
  const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (daysRemaining < 0) {
    const delayed = Math.abs(daysRemaining)
    return {
      status: 'ATRASADO',
      daysRemaining: 0,
      daysDelayed: delayed,
      label: `Atrasado há ${delayed} dia(s)`,
    }
  }

  if (daysRemaining <= 3) {
    return {
      status: 'ALERTA',
      daysRemaining,
      daysDelayed: 0,
      label: daysRemaining === 0 ? 'Vence Hoje' : `Vence em ${daysRemaining} dia(s)`,
    }
  }

  return {
    status: 'NO_PRAZO',
    daysRemaining,
    daysDelayed: 0,
    label: `Restam ${daysRemaining} dia(s)`,
  }
}

// ============================================================================
// SCHEMAS ZOD DE VALIDAÇÃO
// ============================================================================

export const demandChecklistItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'O nome do documento pendente é obrigatório'),
  documentType: z.string().optional().nullable(),
  documentId: z.string().optional().nullable(),
  isRequired: z.boolean().default(true),
  isDelivered: z.boolean().default(false),
  deliveredAt: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const createDemandSchema = z
  .object({
    branchId: z.string().optional(),
    createdById: z.string().optional(),
    producerId: z.string().min(1, 'Selecione o produtor rural'),
    propertyId: z.string().optional().nullable(),
    assignedToId: z.string().optional().nullable(),
    assigneeId: z.string().optional().nullable(),
    responsibleName: z.string().optional().nullable(),
    proposalId: z.string().optional().nullable(),
    documentId: z.string().optional().nullable(),
    serviceType: z.enum(RURAL_SERVICE_TYPES, {
      message: 'Tipo de serviço rural inválido',
    }),
    customServiceType: z.string().optional().nullable(),
    status: z.enum(DEMAND_STATUSES).default('SOLICITADO'),
    priority: z.enum(DEMAND_PRIORITIES).default('MEDIA'),
    description: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    requestDate: z.coerce.date().default(() => new Date()),
    startDate: z.coerce.date().optional().nullable(),
    estimatedDeliveryDate: z.coerce.date().optional().nullable(),
    completionDate: z.coerce.date().optional().nullable(),
    checklist: z.array(demandChecklistItemSchema).optional().default([]),
  })
  .refine(
    (data) => {
      if (data.serviceType === 'OUTROS' && (!data.customServiceType || data.customServiceType.trim().length === 0)) {
        return false
      }
      return true
    },
    {
      message: 'Especifique o tipo de serviço quando a opção for "Outros"',
      path: ['customServiceType'],
    }
  )
  .refine(
    (data) => {
      if (data.requestDate && data.estimatedDeliveryDate) {
        const req = new Date(data.requestDate).setHours(0, 0, 0, 0)
        const est = new Date(data.estimatedDeliveryDate).setHours(0, 0, 0, 0)
        return est >= req
      }
      return true
    },
    {
      message: 'O prazo estimado de entrega não pode ser anterior à data de solicitação',
      path: ['estimatedDeliveryDate'],
    }
  )

export const updateDemandSchema = z
  .object({
    propertyId: z.string().optional().nullable(),
    assignedToId: z.string().optional().nullable(),
    assigneeId: z.string().optional().nullable(),
    responsibleName: z.string().optional().nullable(),
    proposalId: z.string().optional().nullable(),
    documentId: z.string().optional().nullable(),
    serviceType: z.enum(RURAL_SERVICE_TYPES).optional(),
    customServiceType: z.string().optional().nullable(),
    status: z.enum(DEMAND_STATUSES).optional(),
    priority: z.enum(DEMAND_PRIORITIES).optional(),
    description: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    requestDate: z.coerce.date().optional(),
    startDate: z.coerce.date().optional().nullable(),
    estimatedDeliveryDate: z.coerce.date().optional().nullable(),
    completionDate: z.coerce.date().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.requestDate && data.estimatedDeliveryDate) {
        const req = new Date(data.requestDate).setHours(0, 0, 0, 0)
        const est = new Date(data.estimatedDeliveryDate).setHours(0, 0, 0, 0)
        return est >= req
      }
      return true
    },
    {
      message: 'O prazo estimado de entrega não pode ser anterior à data de solicitação',
      path: ['estimatedDeliveryDate'],
    }
  )

export const updateDemandStatusSchema = z.object({
  status: z.enum(DEMAND_STATUSES),
  notes: z.string().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  completionDate: z.coerce.date().optional().nullable(),
})

export const cancelDemandSchema = z.object({
  reason: z.string().min(3, 'O motivo do cancelamento é obrigatório e deve ter no mínimo 3 caracteres'),
})

export type CreateDemandInput = z.infer<typeof createDemandSchema>
export type UpdateDemandInput = z.infer<typeof updateDemandSchema>
export type UpdateDemandStatusInput = z.infer<typeof updateDemandStatusSchema>
export type CancelDemandInput = z.infer<typeof cancelDemandSchema>
export type DemandChecklistItemInput = z.infer<typeof demandChecklistItemSchema>
