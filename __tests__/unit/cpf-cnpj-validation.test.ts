import { 
  validateCPF, 
  validateCNPJ, 
  formatCPF, 
  formatCNPJ, 
  getDocumentTypeAndLabel 
} from '@/lib/utils/masks'

describe('Identificação Dinâmica CPF vs CNPJ e Validação de Representante Legal', () => {
  describe('Função getDocumentTypeAndLabel', () => {
    it('deve identificar CPF quando documento possui 11 dígitos', () => {
      const result = getDocumentTypeAndLabel('52998224725')
      expect(result.isCnpj).toBe(false)
      expect(result.label).toBe('CPF')
      expect(result.digits).toBe('52998224725')
      expect(result.formatted).toBe('529.982.247-25')
    })

    it('deve identificar CNPJ quando documento possui 14 dígitos (ex: foto do usuário)', () => {
      const result = getDocumentTypeAndLabel('54399111000141')
      expect(result.isCnpj).toBe(true)
      expect(result.label).toBe('CNPJ')
      expect(result.digits).toBe('54399111000141')
      expect(result.formatted).toBe('54.399.111/0001-41')
    })

    it('deve priorizar type="PJ" mesmo se documento não tiver 14 dígitos ainda', () => {
      const result = getDocumentTypeAndLabel('54399111', 'PJ')
      expect(result.isCnpj).toBe(true)
      expect(result.label).toBe('CNPJ')
    })

    it('deve tratar valores nulos ou vazios sem quebrar', () => {
      const result = getDocumentTypeAndLabel(null, null)
      expect(result.isCnpj).toBe(false)
      expect(result.label).toBe('CPF')
      expect(result.formatted).toBe('')
      expect(result.digits).toBe('')
    })
  })

  describe('Validação Matemática de CPF do Representante Legal', () => {
    it('deve validar CPFs matematicamente válidos', () => {
      // CPFs válidos com dígitos verificadores matemáticos corretos
      expect(validateCPF('52998224725')).toBe(true)
      expect(validateCPF('529.982.247-25')).toBe(true)
    })

    it('deve rejeitar CPFs falsos, repetidos ou com dígitos verificadores inválidos', () => {
      expect(validateCPF('111.111.111-11')).toBe(false)
      expect(validateCPF('000.000.000-00')).toBe(false)
      expect(validateCPF('123.456.789-00')).toBe(false)
      expect(validateCPF('')).toBe(false)
      expect(validateCPF('123')).toBe(false)
    })
  })
})
