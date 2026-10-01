'use client'

import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { DollarSign, Layers, CheckCircle2, AlertCircle } from 'lucide-react'
import { FinancialEngineResult } from '@/lib/financial-engine'

interface NonAgroAndExpensesSectionProps {
  activeForm: UseFormReturn<any>
  showDetailedRevenues: boolean
  setShowDetailedRevenues: (v: boolean | ((prev: boolean) => boolean)) => void
  riskAnalysis: FinancialEngineResult | null
  formatBRL: (val: number) => string
  children?: React.ReactNode
}

export function NonAgroAndExpensesSection({
  activeForm,
  showDetailedRevenues,
  setShowDetailedRevenues,
  riskAnalysis,
  formatBRL,
  children,
}: NonAgroAndExpensesSectionProps) {
  const { control } = activeForm

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Fluxo de Receitas, Despesas e Endividamento Bancário
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDetailedRevenues(!showDetailedRevenues)}
            className="text-xs text-emerald-800 hover:text-emerald-900 hover:bg-emerald-50 gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            {showDetailedRevenues ? 'Ocultar Culturas Detalhadas' : '+ Discriminar por Cultura/Lote'}
          </Button>
        </div>
        <CardDescription className="text-xs text-slate-600 dark:text-slate-300 mt-1">
          Informe os dados financeiros anuais do proponente para validação da capacidade de pagamento (MCR - Banco do Brasil / Sicredi).
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Discriminação de culturas (AgroRevenuesSection) */}
        {children}

        {/* Grid de Inputs Globais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name="effectiveAgroRevenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  Receita Agropecuária Efetiva (Safra Anterior)
                </FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value}
                    onChangeValue={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    placeholder="0,00"
                    className="text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </FormControl>
                <FormDescription>Receita comprovada da última safra</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="projectedAgroRevenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  Receita Agropecuária Projetada (Safra Atual)
                </FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value}
                    onChangeValue={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    placeholder="0,00"
                    className="text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </FormControl>
                <FormDescription>Previsão para o ano vigente</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="otherRevenues"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Outras Receitas Comprovadas</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value}
                    onChangeValue={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    placeholder="0,00"
                    className="text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </FormControl>
                <FormDescription>Rendas externas e complementares</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name="operationalExpenses"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-700 dark:text-amber-400 font-semibold">
                  Custos Operacionais & Produção (Anual)
                </FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value}
                    onChangeValue={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    placeholder="0,00"
                    className="text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </FormControl>
                <FormDescription>Insumos, sementes, defensivos, diesel e colheita</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="existingDebtService"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-rose-700 dark:text-rose-400 font-semibold">
                  Passivo / Dívidas Bancárias Vigentes
                </FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value}
                    onChangeValue={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    placeholder="0,00"
                    className="text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </FormControl>
                <FormDescription>Parcelas anuais de bancos, Finame, CPRs</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="familyLivingCosts"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custo de Vida Familiar (Anual)</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value}
                    onChangeValue={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    placeholder="0,00"
                    className="text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </FormControl>
                <FormDescription>Manutenção do lar e pró-labore do produtor</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* DIAGNÓSTICO DE CAPACIDADE DE PAGAMENTO */}
        {riskAnalysis && (
          <div
            className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              riskAnalysis.icsd.paymentCapacity >= 0
                ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40'
                : 'bg-red-50/70 border-red-200 dark:bg-red-950/20 dark:border-red-800/40'
            }`}
          >
            <div className="flex items-start gap-3">
              {riskAnalysis.icsd.paymentCapacity >= 0 ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {riskAnalysis.icsd.paymentCapacity >= 0
                    ? 'Capacidade de Pagamento Superavitária (Aprovável)'
                    : 'Atenção: Fluxo de Caixa Negativo ou Insuficiente'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Receitas Líquidas: <strong>{formatBRL(riskAnalysis.icsd.totalNetInflows)}</strong> | Despesas e
                  Dívidas: <strong>{formatBRL(riskAnalysis.icsd.totalExpenses)}</strong>
                </p>
              </div>
            </div>

            <div className="text-left md:text-right">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Capacidade de Pagamento Líquida (CP):
              </span>
              <p
                className={`text-xl font-extrabold ${
                  riskAnalysis.icsd.paymentCapacity >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatBRL(riskAnalysis.icsd.paymentCapacity)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
