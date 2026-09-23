import { Tractor, ClipboardList, Plus } from 'lucide-react'
import Link from 'next/link'
import ProducerMultiStepForm from '@/components/crm/ProducerMultiStepForm'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'

export default async function EditProducerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  const demandsCount = await prisma.serviceDemand.count({
    where: { producerId: id }
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
            <Tractor className="h-8 w-8" />
            Editar Produtor Rural
          </h1>
          <p className="text-muted-foreground mt-2">
            Atualize os dados do cliente selecionado.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/admin/demands?search=${encodeURIComponent(producer.name)}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
          >
            <ClipboardList className="w-4 h-4 text-emerald-600" />
            <span>Demandas ({demandsCount})</span>
          </Link>
          <Link
            href={`/admin/demands/new?producerId=${producer.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Demanda</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <ProducerMultiStepForm branches={userBranches} initialData={producer} />
      </div>
    </div>
  )
}
