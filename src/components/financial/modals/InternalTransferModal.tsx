'use client'

import React, { useState } from 'react'
import { ArrowRightLeft, ShieldCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { transferBetweenBankAccounts } from '@/actions/financial/settings'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { FinancialModal, InputField, SelectField } from './FinancialModal'

export default function InternalTransferModal({
  isOpen, onClose, bankAccounts, onSuccess,
}: {
  isOpen: boolean; onClose: () => void; bankAccounts: any[]; onSuccess?: () => void
}) {
  const router = useRouter()
  const [sourceId, setSourceId] = useState(bankAccounts[0]?.id || '')
  const [destId, setDestId] = useState(bankAccounts[1]?.id || '')
  const [amount, setAmount] = useState(1000)
  const [description, setDescription] = useState('Transferência interna de tesouraria para suprimento de caixa')
  const [isTransferring, setIsTransferring] = useState(false)

  const handleConfirmTransfer = async () => {
    if (!sourceId || !destId || sourceId === destId || amount <= 0) {
      toast.error('Selecione contas distintas e um valor positivo.'); return
    }
    setIsTransferring(true)
    const toastId = toast.loading('Processando transferência atômica...')
    try {
      const res = await transferBetweenBankAccounts({ sourceBankAccountId: sourceId, destinationBankAccountId: destId, amount, description: description.trim() })
      if (res.error) { toast.dismiss(toastId); toast.error(res.error); return }
      toast.dismiss(toastId); toast.success('Transferência efetuada com sucesso!')
      onClose(); if (onSuccess) onSuccess(); router.refresh()
    } catch (err: any) {
      toast.dismiss(toastId); toast.error(err?.message || 'Falha ao transferir.')
    } finally { setIsTransferring(false) }
  }

  const accountOptions = bankAccounts.map((b) => ({ value: b.id, label: `${b.bankName} (Saldo: ${formatCurrency(Number(b.currentBalance))})` }))

  return (
    <FinancialModal
      isOpen={isOpen} onClose={onClose}
      title={<><ArrowRightLeft className="h-5 w-5 text-emerald-800" /> Transferência Interna de Tesouraria</>}
      submitLabel="Executar Transferência" loading={isTransferring}
      submitDisabled={amount <= 0 || sourceId === destId} onSubmit={handleConfirmTransfer}
    >
      <div className="rounded-md border border-emerald-100 bg-emerald-50/60 p-2.5 text-emerald-950 text-[10px]">
        <div className="flex items-center gap-1.5 font-bold uppercase text-[11px]">
          <ShieldCheck className="h-4 w-4 text-emerald-800 shrink-0" />
          <span>Neutralidade Contábil no DRE (ADR-023)</span>
        </div>
        <p className="text-emerald-800 mt-0.5">Movimentação interna de recursos sem impacto no resultado da safra.</p>
      </div>
      <SelectField label="Conta de Origem (Débito):" value={sourceId} onChange={setSourceId} options={accountOptions} />
      <SelectField label="Conta de Destino (Crédito):" value={destId} onChange={setDestId} options={accountOptions} />
      <InputField label="Valor a Transferir (R$):" type="number" step="0.01" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="font-bold text-slate-900" />
      <InputField label="Motivo / Descrição:" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Suprimento do caixa em espécie para vistorias" />
    </FinancialModal>
  )
}
