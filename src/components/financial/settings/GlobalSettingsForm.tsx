'use client'

import React, { useState } from 'react'
import {
  Percent,
  Users2,
  Car,
  Sparkles,
  ShieldCheck,
  Calculator,
  Save,
} from 'lucide-react'
import { updateFinancialSettings } from '@/actions/financial/settings'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'

interface GlobalSettingsFormProps {
  globalSettings: any
  isExecutive?: boolean
}

export default function GlobalSettingsForm({
  globalSettings,
  isExecutive,
}: GlobalSettingsFormProps) {
  const [successFee, setSuccessFee] = useState<number>(
    Number(globalSettings?.defaultSuccessFeePercent || 2.0)
  )
  const [partnerComm, setPartnerComm] = useState<number>(
    Number(globalSettings?.defaultPartnerCommissionPercent || 20.0)
  )
  const [kmCost, setKmCost] = useState<number>(
    Number(globalSettings?.defaultFieldSurveyCostPerKm || 2.5)
  )
  const [isSavingGlobal, setIsSavingGlobal] = useState(false)

  // Simulações em tempo real
  const simulatedCredit = 500000.0
  const simulatedSuccessFeeAmount = (simulatedCredit * (successFee || 0)) / 100

  const simulatedRevenue = 10000.0
  const simulatedPartnerCommAmount = (simulatedRevenue * (partnerComm || 0)) / 100

  const simulatedKmDistance = 200
  const simulatedKmCostTotal = simulatedKmDistance * (kmCost || 0)

  const handleSaveGlobal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isExecutive) {
      toast.error('Apenas a Diretoria Executiva possui permissão para alterar parâmetros globais.')
      return
    }

    setIsSavingGlobal(true)
    const toastId = toast.loading('Salvando parâmetros globais da organização...')

    try {
      const res = await updateFinancialSettings({
        defaultSuccessFeePercent: successFee,
        defaultPartnerCommissionPercent: partnerComm,
        defaultFieldSurveyCostPerKm: kmCost,
      })

      if (res.error) {
        toast.dismiss(toastId)
        toast.error(res.error)
        return
      }

      toast.dismiss(toastId)
      toast.success('Parâmetros globais atualizados com sucesso!')
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err?.message || 'Falha ao salvar parâmetros.')
    } finally {
      setIsSavingGlobal(false)
    }
  }

  return (
    <form onSubmit={handleSaveGlobal} className="max-w-4xl space-y-5">
      {/* Banner Introdutório */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-base font-bold text-slate-900">
          Parâmetros Globais da Organização (Grupo LN)
        </h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Definição das diretrizes padrão aplicadas automaticamente em todas as filiais e contratos de crédito rural.
          Alterações aqui refletem nas novas propostas geradas na esteira comercial.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {/* Card 1: Taxa Padrão de Êxito em Crédito Rural */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <Label htmlFor="successFee" className="text-sm font-bold text-slate-900 cursor-pointer">
                  Taxa Padrão de Êxito em Crédito Rural
                </Label>
                <p className="text-xs text-slate-500">Honorários cobrados sobre o valor do crédito liberado pelo banco</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200/60">
              <Sparkles className="w-3 h-3" />
              Herança Automática na Esteira
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Percentual Aplicado:</Label>
              <div className="relative flex items-center">
                <Input
                  id="successFee"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={successFee}
                  onChange={(e) => setSuccessFee(parseFloat(e.target.value) || 0)}
                  disabled={!isExecutive}
                  className="pr-8 text-sm font-bold text-slate-900 bg-slate-50/50 focus:bg-white"
                />
                <span className="absolute right-3 text-xs font-bold text-slate-400 select-none pointer-events-none">
                  %
                </span>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                Percentual padrão sugerido na abertura de propostas bancárias (admitindo override pontual por contrato).
              </p>
              {/* Simulação Dinâmica em Tempo Real */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-950 flex items-start gap-2.5">
                <Calculator className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <strong>Simulação em Tempo Real:</strong> Para um crédito de{' '}
                  <span className="font-semibold">{formatCurrency(simulatedCredit)}</span> liberado no banco, o honorário sugerido será de{' '}
                  <strong className="text-emerald-900 font-bold">{successFee}%</strong>{' '}
                  ({formatCurrency(simulatedSuccessFeeAmount)}).
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Taxa Padrão de Comissão de Parceiros Comerciais */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                <Users2 className="w-4 h-4" />
              </div>
              <div>
                <Label htmlFor="partnerComm" className="text-sm font-bold text-slate-900 cursor-pointer">
                  Taxa Padrão de Comissão de Parceiros Comerciais
                </Label>
                <p className="text-xs text-slate-500">Repasse a corretores e prospectadores de crédito rural</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200/60">
              <ShieldCheck className="w-3 h-3" />
              Trava Contra Inadimplência
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Comissão sobre Honorários:</Label>
              <div className="relative flex items-center">
                <Input
                  id="partnerComm"
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={partnerComm}
                  onChange={(e) => setPartnerComm(parseFloat(e.target.value) || 0)}
                  disabled={!isExecutive}
                  className="pr-8 text-sm font-bold text-amber-900 bg-slate-50/50 focus:bg-white"
                />
                <span className="absolute right-3 text-xs font-bold text-slate-400 select-none pointer-events-none">
                  %
                </span>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                Percentual dos honorários repassado a intermediadores e corretores de campo.
              </p>
              {/* Simulação Dinâmica em Tempo Real */}
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs text-amber-950 flex items-start gap-2.5">
                <Calculator className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <strong>Simulação em Tempo Real:</strong> Sobre{' '}
                  <span className="font-semibold">{formatCurrency(simulatedRevenue)}</span> de honorários da LN, a comissão provisionada será de{' '}
                  <strong className="text-amber-900 font-bold">{formatCurrency(simulatedPartnerCommAmount)}</strong>, liberada estritamente após a quitação do produtor.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Custo de Referência por Quilômetro de Campo */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <Label htmlFor="kmCost" className="text-sm font-bold text-slate-900 cursor-pointer">
                  Custo de Referência por Quilômetro de Campo
                </Label>
                <p className="text-xs text-slate-500">Deslocamentos agronômicos, coletas e vistorias fundiárias</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
              Dedução na MOL
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Valor Unitário:</Label>
              <div className="relative flex items-center">
                <Input
                  id="kmCost"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={kmCost}
                  onChange={(e) => setKmCost(parseFloat(e.target.value) || 0)}
                  disabled={!isExecutive}
                  className="pr-16 text-sm font-bold text-slate-900 bg-slate-50/50 focus:bg-white"
                />
                <span className="absolute right-3 text-xs font-bold text-slate-400 select-none pointer-events-none">
                  R$ / km
                </span>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                Base para cálculo de deslocamentos agronômicos e vistorias técnicas com dedução na Margem Operacional Líquida (MOL).
              </p>
              {/* Simulação Dinâmica em Tempo Real */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 flex items-start gap-2.5">
                <Calculator className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <strong>Simulação em Tempo Real:</strong> Um deslocamento técnico de{' '}
                  <span className="font-semibold">{simulatedKmDistance} km</span> terá custo orçado de{' '}
                  <strong className="text-slate-900 font-bold">{formatCurrency(simulatedKmCostTotal)}</strong>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ação de Salvamento */}
      <div className="flex items-center justify-between pt-2">
        {isExecutive ? (
          <Button
            type="submit"
            disabled={isSavingGlobal}
            className="bg-[#113025] hover:bg-[#163d30] text-white font-bold gap-2 px-6 h-10 shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSavingGlobal ? 'Salvando Parâmetros...' : 'Salvar Parâmetros Globais'}
          </Button>
        ) : (
          <p className="text-rose-600 font-semibold text-xs">
            * Apenas a Diretoria Executiva possui permissão para alterar parâmetros globais corporativos.
          </p>
        )}
      </div>
    </form>
  )
}
