'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Plus, Trash2, Landmark, AlertCircle, FileText } from 'lucide-react'
import { formatBRL } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

export interface ControlledCreditItem {
  id?: string
  institution: string
  creditLine: string
  contractDate: string
  purpose: string
  cropYear: string
  amount: number
}

export interface ControlledCreditsInDebtSectionProps {
  isBeneficiary: boolean
  onToggleBeneficiary: (isBeneficiary: boolean) => void
  credits: ControlledCreditItem[]
  onChangeCredits: (credits: ControlledCreditItem[]) => void
  disabled?: boolean
  className?: string
}

export function ControlledCreditsInDebtSection({
  isBeneficiary,
  onToggleBeneficiary,
  credits,
  onChangeCredits,
  disabled = false,
  className,
}: ControlledCreditsInDebtSectionProps) {
  const totalInDebt = credits.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  const handleAddCredit = () => {
    if (disabled) return
    const newItem: ControlledCreditItem = {
      institution: 'Banco do Brasil',
      creditLine: 'PRONAF Investimento',
      contractDate: new Date().toISOString().split('T')[0],
      purpose: 'Aquisição de Semoventes / Máquinas',
      cropYear: '2024/2025',
      amount: 0,
    }
    onChangeCredits([...credits, newItem])
  }

  const handleRemoveCredit = (index: number) => {
    if (disabled) return
    onChangeCredits(credits.filter((_, i) => i !== index))
  }

  const handleUpdateCredit = (index: number, field: keyof ControlledCreditItem, value: any) => {
    if (disabled) return
    const updated = [...credits]
    updated[index] = { ...updated[index], [field]: value }
    onChangeCredits(updated)
  }

  return (
    <div className={cn('p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-2xs', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <Label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-[#1B4D3E]" />
            Declaração de Créditos Controlados em Ser (Item 06 - Proposta Sicor)
          </Label>
          <p className="text-[11px] text-slate-500">
            Declaração obrigatória sobre contratos vigentes de investimento agropecuário com recursos controlados no SNCR.
          </p>
        </div>
        {isBeneficiary && (
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block">Total em Ser Declarado</span>
            <span className="text-sm font-black text-amber-700 dark:text-amber-400">
              {formatBRL(totalInDebt)}
            </span>
          </div>
        )}
      </div>

      {/* Rádios de Opção Obrigatórios */}
      <RadioGroup
        value={isBeneficiary ? 'BENEFICIARY' : 'NON_BENEFICIARY'}
        onValueChange={(val: string) => {
          const beneficiary = val === 'BENEFICIARY'
          onToggleBeneficiary(beneficiary)
          if (beneficiary && credits.length === 0) {
            handleAddCredit()
          }
        }}
        disabled={disabled}
        className="space-y-2.5 text-xs"
      >
        <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
          <RadioGroupItem value="NON_BENEFICIARY" id="rad-non" className="mt-0.5" />
          <label htmlFor="rad-non" className="cursor-pointer text-slate-700 dark:text-slate-300 leading-snug">
            <strong>Não sou(somos) beneficiário(s)</strong> de crédito(s) "em ser" de INVESTIMENTO AGROPECUÁRIO contratado com recursos controlados em qualquer instituição do Sistema Nacional de Crédito Rural (SNCR).
          </label>
        </div>

        <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
          <RadioGroupItem value="BENEFICIARY" id="rad-ben" className="mt-0.5" />
          <label htmlFor="rad-ben" className="cursor-pointer text-slate-700 dark:text-slate-300 leading-snug">
            <strong>Sou(somos) beneficiário(s)</strong> de crédito(s) "em ser" de INVESTIMENTO AGROPECUÁRIO contratado com recursos controlados no SNCR, conforme discriminado abaixo:
          </label>
        </div>
      </RadioGroup>

      {/* Grid de Créditos Declarados */}
      {isBeneficiary && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Contratos e Financiamentos Vigentes ({credits.length})
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={handleAddCredit}
              className="h-7 text-xs font-bold gap-1 text-[#1B4D3E] border-[#1B4D3E]/30 hover:bg-emerald-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Contrato em Ser
            </Button>
          </div>

          {credits.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Você marcou que é beneficiário. Clique em "Adicionar Contrato em Ser" para detalhar a operação.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {credits.map((item, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end text-xs"
                >
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[10px] text-slate-500 font-semibold">Instituição Financeira</Label>
                    <Input
                      disabled={disabled}
                      value={item.institution}
                      onChange={(e) => handleUpdateCredit(index, 'institution', e.target.value)}
                      placeholder="Ex: Banco do Brasil"
                      className="h-8 text-xs bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[10px] text-slate-500 font-semibold">Linha de Crédito</Label>
                    <Input
                      disabled={disabled}
                      value={item.creditLine}
                      onChange={(e) => handleUpdateCredit(index, 'creditLine', e.target.value)}
                      placeholder="Ex: Pronaf Mais Alimentos"
                      className="h-8 text-xs bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[10px] text-slate-500 font-semibold">Data Contratação</Label>
                    <Input
                      type="date"
                      disabled={disabled}
                      value={item.contractDate}
                      onChange={(e) => handleUpdateCredit(index, 'contractDate', e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[10px] text-slate-500 font-semibold">Ano Agrícola</Label>
                    <Input
                      disabled={disabled}
                      value={item.cropYear}
                      onChange={(e) => handleUpdateCredit(index, 'cropYear', e.target.value)}
                      placeholder="Ex: 2024/2025"
                      className="h-8 text-xs bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] text-slate-500 font-semibold">Saldo Devedor (R$)</Label>
                      {credits.length > 1 && (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => handleRemoveCredit(index)}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer p-0.5"
                          title="Remover linha"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <CurrencyInput
                      disabled={disabled}
                      value={item.amount}
                      onChangeValue={(val: number) => handleUpdateCredit(index, 'amount', val)}
                      className="h-8 text-xs bg-white font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-[11px] text-amber-900 leading-tight">
            <strong>Aviso de Compliance Bancário:</strong> A declaração falsa implica desclassificação da operação no SICOR e substituição por taxas livres de mercado, com sanções do Manual de Crédito Rural (MCR).
          </div>
        </div>
      )}
    </div>
  )
}
