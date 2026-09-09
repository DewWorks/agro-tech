'use client'

import React, { useState, useMemo } from 'react'
import { 
  MapPin, 
  Tractor, 
  Building2, 
  Coins, 
  ShieldCheck, 
  Check, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  FileText, 
  Save, 
  Printer,
  Download,
  Landmark,
  Sparkles,
  Loader2
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { CustomOptions, PropertyData, ProducerData } from '../../types/wizard-types'
import { SmartCreatableCombobox } from '@/components/property-wizard/subcomponents/SmartCreatableCombobox'
import { 
  BB_IMPROVEMENTS_CATALOG, 
  MACHINERY_CATEGORIES, 
  RURAL_ACTIVITIES 
} from '@/lib/validations/reference-data'
import { TemplateParamsForm } from './TemplateParamsForm'
import { TechnicalResponsibleForm } from './TechnicalResponsibleForm'
import { A4DocumentPreview } from '../preview/A4DocumentPreview'
import { toast } from 'sonner'

interface CreditProjectStepperProps {
  selectedTemplateCode: string
  currentProducer: ProducerData | undefined
  currentProperty: PropertyData | undefined
  currentTemplate: { code: string; title: string; subtitle?: string; category?: string; bank?: string; type?: string } | undefined
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
  validationErrors: string[]
  isFormValid: boolean
  isSavingDraft: boolean
  handleOpenSaveModal: () => void
  setIsConfirmModalOpen: (open: boolean) => void
  documentData: any
  contentRef: React.RefObject<HTMLDivElement | null>
  handlePrintIsolated: () => void
  handleDownloadOriginalTemplate: () => void
  handleDownloadPdf: () => Promise<void>
  isGeneratingPdf: boolean
}

// Templates that have dedicated parameter forms in Step 2
const TEMPLATES_WITH_PARAMS = [
  'LIMITE_CREDITO_BB',
  'PROJETO_INOVAGRO',
  'PROJETO_RENOVAGRO',
  'PROJETO_CUSTEIO_SAFRA',
  'CHECKLIST_PROFISSIONAL'
]

export function CreditProjectStepper({
  selectedTemplateCode,
  currentProducer,
  currentProperty,
  currentTemplate,
  customOptions,
  setCustomOptions,
  validationErrors,
  isFormValid,
  isSavingDraft,
  handleOpenSaveModal,
  setIsConfirmModalOpen,
  documentData,
  contentRef,
  handlePrintIsolated,
  handleDownloadOriginalTemplate,
  handleDownloadPdf,
  isGeneratingPdf,
}: CreditProjectStepperProps) {
  const isLimiteCredito = selectedTemplateCode === 'LIMITE_CREDITO_BB'
  const [currentStep, setCurrentStep] = useState(1)
  const hasParamsStep = TEMPLATES_WITH_PARAMS.includes(selectedTemplateCode)
  const totalSteps = isLimiteCredito ? 5 : (hasParamsStep ? 4 : 3)

  // Machinery items state
  const machineryItems = customOptions.machineryItems || []
  const improvementItems = customOptions.improvementItems || []

  const updateMachinery = (items: typeof machineryItems) => {
    const totalVal = items.reduce((acc, m) => acc + (Number(m.value) || 0), 0)
    setCustomOptions(prev => ({
      ...prev,
      machineryItems: items,
      machineryValue: totalVal
    }))
  }

  const addMachine = () => {
    const newItems = [
      ...machineryItems,
      {
        id: Math.random().toString(),
        type: 'Trator de Pneus',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        chassi: '',
        value: 0
      }
    ]
    updateMachinery(newItems)
  }

  const removeMachine = (idx: number) => {
    const newItems = machineryItems.filter((_, i) => i !== idx)
    updateMachinery(newItems)
  }

  const updateMachineField = (idx: number, field: string, value: any) => {
    const newItems = [...machineryItems]
    newItems[idx] = { ...newItems[idx], [field]: value }
    updateMachinery(newItems)
  }

  const updateImprovements = (items: typeof improvementItems) => {
    const totalVal = items.reduce((acc, imp) => acc + (Number(imp.totalValue) || 0), 0)
    setCustomOptions(prev => ({
      ...prev,
      improvementItems: items,
      improvementsValue: totalVal
    }))
  }

  const addImprovementFromCatalog = (spec: string, unit: string, unitVal: number) => {
    const newItems = [
      ...improvementItems,
      {
        id: Math.random().toString(),
        specification: spec,
        unit: unit,
        quantity: 1,
        unitValue: unitVal,
        totalValue: unitVal,
        conservationState: 'Bom'
      }
    ]
    updateImprovements(newItems)
  }

  const removeImprovement = (idx: number) => {
    const newItems = improvementItems.filter((_, i) => i !== idx)
    updateImprovements(newItems)
  }

  const updateImprovementQuantity = (idx: number, qty: number) => {
    const newItems = [...improvementItems]
    const unitVal = Number(newItems[idx].unitValue || 0)
    newItems[idx] = {
      ...newItems[idx],
      quantity: qty,
      totalValue: Math.round(qty * unitVal)
    }
    updateImprovements(newItems)
  }

  // Real-time calculations
  const landTotalHa = Number(customOptions.propertyTotalArea) || currentProperty?.totalArea || 0
  const landPricePerHa = Number(customOptions.estimatedLandValuePerHa) || 0
  const vtnEstimated = landTotalHa * landPricePerHa

  const cattleHeads = Number(customOptions.livestockCattleHeads) || (currentProperty && currentProperty.pastureArea ? Math.round(Number(currentProperty.pastureArea) * 1.2) : 0)
  const cattleHeadPrice = Number(customOptions.livestockCattleHeadValue) || 2800
  const cattleEstimated = cattleHeads * cattleHeadPrice

  const totalImprovements = Number(customOptions.improvementsValue) || 0
  const totalMachinery = Number(customOptions.machineryValue) || 0
  const totalPatrimony = vtnEstimated + totalImprovements + totalMachinery + cattleEstimated

  const rev = Number(customOptions.annualRevenue) || 0
  const exp = Number(customOptions.annualExpenses) || 0
  const debts = Number(customOptions.existingDebts) || 0
  const netCapacity = Math.max(0, rev - exp - debts)

  // Step 1 validation
  const step1Pending = useMemo(() => {
    const p: string[] = []
    if (!customOptions.propertyRegistrationNumber?.trim()) p.push('Matrícula do Imóvel')
    if (!customOptions.propertyCar?.trim()) p.push('Nº do CAR')
    if (!customOptions.propertyTotalArea || Number(customOptions.propertyTotalArea) <= 0) p.push('Área Total (ha)')
    if (!customOptions.propertyActivity?.trim()) p.push('Atividade Principal')
    if (!customOptions.propertyAccessRoute?.trim()) p.push('Roteiro de Acesso')
    return p
  }, [customOptions])

  // Step 2 validation (Params) — only for non-LIMITE_CREDITO templates with params
  const step2Pending = useMemo(() => {
    if (isLimiteCredito) return [] // LIMITE has its own multi-step with no "params step"
    const p: string[] = []
    if (selectedTemplateCode === 'PROJETO_INOVAGRO') {
      if (!customOptions.inovagroEquipment?.trim()) p.push('Equipamento / Objeto')
      if (!customOptions.inovagroTotalInvestment) p.push('Investimento Total')
    } else if (selectedTemplateCode === 'PROJETO_RENOVAGRO') {
      if (!customOptions.renovagroSubline?.trim()) p.push('Sublinha do Programa')
      if (!customOptions.renovagroAreaHa) p.push('Área a Recuperar')
    } else if (selectedTemplateCode === 'PROJETO_CUSTEIO_SAFRA') {
      if (!customOptions.custeioSafraYear?.trim()) p.push('Ano Safra')
      if (!customOptions.custeioCropName?.trim()) p.push('Cultura / Atividade')
    }
    return p
  }, [customOptions, isLimiteCredito, selectedTemplateCode])

  // RT / Finance validation  
  const stepRTPending = useMemo(() => {
    const p: string[] = []
    if (!customOptions.responsibleName?.trim()) p.push('Responsável Técnico')
    if (isLimiteCredito) {
      if (!customOptions.estimatedLandValuePerHa && !customOptions.improvementsValue && !customOptions.machineryValue && !customOptions.annualRevenue) {
        p.push('Valor da Terra ou Receita')
      }
    }
    return p
  }, [customOptions, isLimiteCredito])

  const validateAndAdvance = (targetStep: number) => {
    if (targetStep > currentStep) {
      if (currentStep === 1 && step1Pending.length > 0) {
        toast.error(`Atenção: Preencha os campos obrigatórios do Passo 1: ${step1Pending.join(', ')}`)
        return
      }
    }
    setCurrentStep(targetStep)
    // Scroll to top of the stepper smoothly
    window.scrollTo({ top: 180, behavior: 'smooth' })
  }

  // Steps definition — dynamic based on template type
  const stepsMeta = isLimiteCredito ? [
    { num: 1, title: '1. Imóvel & Terras', subtitle: 'Dados Fundiários e Áreas', icon: MapPin, pending: step1Pending.length > 0 },
    { num: 2, title: '2. Máquinas', subtitle: 'Frota e Equipamentos', icon: Tractor, pending: false },
    { num: 3, title: '3. Benfeitorias', subtitle: 'Instalações e Rebanho', icon: Building2, pending: false },
    { num: 4, title: '4. Finanças & RT', subtitle: 'Capacidade de Pagamento', icon: Coins, pending: stepRTPending.length > 0 },
    { num: 5, title: '5. Revisão & Emissão', subtitle: 'Conferir Dossiê & Imprimir', icon: ShieldCheck, pending: !isFormValid }
  ] : hasParamsStep ? [
    { num: 1, title: '1. Imóvel & Terras', subtitle: 'Dados Fundiários', icon: MapPin, pending: step1Pending.length > 0 },
    { num: 2, title: '2. Parâmetros', subtitle: 'Dados Técnicos do Projeto', icon: Landmark, pending: step2Pending.length > 0 },
    { num: 3, title: '3. Resp. Técnico', subtitle: 'Condições Financeiras & RT', icon: Coins, pending: stepRTPending.length > 0 },
    { num: 4, title: '4. Revisão & Emissão', subtitle: 'Conferir Dossiê & Imprimir', icon: ShieldCheck, pending: !isFormValid }
  ] : [
    { num: 1, title: '1. Imóvel & Terras', subtitle: 'Dados Fundiários', icon: MapPin, pending: step1Pending.length > 0 },
    { num: 2, title: '2. Resp. Técnico', subtitle: 'Condições Financeiras & RT', icon: Coins, pending: stepRTPending.length > 0 },
    { num: 3, title: '3. Revisão & Emissão', subtitle: 'Conferir Dossiê & Imprimir', icon: ShieldCheck, pending: !isFormValid }
  ]

  return (
    <div className="space-y-6 w-full">
      {/* STEPPER HEADER TABS (FULL-WIDTH) */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 px-2">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[#1B4D3E]">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">
                {currentTemplate?.type === 'LEGAL' ? 'Passo a Passo da Declaração' : 'Passo a Passo do Projeto de Crédito'}
              </span>
              {currentTemplate && (
                <span className="text-xs font-semibold text-[#1B4D3E] mt-0.5">
                  📄 {currentTemplate.title}
                  {currentTemplate.category && (
                    <span className="ml-1.5 text-[10px] text-muted-foreground font-medium">({currentTemplate.bank || 'BB'})</span>
                  )}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              • Etapa {currentStep} de {totalSteps}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1.5",
              isFormValid 
                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                : "bg-amber-50 text-amber-800 border-amber-200"
            )}>
              {isFormValid ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Pronto para Emissão Oficial
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  {validationErrors.length} pendência(s) cadastral(is)
                </>
              )}
            </span>
          </div>
        </div>

        <div className={cn(
          "grid gap-2",
          isLimiteCredito 
            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" 
            : hasParamsStep 
              ? "grid-cols-2 sm:grid-cols-4" 
              : "grid-cols-3"
        )}>
          {stepsMeta.map((s) => {
            const Icon = s.icon
            const isActive = currentStep === s.num
            const isCompleted = currentStep > s.num && !s.pending && s.num !== stepsMeta[stepsMeta.length - 1].num
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => validateAndAdvance(s.num)}
                className={cn(
                  "flex items-center gap-2.5 p-3 rounded-xl text-left transition-all cursor-pointer border relative text-xs",
                  isActive 
                    ? "bg-[#1B4D3E] text-white border-[#1B4D3E] shadow-sm font-semibold" 
                    : isCompleted
                      ? "bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-100/60"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50/80"
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  isActive 
                    ? "bg-white/20 text-white" 
                    : isCompleted 
                      ? "bg-emerald-200/70 text-emerald-800" 
                      : "bg-gray-100 text-gray-500"
                )}>
                  {isCompleted && !isActive ? (
                    <Check className="h-4 w-4 text-emerald-700" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <div className="truncate min-w-0">
                  <div className="font-bold truncate text-[11.5px] leading-tight">
                    {s.title}
                  </div>
                  <div className={cn(
                    "text-[10px] truncate leading-tight mt-0.5",
                    isActive ? "text-white/80" : "text-muted-foreground"
                  )}>
                    {s.subtitle}
                  </div>
                </div>
                {s.pending && !isActive && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500" title="Pendências nesta etapa" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* STEP CONTENT CONTAINER (FULL WIDTH) */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-2xs">

        {/* ======================================================== */}
        {/* PASSO 1: DADOS FUNDIÁRIOS & ÁREAS (FULL-WIDTH)           */}
        {/* ======================================================== */}
        {currentStep === 1 && (
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

            {/* Linha 2: Áreas e Códigos Cadastrais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Área Total do Imóvel (ha) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={customOptions.propertyTotalArea || ''}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyTotalArea: Number(e.target.value) }))}
                  className={cn("h-10 text-xs font-semibold", (!customOptions.propertyTotalArea || Number(customOptions.propertyTotalArea) <= 0) && "border-amber-400 focus-visible:ring-amber-400")}
                  placeholder="Ex: 1500.50"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Código CCIR (13 dígitos)</Label>
                <Input
                  value={customOptions.propertyCcir || ''}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyCcir: e.target.value.replace(/\D/g, '').slice(0, 13) }))}
                  className="h-10 text-xs"
                  placeholder="Ex: 9500001234567"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Nº do NIRF / ITR (8 dígitos)</Label>
                <Input
                  value={customOptions.propertyItr || ''}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyItr: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                  className="h-10 text-xs"
                  placeholder="Ex: 12345678"
                />
              </div>
            </div>

            {/* Linha 3: Atividade Principal & Roteiro */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Atividade Principal de Exploração *</Label>
                <SmartCreatableCombobox
                  options={RURAL_ACTIVITIES}
                  value={customOptions.propertyActivity || ''}
                  onChange={(val) => setCustomOptions(prev => ({ ...prev, propertyActivity: val }))}
                  placeholder="Selecione ou digite a atividade da propriedade..."
                  className={cn("h-10", !customOptions.propertyActivity?.trim() && "border-amber-400")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Roteiro Detalhado de Acesso à Propriedade *</Label>
                <Input
                  value={customOptions.propertyAccessRoute || ''}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyAccessRoute: e.target.value }))}
                  className={cn("h-10 text-xs", !customOptions.propertyAccessRoute?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
                  placeholder="Ex: Partindo de Palmas pela TO-050 por 45km, entrar à direita na vicinal por 12km..."
                />
              </div>
            </div>

            {/* Card de Cotação de Terra Nua (VTN) para Limite de Crédito */}
            {isLimiteCredito && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-semibold text-emerald-900 border-b border-emerald-200/60 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Landmark className="h-4 w-4 text-[#1B4D3E]" />
                    Cotação de Terra Nua Oficial (VTN / SICOR Banco do Brasil)
                  </span>
                  <span className="text-[#1B4D3E] font-bold text-sm">
                    Valor da Terra Nua (VTN Estimado): R$ {vtnEstimated.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-emerald-800 font-medium">Cotação Média Terra Nua (R$/ha)</Label>
                    <Input
                      type="number"
                      value={customOptions.estimatedLandValuePerHa || ''}
                      onChange={(e) => setCustomOptions(prev => ({ ...prev, estimatedLandValuePerHa: Number(e.target.value) }))}
                      className="h-10 text-xs bg-white font-semibold"
                      placeholder="Ex: 15000,00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-emerald-800 font-medium">Área Base Considerada</Label>
                    <div className="h-10 px-3 flex items-center bg-white border border-emerald-200 rounded-lg text-xs font-semibold text-gray-800">
                      {landTotalHa.toFixed(2)} hectares
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-emerald-800 font-medium">Patrimônio Fundiário Total</Label>
                    <div className="h-10 px-3 flex items-center bg-emerald-100/70 border border-emerald-300 rounded-lg text-xs font-bold text-[#1B4D3E]">
                      R$ {vtnEstimated.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <Button
                type="button"
                onClick={() => validateAndAdvance(2)}
                className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-semibold h-10 px-6 flex items-center gap-2 rounded-xl shadow-xs"
              >
                Avançar: {stepsMeta[1]?.title}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASSO 2: MÁQUINAS & EQUIPAMENTOS (FULL-WIDTH)            */}
        {/* ======================================================== */}
        {currentStep === 2 && isLimiteCredito && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Tractor className="h-5 w-5 text-[#1B4D3E]" />
                  Passo 2: Máquinas, Veículos e Equipamentos Agrícolas
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cadastre o maquinário e implementos do proponente para compor o inventário de garantias e capacidade operacional.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#1B4D3E] bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-bold flex items-center gap-1.5">
                  Total Avaliado: R$ {totalMachinery.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={addMachine}
                  className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs h-8 px-3 rounded-lg flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar Máquina
                </Button>
              </div>
            </div>

            {/* Total Manual / Resumo */}
            <div className="p-4 bg-slate-50 border border-gray-200 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <Label className="text-xs font-semibold text-gray-800">Valor Total Avaliado da Frota (R$)</Label>
                <p className="text-[11px] text-muted-foreground">
                  Você pode preencher o valor total diretamente ou detalhar item a item abaixo.
                </p>
              </div>
              <Input
                type="number"
                value={customOptions.machineryValue || ''}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, machineryValue: Number(e.target.value) }))}
                className="h-10 text-xs font-bold bg-white"
                placeholder="0,00"
              />
            </div>

            {/* DataGrid de Máquinas */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-800 block">
                Frota e Implementos Cadastrados ({machineryItems.length})
              </span>

              {machineryItems.length === 0 ? (
                <div className="p-8 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center space-y-2">
                  <Tractor className="h-8 w-8 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-500 font-medium">
                    Nenhum maquinário cadastrado individualmente.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMachine}
                    className="text-xs text-[#1B4D3E] border-emerald-300"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Primeiro Maquinário
                  </Button>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-x-auto bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-semibold">
                        <th className="p-3">Categoria / Tipo</th>
                        <th className="p-3">Marca</th>
                        <th className="p-3">Modelo</th>
                        <th className="p-3 w-20 text-center">Ano</th>
                        <th className="p-3">Chassi / Nº Série</th>
                        <th className="p-3 text-right">Valor Estimado (R$)</th>
                        <th className="p-3 w-12 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {machineryItems.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-2">
                            <Select
                              value={item.type}
                              onValueChange={(val) => updateMachineField(idx, 'type', val)}
                            >
                              <SelectTrigger className="h-8 text-xs bg-white border-gray-200 w-full min-w-[170px]">
                                <SelectValue placeholder="Categoria">{item.type}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {MACHINERY_CATEGORIES.map(cat => (
                                  <SelectItem key={cat} value={cat} className="text-xs">
                                    {cat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-2">
                            <Input
                              placeholder="Ex: John Deere"
                              value={item.brand}
                              onChange={(e) => updateMachineField(idx, 'brand', e.target.value)}
                              className="h-8 text-xs bg-white"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              placeholder="Ex: 7215J"
                              value={item.model}
                              onChange={(e) => updateMachineField(idx, 'model', e.target.value)}
                              className="h-8 text-xs bg-white"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              placeholder="Ano"
                              value={item.year || ''}
                              onChange={(e) => updateMachineField(idx, 'year', Number(e.target.value))}
                              className="h-8 text-xs bg-white text-center"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              placeholder="Chassi"
                              value={item.chassi || ''}
                              onChange={(e) => updateMachineField(idx, 'chassi', e.target.value)}
                              className="h-8 text-xs bg-white"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              placeholder="0,00"
                              value={item.value || ''}
                              onChange={(e) => updateMachineField(idx, 'value', Number(e.target.value))}
                              className="h-8 text-xs font-bold bg-white text-right"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => removeMachine(idx)}
                              className="h-7 w-7 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="text-xs h-10 px-5 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar: Dados Fundiários
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-semibold h-10 px-6 rounded-xl shadow-xs"
              >
                Avançar: Benfeitorias & Rebanho
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 for other templates WITH params form */}
        {currentStep === 2 && !isLimiteCredito && hasParamsStep && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-[#1B4D3E]" />
                  Passo 2: Parâmetros Técnicos do Modelo
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Defina os parâmetros agronômicos, financeiros e operacionais específicos do modelo oficial selecionado.
                </p>
              </div>
              {step2Pending.length === 0 ? (
                <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold flex items-center gap-1.5 self-start">
                  <Check className="h-3.5 w-3.5" /> Parâmetros Preenchidos
                </span>
              ) : (
                <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 font-bold flex items-center gap-1.5 self-start">
                  <AlertTriangle className="h-3.5 w-3.5" /> {step2Pending.length} Campo(s) Pendente(s)
                </span>
              )}
            </div>

            <TemplateParamsForm
              selectedTemplateCode={selectedTemplateCode}
              customOptions={customOptions}
              setCustomOptions={setCustomOptions}
            />

            <div className="pt-4 border-t border-gray-100 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="text-xs h-10 px-5 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-semibold h-10 px-6 rounded-xl shadow-xs"
              >
                Avançar: Responsável Técnico
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASSO 3: BENFEITORIAS & REBANHO (FULL-WIDTH)             */}
        {/* ======================================================== */}
        {currentStep === 3 && isLimiteCredito && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#1B4D3E]" />
                  Passo 3: Benfeitorias e Rebanho (Semoventes)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Adicione as benfeitorias com base no Catálogo Oficial do Banco do Brasil e o rebanho bovino para avaliação patrimonial.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#1B4D3E] bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-bold">
                  Total Benfeitorias: R$ {totalImprovements.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-amber-900 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 font-bold">
                  Total Rebanho: R$ {cattleEstimated.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Total Manual / Resumo Benfeitorias */}
            <div className="p-4 bg-slate-50 border border-gray-200 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <Label className="text-xs font-semibold text-gray-800">Valor Total Estimado de Benfeitorias (R$)</Label>
                <p className="text-[11px] text-muted-foreground">
                  Valor oficial consolidado para a Ficha Cadastral e garantias reais.
                </p>
              </div>
              <Input
                type="number"
                value={customOptions.improvementsValue || ''}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, improvementsValue: Number(e.target.value) }))}
                className="h-10 text-xs font-bold bg-white"
                placeholder="0,00"
              />
            </div>

            {/* Catálogo Rápido do Banco do Brasil */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-800 block">
                Catálogo Oficial do Banco do Brasil (Clique para adicionar ao orçamento):
              </Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Curral cordoalha', unit: 'm linear', val: 405 },
                  { name: 'Casa sede alvenaria', unit: 'm²', val: 1770 },
                  { name: 'Casa funcionários alvenaria', unit: 'm²', val: 1200 },
                  { name: 'Galpão metálico fechado', unit: 'm²', val: 850 },
                  { name: 'Cerca arame liso (5 fios)', unit: 'km', val: 20000 },
                  { name: 'Poço Artesiano com bomba', unit: 'metros', val: 350 },
                  { name: 'Energia Solar Fotovoltaica', unit: 'kWp', val: 4200 },
                  { name: 'Silo metálico para grãos', unit: 'toneladas', val: 480 },
                ].map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => addImprovementFromCatalog(cat.name, cat.unit, cat.val)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/70 transition-colors cursor-pointer text-gray-700 flex items-center gap-1.5 shadow-2xs font-medium"
                  >
                    <Plus className="h-3 w-3 text-emerald-600" />
                    {cat.name} <span className="text-muted-foreground text-[11px]">(R$ {cat.val}/{cat.unit})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tabela de Benfeitorias Adicionadas */}
            {improvementItems.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-semibold">
                      <th className="p-3">Especificação da Benfeitoria</th>
                      <th className="p-3 w-36 text-center">Quantidade / Dimensão</th>
                      <th className="p-3 w-24">Unidade</th>
                      <th className="p-3 text-right">Valor Unitário BB</th>
                      <th className="p-3 text-right">Valor Total</th>
                      <th className="p-3 w-12 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {improvementItems.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-medium text-gray-800">{item.specification}</td>
                        <td className="p-2 text-center">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateImprovementQuantity(idx, Number(e.target.value))}
                            className="h-8 w-28 text-center text-xs bg-white mx-auto font-semibold"
                          />
                        </td>
                        <td className="p-3 text-gray-500">{item.unit}</td>
                        <td className="p-3 text-right text-gray-600">R$ {Number(item.unitValue || 0).toLocaleString('pt-BR')}</td>
                        <td className="p-3 text-right font-bold text-emerald-800">
                          R$ {item.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-center">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeImprovement(idx)}
                            className="h-7 w-7 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Semoventes / Rebanho Bovino */}
            <div className="p-5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-amber-200/60 pb-2">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Inventário de Semoventes / Rebanho Bovino
                </span>
                <span className="text-xs font-bold text-amber-900">
                  Total Rebanho: R$ {cattleEstimated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-amber-900 font-semibold">Total de Cabeças (Bovinos)</Label>
                  <Input
                    type="number"
                    value={customOptions.livestockCattleHeads || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, livestockCattleHeads: Number(e.target.value) }))}
                    className="h-10 text-xs bg-white font-bold"
                    placeholder="Ex: 250"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-amber-900 font-semibold">Cotação Média / Cabeça (R$)</Label>
                  <Input
                    type="number"
                    value={customOptions.livestockCattleHeadValue || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, livestockCattleHeadValue: Number(e.target.value) }))}
                    className="h-10 text-xs bg-white font-bold"
                    placeholder="Ex: 2800"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-amber-900 font-semibold">Registro de Marca ADAPEC</Label>
                  <Input
                    value={customOptions.livestockBrandAdapec || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, livestockBrandAdapec: e.target.value }))}
                    className="h-10 text-xs bg-white uppercase"
                    placeholder="Ex: REG-2026-TO-098"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="text-xs h-10 px-5 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar: Máquinas
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-semibold h-10 px-6 rounded-xl shadow-xs"
              >
                Avançar: Finanças & RT
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* RT Step for templates WITH params (step 3) */}
        {currentStep === 3 && !isLimiteCredito && hasParamsStep && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-[#1B4D3E]" />
                  Passo 3: Responsável Técnico & Condições Financeiras
                </h3>
              </div>
              {stepRTPending.length === 0 ? (
                <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold flex items-center gap-1.5 self-start">
                  <Check className="h-3.5 w-3.5" /> RT Preenchido
                </span>
              ) : (
                <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 font-bold flex items-center gap-1.5 self-start">
                  <AlertTriangle className="h-3.5 w-3.5" /> {stepRTPending.length} Campo(s) Pendente(s)
                </span>
              )}
            </div>

            <TechnicalResponsibleForm
              customOptions={customOptions}
              setCustomOptions={setCustomOptions}
              pendingFields={stepRTPending}
            />

            <div className="pt-4 border-t border-gray-100 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="text-xs h-10 px-5 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-semibold h-10 px-6 rounded-xl shadow-xs"
              >
                Avançar: Revisão & Emissão
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* RT Step for templates WITHOUT params (step 2 directly) */}
        {currentStep === 2 && !isLimiteCredito && !hasParamsStep && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-[#1B4D3E]" />
                  Passo 2: Responsável Técnico & Condições Financeiras
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Informe os dados do profissional responsável técnico do projeto.
                </p>
              </div>
              {stepRTPending.length === 0 ? (
                <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold flex items-center gap-1.5 self-start">
                  <Check className="h-3.5 w-3.5" /> RT Preenchido
                </span>
              ) : (
                <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 font-bold flex items-center gap-1.5 self-start">
                  <AlertTriangle className="h-3.5 w-3.5" /> {stepRTPending.length} Campo(s) Pendente(s)
                </span>
              )}
            </div>

            <TechnicalResponsibleForm
              customOptions={customOptions}
              setCustomOptions={setCustomOptions}
              pendingFields={stepRTPending}
            />

            <div className="pt-4 border-t border-gray-100 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="text-xs h-10 px-5 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-semibold h-10 px-6 rounded-xl shadow-xs"
              >
                Avançar: Revisão & Emissão
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASSO 4: FINANÇAS & RESPONSÁVEL TÉCNICO (FULL-WIDTH)     */}
        {/* ======================================================== */}
        {currentStep === 4 && isLimiteCredito && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Coins className="h-5 w-5 text-[#1B4D3E]" />
                Passo 4: Capacidade de Pagamento & Responsável Técnico
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Informe as receitas brutas, custos operacionais e dívidas bancárias do proponente para o cálculo da margem líquida de endividamento.
              </p>
            </div>

            {/* Cartão de Indicador em Destaque */}
            <div className={cn(
              "p-5 rounded-2xl border space-y-2 transition-all shadow-2xs",
              netCapacity > 0 
                ? "bg-emerald-50/80 border-emerald-300 text-emerald-950" 
                : "bg-red-50/80 border-red-300 text-red-950"
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold uppercase tracking-wide opacity-90">
                  Capacidade de Pagamento Líquida Estimada (Anual):
                </span>
                <span className="text-xl font-extrabold tracking-tight">
                  R$ {netCapacity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-xs opacity-80 leading-relaxed">
                {netCapacity > 0 
                  ? "✓ Viabilidade Financeira Aprovada: Margem líquida positiva suficiente para amortização de novos financiamentos e limites."
                  : "⚠️ Atenção: As despesas operacionais e amortizações de dívidas superam a receita declarada."}
              </p>
            </div>

            {/* Linha 1: Finanças */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Receita Bruta Anual Total (R$)</Label>
                <Input
                  type="number"
                  value={customOptions.annualRevenue || ''}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, annualRevenue: Number(e.target.value) }))}
                  className="h-10 text-xs font-semibold"
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Despesas Operacionais Anuais (R$)</Label>
                <Input
                  type="number"
                  value={customOptions.annualExpenses || ''}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, annualExpenses: Number(e.target.value) }))}
                  className="h-10 text-xs font-semibold"
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Dívidas Preexistentes / SCR BACEN (R$/ano)</Label>
                <Input
                  type="number"
                  value={customOptions.existingDebts || ''}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, existingDebts: Number(e.target.value) }))}
                  className="h-10 text-xs font-semibold"
                  placeholder="0,00"
                />
              </div>
            </div>

            {/* Linha 2: Responsável Técnico */}
            <div className="p-5 bg-slate-50 border border-gray-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide block">
                Dados do Responsável Técnico do Projeto
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-700 font-medium">Nome do Responsável Técnico *</Label>
                  <Input
                    value={customOptions.responsibleName || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, responsibleName: e.target.value }))}
                    className={cn("h-10 text-xs bg-white", !customOptions.responsibleName?.trim() && "border-amber-400")}
                    placeholder="Nome do Responsável Técnico"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-700 font-medium">Nº do CREA / Região</Label>
                  <Input
                    value={customOptions.creaNumber || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, creaNumber: e.target.value }))}
                    className="h-10 text-xs bg-white"
                    placeholder="Ex: CREA/TO 12345-D"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-700 font-medium">Nº da ART / TRT</Label>
                  <Input
                    value={customOptions.artNumber || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, artNumber: e.target.value }))}
                    className="h-10 text-xs bg-white"
                    placeholder="Ex: ART 2026/0987654"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(3)}
                className="text-xs h-10 px-5 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar: Benfeitorias & Rebanho
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-semibold h-10 px-6 rounded-xl shadow-xs"
              >
                Avançar: Revisão & Emissão Oficial
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASSO 5: REVISÃO, PREVIEW OFICIAL & IMPRESSÃO            */}
        {/* ======================================================== */}
        {(currentStep === 5 || (currentStep === 4 && !isLimiteCredito && hasParamsStep) || (currentStep === 3 && !isLimiteCredito && !hasParamsStep)) && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#1B4D3E]" />
                  Conferência Final e Emissão do Documento Oficial
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Revise a Ficha Cadastral no modelo oficial do Banco do Brasil abaixo antes de imprimir ou gerar o arquivo PDF.
                </p>
              </div>

              {/* Action Bar (Top Right) */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenSaveModal}
                  disabled={isSavingDraft}
                  className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50 h-9 px-3 rounded-lg"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                  Salvar Dados
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadOriginalTemplate}
                  className="text-xs text-emerald-800 border-emerald-300 hover:bg-emerald-50 h-9 px-3 rounded-lg hidden sm:flex"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5 text-[#1B4D3E]" />
                  Modelo Base (.docx)
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrintIsolated}
                  className="text-xs text-gray-700 border-gray-300 hover:bg-gray-50 h-9 px-3 rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5 text-gray-600" />
                  Imprimir Página Limpa
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    if (!isFormValid) {
                      toast.error(`Atenção: ${validationErrors[0]}`)
                      return
                    }
                    setIsConfirmModalOpen(true)
                  }}
                  disabled={!isFormValid || isGeneratingPdf}
                  className={cn(
                    "text-xs font-bold h-9 px-4 rounded-lg flex items-center gap-2 shadow-xs transition-all",
                    isFormValid 
                      ? "bg-[#1B4D3E] hover:bg-[#13382D] text-white cursor-pointer" 
                      : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                  )}
                >
                  {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  {isGeneratingPdf ? 'Gerando PDF...' : 'Conferir e Emitir PDF Oficial'}
                </Button>
              </div>
            </div>

            {/* Resumo Patrimonial Consolidado */}
            {isLimiteCredito && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
                  <span className="text-[10.5px] text-gray-500 block">Terras (VTN)</span>
                  <strong className="text-xs text-gray-900">R$ {vtnEstimated.toLocaleString('pt-BR')}</strong>
                </div>
                <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
                  <span className="text-[10.5px] text-gray-500 block">Benfeitorias</span>
                  <strong className="text-xs text-gray-900">R$ {totalImprovements.toLocaleString('pt-BR')}</strong>
                </div>
                <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
                  <span className="text-[10.5px] text-gray-500 block">Máquinas</span>
                  <strong className="text-xs text-gray-900">R$ {totalMachinery.toLocaleString('pt-BR')}</strong>
                </div>
                <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
                  <span className="text-[10.5px] text-gray-500 block">Semoventes ({cattleHeads} cab)</span>
                  <strong className="text-xs text-gray-900">R$ {cattleEstimated.toLocaleString('pt-BR')}</strong>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl">
                  <span className="text-[10.5px] text-emerald-800 block font-semibold">Patrimônio Total</span>
                  <strong className="text-xs text-[#1B4D3E] font-extrabold">R$ {totalPatrimony.toLocaleString('pt-BR')}</strong>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-300 rounded-xl">
                  <span className="text-[10.5px] text-blue-800 block font-semibold">Capacidade Líquida</span>
                  <strong className="text-xs text-blue-900 font-extrabold">R$ {netCapacity.toLocaleString('pt-BR')}</strong>
                </div>
              </div>
            )}

            {/* Checklist de Conformidade */}
            {!isFormValid && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Atenção: Existem pendências cadastrais antes da emissão definitiva ({validationErrors.length})
                </div>
                <ul className="list-disc list-inside text-xs space-y-0.5 pl-2 opacity-90">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* ======================================================== */}
            {/* O PREVIEW OFICIAL A4: EXCLUSIVO NESTE ÚLTIMO PASSO       */}
            {/* ======================================================== */}
            <div className="bg-slate-100 p-4 sm:p-8 rounded-2xl border border-slate-200 overflow-x-auto flex flex-col items-center justify-start print:p-0 print:border-0 print:bg-white shadow-inner">
              <div className="text-xs text-gray-500 mb-3 font-medium flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-gray-400" />
                Pré-visualização Oficial A4 (Padrão Banco do Brasil / SICOR)
              </div>
              
              {documentData ? (
                <div className="w-full max-w-[820px] bg-white shadow-xl rounded-sm border border-gray-300 overflow-hidden print:shadow-none print:border-0 print:max-w-none print:w-full animate-in fade-in duration-200">
                  <div 
                    ref={contentRef}
                    id="printable-document"
                    style={{ 
                      width: '100%', 
                      backgroundColor: '#ffffff',
                      color: '#1f2937',
                      boxSizing: 'border-box'
                    }}
                  >
                    <A4DocumentPreview documentData={documentData} />
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-muted-foreground text-xs">
                  Selecione o produtor e a propriedade para gerar a pré-visualização.
                </div>
              )}
            </div>

            {/* Bottom Navigation */}
            <div className="pt-4 border-t border-gray-100 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(isLimiteCredito ? 4 : (hasParamsStep ? 3 : 2))}
                className="text-xs h-10 px-5 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar para Edição
              </Button>

              <Button
                type="button"
                onClick={handlePrintIsolated}
                className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-bold h-10 px-6 rounded-xl flex items-center gap-2 shadow-xs"
              >
                <Printer className="h-4 w-4" />
                Imprimir Documento Oficial
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
