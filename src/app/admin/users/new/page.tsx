import { UserForm } from '@/components/admin/users/UserForm'
import { Users as UsersIcon, ArrowLeft } from 'lucide-react'
import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'
import prisma from '@/lib/prisma'

export default async function NewUserPage() {
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }
  if (!dbUser || !dbUser.organizationId) {
    return <div>Organização não encontrada.</div>
  }

  // Buscar todas as filiais ativas desta organização
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
        title="Novo Utilizador"
        description="Adicione uma nova conta e defina os seus acessos."
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
        <UserForm branches={branches} />
      </div>
    </div>
  )
}
