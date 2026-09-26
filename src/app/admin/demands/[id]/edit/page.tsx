import React from 'react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { getDemandById } from '@/actions/demands'
import { EditDemandForm } from '@/components/demands/EditDemandForm'
import { ClipboardList, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'

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
      <PageHeaderBanner
        badge={`Demanda #${demand.id.slice(-6).toUpperCase()}`}
        badgeIcon={<ClipboardList className="h-4 w-4 shrink-0 text-emerald-300" />}
        title="Edição de Demanda Rural"
        description="Altere informações de cadastro, prazos, responsável ou especificações técnicas."
        actions={
          <Link href={`/admin/demands/${demand.id}`}>
            <Button
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar aos Detalhes
            </Button>
          </Link>
        }
      />

      <EditDemandForm
        demand={demand}
        properties={properties}
        branches={branches}
        users={rawUsers}
      />
    </div>
  )
}
