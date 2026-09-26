import { OrganizationForm } from '@/components/admin/organizations/OrganizationForm'
import { Building2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'

export default function NewOrganizationPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeaderBanner
        badge="Multi-Tenant • Gestão de Clientes"
        badgeIcon={<Building2 className="h-4 w-4 shrink-0 text-emerald-300" />}
        title="Nova Organização / Cliente"
        description="Cadastre um novo cliente no sistema. Isto irá criar a Organização e o utilizador Administrador principal (OWNER)."
        actions={
          <Link href="/admin/organizations">
            <Button
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar às Organizações
            </Button>
          </Link>
        }
      />

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <OrganizationForm />
      </div>
    </div>
  )
}
