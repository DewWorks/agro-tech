import React from 'react'
import { MapPin, Check, AlertTriangle, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SmartCreatableCombobox } from '@/components/property-wizard/subcomponents/SmartCreatableCombobox'
import { RURAL_ACTIVITIES } from '@/lib/validations/reference-data'
import { CustomOptions } from '../../../types/wizard-types'

interface Step1CreditIdentificationProps {
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
  step1Pending: string[]
  onAdvance: () => void
  isLimiteCredito: boolean
  hasParamsStep: boolean
}

export function Step1CreditIdentification({
  customOptions,
  setCustomOptions,
  step1Pending,
  onAdvance,
  isLimiteCredito,
  hasParamsStep
}: Step1CreditIdentificationProps) {
  const landTotalHa = Number(customOptions.propertyTotalArea) || 0
  const landPricePerHa = Number(customOptions.estimatedLandValuePerHa) || 0
  const vtnEstimated = landTotalHa * landPricePerHa

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#1B4D3E]" />
            Passo 1: Dados Fundiários & Áreas do Imóvel
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Preencha as informações da matrícula, cadastro ambiental e dimensões exigidas pelo Banco do Brasil e órgãos de fiscalização.
          </p>
        </div>
        {step1Pending.length === 0 ? (
          <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold flex items-center gap-1.5 self-start">
            <Check className="h-3.5 w-3.5" /> Imóvel Regular
          </span>
        ) : (
          <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 font-bold flex items-center gap-1.5 self-start">
            <AlertTriangle className="h-3.5 w-3.5" /> {step1Pending.length} Campo(s) Obrigatório(s) Pendente(s)
          </span>
        )}
      </div>

      {step1Pending.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Atenção às pendências obrigatórias da etapa:</strong> Preencha {step1Pending.join(', ')} para prosseguir à esteira do projeto.
          </div>
        </div>
      )}

      {/* Linha 1: Matrícula, CRI, CAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">Matrícula / Registro do Imóvel *</Label>
          <Input
            value={customOptions.propertyRegistrationNumber || ''}
            onChange={(e) => {
              const numericOnly = e.target.value.replace(/\D/g, '')
              setCustomOptions(prev => ({ ...prev, propertyRegistrationNumber: numericOnly }))
            }}
            className={cn("h-10 text-xs", !customOptions.propertyRegistrationNumber?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
            placeholder="Ex: 12345 (Apenas números)"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">Cartório de Registro (CRI) *</Label>
          <Input
            value={customOptions.propertyRegistryOffice || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyRegistryOffice: e.target.value }))}
            className="h-10 text-xs"
            placeholder="Ex: Cartório de Registro de Imóveis de Palmas - TO"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">Nº do Recibo do CAR *</Label>
          <Input
            value={customOptions.propertyCar || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyCar: e.target.value.toUpperCase() }))}
            className={cn("h-10 text-xs uppercase font-medium", !customOptions.propertyCar?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
            placeholder="Ex: TO-1700000-XXXXXXXXXXXX"
          />
        </div>
      </div>

      {/* Linha 2: CCIR, ITR, Atividade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">CCIR / INCRA</Label>
          <Input
            value={customOptions.propertyCcir || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyCcir: e.target.value }))}
            className="h-10 text-xs"
            placeholder="Ex: 950.082.014.281-0"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">ITR / NIRF (Receita Federal)</Label>
          <Input
            value={customOptions.propertyItr || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyItr: e.target.value }))}
            className="h-10 text-xs"
            placeholder="Ex: 1.234.567-8"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">Atividade Produtiva Principal *</Label>
          <SmartCreatableCombobox
            options={RURAL_ACTIVITIES}
            value={customOptions.propertyActivity || ''}
            onChange={(val) => setCustomOptions(prev => ({ ...prev, propertyActivity: val }))}
            placeholder="Selecione ou digite a atividade..."
          />
        </div>
      </div>

      {/* Linha 3: Balanço de Áreas */}
      <div className="p-4 bg-slate-50 border border-gray-200 rounded-xl space-y-3">
        <span className="text-xs font-bold text-gray-800 uppercase tracking-wide block">
          Balanço de Áreas do Imóvel (Hectares)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-gray-600 font-semibold">Área Total (ha) *</Label>
            <Input
              type="number"
              value={customOptions.propertyTotalArea || ''}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyTotalArea: Number(e.target.value) }))}
              className={cn("h-9 text-xs font-bold bg-white", (!customOptions.propertyTotalArea || Number(customOptions.propertyTotalArea) <= 0) && "border-amber-400")}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-gray-600 font-medium">Consolidada (ha)</Label>
            <Input
              type="number"
              value={customOptions.propertyConsolidatedArea || ''}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyConsolidatedArea: Number(e.target.value) }))}
              className="h-9 text-xs bg-white"
              placeholder="0,00"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-gray-600 font-medium">Pastagens (ha)</Label>
            <Input
              type="number"
              value={customOptions.propertyPastureArea || ''}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyPastureArea: Number(e.target.value) }))}
              className="h-9 text-xs bg-white"
              placeholder="0,00"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-gray-600 font-medium">Lavoura (ha)</Label>
            <Input
              type="number"
              value={customOptions.propertyAgricultureArea || ''}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyAgricultureArea: Number(e.target.value) }))}
              className="h-9 text-xs bg-white"
              placeholder="0,00"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-gray-600 font-medium">Reserva / APP (ha)</Label>
            <Input
              type="number"
              value={customOptions.propertyReserveArea || ''}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyReserveArea: Number(e.target.value) }))}
              className="h-9 text-xs bg-white"
              placeholder="0,00"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-gray-600 font-semibold text-[#1B4D3E]">VTN (R$ / ha)</Label>
            <Input
              type="number"
              value={customOptions.estimatedLandValuePerHa || ''}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, estimatedLandValuePerHa: Number(e.target.value) }))}
              className="h-9 text-xs font-bold bg-white text-[#1B4D3E]"
              placeholder="0,00"
            />
          </div>
        </div>

        {vtnEstimated > 0 && (
          <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-200/60">
            <span>Valor Estimado da Terra Nua (VTN Total):</span>
            <span className="font-bold text-gray-900">
              R$ {vtnEstimated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      {/* Linha 4: Roteiro de Acesso */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-gray-700">
            Roteiro Detalhado de Acesso à Propriedade *
          </Label>
          <span className="text-[10px] text-muted-foreground">Exigência para Vistorias e Perícias do Banco</span>
        </div>
        <textarea
          rows={3}
          value={customOptions.propertyAccessRoute || ''}
          onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyAccessRoute: e.target.value }))}
          className={cn(
            "w-full rounded-xl border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none",
            !customOptions.propertyAccessRoute?.trim() && "border-amber-400"
          )}
          placeholder="Ex: Partindo de Palmas pela TO-050 por 45 km sentido Porto Nacional, virar à direita na Rodovia TO-255 por mais 18 km de estrada vicinal cascalhada até a porteira principal da Fazenda."
        />
      </div>

      {/* Botão de Avanço */}
      <div className="pt-4 border-t border-gray-100 flex justify-end">
        <Button
          type="button"
          onClick={onAdvance}
          className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-semibold h-10 px-6 rounded-xl shadow-xs"
        >
          {isLimiteCredito 
            ? 'Avançar: Parque de Máquinas' 
            : hasParamsStep 
              ? 'Avançar: Parâmetros Técnicos' 
              : 'Avançar: Responsável Técnico'}
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>
    </div>
  )
}
