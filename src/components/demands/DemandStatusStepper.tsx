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

  const currentIndex = STEPS.findIndex((s) => s.status === currentStatus)
  const isCancelled = currentStatus === 'CANCELADO'

  const handleStepClick = async (targetStatus: DemandStatusCode) => {
    if (targetStatus === currentStatus || isUpdating) return

    // Se estiver reabrindo de CONCLUIDO para outro status, exige justificativa
    if (currentStatus === 'CONCLUIDO') {
      setTargetReopenStatus(targetStatus)
      setReopenReason('')
      setReopenModalOpen(true)
      return
    }

    try {
      setIsUpdating(true)
      const res = await updateDemandStatus(demandId, targetStatus)
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
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
          {STEPS.map((step, index) => {
            const isCompleted = currentIndex > index
            const isCurrent = currentIndex === index
            const isUpcoming = currentIndex < index

            return (
              <button
                key={step.status}
                type="button"
                onClick={() => handleStepClick(step.status)}
                disabled={isUpdating}
                className={cn(
                  'relative flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 focus:outline-hidden',
                  isCurrent &&
                    'bg-emerald-50/70 border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-xs',
                  isCompleted &&
                    'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300',
                  isUpcoming &&
                    'bg-white border-slate-200/60 hover:bg-slate-50 hover:border-slate-300'
                )}
              >
                {/* Indicador Numérico / Ícone */}
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-transform duration-200',
                    isCurrent && 'bg-emerald-600 text-white shadow-xs scale-105',
                    isCompleted && 'bg-emerald-100 text-emerald-700',
                    isUpcoming && 'bg-slate-100 text-slate-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>

                {/* Textos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'text-xs font-bold truncate',
                        isCurrent && 'text-emerald-900',
                        isCompleted && 'text-slate-800',
                        isUpcoming && 'text-slate-500'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{step.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Modal para Reabertura de Demanda com Justificativa Obrigatória */}
      {reopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3 text-amber-600">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
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
