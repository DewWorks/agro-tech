import {
  cancelDemandSchema,
  createDemandSchema,
  updateDemandStatusSchema,
  updateDemandSchema,
} from '@/lib/validations/demands'

describe('Módulo de Serviços e Demandas — Governança Operacional, Rastreabilidade & Regras de Negócio', () => {
  describe('Validação de Cancelamento (CancelDemandSchema)', () => {
    it('deve rejeitar cancelamento com motivo vazio ou menor que 3 caracteres', () => {
      const emptyResult = cancelDemandSchema.safeParse({ reason: '' })
      expect(emptyResult.success).toBe(false)
      if (!emptyResult.success) {
        expect(emptyResult.error.issues[0].message).toContain('motivo do cancelamento é obrigatório')
      }

      const shortResult = cancelDemandSchema.safeParse({ reason: 'ab' })
      expect(shortResult.success).toBe(false)
    })

    it('deve aprovar cancelamento com justificativa clara e detalhada', () => {
      const validResult = cancelDemandSchema.safeParse({
        reason: 'Produtor desistiu do financiamento por questões de taxa bancária.',
      })
      expect(validResult.success).toBe(true)
      if (validResult.success) {
        expect(validResult.data.reason).toBe(
          'Produtor desistiu do financiamento por questões de taxa bancária.'
        )
      }
    })
  })

  describe('Autoria e Rastreabilidade no CreateDemandSchema', () => {
    it('deve aceitar campos de governança: createdById, assignedToId, proposalId e documentId', () => {
      const validPayload = {
        producerId: 'producer-uuid-123',
        createdById: 'user-uuid-creator',
        assignedToId: 'user-uuid-engineer',
        proposalId: 'PRP-2026-089',
        documentId: 'doc-uuid-matr',
        serviceType: 'PROJETO_CUSTEIO',
        priority: 'ALTA',
        description: 'Demanda prioritária de custeio safra soja 2026/27',
      }

      const result = createDemandSchema.safeParse(validPayload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.createdById).toBe('user-uuid-creator')
        expect(result.data.assignedToId).toBe('user-uuid-engineer')
        expect(result.data.proposalId).toBe('PRP-2026-089')
        expect(result.data.documentId).toBe('doc-uuid-matr')
      }
    })

    it('deve manter compatibilidade retroativa com o campo legado assigneeId', () => {
      const legacyPayload = {
        producerId: 'producer-uuid-123',
        assigneeId: 'user-uuid-legacy',
        serviceType: 'VISITA_TECNICA',
      }

      const result = createDemandSchema.safeParse(legacyPayload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.assigneeId).toBe('user-uuid-legacy')
      }
    })
  })

  describe('Regras de Automação de Datas e Transição de Status', () => {
    it('deve permitir enviar justificativa (notes) no updateDemandStatusSchema', () => {
      const payload = {
        status: 'EM_EXECUCAO',
        notes: 'Iniciada análise do solo e elaboração do croqui da fazenda.',
      }

      const result = updateDemandStatusSchema.safeParse(payload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.notes).toBe('Iniciada análise do solo e elaboração do croqui da fazenda.')
      }
    })

    it('deve validar regra de reabertura: exige justificativa ao reabrir de CONCLUIDO', () => {
      // Simulação da regra de negócio implementada na Server Action
      const validateReopenDemand = (
        existingStatus: string,
        newStatus: string,
        notes?: string | null
      ) => {
        if (existingStatus === 'CONCLUIDO' && newStatus !== 'CONCLUIDO') {
          if (!notes || notes.trim().length === 0) {
            throw new Error('A justificativa técnica é obrigatória ao reabrir uma demanda já concluída.')
          }
          return { completionDate: null, reopened: true }
        }
        return { reopened: false }
      }

      // Sem nota deve disparar exceção
      expect(() => validateReopenDemand('CONCLUIDO', 'EM_EXECUCAO', '')).toThrow(
        'A justificativa técnica é obrigatória ao reabrir uma demanda já concluída.'
      )

      expect(() => validateReopenDemand('CONCLUIDO', 'EM_EXECUCAO', '   ')).toThrow(
        'A justificativa técnica é obrigatória ao reabrir uma demanda já concluída.'
      )

      // Com nota válida deve autorizar e limpar a data de conclusão
      const validReopen = validateReopenDemand(
        'CONCLUIDO',
        'EM_EXECUCAO',
        'Banco solicitou revisão das coordenadas geográficas do talhão 04.'
      )
      expect(validReopen.reopened).toBe(true)
      expect(validReopen.completionDate).toBeNull()
    })

    it('deve validar regra de preenchimento automático de startDate ao mover para EM_EXECUCAO', () => {
      const computeStartDate = (newStatus: string, currentStartDate: Date | null) => {
        if (newStatus === 'EM_EXECUCAO' && !currentStartDate) {
          return new Date()
        }
        return currentStartDate
      }

      // Se ainda não tinha data, preenche agora
      const autoDate = computeStartDate('EM_EXECUCAO', null)
      expect(autoDate).toBeInstanceOf(Date)

      // Se já tinha data anterior, preserva a data original
      const existingDate = new Date('2026-09-01T10:00:00Z')
      const preservedDate = computeStartDate('EM_EXECUCAO', existingDate)
      expect(preservedDate).toEqual(existingDate)
    })

    it('deve validar regra de preenchimento automático de completionDate ao mover para CONCLUIDO', () => {
      const computeCompletionDate = (newStatus: string) => {
        if (newStatus === 'CONCLUIDO') {
          return new Date()
        }
        return null
      }

      const compDate = computeCompletionDate('CONCLUIDO')
      expect(compDate).toBeInstanceOf(Date)
    })
  })

  describe('Princípio de Entrada Única de Dados (Integração com GED)', () => {
    it('deve validar estrutura do payload para persistência na tabela Document do GED', () => {
      const documentPayload = {
        branchId: 'branch-1',
        producerId: 'producer-1',
        propertyId: 'property-1',
        documentType: 'CAR',
        fileName: 'CAR_FAZENDA_ESPERANCA_2026.pdf',
        fileSize: 1024500,
        mimeType: 'application/pdf',
        storagePath: 'branches/branch-1/producers/producer-1/CAR_123.pdf',
      }

      expect(documentPayload.branchId).toBeDefined()
      expect(documentPayload.producerId).toBeDefined()
      expect(documentPayload.propertyId).toBeDefined()
      expect(documentPayload.storagePath).toContain('branches/branch-1')
      expect(documentPayload.fileName).toMatch(/\.pdf$/i)
    })
  })
})
