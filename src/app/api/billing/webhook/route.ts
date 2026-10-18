import { NextRequest, NextResponse } from 'next/server'
import { asaasConfig } from '@/lib/asaas/config'
import { asaasWebhookSchema } from '@/lib/validations/billing'
import {
  handlePaymentCreated,
  handlePaymentSettled,
  handlePaymentOverdue,
  handlePaymentCancelled,
} from '@/lib/billing/webhook-handler'
import { serverLog } from '@/lib/logger'

export async function POST(request: NextRequest) {
  // 1. Validação estrita do Token do Webhook
  const token = request.headers.get('asaas-access-token')
  if (!token || token !== asaasConfig.webhookToken) {
    serverLog('warn', 'BillingWebhook', 'Tentativa de requisição com token Asaas ausente ou inválido', {
      receivedTokenPrefix: token ? token.substring(0, 6) + '...' : 'none',
    })
    return NextResponse.json({ error: 'Unauthorized: invalid webhook token' }, { status: 401 })
  }

  // 2. Parse e Validação de Formato do Payload via Zod
  let body: unknown
  try {
    body = await request.json()
  } catch (err) {
    serverLog('warn', 'BillingWebhook', 'Corpo da requisição JSON inválido', err)
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const parsed = asaasWebhookSchema.safeParse(body)
  if (!parsed.success) {
    serverLog('warn', 'BillingWebhook', 'Payload do Asaas recusado pelo schema Zod', {
      errors: parsed.error.issues,
      receivedEvent: (body as any)?.event,
    })
    return NextResponse.json(
      { error: 'Invalid payload structure', details: parsed.error.issues },
      { status: 400 },
    )
  }

  const { event, payment } = parsed.data

  // 3. Filtro: Ignorar cobranças avulsas desvinculadas de recorrência SaaS
  if (!payment.subscription) {
    serverLog('info', 'BillingWebhook', `Cobrança avulsa ${payment.id} ignorada pelo SaaS Billing Engine`)
    return NextResponse.json({ received: true, skipped: 'not_a_subscription' })
  }

  // 4. Despacho dos eventos para os handlers transacionais
  try {
    switch (event) {
      case 'PAYMENT_CREATED':
      case 'PAYMENT_RESTORED':
        await handlePaymentCreated(payment)
        break

      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        await handlePaymentSettled(payment, event)
        break

      case 'PAYMENT_OVERDUE':
        await handlePaymentOverdue(payment)
        break

      case 'PAYMENT_REFUNDED':
      case 'PAYMENT_DELETED':
        await handlePaymentCancelled(payment, event)
        break

      case 'PAYMENT_UPDATED':
        // Atualiza urls se houver alteração
        await handlePaymentCreated(payment)
        break

      default:
        serverLog('info', 'BillingWebhook', `Evento não mapeado recebido: ${event}`)
        break
    }

    return NextResponse.json({ received: true, event, paymentId: payment.id })
  } catch (error) {
    // Retorna HTTP 500 em falhas internas/banco de dados para que o Asaas realize retry automático
    serverLog('error', 'BillingWebhook', error, { event, paymentId: payment.id })
    return NextResponse.json(
      { error: 'Internal processing error. Retrying recommended.' },
      { status: 500 },
    )
  }
}
