import 'dotenv/config'
import prisma from '../src/lib/prisma'

export const DEFAULT_PLANS = [
  {
    code: 'FOUNDER_300',
    name: 'Plano Fundador (Pioneiro)',
    description: 'Condição contratual exclusiva acordada para a LN Consultoria e parceiros pioneiros. Acesso completo ao ecossistema AgroTech.',
    price: 300.0,
    billingCycle: 'MONTHLY',
    maxBranches: 5,
    maxUsers: 15,
    storageLimitGb: 20,
    pdfQuotaMonthly: 500,
    isActive: true,
  },
  {
    code: 'STANDARD_500',
    name: 'Plano Standard (Crescimento)',
    description: 'Plano comercial padrão para novas consultorias agronômicas em expansão regional.',
    price: 500.0,
    billingCycle: 'MONTHLY',
    maxBranches: 3,
    maxUsers: 8,
    storageLimitGb: 10,
    pdfQuotaMonthly: 200,
    isActive: true,
  },
  {
    code: 'PRO_800',
    name: 'Plano Enterprise / Pro',
    description: 'Plano corporativo para grandes consultorias com múltiplas filiais, alto volume de crédito e GED intensivo.',
    price: 800.0,
    billingCycle: 'MONTHLY',
    maxBranches: 10,
    maxUsers: 30,
    storageLimitGb: 50,
    pdfQuotaMonthly: 1000,
    isActive: true,
  },
]

export async function seedSubscriptionPlans() {
  console.log('🌱 Seeding Subscription Plans...')

  for (const plan of DEFAULT_PLANS) {
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { code: plan.code },
    })

    if (!existing) {
      await prisma.subscriptionPlan.create({
        data: plan,
      })
      console.log(`  ✅ Criado plano: ${plan.code} (R$ ${plan.price.toFixed(2)})`)
    } else {
      await prisma.subscriptionPlan.update({
        where: { code: plan.code },
        data: {
          name: plan.name,
          description: plan.description,
          price: plan.price,
          maxBranches: plan.maxBranches,
          maxUsers: plan.maxUsers,
          storageLimitGb: plan.storageLimitGb,
          pdfQuotaMonthly: plan.pdfQuotaMonthly,
          isActive: plan.isActive,
        },
      })
      console.log(`  🔄 Atualizado plano: ${plan.code}`)
    }
  }

  console.log('✅ Seed de Subscription Plans concluído com sucesso!')
}

if (require.main === module) {
  seedSubscriptionPlans()
    .catch((err) => {
      console.error('❌ Erro no seed de planos:', err)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
