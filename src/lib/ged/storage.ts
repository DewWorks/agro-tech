import { supabaseAdmin } from '@/lib/supabase/admin'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/ged/utils'

export const BUCKET_NAME = 'agrotech-documents'

// ---------------------------------------------------------------
// Validações de Arquivo
// ---------------------------------------------------------------

/**
 * Retorna a extensão correspondente ao mime-type.
 */
export function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/tiff': 'tiff',
  }
  return map[mimeType] || 'bin'
}

// ---------------------------------------------------------------
// Geração de Caminhos no Storage
// ---------------------------------------------------------------

/**
 * Gera o caminho padronizado de armazenamento no bucket.
 * Formato: {branchId}/{producerId}/{documentType}_{YYYYMMDD}_{uuid}.{ext}
 */
export function buildStoragePath(params: {
  branchId: string
  producerId: string
  propertyId?: string
  documentType: string
  fileName: string
  mimeType: string
}): string {
  const { branchId, producerId, propertyId, documentType, mimeType } = params
  const ext = getExtensionFromMime(mimeType)
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const uniqueId = crypto.randomUUID().slice(0, 8)

  const basePath = propertyId
    ? `${branchId}/${producerId}/${propertyId}`
    : `${branchId}/${producerId}/pessoal`

  return `${basePath}/${documentType.toLowerCase()}_${dateStr}_${uniqueId}.${ext}`
}

// ---------------------------------------------------------------
// Operações com Supabase Storage (Signed URLs)
// ---------------------------------------------------------------

/**
 * Garante que o bucket exista. Cria se necessário.
 * Chamado com service_role — apenas server-side.
 */
export async function ensureBucketExists(): Promise<void> {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  const exists = buckets?.some(b => b.name === BUCKET_NAME)

  if (!exists) {
    const { error } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: MAX_FILE_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
    })
    if (error) {
      throw new Error(`Falha ao criar bucket '${BUCKET_NAME}': ${error.message}`)
    }
  }
}

/**
 * Gera uma Signed URL para upload direto ao Supabase Storage.
 * Expiração: 5 minutos (300 segundos).
 */
export async function getUploadSignedUrl(storagePath: string): Promise<{
  signedUrl: string
  path: string
}> {
  await ensureBucketExists()

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(storagePath)

  if (error || !data) {
    throw new Error(`Falha ao gerar URL de upload: ${error?.message}`)
  }

  return {
    signedUrl: data.signedUrl,
    path: data.path,
  }
}

/**
 * Gera uma Signed URL para visualização/preview do documento.
 * Expiração: 60 minutos (3600 segundos).
 */
export async function getViewSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, 3600) // 60 minutos

  if (error || !data?.signedUrl) {
    throw new Error(`Falha ao gerar URL de visualização: ${error?.message}`)
  }

  return data.signedUrl
}

/**
 * Gera uma Signed URL para download com nome de arquivo original.
 * Expiração: 60 minutos (3600 segundos).
 * Configura Content-Disposition: attachment.
 */
export async function getDownloadSignedUrl(
  storagePath: string,
  originalFileName: string
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, 3600, {
      download: originalFileName,
    })

  if (error || !data?.signedUrl) {
    throw new Error(`Falha ao gerar URL de download: ${error?.message}`)
  }

  return data.signedUrl
}

/**
 * Remove um arquivo do Storage.
 */
export async function deleteStorageFile(storagePath: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .remove([storagePath])

  if (error) {
    throw new Error(`Falha ao remover arquivo: ${error.message}`)
  }
}
