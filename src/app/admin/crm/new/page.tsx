import { Tractor, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ProducerMultiStepForm from '@/components/crm/ProducerMultiStepForm'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'

export default async function NewProducerPage() {
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }
  
  if (!dbUser || !dbUser.organizationId) {
    return <div>Organização não encontrada.</div>
  }

  let userBranches: any[] = []

  if (dbUser.role === 'OWNER' || dbUser.role === 'ADMIN') {
    // Owners e Admins vêm todas as filiais da organização
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
      <PageHeaderBanner
        badge="CRM & Carteira de Clientes"
        badgeIcon={<Tractor className="h-4 w-4 shrink-0 text-emerald-300" />}
        title="Novo Produtor Rural"
        description="Preencha os dados abaixo para cadastrar um novo cliente na plataforma."
        actions={
          <Link href="/admin/crm">
            <Button
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar ao CRM
            </Button>
          </Link>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <ProducerMultiStepForm branches={userBranches} />
      </div>
    </div>
  )
}
