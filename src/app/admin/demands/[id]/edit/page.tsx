import React from 'react'
import { notFound, redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { getDemandById } from '@/actions/demands'
import { EditDemandForm } from '@/components/demands/EditDemandForm'
import { ClipboardList } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface EditDemandPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditDemandPage(props: EditDemandPageProps) {
  const { id } = await props.params
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }

  const result = await getDemandById(id)
  if (!result.success || !result.demand) {
    notFound()
  }

  const demand = result.demand
  const organizationId = dbUser.organizationId

  // Carrega fazendas do produtor vinculado à demanda
  const rawProducer = await prisma.producer.findUnique({
    where: { id: demand.producerId },
    select: {
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
  })

  const properties = (rawProducer?.properties || []).map((pp) => ({
    id: pp.property.id,
    name: pp.property.name || pp.property.propertyName || 'Fazenda sem nome',
    city: pp.property.city,
    state: pp.property.state,
  }))

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

  // Carrega operadores/técnicos da organização para atribuição
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
            Edição de Demanda Rural
          </h1>
          <p className="text-muted-foreground mt-2">
            Altere informações de cadastro, prazos, responsável ou especificações técnicas.
          </p>
        </div>
      </div>

      <EditDemandForm
        demand={demand}
        properties={properties}
        branches={branches}
        users={rawUsers}
      />
    </div>
  )
}
