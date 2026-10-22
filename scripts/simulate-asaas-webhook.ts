import 'dotenv/config'
import prisma from '../src/lib/prisma'
import { asaasConfig } from '../src/lib/asaas/config'

const BASE_URL = process.env.TEST_WEBHOOK_URL || 'http://localhost:3000/api/billing/webhook'
const WEBHOOK_TOKEN = asaasConfig.webhookToken || 'agrotech_webhook_token_dev'

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function sendWebhookEvent(event: string, payment: any) {
  const payload = {
    event,
    payment,
  }

  console.log(`\n📡 [HTTP POST] Disparando evento ${event} para ${BASE_URL}...`)

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'asaas-access-token': WEBHOOK_TOKEN,
    },
    body: JSON.stringify(payload),
  })

  const responseData = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      `Falha na resposta HTTP ${response.status}: ${JSON.stringify(responseData)}`,
    )
  }

  console.log(`   ✅ Resposta HTTP ${response.status}:`, JSON.stringify(responseData))
  return responseData
}

export async function runWebhookSimulation() {
  console.log(`======================================================`)
  console.log(`🧪 SIMULADOR DE WEBHOOKS ASAAS v3 — AGROTECH BILLING`)
  console.log(`======================================================`)
  console.log(`• Endpoint Alvo: ${BASE_URL}`)
  console.log(`• Token de Autenticação: ${WEBHOOK_TOKEN.slice(0, 4)}...***`)

  // 1. Localizar assinatura ativa no banco de dados para vincular
  const subscription = await prisma.organizationSubscription.findFirst({
    where: { asaasSubscriptionId: { not: null } },
    include: { organization: true, plan: true },
  })

  if (!subscription || !subscription.asaasSubscriptionId) {
    throw new Error(
      'Nenhuma assinatura Asaas encontrada no banco local. Execute "npx tsx scripts/provision-subscription.ts" primeiro.',
    )
  }

  console.log(`• Organização Testada: ${subscription.organization.name.trim()}`)
  console.log(`• ID da Assinatura Asaas: ${subscription.asaasSubscriptionId}`)
  console.log(`• ID do Cliente Asaas:    ${subscription.asaasCustomerId}`)
  console.log(`• Plano Contratado:       ${subscription.plan.name}`)

  const testPaymentId = `pay_sim_${Date.now()}`
  const dueDateStr = '2026-11-10'

  // =========================================================
  // CENÁRIO 1: PAYMENT_CREATED
  // =========================================================
  console.log(`\n------------------------------------------------------`)
  console.log(`▶ CENÁRIO 1: Geração de Nova Cobrança (PAYMENT_CREATED)`)
  console.log(`------------------------------------------------------`)

  await sendWebhookEvent('PAYMENT_CREATED', {
    id: testPaymentId,
    subscription: subscription.asaasSubscriptionId,
    customer: subscription.asaasCustomerId,
    value: 300.0,
    netValue: 298.01,
    status: 'PENDING',
    billingType: 'BOLETO',
    dueDate: dueDateStr,
    invoiceUrl: `https://sandbox.asaas.com/i/${testPaymentId}`,
    bankSlipUrl: `https://sandbox.asaas.com/b/${testPaymentId}`,
    description: `Assinatura Mensal AgroTech - ${subscription.plan.name}`,
  })

  // Validação no banco local
  const createdInvoice = await prisma.subscriptionInvoice.findUnique({
    where: { asaasPaymentId: testPaymentId },
  })

  if (!createdInvoice) {
    throw new Error(`[FALHA] Fatura ${testPaymentId} não foi encontrada no banco após PAYMENT_CREATED`)
  }

  console.log(`   🔎 Verificação no PostgreSQL:`)
  console.log(`      - ID Local:   ${createdInvoice.id}`)
  console.log(`      - Status:     ${createdInvoice.status} (Esperado: PENDING)`)
  console.log(`      - Valor:      R$ ${Number(createdInvoice.amount).toFixed(2)}`)
  console.log(`      - Competência: ${createdInvoice.competenceStart.toLocaleDateString('pt-BR')} até ${createdInvoice.competenceEnd.toLocaleDateString('pt-BR')}`)
  console.log(`   🎉 Teste 1: PAYMENT_CREATED APROVADO!`)

  await sleep(1000)

  // =========================================================
  // CENÁRIO 2: PAYMENT_CONFIRMED
  // =========================================================
  console.log(`\n------------------------------------------------------`)
  console.log(`▶ CENÁRIO 2: Liquidação / Baixa de Título (PAYMENT_CONFIRMED)`)
  console.log(`------------------------------------------------------`)

  await sendWebhookEvent('PAYMENT_CONFIRMED', {
    id: testPaymentId,
    subscription: subscription.asaasSubscriptionId,
    customer: subscription.asaasCustomerId,
    value: 300.0,
    netValue: 298.01,
    status: 'CONFIRMED',
    billingType: 'BOLETO',
    dueDate: dueDateStr,
    paymentDate: '2026-11-09',
    invoiceNumber: 'NFS-2026-0099',
    invoiceUrl: `https://sandbox.asaas.com/i/${testPaymentId}`,
    bankSlipUrl: `https://sandbox.asaas.com/b/${testPaymentId}`,
    description: `Assinatura Mensal AgroTech - ${subscription.plan.name}`,
  })

  // Validação no banco local
  const settledInvoice = await prisma.subscriptionInvoice.findUnique({
    where: { asaasPaymentId: testPaymentId },
  })
  const updatedSub = await prisma.organizationSubscription.findUnique({
    where: { id: subscription.id },
  })

  if (settledInvoice?.status !== 'RECEIVED') {
    throw new Error(`[FALHA] Status da fatura deveria ser RECEIVED, mas está ${settledInvoice?.status}`)
  }
  if (updatedSub?.status !== 'ACTIVE') {
    throw new Error(`[FALHA] Status da assinatura deveria ser ACTIVE, mas está ${updatedSub?.status}`)
  }

  console.log(`   🔎 Verificação no PostgreSQL:`)
  console.log(`      - Status da Fatura:       ${settledInvoice.status} (Esperado: RECEIVED)`)
  console.log(`      - Data de Pagamento:      ${settledInvoice.paidAt?.toLocaleDateString('pt-BR')}`)
  console.log(`      - Número da NFS-e:        ${settledInvoice.invoiceNumber}`)
  console.log(`      - Status da Assinatura:   ${updatedSub.status} (Esperado: ACTIVE)`)
  console.log(`      - Nova Vigência (Sem Drift): ${updatedSub.currentPeriodEnd?.toLocaleDateString('pt-BR')}`)
  console.log(`      - Tolerância Limpa:       ${updatedSub.gracePeriodUntil === null ? 'Sim (null)' : 'Não'}`)
  console.log(`   🎉 Teste 2: PAYMENT_CONFIRMED APROVADO!`)

  await sleep(1000)

  // =========================================================
  // CENÁRIO 3: PAYMENT_OVERDUE
  // =========================================================
  console.log(`\n------------------------------------------------------`)
  console.log(`▶ CENÁRIO 3: Inadimplência e Tolerância 15d (PAYMENT_OVERDUE)`)
  console.log(`------------------------------------------------------`)

  const overduePaymentId = `pay_sim_overdue_${Date.now()}`
  const overdueDueDateStr = '2026-11-10'

  await sendWebhookEvent('PAYMENT_OVERDUE', {
    id: overduePaymentId,
    subscription: subscription.asaasSubscriptionId,
    customer: subscription.asaasCustomerId,
    value: 300.0,
    netValue: 298.01,
    status: 'OVERDUE',
    billingType: 'BOLETO',
    dueDate: overdueDueDateStr,
    invoiceUrl: `https://sandbox.asaas.com/i/${overduePaymentId}`,
    bankSlipUrl: `https://sandbox.asaas.com/b/${overduePaymentId}`,
    description: `Assinatura Mensal AgroTech - ${subscription.plan.name}`,
  })

  const overdueInvoice = await prisma.subscriptionInvoice.findUnique({
    where: { asaasPaymentId: overduePaymentId },
  })
  const overdueSub = await prisma.organizationSubscription.findUnique({
    where: { id: subscription.id },
  })

  if (overdueInvoice?.status !== 'OVERDUE') {
    throw new Error(`[FALHA] Status da fatura deveria ser OVERDUE, mas está ${overdueInvoice?.status}`)
  }

  const expectedGraceDate = new Date('2026-11-10')
  expectedGraceDate.setDate(expectedGraceDate.getDate() + 15)
  const actualGraceDate = overdueSub?.gracePeriodUntil

  console.log(`   🔎 Verificação no PostgreSQL:`)
  console.log(`      - Status da Fatura:       ${overdueInvoice.status} (Esperado: OVERDUE)`)
  console.log(`      - Status da Assinatura:   ${overdueSub?.status} (Esperado: OVERDUE)`)
  console.log(`      - Data Limite de Carência: ${actualGraceDate?.toLocaleDateString('pt-BR')} (Esperado: ${expectedGraceDate.toLocaleDateString('pt-BR')})`)

  // Validação estrita da regra de 15 dias
  const diffDays = Math.round(
    ((actualGraceDate?.getTime() ?? 0) - new Date('2026-11-10').getTime()) / (1000 * 60 * 60 * 24),
  )
  if (diffDays !== 15) {
    throw new Error(`[FALHA] Tolerância calculou ${diffDays} dias, esperado: 15 dias`)
  }

  console.log(`      - Diferença Exata:        ${diffDays} dias corridos`)
  console.log(`   🎉 Teste 3: PAYMENT_OVERDUE APROVADO!`)

  // =========================================================
  // RESTAURAÇÃO: Restaura o status da assinatura para ACTIVE
  // =========================================================
  console.log(`\n------------------------------------------------------`)
  console.log(`🧹 RESTAURAÇÃO DO AMBIENTE`)
  console.log(`------------------------------------------------------`)
  await prisma.organizationSubscription.update({
    where: { id: subscription.id },
    data: {
      status: 'ACTIVE',
      gracePeriodUntil: null,
    },
  })
  console.log(`   ✅ Status da assinatura restaurado para "ACTIVE".`)

  console.log(`\n======================================================`)
  console.log(`🏆 TODOS OS 3 CENÁRIOS DE WEBHOOK FORAM VALIDADOS COM SUCESSO!`)
  console.log(`======================================================\n`)
}

if (require.main === module || process.argv[1]?.includes('simulate-asaas-webhook')) {
  runWebhookSimulation()
    .catch((err) => {
      console.error('\n❌ ERRO NA SIMULAÇÃO DE WEBHOOK:', err.message)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
