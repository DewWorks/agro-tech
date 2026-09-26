import { Settings2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'
import { ModuleForm } from '@/components/admin/modules/ModuleForm'

export default function NewModulePage() {
  return (
    <div className="space-y-6">
      <PageHeaderBanner
        badge="Ecossistema & Módulos"
        badgeIcon={<Settings2 className="h-4 w-4 shrink-0 text-emerald-300" />}
        title="Novo Módulo Global"
        description="Cadastre um novo módulo para o ecossistema. As organizações poderão ativá-lo ou desativá-lo posteriormente."
        actions={
          <Link href="/admin/modules">
            <Button
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar aos Módulos
            </Button>
          </Link>
        }
      />

      <ModuleForm />
    </div>
  )
}
