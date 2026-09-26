import { Tractor, ClipboardList, Plus } from 'lucide-react'
import Link from 'next/link'
import ProducerMultiStepForm from '@/components/crm/ProducerMultiStepForm'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { getDemands } from '@/actions/demands'
import { redirect, notFound } from 'next/navigation'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'

export default async function EditProducerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }

  if (!dbUser || !dbUser.organizationId) {
    return <div>Organização não encontrada.</div>
  }

  const producer = await prisma.producer.findUnique({
    where: { id },
    include: { 
      branch: true,
      properties: {
        include: { 
          property: {
            include: {
              branch: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!producer || producer.branch.organizationId !== dbUser.organizationId) {
    notFound()
  }

  let userBranches: any[] = []

  if (dbUser.role === 'OWNER' || dbUser.role === 'ADMIN') {
    userBranches = await prisma.branch.findMany({
      where: { organizationId: dbUser.organizationId },
      orderBy: { name: 'asc' }
    })
  } else {
    // Operators só vêem as filiais às quais foram associados
    const userBranchesData = await prisma.userBranch.findMany({
      where: { userId: dbUser.id },
      include: { branch: true }
    })
    userBranches = userBranchesData.map(ub => ub.branch)
  }

  // Busca demandas vinculadas a este produtor
  const demandsRes = await getDemands({ producerId: id, includeCancelled: true })
  const demands = demandsRes.success ? (demandsRes.demands as any[]) : []
  const initialTab = resolvedSearchParams.tab === 'demands' ? 'DEMANDAS' : 'DADOS'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeaderBanner
        badge={`CRM • Filial: ${producer.branch?.name || 'Geral'}`}
        badgeIcon={<Tractor className="h-4 w-4 shrink-0 text-emerald-300" />}
        title={`Editar: ${producer.name}`}
        description="Atualize os dados do cliente selecionado, gerencie documentos e acompanhe demandas ativas."
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              href={`/admin/crm/${producer.id}/edit?tab=demands`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all shadow-xs"
            >
              <ClipboardList className="w-4 h-4 text-emerald-300" />
              <span>Demandas ({demands.length})</span>
            </Link>
            <Link
              href={`/admin/demands/new?producerId=${producer.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#1B4D3E] hover:bg-emerald-50 text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nova Demanda</span>
            </Link>
          </div>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <ProducerMultiStepForm
          branches={userBranches}
          initialData={producer}
          demands={demands}
          initialTab={initialTab}
        />
      </div>
    </div>
  )
}
