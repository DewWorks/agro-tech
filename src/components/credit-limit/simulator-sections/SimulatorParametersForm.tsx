'use client'

import React, { useState } from 'react'
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
import { FileCheck, Sparkles, Sprout, Tractor } from 'lucide-react'
import { CREDIT_LINES_CATALOG, CREDIT_PREFERENCE_OPTIONS } from '@/constants/credit-lines'
import { CreditLineAxis } from '@/lib/financial-engine'
import { SimulatorParametersFormProps } from '@/types/credit-limit.types'

const PURPOSE_OPTIONS = [
  { value: 'CUSTEIO_AGRICOLA', label: 'Custeio Agrícola (Safra)', color: 'text-amber-600' },
  { value: 'CUSTEIO_PECUARIO', label: 'Custeio Pecuário', color: 'text-emerald-600' },
  { value: 'INVESTIMENTO_FIXO', label: 'Investimento em Benfeitorias/Instalações', color: 'text-blue-600' },
  { value: 'INVESTIMENTO_SEMI_FIXO', label: 'Investimento em Máquinas e Frotas', color: 'text-purple-600' },
  { value: 'COMERCIALIZACAO', label: 'Comercialização / FGPP', color: 'text-teal-600' },
]

const BANK_OPTIONS = [
  { value: 'BANCO_DO_BRASIL', label: 'Banco do Brasil (Líder Agro)' },
  { value: 'SICREDI', label: 'Sicredi (Cooperativa)' },
  { value: 'SICOOB', label: 'Sicoob (Cooperativa)' },
  { value: 'BRADESCO', label: 'Bradesco Agro' },
  { value: 'ITAU', label: 'Itaú BBA' },
  { value: 'SANTANDER', label: 'Santander Agro' },
  { value: 'CAIXA', label: 'Caixa Econômica Federal' },
  { value: 'OUTROS', label: 'Outro Agente Financeiro MCR' },
]

export function SimulatorParametersForm({
  creditLineCode,
  onSelectCreditLine,
  purpose,
  onChangePurpose,
  targetBank,
  onChangeTargetBank,
  requestedAmount,
  onChangeRequestedAmount,
  amortizationSystem,
  onChangeAmortizationSystem,
  termMonths,
  onChangeTermMonths,
  graceMonths,
  onChangeGraceMonths,
  interestRate,
  onChangeInterestRate,
}: SimulatorParametersFormProps) {
  const [axisFilter, setAxisFilter] = useState<'ALL' | 'CUSTEIO' | 'INVESTIMENTO'>('ALL')

  const filteredLines = CREDIT_LINES_CATALOG.filter((line) => {
    if (axisFilter === 'ALL') return true
    return line.axis === axisFilter
  })

  return (
    <div className="space-y-6">
      {/* Seletor do Catálogo Oficial das 15 Linhas com Tabs de Segregação Custeio vs Investimento */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <Label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            Linha de Financiamento Oficial (MCR / BACEN)
          </Label>
          <span className="text-[10px] text-slate-500 font-medium">Catálogo Oficial das Linhas</span>
        </div>

        {/* Tabs de Filtro Custeio vs Investimento */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setAxisFilter('ALL')}
            className={`flex-1 py-1 px-2.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              axisFilter === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Todas as Linhas
          </button>
          <button
            type="button"
            onClick={() => setAxisFilter('CUSTEIO')}
            className={`flex-1 py-1 px-2.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              axisFilter === 'CUSTEIO'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sprout className="w-3 h-3" />
            Eixo Custeio
          </button>
          <button
            type="button"
            onClick={() => setAxisFilter('INVESTIMENTO')}
            className={`flex-1 py-1 px-2.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              axisFilter === 'INVESTIMENTO'
                ? 'bg-[#1B4D3E] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Tractor className="w-3 h-3" />
            Eixo Investimento
          </button>
        </div>

        <Select
          value={creditLineCode}
          onValueChange={(code) => {
            if (code) onSelectCreditLine(code)
          }}
        >
          <SelectTrigger className="h-10 text-xs bg-slate-50/60 dark:bg-slate-800/60 font-semibold border-slate-300">
            <SelectValue placeholder="Selecione o programa de crédito..." />
          </SelectTrigger>
          <SelectContent className="max-h-[320px]">
            {filteredLines.map((line) => (
              <SelectItem key={line.code} value={line.code} className="text-xs py-2">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${line.axis === 'CUSTEIO' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {line.name}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block pl-3.5">
                  Taxa: {line.defaultInterestRate}% a.a. • Prazo: {line.defaultTermMonths}m • {line.mcrRef}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tags de Financiamento Preferencial (ASTEC/Sicor) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Financiamentos Preferenciais ASTEC/Sicor:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {CREDIT_PREFERENCE_OPTIONS.filter((p) => p.value !== 'OUTRA').map((pref) => (
              <button
                key={pref.value}
                type="button"
                onClick={() => {
                  if (pref.value === 'AQUISICAO_MATRIZES_REPRODUTORES') {
                    onSelectCreditLine('PRONAF_MAIS_ALIMENTOS_SEMIFIXO')
                    onChangePurpose('INVESTIMENTO_SEMI_FIXO')
                  } else if (pref.value === 'CONSTRUCAO_OBRAS_RURAIS') {
                    onSelectCreditLine('PRONAF_MAIS_ALIMENTOS_FIXO')
                    onChangePurpose('INVESTIMENTO_FIXO')
                  } else if (pref.value === 'CUSTEIO_PECUARIO_RECRIA_ENGORDA') {
                    onSelectCreditLine('CUSTEIO_PECUARIO')
                    onChangePurpose('CUSTEIO_PECUARIO')
                  }
                }}
                className="text-left p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 transition-all text-xs cursor-pointer group"
              >
                <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 text-[11px] leading-tight">
                  {pref.label}
                </div>
                <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  {pref.category}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dados da Proposta: Finalidade & Banco Alvo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Finalidade do Crédito
          </Label>
          <Select
            value={purpose}
            onValueChange={(val) => {
              if (val) onChangePurpose(val)
            }}
          >
            <SelectTrigger className="text-xs h-9 bg-white dark:bg-slate-900">
              <SelectValue placeholder="Selecione a finalidade" />
            </SelectTrigger>
            <SelectContent>
              {PURPOSE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Instituição Financeira Proponente
          </Label>
          <Select
            value={targetBank}
            onValueChange={(val) => {
              if (val) onChangeTargetBank(val)
            }}
          >
            <SelectTrigger className="text-xs h-9 bg-white dark:bg-slate-900">
              <SelectValue placeholder="Selecione o banco" />
            </SelectTrigger>
            <SelectContent>
              {BANK_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Inputs de Simulação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Valor Pretendido (R$) *
          </Label>
          <CurrencyInput
            value={requestedAmount}
            onChangeValue={onChangeRequestedAmount}
            placeholder="0,00"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Sistema de Amortização
          </Label>
          <Select
            value={amortizationSystem}
            onValueChange={(val: any) => {
              if (val) onChangeAmortizationSystem(val)
            }}
          >
            <SelectTrigger className="text-xs h-9 bg-white dark:bg-slate-900 font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRICE" className="text-xs">
                PRICE (Prestação Fixa)
              </SelectItem>
              <SelectItem value="SAC" className="text-xs">
                SAC (Amortização Constante)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Prazo Total (Meses)
          </Label>
          <Input
            type="number"
            min={1}
            max={240}
            value={termMonths || ''}
            onChange={(e) => onChangeTermMonths(Number(e.target.value) || 12)}
            className="text-xs h-9 font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Carência (Meses)
          </Label>
          <Input
            type="number"
            min={0}
            max={60}
            value={graceMonths}
            onChange={(e) => onChangeGraceMonths(Number(e.target.value) || 0)}
            className="text-xs h-9 font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Taxa de Juros (% a.a.)
          </Label>
          <div className="relative flex items-center">
            <Input
              type="number"
              min={0}
              max={30}
              step={0.25}
              value={interestRate}
              onChange={(e) => onChangeInterestRate(Number(e.target.value) || 8.0)}
              className="text-xs h-9 pr-7 font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900"
            />
            <span className="absolute right-2.5 text-slate-400 dark:text-slate-500 font-semibold text-xs select-none pointer-events-none">
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
