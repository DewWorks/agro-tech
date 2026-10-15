import { asaasFetch } from './client'
import type {
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  AsaasSubscriptionResponse,
  AsaasPaymentResponse,
  AsaasListResponse,
} from './types'

export async function createAsaasSubscription(
  data: CreateSubscriptionRequest,
): Promise<AsaasSubscriptionResponse> {
  return asaasFetch<AsaasSubscriptionResponse>(
    '/subscriptions',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    'createAsaasSubscription',
  )
}

export async function updateAsaasSubscription(
  id: string,
  data: UpdateSubscriptionRequest,
): Promise<AsaasSubscriptionResponse> {
  return asaasFetch<AsaasSubscriptionResponse>(
    `/subscriptions/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
    'updateAsaasSubscription',
  )
}

export async function getAsaasSubscription(id: string): Promise<AsaasSubscriptionResponse> {
  return asaasFetch<AsaasSubscriptionResponse>(
    `/subscriptions/${encodeURIComponent(id)}`,
    {
      method: 'GET',
    },
    'getAsaasSubscription',
  )
}

export async function cancelAsaasSubscription(id: string): Promise<AsaasSubscriptionResponse> {
  return asaasFetch<AsaasSubscriptionResponse>(
    `/subscriptions/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
    'cancelAsaasSubscription',
  )
}

export async function getSubscriptionPayments(
  subscriptionId: string,
): Promise<AsaasPaymentResponse[]> {
  const response = await asaasFetch<AsaasListResponse<AsaasPaymentResponse>>(
    `/subscriptions/${encodeURIComponent(subscriptionId)}/payments`,
    { method: 'GET' },
    'getSubscriptionPayments',
  )
  return response.data || []
}
