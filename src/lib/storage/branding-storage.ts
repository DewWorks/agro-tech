import { supabaseAdmin } from '@/lib/supabase/admin'

export const BRANDING_BUCKET = 'organization-assets'
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
]
export const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024 // 4MB

export function getBrandingExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  }
  return map[mimeType] || 'png'
}

/**
 * Garante que o bucket de assets institucionais exista no Supabase Storage.
 * Configurado com visibilidade pública para CDN sem overhead de autenticação em visualização.
 */
export async function ensureBrandingBucketExists(): Promise<void> {
  try {
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
    if (listError) {
      console.warn('Não foi possível listar buckets:', listError.message)
      return
    }

    const exists = buckets?.some((b) => b.name === BRANDING_BUCKET)
    if (!exists) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(BRANDING_BUCKET, {
        public: true,
        fileSizeLimit: MAX_IMAGE_SIZE_BYTES,
        allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
      })
      if (createError) {
        console.warn(`Aviso ao criar bucket '${BRANDING_BUCKET}':`, createError.message)
      }
    }
  } catch (err: any) {
    console.warn('Erro ao verificar/criar bucket de branding:', err?.message)
  }
}

/**
 * Faz o upload de uma logo/ativo visual para o Supabase Storage
 * e retorna a URL pública pronta para uso.
 */
export async function uploadBrandingImage(
  organizationId: string,
  type: 'logo_horizontal' | 'logo_icon' | 'logo_dark',
  file: File | Blob,
  mimeType: string
): Promise<string> {
  await ensureBrandingBucketExists()

  const ext = getBrandingExtension(mimeType)
  const timestamp = Date.now()
  const storagePath = `${organizationId}/branding/${type}_${timestamp}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BRANDING_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      cacheControl: '31536000',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Falha no upload da imagem (${type}): ${uploadError.message}`)
  }

  const { data: publicData } = supabaseAdmin.storage
    .from(BRANDING_BUCKET)
    .getPublicUrl(storagePath)

  return publicData.publicUrl
}

/**
 * Extrai o caminho relativo no bucket a partir de uma URL pública do Supabase
 * ou retorna o próprio caminho caso já esteja em formato relativo.
 */
export function extractBrandingStoragePath(urlOrPath?: string | null): string | null {
  if (!urlOrPath) return null

  // Base64 Data URI não reside no Storage
  if (urlOrPath.startsWith('data:')) return null

  // Se já for caminho relativo (ex: 'org-id/branding/logo_123.png')
  if (!urlOrPath.startsWith('http://') && !urlOrPath.startsWith('https://')) {
    return urlOrPath
  }

  // Se for URL pública do Supabase Storage
  const marker = `/${BRANDING_BUCKET}/`
  const index = urlOrPath.indexOf(marker)
  if (index !== -1) {
    const rawPath = urlOrPath.slice(index + marker.length)
    return rawPath.split('?')[0]
  }

  return null
}

/**
 * Remove fisicamente uma imagem do bucket de branding do Supabase Storage.
 * Neutraliza erros para evitar que falhas de exclusão de arquivos órfãos
 * bloqueiem o fluxo de atualização cadastral.
 */
export async function deleteBrandingImageFromStorage(urlOrPath?: string | null): Promise<boolean> {
  const storagePath = extractBrandingStoragePath(urlOrPath)
  if (!storagePath) return false

  try {
    const { error } = await supabaseAdmin.storage
      .from(BRANDING_BUCKET)
      .remove([storagePath])

    if (error) {
      console.warn(`[deleteBrandingImageFromStorage] Falha ao remover ${storagePath}:`, error.message)
      return false
    }

    return true
  } catch (err: any) {
    console.warn(
      `[deleteBrandingImageFromStorage] Erro ao excluir arquivo órfão (${storagePath}):`,
      err?.message
    )
    return false
  }
}
