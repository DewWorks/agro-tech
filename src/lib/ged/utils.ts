// ---------------------------------------------------------------
// Constantes e Utilitários Puros (Seguros para o Client-Side)
// ---------------------------------------------------------------

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
]

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25MB

/**
 * Valida se o mime-type do arquivo é permitido.
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType)
}

/**
 * Valida se o tamanho do arquivo está dentro do limite.
 */
export function validateFileSize(sizeBytes: number): boolean {
  return sizeBytes <= MAX_FILE_SIZE_BYTES
}

/**
 * Formata o tamanho do arquivo em uma string legível.
 * Ex: "2.5 MB", "340 KB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}
