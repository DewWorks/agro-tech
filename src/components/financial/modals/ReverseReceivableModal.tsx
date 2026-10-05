'use client'

import React, { useState } from 'react'
import { ShieldAlert, AlertTriangle } from 'lucide-react'
import { reverseReceivablePayment } from '@/actions/financial/receivables'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { FinancialModal, FormField } from './FinancialModal'

export default function ReverseReceivableModal({
  isOpen, onClose, selectedTransaction, onSuccess,
}: {
  isOpen: boolean; onClose: () => void; selectedTransaction: any; onSuccess: () => void
}) {
  const [justification, setJustification] = useState('')
  const [isReversing, setIsReversing] = useState(false)

  const handleConfirmReverse = async () => {
    if (!selectedTransaction || justification.trim().length < 15) return
    setIsReversing(true)
    const toastId = toast.loading('Processando estorno atômico e rastreabilidade...')
    try {
      const res = await reverseReceivablePayment({ transactionId: selectedTransaction.id, justification: justification.trim() })
      if (res.error) { toast.dismiss(toastId); toast.error(res.error); return }
      toast.dismiss(toastId); toast.success('Estorno realizado com sucesso. Saldo e comissões reajustados.')
      onClose(); onSuccess()
    } catch (err: any) {
      toast.dismiss(toastId); toast.error(err?.message || 'Falha ao executar estorno.')
    } finally { setIsReversing(false) }
  }

  return (
    <FinancialModal
      isOpen={isOpen} onClose={onClose}
      title={<><ShieldAlert className="h-5 w-5 text-rose-600" /> Estorno de Liquidação Financeira</>}
      submitLabel="Confirmar Estorno Irreversível" submitVariant="rose"
      loading={isReversing} submitDisabled={justification.trim().length < 15}
      onSubmit={handleConfirmReverse}
    >
      <div className="rounded-md border border-rose-200 bg-rose-50 p-2.5 text-rose-900 text-[11px]">
        <div className="flex items-center gap-1.5 font-semibold text-rose-950">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>Regra de Governança (ADR-023):</span>
        </div>
        <p className="text-rose-800 mt-0.5">O estorno reverterá o saldo atomicamente, re-bloqueará a comissão do parceiro, invalidará o recibo e gerará log perpétuo.</p>
      </div>
      <FormField label={`Justificativa Formal do Estorno (${justification.length}/15 caracteres):`}>
        <Textarea
          placeholder="Exemplo: Lançamento efetuado em duplicidade pelo operador no caixa..."
          value={justification} onChange={(e) => setJustification(e.target.value)} rows={3} className="text-xs"
        />
      </FormField>
    </FinancialModal>
  )
}
