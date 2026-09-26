import { BranchForm } from '@/components/admin/branches/BranchForm'
import { Building2, ArrowLeft } from 'lucide-react'
import { getUserContext } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'

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
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeaderBanner
        badge="Configurações Corporativas • Filiais"
        badgeIcon={<Building2 className="h-4 w-4 shrink-0 text-emerald-300" />}
        title={`Editar Filial: ${branch.name}`}
        description="Atualize as informações da filial selecionada."
        actions={
          <Link href="/admin/branches">
            <Button
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar
            </Button>
          </Link>
        }
      />

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <BranchForm initialData={branch} />
      </div>
    </div>
  )
}
