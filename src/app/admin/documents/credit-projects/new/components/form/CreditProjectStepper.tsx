'use client'

import React, { useState, useMemo } from 'react'
import {
  MapPin,
  Tractor,
  Building2,
  Coins,
  ShieldCheck,
  Landmark
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { CustomOptions, PropertyData, ProducerData } from '../../types/wizard-types'
import { TemplateParamsForm } from './TemplateParamsForm'
import { CreditLineSelect } from './CreditLineSelect'
import { CreditStepperHeader } from './steps/CreditStepperHeader'
import { Step1CreditIdentification } from './steps/Step1CreditIdentification'
import { Step2CreditMachinery } from './steps/Step2CreditMachinery'
import { Step3CreditImprovements } from './steps/Step3CreditImprovements'
import { StepFinanceAndResponsible } from './steps/StepFinanceAndResponsible'
import { StepPreviewEmission } from './steps/StepPreviewEmission'
import { validateCPF } from '@/lib/utils/masks'

interface CreditProjectStepperProps {
  selectedTemplateCode: string
  setSelectedTemplateCode?: (code: string) => void
  operationalAxis?: 'custeio' | 'investimento'
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
  handleDownloadPdf: () => Promise<any>
  isGeneratingPdf: boolean
  isDeclarations?: boolean
  setIsUniversalPreviewOpen?: (open: boolean) => void
}

// Templates that have dedicated parameter forms in Step 2
const TEMPLATES_WITH_PARAMS = [
  'LIMITE_CREDITO_BB',
  'PROJETO_INOVAGRO',
  'PROJETO_RENOVAGRO',
  'PROJETO_CUSTEIO_SAFRA',
  'CHECKLIST_PROFISSIONAL'
]

// Mapping of pending field labels to DOM element IDs for smooth scroll and auto-focus
const PENDING_FIELD_MAP: Record<string, string> = {
  // Passo 1: Fundiário & Proponente
  'CPF do Representante Legal': 'field-representative-cpf',
  'CPF do Representante Legal (Válido)': 'field-representative-cpf',
  'CPF do Proponente Válido': 'field-producer-document',
  'Matrícula do Imóvel': 'field-property-registration',
  'Nº do CAR': 'field-property-car',
  'Área Total (ha)': 'field-property-total-area',
  'Atividade Principal': 'field-property-activity',
  'Roteiro de Acesso': 'field-property-access-route',

  // Passo 2: RenovAgro / Investimento
  'Sublinha do Programa': 'field-renovagro-subline',
  'Área a Recuperar': 'field-renovagro-area',
  'Investimento Total': 'field-renovagro-total',

  // Passo 2: InovAgro
  'Equipamento / Objeto': 'field-inovagro-equipment',

  // Passo 2: Custeio
  'Ano Safra': 'field-custeio-year',
  'Cultura / Atividade': 'field-custeio-crop',
  'Quantidade de Animais': 'field-custeio-qty',
  'Área de Plantio': 'field-custeio-qty',

  // RT & Condições Financeiras
  'Responsável Técnico': 'field-responsible-name',
  'Nº do CREA': 'field-crea-number',
  'Nº da ART/TRT': 'field-art-number',
  'Valor da Terra ou Receita': 'field-annual-revenue',
}

export function CreditProjectStepper({
  selectedTemplateCode,
  setSelectedTemplateCode,
  operationalAxis,
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
  isDeclarations = false,
  setIsUniversalPreviewOpen,
}: CreditProjectStepperProps) {
  const isLimiteCredito = selectedTemplateCode === 'LIMITE_CREDITO_BB'
  const [currentStep, setCurrentStep] = useState(1)
  const hasParamsStep = TEMPLATES_WITH_PARAMS.includes(selectedTemplateCode)
  const totalSteps = isLimiteCredito ? 5 : (hasParamsStep ? 4 : 3)

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
    const isLegal = [
      'AUTORIZACAO_COMPARTILHAMENTO',
      'AUTORIZACAO_SCR',
      'AUTORIZACAO_SICOR',
      'DECLARACAO_POSSE_MANSA',
      'DECLARACAO_REGULARIDADE_AMBIENTAL',
      'DECLARACAO_FORA_BIOMA',
      'ENQUADRAMENTO_CAF',
      'IDENTIFICACAO_ANIMAIS'
    ].includes(selectedTemplateCode)

    if (currentProducer?.type === 'PJ') {
      const repCpf = customOptions.representativeCpf || currentProducer.representativeCpf
      if (isLegal || selectedTemplateCode === 'ENQUADRAMENTO_CAF') {
        if (!repCpf?.trim() || !validateCPF(repCpf)) {
          p.push('CPF do Representante Legal')
        }
      } else if (customOptions.representativeCpf?.trim() && !validateCPF(customOptions.representativeCpf)) {
        p.push('CPF do Representante Legal (Válido)')
      }
    } else if (currentProducer?.type === 'PF') {
      if (!currentProducer.document?.trim() || !validateCPF(currentProducer.document)) {
        p.push('CPF do Proponente Válido')
      }
    }

    if (!customOptions.propertyRegistrationNumber?.trim()) p.push('Matrícula do Imóvel')
    if (!customOptions.propertyCar?.trim()) p.push('Nº do CAR')

    // Campos complementares exigidos exclusivamente para projetos técnicos de crédito (não para minutas/declarações legais)
    if (!isLegal) {
      if (!customOptions.propertyTotalArea || Number(customOptions.propertyTotalArea) <= 0) p.push('Área Total (ha)')
      if (!customOptions.propertyActivity?.trim()) p.push('Atividade Principal')
      if (!customOptions.propertyAccessRoute?.trim()) p.push('Roteiro de Acesso')
    }
    return p
  }, [customOptions, currentProducer, selectedTemplateCode])

  // Step 2 validation (Params) — only for non-LIMITE_CREDITO templates with params
  const step2Pending = useMemo(() => {
    if (isLimiteCredito) return []
    const p: string[] = []
    if (selectedTemplateCode === 'PROJETO_INOVAGRO') {
      if (!customOptions.inovagroEquipment?.trim()) p.push('Equipamento / Objeto')
      if (!customOptions.inovagroTotalInvestment || Number(customOptions.inovagroTotalInvestment) <= 0) p.push('Investimento Total')
    } else if (selectedTemplateCode === 'PROJETO_RENOVAGRO') {
      if (!customOptions.renovagroSubline?.trim()) p.push('Sublinha do Programa')
      if (!customOptions.renovagroAreaHa || Number(customOptions.renovagroAreaHa) <= 0) p.push('Área a Recuperar')
      if (customOptions.renovagroAreaHa && (!customOptions.renovagroTotalInvestment || Number(customOptions.renovagroTotalInvestment) <= 0)) {
        p.push('Investimento Total')
      }
    } else if (selectedTemplateCode === 'PROJETO_CUSTEIO_SAFRA') {
      if (!customOptions.custeioSafraYear?.trim()) p.push('Ano Safra')
      if (!customOptions.custeioCropName?.trim()) p.push('Cultura / Atividade')
      const isPec =
        customOptions.custeioActivityType === 'PECUARIA' ||
        customOptions.custeioCropName?.toLowerCase().includes('bovino') ||
        customOptions.custeioCropName?.toLowerCase().includes('pecu') ||
        customOptions.custeioCropName?.toLowerCase().includes('gado') ||
        customOptions.custeioCropName?.toLowerCase().includes('recria')
      const qty = isPec ? (customOptions.custeioQuantity || customOptions.custeioAreaHa) : customOptions.custeioAreaHa
      if (!qty || Number(qty) <= 0) p.push(isPec ? 'Quantidade de Animais' : 'Área de Plantio')
    }
    return p
  }, [customOptions, isLimiteCredito, selectedTemplateCode])

  const isCreaRequired = [
    'PROJETO_INOVAGRO',
    'PROJETO_RENOVAGRO',
    'PROJETO_CUSTEIO_SAFRA',
  ].includes(selectedTemplateCode)

  // RT / Finance validation  
  const stepRTPending = useMemo(() => {
    const p: string[] = []
    if (!customOptions.responsibleName?.trim()) p.push('Responsável Técnico')
    if (isCreaRequired) {
      if (!customOptions.creaNumber?.trim()) p.push('Nº do CREA')
      if (!customOptions.artNumber?.trim()) p.push('Nº da ART/TRT')
    }
    if (isLimiteCredito) {
      if (!customOptions.estimatedLandValuePerHa && !customOptions.improvementsValue && !customOptions.machineryValue && !customOptions.annualRevenue) {
        p.push('Valor da Terra ou Receita')
      }
    }
    return p
  }, [customOptions, isLimiteCredito, isCreaRequired])

  const focusAndScrollToField = (elementId: string) => {
    setTimeout(() => {
      const el = document.getElementById(elementId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.focus({ preventScroll: true })
      }
    }, 80)
  }

  const validateAndAdvance = (targetStep: number) => {
    // 1. Retorno para etapas anteriores é sempre permitido livremente
    if (targetStep <= currentStep) {
      setCurrentStep(targetStep)
      window.scrollTo({ top: 180, behavior: 'smooth' })
      return
    }

    // 2. Validação unificada para avanço de etapas (botão Avançar ou clique na aba)
    if (step1Pending.length > 0) {
      if (currentStep !== 1) setCurrentStep(1)
      toast.error(`Atenção: Preencha os campos obrigatórios do Passo 1: ${step1Pending.join(', ')}`)
      const first = step1Pending[0]
      focusAndScrollToField(PENDING_FIELD_MAP[first] || 'field-property-registration')
      return
    }

    if (hasParamsStep && targetStep > 2 && step2Pending.length > 0) {
      if (currentStep !== 2) setCurrentStep(2)
      toast.error(`Atenção: Preencha os campos obrigatórios do Passo 2 (Parâmetros): ${step2Pending.join(', ')}`)
      const first = step2Pending[0]
      focusAndScrollToField(PENDING_FIELD_MAP[first] || 'field-renovagro-area')
      return
    }

    if (targetStep === totalSteps && stepRTPending.length > 0) {
      const rtStep = isLimiteCredito ? 4 : (hasParamsStep ? 3 : 2)
      if (currentStep !== rtStep) setCurrentStep(rtStep)
      toast.error(`Atenção: Preencha os campos obrigatórios do Responsável Técnico: ${stepRTPending.join(', ')}`)
      const first = stepRTPending[0]
      focusAndScrollToField(PENDING_FIELD_MAP[first] || 'field-responsible-name')
      return
    }

    // Todas as validações aprovadas: avança
    setCurrentStep(targetStep)
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
      {/* STEPPER HEADER TABS */}
      <CreditStepperHeader
        currentTemplate={currentTemplate}
        currentStep={currentStep}
        totalSteps={totalSteps}
        isFormValid={isFormValid}
        validationErrors={validationErrors}
        stepsMeta={stepsMeta}
        onStepClick={validateAndAdvance}
        isLimiteCredito={isLimiteCredito}
        hasParamsStep={hasParamsStep}
      />

      {/* STEP CONTENT CONTAINER */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-2xs">

        {/* PASSO 1: DADOS FUNDIÁRIOS & ÁREAS */}
        {currentStep === 1 && (
          <Step1CreditIdentification
            customOptions={customOptions}
            setCustomOptions={setCustomOptions}
            step1Pending={step1Pending}
            onAdvance={() => validateAndAdvance(2)}
            isLimiteCredito={isLimiteCredito}
            hasParamsStep={hasParamsStep}
            currentProducer={currentProducer}
            selectedTemplateCode={selectedTemplateCode}
          />
        )}

        {/* PASSO 2: LIMITE DE CRÉDITO BB -> MÁQUINAS */}
        {currentStep === 2 && isLimiteCredito && (
          <Step2CreditMachinery
            customOptions={customOptions}
            setCustomOptions={setCustomOptions}
            onBack={() => setCurrentStep(1)}
            onAdvance={() => validateAndAdvance(3)}
          />
        )}

        {/* PASSO 2: DEMAIS TEMPLATES -> PARÂMETROS ESPECÍFICOS */}
        {currentStep === 2 && !isLimiteCredito && hasParamsStep && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-[#1B4D3E]" />
                  Passo 2: Parâmetros e Detalhes do Projeto Técnico
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure os dados técnicos, linhas de financiamento, equipamentos ou sublinhas específicas do modelo.
                </p>
              </div>
              {step2Pending.length === 0 ? (
                <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold self-start">
                  Parâmetros Configurados
                </span>
              ) : (
                <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 font-bold self-start">
                  {step2Pending.length} Campo(s) Obrigatório(s) Pendente(s)
                </span>
              )}
            </div>

            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80">
              <CreditLineSelect
                customOptions={customOptions}
                setCustomOptions={setCustomOptions}
                operationalAxis={operationalAxis}
                selectedTemplateCode={selectedTemplateCode}
                setSelectedTemplateCode={setSelectedTemplateCode}
              />
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
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar: Dados Fundiários
              </Button>
              <Button
                type="button"
                onClick={() => validateAndAdvance(3)}
                className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-semibold h-10 px-6 rounded-xl shadow-xs"
              >
                Avançar: Responsável Técnico & Condições
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* PASSO 3: LIMITE DE CRÉDITO BB -> BENFEITORIAS E REBANHO */}
        {currentStep === 3 && isLimiteCredito && (
          <Step3CreditImprovements
            customOptions={customOptions}
            setCustomOptions={setCustomOptions}
            onBack={() => setCurrentStep(2)}
            onAdvance={() => validateAndAdvance(4)}
            totalPatrimony={totalPatrimony}
          />
        )}

        {/* PASSO 3 (para templates com params) / PASSO 2 (para templates sem params) -> RESPONSÁVEL TÉCNICO */}
        {((currentStep === 3 && !isLimiteCredito && hasParamsStep) || (currentStep === 2 && !isLimiteCredito && !hasParamsStep)) && (
          <StepFinanceAndResponsible
            customOptions={customOptions}
            setCustomOptions={setCustomOptions}
            onBack={() => setCurrentStep(hasParamsStep ? 2 : 1)}
            onAdvance={() => validateAndAdvance(hasParamsStep ? 4 : 3)}
            isLimiteCredito={false}
            hasParamsStep={hasParamsStep}
            stepRTPending={stepRTPending}
            selectedTemplateCode={selectedTemplateCode}
            producerId={currentProducer?.id}
            propertyId={currentProperty?.id}
          />
        )}

        {/* PASSO 4: LIMITE DE CRÉDITO BB -> FINANÇAS & RT */}
        {currentStep === 4 && isLimiteCredito && (
          <StepFinanceAndResponsible
            customOptions={customOptions}
            setCustomOptions={setCustomOptions}
            onBack={() => setCurrentStep(3)}
            onAdvance={() => validateAndAdvance(5)}
            isLimiteCredito={true}
            hasParamsStep={true}
            stepRTPending={stepRTPending}
            selectedTemplateCode={selectedTemplateCode}
            producerId={currentProducer?.id}
            propertyId={currentProperty?.id}
          />
        )}

        {/* PASSO FINAL: REVISÃO, PREVIEW OFICIAL & IMPRESSÃO */}
        {(currentStep === 5 || (currentStep === 4 && !isLimiteCredito && hasParamsStep) || (currentStep === 3 && !isLimiteCredito && !hasParamsStep)) && (
          <StepPreviewEmission
            documentData={documentData}
            contentRef={contentRef}
            isLimiteCredito={isLimiteCredito}
            vtnEstimated={vtnEstimated}
            totalImprovements={totalImprovements}
            totalMachinery={totalMachinery}
            cattleHeads={cattleHeads}
            cattleEstimated={cattleEstimated}
            totalPatrimony={totalPatrimony}
            netCapacity={netCapacity}
            isFormValid={isFormValid}
            validationErrors={validationErrors}
            isGeneratingPdf={isGeneratingPdf}
            isSavingDraft={isSavingDraft}
            handleOpenSaveModal={handleOpenSaveModal}
            handleDownloadOriginalTemplate={handleDownloadOriginalTemplate}
            handlePrintIsolated={handlePrintIsolated}
            setIsConfirmModalOpen={setIsConfirmModalOpen}
            isDeclarations={isDeclarations}
            setIsUniversalPreviewOpen={setIsUniversalPreviewOpen}
            onBack={() => setCurrentStep(isLimiteCredito ? 4 : (hasParamsStep ? 3 : 2))}
          />
        )}

      </div>
    </div>
  )
}
