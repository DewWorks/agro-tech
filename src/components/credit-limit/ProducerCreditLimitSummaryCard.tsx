'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  ArrowUpRight,
  TrendingUp,
  Layers,
  Award,
  RefreshCw,
  Landmark,
  Scale,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/utils/formatters'
import { CREDIT_LINES_CATALOG } from '@/constants/credit-lines'
import {
  calculatePaymentCapacity,
  calculateFullCreditRiskAnalysis,
  AmortizationSystem,
  CreditLineAxis,
  AgroActivityType,
  RevenueRealizationType,
  ExpenseCategory,
} from '@/lib/financial-engine'
import {
  listCreditAnalyses,
  saveCreditAnalysis,
  setOfficialCreditAnalysis,
} from '@/actions/credit-analysis'

export interface ProducerCreditLimitSummaryCardProps {
  activeForm: UseFormReturn<any>
  producerId?: string
  propertyId?: string
  onSaveAndSimulate?: () => void
}

interface AnalysisItem {
  id: string
  creditLineCode: string
  creditLineName: string
  creditLineAxis: string
  requestedAmount: number
  annualDebtService: number
  paymentCapacity: number
  icsdValue: number
  isIcsdApproved: boolean
  totalCollateralAcceptable: number
  ltvRatio: number
  isLtvApproved: boolean
  status: string
  cropYear: string
  targetBank: string
  createdAt: string | Date
  property?: { id: string; name?: string; propertyName?: string }
}

export function ProducerCreditLimitSummaryCard({
  activeForm,
  producerId: propProducerId,
  propertyId,
  onSaveAndSimulate,
}: ProducerCreditLimitSummaryCardProps) {
  const router = useRouter()
  const { watch, getValues } = activeForm

  // Obter IDs dinâmicos do formulário caso não passados por prop
  const effectiveProducerId = propProducerId || watch('producerId')
  const formCreditLineCode = watch('creditLineCode') || 'PRONAMP_CUSTEIO'
  const formTargetBank = watch('creditLimitTargetBank') || 'BANCO_DO_BRASIL'

  // Análises existentes no banco
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null)

  // 1. Carregar análises do produtor via Server Action
  const loadAnalyses = useCallback(async () => {
    if (!effectiveProducerId) return
    try {
      setIsLoading(true)
      const res = await listCreditAnalyses({
        producerId: effectiveProducerId,
        propertyId: propertyId || undefined,
      })
      if (res.success && res.data) {
        const mapped: AnalysisItem[] = (res.data as any[]).map((a) => ({
          id: a.id,
          creditLineCode: a.creditLineCode,
          creditLineName: a.creditLineName,
          creditLineAxis: a.creditLineAxis,
          requestedAmount: Number(a.requestedAmount) || 0,
          annualDebtService: Number(a.annualDebtService) || 0,
          paymentCapacity: Number(a.paymentCapacity) || 0,
          icsdValue: Number(a.icsdValue) || 0,
          isIcsdApproved: Boolean(a.isIcsdApproved),
          totalCollateralAcceptable: Number(a.totalCollateralAcceptable) || 0,
          ltvRatio: Number(a.ltvRatio) || 0,
          isLtvApproved: Boolean(a.isLtvApproved),
          status: a.status,
          cropYear: a.cropYear,
          targetBank: a.targetBank,
          createdAt: a.createdAt,
          property: a.property,
        }))
        setAnalyses(mapped)
        if (mapped.length > 0 && !selectedAnalysisId) {
          // Prioriza análise homologada/validada se houver, ou a mais recente
          const official = mapped.find((item) => item.status === 'VALIDADO')
          setSelectedAnalysisId(official ? official.id : mapped[0].id)
        }
      }
    } catch (err) {
      console.error('[ProducerCreditLimitSummaryCard] Erro ao carregar análises:', err)
    } finally {
      setIsLoading(false)
    }
  }, [effectiveProducerId, propertyId, selectedAnalysisId])

  useEffect(() => {
    loadAnalyses()
  }, [loadAnalyses])

  // 2. Análise atualmente selecionada para visualização detalhada
  const selectedAnalysis = useMemo(() => {
    if (!selectedAnalysisId) return analyses[0] || null
    return analyses.find((a) => a.id === selectedAnalysisId) || analyses[0] || null
  }, [analyses, selectedAnalysisId])

  // 3. Recálculo Dinâmico em Tempo Real dos Dados do Formulário
  const effectiveAgro = Number(watch('effectiveAgroRevenue')) || 0
  const projectedAgro = Number(watch('projectedAgroRevenue')) || 0
  const otherRev = Number(watch('otherRevenues')) || 0
  const operationalExp = Number(watch('operationalExpenses')) || 0
  const familyCosts = Number(watch('familyLivingCosts')) || 0
  const existingDebt = Number(watch('existingDebtService')) || 0
  const customAgro = watch('customAgroRevenues') || []
  const customExp = watch('customExpenses') || []
  const requestedAmt = Number(watch('creditLimitRequested')) || 0
  const termMonthsForm = Number(watch('creditLimitTermMonths')) || 12

  // Capacidade de Pagamento Líquida apurada nos campos ativos
  const liveCpResult = useMemo(() => {
    return calculatePaymentCapacity({
      effectiveAgroRevenue: effectiveAgro,
      projectedAgroRevenue: projectedAgro,
      operationalExpenses: operationalExp,
      nonAgroRevenues: otherRev,
      familyLivingCosts: familyCosts,
      existingDebtService: existingDebt,
      customAgroRevenues: customAgro,
      customExpenses: customExp,
    })
  }, [effectiveAgro, projectedAgro, operationalExp, otherRev, familyCosts, existingDebt, customAgro, customExp])

  const liveCP = liveCpResult.paymentCapacity

  // Teto Máximo Suportado Estimado com a CP atual do formulário
  const estimatedSupportedCeiling = useMemo(() => {
    if (liveCP <= 0) return 0
    const currentCode = selectedAnalysis?.creditLineCode || formCreditLineCode
    const lineDef = CREDIT_LINES_CATALOG.find((l) => l.code === currentCode)
    const axis = lineDef?.axis || CreditLineAxis.CUSTEIO
    const term = termMonthsForm > 0 ? termMonthsForm : lineDef?.defaultTermMonths || 12
    const rate = lineDef?.defaultInterestRate || 8.0

    // Simulação aproximada de teto viável (ICSD >= 1.20)
    // Para custeio anual (12m @ 8%), encargo = principal * 1.08 => teto = (CP / 1.20) / 1.08
    if (axis === CreditLineAxis.CUSTEIO && term <= 12) {
      return (liveCP / 1.20) / (1 + rate / 100)
    }

    // Para investimento plurianual (SAC/PRICE): teto aproximadamente CP * anos * 0.75
    const years = Math.max(1, Math.round(term / 12))
    return Math.min(liveCP * years * 0.85, liveCP * 6)
  }, [liveCP, selectedAnalysis?.creditLineCode, formCreditLineCode, termMonthsForm])

  // Ação: Definir análise como Oficial (Homologada)
  const handleSetOfficial = async (analysisId: string) => {
    try {
      const res = await setOfficialCreditAnalysis(analysisId, effectiveProducerId)
      if (res.success) {
        toast.success('Análise de crédito homologada como oficial com sucesso!')
        setAnalyses((prev) =>
          prev.map((a) => (a.id === analysisId ? { ...a, status: 'VALIDADO' } : a))
        )
      } else {
        toast.error(res.error || 'Falha ao homologar análise de crédito.')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao homologar análise.')
    }
  }

  // Ação: Atualizar Limite MCR com estes Dados (Sincronização Atômica)
  const handleUpdateLimitWithFormData = async () => {
    if (!effectiveProducerId) {
      toast.error('Produtor não informado para sincronização de limite.')
      return
    }

    try {
      setIsUpdating(true)
      const values = getValues()

      const landVal =
        values.totalArea && values.vtnPerHectare
          ? Number(values.totalArea) * Number(values.vtnPerHectare)
          : 0
      const impVal = (values.improvements || []).reduce(
        (sum: number, i: any) => sum + (Number(i.quantity) || 0) * (Number(i.unitValue) || 0),
        0
      )
      const machVal = (values.machineries || []).reduce(
        (sum: number, m: any) => sum + (Number(m.value) || 0),
        0
      )
      const liveVal = (values.livestocks || []).reduce(
        (sum: number, l: any) => sum + (Number(l.quantity) || 0) * (Number(l.unitValue) || 0),
        0
      )

      const targetAmount =
        Number(values.creditLimitRequested) > 100
          ? Number(values.creditLimitRequested)
          : estimatedSupportedCeiling > 100
          ? Math.round(estimatedSupportedCeiling)
          : 250000

      const res = await saveCreditAnalysis({
        producerId: effectiveProducerId,
        propertyId: propertyId || undefined,
        branchId: values.branchId || undefined,
        creditLineCode: values.creditLineCode || formCreditLineCode || 'PRONAMP_CUSTEIO',
        requestedAmount: targetAmount,
        amortizationSystem: (values.amortizationSystem || 'PRICE') as any,
        totalTermMonths: Number(values.creditLimitTermMonths) || 12,
        gracePeriodMonths: Number(values.gracePeriodMonths) || 0,
        interestRateAnnual: Number(values.interestRateAnnual) || 8.0,
        effectiveAgroRevenue: effectiveAgro,
        projectedAgroRevenue: projectedAgro,
        nonAgroRevenue: otherRev,
        productionCosts: operationalExp,
        familyLivingExpenses: familyCosts,
        existingDebtService: existingDebt,
        landValue: landVal,
        improvementsValue: impVal,
        machineryValue: machVal,
        livestockValue: liveVal,
        creditLimitPurpose: values.creditLimitPurpose || 'CUSTEIO_AGRICOLA',
        creditLimitTargetBank: values.creditLimitTargetBank || 'BANCO_DO_BRASIL',
        urbanProperties: values.urbanProperties as any,
        vehicles: values.vehicles as any,
        customAgroRevenues: customAgro as any,
        customExpenses: customExp as any,
      })

      if (res.success) {
        toast.success('Limite MCR atualizado e sincronizado com sucesso no CRM e motor de risco!')
        await loadAnalyses()
      } else {
        toast.error(res.error || 'Erro ao sincronizar limite MCR.')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Erro ao sincronizar limite MCR.')
    } finally {
      setIsUpdating(false)
    }
  }

  // Ação: Abrir Simulador MCR diretamente com contexto
  const handleOpenSimulator = () => {
    if (onSaveAndSimulate) {
      onSaveAndSimulate()
      return
    }

    const targetAmount =
      requestedAmt > 100
        ? requestedAmt
        : selectedAnalysis && selectedAnalysis.requestedAmount > 100
        ? selectedAnalysis.requestedAmount
        : Math.round(estimatedSupportedCeiling) || 250000

    const params = new URLSearchParams()
    params.set('tab', 'simulator')
    if (propertyId) params.set('propertyId', propertyId)
    if (effectiveProducerId) params.set('producerId', effectiveProducerId)
    params.set('amount', String(targetAmount))
    if (selectedAnalysis?.creditLineCode) {
      params.set('creditLine', selectedAnalysis.creditLineCode)
    } else if (formCreditLineCode) {
      params.set('creditLine', formCreditLineCode)
    }
    if (selectedAnalysis?.targetBank || formTargetBank) {
      params.set('bank', selectedAnalysis?.targetBank || formTargetBank)
    }

    router.push(`/admin/credit-limit?${params.toString()}`)
  }

  return (
    <div className="rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Top Banner do Card */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#1B4D3E] to-emerald-900 text-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-emerald-800">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-white tracking-tight">
                Central de Limites MCR do Produtor
              </h4>
              <span className="text-[10px] font-semibold bg-emerald-800 text-emerald-200 border border-emerald-600/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Motor de Risco Ativo
              </span>
            </div>
            <p className="text-xs text-emerald-100/80 mt-0.5 leading-relaxed">
              Análises de crédito oficiais, homologação perante Banco do Brasil/Sicredi e recálculo dinâmico da capacidade.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={loadAnalyses}
            disabled={isLoading}
            className="text-xs text-emerald-200 hover:text-white flex items-center gap-1.5 p-1.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            title="Recarregar análises de crédito"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            <span className="text-[11px]">Recarregar</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* Seletor de Análises Existentes (Pills de Linhas de Crédito) */}
        {analyses.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                Linhas Vinculadas na Safra Ativa:
              </span>
              <span className="text-[11px] text-slate-500">
                {analyses.length} {analyses.length === 1 ? 'análise registrada' : 'análises registradas'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {analyses.map((item) => {
                const isSelected = selectedAnalysis?.id === item.id
                const isOfficial = item.status === 'VALIDADO'
                const isApproved = item.isIcsdApproved && item.isLtvApproved

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedAnalysisId(item.id)}
                    className={cn(
                      'text-xs px-3 py-2 rounded-lg border font-medium flex items-center gap-2 transition-all cursor-pointer text-left',
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    )}
                  >
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        isApproved ? 'bg-emerald-500' : 'bg-amber-500'
                      )}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[170px] sm:max-w-[220px]">
                          {item.creditLineName ? item.creditLineName.split('-')[0].trim() : item.creditLineCode}
                        </span>
                        {isOfficial && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-300">
                            Oficial
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {item.requestedAmount > 0 ? formatBRL(item.requestedAmount) : 'Sob Demanda'} • {item.targetBank.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Nenhuma análise de crédito finalizada no MCR para este produtor nesta safra.</span>
            </div>
            <span className="text-[11px] text-slate-500 italic shrink-0">
              Pronto para simulação
            </span>
          </div>
        )}

        {/* Quadro de Destaques: Limite Ativo / Teto / Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Status do Limite */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Status do Limite</span>
              {selectedAnalysis?.status === 'VALIDADO' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              )}
            </div>
            <div className="mt-2">
              {selectedAnalysis ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border inline-flex items-center gap-1',
                        selectedAnalysis.status === 'VALIDADO'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : selectedAnalysis.status === 'REPROVADO'
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      )}
                    >
                      {selectedAnalysis.status === 'VALIDADO' ? 'Aprovado (Oficial)' : selectedAnalysis.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 pt-0.5">
                    ICSD: <strong>{selectedAnalysis.icsdValue > 0 ? `${selectedAnalysis.icsdValue.toFixed(2)}x` : 'N/D'}</strong> • LTV: <strong>{selectedAnalysis.ltvRatio > 0 ? `${selectedAnalysis.ltvRatio.toFixed(1)}%` : 'N/D'}</strong>
                  </p>
                </div>
              ) : (
                <div>
                  <span className="bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                    Pendente
                  </span>
                  <p className="text-[10.5px] text-slate-500 pt-1">
                    Aguardando emissão do parecer oficial
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Teto Máximo Suportado com Dados do Form */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Teto Máximo Suportado
              </span>
              <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                MCR
              </span>
            </div>
            <div className="mt-2">
              <div className="text-lg font-black text-emerald-950">
                {formatBRL(estimatedSupportedCeiling)}
              </div>
              <p className="text-[10.5px] text-emerald-800 leading-tight pt-0.5">
                Baseado na CP apurada de {formatBRL(liveCP)} e folga regulamentar.
              </p>
            </div>
          </div>

          {/* Card 3: Valor Solicitado / Proposto */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Valor Pretendido</span>
              <Scale className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="mt-2">
              <div className="text-lg font-black text-slate-900 dark:text-slate-100">
                {formatBRL(
                  requestedAmt > 100
                    ? requestedAmt
                    : selectedAnalysis && selectedAnalysis.requestedAmount > 100
                    ? selectedAnalysis.requestedAmount
                    : estimatedSupportedCeiling > 100
                    ? estimatedSupportedCeiling
                    : 250000
                )}
              </div>
              <p className="text-[10.5px] text-slate-500 leading-tight pt-0.5">
                {selectedAnalysis?.creditLineName ? selectedAnalysis.creditLineName.split('-')[0].trim() : 'PRONAMP Custeio'}
              </p>
            </div>
          </div>

          {/* Card 4: Capacidade de Pagamento Líquida (CP) */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">CP Líquida em Formulário</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-2">
              <div className={cn(
                'text-lg font-black',
                liveCP > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'
              )}>
                {formatBRL(liveCP)}
              </div>
              <p className="text-[10.5px] text-slate-500 leading-tight pt-0.5">
                {liveCP > 0 ? 'Superavitária para amortização' : 'Preencha receitas para viabilizar'}
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé de Ações de Sincronização */}
        <div className="pt-2 border-t border-slate-200/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {selectedAnalysis && selectedAnalysis.status !== 'VALIDADO' && (
              <button
                type="button"
                onClick={() => handleSetOfficial(selectedAnalysis.id)}
                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Homologar Análise como Oficial</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleUpdateLimitWithFormData}
              disabled={isUpdating}
              className="bg-[#1B4D3E] hover:bg-[#143e32] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm inline-flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isUpdating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-300" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-emerald-300" />
              )}
              <span>{isUpdating ? 'Atualizando Limite...' : 'Atualizar Limite MCR com estes Dados'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenSimulator}
            className="bg-white hover:bg-emerald-50 text-[#1B4D3E] border border-emerald-300 hover:border-emerald-500 text-xs font-bold px-4 py-2 rounded-lg shadow-2xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Simulador de Crédito MCR Completo</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-700" />
          </button>
        </div>
      </div>
    </div>
  )
}
