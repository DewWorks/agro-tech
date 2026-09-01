'use client'

import { usePathname } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'

export default function ModuleWarningBanner({
  realRole,
  clientModules,
  globalModules
}: {
  realRole: string
  clientModules: string[]
  globalModules: { code: string; isActive: boolean }[]
}) {
  const pathname = usePathname()

  if (realRole !== 'SUPER_ADMIN') return null

  let currentModuleCode: string | null = null
  if (pathname.startsWith('/admin/crm')) currentModuleCode = 'CRM'
  if (pathname.startsWith('/admin/ged')) currentModuleCode = 'GED'

  if (!currentModuleCode) return null

  const isGloballyActive = globalModules.find(m => m.code === currentModuleCode)?.isActive ?? true
  const isClientActive = clientModules.includes(currentModuleCode)

  if (isGloballyActive && isClientActive) return null

  return (
    <div className="bg-red-500 text-white px-6 py-2 text-sm font-medium flex items-center gap-2 shadow-sm z-40">
      <AlertTriangle className="h-4 w-4" />
      <span>
        <strong>Atenção:</strong> Este módulo está 
        {!isGloballyActive ? ' DESATIVADO GLOBALMENTE' : ' DESATIVADO PARA ESTE CLIENTE'}. 
        Estás a visualizá-lo apenas por seres Super Admin. Utilizadores normais não têm acesso.
      </span>
    </div>
  )
}
