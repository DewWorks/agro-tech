import { Tractor } from 'lucide-react'
import ProducerMultiStepForm from '@/components/crm/ProducerMultiStepForm'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

export default async function EditProducerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const dbUser = await prisma.user.findUnique({ 
    where: { id: user.id },
    include: {
      userBranches: {
        include: { branch: true }
      }
    }
  })
  
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
      where: { organizationId: dbUser.organizationId, isActive: true },
      orderBy: { name: 'asc' }
    })
  } else {
    userBranches = dbUser.userBranches.map(ub => ub.branch).filter(b => b.isActive)
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
