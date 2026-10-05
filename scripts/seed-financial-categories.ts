import { PrismaClient, FinancialCategoryType, BankAccountType } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const DEFAULT_CATEGORIES: Array<{
  code: string
  name: string
  type: FinancialCategoryType
  isDirectProjectCost: boolean
}> = [
  // ==========================================
  // RECEITAS OPERACIONAIS
  // ==========================================
  {
    code: '1.1.01',
    name: 'Honorários de Crédito Rural',
    type: FinancialCategoryType.RECEITA,
    isDirectProjectCost: false,
  },
  {
    code: '1.1.02',
    name: 'Regularização Ambiental (CAR/AUI)',
    type: FinancialCategoryType.RECEITA,
    isDirectProjectCost: false,
  },
  {
    code: '1.1.03',
    name: 'Laudos de Avaliação Patrimonial',
    type: FinancialCategoryType.RECEITA,
    isDirectProjectCost: false,
  },
  {
    code: '1.1.04',
    name: 'Consultoria Agronômica e Projetos',
    type: FinancialCategoryType.RECEITA,
    isDirectProjectCost: false,
  },

  // ==========================================
  // DESPESAS - CUSTOS DIRETOS DE PROJETO
  // ==========================================
  {
    code: '2.1.01',
    name: 'Taxas de ART junto ao CREA-TO',
    type: FinancialCategoryType.DESPESA,
    isDirectProjectCost: true,
  },
  {
    code: '2.1.02',
    name: 'Combustível e Vistoria de Campo',
    type: FinancialCategoryType.DESPESA,
    isDirectProjectCost: true,
  },
  {
    code: '2.1.03',
    name: 'Emolumentos Cartorários e Certidões',
    type: FinancialCategoryType.DESPESA,
    isDirectProjectCost: true,
  },
  {
    code: '2.1.04',
    name: 'Comissões Comerciais de Parceiros',
    type: FinancialCategoryType.DESPESA,
    isDirectProjectCost: true,
  },

  // ==========================================
  // DESPESAS - CUSTOS FIXOS OPERACIONAIS
  // ==========================================
  {
    code: '2.2.01',
    name: 'Aluguel e Condomínio',
    type: FinancialCategoryType.DESPESA,
    isDirectProjectCost: false,
  },
  {
    code: '2.2.02',
    name: 'Energia, Água e Internet',
    type: FinancialCategoryType.DESPESA,
    isDirectProjectCost: false,
  },
  {
    code: '2.2.03',
    name: 'Folha Operacional e Pró-labore',
    type: FinancialCategoryType.DESPESA,
    isDirectProjectCost: false,
  },
  {
    code: '2.2.04',
    name: 'Despesas Administrativas Gerais e TI',
    type: FinancialCategoryType.DESPESA,
    isDirectProjectCost: false,
  },
]

async function main() {
  console.log('--- Iniciando Seeding do Módulo Financeiro (Aditivo 004) ---')

  const organizations = await prisma.organization.findMany({
    include: {
      branches: true,
    },
  })

  if (organizations.length === 0) {
    console.log('Nenhuma organização encontrada. Pulando seeding.')
    return
  }

  for (const org of organizations) {
    console.log(`\nProcessando Organização: ${org.name} (${org.id})`)

    // 0. Ativação do Módulo FINANCIAL_ERP
    if (!org.modules.includes('FINANCIAL_ERP')) {
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          modules: [...org.modules, 'FINANCIAL_ERP'],
        },
      })
      console.log(`  [+] Módulo FINANCIAL_ERP ativado na organização ${org.name}.`)
    }

    // 1. Configurações Globais da Organização
    const existingSettings = await prisma.financialSettings.findUnique({
      where: { organizationId: org.id },
    })

    if (!existingSettings) {
      await prisma.financialSettings.create({
        data: {
          organizationId: org.id,
          defaultSuccessFeePercent: 2.0,
          defaultPartnerCommissionPercent: 20.0,
          defaultFieldSurveyCostPerKm: 2.5,
        },
      })
      console.log('  [+] FinancialSettings criado com defaults contratuais (2% êxito, 20% parceiro, R$ 2,50/km).')
    } else {
      console.log('  [=] FinancialSettings já configurado.')
    }

    // 2. Plano de Contas / Categorias Financeiras
    for (const cat of DEFAULT_CATEGORIES) {
      const existingCat = await prisma.financialCategory.findUnique({
        where: {
          organizationId_code: {
            organizationId: org.id,
            code: cat.code,
          },
        },
      })

      if (!existingCat) {
        await prisma.financialCategory.create({
          data: {
            organizationId: org.id,
            code: cat.code,
            name: cat.name,
            type: cat.type,
            isDirectProjectCost: cat.isDirectProjectCost,
            isActive: true,
          },
        })
        console.log(`  [+] Categoria criada: [${cat.code}] ${cat.name}`)
      } else {
        console.log(`  [=] Categoria já existente: [${cat.code}] ${cat.name}`)
      }
    }

    // 3. Parâmetros e Contas por Filial
    for (const branch of org.branches) {
      console.log(`  -> Filial: ${branch.name} (${branch.city}-${branch.state})`)

      // 3.1 Branch Settings
      const existingBranchSettings = await prisma.financialBranchSettings.findUnique({
        where: { branchId: branch.id },
      })

      if (!existingBranchSettings) {
        await prisma.financialBranchSettings.create({
          data: {
            branchId: branch.id,
            monthlyFixedCostTarget: 15000.0,
            monthlyRevenueTarget: 60000.0,
            activeCropYear: '2025/2026',
            notes: `Configurações financeiras da unidade ${branch.name}.`,
          },
        })
        console.log(`    [+] FinancialBranchSettings inicializado para safra 2025/2026.`)
      }

      // 3.2 Contas Bancárias / Caixa Físico
      const existingAccounts = await prisma.bankAccount.findMany({
        where: { branchId: branch.id },
      })

      if (existingAccounts.length === 0) {
        // Criar Caixa Físico em espécie
        await prisma.bankAccount.create({
          data: {
            branchId: branch.id,
            bankCode: 'CAIXA_FISICO',
            bankName: `Caixa Físico — ${branch.name}`,
            accountType: BankAccountType.CAIXA_ESPECIE,
            initialBalance: 0,
            currentBalance: 0,
            isActive: true,
          },
        })

        // Criar Conta Bancária Principal (Banco do Brasil ou Sicredi conforme filial)
        const isBB = branch.city.toLowerCase().includes('ponte alta')
        await prisma.bankAccount.create({
          data: {
            branchId: branch.id,
            bankCode: isBB ? '001' : '748',
            bankName: isBB ? 'Banco do Brasil S.A.' : 'Banco Cooperativo Sicredi',
            agency: isBB ? '1234-5' : '5678',
            accountNumber: isBB ? '98765-4' : '12345-6',
            accountType: BankAccountType.CORRENTE,
            initialBalance: 0,
            currentBalance: 0,
            isActive: true,
          },
        })
        console.log(`    [+] Contas de tesouraria criadas (Caixa Físico + Conta Corrente Principal).`)
      }
    }
  }

  console.log('\n--- Seeding do Módulo Financeiro finalizado com sucesso! ---')
}

main()
  .catch((e) => {
    console.error('Erro durante o seeding financeiro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
