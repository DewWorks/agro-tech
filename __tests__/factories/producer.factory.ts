import { generateValidCPF, generateValidCNPJ } from './helpers'

export interface MockProducerInput {
  id?: string
  branchId?: string
  type?: 'PF' | 'PJ'
  document?: string
  name?: string
  email?: string
  phone?: string
  civilStatus?: 'SOLTEIRO' | 'CASADO' | 'DIVORCIADO' | 'VIUVO' | 'UNIAO_ESTAVEL'
  marriageRegime?: 'COMUNHAO_PARCIAL' | 'COMUNHAO_UNIVERSAL' | 'SEPARACAO_TOTAL' | 'SEPARACAO_OBRIGATORIA' | 'PARTICIPACAO_FINAL_AQUESTOS' | ''
  spouseName?: string
  spouseCpf?: string
  dapCafNumber?: string
  rg?: string
  rgIssuer?: string
  profession?: string
  nationality?: string
}

export function buildMockProducer(overrides: Partial<MockProducerInput> = {}): MockProducerInput {
  const type = overrides.type || 'PF'
  const isCasado = overrides.civilStatus === 'CASADO' || overrides.civilStatus === 'UNIAO_ESTAVEL'
  const randId = Math.random().toString(36).substring(2, 11)

  return {
    id: overrides.id || `mock-id-${randId}`,
    branchId: overrides.branchId || `branch-${randId}`,
    type,
    document: overrides.document || (type === 'PF' ? generateValidCPF() : generateValidCNPJ()),
    name: overrides.name || `Produtor Rural ${randId}`,
    email: overrides.email || `produtor_${randId}@agrotech.com`,
    phone: overrides.phone || '63999998888',
    civilStatus: overrides.civilStatus || 'SOLTEIRO',
    marriageRegime: overrides.marriageRegime !== undefined ? overrides.marriageRegime : (isCasado ? 'COMUNHAO_PARCIAL' : ''),
    spouseName: overrides.spouseName !== undefined ? overrides.spouseName : (isCasado ? 'Cônjuge Teste' : ''),
    spouseCpf: overrides.spouseCpf !== undefined ? overrides.spouseCpf : (isCasado ? generateValidCPF() : ''),
    dapCafNumber: overrides.dapCafNumber || 'CAF-12345678',
    rg: overrides.rg || '1234567',
    rgIssuer: overrides.rgIssuer || 'SSP/TO',
    profession: overrides.profession || 'Produtor Rural',
    nationality: overrides.nationality || 'Brasileira',
    ...overrides,
  }
}
