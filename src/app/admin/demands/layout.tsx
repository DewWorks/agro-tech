import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { AlertCircle, Lock } from 'lucide-react'
import Link from 'next/link'

export default async function DemandsLayout({ children }: { children: React.ReactNode }) {
  const userContext = await getUserContext()

  if (!userContext) {
    redirect('/login')
  }

  // Super Admin tem acesso irrestrito para homologação e auditoria
  if (userContext.realRole === 'SUPER_ADMIN') {
    return <>{children}</>
  }

  // Verifica status global do módulo DEMANDS
  const globalModule = await prisma.systemModule.findUnique({
    where: { code: 'DEMANDS' },
  })

  const isGloballyActive = globalModule?.isActive ?? false
  const isOrgActive = userContext.organization?.modules?.includes('DEMANDS') ?? false

  if (!isGloballyActive || !isOrgActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Módulo de Serviços & Demandas Indisponível
        </h2>
        <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
          {!isGloballyActive
            ? 'Este módulo encontra-se em fase de homologação técnica ou desativado globalmente pelo Super Administrador.'
            : 'Sua organização ainda não possui o módulo de Serviços & Demandas contratado ou ativo.'}
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
        >
          Voltar para o Dashboard
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
