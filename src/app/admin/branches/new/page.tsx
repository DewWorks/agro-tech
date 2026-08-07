import { BranchForm } from '@/components/admin/branches/BranchForm'
import { Building2 } from 'lucide-react'

export default function NewBranchPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          Nova Filial
        </h1>
        <p className="text-muted-foreground mt-2">
          Adicione uma nova unidade à sua organização.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <BranchForm />
      </div>
    </div>
  )
}
