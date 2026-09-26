'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { handleServerError } from '@/lib/errorHandler'
import { getUserContext } from '@/lib/auth'
import { DocumentType, Prisma } from '@prisma/client'
import {
  buildStoragePath,
  getUploadSignedUrl,
  getViewSignedUrl,
  getDownloadSignedUrl,
} from '@/lib/ged/storage'
import { isAllowedMimeType, validateFileSize as isWithinSizeLimit } from '@/lib/ged/utils'
import { calculateDocumentStatus } from '@/lib/ged/semaphore'

// ---------------------------------------------------------------
// Listar Documentos (com filtros)
// ---------------------------------------------------------------

export async function listDocuments(filters: {
  producerId?: string
  propertyId?: string
  documentType?: string
  statusFilter?: string // VALIDO | ALERTA | VENCIDO | INDEFINIDO
  search?: string
}) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) throw new Error('Não autenticado')

    const isSuperAdmin = dbUser.role === 'SUPER_ADMIN' || Boolean(dbUser.isSuperAdminImpersonating)
    if (!isSuperAdmin && !dbUser.organizationId) {
      throw new Error('Usuário sem organização')
    }

    const where: Prisma.DocumentWhereInput = {
      ...(dbUser.organizationId ? { branch: { organizationId: dbUser.organizationId } } : {}),
      isArchived: false,
      isSuperseded: false,
    }

    if (dbUser.role !== 'OWNER' && dbUser.role !== 'SUPER_ADMIN' && dbUser.branchId) {
      where.branchId = dbUser.branchId
    }

    if (filters.producerId) where.producerId = filters.producerId
    if (filters.propertyId) where.propertyId = filters.propertyId
    if (filters.documentType) where.documentType = filters.documentType as DocumentType
    if (filters.search) {
      where.fileName = { contains: filters.search, mode: 'insensitive' }
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        producer: { select: { id: true, name: true, document: true } },
        property: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Enriquecer com status do semáforo calculado em tempo real
    const enriched = documents.map((doc) => ({
      ...doc,
      fileSize: Number(doc.fileSize),
      calculatedStatus: calculateDocumentStatus(doc.expirationDate, doc.documentType),
    }))

    // Filtrar por status se solicitado
    if (filters.statusFilter && filters.statusFilter !== 'TODOS') {
      return { success: true, data: enriched.filter((d) => d.calculatedStatus === filters.statusFilter) }
    }

    return { success: true, data: enriched }
  } catch (error: unknown) {
    return { error: handleServerError(error, 'Documents - listDocuments') }
  }
}

// ---------------------------------------------------------------
// Listar Documentos de um Produtor (para aba Qualificação)
// ---------------------------------------------------------------

export async function listProducerDocuments(producerId: string) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) throw new Error('Não autenticado')

    const isSuperAdmin = dbUser.role === 'SUPER_ADMIN' || Boolean(dbUser.isSuperAdminImpersonating)
    if (!isSuperAdmin && !dbUser.organizationId) {
      throw new Error('Usuário sem organização')
    }

    const where: Prisma.DocumentWhereInput = {
      producerId,
      ...(dbUser.organizationId ? { branch: { organizationId: dbUser.organizationId } } : {}),
      isArchived: false,
      isSuperseded: false,
    }

    if (dbUser.role !== 'OWNER' && dbUser.role !== 'SUPER_ADMIN' && dbUser.branchId) {
      where.branchId = dbUser.branchId
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        property: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return {
      success: true,
      data: documents.map((doc) => ({
        ...doc,
        fileSize: Number(doc.fileSize),
        calculatedStatus: calculateDocumentStatus(doc.expirationDate, doc.documentType),
      })),
    }
  } catch (error: unknown) {
    return { error: handleServerError(error, 'Documents - listProducerDocuments') }
  }
}

// ---------------------------------------------------------------
// Obter Signed URL para Upload
// ---------------------------------------------------------------

export async function getSignedUrlForUpload(payload: {
  fileName: string
  mimeType: string
  fileSize: number
  producerId: string
  branchId: string
  propertyId?: string
  documentType: string
}) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) throw new Error('Não autenticado')

    if (dbUser.role !== 'SUPER_ADMIN') {
      const branch = await prisma.branch.findFirst({
        where: {
          id: payload.branchId,
          organizationId: dbUser.organizationId!,
        },
        select: { id: true },
      })
      if (!branch) {
        throw new Error('Filial não encontrada ou sem permissão de acesso.')
      }
      if (dbUser.role !== 'OWNER' && dbUser.branchId && payload.branchId !== dbUser.branchId) {
        throw new Error('Sem permissão para enviar documentos para outra filial.')
      }
    }

    // Validações
    if (!isAllowedMimeType(payload.mimeType)) {
      throw new Error('Tipo de arquivo não permitido. Aceitos: PDF, JPG, PNG, TIFF.')
    }
    if (!isWithinSizeLimit(payload.fileSize)) {
      throw new Error('O arquivo excede o limite de 25MB.')
    }

    const storagePath = buildStoragePath({
      branchId: payload.branchId,
      producerId: payload.producerId,
      propertyId: payload.propertyId,
      documentType: payload.documentType,
      fileName: payload.fileName,
      mimeType: payload.mimeType,
    })

    const { signedUrl, path } = await getUploadSignedUrl(storagePath)

    return { success: true, data: { signedUrl, storagePath: path } }
  } catch (error: unknown) {
    return { error: handleServerError(error, 'Documents - getSignedUrlForUpload') }
  }
}

// ---------------------------------------------------------------
// Criar Registro de Documento (após upload no Storage)
// ---------------------------------------------------------------

export async function createDocumentRecord(metadata: {
  branchId: string
  producerId: string
  propertyId?: string
  documentType: string
  fileName: string
  fileSize: number
  mimeType: string
  storagePath: string
  issueDate?: string | null
  expirationDate?: string | null
  cropYear?: string
}) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) throw new Error('Não autenticado')

    if (dbUser.role !== 'SUPER_ADMIN') {
      const branch = await prisma.branch.findFirst({
        where: {
          id: metadata.branchId,
          organizationId: dbUser.organizationId!,
        },
        select: { id: true },
      })
      if (!branch) {
        throw new Error('Filial não encontrada ou sem permissão de acesso.')
      }
      if (dbUser.role !== 'OWNER' && dbUser.branchId && metadata.branchId !== dbUser.branchId) {
        throw new Error('Sem permissão para registrar documentos em outra filial.')
      }
    }

    const doc = await prisma.document.create({
      data: {
        branchId: metadata.branchId,
        producerId: metadata.producerId,
        propertyId: metadata.propertyId || null,
        documentType: metadata.documentType as DocumentType,
        fileName: metadata.fileName,
        fileSize: metadata.fileSize,
        mimeType: metadata.mimeType,
        storagePath: metadata.storagePath,
        issueDate: metadata.issueDate ? new Date(metadata.issueDate) : null,
        expirationDate: metadata.expirationDate ? new Date(metadata.expirationDate) : null,
        cropYear: metadata.cropYear || null,
        complianceStatus: 'PENDING',
        createdBy: dbUser.id,
      },
    })

    revalidatePath('/admin/documents')
    revalidatePath(`/admin/crm/${metadata.producerId}/edit`)
    return { success: true, data: doc }
  } catch (error: unknown) {
    return { error: handleServerError(error, 'Documents - createDocumentRecord') }
  }
}

// ---------------------------------------------------------------
// Obter Signed URL para Visualização
// ---------------------------------------------------------------

export async function getSignedUrlForView(storagePath: string) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) throw new Error('Não autenticado')

    // Validar se o documento pertence à organização do usuário
    if (dbUser.role !== 'SUPER_ADMIN') {
      const doc = await prisma.document.findFirst({
        where: {
          storagePath,
          branch: { organizationId: dbUser.organizationId! },
        },
        select: { id: true, branchId: true },
      })

      if (!doc) {
        throw new Error('Documento não encontrado ou sem permissão de acesso.')
      }

      if (dbUser.role !== 'OWNER' && dbUser.branchId && doc.branchId !== dbUser.branchId) {
        throw new Error('Documento pertence a outra filial. Acesso negado.')
      }
    }

    const signedUrl = await getViewSignedUrl(storagePath)
    return { success: true, data: { signedUrl } }
  } catch (error: unknown) {
    return { error: handleServerError(error, 'Documents - getSignedUrlForView') }
  }
}

// ---------------------------------------------------------------
// Obter Signed URL para Download
// ---------------------------------------------------------------

export async function getSignedUrlForDownload(storagePath: string, fileName: string) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) throw new Error('Não autenticado')

    // Validar se o documento pertence à organização do usuário
    if (dbUser.role !== 'SUPER_ADMIN') {
      const doc = await prisma.document.findFirst({
        where: {
          storagePath,
          branch: { organizationId: dbUser.organizationId! },
        },
        select: { id: true, branchId: true },
      })

      if (!doc) {
        throw new Error('Documento não encontrado ou sem permissão de acesso.')
      }

      if (dbUser.role !== 'OWNER' && dbUser.branchId && doc.branchId !== dbUser.branchId) {
        throw new Error('Documento pertence a outra filial. Acesso negado.')
      }
    }

    const signedUrl = await getDownloadSignedUrl(storagePath, fileName)
    return { success: true, data: { signedUrl } }
  } catch (error: unknown) {
    return { error: handleServerError(error, 'Documents - getSignedUrlForDownload') }
  }
}

// ---------------------------------------------------------------
// Substituir Documento
// ---------------------------------------------------------------

export async function replaceDocument(
  documentId: string,
  newMetadata: {
    fileName: string
    fileSize: number
    mimeType: string
    storagePath: string
    issueDate?: string | null
    expirationDate?: string | null
  }
) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) throw new Error('Não autenticado')

    const isSuperAdmin = dbUser.role === 'SUPER_ADMIN' || Boolean(dbUser.isSuperAdminImpersonating)
    if (!isSuperAdmin && !dbUser.organizationId) {
      throw new Error('Usuário sem organização')
    }

    // Verificar existência e permissão do documento antigo
    const existingDoc = await prisma.document.findFirst({
      where: {
        id: documentId,
        ...(dbUser.organizationId ? { branch: { organizationId: dbUser.organizationId } } : {}),
        ...(dbUser.role !== 'OWNER' && !isSuperAdmin && dbUser.branchId
          ? { branchId: dbUser.branchId }
          : {}),
      },
      select: {
        id: true,
        branchId: true,
        producerId: true,
        propertyId: true,
        documentType: true,
        cropYear: true,
      },
    })

    if (!existingDoc) {
      throw new Error('Documento alvo não encontrado ou sem permissão para substituição.')
    }

    const result = await prisma.$transaction(async (tx) => {
      // Marcar o antigo como substituído
      await tx.document.update({
        where: { id: documentId },
        data: { isSuperseded: true, updatedBy: dbUser.id },
      })

      // Criar o novo registro
      const newDoc = await tx.document.create({
        data: {
          branchId: existingDoc.branchId,
          producerId: existingDoc.producerId,
          propertyId: existingDoc.propertyId,
          documentType: existingDoc.documentType,
          fileName: newMetadata.fileName,
          fileSize: newMetadata.fileSize,
          mimeType: newMetadata.mimeType,
          storagePath: newMetadata.storagePath,
          issueDate: newMetadata.issueDate ? new Date(newMetadata.issueDate) : null,
          expirationDate: newMetadata.expirationDate ? new Date(newMetadata.expirationDate) : null,
          cropYear: existingDoc.cropYear,
          complianceStatus: 'PENDING',
          inheritedFromId: documentId,
          isInherited: false,
          isSuperseded: false,
          createdBy: dbUser.id,
        },
      })

      return newDoc
    })

    revalidatePath('/admin/documents')
    return { success: true, data: result }
  } catch (error: unknown) {
    return { error: handleServerError(error, 'Documents - replaceDocument') }
  }
}

// ---------------------------------------------------------------
// Arquivar Documento (Soft Delete)
// ---------------------------------------------------------------

export async function archiveDocument(documentId: string) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) throw new Error('Não autenticado')

    const isSuperAdmin = dbUser.role === 'SUPER_ADMIN' || Boolean(dbUser.isSuperAdminImpersonating)
    if (!isSuperAdmin && !dbUser.organizationId) {
      throw new Error('Usuário sem organização')
    }

    // Verificar se o documento pertence à organização e filial do usuário
    const existingDoc = await prisma.document.findFirst({
      where: {
        id: documentId,
        ...(dbUser.organizationId ? { branch: { organizationId: dbUser.organizationId } } : {}),
        ...(dbUser.role !== 'OWNER' && !isSuperAdmin && dbUser.branchId
          ? { branchId: dbUser.branchId }
          : {}),
      },
      select: { id: true },
    })

    if (!existingDoc) {
      throw new Error('Documento não encontrado ou sem permissão para arquivamento.')
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { isArchived: true, updatedBy: dbUser.id },
    })

    revalidatePath('/admin/documents')
    return { success: true }
  } catch (error: unknown) {
    return { error: handleServerError(error, 'Documents - archiveDocument') }
  }
}

// ---------------------------------------------------------------
// Árvore de Documentos (para FolderTree)
// ---------------------------------------------------------------

export async function getDocumentTree() {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) throw new Error('Não autenticado')

    const isSuperAdmin = dbUser.role === 'SUPER_ADMIN' || Boolean(dbUser.isSuperAdminImpersonating)
    if (!isSuperAdmin && !dbUser.organizationId) {
      throw new Error('Usuário sem organização')
    }

    const whereProducer: Prisma.ProducerWhereInput = {
      ...(dbUser.organizationId ? { branch: { organizationId: dbUser.organizationId } } : {}),
      isActive: true,
      ...(dbUser.role !== 'OWNER' && !isSuperAdmin && dbUser.branchId
        ? { branchId: dbUser.branchId }
        : {}),
    }

    // Buscar produtores com contagem de documentos
    const producers = await prisma.producer.findMany({
      where: whereProducer,
      select: {
        id: true,
        name: true,
        document: true,
        type: true,
        branchId: true,
        branch: { select: { name: true } },
        properties: {
          select: {
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        documents: {
          where: { isArchived: false, isSuperseded: false },
          select: {
            id: true,
            documentType: true,
            expirationDate: true,
            propertyId: true,
            cropYear: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Construir a árvore com contadores e alertas
    const tree = producers.map((producer) => {
      const docs = producer.documents
      const docStatuses = docs.map((d) =>
        calculateDocumentStatus(d.expirationDate, d.documentType)
      )
      const hasAlert = docStatuses.some((s) => s === 'ALERTA' || s === 'VENCIDO')

      const properties = producer.properties.map((pp) => {
        const propDocs = docs.filter((d) => d.propertyId === pp.property.id)
        const propStatuses = propDocs.map((d) =>
          calculateDocumentStatus(d.expirationDate, d.documentType)
        )
        const propHasAlert = propStatuses.some((s) => s === 'ALERTA' || s === 'VENCIDO')

        return {
          id: pp.property.id,
          name: pp.property.name,
          documentCount: propDocs.length,
          hasAlert: propHasAlert,
        }
      })

      // Documentos pessoais (sem propriedade)
      const personalDocs = docs.filter((d) => !d.propertyId)
      const personalStatuses = personalDocs.map((d) =>
        calculateDocumentStatus(d.expirationDate, d.documentType)
      )
      const personalHasAlert = personalStatuses.some((s) => s === 'ALERTA' || s === 'VENCIDO')

      return {
        id: producer.id,
        name: producer.name,
        document: producer.document,
        type: producer.type,
        branchId: producer.branchId,
        branchName: producer.branch.name,
        totalDocuments: docs.length,
        hasAlert,
        personalDocuments: {
          count: personalDocs.length,
          hasAlert: personalHasAlert,
        },
        properties,
      }
    })

    return { success: true, data: tree }
  } catch (error: unknown) {
    return { error: handleServerError(error, 'Documents - getDocumentTree') }
  }
}

// ---------------------------------------------------------------
// Contagem de Alertas (para Header Badge)
// ---------------------------------------------------------------

export async function getDocumentAlertCount() {
  try {
    const dbUser = await getUserContext()
    if (!dbUser || !dbUser.organizationId) {
      return { success: true, data: 0 }
    }

    // Contar documentos em alerta ou vencidos
    const documents = await prisma.document.findMany({
      where: {
        branch: { organizationId: dbUser.organizationId },
        isArchived: false,
        isSuperseded: false,
        expirationDate: { not: null },
      },
      select: {
        expirationDate: true,
        documentType: true,
      },
    })

    const alertCount = documents.filter((doc) => {
      const status = calculateDocumentStatus(doc.expirationDate, doc.documentType)
      return status === 'ALERTA' || status === 'VENCIDO'
    }).length

    return { success: true, data: alertCount }
  } catch {
    return { success: true, data: 0 }
  }
}

// ---------------------------------------------------------------
// Otimização / Compressão de Documentos Existentes (Batch)
// ---------------------------------------------------------------

export interface CompressionResultItem {
  id: string
  fileName: string
  originalSize: number
  compressedSize: number
  savedBytes: number
  percentage: number
}

export async function compressExistingDocuments(branchId?: string) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) {
      throw new Error('Usuário não autenticado')
    }

    const isSuperAdmin = dbUser.role === 'SUPER_ADMIN' || (dbUser as any).realRole === 'SUPER_ADMIN'
    if (!isSuperAdmin) {
      return {
        success: false,
        error: 'Apenas Super Administradores possuem autorização para executar a otimização em lote.',
      }
    }

    let organizationId = dbUser.organizationId
    if (!organizationId) {
      const firstOrg = await prisma.organization.findFirst({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      })
      organizationId = firstOrg?.id || null
    }

    if (!organizationId) {
      throw new Error('Nenhuma organização vinculada para otimização.')
    }

    const { BUCKET_NAME } = await import('@/lib/ged/storage')
    const { supabaseAdmin } = await import('@/lib/supabase/admin')

    const where: Prisma.DocumentWhereInput = {
      branch: { organizationId },
      isArchived: false,
      isSuperseded: false,
      ...(branchId && branchId !== 'ALL' ? { branchId } : {}),
    }

    const documents = await prisma.document.findMany({
      where,
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        storagePath: true,
      },
    })

    let processedCount = 0
    let optimizedCount = 0
    let originalTotal = 0
    let compressedTotal = 0
    const details: CompressionResultItem[] = []

    for (const doc of documents) {
      processedCount++
      const currentSize = Number(doc.fileSize)
      originalTotal += currentSize

      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .download(doc.storagePath)

      if (error || !data) {
        compressedTotal += currentSize
        continue
      }

      const arrayBuffer = await data.arrayBuffer()
      const originalBuffer = Buffer.from(arrayBuffer)
      let optimizedBuffer: Buffer | null = null

      try {
        if (doc.mimeType === 'application/pdf') {
          const { PDFDocument } = await import('pdf-lib')
          const pdfDoc = await PDFDocument.load(new Uint8Array(arrayBuffer), { ignoreEncryption: true })
          const pdfBytes = await pdfDoc.save({ useObjectStreams: true })
          optimizedBuffer = Buffer.from(pdfBytes)
        } else if (doc.mimeType.startsWith('image/')) {
          const sharp = (await import('sharp')).default
          let transformer = sharp(originalBuffer).resize(2048, 2048, {
            fit: 'inside',
            withoutEnlargement: true,
          })

          if (doc.mimeType === 'image/jpeg') {
            transformer = transformer.jpeg({ quality: 82, mozjpeg: true })
          } else if (doc.mimeType === 'image/png') {
            transformer = transformer.png({ quality: 82, compressionLevel: 8 })
          } else if (doc.mimeType === 'image/webp') {
            transformer = transformer.webp({ quality: 82 })
          } else {
            transformer = transformer.jpeg({ quality: 82 })
          }
          optimizedBuffer = await transformer.toBuffer()
        }
      } catch (err) {
        console.warn(`[Compress] Erro ao comprimir documento ${doc.id}:`, err)
      }

      // Só substitui se houver redução real de tamanho
      if (optimizedBuffer && optimizedBuffer.length < currentSize) {
        const savedBytes = currentSize - optimizedBuffer.length
        const percentage = Number(((savedBytes / currentSize) * 100).toFixed(1))

        const { error: uploadErr } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .upload(doc.storagePath, optimizedBuffer, {
            contentType: doc.mimeType,
            upsert: true,
          })

        if (!uploadErr) {
          await prisma.document.update({
            where: { id: doc.id },
            data: { fileSize: optimizedBuffer.length },
          })

          optimizedCount++
          compressedTotal += optimizedBuffer.length
          details.push({
            id: doc.id,
            fileName: doc.fileName,
            originalSize: currentSize,
            compressedSize: optimizedBuffer.length,
            savedBytes,
            percentage,
          })
          continue
        }
      }

      // Se não reduziu ou falhou, mantém tamanho atual
      compressedTotal += currentSize
    }

    revalidatePath('/admin/dashboard/owner')
    revalidatePath('/admin/ged/explorer')

    const totalSavedBytes = originalTotal - compressedTotal
    const totalSavedPercentage =
      originalTotal > 0 ? Number(((totalSavedBytes / originalTotal) * 100).toFixed(1)) : 0

    return {
      success: true,
      processedCount,
      optimizedCount,
      originalTotal,
      compressedTotal,
      totalSavedBytes,
      totalSavedPercentage,
      details,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao comprimir documentos existentes',
    }
  }
}

