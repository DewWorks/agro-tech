import { Tractor } from 'lucide-react'
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
    include: { branch: true }
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
            <Tractor className="h-8 w-8" />
            Editar Produtor Rural
          </h1>
          <p className="text-muted-foreground mt-2">
            Atualize os dados do cliente selecionado.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <ProducerMultiStepForm branches={userBranches} initialData={producer} />
      </div>
    </div>
  )
}
