'use client'

import React, { useState } from 'react'
import { updateBranchFinancialSettings } from '@/actions/financial/settings'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BranchSettingsFormProps {
  branchSettings: any
  branches: any[]
  currentBranchId?: string | null
}

export default function BranchSettingsForm({
  branchSettings,
  branches,
  currentBranchId,
}: BranchSettingsFormProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    currentBranchId || branches[0]?.id || ''
  )
  const [fixedCostTarget, setFixedCostTarget] = useState<number>(
    Number(branchSettings?.monthlyFixedCostTarget || 15000.0)
  )
  const [revenueTarget, setRevenueTarget] = useState<number>(
    Number(branchSettings?.monthlyRevenueTarget || 60000.0)
  )
  const [cropYear, setCropYear] = useState<string>(
    branchSettings?.activeCropYear || '2025/2026'
  )
  const [branchNotes, setBranchNotes] = useState<string>(branchSettings?.notes || '')
  const [isSavingBranch, setIsSavingBranch] = useState(false)

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBranchId) {
      toast.error('Selecione uma filial para configurar as metas.')
      return
    }

    setIsSavingBranch(true)
    const toastId = toast.loading('Atualizando metas da filial...')

    try {
      const res = await updateBranchFinancialSettings(selectedBranchId, {
        monthlyFixedCostTarget: fixedCostTarget,
        monthlyRevenueTarget: revenueTarget,
        activeCropYear: cropYear.trim() || '2025/2026',
        notes: branchNotes.trim() || undefined,
      })

      if (res.error) {
        toast.dismiss(toastId)
        toast.error(res.error)
        return
      }

      toast.dismiss(toastId)
      toast.success('Metas orçamentárias da filial salvas com sucesso!')
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err?.message || 'Falha ao salvar metas.')
    } finally {
      setIsSavingBranch(false)
    }
  }

  return (
    <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-900">
          Metas Orçamentárias & Faturamento por Filial
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Definição da safra ativa e tetos para apuração de "dinheiro novo" no DRE Executivo.
        </p>
      </div>

      <form onSubmit={handleSaveBranch} className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Selecionar Filial:</Label>
          <Select
            value={selectedBranchId}
            onValueChange={(val) => setSelectedBranchId(val || '')}
          >
            <SelectTrigger className="w-full text-xs font-semibold bg-white border-slate-200">
              <SelectValue placeholder="Selecione a filial" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  📍 {b.name} ({b.city})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Teto de Custos Fixos Mensais (R$):
            </Label>
            <Input
              type="number"
              step="100"
              min="0"
              value={fixedCostTarget}
              onChange={(e) => setFixedCostTarget(parseFloat(e.target.value) || 0)}
              className="text-xs font-bold text-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Meta de Faturamento Mensal (R$):
            </Label>
            <Input
              type="number"
              step="500"
              min="0"
              value={revenueTarget}
              onChange={(e) => setRevenueTarget(parseFloat(e.target.value) || 0)}
              className="text-xs font-bold text-emerald-800"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Ano Safra de Referência:</Label>
          <Input
            value={cropYear}
            onChange={(e) => setCropYear(e.target.value)}
            placeholder="2025/2026"
            className="text-xs font-semibold"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Observações / Diretrizes Orçamentárias:</Label>
          <Textarea
            value={branchNotes}
            onChange={(e) => setBranchNotes(e.target.value)}
            rows={2}
            placeholder="Exemplo: Prioridade em consultorias para produtores de soja e milho..."
            className="text-xs"
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSavingBranch}
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
          >
            {isSavingBranch ? 'Gravando...' : 'Atualizar Metas da Filial'}
          </Button>
        </div>
      </form>
    </div>
  )
}
