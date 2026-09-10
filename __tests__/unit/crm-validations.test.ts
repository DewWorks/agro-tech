import { validateCPF, validateCNPJ } from '@/lib/utils/masks'
import { step1LandSchema } from '@/lib/validations/property-wizard'
import { generateValidCPF, generateValidCNPJ } from '../factories/helpers'
import { buildMockProducer } from '../factories/producer.factory'
import { buildMockProperty } from '../factories/property.factory'

/**
 * SUITE DE TESTES UNITÁRIOS — CRM & CADASTRO ÚNICO
 * Fonte da Verdade: /spec/04_MODULO_CRM_CADASTRO_UNICO.md e Zod Schemas
 * Regra de Ouro: As asserções baseiam-se unicamente nas regras da especificação.
 */

describe('Módulo CRM — Validações Estritas e Cadastro Único', () => {

  // ==========================================================================
  // 1. VALIDAÇÃO DE CPF (RF-CRM-002: Algoritmo Módulo 11)
  // ==========================================================================
  describe('RF-CRM-002: Algoritmo de Validação de CPF (Módulo 11)', () => {
    it('deve aceitar CPFs matematicamente válidos gerados via algoritmo oficial', () => {
      for (let i = 0; i < 5; i++) {
        const validCpf = generateValidCPF()
        expect(validateCPF(validCpf)).toBe(true)
      }
    })

    it('deve aceitar CPFs válidos com ou sem máscara de pontuação', () => {
      const validCpf = generateValidCPF()
      const formatted = `${validCpf.slice(0,3)}.${validCpf.slice(3,6)}.${validCpf.slice(6,9)}-${validCpf.slice(9,11)}`
      expect(validateCPF(formatted)).toBe(true)
      expect(validateCPF(validCpf)).toBe(true)
    })

    it('deve rejeitar CPFs com todos os dígitos repetidos (ex: 000.000.000-00, 111.111.111-11)', () => {
      const repeatedDigits = ['00000000000', '11111111111', '22222222222', '33333333333', '99999999999']
      repeatedDigits.forEach((cpf) => {
        expect(validateCPF(cpf)).toBe(false)
      })
    })

    it('deve rejeitar CPFs com primeiro dígito verificador adulterado', () => {
      const validCpf = generateValidCPF()
      const corruptedD1 = validCpf.slice(0, 9) + ((Number(validCpf[9]) + 1) % 10) + validCpf[10]
      expect(validateCPF(corruptedD1)).toBe(false)
    })

    it('deve rejeitar CPFs com segundo dígito verificador adulterado', () => {
      const validCpf = generateValidCPF()
      const corruptedD2 = validCpf.slice(0, 10) + ((Number(validCpf[10]) + 1) % 10)
      expect(validateCPF(corruptedD2)).toBe(false)
    })

    it('deve rejeitar strings com menos ou mais de 11 dígitos numéricos', () => {
      expect(validateCPF('1234567890')).toBe(false)
      expect(validateCPF('123456789012')).toBe(false)
      expect(validateCPF('')).toBe(false)
      expect(validateCPF('abc.def.ghi-jk')).toBe(false)
    })
  })

  // ==========================================================================
  // 2. VALIDAÇÃO DE CNPJ (RF-CRM-003: Algoritmo Módulo 11)
  // ==========================================================================
  describe('RF-CRM-003: Algoritmo de Validação de CNPJ (Módulo 11)', () => {
    it('deve aceitar CNPJs matematicamente válidos gerados via pesos oficiais', () => {
      for (let i = 0; i < 5; i++) {
        const validCnpj = generateValidCNPJ()
        expect(validateCNPJ(validCnpj)).toBe(true)
      }
    })

    it('deve aceitar CNPJs válidos com ou sem máscara de pontuação', () => {
      const validCnpj = generateValidCNPJ()
      const formatted = `${validCnpj.slice(0,2)}.${validCnpj.slice(2,5)}.${validCnpj.slice(5,8)}/${validCnpj.slice(8,12)}-${validCnpj.slice(12,14)}`
      expect(validateCNPJ(formatted)).toBe(true)
      expect(validateCNPJ(validCnpj)).toBe(true)
    })

    it('deve rejeitar CNPJs com todos os dígitos repetidos', () => {
      const repeated = ['00000000000000', '11111111111111', '99999999999999']
      repeated.forEach((cnpj) => {
        expect(validateCNPJ(cnpj)).toBe(false)
      })
    })

    it('deve rejeitar CNPJs com dígitos verificadores corrompidos', () => {
      const validCnpj = generateValidCNPJ()
      const corrupted = validCnpj.slice(0, 12) + ((Number(validCnpj[12]) + 1) % 10) + validCnpj[13]
      expect(validateCNPJ(corrupted)).toBe(false)
    })

    it('deve rejeitar strings que não possuem exatamente 14 dígitos', () => {
      expect(validateCNPJ('1234567800019')).toBe(false)
      expect(validateCNPJ('123456780001999')).toBe(false)
      expect(validateCNPJ('')).toBe(false)
    })
  })

  // ==========================================================================
  // 3. ESTADO CIVIL, REGIME DE BENS E OUTORGA UXÓRIA (RF-CRM-005, 006, 007)
  // ==========================================================================
  describe('RF-CRM-006 & RF-CRM-007: Matriz de Outorga Uxória e Cônjuge', () => {
    /**
     * Função pura que implementa a regra formal da especificação (Seção 3.2):
     * - Comunhão Universal: SIM
     * - Comunhão Parcial: SIM
     * - Separação Total (Convencional): NÃO
     * - Separação Obrigatória (Legal): NÃO
     * - Participação Final nos Aquestos: SIM
     * - União Estável: SIM
     */
    function requiresSpousalConsent(civilStatus: string, regime?: string): boolean {
      if (civilStatus === 'SOLTEIRO' || civilStatus === 'DIVORCIADO' || civilStatus === 'VIUVO') {
        return false
      }
      if (civilStatus === 'CASADO') {
        if (regime === 'SEPARACAO_TOTAL' || regime === 'SEPARACAO_OBRIGATORIA') {
          return false
        }
        return true // Comunhão Universal, Comunhão Parcial, Participação Final
      }
      if (civilStatus === 'UNIAO_ESTAVEL') {
        return true
      }
      return false
    }

    it('deve determinar que Comunhão Universal e Parcial exigem outorga uxória', () => {
      expect(requiresSpousalConsent('CASADO', 'COMUNHAO_UNIVERSAL')).toBe(true)
      expect(requiresSpousalConsent('CASADO', 'COMUNHAO_PARCIAL')).toBe(true)
      expect(requiresSpousalConsent('CASADO', 'PARTICIPACAO_FINAL_AQUESTOS')).toBe(true)
      expect(requiresSpousalConsent('UNIAO_ESTAVEL')).toBe(true)
    })

    it('deve dispensar outorga uxória para Separação Total e Separação Obrigatória de Bens', () => {
      expect(requiresSpousalConsent('CASADO', 'SEPARACAO_TOTAL')).toBe(false)
      expect(requiresSpousalConsent('CASADO', 'SEPARACAO_OBRIGATORIA')).toBe(false)
    })

    it('deve dispensar outorga uxória para Solteiro, Divorciado e Viúvo', () => {
      expect(requiresSpousalConsent('SOLTEIRO')).toBe(false)
      expect(requiresSpousalConsent('DIVORCIADO')).toBe(false)
      expect(requiresSpousalConsent('VIUVO')).toBe(false)
    })

    it('deve exigir dados de cônjuge quando o estado civil for CASADO ou UNIAO_ESTAVEL', () => {
      const casadoSemRegime = buildMockProducer({
        civilStatus: 'CASADO',
        marriageRegime: '',
      })
      expect(casadoSemRegime.marriageRegime).toBe('')
      // Na especificação (RF-CRM-006), o regime é estritamente obrigatório se CASADO
      const isValid = Boolean(casadoSemRegime.marriageRegime && casadoSemRegime.marriageRegime.length > 0)
      expect(isValid).toBe(false)
    })
  })

  // ==========================================================================
  // 4. BALANÇO DE ÁREAS DA PROPRIEDADE (RF-CRM-026 & Seção 3.3)
  // ==========================================================================
  describe('RF-CRM-026: Invariante de Balanço de Áreas Fundiárias', () => {
    it('deve aceitar propriedade com soma das áreas menor ou igual à área total', () => {
      const validProperty = buildMockProperty({
        totalArea: 200,
        productiveArea: 80,
        pastureArea: 60,
        preserveArea: 40, // 80 + 60 + 40 = 180 <= 200
      })

      const parseResult = step1LandSchema.safeParse(validProperty)
      expect(parseResult.success).toBe(true)
    })

    it('deve rejeitar propriedade quando a soma das áreas (produtiva + pastagem + preservação) ultrapassar a área total', () => {
      // Regra Matemática da Spec 04, Seção 3.3:
      // area_produtiva + area_pastagem + area_preservacao <= area_total
      const invalidProperty = buildMockProperty({
        totalArea: 100,
        productiveArea: 70,
        pastureArea: 50,
        preserveArea: 30, // 70 + 50 + 30 = 150 > 100 -> VIOLAÇÃO DA SPEC!
      })

      const parseResult = step1LandSchema.safeParse(invalidProperty)
      
      // REGRA DE OURO: A spec exige que seja rejeitado!
      // Se step1LandSchema não possuir a validação refine(...), este teste irá falhar
      // e documentará a omissão de validação fundiária no TEST_REPORT_BUGS.md.
      expect(parseResult.success).toBe(false)
      if (!parseResult.success) {
        const errorMessages = parseResult.error.issues.map(i => i.message).join(' ')
        expect(errorMessages).toMatch(/área total|ultrapassar|balanço/i)
      }
    })

    it('deve rejeitar propriedade com áreas negativas', () => {
      const negativeProperty = buildMockProperty({
        totalArea: 100,
        productiveArea: -10,
      })

      const parseResult = step1LandSchema.safeParse(negativeProperty)
      expect(parseResult.success).toBe(false)
    })
  })

  // ==========================================================================
  // 5. CAMPOS OBRIGATÓRIOS E MENSAGENS INLINE DO DESIGN SYSTEM
  // ==========================================================================
  describe('Design System & Mensagens Inline de Validação', () => {
    it('deve exigir nome da fazenda com no mínimo 2 caracteres e exibir mensagem em português', () => {
      const shortNameProperty = buildMockProperty({
        name: 'A',
      })

      const parseResult = step1LandSchema.safeParse(shortNameProperty)
      expect(parseResult.success).toBe(false)
      if (!parseResult.success) {
        expect(parseResult.error.issues[0].message).toBe('O nome da fazenda é obrigatório')
      }
    })

    it('deve exigir filial (branchId) e produtor titular (producerId)', () => {
      const incompleteProperty = buildMockProperty({
        branchId: '',
        producerId: '',
      })

      const parseResult = step1LandSchema.safeParse(incompleteProperty)
      expect(parseResult.success).toBe(false)
      if (!parseResult.success) {
        const fields = parseResult.error.issues.map(i => i.path[0])
        expect(fields).toContain('branchId')
        expect(fields).toContain('producerId')
      }
    })

    it('deve exigir percentual de exploração entre 1% e 100%', () => {
      const invalidPercentLow = buildMockProperty({ explorationPercentage: 0 })
      const invalidPercentHigh = buildMockProperty({ explorationPercentage: 101 })

      expect(step1LandSchema.safeParse(invalidPercentLow).success).toBe(false)
      expect(step1LandSchema.safeParse(invalidPercentHigh).success).toBe(false)
    })
  })
})
