'use client'

import React, { useEffect } from 'react'
import { UseFormReturn, useFormContext } from 'react-hook-form'
import { PropertyWizardFormValues } from '@/lib/validations/property-wizard'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Landmark,
  LandPlot,
  Tractor,
  Warehouse,
  Beef,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  PieChart,
} from 'lucide-react'

interface Step4FinancialSummaryProps {
  form?: UseFormReturn<any>
}

export function Step4FinancialSummary({ form }: Step4FinancialSummaryProps) {
  const context = useFormContext()
  const activeForm: UseFormReturn<any> = (form || context) as any
  const { control, watch, setValue } = activeForm

  // Observa os ativos dos Steps anteriores
  const totalArea = watch('totalArea') || 0
  const vtnPerHectare = watch('vtnPerHectare') || 0
  const machineries = watch('machineries') || []
  const improvements = watch('improvements') || []
  const livestocks = watch('livestocks') || []

  // Observa os inputs de fluxo financeiro
  const effectiveAgroRevenue = Number(watch('effectiveAgroRevenue')) || 0
  const projectedAgroRevenue = Number(watch('projectedAgroRevenue')) || 0
  const otherRevenues = Number(watch('otherRevenues')) || 0
  const operationalExpenses = Number(watch('operationalExpenses')) || 0
  const existingDebtService = Number(watch('existingDebtService')) || 0
  const familyLivingCosts = Number(watch('familyLivingCosts')) || 0

  // Cálculos Automáticos dos Ativos
  const landValue = Math.round(Number(totalArea) * Number(vtnPerHectare) * 100) / 100

  const machineryValue = machineries.reduce(
    (acc: number, cur: any) => acc + (Number(cur.value) || 0),
    0
  )

  const improvementsValue = improvements.reduce(
    (acc: number, cur: any) => acc + (Number(cur.quantity || 0) * Number(cur.unitValue || 0)),
    0
  )

  const livestockValue = livestocks.reduce(
    (acc: number, cur: any) => acc + (Number(cur.quantity || 0) * Number(cur.unitValue || 0)),
    0
  )

  const totalAssets = landValue + machineryValue + improvementsValue + livestockValue

  // Atualiza campos computados no formulário para persistência
  useEffect(() => {
    setValue('computedLandValue', landValue)
    setValue('computedImprovementsValue', improvementsValue)
    setValue('computedMachineryValue', machineryValue)
    setValue('computedLivestockValue', livestockValue)
    setValue('computedTotalAssets', totalAssets)
  }, [landValue, improvementsValue, machineryValue, livestockValue, totalAssets, setValue])

  // Cálculo da Capacidade de Pagamento / Margem Líquida Anual
  const totalInflows = effectiveAgroRevenue + otherRevenues
  const totalOutflows = operationalExpenses + existingDebtService + familyLivingCosts
  const netMargin = totalInflows - totalOutflows

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="space-y-8">
      {/* 1. CARDS ESTILO DASHBOARD (SOMATÓRIOS AUTOMÁTICOS) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <PieChart className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Composição Patrimonial Avaliada (Somatórios Automáticos)
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
          Valores consolidados em tempo real a partir dos Steps 1, 2 e 3 para a Ficha Cadastral Bancária.
        </p>

        {/* Grid de Cards de Ativos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Card Terra Nua */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
              <LandPlot className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Terra Nua (Step 1)
              </span>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                {formatBRL(landValue)}
              </p>
              <span className="text-[10px] text-slate-600 dark:text-slate-300">
                {totalArea} ha cadastrados
              </span>
            </div>
          </div>

          {/* Card Máquinas */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Máquinas (Step 2)
              </span>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                {formatBRL(machineryValue)}
              </p>
              <span className="text-[10px] text-slate-600 dark:text-slate-300">
                {machineries.length} equipamento(s)
              </span>
            </div>
          </div>

          {/* Card Benfeitorias */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center shrink-0">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Benfeitorias (Step 3)
              </span>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                {formatBRL(improvementsValue)}
              </p>
              <span className="text-[10px] text-slate-600 dark:text-slate-300">
                {improvements.length} instalação(ões)
              </span>
            </div>
          </div>

          {/* Card Rebanho */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center shrink-0">
              <Beef className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Semoventes (Step 3)
              </span>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                {formatBRL(livestockValue)}
              </p>
              <span className="text-[10px] text-slate-600 dark:text-slate-300">
                {livestocks.length} lote(s) de animais
              </span>
            </div>
          </div>
        </div>

        {/* Card Master: Patrimônio Total */}
        <div className="p-5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-700 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Landmark className="w-6 h-6 text-emerald-200" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                Patrimônio Bruto Total Avaliado
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
              {formatBRL(totalAssets)}
            </h2>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              Valor aceito para alavancagem de garantias hipotecárias e pignoratícias.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-lg border border-white/20 text-xs text-right">
            <div className="text-emerald-100">Garantia Imobiliária</div>
            <div className="font-bold text-white text-sm">
              {formatBRL(landValue + improvementsValue)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. ENTRADAS DE FLUXO DE CAIXA E CAPACIDADE DE PAGAMENTO */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Fluxo de Receitas, Despesas e Endividamento Bancário
          </CardTitle>
          <CardDescription className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Informe os dados financeiros anuais do proponente para validação da capacidade de pagamento (MCR - Banco do Brasil / Sicredi).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={control}
              name="effectiveAgroRevenue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    Receita Agropecuária Efetiva (Ano Anterior)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1000"
                      placeholder="R$ 0,00"
                      className="font-mono text-sm"
                      {...field}
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
                    <Input
                      type="number"
                      step="1000"
                      placeholder="R$ 0,00"
                      className="font-mono text-sm"
                      {...field}
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
                    <Input
                      type="number"
                      step="1000"
                      placeholder="R$ 0,00"
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Arrendamentos, salários, dividendos</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="operationalExpenses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 dark:text-slate-300 font-semibold">
                    Despesas Operacionais de Custeio
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1000"
                      placeholder="R$ 0,00"
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Insumos, sementes, folha, diesel, manutenção</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="existingDebtService"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-red-600 dark:text-red-400 font-semibold">
                    Serviço da Dívida Existente (Anual)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1000"
                      placeholder="R$ 0,00"
                      className="font-mono text-sm border-red-200 dark:border-red-900"
                      {...field}
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
                    <Input
                      type="number"
                      step="1000"
                      placeholder="R$ 0,00"
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Manutenção do lar e pró-labore do produtor</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* DIAGNÓSTICO DE CAPACIDADE DE PAGAMENTO */}
          <div
            className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              netMargin >= 0
                ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40'
                : 'bg-red-50/70 border-red-200 dark:bg-red-950/20 dark:border-red-800/40'
            }`}
          >
            <div className="flex items-start gap-3">
              {netMargin >= 0 ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {netMargin >= 0
                    ? 'Capacidade de Pagamento Superavitária (Aprovável)'
                    : 'Atenção: Margem Líquida Negativa'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Receita Total: {formatBRL(totalInflows)} | Saídas Totais:{' '}
                  {formatBRL(totalOutflows)}
                </p>
              </div>
            </div>

            <div className="text-left md:text-right">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Margem Líquida Anual Disponível:
              </span>
              <p
                className={`text-xl font-extrabold ${
                  netMargin >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatBRL(netMargin)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
