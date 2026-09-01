import { Settings2 } from 'lucide-react'
import { ModuleForm } from '@/components/admin/modules/ModuleForm'

export default function NewModulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
          <Settings2 className="h-8 w-8" />
          Novo Módulo Global
        </h1>
        <p className="text-muted-foreground mt-2">
          Cadastre um novo módulo para o ecossistema. As organizações poderão ativá-lo ou desativá-lo posteriormente.
        </p>
      </div>

      <ModuleForm />
    </div>
  )
}
