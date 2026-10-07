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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/60">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <Label htmlFor="successFee" className="text-sm font-bold text-slate-900 cursor-pointer">
                  Taxa Padrão de Êxito em Crédito Rural
                </Label>
                <p className="text-xs text-slate-500">Honorários cobrados sobre o valor do crédito liberado pelo banco</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200/70 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              Herança Automática na Esteira
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch pt-1">
            <div className="lg:col-span-5 flex flex-col justify-between space-y-2">
              <div className="space-y-1.5">
                <Label htmlFor="successFee" className="text-xs font-bold text-slate-700 block">
                  Percentual Aplicado
                </Label>
                <div className="flex h-10 w-full rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 transition-all">
                  <input
                    id="successFee"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={successFee}
                    onChange={(e) => setSuccessFee(parseFloat(e.target.value) || 0)}
                    disabled={!isExecutive}
                    className="w-full h-full px-3 text-sm font-bold text-slate-900 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:text-slate-400"
                  />
                  <span className="flex items-center justify-center h-full px-3.5 text-xs font-bold text-slate-600 bg-slate-50 border-l border-slate-200 select-none shrink-0">
                    %
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Percentual padrão sugerido na abertura de propostas bancárias (admitindo override pontual por contrato).
              </p>
            </div>

            <div className="lg:col-span-7 flex">
              <div className="w-full rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 flex items-start gap-3 text-xs text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/90 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/50">
                  <Calculator className="w-4 h-4 text-emerald-800" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    Simulação em Tempo Real
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Para um crédito de <strong className="font-semibold text-slate-900">{formatCurrency(simulatedCredit)}</strong> liberado no banco, o honorário sugerido será de{' '}
                    <strong className="text-emerald-900 font-bold">{successFee}%</strong> ({formatCurrency(simulatedSuccessFeeAmount)}).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Taxa Padrão de Comissão de Parceiros Comerciais */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/60">
                <Users2 className="w-4 h-4" />
              </div>
              <div>
                <Label htmlFor="partnerComm" className="text-sm font-bold text-slate-900 cursor-pointer">
                  Taxa Padrão de Comissão de Parceiros Comerciais
                </Label>
                <p className="text-xs text-slate-500">Repasse a corretores e prospectadores de crédito rural</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200/70 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Trava Contra Inadimplência
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch pt-1">
            <div className="lg:col-span-5 flex flex-col justify-between space-y-2">
              <div className="space-y-1.5">
                <Label htmlFor="partnerComm" className="text-xs font-bold text-slate-700 block">
                  Comissão sobre Honorários
                </Label>
                <div className="flex h-10 w-full rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 transition-all">
                  <input
                    id="partnerComm"
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={partnerComm}
                    onChange={(e) => setPartnerComm(parseFloat(e.target.value) || 0)}
                    disabled={!isExecutive}
                    className="w-full h-full px-3 text-sm font-bold text-slate-900 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:text-slate-400"
                  />
                  <span className="flex items-center justify-center h-full px-3.5 text-xs font-bold text-slate-600 bg-slate-50 border-l border-slate-200 select-none shrink-0">
                    %
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Percentual dos honorários repassado a intermediadores e corretores de campo parceiros.
              </p>
            </div>

            <div className="lg:col-span-7 flex">
              <div className="w-full rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 flex items-start gap-3 text-xs text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/90 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/50">
                  <Calculator className="w-4 h-4 text-emerald-800" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    Simulação em Tempo Real
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Sobre <strong className="font-semibold text-slate-900">{formatCurrency(simulatedRevenue)}</strong> de honorários da LN, a comissão provisionada será de{' '}
                    <strong className="text-emerald-900 font-bold">{formatCurrency(simulatedPartnerCommAmount)}</strong>, liberada estritamente após a quitação do produtor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Custo de Referência por Quilômetro de Campo */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/60">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <Label htmlFor="kmCost" className="text-sm font-bold text-slate-900 cursor-pointer">
                  Custo de Referência por Quilômetro de Campo
                </Label>
                <p className="text-xs text-slate-500">Deslocamentos agronômicos, coletas e vistorias fundiárias</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200/70 shadow-2xs">
              <Car className="w-3.5 h-3.5 text-emerald-700" />
              Dedução na MOL
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch pt-1">
            <div className="lg:col-span-5 flex flex-col justify-between space-y-2">
              <div className="space-y-1.5">
                <Label htmlFor="kmCost" className="text-xs font-bold text-slate-700 block">
                  Custo Unitário por Quilômetro
                </Label>
                <div className="flex h-10 w-full rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 transition-all">
                  <input
                    id="kmCost"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={kmCost}
                    onChange={(e) => setKmCost(parseFloat(e.target.value) || 0)}
                    disabled={!isExecutive}
                    className="w-full h-full px-3 text-sm font-bold text-slate-900 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:text-slate-400"
                  />
                  <span className="flex items-center justify-center h-full px-3.5 text-xs font-bold text-slate-600 bg-slate-50 border-l border-slate-200 select-none shrink-0 whitespace-nowrap">
                    R$ / km
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Base para cálculo de deslocamentos técnicos com dedução na Margem Operacional Líquida (MOL).
              </p>
            </div>

            <div className="lg:col-span-7 flex">
              <div className="w-full rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 flex items-start gap-3 text-xs text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/90 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/50">
                  <Calculator className="w-4 h-4 text-emerald-800" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    Simulação em Tempo Real
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Um deslocamento técnico de <strong className="font-semibold text-slate-900">{simulatedKmDistance} km</strong> terá custo orçado de{' '}
                    <strong className="text-emerald-900 font-bold">{formatCurrency(simulatedKmCostTotal)}</strong>.
                  </p>
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
