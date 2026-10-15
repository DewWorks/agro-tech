'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  TrendingUp,
  Receipt,
  Scale,
  Sparkles,
  Edit3,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Table as TableIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/utils/formatters'
import { CurrencyInput } from '@/components/ui/currency-input'

export interface AstecYearData {
  agroRevenue: number
  otherRevenue: number
  totalRevenue: number
  agroExpense: number
  financingExpense: number
  familyExpense: number
  otherExpense: number
  totalExpense: number
  balance: number
}

export interface AstecProjectionPayload {
  isManualOverride: boolean
  years: Record<number, AstecYearData>
}

export interface AstecPlurianualTableProps {
  initialPayload?: Partial<AstecProjectionPayload>
  // Parâmetros de contexto financeiro para cálculo automático
  effectiveAgroRevenue?: number
  projectedAgroRevenue?: number
  nonAgroRevenue?: number
  operationalExpenses?: number
  familyLivingExpenses?: number
  existingDebtService?: number
  financedAmount?: number
  interestRateAnnual?: number
  totalTermMonths?: number
  gracePeriodMonths?: number
  amortizationSystem?: 'PRICE' | 'SAC'
  onChange?: (payload: AstecProjectionPayload) => void
  disabled?: boolean
  className?: string
}

const YEAR_LABELS = [
  'Ano I',
  'Ano II',
  'Ano III',
  'Ano IV',
  'Ano V',
  'Ano VI',
  'Ano VII',
  'Ano VIII',
  'Ano IX',
  'Ano X',
]

/**
 * Gera a projeção automática padrão de 10 anos baseada no modelo oficial ASTEC
 */
export function generateDefaultAstecYears({
  effectiveAgroRevenue = 0,
  projectedAgroRevenue = 0,
  nonAgroRevenue = 0,
  operationalExpenses = 0,
  familyLivingExpenses = 0,
  existingDebtService = 0,
  financedAmount = 0,
  interestRateAnnual = 5.0,
  totalTermMonths = 120,
  gracePeriodMonths = 36,
  amortizationSystem = 'SAC',
}: {
  effectiveAgroRevenue?: number
  projectedAgroRevenue?: number
  nonAgroRevenue?: number
  operationalExpenses?: number
  familyLivingExpenses?: number
  existingDebtService?: number
  financedAmount?: number
  interestRateAnnual?: number
  totalTermMonths?: number
  gracePeriodMonths?: number
  amortizationSystem?: 'PRICE' | 'SAC'
}): Record<number, AstecYearData> {
  const result: Record<number, AstecYearData> = {}

  const rate = (interestRateAnnual || 5.0) / 100
  const graceYears = Math.min(10, Math.floor((gracePeriodMonths || 0) / 12))
  const totalYears = Math.min(10, Math.ceil((totalTermMonths || 120) / 12))
  const amortYears = Math.max(1, totalYears - graceYears)

  // Amortização anual constante para SAC
  const annualPrincipalAmort = financedAmount > 0 && amortYears > 0 ? financedAmount / amortYears : 0

  let remainingPrincipal = financedAmount

  // Receita base: se tiver receita projetada maior que efetiva, faz rampa suave entre Ano I e Ano III
  const baseRevenue = projectedAgroRevenue > 0 ? projectedAgroRevenue : (effectiveAgroRevenue || 0)
  const initialRevenue = effectiveAgroRevenue > 0 ? effectiveAgroRevenue : baseRevenue

  for (let y = 1; y <= 10; y++) {
    // 1. Receitas
    let currentAgroRev = baseRevenue
    if (y === 1) currentAgroRev = initialRevenue
    else if (y === 2 && projectedAgroRevenue > effectiveAgroRevenue) {
      currentAgroRev = initialRevenue + (projectedAgroRevenue - initialRevenue) * 0.5
    }

    const currentOtherRev = nonAgroRevenue || 0
    const totalRev = currentAgroRev + currentOtherRev

    // 2. Despesas
    const currentAgroExp = operationalExpenses || 0
    const currentFamilyExp = familyLivingExpenses || 0
    const currentOtherExp = existingDebtService || 0

    // Cálculo do encargo do financiamento proposto
    let financingExp = 0
    if (financedAmount > 0 && y <= totalYears) {
      if (y <= graceYears) {
        // Durante a carência: apenas juros anuais sobre o saldo devedor
        financingExp = financedAmount * rate
      } else {
        // Após a carência: SAC ou PRICE
        if (amortizationSystem === 'PRICE') {
          // Parcela PRICE anual fixa
          const pmt =
            (financedAmount * (rate * Math.pow(1 + rate, amortYears))) /
            (Math.pow(1 + rate, amortYears) - 1)
          financingExp = pmt
        } else {
          // SAC: amortização constante + juros sobre saldo remanescente
          const interest = remainingPrincipal * rate
          financingExp = annualPrincipalAmort + interest
          remainingPrincipal = Math.max(0, remainingPrincipal - annualPrincipalAmort)
        }
      }
    }

    const totalExp = currentAgroExp + financingExp + currentFamilyExp + currentOtherExp
    const balance = totalRev - totalExp

    result[y] = {
      agroRevenue: Math.round(currentAgroRev),
      otherRevenue: Math.round(currentOtherRev),
      totalRevenue: Math.round(totalRev),
      agroExpense: Math.round(currentAgroExp),
      financingExpense: Math.round(financingExp),
      familyExpense: Math.round(currentFamilyExp),
      otherExpense: Math.round(currentOtherExp),
      totalExpense: Math.round(totalExp),
      balance: Math.round(balance),
    }
  }

  return result
}

export function AstecPlurianualTable({
  initialPayload,
  effectiveAgroRevenue = 0,
  projectedAgroRevenue = 0,
  nonAgroRevenue = 0,
  operationalExpenses = 0,
  familyLivingExpenses = 0,
  existingDebtService = 0,
  financedAmount = 0,
  interestRateAnnual = 5.0,
  totalTermMonths = 120,
  gracePeriodMonths = 36,
  amortizationSystem = 'SAC',
  onChange,
  disabled = false,
  className,
}: AstecPlurianualTableProps) {
  const [isManualOverride, setIsManualOverride] = useState<boolean>(
    initialPayload?.isManualOverride ?? false
  )

  // Gerar estado padrão inicial
  const defaultYears = useMemo(() => {
    return generateDefaultAstecYears({
      effectiveAgroRevenue,
      projectedAgroRevenue,
      nonAgroRevenue,
      operationalExpenses,
      familyLivingExpenses,
      existingDebtService,
      financedAmount,
      interestRateAnnual,
      totalTermMonths,
      gracePeriodMonths,
      amortizationSystem,
    })
  }, [
    effectiveAgroRevenue,
    projectedAgroRevenue,
    nonAgroRevenue,
    operationalExpenses,
    familyLivingExpenses,
    existingDebtService,
    financedAmount,
    interestRateAnnual,
    totalTermMonths,
    gracePeriodMonths,
    amortizationSystem,
  ])

  const [yearsData, setYearsData] = useState<Record<number, AstecYearData>>(
    initialPayload?.years || defaultYears
  )

  // Sincronizar se estiver no modo automático quando parâmetros externos mudarem
  useEffect(() => {
    if (!isManualOverride) {
      setYearsData(defaultYears)
      onChange?.({
        isManualOverride: false,
        years: defaultYears,
      })
    }
  }, [defaultYears, isManualOverride])

  // Notificar pai quando alterar dados
  const emitUpdate = (newOverride: boolean, newYears: Record<number, AstecYearData>) => {
    onChange?.({
      isManualOverride: newOverride,
      years: newYears,
    })
  }

  // Atualizar campo em modo manual
  const handleCellChange = (
    year: number,
    field: 'agroRevenue' | 'otherRevenue' | 'agroExpense' | 'financingExpense' | 'familyExpense' | 'otherExpense',
    value: number
  ) => {
    if (disabled || !isManualOverride) return

    setYearsData((prev) => {
      const currentYear = prev[year] || { ...defaultYears[year] }
      const updatedYear: AstecYearData = {
        ...currentYear,
        [field]: value,
      }

      // Recalcular totais do ano
      updatedYear.totalRevenue = updatedYear.agroRevenue + updatedYear.otherRevenue
      updatedYear.totalExpense =
        updatedYear.agroExpense +
        updatedYear.financingExpense +
        updatedYear.familyExpense +
        updatedYear.otherExpense
      updatedYear.balance = updatedYear.totalRevenue - updatedYear.totalExpense

      const nextYears = {
        ...prev,
        [year]: updatedYear,
      }
      emitUpdate(isManualOverride, nextYears)
      return nextYears
    })
  }

  const handleResetToAuto = () => {
    if (disabled) return
    setIsManualOverride(false)
    setYearsData(defaultYears)
    emitUpdate(false, defaultYears)
  }

  const handleToggleManual = (checked: boolean) => {
    if (disabled) return
    setIsManualOverride(checked)
    emitUpdate(checked, yearsData)
  }

  // Verifica se todos os anos estão com saldo positivo
  const allYearsPositive = Object.values(yearsData).every((y) => y.balance >= 0)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Cabeçalho de Controle e Conformidade ASTEC */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-[#1B4D3E]" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              05. Capacidade de Pagamento Plurianual (Quadro de 10 Anos - Modelo ASTEC / Sicor)
            </h4>
            {allYearsPositive ? (
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300 font-bold gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Superavitária
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300 font-bold gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600" /> Déficit em Período
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Demonstrativo de fluxos de caixa e capacidade de pagamento para financiamentos de investimento com prazo de até 10 anos.
          </p>
        </div>

        {/* Switch de Edição Manual */}
        <div className="flex items-center gap-3 shrink-0 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Switch
              id="astec-manual-toggle"
              checked={isManualOverride}
              onCheckedChange={handleToggleManual}
              disabled={disabled}
            />
            <Label htmlFor="astec-manual-toggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              {isManualOverride ? 'Edição Manual Ativa' : 'Cálculo Automático ASTEC'}
            </Label>
          </div>

          {isManualOverride && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetToAuto}
              disabled={disabled}
              className="h-7 text-[11px] text-slate-600 hover:text-slate-900 gap-1 px-2 cursor-pointer"
              title="Restaurar valores calculados pelo motor de limite"
            >
              <RotateCcw className="w-3 h-3" />
              Restaurar
            </Button>
          )}
        </div>
      </div>

      {/* Tabela de 10 Anos */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
        <div className="overflow-x-auto">
          <Table className="text-xs w-full">
            <TableHeader className="bg-slate-100/80 dark:bg-slate-800/80">
              <TableRow className="border-b border-slate-200 dark:border-slate-700">
                <TableHead className="min-w-[220px] font-bold text-slate-900 dark:text-slate-100 sticky left-0 bg-slate-100/90 dark:bg-slate-800/90 z-10">
                  Descrição dos Fluxos (R$)
                </TableHead>
                {YEAR_LABELS.map((label, idx) => (
                  <TableHead key={idx} className="min-w-[120px] text-center font-bold text-slate-800 dark:text-slate-200">
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* 1. SEÇÃO DE RECEITAS */}
              <TableRow className="bg-[#1B4D3E]/5 dark:bg-[#1B4D3E]/10 font-bold border-b border-slate-200">
                <TableCell colSpan={11} className="py-2 text-xs font-black text-[#1B4D3E] dark:text-emerald-400">
                  1. RECEITAS
                </TableCell>
              </TableRow>

              {/* 1.1 Atividades Agropecuárias */}
              <TableRow className="hover:bg-slate-50/50">
                <TableCell className="font-medium text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-900 z-10 pl-6">
                  1.1 Atividades agropecuárias
                </TableCell>
                {YEAR_LABELS.map((_, idx) => {
                  const y = idx + 1
                  const val = yearsData[y]?.agroRevenue ?? 0
                  return (
                    <TableCell key={y} className="text-right p-1.5">
                      {isManualOverride ? (
                        <CurrencyInput
                          disabled={disabled}
                          value={val}
                          onChangeValue={(v: number) => handleCellChange(y, 'agroRevenue', v)}
                          className="h-7 text-xs text-right bg-white"
                        />
                      ) : (
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{formatBRL(val)}</span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>

              {/* 1.2 Outras Receitas */}
              <TableRow className="hover:bg-slate-50/50">
                <TableCell className="font-medium text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-900 z-10 pl-6">
                  1.2 Outras receitas
                </TableCell>
                {YEAR_LABELS.map((_, idx) => {
                  const y = idx + 1
                  const val = yearsData[y]?.otherRevenue ?? 0
                  return (
                    <TableCell key={y} className="text-right p-1.5">
                      {isManualOverride ? (
                        <CurrencyInput
                          disabled={disabled}
                          value={val}
                          onChangeValue={(v: number) => handleCellChange(y, 'otherRevenue', v)}
                          className="h-7 text-xs text-right bg-white"
                        />
                      ) : (
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{formatBRL(val)}</span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>

              {/* 1.3 Receita Total */}
              <TableRow className="bg-emerald-50/60 dark:bg-emerald-950/20 font-bold border-b border-slate-200">
                <TableCell className="text-emerald-950 dark:text-emerald-300 sticky left-0 bg-emerald-50/90 dark:bg-emerald-950/90 z-10 font-bold">
                  1.3 Receita Total
                </TableCell>
                {YEAR_LABELS.map((_, idx) => {
                  const y = idx + 1
                  const val = yearsData[y]?.totalRevenue ?? 0
                  return (
                    <TableCell key={y} className="text-right font-black text-emerald-900 dark:text-emerald-300">
                      {formatBRL(val)}
                    </TableCell>
                  )
                })}
              </TableRow>

              {/* 2. SEÇÃO DE DESPESAS */}
              <TableRow className="bg-amber-500/5 dark:bg-amber-500/10 font-bold border-b border-slate-200">
                <TableCell colSpan={11} className="py-2 text-xs font-black text-amber-800 dark:text-amber-400">
                  2. DESPESAS
                </TableCell>
              </TableRow>

              {/* 2.1 Atividades Agropecuárias */}
              <TableRow className="hover:bg-slate-50/50">
                <TableCell className="font-medium text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-900 z-10 pl-6">
                  2.1 Atividades agropecuárias
                </TableCell>
                {YEAR_LABELS.map((_, idx) => {
                  const y = idx + 1
                  const val = yearsData[y]?.agroExpense ?? 0
                  return (
                    <TableCell key={y} className="text-right p-1.5">
                      {isManualOverride ? (
                        <CurrencyInput
                          disabled={disabled}
                          value={val}
                          onChangeValue={(v: number) => handleCellChange(y, 'agroExpense', v)}
                          className="h-7 text-xs text-right bg-white"
                        />
                      ) : (
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{formatBRL(val)}</span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>

              {/* 2.2 Investimento Proposto */}
              <TableRow className="hover:bg-slate-50/50">
                <TableCell className="font-medium text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-900 z-10 pl-6">
                  2.2 Investimento proposto (Financiamento)
                </TableCell>
                {YEAR_LABELS.map((_, idx) => {
                  const y = idx + 1
                  const val = yearsData[y]?.financingExpense ?? 0
                  return (
                    <TableCell key={y} className="text-right p-1.5">
                      {isManualOverride ? (
                        <CurrencyInput
                          disabled={disabled}
                          value={val}
                          onChangeValue={(v: number) => handleCellChange(y, 'financingExpense', v)}
                          className="h-7 text-xs text-right bg-white"
                        />
                      ) : (
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{formatBRL(val)}</span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>

              {/* 2.3 Manutenção Familiar */}
              <TableRow className="hover:bg-slate-50/50">
                <TableCell className="font-medium text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-900 z-10 pl-6">
                  2.3 Manutenção familiar do proponente
                </TableCell>
                {YEAR_LABELS.map((_, idx) => {
                  const y = idx + 1
                  const val = yearsData[y]?.familyExpense ?? 0
                  return (
                    <TableCell key={y} className="text-right p-1.5">
                      {isManualOverride ? (
                        <CurrencyInput
                          disabled={disabled}
                          value={val}
                          onChangeValue={(v: number) => handleCellChange(y, 'familyExpense', v)}
                          className="h-7 text-xs text-right bg-white"
                        />
                      ) : (
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{formatBRL(val)}</span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>

              {/* 2.4 Outras Despesas / Responsabilidades */}
              <TableRow className="hover:bg-slate-50/50">
                <TableCell className="font-medium text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-900 z-10 pl-6">
                  2.4 Outras despesas / passivos (ASTEC, dívidas)
                </TableCell>
                {YEAR_LABELS.map((_, idx) => {
                  const y = idx + 1
                  const val = yearsData[y]?.otherExpense ?? 0
                  return (
                    <TableCell key={y} className="text-right p-1.5">
                      {isManualOverride ? (
                        <CurrencyInput
                          disabled={disabled}
                          value={val}
                          onChangeValue={(v: number) => handleCellChange(y, 'otherExpense', v)}
                          className="h-7 text-xs text-right bg-white"
                        />
                      ) : (
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{formatBRL(val)}</span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>

              {/* 2.5 Despesa Total */}
              <TableRow className="bg-amber-50/60 dark:bg-amber-950/20 font-bold border-b border-slate-200">
                <TableCell className="text-amber-950 dark:text-amber-300 sticky left-0 bg-amber-50/90 dark:bg-amber-950/90 z-10 font-bold">
                  2.5 Despesa Total
                </TableCell>
                {YEAR_LABELS.map((_, idx) => {
                  const y = idx + 1
                  const val = yearsData[y]?.totalExpense ?? 0
                  return (
                    <TableCell key={y} className="text-right font-black text-amber-900 dark:text-amber-300">
                      {formatBRL(val)}
                    </TableCell>
                  )
                })}
              </TableRow>

              {/* 3. SEÇÃO DE SUPERÁVIT / DÉFICIT */}
              <TableRow className="bg-slate-100/90 dark:bg-slate-800/90 font-black">
                <TableCell className="text-slate-900 dark:text-slate-100 sticky left-0 bg-slate-100/95 dark:bg-slate-800/95 z-10 font-black text-xs">
                  3. SUPERÁVIT / DÉFICIT
                </TableCell>
                {YEAR_LABELS.map((_, idx) => {
                  const y = idx + 1
                  const val = yearsData[y]?.balance ?? 0
                  const isPositive = val >= 0
                  return (
                    <TableCell
                      key={y}
                      className={cn(
                        'text-right font-black',
                        isPositive
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-700 dark:text-rose-400'
                      )}
                    >
                      {formatBRL(val)}
                    </TableCell>
                  )
                })}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Nota de rodapé explicativa das instruções ASTEC */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 leading-relaxed space-y-1">
        <p>
          <strong>Instruções Oficiais de Enquadramento ASTEC / Banco do Brasil:</strong>
        </p>
        <ul className="list-disc list-inside space-y-0.5 pl-1">
          <li><strong>Campo 1.1:</strong> Receitas de todas as atividades agrícolas e/ou pecuárias exploradas (com ou sem financiamento).</li>
          <li><strong>Campo 1.2:</strong> Outras fontes de receita do proponente (salários, rendimentos externos, poupança).</li>
          <li><strong>Campo 2.2:</strong> Parcela do financiamento proposto (amortização e juros incidentes). Durante a carência incidem apenas os juros contratuais.</li>
          <li><strong>Campo 2.4:</strong> Outras fontes de financiamento vigentes, impostos, arrendamentos, honorários da assistência técnica (ASTEC) e contador.</li>
        </ul>
      </div>
    </div>
  )
}
