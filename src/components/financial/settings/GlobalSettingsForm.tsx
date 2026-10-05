'use client'

import React, { useState } from 'react'
import { updateFinancialSettings } from '@/actions/financial/settings'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

  const handleSaveGlobal = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingGlobal(true)
    const toastId = toast.loading('Salvando parâmetros globais...')

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
    <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-900">
          Parâmetros Globais da Organização (Grupo LN)
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Valores pré-configurados aplicados por padrão em todas as filiais e contratos de
          prestação de serviços.
        </p>
      </div>

      <form onSubmit={handleSaveGlobal} className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">
            Honorário de Êxito Padrão em Crédito Rural (%):
          </Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={successFee}
            onChange={(e) => setSuccessFee(parseFloat(e.target.value) || 0)}
            disabled={!isExecutive}
            className="text-xs font-bold text-slate-900"
          />
          <p className="text-[10px] text-slate-400">
            Percentual aplicado automaticamente na aprovação da esteira bancária.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">
            Comissão Padrão de Parceiros Comerciais (%):
          </Label>
          <Input
            type="number"
            step="0.5"
            min="0"
            max="100"
            value={partnerComm}
            onChange={(e) => setPartnerComm(parseFloat(e.target.value) || 0)}
            disabled={!isExecutive}
            className="text-xs font-bold text-emerald-800"
          />
          <p className="text-[10px] text-slate-400">
            Fração repassada ao prospectador ou corretor sobre o honorário líquido recebido.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">
            Custo de Deslocamento para Vistoria de Campo (R$/km):
          </Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={kmCost}
            onChange={(e) => setKmCost(parseFloat(e.target.value) || 0)}
            disabled={!isExecutive}
            className="text-xs font-bold text-slate-900"
          />
          <p className="text-[10px] text-slate-400">
            Base para orçamentação automática de vistorias agronômicas e GPS.
          </p>
        </div>

        {isExecutive ? (
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSavingGlobal}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
            >
              {isSavingGlobal ? 'Salvando...' : 'Salvar Parâmetros Globais'}
            </Button>
          </div>
        ) : (
          <p className="text-rose-600 font-semibold text-[11px]">
            * Apenas a Diretoria Executiva possui permissão para alterar parâmetros globais.
          </p>
        )}
      </form>
    </div>
  )
}
