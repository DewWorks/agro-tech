import {
  RURAL_SERVICE_TYPES,
  DEMAND_STATUSES,
  RURAL_SERVICES_CATALOG,
  DEMAND_STATUS_METAS,
  createDemandSchema,
  updateDemandSchema,
  updateDemandStatusSchema,
  calculateSlaInfo,
} from '@/lib/validations/demands'

describe('Módulo de Serviços e Demandas — Regras de Negócio e Validações', () => {
  describe('Catálogo dos 10 Tipos de Serviços Rurais Oficiais', () => {
    it('deve conter exatamente os 10 serviços rurais oficiais solicitados pelo cliente mais a opção OUTROS', () => {
      expect(RURAL_SERVICE_TYPES).toHaveLength(11)
      expect(RURAL_SERVICE_TYPES).toContain('PROJETO_CUSTEIO')
      expect(RURAL_SERVICE_TYPES).toContain('PROJETO_INVESTIMENTO')
      expect(RURAL_SERVICE_TYPES).toContain('LIMITE_CREDITO')
      expect(RURAL_SERVICE_TYPES).toContain('PRORROGACAO_DIVIDAS')
      expect(RURAL_SERVICE_TYPES).toContain('CADASTRO_AMBIENTAL_RURAL')
      expect(RURAL_SERVICE_TYPES).toContain('LEVANTAMENTO_TOPOGRAFICO')
      expect(RURAL_SERVICE_TYPES).toContain('LAUDO_TECNICO')
      expect(RURAL_SERVICE_TYPES).toContain('ORCAMENTO_SERVICOS')
      expect(RURAL_SERVICE_TYPES).toContain('VISITA_TECNICA')
      expect(RURAL_SERVICE_TYPES).toContain('OUTORGA_LICENCA_AMBIENTAL')
      expect(RURAL_SERVICE_TYPES).toContain('OUTROS')
    })

    it('cada serviço rural deve possuir metadados completos com rótulo, descrição e documentos sugeridos', () => {
      RURAL_SERVICE_TYPES.forEach((code) => {
        const meta = RURAL_SERVICES_CATALOG[code]
        expect(meta).toBeDefined()
        expect(meta.code).toBe(code)
        expect(meta.label).toBeTruthy()
        expect(meta.description).toBeTruthy()
        expect(meta.estimatedDaysDefault).toBeGreaterThan(0)
        expect(Array.isArray(meta.defaultDocuments)).toBe(true)
      })
    })

    it('deve sugerir documentos pertinentes para o Projeto de Custeio', () => {
      const custeio = RURAL_SERVICES_CATALOG.PROJETO_CUSTEIO
      expect(custeio.label).toBe('Projeto de Custeio')
      expect(custeio.defaultDocuments).toContain('Matrícula Atualizada (CRI)')
      expect(custeio.defaultDocuments).toContain('CAR - Cadastro Ambiental Rural')
      expect(custeio.defaultDocuments).toContain('DAP / CAF Ativo')
    })
  })

  describe('Fluxo Visual de Estados da Demanda', () => {
    it('deve conter os 4 estados canônicos do documento do cliente e o estado de cancelamento', () => {
      expect(DEMAND_STATUSES).toContain('SOLICITADO')
      expect(DEMAND_STATUSES).toContain('EM_EXECUCAO')
      expect(DEMAND_STATUSES).toContain('AGUARDANDO_DOCUMENTACAO')
      expect(DEMAND_STATUSES).toContain('CONCLUIDO')
      expect(DEMAND_STATUSES).toContain('CANCELADO')
    })

    it('cada estado deve possuir rótulo e configuração visual definidos', () => {
      expect(DEMAND_STATUS_METAS.SOLICITADO.label).toBe('Serviço Solicitado')
      expect(DEMAND_STATUS_METAS.EM_EXECUCAO.label).toBe('Em Execução')
      expect(DEMAND_STATUS_METAS.AGUARDANDO_DOCUMENTACAO.label).toBe('Aguardando Documentação')
      expect(DEMAND_STATUS_METAS.CONCLUIDO.label).toBe('Concluído')
      expect(DEMAND_STATUS_METAS.CANCELADO.label).toBe('Cancelado')
    })
  })

  describe('Validação de Schemas Zod (createDemandSchema)', () => {
    const validBaseDemand = {
      producerId: 'prod_123456',
      serviceType: 'PROJETO_CUSTEIO' as const,
      status: 'SOLICITADO' as const,
      priority: 'MEDIA' as const,
      description: 'Elaboração de projeto de custeio pecuário para safra 2026/2027.',
      requestDate: new Date('2026-09-22T10:00:00Z'),
      estimatedDeliveryDate: new Date('2026-10-07T10:00:00Z'), // 15 dias depois
    }

    it('deve validar com sucesso uma demanda com cliente obrigatório e propriedade opcional', () => {
      const parsedWithoutProperty = createDemandSchema.safeParse(validBaseDemand)
      expect(parsedWithoutProperty.success).toBe(true)

      const parsedWithProperty = createDemandSchema.safeParse({
        ...validBaseDemand,
        propertyId: 'prop_789',
        responsibleName: 'Lindomar Pereira',
      })
      expect(parsedWithProperty.success).toBe(true)
      if (parsedWithProperty.success) {
        expect(parsedWithProperty.data.propertyId).toBe('prop_789')
        expect(parsedWithProperty.data.responsibleName).toBe('Lindomar Pereira')
      }
    })

    it('deve rejeitar criação de demanda sem produtor vinculado', () => {
      const invalid = createDemandSchema.safeParse({
        ...validBaseDemand,
        producerId: '',
      })
      expect(invalid.success).toBe(false)
      if (!invalid.success) {
        expect(invalid.error.issues[0].message).toContain('Selecione o produtor rural')
      }
    })

    it('deve exigir preenchimento de customServiceType quando o serviço for OUTROS', () => {
      const invalidOutros = createDemandSchema.safeParse({
        ...validBaseDemand,
        serviceType: 'OUTROS',
        customServiceType: '',
      })
      expect(invalidOutros.success).toBe(false)
      if (!invalidOutros.success) {
        expect(invalidOutros.error.issues.some((i) => i.path.includes('customServiceType'))).toBe(true)
      }

      const validOutros = createDemandSchema.safeParse({
        ...validBaseDemand,
        serviceType: 'OUTROS',
        customServiceType: 'Consultoria de Manejo de Pastagem Rotacionada',
      })
      expect(validOutros.success).toBe(true)
    })

    it('invariante de prazo: deve rejeitar estimatedDeliveryDate anterior à requestDate', () => {
      const invalidDates = createDemandSchema.safeParse({
        ...validBaseDemand,
        requestDate: new Date('2026-09-22T10:00:00Z'),
        estimatedDeliveryDate: new Date('2026-09-15T10:00:00Z'), // 7 dias antes
      })
      expect(invalidDates.success).toBe(false)
      if (!invalidDates.success) {
        expect(invalidDates.error.issues.some((i) => i.path.includes('estimatedDeliveryDate'))).toBe(true)
      }
    })

    it('deve aceitar checklist de pendências documentais na criação', () => {
      const demandWithChecklist = createDemandSchema.safeParse({
        ...validBaseDemand,
        checklist: [
          { title: 'Matrícula Atualizada (CRI)', isRequired: true, isDelivered: true },
          { title: 'CAR Homologado', isRequired: true, isDelivered: false },
        ],
      })
      expect(demandWithChecklist.success).toBe(true)
      if (demandWithChecklist.success) {
        expect(demandWithChecklist.data.checklist).toHaveLength(2)
        expect(demandWithChecklist.data.checklist[0].isDelivered).toBe(true)
        expect(demandWithChecklist.data.checklist[1].isDelivered).toBe(false)
      }
    })
  })

  describe('Controle de Prazos e Cálculo de SLA (calculateSlaInfo)', () => {
    const referenceDate = new Date('2026-09-22T12:00:00Z')

    it('deve retornar Sem Prazo Definido quando estimatedDeliveryDate for nula', () => {
      const sla = calculateSlaInfo(null, null, 'SOLICITADO', referenceDate)
      expect(sla.status).toBe('NO_PRAZO')
      expect(sla.daysRemaining).toBeNull()
      expect(sla.label).toBe('Sem Prazo Definido')
    })

    it('deve classificar como NO_PRAZO quando faltarem mais de 3 dias para o vencimento', () => {
      // 10 dias no futuro
      const estimated = new Date('2026-10-02T12:00:00Z')
      const sla = calculateSlaInfo(estimated, null, 'EM_EXECUCAO', referenceDate)
      expect(sla.status).toBe('NO_PRAZO')
      expect(sla.daysRemaining).toBe(10)
      expect(sla.daysDelayed).toBe(0)
      expect(sla.label).toBe('Restam 10 dia(s)')
    })

    it('deve classificar como ALERTA quando restarem 3 dias ou menos', () => {
      // 2 dias no futuro
      const estimated = new Date('2026-09-24T12:00:00Z')
      const sla = calculateSlaInfo(estimated, null, 'AGUARDANDO_DOCUMENTACAO', referenceDate)
      expect(sla.status).toBe('ALERTA')
      expect(sla.daysRemaining).toBe(2)
      expect(sla.daysDelayed).toBe(0)
      expect(sla.label).toBe('Vence em 2 dia(s)')
    })

    it('deve classificar como ALERTA (Vence Hoje) quando a data estimada for hoje', () => {
      const estimated = new Date('2026-09-22T18:00:00Z')
      const sla = calculateSlaInfo(estimated, null, 'EM_EXECUCAO', referenceDate)
      expect(sla.status).toBe('ALERTA')
      expect(sla.daysRemaining).toBe(0)
      expect(sla.label).toBe('Vence Hoje')
    })

    it('deve classificar como ATRASADO quando a data estimada já tiver passado e não estiver concluído', () => {
      // 4 dias no passado
      const estimated = new Date('2026-09-18T12:00:00Z')
      const sla = calculateSlaInfo(estimated, null, 'EM_EXECUCAO', referenceDate)
      expect(sla.status).toBe('ATRASADO')
      expect(sla.daysRemaining).toBe(0)
      expect(sla.daysDelayed).toBe(4)
      expect(sla.label).toBe('Atrasado há 4 dia(s)')
    })

    it('deve classificar como CONCLUIDO_NO_PRAZO quando concluído antes ou na data estimada', () => {
      const estimated = new Date('2026-09-25T12:00:00Z')
      const completed = new Date('2026-09-23T12:00:00Z')
      const sla = calculateSlaInfo(estimated, completed, 'CONCLUIDO', referenceDate)
      expect(sla.status).toBe('CONCLUIDO_NO_PRAZO')
      expect(sla.daysDelayed).toBe(0)
      expect(sla.label).toBe('Concluído no Prazo')
    })

    it('deve classificar como CONCLUIDO_COM_ATRASO quando a data de conclusão excedeu o prazo estimado', () => {
      const estimated = new Date('2026-09-15T12:00:00Z')
      const completed = new Date('2026-09-20T12:00:00Z') // 5 dias após o prazo
      const sla = calculateSlaInfo(estimated, completed, 'CONCLUIDO', referenceDate)
      expect(sla.status).toBe('CONCLUIDO_COM_ATRASO')
      expect(sla.daysDelayed).toBe(5)
      expect(sla.label).toBe('Concluído com 5 dia(s) de atraso')
    })
  })

  describe('Validação de Transições de Estado (updateDemandStatusSchema)', () => {
    it('deve aceitar transições válidas entre os estados do fluxo', () => {
      expect(updateDemandStatusSchema.safeParse({ status: 'SOLICITADO' }).success).toBe(true)
      expect(updateDemandStatusSchema.safeParse({ status: 'EM_EXECUCAO' }).success).toBe(true)
      expect(updateDemandStatusSchema.safeParse({ status: 'AGUARDANDO_DOCUMENTACAO' }).success).toBe(true)
      expect(updateDemandStatusSchema.safeParse({ status: 'CONCLUIDO' }).success).toBe(true)
    })

    it('deve rejeitar status desconhecido', () => {
      const invalid = updateDemandStatusSchema.safeParse({ status: 'STATUS_INEXISTENTE' })
      expect(invalid.success).toBe(false)
    })
  })
})
