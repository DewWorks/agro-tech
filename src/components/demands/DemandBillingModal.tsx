'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
import {
  DollarSign,
  Receipt,
  Users,
  Calendar,
  Lock,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { getDemandBillingSuggestion, DemandBillingSuggestion } from '@/actions/financial/triggers'
import { updateDemandStatus } from '@/actions/demands'
import { formatCurrency, maskCurrencyInput, parseCurrencyInput } from '@/lib/utils'

interface DemandBillingModalProps {
  isOpen: boolean
  onClose: () => void
  demandId: string
  demandTitle?: string
  onSuccess?: (result: any) => void
  onSkipBilling?: (notes: string) => void
}

export function DemandBillingModal({
  isOpen,
  onClose,
  demandId,
  demandTitle,
  onSuccess,
  onSkipBilling,
}: DemandBillingModalProps) {
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(true)
  const [suggestion, setSuggestion] = useState<DemandBillingSuggestion | null>(null)

  // Form State
  const [financedAmountStr, setFinancedAmountStr] = useState('')
  const [successFeePercent, setSuccessFeePercent] = useState<number>(2.0)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('')
  const [partnerCommissionPercent, setPartnerCommissionPercent] = useState<number>(20.0)
  const [dueDateStr, setDueDateStr] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Carregar dados de sugestão inteligente quando o modal abrir
  useEffect(() => {
    if (!isOpen || !demandId) return

    let isMounted = true
    setIsLoadingSuggestion(true)

    getDemandBillingSuggestion(demandId)
      .then((res) => {
        if (!isMounted) return
        if (res.success && res.data) {
          const data = res.data
          setSuggestion(data)
          if (data.suggestedFinancedAmount > 0) {
            setFinancedAmountStr(maskCurrencyInput(Math.round(data.suggestedFinancedAmount * 100)))
          } else {
            setFinancedAmountStr('')
          }
          setSuccessFeePercent(data.defaultSuccessFeePercent || 2.0)
          setPartnerCommissionPercent(data.defaultPartnerCommissionPercent || 20.0)
        } else {
          toast.error(res.error || 'Erro ao carregar parâmetros de faturamento.')
        }
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Erro ao consultar sugestão de faturamento:', err)
        toast.error('Não foi possível obter dados sugeridos da demanda.')
      })
      .finally(() => {
        if (isMounted) setIsLoadingSuggestion(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, demandId])

  // Recálculo Reativo de Honorários e Comissões
  const financedAmount = useMemo(() => {
    return parseCurrencyInput(financedAmountStr)
  }, [financedAmountStr])

  const grossHonorary = useMemo(() => {
    return financedAmount * (successFeePercent / 100)
  }, [financedAmount, successFeePercent])

  const partnerCommissionAmount = useMemo(() => {
    if (!selectedPartnerId) return 0
    return grossHonorary * (partnerCommissionPercent / 100)
  }, [selectedPartnerId, grossHonorary, partnerCommissionPercent])

  const handlePartnerChange = (partnerId: string) => {
    setSelectedPartnerId(partnerId)
    if (partnerId && suggestion) {
      const p = suggestion.partners.find((item) => item.id === partnerId)
      if (p) {
        setPartnerCommissionPercent(p.defaultCommissionRate || 20.0)
      }
    }
  }

  // Submissão com faturamento formal
  const handleConfirmWithBilling = async (e: React.FormEvent) => {
    e.preventDefault()

    if (financedAmount <= 0) {
      toast.error('Informe o valor financiado do projeto para calcular os honorários.')
      return
    }

    if (grossHonorary <= 0) {
      toast.error('O honorário calculado deve ser maior que zero.')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await updateDemandStatus(demandId, 'CONCLUIDO', notes || null, {
        financedAmount,
        successFeePercent,
        partnerId: selectedPartnerId || undefined,
        partnerCommissionPercent: selectedPartnerId ? partnerCommissionPercent : undefined,
        dueDate: dueDateStr,
        notes: notes || undefined,
      })

      if (!res.success) {
        throw new Error(typeof res.error === 'string' ? res.error : 'Falha ao concluir demanda e faturar.')
      }

      if (res.financialResult?.data?.title) {
        toast.success(
          `Demanda concluída! Título ${res.financialResult.data.title.documentNumber} de ${formatCurrency(
            grossHonorary
          )} gerado com sucesso no Financeiro.`
        )
      } else if (res.financialResult?.alreadyExisted) {
        toast.info(`Demanda concluída! O título a receber já estava ativo para esta demanda.`)
      } else {
        toast.success('Demanda concluída com sucesso!')
      }

      if (onSuccess) onSuccess(res)
      onClose()
    } catch (err: any) {
      console.error('Erro na conclusão com faturamento:', err)
      toast.error(err.message || 'Falha ao concluir demanda com faturamento.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Conclusão sem faturamento (cortesia, interno ou faturamento posterior)
  const handleConfirmWithoutBilling = async () => {
    try {
      setIsSubmitting(true)
      const res = await updateDemandStatus(
        demandId,
        'CONCLUIDO',
        notes ? `[Conclusão sem Faturamento] ${notes}` : '[Conclusão sem Faturamento Formal]'
      )

      if (!res.success) {
        throw new Error(typeof res.error === 'string' ? res.error : 'Falha ao concluir demanda.')
      }

      toast.success('Demanda concluída sem geração de título a receber.')
      if (onSuccess) onSuccess(res)
      if (onSkipBilling) onSkipBilling(notes)
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Falha ao concluir demanda.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
      <DialogContent className="max-w-2xl sm:max-w-3xl p-0 overflow-hidden rounded-2xl border-emerald-900/10 shadow-2xl">
        {/* Top Header com Identidade AgroTech */}
        <div className="bg-[#1B4D3E] p-6 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-400/20 hover:bg-emerald-400/20 text-emerald-200 border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider">
                  Esteira Operacional • Módulo Financeiro
                </Badge>
                {suggestion?.alreadyBilled && (
                  <Badge className="bg-amber-400/20 text-amber-200 border-amber-400/30 text-[10px] font-bold">
                    Título Já Emitido
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-300" />
                Conclusão de Demanda & Faturamento de Honorários
              </DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-xs">
                Gere atomicamente o Título a Receber e a Trava de Comissão do Parceiro ao concluir a OS rural.
              </DialogDescription>
            </div>
          </div>
        </div>

        {isLoadingSuggestion ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-[#1B4D3E]" />
            <p className="text-xs font-semibold">Buscando dados cadastrais e simulação de crédito...</p>
          </div>
        ) : (
          <form onSubmit={handleConfirmWithBilling} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* 1. Contexto Operacional */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>Produtor:</span>
                  <span className="text-slate-900 font-extrabold">{suggestion?.producerName || 'Produtor'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  <span>Propriedade:</span>
                  <span className="font-semibold text-slate-800">
                    {suggestion?.propertyName || 'Nenhuma vinculada'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Serviço Realizado
                </span>
                <span className="text-xs font-bold text-[#1B4D3E]">
                  {suggestion?.serviceType || demandTitle || 'Crédito Rural'}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Filial: {suggestion?.branchName || 'Principal'}
                </span>
              </div>
            </div>

            {/* Alerta se já possuir faturamento */}
            {suggestion?.alreadyBilled && suggestion.existingTitle && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3 text-amber-900 text-xs">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold">Esta demanda já possui título gerado:</span>{' '}
                  {suggestion.existingTitle.documentNumber} ({formatCurrency(suggestion.existingTitle.grossAmount)} -{' '}
                  {suggestion.existingTitle.status}). Ao confirmar, o título existente será mantido sem duplicação.
                </div>
              </div>
            )}

            {/* 2. Grid de Cálculo Financeiro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Valor Financiado */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="financedAmount" className="text-xs font-bold text-slate-800">
                    Valor Financiado / Projeto (R$) <span className="text-emerald-700">*</span>
                  </Label>
                  {suggestion && suggestion.suggestedFinancedAmount > 0 && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Herdado do Projeto
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    R$
                  </span>
                  <Input
                    id="financedAmount"
                    type="text"
                    value={financedAmountStr}
                    onChange={(e) => setFinancedAmountStr(maskCurrencyInput(e.target.value))}
                    placeholder="0,00"
                    className="pl-9 text-sm font-bold text-slate-900 h-10 rounded-xl border-slate-300 focus:ring-emerald-600"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Base de cálculo para os honorários de êxito da consultoria rural.
                </p>
              </div>

              {/* % de Êxito */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="successFee" className="text-xs font-bold text-slate-800">
                    Honorário de Êxito (%) <span className="text-emerald-700">*</span>
                  </Label>
                  <span className="text-[10px] text-slate-400">Padrão: 2,00%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="successFee"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={successFeePercent}
                      onChange={(e) => setSuccessFeePercent(parseFloat(e.target.value) || 0)}
                      className="text-sm font-bold text-slate-900 h-10 rounded-xl border-slate-300 focus:ring-emerald-600"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                  {/* Presets rápidos */}
                  <div className="flex items-center gap-1">
                    {[1.5, 2.0, 2.5, 3.0].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setSuccessFeePercent(rate)}
                        className={`text-[10px] px-2 py-2 rounded-lg font-bold border transition-colors cursor-pointer ${
                          successFeePercent === rate
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">Taxa acordada com o produtor no contrato.</p>
              </div>
            </div>

            {/* KPI Card de Honorário Bruto Calculado */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                      Honorário Bruto da Consultoria
                    </span>
                    <span className="text-2xl font-black text-[#1B4D3E]">
                      {formatCurrency(grossHonorary)}
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs text-emerald-800 font-semibold hidden sm:block">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-600">Fórmula de Cálculo</div>
                  <span>
                    {formatCurrency(financedAmount)} × {successFeePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Parceiro Comercial & Comissão (Opcional) */}
            <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-slate-800">Parceiro Comercial / Prospectador</span>
                </div>
                <span className="text-[10px] text-slate-400">Opcional</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="partnerSelect" className="text-xs text-slate-600 mb-1 block">
                    Selecionar Parceiro
                  </Label>
                  <select
                    id="partnerSelect"
                    value={selectedPartnerId}
                    onChange={(e) => handlePartnerChange(e.target.value)}
                    className="w-full h-10 text-xs font-semibold rounded-xl border border-slate-300 bg-white px-3 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">Nenhum / Captação Interna (0% comissão)</option>
                    {suggestion?.partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.defaultCommissionRate}% padrão)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPartnerId ? (
                  <div>
                    <Label htmlFor="partnerRate" className="text-xs text-slate-600 mb-1 block">
                      % Comissão do Parceiro
                    </Label>
                    <div className="relative">
                      <Input
                        id="partnerRate"
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        value={partnerCommissionPercent}
                        onChange={(e) => setPartnerCommissionPercent(parseFloat(e.target.value) || 0)}
                        className="text-xs font-bold h-10 rounded-xl border-slate-300 focus:ring-emerald-600"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        %
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-slate-400 italic pt-5">
                    Sem comissão externa vinculada.
                  </div>
                )}
              </div>

              {/* Alerta de Trava de Comissão (Aditivo 004) */}
              {selectedPartnerId && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <span className="font-bold">
                      Provisão de Comissão: {formatCurrency(partnerCommissionAmount)} ({partnerCommissionPercent}% sobre o honorário).
                    </span>{' '}
                    Nascerá com <strong>status BLOQUEADO</strong> no Contas a Pagar e somente será liberada após a liquidação do título pelo produtor (Aditivo 004).
                  </div>
                </div>
              )}
            </div>

            {/* 4. Condições e Data de Vencimento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dueDate" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  Vencimento da Parcela (D+30)
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDateStr}
                  onChange={(e) => setDueDateStr(e.target.value)}
                  className="text-xs font-bold text-slate-900 h-10 rounded-xl border-slate-300 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-bold text-slate-800">
                  Despacho / Observações da Conclusão
                </Label>
                <Input
                  id="notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Projeto protocolado no Banco do Brasil e aprovado."
                  className="text-xs text-slate-900 h-10 rounded-xl border-slate-300 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Rodapé de Ações */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleConfirmWithoutBilling}
                disabled={isSubmitting}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline transition-colors cursor-pointer"
                title="Conclui o atendimento técnico sem registrar faturamento a receber no Financeiro"
              >
                Concluir sem Faturar (Cortesia / Interno)
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs h-10 px-4"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting || financedAmount <= 0}
                  className="bg-[#1B4D3E] hover:bg-[#163e32] text-white rounded-xl text-xs font-bold h-10 px-5 shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer flex-1 sm:flex-initial"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Faturando & Concluindo...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Concluir Demanda & Faturar ({formatCurrency(grossHonorary)})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
