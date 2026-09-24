'use client'

import React, { useState } from 'react'
import {
  CheckCircle2,
  Clock,
  Play,
  FileSearch,
  Check,
  ArrowRight,
  AlertTriangle,
  Loader2,
  X,
  FileText,
  MessageSquare,
} from 'lucide-react'
import { updateDemandStatus } from '@/actions/demands'
import { DemandStatusCode } from '@/lib/validations/demands'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface StepConfig {
  status: DemandStatusCode
  number: number
  label: string
  description: string
}

const STEPS: StepConfig[] = [
  {
    status: 'SOLICITADO',
    number: 1,
    label: 'Solicitado',
    description: 'Triagem & Entrada',
  },
  {
    status: 'EM_EXECUCAO',
    number: 2,
    label: 'Em Execução',
    description: 'Elaboração Técnica',
  },
  {
    status: 'AGUARDANDO_DOCUMENTACAO',
    number: 3,
    label: 'Aguardando Docs',
    description: 'Pendências do GED',
  },
  {
    status: 'CONCLUIDO',
    number: 4,
    label: 'Concluído',
    description: 'Finalizado & Entregue',
  },
]

function getStepCurrentStyles(status: DemandStatusCode) {
  switch (status) {
    case 'SOLICITADO':
      return {
        container: 'bg-slate-100/80 border-slate-500 shadow-xs ring-2 ring-slate-400/20',
        badge: 'bg-slate-800 text-white',
        tag: 'text-slate-800 bg-slate-200 border border-slate-300',
        title: 'text-slate-900 font-bold',
      }
    case 'EM_EXECUCAO':
      return {
        container: 'border-slate-900 bg-slate-50 text-slate-900 shadow-xs ring-2 ring-slate-900/20',
        badge: 'bg-slate-900 text-white',
        tag: 'text-white bg-slate-900',
        title: 'text-slate-950 font-bold',
      }
    case 'AGUARDANDO_DOCUMENTACAO':
      return {
        container: 'border-amber-500 bg-amber-50/50 text-amber-900 shadow-xs ring-2 ring-amber-500/20',
        badge: 'bg-amber-500 text-white',
        tag: 'text-amber-900 bg-amber-100 border border-amber-300',
        title: 'text-amber-950 font-bold',
      }
    case 'CONCLUIDO':
      return {
        container: 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20',
        badge: 'bg-emerald-600 text-white',
        tag: 'text-emerald-900 bg-emerald-100 border border-emerald-300',
        title: 'text-emerald-950 font-bold',
      }
    default:
      return {
        container: 'bg-slate-100 border-slate-400 shadow-xs',
        badge: 'bg-slate-700 text-white',
        tag: 'text-slate-700 bg-slate-200',
        title: 'text-slate-900 font-bold',
      }
  }
}

interface DemandStatusStepperProps {
  demandId: string
  currentStatus: DemandStatusCode
  onStatusChange?: (newStatus: DemandStatusCode) => void
}

export function DemandStatusStepper({
  demandId,
  currentStatus,
  onStatusChange,
}: DemandStatusStepperProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [reopenModalOpen, setReopenModalOpen] = useState(false)
  const [targetReopenStatus, setTargetReopenStatus] = useState<DemandStatusCode>('EM_EXECUCAO')
  const [reopenReason, setReopenReason] = useState('')

  // Modal de despacho ao avançar etapa
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false)
  const [targetDispatchStatus, setTargetDispatchStatus] = useState<DemandStatusCode>('AGUARDANDO_DOCUMENTACAO')
  const [dispatchNote, setDispatchNote] = useState('')

  const currentIndex = STEPS.findIndex((s) => s.status === currentStatus)
  const isCancelled = currentStatus === 'CANCELADO'

  const executeStatusChange = async (targetStatus: DemandStatusCode, notes?: string | null) => {
    try {
      setIsUpdating(true)
      const res = await updateDemandStatus(demandId, targetStatus, notes)
      if (!res.success) {
        throw new Error(typeof res.error === 'string' ? res.error : 'Erro ao alterar status')
      }

      toast.success(`Demanda movida para "${targetStatus}" com sucesso.`)
      if (onStatusChange) onStatusChange(targetStatus)
    } catch (err: any) {
      toast.error(err.message || 'Falha ao alterar status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleStepClick = async (targetStatus: DemandStatusCode) => {
    if (targetStatus === currentStatus || isUpdating) return

    // Se estiver reabrindo de CONCLUIDO para outro status, exige justificativa
    if (currentStatus === 'CONCLUIDO') {
      setTargetReopenStatus(targetStatus)
      setReopenReason('')
      setReopenModalOpen(true)
      return
    }

    // Se avançar para AGUARDANDO_DOCUMENTACAO ou CONCLUIDO, abre modal de despacho
    if (targetStatus === 'AGUARDANDO_DOCUMENTACAO' || targetStatus === 'CONCLUIDO') {
      setTargetDispatchStatus(targetStatus)
      setDispatchNote('')
      setDispatchModalOpen(true)
      return
    }

    await executeStatusChange(targetStatus, null)
  }

  const handleConfirmReopen = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reopenReason.trim() || reopenReason.trim().length < 3) {
      toast.error('Informe uma justificativa técnica com pelo menos 3 caracteres.')
      return
    }

    try {
      setIsUpdating(true)
      const res = await updateDemandStatus(demandId, targetReopenStatus, reopenReason.trim())
      if (!res.success) {
        throw new Error(typeof res.error === 'string' ? res.error : 'Erro ao reabrir demanda')
      }

      toast.success(`Demanda reaberta para "${targetReopenStatus}" com justificativa registrada.`)
      setReopenModalOpen(false)
      if (onStatusChange) onStatusChange(targetReopenStatus)
    } catch (err: any) {
      toast.error(err.message || 'Falha ao reabrir demanda')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isCancelled) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 font-bold">
            🚫
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-800">Esta demanda está CANCELADA</h4>
            <p className="text-xs text-rose-600">
              O fluxo de execução foi encerrado e a demanda está arquivada.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleStepClick('SOLICITADO')}
          disabled={isUpdating}
          className="px-4 py-2 text-xs font-bold text-rose-700 bg-white hover:bg-rose-100/60 border border-rose-300 rounded-xl transition-all shadow-2xs"
        >
          {isUpdating ? 'Reativando...' : 'Reativar Demanda'}
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Fluxo da Ordem de Serviço Rural
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Clique em uma etapa para avançar a esteira
          </span>
        </div>

        {/* Linha de Conexão e Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
          {STEPS.map((step, index) => {
            const isCompleted = currentIndex > index
            const isCurrent = currentIndex === index
            const isFuture = currentIndex < index
            const currentStyle = isCurrent ? getStepCurrentStyles(step.status) : null

            return (
              <button
                key={step.status}
                type="button"
                onClick={() => handleStepClick(step.status)}
                disabled={isUpdating}
                className={cn(
                  'group text-left p-3.5 rounded-xl border transition-all relative flex flex-col justify-between cursor-pointer',
                  isCurrent && currentStyle?.container,
                  isCompleted &&
                    'bg-slate-50 border-slate-200 hover:bg-slate-100/70',
                  isFuture &&
                    'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50/50'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black transition-colors',
                      isCurrent && currentStyle?.badge,
                      isCompleted && 'text-emerald-600 bg-emerald-50/60 border border-emerald-200/80',
                      isFuture && 'bg-slate-100 text-slate-400 group-hover:text-slate-600'
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                  </div>
                  {isCurrent && (
                    <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md', currentStyle?.tag)}>
                      Em Foco
                    </span>
                  )}
                </div>

                <div>
                  <div
                    className={cn(
                      'font-bold text-sm leading-tight transition-colors',
                      isCurrent && currentStyle?.title,
                      isCompleted && 'text-slate-700',
                      isFuture && 'text-slate-400 group-hover:text-slate-700'
                    )}
                  >
                    {step.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {step.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Modal de Despacho / Observação ao Avançar Etapa */}
      {dispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'p-2 rounded-xl',
                    targetDispatchStatus === 'AGUARDANDO_DOCUMENTACAO'
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
                    Avançando para{' '}
                    <span
                      className={cn(
                        'font-bold',
                        targetDispatchStatus === 'AGUARDANDO_DOCUMENTACAO'
                          ? 'text-amber-800'
                          : 'text-emerald-800'
                      )}
                    >
                      {targetDispatchStatus === 'AGUARDANDO_DOCUMENTACAO'
                        ? 'Aguardando Documentação'
                        : 'Concluído'}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDispatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3 mt-2">
              Adicione uma nota explicativa ou despacho técnico para constar na Linha do Tempo da demanda (opcional):
            </p>

            <textarea
              value={dispatchNote}
              onChange={(e) => setDispatchNote(e.target.value)}
              placeholder="Ex: Falta certidão de casamento atualizada do cartório de Taguatinga"
              rows={4}
              className="w-full text-xs rounded-xl border border-slate-200 p-3 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 mb-4 resize-none"
              autoFocus
            />

            <div className="flex items-center justify-between gap-2 flex-wrap border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  setDispatchModalOpen(false)
                  executeStatusChange(targetDispatchStatus, null)
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Confirmar sem Nota
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDispatchModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const note = dispatchNote.trim() || null
                    setDispatchModalOpen(false)
                    executeStatusChange(targetDispatchStatus, note)
                  }}
                  className={cn(
                    'px-4 py-2 text-white text-xs font-bold rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer',
                    targetDispatchStatus === 'AGUARDANDO_DOCUMENTACAO'
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

      {/* Modal de Reabertura com Justificativa Obrigatória */}
      {reopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Reabrir Demanda</h3>
                  <p className="text-xs text-slate-500">Exige justificativa técnica obrigatória</p>
                </div>
              </div>
              <button
                onClick={() => setReopenModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReopen} className="mt-4 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Esta demanda foi marcada como <strong>Concluída</strong>. Ao retornar para o status{' '}
                <span className="font-bold text-slate-800">{targetReopenStatus}</span>, a data de
                conclusão será limpa e um registro de auditoria será gravado com sua justificativa.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Motivo da Reabertura <span className="text-amber-500">*</span>
                </label>
                <textarea
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  rows={3}
                  placeholder="Descreva o motivo (ex: exigência adicional do banco, correção na documentação, etc.)"
                  className="w-full text-sm rounded-xl border border-slate-300 p-3 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReopenModalOpen(false)}
                  disabled={isUpdating}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Reabrindo...
                    </>
                  ) : (
                    'Confirmar Reabertura'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
