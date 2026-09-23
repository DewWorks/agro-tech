import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { NewDemandForm } from '@/components/demands/NewDemandForm'

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

  // Carrega produtores com suas propriedades atreladas
  const rawProducers = await prisma.producer.findMany({
    where: {
      ...(organizationId ? { branch: { organizationId } } : {}),
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Abertura de Nova Demanda Rural
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Cadastre uma nova ordem de serviço técnico, projeto de crédito ou solicitação ambiental.
        </p>
      </div>

      <NewDemandForm
        producers={producers}
        users={rawUsers}
        defaultProducerId={searchParams.producerId}
        defaultPropertyId={searchParams.propertyId}
      />
    </div>
  )
}
