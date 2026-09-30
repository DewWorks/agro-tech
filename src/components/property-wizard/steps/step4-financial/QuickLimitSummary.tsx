'use client'

import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormField, FormItem, FormControl } from '@/components/ui/form'
import {
  TrendingUp,
  Receipt,
  Scale,
  CheckCircle2,
  AlertCircle,
  Landmark,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react'
import { PURPOSE_OPTIONS, BANK_OPTIONS } from './options'
import { calculatePaymentCapacity } from '@/lib/financial-engine'

interface QuickLimitSummaryProps {
  activeForm: UseFormReturn<any>
  propertyId?: string
  formatBRL: (val: number) => string
  onSaveAndSimulate?: () => void
}

export function QuickLimitSummary({
  activeForm,
  propertyId,
  formatBRL,
  onSaveAndSimulate,
}: QuickLimitSummaryProps) {
  const { watch, control } = activeForm

  // Obter valores de fluxo de caixa em tempo real
  const effectiveAgro = Number(watch('effectiveAgroRevenue')) || 0
  const projectedAgro = Number(watch('projectedAgroRevenue')) || 0
  const otherRev = Number(watch('otherRevenues')) || 0
  const operationalExp = Number(watch('operationalExpenses')) || 0
  const familyCosts = Number(watch('familyLivingCosts')) || 0
  const existingDebt = Number(watch('existingDebtService')) || 0
  const customAgroRevenues = watch('customAgroRevenues') || []
  const customExpenses = watch('customExpenses') || []

  // Motor unificado da Capacidade de Pagamento (Cláusula 2.2 do Aditivo 003)
  const cpResult = calculatePaymentCapacity({
    effectiveAgroRevenue: effectiveAgro,
    projectedAgroRevenue: projectedAgro,
    operationalExpenses: operationalExp,
    nonAgroRevenues: otherRev,
    familyLivingCosts: familyCosts,
    existingDebtService: existingDebt,
    customAgroRevenues,
    customExpenses,
  })

  // Receita Líquida Operacional (Inflows Líquidos)
  const netOperationalRevenue = cpResult.totalNetInflows

  // Despesas & Encargos Familiares e Passivos Dedutíveis
  const totalExpensesAndCharges = cpResult.totalLivingAndDebtExpenses

  // Capacidade de Pagamento Anual (CP)
  const paymentCapacity = cpResult.paymentCapacity
  const isPositiveCp = cpResult.isPositive

  return (
    <div className="space-y-4">
      {/* 3 CARDS COMPACTOS: RESUMO OPERACIONAL E CAPACIDADE DE PAGAMENTO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Receita Líquida Operacional */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Receita Líquida Operacional
              </span>
              <span className="text-[10px] text-slate-400">Anual</span>
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {formatBRL(netOperationalRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Receitas agropecuárias e externas deduzidas dos custos de produção.
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Despesas & Encargos Totais */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Despesas & Encargos Totais
              </span>
              <span className="text-[10px] text-slate-400">Anual</span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">
              {formatBRL(totalExpensesAndCharges)}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Manutenção familiar e passivos bancários preexistentes.
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Capacidade de Pagamento Anual (CP) */}
        <Card
          className={`border shadow-2xs ${
            isPositiveCp
              ? 'border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/20 dark:border-emerald-800'
              : 'border-rose-200 bg-rose-50/30 dark:bg-rose-950/20 dark:border-rose-800'
          }`}
        >
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Scale className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Capacidade de Pagamento (CP)
              </span>
              {isPositiveCp ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold"
                >
                  <CheckCircle2 className="w-3 h-3 mr-0.5" />
                  Margem Positiva
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] font-bold"
                >
                  <AlertCircle className="w-3 h-3 mr-0.5" />
                  Insuficiente
                </Badge>
              )}
            </div>
            <div
              className={`text-xl font-bold font-mono ${
                isPositiveCp
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {formatBRL(paymentCapacity)}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Disponibilidade líquida anual estimada para suportar o serviço da dívida.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SELETORES RÁPIDOS DE INTENÇÃO DE CRÉDITO */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            Intenção de Financiamento Preferencial
          </Label>
          <span className="text-[11px] text-slate-400">Parâmetros preliminares</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="creditLimitPurpose"
            render={({ field }) => {
              const currentVal = field.value || 'CUSTEIO_AGRICOLA'
              const selectedPurpose = PURPOSE_OPTIONS.find((opt) => opt.value === currentVal) || PURPOSE_OPTIONS[0]
              const SelectedIcon = selectedPurpose.icon

              return (
                <FormItem className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Finalidade do Crédito
                  </Label>
                  <Select value={currentVal} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-xs bg-slate-50/60 dark:bg-slate-800/60">
                        <SelectValue placeholder="Selecione a finalidade">
                          <span className="flex items-center gap-2 truncate">
                            <SelectedIcon className={`w-3.5 h-3.5 shrink-0 ${selectedPurpose.iconColor}`} />
                            <span className="truncate">{selectedPurpose.label}</span>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PURPOSE_OPTIONS.map((opt) => {
                        const Icon = opt.icon
                        return (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            <span className="flex items-center gap-2">
                              <Icon className={`w-3.5 h-3.5 ${opt.iconColor}`} />
                              <span>{opt.label}</span>
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </FormItem>
              )
            }}
          />

          <FormField
            control={control}
            name="creditLimitTargetBank"
            render={({ field }) => {
              const currentVal = field.value || 'BANCO_DO_BRASIL'
              const selectedBank = BANK_OPTIONS.find((opt) => opt.value === currentVal) || BANK_OPTIONS[0]
              const SelectedBankIcon = selectedBank.icon

              return (
                <FormItem className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Instituição Financeira Proponente
                  </Label>
                  <Select value={currentVal} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-xs bg-slate-50/60 dark:bg-slate-800/60">
                        <SelectValue placeholder="Selecione o banco">
                          <span className="flex items-center gap-2 truncate">
                            <SelectedBankIcon className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                            <span className="truncate">{selectedBank.label}</span>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BANK_OPTIONS.map((opt) => {
                        const Icon = opt.icon
                        return (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            <span className="flex items-center gap-2">
                              <Icon className="w-3.5 h-3.5 text-slate-500" />
                              <span>{opt.label}</span>
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </FormItem>
              )
            }}
          />
        </div>
      </div>

      {/* BANNER INFORMATIVO E BOTÃO DE ATALHO PARA O MÓDULO DE LIMITES */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/40 to-slate-50 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 border border-emerald-200 dark:border-emerald-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3 max-w-2xl">
          <div className="w-9 h-9 rounded-lg bg-[#1B4D3E] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Central Autônoma de Limite de Crédito Rural (MCR)
              <Badge variant="outline" className="bg-emerald-100 text-[#1B4D3E] border-emerald-300 text-[9px] font-bold uppercase">
                Aditivo 003
              </Badge>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Os dados patrimoniais e de fluxo de caixa acima alimentam automaticamente o motor de crédito rural. Para simular taxas, amortização (Price/SAC), índice ICSD e emitir o Dossiê Técnico do Banco do Brasil/Sicredi, utilize o Módulo de Limite de Crédito.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={onSaveAndSimulate}
          className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold text-xs h-10 px-4 shrink-0 shadow-sm flex items-center gap-2 self-stretch md:self-auto justify-center"
        >
          <span>Salvar e Abrir Simulação</span>
          <ArrowUpRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
