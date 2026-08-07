import { UserForm } from '@/components/admin/users/UserForm'
import { Users as UsersIcon } from 'lucide-react'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function NewUserPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
          <UsersIcon className="h-8 w-8" />
          Novo Utilizador
        </h1>
        <p className="text-muted-foreground mt-2">
          Adicione uma nova conta e defina os seus acessos.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <UserForm branches={branches} />
      </div>
    </div>
  )
}
