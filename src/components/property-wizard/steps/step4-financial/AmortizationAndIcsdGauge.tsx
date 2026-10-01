'use client'

import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Sparkles, FileCheck, ShieldCheck } from 'lucide-react'
import { CREDIT_LINES_CATALOG } from '@/constants/credit-lines'
import { AmortizationSystem, CreditLineAxis, FinancialEngineResult } from '@/lib/financial-engine'
import { PURPOSE_OPTIONS, BANK_OPTIONS } from './options'

interface AmortizationAndIcsdGaugeProps {
  activeForm: UseFormReturn<any>
  creditLineCode: string
  amortizationSystem: AmortizationSystem
  riskAnalysis: FinancialEngineResult | null
  formatBRL: (val: number) => string
}

export function AmortizationAndIcsdGauge({
  activeForm,
  creditLineCode,
  amortizationSystem,
  riskAnalysis,
  formatBRL,
}: AmortizationAndIcsdGaugeProps) {
  const { control, setValue, register, watch } = activeForm

  return (
    <Card className="border-emerald-300 dark:border-emerald-800/80 shadow-md bg-gradient-to-b from-white via-slate-50/50 to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20">
      <CardHeader className="pb-3 border-b border-emerald-100 dark:border-emerald-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-[#1B4D3E] dark:text-emerald-400">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Simulador Financeiro de Risco e Enquadramento MCR
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Motor Financeiro do Aditivo 003: Amortização bancária (PRICE vs. SAC), teste de estresse do ICSD (trava ≥ 1,20) e LTV de garantias.
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-emerald-100 text-[#1B4D3E] border-emerald-300 text-[11px] font-bold px-2.5 py-0.5">
            Inteligência de Risco Bancário
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-6">
        {/* Seletor do Catálogo Oficial das 15 Linhas */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              Linha de Financiamento Oficial (Catálogo das 15 Linhas BB/Cooperativas)
            </Label>
            <span className="text-[10px] text-slate-500">MCR / Banco Central</span>
          </div>

          <Select
            value={creditLineCode}
            onValueChange={(code) => {
              const found = CREDIT_LINES_CATALOG.find((l) => l.code === code)
              if (found) {
                setValue('creditLineCode', found.code)
                setValue('creditLimitTermMonths', found.defaultTermMonths)
                setValue('interestRateAnnual', found.defaultInterestRate)
                setValue('gracePeriodMonths', found.defaultGraceMonths)
                setValue('amortizationSystem', found.axis === CreditLineAxis.INVESTIMENTO ? 'SAC' : 'PRICE')
              }
            }}
          >
            <SelectTrigger className="h-10 text-xs bg-slate-50/60 dark:bg-slate-800/60 font-semibold border-slate-300">
              <SelectValue placeholder="Selecione o programa de crédito..." />
            </SelectTrigger>
            <SelectContent className="max-h-[320px]">
              <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
                Eixo de Custeio Agropecuário
              </div>
              {CREDIT_LINES_CATALOG.filter((l) => l.axis === CreditLineAxis.CUSTEIO).map((line) => (
                <SelectItem key={line.code} value={line.code} className="text-xs py-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{line.name}</span>
                  <span className="text-[10px] text-slate-500 block">
                    Taxa: {line.defaultInterestRate}% a.a. • Prazo: {line.defaultTermMonths}m • {line.mcrRef}
                  </span>
                </SelectItem>
              ))}

              <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400 mt-2">
                Eixo de Investimento e Modernização
              </div>
              {CREDIT_LINES_CATALOG.filter((l) => l.axis === CreditLineAxis.INVESTIMENTO).map((line) => (
                <SelectItem key={line.code} value={line.code} className="text-xs py-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{line.name}</span>
                  <span className="text-[10px] text-slate-500 block">
                    Taxa: {line.defaultInterestRate}% a.a. • Prazo: {line.defaultTermMonths}m (Carência: {line.defaultGraceMonths}m) • {line.mcrRef}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dados da Proposta: Finalidade & Banco Alvo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="creditLimitPurpose"
            render={({ field }) => {
              const currentValue = field.value || 'CUSTEIO_AGRICOLA'
              const selectedPurpose = PURPOSE_OPTIONS.find((opt) => opt.value === currentValue) || PURPOSE_OPTIONS[0]
              const SelectedIcon = selectedPurpose.icon

              return (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Finalidade do Crédito</FormLabel>
                  <Select value={currentValue} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="text-xs h-9 bg-white dark:bg-slate-900">
                        <SelectValue placeholder="Selecione a finalidade">
                          <span className="flex items-center gap-2 truncate">
                            <SelectedIcon className={`w-3.5 h-3.5 shrink-0 ${selectedPurpose.iconColor}`} />
                            <span className="truncate">{selectedPurpose.label}</span>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="min-w-[340px]">
                      {PURPOSE_OPTIONS.map((opt) => {
                        const Icon = opt.icon
                        return (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs py-2">
                            <span className="flex items-center gap-2.5">
                              <Icon className={`w-4 h-4 shrink-0 ${opt.iconColor}`} />
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {opt.label}
                              </span>
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-[10px]">
                    Destinação técnica dos recursos (MCR)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )
            }}
          />

          <FormField
            control={control}
            name="creditLimitTargetBank"
            render={({ field }) => {
              const currentValue = field.value || 'BANCO_DO_BRASIL'
              const selectedBank = BANK_OPTIONS.find((opt) => opt.value === currentValue) || BANK_OPTIONS[0]
              const SelectedIcon = selectedBank.icon

              return (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Instituição Financeira Proponente</FormLabel>
                  <Select value={currentValue} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="text-xs h-9 bg-white dark:bg-slate-900">
                        <SelectValue placeholder="Selecione a instituição">
                          <span className="flex items-center gap-2 truncate">
                            <SelectedIcon className={`w-3.5 h-3.5 shrink-0 ${selectedBank.iconColor}`} />
                            <span className="truncate">{selectedBank.label}</span>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="min-w-[280px]">
                      {BANK_OPTIONS.map((opt) => {
                        const Icon = opt.icon
                        return (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs py-2">
                            <span className="flex items-center gap-2.5">
                              <Icon className={`w-4 h-4 shrink-0 ${opt.iconColor}`} />
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {opt.label}
                              </span>
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-[10px]">
                    Agente financeiro para enquadramento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
        </div>

        {/* Grid de Parâmetros de Simulação */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Valor Pretendido (R$) *
            </Label>
            <CurrencyInput
              value={watch('creditLimitRequested')}
              onChangeValue={(val) =>
                setValue('creditLimitRequested', val, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              placeholder="0,00"
              className="mt-1 font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Sistema de Amortização
            </Label>
            <Select
              value={amortizationSystem}
              onValueChange={(val) =>
                setValue('amortizationSystem', val, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger className="h-9 text-xs mt-1 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRICE">Sistema PRICE (Prestações Fixas)</SelectItem>
                <SelectItem value="SAC">Sistema SAC (Amortização Constante)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Prazo Total (Meses)
            </Label>
            <Input
              type="number"
              min={1}
              className="text-xs h-9 mt-1 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
              {...register('creditLimitTermMonths', { valueAsNumber: true })}
            />
          </div>

          <div>
            <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Carência (Meses)
            </Label>
            <Input
              type="number"
              min={0}
              className="text-xs h-9 mt-1 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
              {...register('gracePeriodMonths', { valueAsNumber: true })}
            />
          </div>

          <div>
            <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Taxa de Juros (% a.a.)
            </Label>
            <div className="relative flex items-center mt-1">
              <Input
                type="number"
                step="0.1"
                className="text-xs h-9 pr-7 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
                {...register('interestRateAnnual', { valueAsNumber: true })}
              />
              <span className="absolute right-2.5 text-slate-400 dark:text-slate-500 font-semibold text-xs select-none pointer-events-none">
                %
              </span>
            </div>
          </div>
        </div>

        {/* PAINEL DE RESULTADO E INDICADORES DE RISCO EM TEMPO REAL */}
        {riskAnalysis && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Parcela de Estresse da Dívida */}
              <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                  Parcela Anual do Serviço da Dívida
                </span>
                <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {formatBRL(riskAnalysis.amortization.annualDebtService)}
                </p>
                <span className="text-[10px] text-slate-500">
                  {riskAnalysis.amortization.system === 'PRICE' ? 'Prestação constante' : 'Ano 1 pós-carência (Pior cenário)'}
                </span>
              </div>

              {/* 2. Indicador ICSD */}
              <div
                className={`p-3.5 rounded-xl border ${
                  riskAnalysis.icsd.classification === 'APROVADO_CONFORTAVEL'
                    ? 'bg-emerald-50/80 border-emerald-300'
                    : riskAnalysis.icsd.classification === 'APROVADO_ALERTA'
                    ? 'bg-amber-50/80 border-amber-300'
                    : 'bg-red-50/80 border-red-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-700">
                    Índice ICSD (Corte ≥ 1,20)
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-bold ${
                      riskAnalysis.icsd.isApproved
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-red-100 text-red-800 border-red-300'
                    }`}
                  >
                    {riskAnalysis.icsd.isApproved ? 'Aprovado' : 'Reprovado'}
                  </Badge>
                </div>
                <p
                  className={`text-xl font-black mt-0.5 ${
                    riskAnalysis.icsd.classification === 'APROVADO_CONFORTAVEL'
                      ? 'text-emerald-800'
                      : riskAnalysis.icsd.classification === 'APROVADO_ALERTA'
                      ? 'text-amber-800'
                      : 'text-red-700'
                  }`}
                >
                  {riskAnalysis.icsd.icsdValue.toFixed(2)}x
                </p>
                <span className="text-[10px] text-slate-600 block">
                  CP de {formatBRL(riskAnalysis.icsd.paymentCapacity)}
                </span>
              </div>

              {/* 3. Indicador LTV e Cobertura */}
              <div
                className={`p-3.5 rounded-xl border ${
                  riskAnalysis.ltv.isApproved
                    ? 'bg-emerald-50/80 border-emerald-300'
                    : 'bg-red-50/80 border-red-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-700">
                    Cobertura de Garantia (LTV)
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-bold ${
                      riskAnalysis.ltv.isApproved
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-red-100 text-red-800 border-red-300'
                    }`}
                  >
                    {riskAnalysis.ltv.isApproved ? 'Seguro' : 'Insuficiente'}
                  </Badge>
                </div>
                <p className="text-xl font-black text-slate-900 mt-0.5">
                  {riskAnalysis.ltv.coverageRatioPercent.toFixed(1)}%
                </p>
                <span className="text-[10px] text-slate-600 block">
                  Garantias: {formatBRL(riskAnalysis.ltv.totalAcceptableCollateral)}
                </span>
              </div>
            </div>

            {/* Parecer Técnico e Fundamentação MCR */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Parecer Preliminar Automatizado de Risco Bancário
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold border-0 ${
                    riskAnalysis.overallStatus === 'APROVADO'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : riskAnalysis.overallStatus === 'APROVADO_COM_RESTRICOES'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {riskAnalysis.overallStatus.replace(/_/g, ' ')}
                </Badge>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {riskAnalysis.summaryOpinion}
              </p>
              <div className="pt-2 border-t border-slate-800 text-[10.5px] text-slate-400 flex flex-wrap gap-2">
                {riskAnalysis.regulatoryNotes.map((note: string, i: number) => (
                  <span key={i} className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                    {note}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
