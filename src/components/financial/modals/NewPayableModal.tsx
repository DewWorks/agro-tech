'use client'

import React, { useState, useMemo } from 'react'
import { formatCurrency } from '@/lib/utils'
import { createDirectPayableTitle } from '@/actions/financial/payables'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { FinancialModal, FormField, InputField, SelectField } from './FinancialModal'

const PRESETS = [
  { name: 'ART CREA-TO', supplier: 'CREA-TO', cat: '2.1.01', type: 'CUSTO_DIRETO_PROPOSTA' as const, val: 285.5, notes: 'ART de Crédito Rural' },
  { name: 'Combustível de Campo', supplier: 'Posto Petrobras Regional', cat: '2.1.02', type: 'CUSTO_DIRETO_PROPOSTA' as const, val: 450.0, notes: 'Vistoria' },
  { name: 'Cartório e Certidões', supplier: 'Cartório de Imóveis', cat: '2.1.03', type: 'CUSTO_DIRETO_PROPOSTA' as const, val: 180.0, notes: 'Certidão' },
  { name: 'Despesa Fixa (Aluguel)', supplier: 'Locador Imóvel Filial', cat: '2.2.01', type: 'DESPESA_FIXA_FILIAL' as const, val: 2200.0, notes: 'Aluguel' },
]

export default function NewPayableModal({
  isOpen, onClose, branches, categories, demands, currentBranchId, onSuccess,
}: {
  isOpen: boolean; onClose: () => void; branches: any[]; categories: any[]; demands: any[]; currentBranchId?: string | null; onSuccess: () => void
}) {
  const [branchId, setBranchId] = useState(currentBranchId || branches[0]?.id || '')
  const [supplierName, setSupplierName] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [demandId, setDemandId] = useState('')
  const [expenseType, setExpenseType] = useState<'CUSTO_DIRETO_PROPOSTA' | 'DESPESA_FIXA_FILIAL' | 'COMISSAO_PARCEIRO'>('CUSTO_DIRETO_PROPOSTA')
  const [totalAmount, setTotalAmount] = useState(285.5)
  const [isInstallment, setIsInstallment] = useState(false)
  const [numInstallments, setNumInstallments] = useState(2)
  const [firstDueDate, setFirstDueDate] = useState(new Date(Date.now() + 864e6).toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const installmentsGrid = useMemo(() => {
    const count = isInstallment ? Math.max(1, numInstallments) : 1
    const base = Math.floor((totalAmount / count) * 100) / 100
    const rem = Math.round((totalAmount - base * count) * 100) / 100
    const start = new Date(firstDueDate)
    return Array.from({ length: count }, (_, i) => {
      const d = new Date(start)
      d.setMonth(d.getMonth() + i)
      return { installmentNumber: i + 1, totalInstallments: count, dueDate: d.toISOString().slice(0, 10), amount: i === 0 ? base + rem : base }
    })
  }, [isInstallment, numInstallments, totalAmount, firstDueDate])

  const applyPreset = (p: (typeof PRESETS)[0]) => {
    setSupplierName(p.supplier); setExpenseType(p.type); setTotalAmount(p.val); setNotes(p.notes); setIsInstallment(false)
    const cat = categories.find((c) => c.code === p.cat)
    if (cat) setCategoryId(cat.id)
  }

  const handleCreate = async () => {
    if (!branchId || !supplierName.trim() || !categoryId || totalAmount <= 0) {
      toast.error('Preencha os campos obrigatórios e garanta um valor positivo.'); return
    }
    setIsCreating(true)
    const toastId = toast.loading('Lançando obrigação e gerando boletos...')
    try {
      const res = await createDirectPayableTitle({
        branchId, categoryId, demandId: demandId || undefined, supplierName: supplierName.trim(),
        documentNumber: docNumber.trim() || undefined, expenseType, cropYear: '2025/2026', totalAmount,
        isInstallmentPurchase: isInstallment, notes: notes.trim() || undefined,
        installments: installmentsGrid.map((inst) => ({ ...inst, dueDate: new Date(inst.dueDate).toISOString() })),
      })
      if (res.error) { toast.dismiss(toastId); toast.error(res.error); return }
      toast.dismiss(toastId); toast.success('Obrigação registrada com sucesso!')
      onClose(); onSuccess()
    } catch (err: any) {
      toast.dismiss(toastId); toast.error(err?.message || 'Erro ao registrar obrigação.')
    } finally { setIsCreating(false) }
  }

  return (
    <FinancialModal
      isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl"
      title="Apropriação de Despesa & Boletos Futuros" submitLabel="Confirmar & Registrar Obrigação"
      loading={isCreating} submitDisabled={totalAmount <= 0 || !supplierName.trim()} onSubmit={handleCreate}
    >
      <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-2">
        <span className="text-[10px] font-bold uppercase text-emerald-800 mb-1 block">⚡ Presets Frequentes:</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {PRESETS.map((p) => (
            <button key={p.name} type="button" onClick={() => applyPreset(p)} className="text-left rounded border border-emerald-200 bg-white p-1 hover:border-emerald-600">
              <div className="font-bold text-[11px] text-emerald-900 truncate">{p.name}</div>
              <div className="text-[10px] text-slate-500">{formatCurrency(p.val)}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <SelectField label="Filial:" value={branchId} onChange={setBranchId} options={branches.map((b) => ({ value: b.id, label: `📍 ${b.name}` }))} />
        <SelectField label="Categoria Financeira:" value={categoryId} onChange={setCategoryId} options={categories.map((c) => ({ value: c.id, label: `[${c.code}] ${c.name}` }))} />
        <InputField label="Fornecedor / Credor:" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Nome da empresa ou prestador" />
        <InputField label="Nº do Documento / Nota / Boleto:" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="NF 12345 / Boleto 001" className="font-mono" />
        <SelectField
          label="Centro de Custo / Proposta (Opcional):" value={demandId || 'NONE'} onChange={(val) => setDemandId(val === 'NONE' ? '' : val)}
          options={[{ value: 'NONE', label: 'Despesa Geral da Filial' }, ...demands.map((d) => ({ value: d.id, label: `🚜 ${d.producer?.name} (${d.serviceType})` }))]}
        />
        <InputField label="Valor Total (R$):" type="number" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)} className="font-bold text-slate-900" />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-1.5">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="font-bold text-slate-800 text-xs">Compra Parcelada a Prazo (Boletos Futuros)</span>
          <input type="checkbox" checked={isInstallment} onChange={(e) => setIsInstallment(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-800" />
        </label>
        {isInstallment && (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
            <SelectField label="Parcelas:" value={String(numInstallments)} onChange={(val) => setNumInstallments(parseInt(val || '2', 10))} options={[2, 3, 4, 5, 6, 10, 12].map((n) => ({ value: String(n), label: `${n}x` }))} />
            <InputField label="Primeiro Vencimento:" type="date" value={firstDueDate} onChange={(e) => setFirstDueDate(e.target.value)} />
            <div className="col-span-2 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">Grade Projetada:</span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-20 overflow-y-auto">
                {installmentsGrid.map((inst) => (
                  <div key={inst.installmentNumber} className="rounded border border-slate-200 bg-white p-1 text-[10px]">
                    <div className="font-bold text-slate-700">{inst.installmentNumber}/{inst.totalInstallments}</div>
                    <div className="text-rose-700 font-extrabold">{formatCurrency(inst.amount)}</div>
                    <div className="text-[9px] text-slate-400">{new Date(inst.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <FormField label="Observações / Detalhes:">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Ex: Detalhes do pagamento..." className="text-xs" />
      </FormField>
    </FinancialModal>
  )
}
