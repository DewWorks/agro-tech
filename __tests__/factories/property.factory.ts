import { faker } from '@faker-js/faker'

export interface MockPropertyInput {
  id?: string
  branchId?: string
  producerId?: string
  name?: string
  ownershipType?: 'PROPRIETARIO' | 'ARRENDATARIO' | 'POSSEIRO' | 'COMODATARIO' | 'CONDOMINO'
  explorationPercentage?: number
  registrationNumber?: string
  registryOffice?: string
  comarca?: string
  car?: string
  ccir?: string
  itr?: string
  totalArea?: number
  productiveArea?: number
  pastureArea?: number
  preserveArea?: number
  city?: string
  state?: string
  vtnPerHectare?: number
  totalLandValue?: number
}

export function buildMockProperty(overrides: Partial<MockPropertyInput> = {}): MockPropertyInput {
  const totalArea = overrides.totalArea ?? 250
  const productiveArea = overrides.productiveArea ?? 100
  const pastureArea = overrides.pastureArea ?? 80
  const preserveArea = overrides.preserveArea ?? 50
  const vtnPerHectare = overrides.vtnPerHectare ?? 10000

  return {
    id: overrides.id || faker.string.uuid(),
    branchId: overrides.branchId || faker.string.uuid(),
    producerId: overrides.producerId || faker.string.uuid(),
    name: overrides.name || `Fazenda ${faker.location.city()}`,
    ownershipType: overrides.ownershipType || 'PROPRIETARIO',
    explorationPercentage: overrides.explorationPercentage ?? 100,
    registrationNumber: overrides.registrationNumber || faker.string.numeric(5),
    registryOffice: overrides.registryOffice || '1º Ofício de Registro de Imóveis',
    comarca: overrides.comarca || 'Taguatinga',
    car: overrides.car || `TO-${faker.string.numeric(7)}-${faker.string.alphanumeric(10).toUpperCase()}`,
    ccir: overrides.ccir || faker.string.numeric(13),
    itr: overrides.itr || faker.string.numeric(8),
    totalArea,
    productiveArea,
    pastureArea,
    preserveArea,
    city: overrides.city || 'Taguatinga',
    state: overrides.state || 'TO',
    vtnPerHectare,
    totalLandValue: overrides.totalLandValue ?? (totalArea * vtnPerHectare),
    ...overrides,
  }
}
