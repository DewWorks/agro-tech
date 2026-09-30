'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileCheck } from 'lucide-react'
import { CREDIT_LINES_CATALOG } from '@/constants/credit-lines'
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
  return (
    <div className="space-y-6">
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
            if (code) onSelectCreditLine(code)
          }}
        >
          <SelectTrigger className="h-10 text-xs bg-slate-50/60 dark:bg-slate-800/60 font-semibold border-slate-300">
            <SelectValue placeholder="Selecione o programa de crédito..." />
          </SelectTrigger>
          <SelectContent className="max-h-[320px]">
            <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
              Eixo de Custeio Agropecuário
            </div>
            {CREDIT_LINES_CATALOG.filter((l) => l.axis === CreditLineAxis.CUSTEIO).map(
              (line) => (
                <SelectItem key={line.code} value={line.code} className="text-xs py-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {line.name}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Taxa: {line.defaultInterestRate}% a.a. • Prazo: {line.defaultTermMonths}m •{' '}
                    {line.mcrRef}
                  </span>
                </SelectItem>
              )
            )}
            <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400 mt-2">
              Eixo de Investimento & Modernização
            </div>
            {CREDIT_LINES_CATALOG.filter(
              (l) => l.axis === CreditLineAxis.INVESTIMENTO
            ).map((line) => (
              <SelectItem key={line.code} value={line.code} className="text-xs py-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {line.name}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Taxa: {line.defaultInterestRate}% a.a. • Prazo: {line.defaultTermMonths}m •{' '}
                  {line.mcrRef}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          <Input
            type="number"
            min={0}
            step={1000}
            value={requestedAmount || ''}
            onChange={(e) => onChangeRequestedAmount(Number(e.target.value) || 0)}
            className="text-xs h-9 font-mono font-bold bg-white dark:bg-slate-900"
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
            className="text-xs h-9 font-mono bg-white dark:bg-slate-900"
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
            className="text-xs h-9 font-mono bg-white dark:bg-slate-900"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Taxa de Juros (% a.a.)
          </Label>
          <Input
            type="number"
            min={0}
            max={30}
            step={0.25}
            value={interestRate}
            onChange={(e) => onChangeInterestRate(Number(e.target.value) || 8.0)}
            className="text-xs h-9 font-mono bg-white dark:bg-slate-900"
          />
        </div>
      </div>
    </div>
  )
}
