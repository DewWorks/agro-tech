import React from 'react'
import prisma from '@/lib/prisma'
import { requireFinancialAuth } from '@/lib/financial/auth-guard'
import NewReceivableClientForm from '@/components/financial/NewReceivableClientForm'

export const metadata = {
  title: 'Novo Faturamento Avulso | AgroTech Financeiro',
  description: 'Emissão direta de faturamento avulso de pacotes CAR, AUI e licenças ambientais.',
}

export default async function NewReceivablePage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>
}) {
  const resolvedParams = await searchParams
  const branchId = resolvedParams.branchId || null
  const auth = await requireFinancialAuth(branchId)

  // Filiais ativas
  const branches = await prisma.branch.findMany({
    where: {
      organizationId: auth.organizationId,
      isActive: true,
      ...(auth.isGlobalView ? {} : { id: auth.effectiveBranchId! }),
    },
    select: {
      id: true,
      name: true,
      city: true,
    },
    orderBy: { name: 'asc' },
  })

  // Produtores da organização
  const rawProducers = await prisma.producer.findMany({
    where: {
      branch: {
        organizationId: auth.organizationId,
        ...(auth.isGlobalView ? {} : { id: auth.effectiveBranchId! }),
      },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      document: true,
      properties: {
        select: {
          property: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  const producers = rawProducers.map((p) => ({
    id: p.id,
    name: p.name,
    document: p.document,
    properties: p.properties.map((pp) => ({
      id: pp.property.id,
      name: pp.property.name,
    })),
  }))

  // Categorias de Receita
  const categories = await prisma.financialCategory.findMany({
    where: {
      organizationId: auth.organizationId,
      type: 'RECEITA',
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: { code: 'asc' },
  })

  // Parceiros Comerciais
  const partners = await prisma.commercialPartner.findMany({
    where: {
      branch: {
        organizationId: auth.organizationId,
        ...(auth.isGlobalView ? {} : { id: auth.effectiveBranchId! }),
      },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      defaultCommissionRate: true,
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Novo Faturamento Avulso / Pacotes Fechados
        </h2>
        <p className="text-xs text-slate-500">
          Emissão direta de títulos a receber para Regularização Ambiental, CAR, AUI e Laudos Técnicos.
        </p>
      </div>

      <NewReceivableClientForm
        branches={branches}
        producers={producers}
        categories={categories}
        partners={partners}
        defaultBranchId={auth.effectiveBranchId}
      />
    </div>
  )
}
