'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, Undo2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DemandCancelledEmptyStateProps {
  currentView?: string
  currentSearch?: string
  currentServiceType?: string
  currentBranchId?: string
  currentSlaFilter?: string
  isPending?: boolean
  onReturnToActive?: () => void
  onReset?: () => void
}

export function DemandCancelledEmptyState({
  currentView = 'kanban',
  currentSearch = '',
  currentServiceType,
  currentBranchId,
  currentSlaFilter,
  isPending: externalIsPending = false,
  onReturnToActive,
  onReset,
}: DemandCancelledEmptyStateProps) {
  const router = useRouter()
  const [internalIsPending, setInternalIsPending] = useState(false)
  const isPending = externalIsPending || internalIsPending

  const handleReturnToActive = () => {
    if (onReturnToActive) {
      onReturnToActive()
      return
    }
    if (onReset) {
      onReset()
      return
    }
    setInternalIsPending(true)
    const params = new URLSearchParams()
    if (currentView) params.set('view', currentView)
    if (currentSearch.trim()) params.set('search', currentSearch.trim())
    if (currentServiceType && currentServiceType !== 'ALL') {
      params.set('serviceType', currentServiceType)
    }
    if (currentBranchId && currentBranchId !== 'ALL') {
      params.set('branchId', currentBranchId)
    }
    if (currentSlaFilter && currentSlaFilter !== 'ALL') {
      params.set('slaFilter', currentSlaFilter)
    }
    // showCancelled é omitido para retornar às demandas ativas
    router.push(`/admin/demands?${params.toString()}`)
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-xl shadow-xs text-center my-6 animate-in fade-in duration-150">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-500">
        <Ban className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">Nenhuma demanda cancelada</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">
        Não existem ordens de serviço arquivadas ou canceladas para os filtros selecionados.
      </p>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={handleReturnToActive}
        className="mt-4 text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
      >
        {isPending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Retornando...</span>
          </>
        ) : (
          <>
            <Undo2 className="w-3.5 h-3.5" />
            <span>Voltar para Demandas Ativas</span>
          </>
        )}
      </Button>
    </div>
  )
}
