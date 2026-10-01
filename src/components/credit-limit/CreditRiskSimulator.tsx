'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Loader2, Coins } from 'lucide-react'
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
  onPropertyChange,
}: CreditRiskSimulatorProps) {
  const {
    propertiesList,
    selectedPropertyId,
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
  } = useCreditRiskSimulator({ initialPropertyId, onPropertyChange })

  return (
    <div className="space-y-6">
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

      {loadingProperty ? (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            Carregando lastro patrimonial e fluxo de caixa da propriedade...
          </p>
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
