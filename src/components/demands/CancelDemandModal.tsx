'use client'

import React, { useState } from 'react'
import { cancelDemand } from '@/actions/demands'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface CancelDemandModalProps {
  isOpen: boolean
  onClose: () => void
  demandId: string
  demandTitle: string
  onSuccess?: () => void
}

export function CancelDemandModal({
  isOpen,
  onClose,
  demandId,
  demandTitle,
  onSuccess,
}: CancelDemandModalProps) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim() || reason.trim().length < 3) {
      setError('Por favor, informe um motivo válido com pelo menos 3 caracteres.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      const res = await cancelDemand(demandId, reason.trim())
      if (!res.success) {
        throw new Error(typeof res.error === 'string' ? res.error : 'Erro ao cancelar demanda')
      }

      toast.success('Demanda cancelada com sucesso.')
      onClose()
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao cancelar demanda')
      toast.error(err.message || 'Erro ao cancelar demanda')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3 text-rose-600">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Cancelar Demanda</h3>
              <p className="text-xs text-slate-500">Ação irreversível de arquivamento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Demanda: </span>
            {demandTitle}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Motivo do Cancelamento <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (error) setError(null)
              }}
              rows={3}
              placeholder="Descreva o motivo (ex: desistência do produtor, reprovação bancária, etc.)"
              className="w-full text-sm rounded-xl border border-slate-300 p-3 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              required
            />
            {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Esta justificativa será registrada de forma permanente na <strong>Linha do Tempo</strong>{' '}
            da demanda para fins de auditoria e governança.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Confirmar Cancelamento'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
