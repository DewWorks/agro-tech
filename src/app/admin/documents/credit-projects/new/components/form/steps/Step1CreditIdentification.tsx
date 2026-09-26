import React from 'react'
import { MapPin, Check, AlertTriangle, ArrowRight, Building2, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SmartCreatableCombobox } from '@/components/property-wizard/subcomponents/SmartCreatableCombobox'
import { RURAL_ACTIVITIES } from '@/lib/validations/reference-data'
import { CustomOptions, ProducerData } from '../../../types/wizard-types'
import { formatCPF, formatCNPJ, validateCPF, maskRegistrationNumber, maskCAR, maskCCIR, maskITR } from '@/lib/utils/masks'

interface Step1CreditIdentificationProps {
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
  step1Pending: string[]
  onAdvance: () => void
  isLimiteCredito: boolean
  hasParamsStep: boolean
  currentProducer?: ProducerData
  selectedTemplateCode?: string
}

export function Step1CreditIdentification({
  customOptions,
  setCustomOptions,
  step1Pending,
  onAdvance,
  isLimiteCredito,
  hasParamsStep,
  currentProducer,
  selectedTemplateCode,
}: Step1CreditIdentificationProps) {
  const isLegalTemplate = [
    'AUTORIZACAO_COMPARTILHAMENTO',
    'AUTORIZACAO_SCR',
    'AUTORIZACAO_SICOR',
    'DECLARACAO_POSSE_MANSA',
    'DECLARACAO_REGULARIDADE_AMBIENTAL',
    'DECLARACAO_FORA_BIOMA',
    'ENQUADRAMENTO_CAF',
    'IDENTIFICACAO_ANIMAIS'
  ].includes(selectedTemplateCode || '')

  const landTotalHa = Number(customOptions.propertyTotalArea) || 0
  const landPricePerHa = Number(customOptions.estimatedLandValuePerHa) || 0
  const vtnEstimated = landTotalHa * landPricePerHa

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#1B4D3E]" />
            {isLegalTemplate 
              ? 'Passo 1: Identificação do Imóvel & Proponente' 
              : 'Passo 1: Dados Fundiários & Áreas do Imóvel'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isLegalTemplate
              ? 'Confirme os dados cadastrais da matrícula e do CAR vinculados à declaração oficial.'
              : 'Preencha as informações da matrícula, cadastro ambiental e dimensões exigidas pelo Banco do Brasil e órgãos de fiscalização.'}
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

      {/* Seção Proponente PJ & Representante Legal */}
      {currentProducer?.type === 'PJ' && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#1B4D3E]" />
              <span className="text-xs font-bold text-gray-900">
                Proponente PJ: {currentProducer.name} (CNPJ: {formatCNPJ(currentProducer.document)})
              </span>
            </div>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Exigência Bancária: Identificação por CPF
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Nome do Titular / Representante Legal</Label>
              <Input
                value={customOptions.representativeName || (currentProducer?.name ? currentProducer.name.replace(/\s*\(PJ\)\s*/i, '').trim() : '')}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, representativeName: e.target.value }))}
                className="h-10 text-xs bg-white"
                placeholder="Ex: Nome Completo do Sócio Administrador"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gray-700">
                  CPF do Titular / Representante Legal *
                </Label>
                {(customOptions.representativeCpf || currentProducer.representativeCpf) ? (
                  validateCPF(customOptions.representativeCpf || currentProducer.representativeCpf || '') ? (
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="h-3 w-3" /> CPF Válido
                    </span>
                  ) : (
                    <span className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> CPF Inválido
                    </span>
                  )
                ) : null}
              </div>
              <Input
                value={customOptions.representativeCpf || currentProducer.representativeCpf || ''}
                onChange={(e) => {
                  const masked = formatCPF(e.target.value)
                  setCustomOptions(prev => ({ ...prev, representativeCpf: masked }))
                }}
                className={cn(
                  "h-10 text-xs bg-white",
                  (customOptions.representativeCpf || currentProducer.representativeCpf) &&
                    !validateCPF(customOptions.representativeCpf || currentProducer.representativeCpf || '') &&
                    "border-red-500 focus-visible:ring-red-400"
                )}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              <p className="text-[10px] text-muted-foreground">
                O Banco do Brasil exige o CPF do titular/representante legal para emissão, assinatura e gravação oficial.
              </p>
            </div>
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
              setCustomOptions(prev => ({ ...prev, propertyRegistrationNumber: maskRegistrationNumber(e.target.value) }))
            }}
            maxLength={8}
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
            onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyCar: maskCAR(e.target.value) }))}
            maxLength={41}
            className={cn("h-10 text-xs uppercase font-medium", !customOptions.propertyCar?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
            placeholder="UF-1234567-XXXX.XXXX.XXXX.XXXX.XXXX.XXXX.XXXX"
          />
        </div>
      </div>

      {/* Linha 2: CCIR, ITR, Atividade (Atividade exibida exclusivamente para projetos técnicos) */}
      <div className={cn("grid gap-4", isLegalTemplate ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3")}>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">CCIR / INCRA</Label>
          <Input
            value={customOptions.propertyCcir || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyCcir: maskCCIR(e.target.value) }))}
            maxLength={17}
            className="h-10 text-xs font-mono"
            placeholder="Ex: 000.000.000.000-0"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">ITR / NIRF (Receita Federal)</Label>
          <Input
            value={customOptions.propertyItr || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyItr: maskITR(e.target.value) }))}
            maxLength={10}
            className="h-10 text-xs font-mono"
            placeholder="Ex: 0.000.000-0"
          />
        </div>

        {!isLegalTemplate && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Atividade Produtiva Principal *</Label>
            <SmartCreatableCombobox
              options={RURAL_ACTIVITIES}
              value={customOptions.propertyActivity || 'Pecuária de Corte'}
              onChange={(val) => setCustomOptions(prev => ({ ...prev, propertyActivity: val }))}
              placeholder="Selecione ou digite a atividade..."
            />
          </div>
        )}
      </div>

      {/* Seções de Áreas e Roteiro de Acesso — Exclusivas para Projetos Técnicos de Crédito */}
      {!isLegalTemplate && (
        <>
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
        </>
      )}

      {/* Botão de Avanço */}
      <div className="pt-4 border-t border-gray-100 flex justify-end">
        <Button
          type="button"
          onClick={onAdvance}
          className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-semibold h-10 px-6 rounded-xl shadow-xs"
        >
          {isLegalTemplate
            ? 'Avançar: Responsável Técnico & Emissão'
            : isLimiteCredito 
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
