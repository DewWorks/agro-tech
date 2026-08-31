import { UserForm } from '@/components/admin/users/UserForm'
import { Users as UsersIcon } from 'lucide-react'
import { ArrowLeft, Edit } from 'lucide-react'
import { getUserContext } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }
  if (!dbUser || !dbUser.organizationId) {
    return <div>Organização não encontrada.</div>
  }

  const userToEdit = await prisma.user.findUnique({
    where: { id: resolvedParams.id },
    include: {
      userBranches: true
    }
  })

  if (!userToEdit || userToEdit.organizationId !== dbUser.organizationId) {
    redirect('/admin/users')
  }

  // Buscar todas as filiais ativas desta organização (para os checkboxes)
  const branches = await prisma.branch.findMany({
    where: { 
      organizationId: dbUser.organizationId,
      isActive: true
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
          <UsersIcon className="h-8 w-8" />
          Editar Utilizador
        </h1>
        <p className="text-muted-foreground mt-2">
          Atualize os dados, cargos e acessos do utilizador.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <UserForm initialData={userToEdit} branches={branches} />
      </div>
    </div>
  )
}
