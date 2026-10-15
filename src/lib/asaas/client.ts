import { asaasConfig, getAsaasHeaders } from './config'
import { serverLog } from '@/lib/logger'

export interface AsaasErrorDetail {
  code: string
  description: string
}

export class AsaasApiError extends Error {
  public statusCode: number
  public errors: AsaasErrorDetail[]
  public context: string

  constructor(statusCode: number, errors: AsaasErrorDetail[], context: string) {
    const summary = errors.map((e) => `${e.code}: ${e.description}`).join('; ')
    super(`[Asaas API ${statusCode}] (${context}): ${summary || 'Erro na requisição Asaas'}`)
    this.name = 'AsaasApiError'
    this.statusCode = statusCode
    this.errors = errors
    this.context = context
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function asaasFetch<T>(
  path: string,
  options: RequestInit = {},
  context = 'asaasFetch',
): Promise<T> {
  if (!asaasConfig.apiKey) {
    throw new AsaasApiError(
      500,
      [{ code: 'CONFIG_ERROR', description: 'Chave ASAAS_API_KEY não configurada no ambiente.' }],
      context,
    )
  }

  const url = `${asaasConfig.baseUrl}${path}`
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= asaasConfig.maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), asaasConfig.timeoutMs)

      const response = await fetch(url, {
        ...options,
        headers: {
          ...getAsaasHeaders(),
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const errorList: AsaasErrorDetail[] =
          Array.isArray(body?.errors) && body.errors.length > 0
            ? body.errors
            : [{ code: 'HTTP_ERROR', description: body?.message || response.statusText }]

        throw new AsaasApiError(response.status, errorList, context)
      }

      return (await response.json()) as T
    } catch (error) {
      lastError = error as Error

      // Não efetua retry para erros 4xx (erros de regra/validação do cliente)
      if (error instanceof AsaasApiError && error.statusCode < 500) {
        throw error
      }

      if (attempt < asaasConfig.maxRetries) {
        const backoff = Math.min(1000 * Math.pow(2, attempt), 8000)
        serverLog(
          'warn',
          context,
          `Tentativa ${attempt + 1}/${asaasConfig.maxRetries} falhou: ${lastError.message}. Aguardando ${backoff}ms para retry.`,
        )
        await sleep(backoff)
      }
    }
  }

  serverLog('error', context, `Falha definitiva após ${asaasConfig.maxRetries} tentativas:`, lastError)
  throw lastError!
}
