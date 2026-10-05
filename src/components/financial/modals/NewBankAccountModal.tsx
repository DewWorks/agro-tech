'use client'

import React, { useState } from 'react'
import { maskBankAgency, maskBankAccount } from '@/lib/utils'
import { createBankAccount } from '@/actions/financial/settings'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { FinancialModal, InputField, SelectField } from './FinancialModal'

export default function NewBankAccountModal({
  isOpen, onClose, branches, currentBranchId, onSuccess,
}: {
  isOpen: boolean; onClose: () => void; branches: any[]; currentBranchId?: string | null; onSuccess?: () => void
}) {
  const router = useRouter()
  const [branchId, setBranchId] = useState(currentBranchId || branches[0]?.id || '')
  const [bankName, setBankName] = useState('')
  const [bankCode, setBankCode] = useState('001')
  const [agency, setAgency] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountType, setAccountType] = useState<'CORRENTE' | 'POUPANCA' | 'CAIXA_ESPECIE'>('CORRENTE')
  const [initialBalance, setInitialBalance] = useState(0)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!branchId || !bankName.trim()) { toast.error('Preencha os campos obrigatórios.'); return }
    setIsCreating(true)
    const toastId = toast.loading('Cadastrando conta / caixa físico...')
    try {
      const res = await createBankAccount({
        branchId, bankName: bankName.trim(), bankCode: bankCode.trim() || '001',
        agency: agency.trim() || undefined, accountNumber: accountNumber.trim() || undefined,
        accountType, initialBalance,
      })
      if (res.error) { toast.dismiss(toastId); toast.error(res.error); return }
      toast.dismiss(toastId); toast.success('Conta bancária cadastrada com sucesso!')
      onClose(); if (onSuccess) onSuccess(); router.refresh()
    } catch (err: any) {
      toast.dismiss(toastId); toast.error(err?.message || 'Falha ao cadastrar conta.')
    } finally { setIsCreating(false) }
  }

  return (
    <FinancialModal
      isOpen={isOpen} onClose={onClose}
      title="Cadastrar Conta Bancária ou Caixa Físico" submitLabel="Cadastrar Conta"
      loading={isCreating} submitDisabled={!branchId || !bankName.trim()} onSubmit={handleCreate}
    >
      <SelectField label="Filial:" value={branchId} onChange={setBranchId} options={branches.map((b) => ({ value: b.id, label: `📍 ${b.name} (${b.city})` }))} />
      <SelectField
        label="Tipo de Recurso:" value={accountType} onChange={(val: any) => setAccountType(val)}
        options={[{ value: 'CORRENTE', label: 'Conta Corrente Bancária' }, { value: 'CAIXA_ESPECIE', label: 'Caixa Físico da Filial (Espécie)' }, { value: 'POUPANCA', label: 'Poupança' }]}
      />
      <InputField label="Nome da Instituição / Identificação:" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ex: Banco do Brasil S/A ou Caixa Físico Taguatinga" />
      {accountType !== 'CAIXA_ESPECIE' && (
        <div className="grid grid-cols-3 gap-2">
          <InputField label="Cód. Banco:" value={bankCode} onChange={(e) => setBankCode(e.target.value)} placeholder="001" maxLength={4} className="font-mono" />
          <InputField label="Agência:" value={agency} onChange={(e) => setAgency(maskBankAgency(e.target.value))} placeholder="1234-5" maxLength={8} className="font-mono" />
          <InputField label="Nº Conta:" value={accountNumber} onChange={(e) => setAccountNumber(maskBankAccount(e.target.value))} placeholder="12345-6" maxLength={15} className="font-mono" />
        </div>
      )}
      <InputField label="Saldo Inicial em Caixa / Abertura (R$):" type="number" step="0.01" value={initialBalance} onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)} className="font-bold text-slate-900" />
    </FinancialModal>
  )
}
