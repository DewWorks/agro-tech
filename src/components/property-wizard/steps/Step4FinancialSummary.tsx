'use client'

import React, { useState } from 'react'
import { UseFormReturn, useFormContext, useFieldArray } from 'react-hook-form'
import { AlertCircle } from 'lucide-react'

import {
  PURPOSE_OPTIONS,
  BANK_OPTIONS,
  PurposeOption,
  BankOption,
} from './step4-financial/options'
import { useFinancialSummaryCalculations } from './step4-financial/useFinancialSummaryCalculations'
import { FinancialKpiCards } from './step4-financial/FinancialKpiCards'
import { SecondaryCollateralSection } from './step4-financial/SecondaryCollateralSection'
import { AgroRevenuesSection } from './step4-financial/AgroRevenuesSection'
import { NonAgroAndExpensesSection } from './step4-financial/NonAgroAndExpensesSection'
import { QuickLimitSummary } from './step4-financial/QuickLimitSummary'
import { AmortizationAndIcsdGauge } from './step4-financial/AmortizationAndIcsdGauge'

export { PURPOSE_OPTIONS, BANK_OPTIONS, AmortizationAndIcsdGauge, QuickLimitSummary }
export type { PurposeOption, BankOption }

interface Step4FinancialSummaryProps {
  form?: UseFormReturn<any>
  isFinancialModuleDisabledForOrg?: boolean
  propertyId?: string
  onSaveAndSimulate?: () => void
}

export function Step4FinancialSummary({
  form,
  isFinancialModuleDisabledForOrg = false,
  propertyId,
  onSaveAndSimulate,
}: Step4FinancialSummaryProps) {
  const context = useFormContext()
  const activeForm: UseFormReturn<any> = (form || context) as any
  const { control } = activeForm

  // Field arrays para itens dinâmicos do MCR
  const {
    fields: urbanFields,
    append: appendUrban,
    remove: removeUrban,
  } = useFieldArray({ control, name: 'urbanProperties' })

  const {
    fields: vehicleFields,
    append: appendVehicle,
    remove: removeVehicle,
  } = useFieldArray({ control, name: 'vehicles' })

  const {
    fields: customAgroFields,
    append: appendAgro,
    remove: removeAgro,
  } = useFieldArray({ control, name: 'customAgroRevenues' })

  // Estados locais para acordeões
  const [showSecondaryAssets, setShowSecondaryAssets] = useState(false)
  const [showDetailedRevenues, setShowDetailedRevenues] = useState(false)

  // Cálculos matemáticos isolados em hook utilitário puro
  const calculations = useFinancialSummaryCalculations(activeForm)

  return (
    <div className="space-y-8">
      {/* ALERTA INFORMATIVO SUPER ADMIN */}
      {isFinancialModuleDisabledForOrg && (
        <div className="bg-amber-50/90 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60 rounded-xl p-4 flex items-start gap-3.5 text-amber-900 dark:text-amber-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm">Módulo "Resumo Financeiro & Limites" Desativado no Cliente</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 rounded-md border border-amber-300 dark:border-amber-700">
                Desligado
              </span>
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/40 px-2 py-0.5 rounded">
                Acesso Exclusivo Super Admin
              </span>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              Esta etapa e o dimensionamento de limites estão <strong>desativados na organização deste cliente</strong>. O formulário está acessível para você apenas devido ao seu privilégio de <strong>Super Admin</strong>.
            </p>
          </div>
        </div>
      )}

      {/* 1. CARDS ESTILO DASHBOARD (COMPOSIÇÃO PATRIMONIAL CONSOLIDADA) */}
      <FinancialKpiCards
        landValue={calculations.landValue}
        totalArea={calculations.totalArea}
        machineryValue={calculations.machineryValue}
        machineriesCount={calculations.machineriesCount}
        improvementsValue={calculations.improvementsValue}
        improvementsCount={calculations.improvementsCount}
        livestockValue={calculations.livestockValue}
        livestocksCount={calculations.livestocksCount}
        totalAssetsWithSecondary={calculations.totalAssetsWithSecondary}
        ruralAssetsTotal={calculations.ruralAssetsTotal}
        urbanTotal={calculations.urbanTotal}
        vehiclesTotal={calculations.vehiclesTotal}
        mcrAcceptableCollateral={calculations.mcrAcceptableCollateral}
        formatBRL={calculations.formatBRL}
        showSecondaryAssets={showSecondaryAssets}
        setShowSecondaryAssets={setShowSecondaryAssets}
      />

      {/* SEÇÃO EXPANSÍVEL: BENS SECUNDÁRIOS DE GARANTIA (MCR) */}
      {showSecondaryAssets && (
        <SecondaryCollateralSection
          activeForm={activeForm}
          urbanFields={urbanFields}
          appendUrban={appendUrban}
          removeUrban={removeUrban}
          vehicleFields={vehicleFields}
          appendVehicle={appendVehicle}
          removeVehicle={removeVehicle}
        />
      )}

      {/* 2. ENTRADAS DE FLUXO DE CAIXA E CAPACIDADE DE PAGAMENTO */}
      <NonAgroAndExpensesSection
        activeForm={activeForm}
        showDetailedRevenues={showDetailedRevenues}
        setShowDetailedRevenues={setShowDetailedRevenues}
        riskAnalysis={calculations.riskAnalysis}
        formatBRL={calculations.formatBRL}
      >
        <AgroRevenuesSection
          activeForm={activeForm}
          showDetailedRevenues={showDetailedRevenues}
          setShowDetailedRevenues={setShowDetailedRevenues}
          customAgroFields={customAgroFields}
          appendAgro={appendAgro}
          removeAgro={removeAgro}
          formatBRL={calculations.formatBRL}
        />
      </NonAgroAndExpensesSection>

      {/* 3. RESUMO OPERACIONAL & ENCAMINHAMENTO PARA O MÓDULO DE LIMITES (MCR) */}
      <QuickLimitSummary
        activeForm={activeForm}
        propertyId={propertyId}
        formatBRL={calculations.formatBRL}
        onSaveAndSimulate={onSaveAndSimulate}
      />
    </div>
  )
}
