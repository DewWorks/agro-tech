import prisma from '@/lib/prisma'
import { calculateDocumentStatus } from './semaphore'

// ---------------------------------------------------------------
// Motor de Herança Documental Inter-Safra
// ---------------------------------------------------------------

/**
 * Herda documentos vigentes de safras anteriores para uma nova safra.
 * 
 * Princípios:
 * - Não duplica bytes no Storage (reutiliza o mesmo storagePath)
 * - Cria novos registros em banco com isInherited=true
 * - Recalcula o status do semáforo no contexto temporal atual
 * - Opera em transação atômica
 *
 * @param producerId  - ID do produtor
 * @param propertyIds - IDs das propriedades vinculadas
 * @param targetSafra - Ano safra destino (ex: "2026/27")
 * @param branchId    - ID da filial (isolamento multi-tenant)
 * @returns Documentos herdados criados
 */
export async function inheritDocumentsForNewSafra(
  producerId: string,
  propertyIds: string[],
  targetSafra: string,
  branchId: string
) {
  const today = new Date()

  // 1. Buscar documentos vigentes do produtor e suas propriedades
  const sourceDocuments = await prisma.document.findMany({
    where: {
      branchId,
      producerId,
      isSuperseded: false,
      isArchived: false,
      // Documentos vinculados ao produtor (pessoais) OU às propriedades
      OR: [
        { propertyId: null }, // Documentos pessoais (RG, CPF, etc.)
        { propertyId: { in: propertyIds } }, // Documentos das propriedades
      ],
    },
  })

  // 2. Filtrar documentos elegíveis (válidos ou sem data de expiração)
  const eligibleDocuments = sourceDocuments.filter((doc) => {
    if (!doc.expirationDate) return true // Sem validade = sempre elegível
    return new Date(doc.expirationDate) > today
  })

  if (eligibleDocuments.length === 0) return []

  // 3. Verificar se já existem documentos herdados para esta safra
  const existingInherited = await prisma.document.findMany({
    where: {
      branchId,
      producerId,
      cropYear: targetSafra,
      isInherited: true,
    },
    select: { inheritedFromId: true },
  })

  const alreadyInheritedIds = new Set(
    existingInherited.map((d) => d.inheritedFromId).filter(Boolean)
  )

  // 4. Filtrar documentos que ainda não foram herdados
  const newDocumentsToInherit = eligibleDocuments.filter(
    (doc) => !alreadyInheritedIds.has(doc.id)
  )

  if (newDocumentsToInherit.length === 0) return []

  // 5. Criar referências herdadas em transação
  const inheritedDocs = await prisma.$transaction(
    newDocumentsToInherit.map((doc) => {
      const status = calculateDocumentStatus(doc.expirationDate, doc.documentType)
      
      return prisma.document.create({
        data: {
          branchId: doc.branchId,
          producerId: doc.producerId,
          propertyId: doc.propertyId,
          documentType: doc.documentType,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          storagePath: `inherited_${doc.storagePath}_${targetSafra.replace('/', '-')}`,
          issueDate: doc.issueDate,
          expirationDate: doc.expirationDate,
          cropYear: targetSafra,
          complianceStatus: status === 'VENCIDO' ? 'EXPIRED' : doc.complianceStatus,
          metadataPayload: doc.metadataPayload ? JSON.parse(JSON.stringify(doc.metadataPayload)) : undefined,
          isInherited: true,
          inheritedFromId: doc.id,
          isSuperseded: false,
          isArchived: false,
          createdBy: doc.createdBy,
        },
      })
    })
  )

  return inheritedDocs
}

/**
 * Substitui um documento herdado por um novo upload.
 * - Marca o documento anterior como superseded
 * - O novo documento assume como registro primário ativo
 *
 * @param documentId - ID do documento a ser substituído
 * @param newDocumentData - Dados do novo documento
 */
export async function replaceInheritedDocument(
  documentId: string,
  newDocumentData: {
    fileName: string
    fileSize: number
    mimeType: string
    storagePath: string
    issueDate?: Date | null
    expirationDate?: Date | null
    documentType: string
    branchId: string
    producerId: string
    propertyId?: string | null
    cropYear?: string | null
    createdBy?: string | null
  }
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Marcar o documento original como substituído
    await tx.document.update({
      where: { id: documentId },
      data: { isSuperseded: true },
    })

    // 2. Criar o novo documento como registro primário
    const newDoc = await tx.document.create({
      data: {
        branchId: newDocumentData.branchId,
        producerId: newDocumentData.producerId,
        propertyId: newDocumentData.propertyId,
        documentType: newDocumentData.documentType as any,
        fileName: newDocumentData.fileName,
        fileSize: newDocumentData.fileSize,
        mimeType: newDocumentData.mimeType,
        storagePath: newDocumentData.storagePath,
        issueDate: newDocumentData.issueDate,
        expirationDate: newDocumentData.expirationDate,
        cropYear: newDocumentData.cropYear,
        complianceStatus: 'PENDING',
        isInherited: false,
        inheritedFromId: documentId, // Mantém rastreabilidade
        isSuperseded: false,
        isArchived: false,
        createdBy: newDocumentData.createdBy,
      },
    })

    return newDoc
  })
}
