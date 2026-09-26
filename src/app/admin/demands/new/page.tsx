import React from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { NewDemandForm } from '@/components/demands/NewDemandForm'
import { ClipboardList, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'

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
      <PageHeaderBanner
        badge="Hub de Demandas & Ordens Técnicas"
        badgeIcon={<ClipboardList className="h-4 w-4 shrink-0 text-emerald-300" />}
        title="Abertura de Nova Demanda Rural"
        description="Cadastre uma nova ordem de serviço técnico, projeto de crédito ou solicitação ambiental."
        actions={
          <Link href="/admin/demands">
            <Button
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar ao Hub
            </Button>
          </Link>
        }
      />

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
