'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import {
  CreditCard,
  Building2,
  Calendar,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Percent,
} from 'lucide-react'
import { CreditProjectHistoryItem, createProjectReceivableTitle } from '@/actions/credit-projects'
import { formatCurrency } from '@/lib/utils'

interface BillProjectFeeModalProps {
  isOpen: boolean
  onClose: () => void
  project: CreditProjectHistoryItem | null
  onSuccess: () => void
}

export function BillProjectFeeModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}: BillProjectFeeModalProps) {
  const [feePercent, setFeePercent] = useState<number>(2.0)
  const [dueDate, setDueDate] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successResult, setSuccessResult] = useState<{
    documentNumber: string
    grossAmount: number
  } | null>(null)

  useEffect(() => {
    if (isOpen && project) {
      // Default: 30 dias a partir de hoje
      const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      setDueDate(defaultDate.toISOString().split('T')[0])
      setFeePercent(2.0)
      setError(null)
      setSuccessResult(null)

      const lineName = project.creditLineName || project.templateName
      setNotes(
        `Faturamento de honorários técnicos do projeto (${lineName}). Produtor: ${project.producerName}.`
      )
    }
  }, [isOpen, project])

  if (!project) return null

  const financedAmount = project.financedAmount || 0
  const calculatedFeeAmount = financedAmount * (feePercent / 100)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await createProjectReceivableTitle({
        formId: project.id,
        producerId: project.producerId,
        propertyId: project.propertyId || undefined,
        demandId: project.demandId || undefined,
        templateCode: project.templateCode,
        financedAmount,
        successFeePercent: feePercent,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
      })

      if (res.success && res.documentNumber) {
        setSuccessResult({
          documentNumber: res.documentNumber,
          grossAmount: res.grossAmount || calculatedFeeAmount,
        })
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      } else {
        setError(res.error || 'Erro ao emitir título financeiro no ERP.')
      }
    } catch (err: any) {
      setError(err?.message || 'Falha na comunicação com o servidor.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-md p-6 bg-white rounded-2xl shadow-2xl border border-gray-100">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900">
                Faturar Honorários no ERP Rural
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Gere o Título a Receber institucional sobre o montante financiado do projeto.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {successResult ? (
          <div className="py-8 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-900">
              Título Gerado com Sucesso!
            </h4>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold font-mono">
              {successResult.documentNumber}
            </div>
            <p className="text-xs text-muted-foreground">
              Honorários de{' '}
              <strong className="text-gray-900">
                {formatCurrency(successResult.grossAmount)}
              </strong>{' '}
              registrados no financeiro da organização.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-3">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Quadro Resumo do Projeto */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Linha de Crédito:</span>
                <span className="font-bold text-slate-800 text-right truncate max-w-[200px]">
                  {project.creditLineName || project.templateName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Proponente:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                  {project.producerName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Imóvel:</span>
                <span className="text-slate-700 truncate max-w-[200px]">
                  {project.propertyName}
                </span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700">Valor Financiado:</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  {formatCurrency(financedAmount)}
                </span>
              </div>
            </div>

            {/* Parâmetros do Faturamento */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="feePercent" className="text-xs font-semibold text-slate-700">
                  Taxa de Êxito (%)
                </Label>
                <div className="relative">
                  <Input
                    id="feePercent"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    value={feePercent}
                    onChange={(e) => setFeePercent(parseFloat(e.target.value) || 0)}
                    className="h-9 text-xs pr-7 bg-white font-semibold"
                    required
                  />
                  <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dueDate" className="text-xs font-semibold text-slate-700">
                  Data de Vencimento
                </Label>
                <DatePicker
                  value={dueDate}
                  onChange={(val) => setDueDate(val || '')}
                  placeholder="DD/MM/AAAA"
                  className="h-9 text-xs bg-white"
                  showPresets={true}
                />
              </div>
            </div>

            {/* Simulação em Tempo Real do Valor dos Honorários */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-950 block">
                  Honorários Calculados ({feePercent}%):
                </span>
                <span className="text-[10px] text-emerald-700">
                  Calculado sobre o crédito aprovado
                </span>
              </div>
              <span className="text-base font-black text-emerald-900">
                {formatCurrency(calculatedFeeAmount)}
              </span>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-semibold text-slate-700">
                Observações do Faturamento
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações para a equipe financeira..."
                className="text-xs resize-none h-16 bg-white"
              />
            </div>

            <DialogFooter className="pt-2 sm:justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs h-9"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || calculatedFeeAmount <= 0}
                className="text-xs h-9 bg-[#1B4D3E] hover:bg-[#113025] text-white font-bold gap-1.5 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Confirmar Faturamento (FAT)</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
