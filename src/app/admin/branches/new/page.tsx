import { BranchForm } from '@/components/admin/branches/BranchForm'
import { Building2, ArrowLeft } from 'lucide-react'
import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'

export default async function NewBranchPage() {
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }

  if (dbUser.role !== 'OWNER' && dbUser.role !== 'SUPER_ADMIN') {
    redirect('/admin')
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeaderBanner
        badge="Configurações Corporativas • Filiais"
        badgeIcon={<Building2 className="h-4 w-4 shrink-0 text-emerald-300" />}
        title="Nova Filial"
        description="Adicione uma nova unidade à sua organização."
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
        <BranchForm />
      </div>
    </div>
  )
}
