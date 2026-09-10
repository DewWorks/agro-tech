import { faker } from '@faker-js/faker'

export interface MockDocumentInput {
  id?: string
  branchId?: string
  producerId?: string
  propertyId?: string
  documentType?: string
  fileName?: string
  filePath?: string
  fileSizeBytes?: number
  mimeType?: string
  issueDate?: Date
  expiryDate?: Date | null
  cropYear?: string
  isInherited?: boolean
  inheritedFromId?: string | null
  validityStatus?: 'VALIDO' | 'ALERTA' | 'VENCIDO' | 'INDEFINIDO'
}

export function buildMockDocument(overrides: Partial<MockDocumentInput> = {}): MockDocumentInput {
  return {
    id: overrides.id || faker.string.uuid(),
    branchId: overrides.branchId || faker.string.uuid(),
    producerId: overrides.producerId || faker.string.uuid(),
    propertyId: overrides.propertyId || faker.string.uuid(),
    documentType: overrides.documentType || 'MATRICULA',
    fileName: overrides.fileName || 'matricula_atualizada.pdf',
    filePath: overrides.filePath || `${faker.string.uuid()}/matricula_20260101_v1.pdf`,
    fileSizeBytes: overrides.fileSizeBytes ?? 1024 * 1024 * 2, // 2MB
    mimeType: overrides.mimeType || 'application/pdf',
    issueDate: overrides.issueDate || new Date('2026-01-15'),
    expiryDate: overrides.expiryDate !== undefined ? overrides.expiryDate : new Date('2026-12-31'),
    cropYear: overrides.cropYear || '2026/2027',
    isInherited: overrides.isInherited ?? false,
    inheritedFromId: overrides.inheritedFromId || null,
    validityStatus: overrides.validityStatus || 'VALIDO',
    ...overrides,
  }
}
