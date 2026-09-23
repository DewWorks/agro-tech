'use client'

import React, { useOptimistic, useTransition, useState } from 'react'
import { DemandCard, DemandCardData } from './DemandCard'
import { updateDemandStatus } from '@/actions/demands'
import { DemandStatusCode } from '@/lib/validations/demands'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Inbox,
  PlayCircle,
  FileClock,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react'

interface ColumnDef {
  status: DemandStatusCode
  title: string
  icon: any
  badgeClass: string
  borderClass: string
  bgClass: string
  headerBg: string
}

const COLUMNS: ColumnDef[] = [
  {
    status: 'SOLICITADO',
    title: 'Solicitado',
    icon: Inbox,
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    borderClass: 'border-blue-200/80',
    bgClass: 'bg-blue-50/20',
    headerBg: 'bg-blue-50/80 text-blue-900',
  },
  {
    status: 'EM_EXECUCAO',
    title: 'Em Execução',
    icon: PlayCircle,
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    borderClass: 'border-purple-200/80',
    bgClass: 'bg-purple-50/20',
    headerBg: 'bg-purple-50/80 text-purple-900',
  },
  {
    status: 'AGUARDANDO_DOCUMENTACAO',
    title: 'Aguardando Docs',
    icon: FileClock,
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    borderClass: 'border-amber-200/80',
    bgClass: 'bg-amber-50/20',
    headerBg: 'bg-amber-50/80 text-amber-900',
  },
  {
    status: 'CONCLUIDO',
    title: 'Concluído',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    borderClass: 'border-emerald-200/80',
    bgClass: 'bg-emerald-50/20',
    headerBg: 'bg-emerald-50/80 text-emerald-900',
  },
]

interface DemandKanbanBoardProps {
  initialDemands: DemandCardData[]
  onRefresh?: () => void
}

export function DemandKanbanBoard({ initialDemands, onRefresh }: DemandKanbanBoardProps) {
  const [isPending, startTransition] = useTransition()
  const [draggedDemandId, setDraggedDemandId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<DemandStatusCode | null>(null)

  // Hook otimista do React 19 para atualização visual instantânea
  const [optimisticDemands, setOptimisticDemands] = useOptimistic(
    initialDemands,
    (state, update: { demandId: string; targetStatus: DemandStatusCode }) => {
      return state.map((d) => (d.id === update.demandId ? { ...d, status: update.targetStatus } : d))
    }
  )

  const handleMoveDemand = (demandId: string, targetStatus: DemandStatusCode) => {
    const demandToMove = optimisticDemands.find((d) => d.id === demandId)
    if (!demandToMove || demandToMove.status === targetStatus) return

    // Se estiver reabrindo concluída, avisa que deve usar a central ou botão com justificativa
    if (demandToMove.status === 'CONCLUIDO') {
      toast.info('Para reabrir demandas concluídas, utilize a Central da Demanda com justificativa técnica.')
      return
    }

    startTransition(async () => {
      // 1. Atualização Otimista Imediata (<16ms)
      setOptimisticDemands({ demandId, targetStatus })

      try {
        // 2. Transação atômica no backend
        const res = await updateDemandStatus(demandId, targetStatus)
        if (!res.success) {
          throw new Error(typeof res.error === 'string' ? res.error : 'Erro ao atualizar status')
        }
        toast.success(`Demanda movida para "${targetStatus}".`)
        if (onRefresh) onRefresh()
      } catch (err: any) {
        // 3. Rollback automático gerenciado pelo useOptimistic
        toast.error(err.message || 'Falha na transição de status. Revertendo ação.')
        if (onRefresh) onRefresh()
      }
    })
  }

  // Drag and Drop Nativo
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    setDraggedDemandId(id)
  }

  const handleDragOver = (e: React.DragEvent, status: DemandStatusCode) => {
    e.preventDefault()
    if (dragOverColumn !== status) {
      setDragOverColumn(status)
    }
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, targetStatus: DemandStatusCode) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain') || draggedDemandId
    setDraggedDemandId(null)
    setDragOverColumn(null)

    if (id) {
      handleMoveDemand(id, targetStatus)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
      {COLUMNS.map((col) => {
        const columnDemands = optimisticDemands.filter((d) => d.status === col.status)
        const isHovered = dragOverColumn === col.status
        const Icon = col.icon

        return (
          <div
            key={col.status}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.status)}
            className={cn(
              'flex flex-col rounded-2xl border transition-all duration-200 min-h-[500px]',
              col.borderClass,
              col.bgClass,
              isHovered && 'ring-2 ring-emerald-500/50 bg-emerald-50/30'
            )}
          >
            {/* Cabeçalho da Coluna */}
            <div
              className={cn(
                'p-3.5 rounded-t-2xl border-b flex items-center justify-between gap-2 shadow-2xs',
                col.headerBg,
                col.borderClass
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 opacity-80" />
                <h3 className="font-bold text-xs uppercase tracking-wider">{col.title}</h3>
              </div>

              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-bold border shadow-2xs',
                  col.badgeClass
                )}
              >
                {columnDemands.length}
              </span>
            </div>

            {/* Lista de Cards da Coluna */}
            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
              {columnDemands.length === 0 ? (
                <div className="h-32 rounded-xl border border-dashed border-slate-200/80 flex flex-col items-center justify-center text-center p-4 text-xs text-slate-400">
                  <Layers className="w-6 h-6 mb-1 opacity-40" />
                  <span>Nenhuma demanda nesta etapa</span>
                </div>
              ) : (
                columnDemands.map((demand) => (
                  <div
                    key={demand.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, demand.id)}
                    className="cursor-grab active:cursor-grabbing transition-transform"
                  >
                    <DemandCard
                      demand={demand}
                      onMoveStatus={handleMoveDemand}
                      onRefresh={onRefresh}
                      isDragging={draggedDemandId === demand.id}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
