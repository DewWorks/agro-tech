import { asaasFetch } from './client'
import type { AsaasPaymentResponse, AsaasPixQrCodeResponse } from './types'

export async function getAsaasPayment(id: string): Promise<AsaasPaymentResponse> {
  return asaasFetch<AsaasPaymentResponse>(
    `/payments/${encodeURIComponent(id)}`,
    {
      method: 'GET',
    },
    'getAsaasPayment',
  )
}

export async function getPixQrCode(paymentId: string): Promise<AsaasPixQrCodeResponse> {
  return asaasFetch<AsaasPixQrCodeResponse>(
    `/payments/${encodeURIComponent(paymentId)}/pixQrCode`,
    {
      method: 'GET',
    },
    'getPixQrCode',
  )
}
