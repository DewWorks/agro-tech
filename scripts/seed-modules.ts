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
      console.log(`Módulo ${mod.code} já existe.`)
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
