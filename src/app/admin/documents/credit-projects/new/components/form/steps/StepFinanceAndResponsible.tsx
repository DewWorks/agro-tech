import React from 'react'
import { Coins, ArrowLeft, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TechnicalResponsibleForm } from '../TechnicalResponsibleForm'
import { CustomOptions } from '../../../types/wizard-types'

interface StepFinanceAndResponsibleProps {
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
  onBack: () => void
  onAdvance: () => void
  isLimiteCredito: boolean
  hasParamsStep: boolean
  stepRTPending: string[]
}

export function StepFinanceAndResponsible({
  customOptions,
  setCustomOptions,
  onBack,
  onAdvance,
  isLimiteCredito,
  stepRTPending
}: StepFinanceAndResponsibleProps) {
  const rev = Number(customOptions.annualRevenue) || 0
  const exp = Number(customOptions.annualExpenses) || 0
  const debts = Number(customOptions.existingDebts) || 0
  const netCapacity = Math.max(0, rev - exp - debts)

  if (isLimiteCredito) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Coins className="h-5 w-5 text-[#1B4D3E]" />
            Passo 4: Capacidade de Pagamento & Responsável Técnico
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Informe as receitas brutas, custos operacionais e dívidas bancárias do proponente para o cálculo da margem líquida de endividamento.
          </p>
        </div>

        {/* Cartão de Indicador em Destaque */}
        <div className={cn(
          "p-5 rounded-2xl border space-y-2 transition-all shadow-2xs",
          netCapacity > 0 
            ? "bg-emerald-50/80 border-emerald-300 text-emerald-950" 
            : "bg-red-50/80 border-red-300 text-red-950"
        )}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-bold uppercase tracking-wide opacity-90">
              Capacidade de Pagamento Líquida Estimada (Anual):
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              R$ {netCapacity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs opacity-80 leading-relaxed">
            {netCapacity > 0 
              ? "✓ Viabilidade Financeira Aprovada: Margem líquida positiva suficiente para amortização de novos financiamentos e limites."
              : "⚠️ Atenção: As despesas operacionais e amortizações de dívidas superam a receita declarada."}
          </p>
        </div>

        {/* Linha 1: Finanças */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Receita Bruta Anual Total (R$)</Label>
            <Input
              type="number"
              value={customOptions.annualRevenue || ''}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, annualRevenue: Number(e.target.value) }))}
              className="h-10 text-xs font-semibold"
              placeholder="0,00"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Despesas Operacionais Anuais (R$)</Label>
            <Input
              type="number"
              value={customOptions.annualExpenses || ''}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, annualExpenses: Number(e.target.value) }))}
              className="h-10 text-xs font-semibold"
              placeholder="0,00"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Dívidas Preexistentes / SCR BACEN (R$/ano)</Label>
            <Input
              type="number"
              value={customOptions.existingDebts || ''}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, existingDebts: Number(e.target.value) }))}
              className="h-10 text-xs font-semibold"
              placeholder="0,00"
            />
          </div>
        </div>

        {/* Linha 2: Responsável Técnico */}
        <div className="p-5 bg-slate-50 border border-gray-200 rounded-xl space-y-3">
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wide block">
            Dados do Responsável Técnico do Projeto
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-700 font-medium">Nome do Responsável Técnico *</Label>
              <Input
                value={customOptions.responsibleName || ''}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, responsibleName: e.target.value }))}
                className={cn("h-10 text-xs bg-white", !customOptions.responsibleName?.trim() && "border-amber-400")}
                placeholder="Nome do Responsável Técnico"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-700 font-medium">Nº do CREA / Região</Label>
              <Input
                value={customOptions.creaNumber || ''}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, creaNumber: e.target.value }))}
                className="h-10 text-xs bg-white"
                placeholder="Ex: CREA/TO 12345-D"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-700 font-medium">Nº da ART / TRT</Label>
              <Input
                value={customOptions.artNumber || ''}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, artNumber: e.target.value }))}
                className="h-10 text-xs bg-white"
                placeholder="Ex: ART 2026/0987654"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="text-xs h-10 px-5 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar: Benfeitorias & Rebanho
          </Button>
          <Button
            type="button"
            onClick={onAdvance}
            className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-semibold h-10 px-6 rounded-xl shadow-xs"
          >
            Avançar: Revisão & Emissão Oficial
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </div>
    )
  }

  // Other templates (TechnicalResponsibleForm)
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Coins className="h-5 w-5 text-[#1B4D3E]" />
            Responsável Técnico & Dados Financeiros
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Informe os dados do engenheiro ou técnico habilitado responsável pelo projeto junto ao Banco do Brasil.
          </p>
        </div>
        {stepRTPending.length > 0 && (
          <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 font-bold self-start">
            {stepRTPending.length} Campo(s) Pendente(s)
          </span>
        )}
      </div>

      <TechnicalResponsibleForm
        customOptions={customOptions}
        setCustomOptions={setCustomOptions}
        pendingFields={stepRTPending}
      />

      <div className="pt-4 border-t border-gray-100 flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="text-xs h-10 px-5 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar
        </Button>
        <Button
          type="button"
          onClick={onAdvance}
          className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-semibold h-10 px-6 rounded-xl shadow-xs"
        >
          Avançar: Revisão & Emissão
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>
    </div>
  )
}
