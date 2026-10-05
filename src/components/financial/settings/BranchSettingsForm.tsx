'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Building2,
  MapPin,
  TrendingDown,
  Target,
  Calendar,
  Save,
  FileText,
  Calculator,
} from 'lucide-react'
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
import { formatCurrency } from '@/lib/utils'

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

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

  // Sincroniza com as props quando o router atualiza a filial
  useEffect(() => {
    if (branchSettings) {
      setFixedCostTarget(Number(branchSettings.monthlyFixedCostTarget || 15000.0))
      setRevenueTarget(Number(branchSettings.monthlyRevenueTarget || 60000.0))
      setCropYear(branchSettings.activeCropYear || '2025/2026')
      setBranchNotes(branchSettings.notes || '')
    }
  }, [branchSettings])

  const handleBranchChange = (branchId: string | null) => {
    if (!branchId) return
    setSelectedBranchId(branchId)
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('branchId', branchId)
      router.push(`/admin/financial/settings?${params.toString()}`)
    })
  }

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBranchId) {
      toast.error('Selecione uma filial para configurar as metas.')
      return
    }

    setIsSavingBranch(true)
    const toastId = toast.loading('Atualizando metas e parâmetros da filial...')

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
      router.refresh()
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err?.message || 'Falha ao salvar metas.')
    } finally {
      setIsSavingBranch(false)
    }
  }

  const selectedBranch = branches.find((b) => b.id === selectedBranchId)
  const estimatedSurplus = Math.max(0, (revenueTarget || 0) - (fixedCostTarget || 0))

  return (
    <form onSubmit={handleSaveBranch} className="max-w-4xl space-y-5">
      {/* 1. Seletor de Filial em Destaque */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Unidade Operacional
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Metas Orçamentárias & Faturamento por Filial
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Definição da safra ativa e tetos para apuração de &quot;dinheiro novo&quot; no DRE Executivo.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <Select
              value={selectedBranchId}
              onValueChange={handleBranchChange}
              disabled={isPending}
            >
              <SelectTrigger className="w-full h-10 text-xs font-semibold bg-slate-50 border-slate-200 focus:bg-white cursor-pointer">
                <SelectValue placeholder="Selecione a filial">
                  {selectedBranch ? (
                    <span className="flex items-center gap-2 truncate">
                      <Building2 className="h-4 w-4 text-emerald-800 shrink-0" />
                      <span className="truncate font-bold text-slate-900">{selectedBranch.name}</span>
                    </span>
                  ) : (
                    'Selecione a filial'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    <span className="flex items-center justify-between gap-2 w-full">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span className="font-semibold">{b.name}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium ml-2">
                        {b.city}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Card 1: Ponto de Equilíbrio (Teto de Custos Fixos Mensais) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-800 flex items-center justify-center shrink-0">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <Label htmlFor="fixedCost" className="text-sm font-bold text-slate-900 cursor-pointer">
                  Ponto de Equilíbrio (Teto de Custos Fixos Mensais)
                </Label>
                <p className="text-xs text-slate-500">Teto mensal de despesas obrigatórias</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800 border border-rose-200/60">
              Piso Obrigatório
            </span>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">Teto Mensal Estimado:</Label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-bold text-slate-400 select-none pointer-events-none">
                R$
              </span>
              <Input
                id="fixedCost"
                type="number"
                step="100"
                min="0"
                value={fixedCostTarget}
                onChange={(e) => setFixedCostTarget(parseFloat(e.target.value) || 0)}
                className="pl-10 text-sm font-bold text-slate-900 bg-slate-50/50 focus:bg-white"
              />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pt-1">
              Valor mensal necessário para manter aluguel, energia, internet e salários da filial. Define o piso de despesas obrigatórias no DRE.
            </p>
          </div>
        </div>

        {/* Card 2: Meta de Faturamento Mensal (Dinheiro Novo) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <Label htmlFor="revenueTarget" className="text-sm font-bold text-slate-900 cursor-pointer">
                  Meta de Faturamento (Dinheiro Novo)
                </Label>
                <p className="text-xs text-slate-500">Receitas mensais operacionais almejadas</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200/60">
              Meta de Liquidez
            </span>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">Meta Mensal:</Label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-bold text-slate-400 select-none pointer-events-none">
                R$
              </span>
              <Input
                id="revenueTarget"
                type="number"
                step="500"
                min="0"
                value={revenueTarget}
                onChange={(e) => setRevenueTarget(parseFloat(e.target.value) || 0)}
                className="pl-10 text-sm font-bold text-emerald-900 bg-slate-50/50 focus:bg-white"
              />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pt-1">
              Meta operacional de receitas necessárias para cobrir custos fixos e compras parceladas com folga de caixa.
            </p>
          </div>
        </div>
      </div>

      {/* Caixa de Balanço Orçamentário Projetado */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Calculator className="w-5 h-5 text-emerald-700 shrink-0" />
          <div>
            <strong className="block text-emerald-900 font-bold">Balanço Operacional Alvo da Unidade:</strong>
            <span className="text-emerald-800">
              Meta de Receita ({formatCurrency(revenueTarget)}) - Custos Fixos ({formatCurrency(fixedCostTarget)})
            </span>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-[11px] text-emerald-700 uppercase font-semibold block">Superávit Projetado:</span>
          <span className="text-base font-black text-emerald-900">
            {formatCurrency(estimatedSurplus)} / mês
          </span>
        </div>
      </div>

      {/* Card 3: Ano Safra & Diretrizes */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <Label htmlFor="cropYear" className="text-sm font-bold text-slate-900 cursor-pointer">
                Ano Safra Corrente & Diretrizes da Filial
              </Label>
              <p className="text-xs text-slate-500">Período contábil vigente e observações estratégicas</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
            Safra Ativa
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Ano Safra:</Label>
            <Input
              id="cropYear"
              value={cropYear}
              onChange={(e) => setCropYear(e.target.value)}
              placeholder="2025/2026"
              className="text-xs font-bold text-slate-900"
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Observações / Diretrizes Orçamentárias:</Label>
            <Textarea
              value={branchNotes}
              onChange={(e) => setBranchNotes(e.target.value)}
              rows={2}
              placeholder="Exemplo: Prioridade na safra para honorários de custeio agrícola de soja e milho..."
              className="text-xs"
            />
          </div>
        </div>
      </div>

      {/* Ação de Salvamento */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="submit"
          disabled={isSavingBranch || isPending}
          className="bg-[#113025] hover:bg-[#163d30] text-white font-bold gap-2 px-6 h-10 shadow-xs cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {isSavingBranch ? 'Atualizando Metas...' : 'Atualizar Metas da Filial'}
        </Button>
      </div>
    </form>
  )
}
