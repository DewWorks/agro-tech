import { OrganizationForm } from '@/components/admin/organizations/OrganizationForm'
import { Building2 } from 'lucide-react'

export default function NewOrganizationPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          Nova Organização / Cliente
        </h1>
        <p className="text-muted-foreground mt-2">
          Cadastre um novo cliente no sistema. Isto irá criar a Organização e o utilizador Administrador principal (OWNER).
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <OrganizationForm />
      </div>
    </div>
  )
}
