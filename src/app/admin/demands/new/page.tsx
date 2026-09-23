import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { NewDemandForm } from '@/components/demands/NewDemandForm'
import { ClipboardList } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface NewDemandPageProps {
  searchParams: Promise<{
    producerId?: string
    propertyId?: string
  }>
}

export default async function NewDemandPage(props: NewDemandPageProps) {
  const searchParams = await props.searchParams
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }

  const organizationId = dbUser.organizationId

  // Carrega filiais ativas da organização
  const branches = await prisma.branch.findMany({
    where: {
      ...(organizationId ? { organizationId } : {}),
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  })

  // Carrega produtores com suas propriedades atreladas e respectiva filial
  const rawProducers = await prisma.producer.findMany({
    where: {
      ...(organizationId ? { branch: { organizationId } } : {}),
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      document: true,
      branchId: true,
      branch: {
        select: {
          id: true,
          name: true,
        },
      },
      properties: {
        select: {
          property: {
            select: {
              id: true,
              name: true,
              propertyName: true,
              city: true,
              state: true,
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
    branchId: p.branchId,
    branchName: p.branch?.name || null,
    properties: p.properties.map((pp) => ({
      id: pp.property.id,
      name: pp.property.name || pp.property.propertyName || 'Fazenda sem nome',
      city: pp.property.city,
      state: pp.property.state,
    })),
  }))

  // Carrega operadores/técnicos da organização para atribuição de responsável
  const rawUsers = await prisma.user.findMany({
    where: {
      ...(organizationId ? { organizationId } : {}),
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
    },
    orderBy: { fullName: 'asc' },
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            Abertura de Nova Demanda Rural
          </h1>
          <p className="text-muted-foreground mt-2">
            Cadastre uma nova ordem de serviço técnico, projeto de crédito ou solicitação ambiental.
          </p>
        </div>
      </div>

      <NewDemandForm
        producers={producers}
        branches={branches}
        users={rawUsers}
        defaultProducerId={searchParams.producerId}
        defaultPropertyId={searchParams.propertyId}
      />
    </div>
  )
}
