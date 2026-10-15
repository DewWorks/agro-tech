import { asaasFetch } from './client'
import type {
  CreateCustomerRequest,
  UpdateCustomerRequest,
  AsaasCustomerResponse,
  AsaasListResponse,
} from './types'

export async function createAsaasCustomer(data: CreateCustomerRequest): Promise<AsaasCustomerResponse> {
  return asaasFetch<AsaasCustomerResponse>(
    '/customers',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    'createAsaasCustomer',
  )
}

export async function updateAsaasCustomer(
  id: string,
  data: UpdateCustomerRequest,
): Promise<AsaasCustomerResponse> {
  return asaasFetch<AsaasCustomerResponse>(
    `/customers/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
    'updateAsaasCustomer',
  )
}

export async function getAsaasCustomer(id: string): Promise<AsaasCustomerResponse> {
  return asaasFetch<AsaasCustomerResponse>(
    `/customers/${encodeURIComponent(id)}`,
    {
      method: 'GET',
    },
    'getAsaasCustomer',
  )
}

export async function findCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomerResponse | null> {
  const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '')
  const response = await asaasFetch<AsaasListResponse<AsaasCustomerResponse>>(
    `/customers?cpfCnpj=${encodeURIComponent(cleanCpfCnpj)}`,
    { method: 'GET' },
    'findCustomerByCpfCnpj',
  )
  return response.data?.[0] ?? null
}
