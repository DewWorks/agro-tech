import { Settings2 } from 'lucide-react'
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
          <Settings2 className="h-8 w-8" />
          Editar Módulo: {module.name}
        </h1>
        <p className="text-muted-foreground mt-2">
          Atualize os detalhes ou o status deste módulo global.
        </p>
      </div>

      <ModuleForm initialData={module} />
    </div>
  )
}
