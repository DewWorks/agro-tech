'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DemandCard, DemandCardData } from './DemandCard'
import { DemandCardSkeleton } from './DemandCardSkeleton'
import { updateDemandStatus } from '@/actions/demands'
import { DemandStatusCode, RURAL_SERVICES_CATALOG } from '@/lib/validations/demands'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Inbox,
  PlayCircle,
  FileClock,
  CheckCircle2,
  AlertCircle,
  Layers,
  FileText,
  X,
  MessageSquare,
  Loader2,
} from 'lucide-react'

function getDynamicPlaceholder(status: DemandStatusCode | null | undefined): string {
  switch (status) {
    case 'AGUARDANDO_DOCUMENTACAO':
      return 'Ex: Falta certidão de casamento atualizada do cartório de Taguatinga...'
    case 'CANCELADO':
      return 'Ex: Produtor desistiu da operação por questões de taxa bancária...'
    case 'CONCLUIDO':
      return 'Ex: Projeto protocolado e aprovado na agência do Banco do Brasil...'
    case 'EM_EXECUCAO':
      return 'Ex: Iniciada elaboração da planilha de custos e cronograma técnico...'
    default:
      return 'Adicione uma observação sobre o andamento do atendimento...'
  }
}

interface ColumnDef {
  status: DemandStatusCode
  title: string
  icon: any
  badgeClass: string
  borderClass: string
  bgClass: string
  headerBg: string
  accentBorder: string
}

const COLUMNS: ColumnDef[] = [
  {
    status: 'SOLICITADO',
    title: 'Solicitado',
    icon: Inbox,
    badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
    borderClass: 'border-slate-200/90',
    bgClass: 'bg-slate-50/70',
    headerBg: 'bg-slate-100 text-slate-700 border-slate-200',
    accentBorder: 'border-t-4 border-t-slate-400',
  },
  {
    status: 'EM_EXECUCAO',
    title: 'Em Execução',
    icon: PlayCircle,
    badgeClass: 'bg-slate-900 text-white border-slate-900',
    borderClass: 'border-slate-200/90',
    bgClass: 'bg-slate-50/70',
    headerBg: 'bg-slate-100 text-slate-950 font-bold border-slate-200',
    accentBorder: 'border-t-4 border-t-slate-900',
  },
  {
    status: 'AGUARDANDO_DOCUMENTACAO',
    title: 'Aguardando Docs',
    icon: FileClock,
    badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
    borderClass: 'border-slate-200/90',
    bgClass: 'bg-slate-50/70',
    headerBg: 'bg-amber-50 text-amber-900 border-amber-200/80',
    accentBorder: 'border-t-4 border-t-amber-400',
  },
  {
    status: 'CONCLUIDO',
    title: 'Concluído',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
    borderClass: 'border-slate-200/90',
    bgClass: 'bg-slate-50/70',
    headerBg: 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
    accentBorder: 'border-t-4 border-t-emerald-600',
  },
]

interface DemandKanbanBoardProps {
  initialDemands: DemandCardData[]
  onRefresh?: () => void
}

export function DemandKanbanBoard({ initialDemands, onRefresh }: DemandKanbanBoardProps) {
  const router = useRouter()
  const [demands, setDemands] = useState<DemandCardData[]>(initialDemands)
  const [draggedDemandId, setDraggedDemandId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<DemandStatusCode | null>(null)

  // Sincroniza estado caso os dados sejam atualizados pelo Server Component
  useEffect(() => {
    setDemands(initialDemands)
  }, [initialDemands])

  // Estado da Demanda em Trânsito (Exibe Skeleton na coluna de destino e loading na origem)
  const [movingDemand, setMovingDemand] = useState<{
    demandId: string
    sourceStatus: DemandStatusCode
    targetStatus: DemandStatusCode
    serviceTitle?: string
    producerName?: string
  } | null>(null)

  // Estado do Modal de Despacho ao Mover Cards
  const [pendingDispatch, setPendingDispatch] = useState<{
    demandId: string
    targetStatus: DemandStatusCode
    demandTitle?: string
  } | null>(null)
  const [dispatchNote, setDispatchNote] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Foco automático e listener de teclado global (Esc)
  useEffect(() => {
    if (!pendingDispatch) return

    const timer = setTimeout(() => {
      textareaRef.current?.focus()
    }, 50)

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setPendingDispatch(null)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [pendingDispatch])

  // Listener de atalhos no Textarea (Ctrl+Enter / Cmd+Enter e Esc)
  const handleModalKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!pendingDispatch) return
      const { demandId, targetStatus } = pendingDispatch
      const note = dispatchNote.trim() || null
      setPendingDispatch(null)
      handleMoveDemand(demandId, targetStatus, note)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setPendingDispatch(null)
    }
  }

  const handleMoveDemand = async (
    demandId: string,
    targetStatus: DemandStatusCode,
    notes?: string | null
  ) => {
    if (movingDemand) return

    const demandToMove = demands.find((d) => d.id === demandId)
    if (!demandToMove || demandToMove.status === targetStatus) return

    // Se estiver reabrindo concluída, avisa que deve usar a central ou botão com justificativa
    if (demandToMove.status === 'CONCLUIDO') {
      toast.info('Para reabrir demandas concluídas, utilize a Central da Demanda com justificativa técnica.')
      return
    }

    const serviceMeta = RURAL_SERVICES_CATALOG[demandToMove.serviceType]
    const serviceTitle =
      demandToMove.serviceType === 'OUTROS' && demandToMove.customServiceType
        ? demandToMove.customServiceType
        : serviceMeta?.label || demandToMove.serviceType

    // 1. Ativa imediatamente o Skeleton de Carregamento na coluna de destino
    setMovingDemand({
      demandId,
      sourceStatus: demandToMove.status,
      targetStatus,
      serviceTitle,
      producerName: demandToMove.producer?.name,
    })

    try {
      // 2. Transação atômica no backend
      const res = await updateDemandStatus(demandId, targetStatus, notes)
      if (!res.success) {
        throw new Error(typeof res.error === 'string' ? res.error : 'Erro ao atualizar status')
      }

      // 3. Sucesso confirmado pelo servidor: o card agora muda de coluna definitivamente
      setDemands((prev) =>
        prev.map((d) => (d.id === demandId ? { ...d, status: targetStatus } : d))
      )

      const targetCol = COLUMNS.find((c) => c.status === targetStatus)
      toast.success(`Demanda movida para "${targetCol?.title || targetStatus}".`)

      router.refresh()
      if (onRefresh) onRefresh()
    } catch (err: any) {
      // 4. Em caso de falha, reverte e mantém o card na coluna original sem drop incorreto
      toast.error(err.message || 'Falha na transição de status. Ação não concluída.')
      if (onRefresh) onRefresh()
    } finally {
      // 5. Finaliza o estado de movimentação e remove o skeleton
      setMovingDemand(null)
    }
  }

  // Intercepta solicitações de movimento para disparar modal de despacho
  const requestMoveStatus = (demandId: string, targetStatus: DemandStatusCode) => {
    const demandToMove = demands.find((d) => d.id === demandId)
    if (!demandToMove || demandToMove.status === targetStatus) return

    if (demandToMove.status === 'CONCLUIDO') {
      toast.info('Para reabrir demandas concluídas, utilize a Central da Demanda com justificativa técnica.')
      return
    }

    // Se transição for para AGUARDANDO_DOCUMENTACAO ou CONCLUIDO, abre modal de despacho
    if (targetStatus === 'AGUARDANDO_DOCUMENTACAO' || targetStatus === 'CONCLUIDO') {
      setPendingDispatch({
        demandId,
        targetStatus,
        demandTitle: demandToMove.producer?.name
          ? `${demandToMove.producer.name} - ${demandToMove.serviceType}`
          : demandToMove.serviceType,
      })
      setDispatchNote('')
      return
    }

    // Demais transições normais
    handleMoveDemand(demandId, targetStatus, null)
  }

  // Drag and Drop Nativo
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (movingDemand) {
      e.preventDefault()
      return
    }
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
      requestMoveStatus(id, targetStatus)
    }
  }

  return (
    <div className="relative">
      {/* Grid de Colunas do Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const columnDemands = demands.filter((d) => d.status === col.status)
          const isHovered = dragOverColumn === col.status
          const isTargetColumn = movingDemand?.targetStatus === col.status
          const isSourceColumn = movingDemand?.sourceStatus === col.status
          const Icon = col.icon

          // Contagem dinâmica considerando o card em trânsito
          const displayCount =
            columnDemands.length + (isTargetColumn ? 1 : 0) - (isSourceColumn ? 1 : 0)

          return (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
              className={cn(
                'flex flex-col rounded-xl border transition-all duration-200 min-h-[500px] overflow-hidden',
                col.borderClass,
                col.bgClass,
                col.accentBorder,
                isHovered && 'ring-2 ring-slate-400/50 bg-slate-100/90'
              )}
            >
              {/* Header da Coluna */}
              <div
                className={cn(
                  'p-3.5 border-b flex items-center justify-between font-bold text-sm',
                  col.headerBg
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{col.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isTargetColumn && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-700" />
                  )}
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-black border', col.badgeClass)}>
                    {displayCount}
                  </span>
                </div>
              </div>

              {/* Lista de Cards da Coluna */}
              <div className="p-2.5 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                {/* Skeleton de Carregamento na Coluna de Destino */}
                {isTargetColumn && (
                  <DemandCardSkeleton
                    serviceTitle={movingDemand.serviceTitle}
                    producerName={movingDemand.producerName}
                    targetStatusLabel={col.title}
                  />
                )}

                {columnDemands.length === 0 && !isTargetColumn ? (
                  <div className="h-32 flex flex-col items-center justify-center text-xs text-muted-foreground/60 border border-dashed border-slate-300/60 rounded-xl m-1">
                    <Layers className="w-6 h-6 mb-1 opacity-40" />
                    <span>Nenhuma demanda nesta etapa</span>
                  </div>
                ) : (
                  columnDemands.map((demand) => (
                    <div
                      key={demand.id}
                      draggable={!movingDemand}
                      onDragStart={(e) => handleDragStart(e, demand.id)}
                      className={cn(
                        'transition-transform',
                        movingDemand?.demandId === demand.id
                          ? 'cursor-wait pointer-events-none'
                          : 'cursor-grab active:cursor-grabbing'
                      )}
                    >
                      <DemandCard
                        demand={demand}
                        onMoveStatus={requestMoveStatus}
                        onRefresh={onRefresh}
                        isDragging={draggedDemandId === demand.id}
                        isMoving={movingDemand?.demandId === demand.id}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de Despacho / Observação ao Mover Cards */}
      {pendingDispatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setPendingDispatch(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'p-2 rounded-xl',
                    pendingDispatch.targetStatus === 'AGUARDANDO_DOCUMENTACAO'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-900'
                  )}
                >
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Registrar Despacho / Observação
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mover para{' '}
                    <span
                      className={cn(
                        'font-bold',
                        pendingDispatch.targetStatus === 'AGUARDANDO_DOCUMENTACAO'
                          ? 'text-amber-800'
                          : 'text-emerald-800'
                      )}
                    >
                      {pendingDispatch.targetStatus === 'AGUARDANDO_DOCUMENTACAO'
                        ? 'Aguardando Documentação'
                        : pendingDispatch.targetStatus === 'CONCLUIDO'
                        ? 'Concluído'
                        : pendingDispatch.targetStatus}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingDispatch(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                title="Fechar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3 mt-2">
              Adicione uma nota explicativa ou despacho técnico para constar na Linha do Tempo da demanda (opcional):
            </p>

            <Textarea
              ref={textareaRef}
              autoFocus
              value={dispatchNote}
              onChange={(e) => setDispatchNote(e.target.value)}
              onKeyDown={handleModalKeyDown}
              placeholder={getDynamicPlaceholder(pendingDispatch.targetStatus)}
              rows={4}
              className="w-full text-xs rounded-xl border border-slate-200 p-3 text-slate-800 placeholder:text-slate-400 focus-visible:ring-slate-400/20 focus-visible:border-slate-400 mb-2 resize-none"
            />

            {/* Dica Visual Sutil de Atalho (UI/UX) */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                Dica: Pressione{' '}
                <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">
                  Ctrl
                </kbd>{' '}
                +{' '}
                <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">
                  Enter
                </kbd>{' '}
                para salvar
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  const { demandId, targetStatus } = pendingDispatch
                  setPendingDispatch(null)
                  handleMoveDemand(demandId, targetStatus, null)
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Confirmar sem Nota
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPendingDispatch(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const { demandId, targetStatus } = pendingDispatch
                    const note = dispatchNote.trim() || null
                    setPendingDispatch(null)
                    handleMoveDemand(demandId, targetStatus, note)
                  }}
                  className={cn(
                    'px-4 py-2 text-white text-xs font-bold rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer',
                    pendingDispatch.targetStatus === 'AGUARDANDO_DOCUMENTACAO'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  )}
                >
                  Salvar com Despacho
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
