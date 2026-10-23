import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Semeando módulos globais padrão...')

  const modulesToSeed = [
    {
      code: 'CRM',
      name: 'CRM & Cadastros',
      description: 'Gestão de Produtores, Propriedades e Relacionamento.',
      isActive: true,
    },
    {
      code: 'GED',
      name: 'Gestão de Documentos',
      description: 'Armazenamento de Ficheiros, Pastas Virtuais e Alertas de Validade.',
      isActive: true,
    },
    {
      code: 'FINANCIAL_SUMMARY',
      name: 'Resumo Financeiro (CRM)',
      description: 'Análise de fluxo de caixa, receitas, despesas e capacidade de pagamento no levantamento patrimonial do CRM.',
      isActive: true,
    },
    {
      code: 'CREDIT_LIMIT',
      name: 'Limite de Crédito',
      description: 'Cálculo de limites de crédito rural, dimensionamento por capacidade de pagamento, simulações MCR e Ficha Cadastral BB.',
      isActive: true,
    },
    {
      code: 'DEMANDS',
      name: 'Serviços & Demandas',
      description: 'Gestão de ordens de serviço rurais, fluxo visual de 4 estados, esteira de auditoria/rastreabilidade, controle de prazos/SLA e checklist documental do GED.',
      isActive: false,
    },
    {
      code: 'FINANCIAL_ERP',
      name: 'Módulo de Gestão Financeira (ERP)',
      description: 'Contas a pagar e receber, conciliação, livro-caixa, trava de comissões e DRE da safra.',
      isActive: true,
    }
  ]

  for (const mod of modulesToSeed) {
    const exists = await prisma.systemModule.findUnique({
      where: { code: mod.code }
    })
    
    if (!exists) {
      await prisma.systemModule.create({
        data: mod
      })
      console.log(`Módulo ${mod.code} criado.`)
    } else {
      await prisma.systemModule.update({
        where: { code: mod.code },
        data: {
          name: mod.name,
          description: mod.description,
        }
      })
      console.log(`Módulo ${mod.code} atualizado.`)
    }
  }

  console.log('Processo finalizado.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
