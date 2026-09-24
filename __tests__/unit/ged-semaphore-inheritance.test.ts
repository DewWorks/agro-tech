import {
  calculateDocumentStatus,
  ALERT_WINDOWS,
  DOCUMENT_TYPE_LABELS,
} from '@/lib/ged/semaphore'
import { addDays, subDays } from 'date-fns'

describe('GED - Semaphore and Type Labels Audit Tests', () => {
  const today = new Date()

  describe('Semáforo Visual - Calibração de Janelas Normativas', () => {
    it('deve retornar INDEFINIDO para documentos sem validade (null ou undefined)', () => {
      expect(calculateDocumentStatus(null, 'RG_CPF')).toBe('INDEFINIDO')
      expect(calculateDocumentStatus(undefined, 'COMPROVANTE_RESIDENCIA')).toBe('INDEFINIDO')
    })

    it('deve retornar VENCIDO para documentos com dias restantes <= 0', () => {
      const yesterday = subDays(today, 1)
      expect(calculateDocumentStatus(yesterday, 'MATRICULA')).toBe('VENCIDO')
      expect(calculateDocumentStatus(today, 'CAR')).toBe('VENCIDO')
    })

    it('Matrícula de Imóvel: ALERTA <= 7 dias, VALIDO > 7 dias', () => {
      expect(calculateDocumentStatus(addDays(today, 7), 'MATRICULA')).toBe('ALERTA')
      expect(calculateDocumentStatus(addDays(today, 8), 'MATRICULA')).toBe('VALIDO')
    })

    it('CND IBAMA: ALERTA <= 15 dias, VALIDO > 15 dias', () => {
      expect(calculateDocumentStatus(addDays(today, 15), 'CND_IBAMA')).toBe('ALERTA')
      expect(calculateDocumentStatus(addDays(today, 16), 'CND_IBAMA')).toBe('VALIDO')
    })

    it('CND Federal / PGFN: ALERTA <= 30 dias, VALIDO > 30 dias', () => {
      expect(calculateDocumentStatus(addDays(today, 30), 'CND_FEDERAL')).toBe('ALERTA')
      expect(calculateDocumentStatus(addDays(today, 31), 'CND_FEDERAL')).toBe('VALIDO')
    })

    it('Certidões Imobiliárias (Inteiro Teor e Ônus Reais): ALERTA <= 30 dias', () => {
      expect(calculateDocumentStatus(addDays(today, 30), 'CERTIDAO_INTEIRO_TEOR')).toBe('ALERTA')
      expect(calculateDocumentStatus(addDays(today, 31), 'CERTIDAO_INTEIRO_TEOR')).toBe('VALIDO')
      expect(calculateDocumentStatus(addDays(today, 30), 'CERTIDAO_ONUS_REAIS')).toBe('ALERTA')
      expect(calculateDocumentStatus(addDays(today, 31), 'CERTIDAO_ONUS_REAIS')).toBe('VALIDO')
    })

    it('CND do Proprietário e Cônjuge: ALERTA <= 30 dias', () => {
      expect(calculateDocumentStatus(addDays(today, 30), 'CND_PROPRIETARIO')).toBe('ALERTA')
      expect(calculateDocumentStatus(addDays(today, 31), 'CND_PROPRIETARIO')).toBe('VALIDO')
      expect(calculateDocumentStatus(addDays(today, 30), 'CND_CONJUGE')).toBe('ALERTA')
      expect(calculateDocumentStatus(addDays(today, 31), 'CND_CONJUGE')).toBe('VALIDO')
    })

    it('Outorga de Água e Regra Geral (DEFAULT): ALERTA <= 60 dias, VALIDO > 60 dias', () => {
      expect(calculateDocumentStatus(addDays(today, 60), 'OUTORGA_AGUA')).toBe('ALERTA')
      expect(calculateDocumentStatus(addDays(today, 61), 'OUTORGA_AGUA')).toBe('VALIDO')
      expect(calculateDocumentStatus(addDays(today, 60), 'OUTROS')).toBe('ALERTA')
      expect(calculateDocumentStatus(addDays(today, 61), 'OUTROS')).toBe('VALIDO')
    })
  })

  describe('Dicionário de Categorias Documentais (37 tipos)', () => {
    const requiredTypes = [
      'MATRICULA', 'CAR', 'CCIR', 'ITR', 'RG_CPF', 'CERTIDAO_CASAMENTO',
      'CONTRATO_ARRENDAMENTO', 'OUTORGA_AGUA', 'CND_IBAMA', 'CND_FEDERAL',
      'DAP_CAF', 'LAUDO_TECNICO', 'OUTROS',
      // Pessoais
      'AUTORIZACAO_COMPARTILHAMENTO', 'AUTORIZACAO_SCR', 'AUTORIZACAO_SICOR',
      'CPF_RG_PROPRIETARIO', 'CPF_RG_CONJUGE', 'CND_PROPRIETARIO',
      'CND_CONJUGE', 'COMPROVANTE_RESIDENCIA', 'IMPOSTO_RENDA',
      // Propriedade
      'CERTIDAO_INTEIRO_TEOR', 'CERTIDAO_CADEIA_DOMINIAL', 'CERTIDAO_ONUS_REAIS',
      'TITULO_DOMINIO', 'ESCRITURA_COMPRA_VENDA', 'ESCRITURA_DOACAO',
      'ESCRITURA_PERMUTA', 'ESCRITURA_CESSAO_HEREDITARIO', 'ESCRITURA_INVENTARIO',
      'INSCRICAO_ESTADUAL', 'CONTRATO_CESSAO_USO',
      // Ambientais
      'OUTORGA_AGUA_DUI', 'LICENCA_AMBIENTAL_OPERACAO',
      'LICENCA_AMBIENTAL_INSTALACAO', 'LICENCA_AMBIENTAL_AEF'
    ]

    it('deve conter todos os 37 tipos documentais mapeados com rótulos amigáveis', () => {
      expect(Object.keys(DOCUMENT_TYPE_LABELS).length).toBe(37)
      for (const type of requiredTypes) {
        expect(DOCUMENT_TYPE_LABELS[type]).toBeDefined()
        expect(DOCUMENT_TYPE_LABELS[type].length).toBeGreaterThan(0)
      }
    })
  })
})
