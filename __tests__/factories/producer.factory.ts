import { faker } from '@faker-js/faker'
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

  return {
    id: overrides.id || faker.string.uuid(),
    branchId: overrides.branchId || faker.string.uuid(),
    type,
    document: overrides.document || (type === 'PF' ? generateValidCPF() : generateValidCNPJ()),
    name: overrides.name || faker.person.fullName(),
    email: overrides.email || faker.internet.email(),
    phone: overrides.phone || '63999998888',
    civilStatus: overrides.civilStatus || 'SOLTEIRO',
    marriageRegime: overrides.marriageRegime !== undefined ? overrides.marriageRegime : (isCasado ? 'COMUNHAO_PARCIAL' : ''),
    spouseName: overrides.spouseName !== undefined ? overrides.spouseName : (isCasado ? faker.person.fullName() : ''),
    spouseCpf: overrides.spouseCpf !== undefined ? overrides.spouseCpf : (isCasado ? generateValidCPF() : ''),
    dapCafNumber: overrides.dapCafNumber || 'CAF-12345678',
    rg: overrides.rg || faker.string.numeric(7),
    rgIssuer: overrides.rgIssuer || 'SSP/TO',
    profession: overrides.profession || 'Produtor Rural',
    nationality: overrides.nationality || 'Brasileira',
    ...overrides,
  }
}
