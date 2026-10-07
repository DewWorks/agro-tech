import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Coins,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  FileSpreadsheet,
  ExternalLink,
  AlertCircle,
  Zap,
  Loader2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TechnicalResponsibleForm } from '../TechnicalResponsibleForm'
import { CustomOptions } from '../../../types/wizard-types'
import { checkProducerCreditAnalysis } from '@/actions/credit-analysis'

interface StepFinanceAndResponsibleProps {
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
  onBack: () => void
  onAdvance: () => void
  isLimiteCredito: boolean
  hasParamsStep: boolean
  stepRTPending: string[]
  selectedTemplateCode?: string
  producerId?: string
  propertyId?: string
  cropYear?: string
}

export function StepFinanceAndResponsible({
  customOptions,
  setCustomOptions,
  onBack,
  onAdvance,
  isLimiteCredito,
  stepRTPending,
  selectedTemplateCode,
  producerId,
  propertyId,
  cropYear,
}: StepFinanceAndResponsibleProps) {
  const isCreaRequired = [
    'PROJETO_INOVAGRO',
    'PROJETO_RENOVAGRO',
    'PROJETO_CUSTEIO_SAFRA',
  ].includes(selectedTemplateCode || '')

  const rev = Number(customOptions.annualRevenue) || 0
  const exp = Number(customOptions.annualExpenses) || 0
  const debts = Number(customOptions.existingDebts) || 0
  const netCapacity = Math.max(0, rev - exp - debts)

  // Consulta do Limite MCR / ICSD ativo
  const activeCropYear =
    cropYear || customOptions.custeioSafraYear || customOptions.cropYear || '2025/2026'

  const currentFinancedAmount =
    Number(customOptions.financedAmount) ||
    Number(customOptions.renovagroFinanced) ||
    Number(customOptions.inovagroFinanced) ||
    (Number(customOptions.custeioAreaHa || 0) * Number(customOptions.custeioCostPerHa || 0)) ||
    (Number(customOptions.custeioQuantity || 0) * Number(customOptions.custeioUnitPrice || 0)) ||
    Number(customOptions.requestedAmount) ||
    0

  const [analysis, setAnalysis] = useState<{
    id: string
    icsdValue: number
    isIcsdApproved: boolean
    ltvRatio: number
    isLtvApproved: boolean
    requestedAmount: number
    creditLineName: string
    cropYear: string
    status: string
    propertyId?: string | null
    producerId: string
  } | null>(null)
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)

  useEffect(() => {
    if (!producerId) return
    let isMounted = true
    setIsLoadingAnalysis(true)

    checkProducerCreditAnalysis({
      producerId,
      propertyId,
      cropYear: activeCropYear,
    })
      .then((res) => {
        if (!isMounted) return
        if (res.success && res.analysis) {
          setAnalysis(res.analysis)
        } else {
          setAnalysis(null)
        }
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Erro ao consultar análise MCR:', err)
      })
      .finally(() => {
        if (isMounted) setIsLoadingAnalysis(false)
      })

    return () => {
      isMounted = false
    }
  }, [producerId, propertyId, activeCropYear])

  const renderMcrLookupWidget = () => (
    <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4.5 space-y-3 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              Consulta Rápida de Limite MCR & Balanço Financeiro
              <span className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                Safra {activeCropYear}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Verificação em tempo real de capacidade de pagamento e índice de cobertura do serviço da dívida (ICSD).
            </p>
          </div>
        </div>
      </div>

      {isLoadingAnalysis ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Consultando Análise de Limite MCR ativa no banco de dados...</span>
        </div>
      ) : analysis ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-700">ICSD Apurado:</span>
              <span
                className={cn(
                  "text-xs font-extrabold px-2.5 py-0.5 rounded-md border inline-flex items-center gap-1",
                  analysis.isIcsdApproved
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-amber-50 text-amber-800 border-amber-300"
                )}
              >
                ICSD: {analysis.icsdValue.toFixed(2)}x — {analysis.isIcsdApproved ? 'Apto' : 'Com Restrições'}
              </span>
              <span className="text-[11px] text-slate-500">
                (Trava mínima BACEN: 1.20x)
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Limite analisado: <strong>R$ {analysis.requestedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> • Linha: {analysis.creditLineName} • LTV: {analysis.ltvRatio.toFixed(1)}%
            </p>
          </div>

          <Link
            href={`/admin/credit-limit?propertyId=${analysis.propertyId || propertyId || ''}&tab=overview`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shrink-0 cursor-pointer border border-slate-300 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>[Ver Balanço]</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Nenhuma Análise de Limite MCR registrada para esta propriedade na safra {activeCropYear}.</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Você pode simular agora a viabilidade deste projeto e apurar o ICSD oficial antes de submeter ao banco.
            </p>
          </div>

          <Link
            href={`/admin/credit-limit?propertyId=${propertyId || ''}&producerId=${producerId || ''}&amount=${currentFinancedAmount}&tab=simulator`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shrink-0 shadow-2xs cursor-pointer active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
            <span>Simular Limite MCR para este Valor</span>
          </Link>
        </div>
      )}
    </div>
  )

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

        {/* Widget de Consulta Rápida MCR */}
        {renderMcrLookupWidget()}

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
              ? "Viabilidade Financeira Aprovada: Margem líquida positiva suficiente para amortização de novos financiamentos e limites."
              : "Atenção: As despesas operacionais e amortizações de dívidas superam a receita declarada."}
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
                id="field-responsible-name"
                value={customOptions.responsibleName || ''}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, responsibleName: e.target.value }))}
                className={cn(
                  "h-10 text-xs transition-colors",
                  !customOptions.responsibleName?.trim()
                    ? "border-amber-400 bg-amber-50/20 focus-visible:ring-amber-400 focus:border-amber-500"
                    : "border-gray-200 bg-white focus-visible:ring-emerald-500"
                )}
                placeholder="Nome do Responsável Técnico"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-700 font-medium">Nº do CREA / Região (Opcional)</Label>
              <Input
                id="field-crea-number"
                value={customOptions.creaNumber || ''}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, creaNumber: e.target.value }))}
                className="h-10 text-xs bg-white border-gray-200 focus-visible:ring-emerald-500"
                placeholder="Opcional: Ex: CREA/TO 12345-D"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-700 font-medium">Nº da ART / TRT (Opcional)</Label>
              <Input
                id="field-art-number"
                value={customOptions.artNumber || ''}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, artNumber: e.target.value }))}
                className="h-10 text-xs bg-white border-gray-200 focus-visible:ring-emerald-500"
                placeholder="Opcional: Ex: ART 2026/0987654"
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

      {/* Widget de Consulta Rápida: Limite MCR & Balanço Financeiro da Safra Ativa */}
      {renderMcrLookupWidget()}

      <TechnicalResponsibleForm
        customOptions={customOptions}
        setCustomOptions={setCustomOptions}
        pendingFields={stepRTPending}
        isCreaRequired={isCreaRequired}
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
