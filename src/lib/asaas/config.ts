export const asaasConfig = {
  get environment() {
    return process.env.ASAAS_ENVIRONMENT === 'production' ? 'production' : 'sandbox'
  },
  get baseUrl() {
    return this.environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3'
  },
  get apiKey() {
    return process.env.ASAAS_API_KEY || ''
  },
  get webhookToken() {
    return process.env.ASAAS_WEBHOOK_TOKEN || ''
  },
  timeoutMs: 15000,
  maxRetries: 3,
}

export function getAsaasHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'access_token': asaasConfig.apiKey,
    'User-Agent': 'AgroTech-SaaS-Billing/1.0',
  }
}
