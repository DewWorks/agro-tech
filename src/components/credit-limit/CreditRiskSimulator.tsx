'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Loader2, Coins } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { CREDIT_LINES_CATALOG } from '@/constants/credit-lines'
import { useCreditRiskSimulator } from './hooks/useCreditRiskSimulator'
import { SimulatorPropertyHeader } from './simulator-sections/SimulatorPropertyHeader'
import { SimulatorAssetsAndCashFlowCards } from './simulator-sections/SimulatorAssetsAndCashFlowCards'
import { SimulatorParametersForm } from './simulator-sections/SimulatorParametersForm'
import { SimulatorKpiMetrics } from './simulator-sections/SimulatorKpiMetrics'
import { PrescriptiveActionCard } from './PrescriptiveActionCard'
import { DossiePreviewModal } from './DossiePreviewModal'
import { CreditRiskSimulatorProps } from '@/types/credit-limit.types'

export type { CreditRiskSimulatorProps }

/**
 * Orquestrador visual de Simulação de Limite de Crédito e Risco Bancário MCR.
 * Integração com o Motor Financeiro (Aditivo 003) e Dossiê Técnico Oficial.
 */
export function CreditRiskSimulator({
  initialPropertyId,
  initialProducerId,
  initialAmount,
  initialCreditLine,
  initialTargetBank,
  initialPropertiesList,
  initialSimulationData,
  onPropertyChange,
}: CreditRiskSimulatorProps) {
  const {
    propertiesList,
    selectedPropertyId,
    selectedProducerId,
    currentProperty,
    loadingProperty,
    simulationData,
    creditLineCode,
    purpose,
    targetBank,
    requestedAmount,
    termMonths,
    graceMonths,
    interestRate,
    amortizationSystem,
    riskAnalysis,
    isSaving,
    isPreviewOpen,
    previewHtml,
    previewFileName,
    isLoadingPreview,
    hasUrlParams,
    setPurpose,
    setTargetBank,
    setRequestedAmount,
    setTermMonths,
    setGraceMonths,
    setInterestRate,
    setAmortizationSystem,
    handleSelectCreditLine,
    handleSelectProperty,
    handleSaveSimulation,
    handleOpenPreviewModal,
    handleClosePreviewModal,
  } = useCreditRiskSimulator({
    initialPropertyId,
    initialProducerId,
    initialAmount,
    initialCreditLine,
    initialTargetBank,
    initialPropertiesList,
    initialSimulationData,
    onPropertyChange,
  })

  return (
    <div className="space-y-6">
      {/* 0. BANNER DE FEEDBACK VISUAL IMEDIATO NA TRANSIÇÃO DE MÓDULOS */}
      {(loadingProperty || (hasUrlParams && !simulationData)) && (
        <div className="flex items-center gap-3 p-3.5 bg-emerald-50/90 border border-emerald-200 text-emerald-950 rounded-xl text-sm animate-pulse shadow-xs">
          <Loader2 className="w-4 h-4 animate-spin text-[#1B4D3E] shrink-0" />
          <span>
            <strong>Sincronizando Análise MCR:</strong> Carregando dados cadastrais, garantias e fluxo financeiro para a operação solicitada...
          </span>
        </div>
      )}

      {/* 1. SELETOR PRINCIPAL DE PROPRIEDADE RURAL & AÇÕES DE CABEÇALHO */}
      <SimulatorPropertyHeader
        propertiesList={propertiesList}
        selectedPropertyId={selectedPropertyId}
        currentProperty={currentProperty}
        onSelectProperty={handleSelectProperty}
        onSave={handleSaveSimulation}
        isSaving={isSaving}
        onOpenPreview={handleOpenPreviewModal}
        isLoadingProperty={loadingProperty}
        hasSimulationData={Boolean(simulationData)}
      />

      {loadingProperty && !simulationData ? (
        <div className="space-y-6 animate-pulse">
          {/* Skeleton de Cards de Entrada: Balanço & Fluxo de Caixa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-48 rounded-lg" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
              <Skeleton className="h-9 w-36 rounded-md" />
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-4 w-5/6 rounded" />
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-48 rounded-lg" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
              <Skeleton className="h-9 w-36 rounded-md" />
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-4 w-5/6 rounded" />
              </div>
            </div>
          </div>

          {/* Skeleton do Simulador MCR */}
          <div className="p-6 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 bg-white dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-950 pb-3">
              <Skeleton className="h-6 w-64 rounded-md" />
              <Skeleton className="h-5 w-32 rounded-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <Skeleton className="h-28 w-full rounded-2xl bg-emerald-50/50" />
          </div>
        </div>
      ) : !simulationData ? (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <Coins className="w-8 h-8 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Nenhuma Propriedade Selecionada
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Selecione uma propriedade na caixa acima para carregar o balanço financeiro e efetuar a simulação de risco MCR.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 2. BANNER DE RESUMO DO IMÓVEL, AVISO CRM & QUADROS DE ENTRADA (LASTRO / FLUXO DE CAIXA) */}
          <SimulatorAssetsAndCashFlowCards
            simulationData={simulationData}
            selectedPropertyId={selectedPropertyId}
          />

          {/* 3. SIMULADOR DE CRÉDITO RURAL & ENQUADRAMENTO MCR */}
          <Card className="border-emerald-300 dark:border-emerald-800/80 shadow-md bg-gradient-to-b from-white via-slate-50/50 to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20">
            <CardHeader className="pb-3 border-b border-emerald-100 dark:border-emerald-900/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-[#1B4D3E] dark:text-emerald-400">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    Simulador Financeiro de Risco e Enquadramento MCR
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Motor Financeiro: Amortização bancária (PRICE vs. SAC), teste de estresse do ICSD (trava ≥ 1,20) e LTV de garantias.
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="bg-emerald-100 text-[#1B4D3E] border-emerald-300 text-[11px] font-bold px-2.5 py-0.5"
                >
                  Inteligência de Risco Bancário
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-6">
              {/* Parâmetros do Financiamento */}
              <SimulatorParametersForm
                creditLineCode={creditLineCode}
                onSelectCreditLine={handleSelectCreditLine}
                purpose={purpose}
                onChangePurpose={setPurpose}
                targetBank={targetBank}
                onChangeTargetBank={setTargetBank}
                requestedAmount={requestedAmount}
                onChangeRequestedAmount={setRequestedAmount}
                amortizationSystem={amortizationSystem}
                onChangeAmortizationSystem={setAmortizationSystem}
                termMonths={termMonths}
                onChangeTermMonths={setTermMonths}
                graceMonths={graceMonths}
                onChangeGraceMonths={setGraceMonths}
                interestRate={interestRate}
                onChangeInterestRate={setInterestRate}
              />

              {/* Indicadores Chave de Risco (KPIs) & Painel Prescritivo */}
              {riskAnalysis && (
                <div className="space-y-4 pt-2">
                  <SimulatorKpiMetrics
                    amortization={riskAnalysis.amortization}
                    amortizationSystem={amortizationSystem}
                    icsd={riskAnalysis.icsd}
                    ltv={riskAnalysis.ltv}
                  />

                  <PrescriptiveActionCard
                    propertyId={selectedPropertyId}
                    producerId={simulationData.producer?.id || currentProperty?.producerId}
                    requestedAmount={requestedAmount}
                    annualDebtService={riskAnalysis.amortization.annualDebtService}
                    paymentCapacity={riskAnalysis.icsd.paymentCapacity}
                    icsd={riskAnalysis.icsd.icsdValue}
                    ltvPercent={riskAnalysis.ltv.coverageRatioPercent}
                    totalCollateral={riskAnalysis.ltv.totalDeclaredCollateral}
                    acceptableCollateral={riskAnalysis.ltv.totalAcceptableCollateral}
                    creditLineName={
                      CREDIT_LINES_CATALOG.find((l) => l.code === creditLineCode)?.name || creditLineCode
                    }
                    creditLineCode={creditLineCode}
                    targetBank={targetBank}
                    termMonths={termMonths}
                    amortizationSystem={amortizationSystem}
                    purpose={purpose}
                    hasRevenues={
                      (simulationData.cashFlow.effectiveAgroRevenue || 0) > 0 ||
                      (simulationData.cashFlow.projectedAgroRevenue || 0) > 0 ||
                      (riskAnalysis.icsd.grossAgroRevenue || 0) > 0
                    }
                    isApproved={riskAnalysis.icsd.isApproved && riskAnalysis.ltv.isApproved}
                    overallStatus={riskAnalysis.overallStatus}
                    summaryOpinion={riskAnalysis.summaryOpinion}
                    regulatoryNotes={riskAnalysis.regulatoryNotes || []}
                    onSetAmortizationSystem={setAmortizationSystem}
                    onSetTermMonths={setTermMonths}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. MODAL DE PRÉ-VISUALIZAÇÃO DO DOSSIÊ TÉCNICO */}
      <DossiePreviewModal
        isOpen={isPreviewOpen}
        onClose={handleClosePreviewModal}
        html={previewHtml}
        isLoading={isLoadingPreview}
        fileName={previewFileName}
        propertyId={selectedPropertyId}
        propertyName={currentProperty?.name || currentProperty?.propertyName || 'Propriedade Rural'}
        producerName={currentProperty?.producerName}
        icsdStatus={riskAnalysis?.icsd.classification}
        icsdValue={riskAnalysis?.icsd.icsdValue}
        ltvPercent={riskAnalysis?.ltv.coverageRatioPercent}
        ltvApproved={riskAnalysis?.ltv.isApproved}
      />
    </div>
  )
}
