import { Settings2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'
import { ModuleForm } from '@/components/admin/modules/ModuleForm'
import { getSystemModuleById } from '@/actions/modules'
import { notFound } from 'next/navigation'

export default async function EditModulePage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params
  const module = await getSystemModuleById(resolvedParams.id)

  if (!module) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeaderBanner
        badge="Ecossistema & Módulos"
        badgeIcon={<Settings2 className="h-4 w-4 shrink-0 text-emerald-300" />}
        title={`Editar Módulo: ${module.name}`}
        description="Atualize os detalhes ou o status deste módulo global."
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

      <ModuleForm initialData={module} />
    </div>
  )
}
