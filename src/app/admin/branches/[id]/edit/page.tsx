import { BranchForm } from '@/components/admin/branches/BranchForm'
import { Building2 } from 'lucide-react'
import { getUserContext } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function EditBranchPage({ params }: { params: Promise<{ id: string }> }) {
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }

  if (dbUser.role !== 'OWNER' && dbUser.role !== 'SUPER_ADMIN') {
    redirect('/admin')
  }

  const resolvedParams = await params
  
  const branch = await prisma.branch.findUnique({
    where: { 
      id: resolvedParams.id,
      deletedAt: null 
    }
  })

  if (!branch) {
    redirect('/admin/branches')
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          Editar Filial
        </h1>
        <p className="text-muted-foreground mt-2">
          Atualize as informações da filial selecionada.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <BranchForm initialData={branch} />
      </div>
    </div>
  )
}
