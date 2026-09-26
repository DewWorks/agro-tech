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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
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
  ShieldCheck,
  Scale,
  Coins,
  Building2,
  Calendar,
  FileCheck,
  Wheat,
  Sprout,
  CreditCard,
} from 'lucide-react'

export interface PurposeOption {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
}

export const PURPOSE_OPTIONS: PurposeOption[] = [
  {
    value: 'CUSTEIO_AGRICOLA',
    label: 'Custeio Agrícola (Safra)',
    icon: Wheat,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    value: 'CUSTEIO_PECUARIO',
    label: 'Custeio Pecuário / Nutrição',
    icon: Beef,
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    value: 'INVESTIMENTO_MAQUINAS',
    label: 'Investimento (Tratores & Máquinas)',
    icon: Tractor,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    value: 'INVESTIMENTO_SOLO_PASTAGEM',
    label: 'Reforma de Pastagens & Calagem',
    icon: Sprout,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    value: 'RETENCAO_MATRIZES',
    label: 'Retenção de Matrizes & Bezerros',
    icon: Scale,
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    value: 'MISTO',
    label: 'Limite Misto / Rotativo de Crédito',
    icon: CreditCard,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
]

const PURPOSE_LABELS: Record<string, string> = PURPOSE_OPTIONS.reduce(
  (acc, cur) => ({ ...acc, [cur.value]: cur.label }),
  {}
)

export interface BankOption {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
}

export const BANK_OPTIONS: BankOption[] = [
  {
    value: 'BANCO_DO_BRASIL',
    label: 'Banco do Brasil',
    icon: Landmark,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    value: 'SICREDI',
    label: 'Sicredi',
    icon: Building2,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    value: 'SICOOB',
    label: 'Sicoob',
    icon: Building2,
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  {
    value: 'BRADESCO_AGRO',
    label: 'Bradesco Agro',
    icon: Landmark,
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    value: 'CAIXA_ECONOMICA',
    label: 'Caixa Econômica Federal',
    icon: Landmark,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    value: 'OUTRO',
    label: 'Outra Instituição',
    icon: Building2,
    iconColor: 'text-slate-500 dark:text-slate-400',
  },
]

const BANK_LABELS: Record<string, string> = BANK_OPTIONS.reduce(
  (acc, cur) => ({ ...acc, [cur.value]: cur.label }),
  {}
)

interface Step4FinancialSummaryProps {
  form?: UseFormReturn<any>
  isFinancialModuleDisabledForOrg?: boolean
}

export function Step4FinancialSummary({ 
  form,
  isFinancialModuleDisabledForOrg = false,
}: Step4FinancialSummaryProps) {
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

  // Observa os inputs de Limite de Crédito
  const creditLimitRequested = Number(watch('creditLimitRequested')) || 0
  const creditLimitPurpose = watch('creditLimitPurpose') || 'CUSTEIO_AGRICOLA'
  const creditLimitTargetBank = watch('creditLimitTargetBank') || 'BANCO_DO_BRASIL'
  const creditLimitTermMonths = Number(watch('creditLimitTermMonths')) || 12

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

  // ==========================================================================
  // CÁLCULOS DA BASE DE LIMITE DE CRÉDITO RURAL (MCR / BANCOS AGRO)
  // ==========================================================================
  const baseRevenue = projectedAgroRevenue > 0 ? projectedAgroRevenue : effectiveAgroRevenue

  // 1. Limite Sugerido para Custeio Safra / Pecuário (MCR: até 100% dos custos comprovados, teto 50% da receita)
  const suggestedCusteioLimit = operationalExpenses > 0
    ? (baseRevenue > 0 ? Math.min(operationalExpenses, baseRevenue * 0.5) : operationalExpenses)
    : (baseRevenue > 0 ? baseRevenue * 0.4 : 0)

  // 2. Garantias Reais & Margens de Alavancagem Aceitas pelo Sistema Financeiro
  // Imobiliária (Hipoteca / Alienação Fiduciária): até 65% da avaliação de terras e benfeitorias
  const realEstateCollateral = (landValue + improvementsValue) * 0.65
  // Pignoratícia (Penhor de Máquinas e Semoventes): até 50% da avaliação
  const pledgeCollateral = (machineryValue + livestockValue) * 0.50
  // Total de Crédito Suportado por Garantias Reais
  const totalCollateralCreditLimit = realEstateCollateral + pledgeCollateral

  // 3. Estimativa de Parcela Anual da Proposta Solicitada
  const termYears = Math.max(1, creditLimitTermMonths / 12)
  const estimatedAnnualInstallment = creditLimitTermMonths <= 12
    ? creditLimitRequested * 1.095 // 9.5% a.a. juros de custeio padrão
    : (creditLimitRequested / termYears) + (creditLimitRequested * 0.105 * 0.55) // Investimento amortizado

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="space-y-8">
      {/* ALERTA INFORMATIVO SUPER ADMIN (SE MÓDULO ESTIVER DESLIGADO NO CLIENTE) */}
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
              Esta etapa e o dimensionamento de limites estão <strong>desativados na organização deste cliente</strong> e ficam <strong>totalmente ocultos para produtores, operadores e administradores comuns</strong>. O formulário está acessível para você apenas devido ao seu privilégio de <strong>Super Admin</strong>.
            </p>
          </div>
        </div>
      )}

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

      {/* 3. BASE DE CÁLCULO & DIMENSIONAMENTO DO LIMITE DE CRÉDITO RURAL */}
      <Card className="border-emerald-200 dark:border-emerald-800/60 shadow-sm bg-gradient-to-b from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/10">
        <CardHeader className="pb-3 border-b border-emerald-100 dark:border-emerald-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-[#1B4D3E] dark:text-emerald-400">
                <Coins className="w-5 h-5 text-emerald-600" />
                Base de Cálculo & Dimensionamento do Limite de Crédito Rural
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Estimativa técnica dos limites operacionais de custeio e investimento suportados por garantias reais (MCR • Banco do Brasil / Sicredi).
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-emerald-100/80 text-[#1B4D3E] border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 self-start sm:self-auto text-[11px] font-semibold px-2.5 py-0.5">
              Módulo Financeiro & Limites
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-6">
          {/* Grid de Métricas de Limite */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Limite Custeio */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800/50 shadow-2xs">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-1">
                <Scale className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Limite Sugerido para Custeio
                </span>
              </div>
              <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {formatBRL(suggestedCusteioLimit)}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Base MCR: até 100% dos custos operacionais ou até 50% da receita anual esperada.
              </p>
            </div>

            {/* Card 2: Garantia Imobiliária */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-1">
                <Building2 className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Suporte Imobiliário (65%)
                </span>
              </div>
              <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {formatBRL(realEstateCollateral)}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Terra Nua + Benfeitorias com margem de segurança de 150% exigida pelos bancos.
              </p>
            </div>

            {/* Card 3: Garantias Totais Disponíveis */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Garantias Reais Ofertáveis
                </span>
              </div>
              <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {formatBRL(totalCollateralCreditLimit)}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Hipoteca (65%) + Penhor de máquinas e rebanho avaliado (50%).
              </p>
            </div>
          </div>

          {/* Formulário de Proposta / Simulação de Limite */}
          <div className="p-5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              Parâmetros da Proposta de Limite de Crédito
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField
                control={control}
                name="creditLimitRequested"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-[#1B4D3E] dark:text-emerald-400">
                      Limite Pretendido / Solicitado (R$) *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="5000"
                        placeholder="R$ 0,00"
                        className="font-mono text-sm bg-white dark:bg-slate-900"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">Valor da proposta cadastral</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="creditLimitPurpose"
                render={({ field }) => {
                  const currentValue = field.value || 'CUSTEIO_AGRICOLA'
                  const selectedPurpose = PURPOSE_OPTIONS.find(opt => opt.value === currentValue) || PURPOSE_OPTIONS[0]
                  const SelectedIcon = selectedPurpose.icon

                  return (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Finalidade Principal</FormLabel>
                      <Select 
                        value={currentValue} 
                        onValueChange={field.onChange}
                      >
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
                      <FormDescription className="text-[10px]">Linha de financiamento</FormDescription>
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
                  const selectedBank = BANK_OPTIONS.find(opt => opt.value === currentValue) || BANK_OPTIONS[0]
                  const SelectedIcon = selectedBank.icon

                  return (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Instituição Financeira</FormLabel>
                      <Select 
                        value={currentValue} 
                        onValueChange={field.onChange}
                      >
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
                      <FormDescription className="text-[10px]">Canal de crédito</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              <FormField
                control={control}
                name="creditLimitTermMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Prazo Pretendido (Meses)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="12"
                        className="font-mono text-sm bg-white dark:bg-slate-900"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">Custeio: 12m | Investimento: 60-120m</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* PARECER TÉCNICO E ENQUADRAMENTO DA PROPOSTA */}
            {creditLimitRequested > 0 && (
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  netMargin >= estimatedAnnualInstallment
                    ? 'bg-emerald-50/90 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800'
                    : netMargin > 0
                    ? 'bg-amber-50/90 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800'
                    : 'bg-red-50/90 border-red-300 dark:bg-red-950/30 dark:border-red-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {netMargin >= estimatedAnnualInstallment ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {netMargin >= estimatedAnnualInstallment
                        ? 'Proposta Pré-Qualificada: Margem Líquida Confortável'
                        : netMargin > 0
                        ? 'Alerta de Endividamento: Parcela Próxima ou Superior à Margem'
                        : 'Incompatibilidade Preliminar: Margem Líquida Negativa'}
                    </h5>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">
                      Parcela Anual Estimada:{' '}
                      <strong className="font-mono">{formatBRL(estimatedAnnualInstallment)}</strong> | Margem
                      Líquida Disponível:{' '}
                      <strong className="font-mono">{formatBRL(netMargin)}</strong> | Cobertura de
                      Garantias: <strong className="font-mono">{formatBRL(totalCollateralCreditLimit)}</strong>
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      netMargin >= estimatedAnnualInstallment
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : netMargin > 0
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-red-100 text-red-800 border-red-300'
                    }`}
                  >
                    {netMargin >= estimatedAnnualInstallment
                      ? 'Compatível'
                      : netMargin > 0
                      ? 'Revisar Prazo'
                      : 'Não Recomendado'}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
