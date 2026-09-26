import { UserForm } from '@/components/admin/users/UserForm'
import { Users as UsersIcon, ArrowLeft } from 'lucide-react'
import { getUserContext } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'

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
      <PageHeaderBanner
        badge="Controle de Acessos • Gestão de Usuários"
        badgeIcon={<UsersIcon className="h-4 w-4 shrink-0 text-emerald-300" />}
        title={`Editar: ${userToEdit.fullName || userToEdit.email}`}
        description="Atualize os dados, cargos e acessos do utilizador."
        actions={
          <Link href="/admin/users">
            <Button
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar aos Usuários
            </Button>
          </Link>
        }
      />

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <UserForm initialData={userToEdit} branches={branches} />
      </div>
    </div>
  )
}
