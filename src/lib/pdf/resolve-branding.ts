/**
 * Utilitário para resolução e conversão de identidade visual e logomarcas remotas
 * em Base64 Data URI antes da montagem do DOM para impressão.
 * Neutraliza erros de CORS, canvas tainting e elimina atrasos assíncronos no html2canvas.
 */

export async function convertRemoteUrlToBase64(url?: string | null): Promise<string | null> {
  if (!url) return null

  // Se já for Base64 Data URI, retorna diretamente
  if (url.startsWith('data:')) {
    return url
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`[convertRemoteUrlToBase64] Falha ao carregar logo remota (${response.status}): ${url}`)
      return null
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    return `data:${contentType};base64,${base64}`
  } catch (error: any) {
    console.warn(`[convertRemoteUrlToBase64] Erro de rede ao converter logo (${url}):`, error?.message)
    return null
  }
}

export interface ResolvedBranding {
  companyName: string
  tradeName?: string | null
  cnpj?: string | null
  primaryColor: string
  accentColor: string
  logoHorizontalUrl?: string | null
  logoHorizontalBase64?: string | null
  logoDarkUrl?: string | null
  logoDarkBase64?: string | null
  logoIconUrl?: string | null
  logoIconBase64?: string | null
}

/**
 * Normaliza os dados institucionais da organização com fallback rigoroso
 * e conversão prévia da logomarca horizontal para Base64 Data URI.
 */
export async function resolveOrganizationBranding(
  org?: {
    name?: string | null
    tradeName?: string | null
    cnpj?: string | null
    logoHorizontalUrl?: string | null
    logoDarkUrl?: string | null
    logoIconUrl?: string | null
    primaryColorHex?: string | null
    accentColorHex?: string | null
    [key: string]: any
  } | null
): Promise<ResolvedBranding> {
  const companyName = org?.tradeName || org?.name || 'LN Consultoria e Projetos Rurais'
  const primaryColor = org?.primaryColorHex || '#1B4D3E'
  const accentColor = org?.accentColorHex || '#FFAC00'

  let logoHorizontalBase64: string | null = null
  if (org?.logoHorizontalUrl) {
    logoHorizontalBase64 = await convertRemoteUrlToBase64(org.logoHorizontalUrl)
  }

  return {
    companyName,
    tradeName: org?.tradeName || null,
    cnpj: org?.cnpj || null,
    primaryColor,
    accentColor,
    logoHorizontalUrl: org?.logoHorizontalUrl || null,
    logoHorizontalBase64,
    logoDarkUrl: org?.logoDarkUrl || null,
    logoIconUrl: org?.logoIconUrl || null,
  }
}
