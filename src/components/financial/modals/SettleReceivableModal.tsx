'use client'

import React, { useState, useMemo } from 'react'
import { Landmark, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { settleReceivableInstallment } from '@/actions/financial/receivables'
import { toast } from 'sonner'
import { FinancialModal, InputField, SelectField } from './FinancialModal'

export default function SettleReceivableModal({
  isOpen, onClose, selectedTitle, selectedInstallment, bankAccounts, onSuccess,
}: {
  isOpen: boolean; onClose: () => void; selectedTitle: any; selectedInstallment: any; bankAccounts: any[]; onSuccess: (receiptId?: string) => void
}) {
  const residual = Math.max(0, Number(selectedInstallment?.amount || 0) - Number(selectedInstallment?.receivedAmount || 0))
  const [amount, setAmount] = useState(residual)
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [isSettling, setIsSettling] = useState(false)

  const commissionPreview = useMemo(() => {
    if (!selectedTitle?.commissions?.length) return null
    const comm = selectedTitle.commissions[0]
    const titleNet = Number(selectedTitle.netAmount || 1)
    const commTotal = Number(comm.totalCommissionAmount || 0)
    return {
      partnerName: selectedTitle.partner?.name || 'Parceiro Indicador',
      totalCommission: commTotal,
      unlockAmount: Math.min(commTotal, Math.round(((amount / titleNet) * commTotal) * 100) / 100),
    }
  }, [selectedTitle, amount])

  const handleConfirmSettle = async () => {
    if (!selectedInstallment || !bankAccountId || amount <= 0) {
      toast.error('Informe a conta bancária e um valor válido.'); return
    }
    setIsSettling(true)
    const toastId = toast.loading('Processando liquidação e destravamento atômico...')
    try {
      const res = await settleReceivableInstallment({
        installmentId: selectedInstallment.id, bankAccountId, receivedAmount: amount, receivedAt: new Date(date).toISOString(),
      })
      if (res.error) { toast.dismiss(toastId); toast.error(res.error); return }
      toast.dismiss(toastId); toast.success('Baixa efetuada com sucesso! Recibo gerado.')
      onClose(); onSuccess(res.data?.receipt?.id)
    } catch (err: any) {
      toast.dismiss(toastId); toast.error(err?.message || 'Falha ao processar liquidação.')
    } finally { setIsSettling(false) }
  }

  return (
    <FinancialModal
      isOpen={isOpen} onClose={onClose}
      title={<><Landmark className="h-5 w-5 text-emerald-800" /> Liquidação Declaratória de Parcela</>}
      submitLabel="Confirmar Liquidação & Gerar Recibo" loading={isSettling}
      submitDisabled={amount <= 0 || !bankAccountId} onSubmit={handleConfirmSettle}
    >
      {selectedInstallment && selectedTitle && (
        <>
          <div className="rounded-lg bg-slate-50 p-2.5 space-y-1 border border-slate-200">
            <div className="font-bold text-slate-800">{selectedTitle.producer?.name} • {selectedTitle.documentNumber}</div>
            <div className="text-slate-500">Parcela {selectedInstallment.installmentNumber}/{selectedInstallment.totalInstallments} • Vencimento: {new Date(selectedInstallment.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div>
            <div className="text-slate-700 font-semibold pt-0.5">Saldo devedor desta parcela: <span className="text-rose-600 font-bold">{formatCurrency(residual)}</span></div>
          </div>
          <SelectField label="Conta Bancária de Crédito:" value={bankAccountId} onChange={setBankAccountId} options={bankAccounts.map((b) => ({ value: b.id, label: `🏦 ${b.bankName} (Ag. ${b.agency || 'S/A'} - CC ${b.accountNumber || 'S/N'})` }))} />
          <div className="grid grid-cols-2 gap-2">
            <InputField label="Valor a Baixar (R$):" type="number" step="0.01" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="font-bold text-emerald-900" />
            <InputField label="Data da Liquidação:" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          {commissionPreview && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px] uppercase">
                <Clock className="h-3.5 w-3.5" /> Destravamento Proporcional da Trava (ADR-021)
              </div>
              <div className="text-[11px] text-amber-800">Parceiro: <strong>{commissionPreview.partnerName}</strong></div>
              <div className="text-[11px] text-amber-900 font-semibold">Comissão liberada nesta baixa: <span className="text-emerald-800 font-black">{formatCurrency(commissionPreview.unlockAmount)}</span> (de {formatCurrency(commissionPreview.totalCommission)})</div>
            </div>
          )}
        </>
      )}
    </FinancialModal>
  )
}
