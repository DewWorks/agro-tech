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
  const randId = Math.random().toString(36).substring(2, 11)

  return {
    id: overrides.id || `prop-${randId}`,
    branchId: overrides.branchId || `branch-${randId}`,
    producerId: overrides.producerId || `producer-${randId}`,
    name: overrides.name || `Fazenda Boa Esperança ${randId}`,
    ownershipType: overrides.ownershipType || 'PROPRIETARIO',
    explorationPercentage: overrides.explorationPercentage ?? 100,
    registrationNumber: overrides.registrationNumber || '12345',
    registryOffice: overrides.registryOffice || '1º Ofício de Registro de Imóveis',
    comarca: overrides.comarca || 'Taguatinga',
    car: overrides.car || `TO-1720903-ABCD1234EF`,
    ccir: overrides.ccir || '9999999999999',
    itr: overrides.itr || '88888888',
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
