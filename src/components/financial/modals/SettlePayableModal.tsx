'use client'

import React, { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { settlePayableInstallment } from '@/actions/financial/payables'
import { toast } from 'sonner'
import { FinancialModal, InputField, SelectField } from './FinancialModal'

export default function SettlePayableModal({
  isOpen, onClose, selectedPayable, selectedInstallment, bankAccounts, onSuccess,
}: {
  isOpen: boolean; onClose: () => void; selectedPayable: any; selectedInstallment: any; bankAccounts: any[]; onSuccess: () => void
}) {
  const residual = Math.max(0, Number(selectedInstallment?.amount || 0) - Number(selectedInstallment?.paidAmount || 0))
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '')
  const [amount, setAmount] = useState(residual)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [isSettling, setIsSettling] = useState(false)

  const handleConfirmSettle = async () => {
    if (!selectedInstallment || !bankAccountId || amount <= 0) {
      toast.error('Informe a conta de saída e um valor válido.'); return
    }
    setIsSettling(true)
    const toastId = toast.loading('Processando pagamento e débito em conta...')
    try {
      const res = await settlePayableInstallment({ installmentId: selectedInstallment.id, bankAccountId, paidAmount: amount, paidAt: new Date(date).toISOString() })
      if (res.error) { toast.dismiss(toastId); toast.error(res.error); return }
      toast.dismiss(toastId); toast.success('Boleto baixado com sucesso! Débito lançado no livro-caixa.')
      onClose(); onSuccess()
    } catch (err: any) {
      toast.dismiss(toastId); toast.error(err?.message || 'Falha ao processar pagamento.')
    } finally { setIsSettling(false) }
  }

  return (
    <FinancialModal
      isOpen={isOpen} onClose={onClose}
      title="Liquidação de Pagamento / Débito em Conta" submitLabel="Confirmar Débito & Baixar Boleto"
      loading={isSettling} submitDisabled={amount <= 0 || !bankAccountId} onSubmit={handleConfirmSettle}
    >
      {selectedInstallment && selectedPayable && (
        <>
          <div className="rounded-lg bg-slate-50 p-2.5 space-y-1 border border-slate-200">
            <div className="font-bold text-slate-900">{selectedPayable.supplierName} • {selectedPayable.documentNumber || 'S/N'}</div>
            <div className="text-slate-500">Boleto {selectedInstallment.installmentNumber}/{selectedInstallment.totalInstallments} • Vencimento: {new Date(selectedInstallment.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div>
            <div className="text-slate-700 font-semibold pt-0.5">Saldo devedor: <span className="text-rose-600 font-bold">{formatCurrency(residual)}</span></div>
          </div>
          <SelectField label="Conta Bancária de Saída / Débito:" value={bankAccountId} onChange={setBankAccountId} options={bankAccounts.map((b) => ({ value: b.id, label: `🏦 ${b.bankName} (Saldo: ${formatCurrency(Number(b.currentBalance))})` }))} />
          <div className="grid grid-cols-2 gap-2">
            <InputField label="Valor a Pagar (R$):" type="number" step="0.01" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="font-bold text-rose-800" />
            <InputField label="Data do Pagamento:" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </>
      )}
    </FinancialModal>
  )
}
