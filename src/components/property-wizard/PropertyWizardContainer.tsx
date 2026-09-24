'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  ChevronLeft,
  ChevronRight,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import {
  propertyWizardSchema,
  PropertyWizardFormValues,
  STEP_FIELDS_MAP,
  defaultPropertyWizardValues,
} from '@/lib/validations/property-wizard'
import { createProperty, updateProperty } from '@/actions/properties'
import { denormalizeCategoryBB, denormalizePurposeBB } from '@/lib/validations/livestock-mapper'
import { WizardStepperHeader } from './WizardStepperHeader'
import { Step1Land } from './steps/Step1Land'
import { Step2Machinery } from './steps/Step2Machinery'
import { Step3ImprovementsHerd } from './steps/Step3ImprovementsHerd'
import { Step4FinancialSummary } from './steps/Step4FinancialSummary'
import { Step5ReviewDossier } from './steps/Step5ReviewDossier'
import { toDMS } from './subcomponents/FarmMapModal'

interface PropertyWizardContainerProps {
  initialData?: any
  branches: Array<{ id: string; name: string }>
  producers: Array<{ id: string; name: string; document?: string; branchId?: string }>
  initialProducerId?: string
  initialBranchId?: string
  isEditMode?: boolean
  propertyId?: string
  hasFinancialModule?: boolean
  isFinancialModuleDisabledForOrg?: boolean
}

export function PropertyWizardContainer({
  initialData,
  branches,
  producers,
  initialProducerId,
  initialBranchId,
  isEditMode = false,
  propertyId,
  hasFinancialModule = false,
  isFinancialModuleDisabledForOrg = false,
}: PropertyWizardContainerProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [highestVisitedStep, setHighestVisitedStep] = useState<number>(isEditMode ? 5 : 1)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Mapeamento dos valores iniciais se estiver em modo de edição ou com pré-seleção
  const mappedInitialValues: Partial<PropertyWizardFormValues> = React.useMemo(() => {
    if (!initialData) {
      const selectedProducer = initialProducerId
        ? producers.find((p) => p.id === initialProducerId)
        : producers.length === 1
        ? producers[0]
        : null

      const defaultBranchId =
        initialBranchId ||
        selectedProducer?.branchId ||
        branches[0]?.id ||
        ''

      return {
        ...defaultPropertyWizardValues,
        branchId: defaultBranchId,
        producerId: selectedProducer?.id || '',
      }
    }

    const primaryProducer =
      initialData.producers && initialData.producers.length > 0
        ? initialData.producers[0]
        : null

    return {
      ...defaultPropertyWizardValues,
      name: initialData.name || initialData.propertyName || '',
      branchId: initialData.branchId || branches[0]?.id || '',
      producerId: primaryProducer?.producerId || initialData.producerId || producers[0]?.id || '',
      ownershipType: primaryProducer?.ownershipType || initialData.ownershipType || 'PROPRIETARIO',
      propertyStatus: initialData.propertyStatus || initialData.financialStatus || 'QUITADA',
      explorationPercentage: primaryProducer?.explorationPercentage ?? 100,
      contractStartDate: primaryProducer?.contractStartDate
        ? new Date(primaryProducer.contractStartDate).toISOString().split('T')[0]
        : '',
      contractEndDate: primaryProducer?.contractEndDate
        ? new Date(primaryProducer.contractEndDate).toISOString().split('T')[0]
        : '',
      landlordName: primaryProducer?.landlordName || '',
      landlordDocument: primaryProducer?.landlordDocument || '',
      contractType: primaryProducer?.contractType || 'ARRENDAMENTO',
      exploredAreaHa: Number(primaryProducer?.exploredAreaHa) || 0,
      registrationNumber: initialData.registrationNumber || '',
      registryOffice: initialData.registryOffice || '',
      comarca: initialData.comarca || '',
      car: initialData.car || '',
      ccir: initialData.ccir || '',
      itr: initialData.itr || '',
      explorationActivity: initialData.explorationActivity || 'Pecuária de Cria',
      possessionYears: initialData.possessionData?.possessionYears || 0,
      totalArea: Number(initialData.totalArea) || 0,
      consolidatedArea: Number(initialData.consolidatedArea) || 0,
      productiveArea: Number(initialData.productiveArea) || 0,
      pastureArea: Number(initialData.pastureArea) || 0,
      preserveArea: Number(initialData.preserveArea) || 0,
      ruralModules: Number(initialData.ruralModules) || 0,
      vtnPerHectare: Number(initialData.vtnValuePerHa ?? initialData.vtnPerHectare ?? initialData.possessionData?.vtnPerHectare ?? initialData.improvements?.estimatedLandValuePerHa) || 0,
      totalLandValue: Number(initialData.totalVtnAmount ?? initialData.totalLandValue ?? initialData.possessionData?.totalLandValue) || 0,
      city: initialData.city || '',
      state: initialData.state || 'TO',
      latitude:
        initialData.latitude !== undefined && initialData.latitude !== null && initialData.latitude !== ''
          ? typeof initialData.latitude === 'number'
            ? toDMS(initialData.latitude, true)
            : String(initialData.latitude)
          : '',
      longitude:
        initialData.longitude !== undefined && initialData.longitude !== null && initialData.longitude !== ''
          ? typeof initialData.longitude === 'number'
            ? toDMS(initialData.longitude, false)
            : String(initialData.longitude)
          : '',
      accessRoute: initialData.accessRoute || '',
      confrontantNorth: initialData.confrontantNorth || initialData.confrontants?.norte || initialData.confrontants?.north || '',
      confrontantSouth: initialData.confrontantSouth || initialData.confrontants?.sul || initialData.confrontants?.south || '',
      confrontantEast: initialData.confrontantEast || initialData.confrontants?.leste || initialData.confrontants?.east || '',
      confrontantWest: initialData.confrontantWest || initialData.confrontants?.oeste || initialData.confrontants?.west || '',
      impenhorabilidade: initialData.seizureStatus || 'PENHORAVEL',
      hasLien: Boolean(initialData.hasLien),
      hasInsurance: Boolean(initialData.hasInsurance),
      isBorderProperty: Boolean(initialData.isBorderProperty),
      conservationState: initialData.conservationState || 'BOM',

      // Arrays relacionais
      machineries: initialData.machineries?.map((m: any) => ({
        id: m.id,
        category: m.specification || 'Trator de Pneus',
        brand: m.brand || '',
        model: m.model || '',
        year: m.year || new Date().getFullYear(),
        powerCapacity: m.powerCapacity || '',
        chassisSerial: m.chassisSerial || '',
        participationPercent: m.participationPercent ?? 100,
        value: Number(m.value) || 0,
        hasLien: Boolean(m.hasLien),
        lienInstitution: m.lienInstitution || '',
      })) || [],

      improvements: initialData.improvementsList?.map((imp: any) => ({
        id: imp.id,
        specification: imp.specification || '',
        unit: imp.unit || (imp.isArtificialPasture ? 'ha' : 'm²'),
        quantity: Number(imp.quantity) || 0,
        unitValue: Number(imp.unitValue) || 0,
        totalValue: (Number(imp.quantity) || 0) * (Number(imp.unitValue) || 0),
        conservationState: 'BOM',
        observation: imp.observation || '',
        isArtificialPasture: Boolean(imp.isArtificialPasture || imp.specification === 'Pastagem Artificial'),
      })) || [],

      livestocks: (initialData.livestockList || initialData.livestocks)?.map((l: any) => {
        const cat = denormalizeCategoryBB(l.categoryBB || l.category)
        const pur = denormalizePurposeBB(l.purposeBB || l.purpose)
        return {
          id: l.id,
          species: l.species || 'BOVINO',
          category: cat,
          categoryBB: cat,
          purpose: pur,
          purposeBB: pur,
          breed: l.breed || 'Nelore',
          geneticGrade: '1/2 Sangue',
          quantity: Number(l.quantity) || 0,
          ageMonths: Number(l.ageMonths) || 0,
          avgWeightKg: Number(l.avgWeightKg) || 0,
          unitValue: Number(l.unitValue) || 0,
          totalValue: (Number(l.quantity) || 0) * (Number(l.unitValue) || 0),
          markingType: l.brandingType || l.markingType || 'Ferro Quente',
          markingLocation: l.brandingLocation || l.markingLocation || 'Perna Traseira Direita',
        }
      }) || [],

      // Dados Financeiros e Base de Limite de Crédito
      effectiveAgroRevenue: Number(initialData.possessionData?.effectiveAgroRevenue) || 0,
      projectedAgroRevenue: Number(initialData.possessionData?.projectedAgroRevenue) || 0,
      otherRevenues: Number(initialData.possessionData?.otherRevenues) || 0,
      operationalExpenses: Number(initialData.possessionData?.operationalExpenses) || 0,
      existingDebtService: Number(initialData.possessionData?.existingDebtService) || 0,
      familyLivingCosts: Number(initialData.possessionData?.familyLivingCosts) || 0,
      creditLimitRequested: Number(initialData.possessionData?.creditLimitRequested) || 0,
      creditLimitPurpose: initialData.possessionData?.creditLimitPurpose || 'CUSTEIO_AGRICOLA',
      creditLimitTargetBank: initialData.possessionData?.creditLimitTargetBank || 'BANCO_DO_BRASIL',
      creditLimitTermMonths: Number(initialData.possessionData?.creditLimitTermMonths) || 12,
      creditLimitNotes: initialData.possessionData?.creditLimitNotes || '',
    }
  }, [initialData, branches, producers, initialProducerId, initialBranchId])

  // Inicialização do React Hook Form com Zod Resolver
  const form = useForm<PropertyWizardFormValues>({
    resolver: zodResolver(propertyWizardSchema) as any,
    defaultValues: mappedInitialValues as PropertyWizardFormValues,
    mode: 'onBlur',
  })

  const scrollToTop = () => {
    const mainEl = document.querySelector('main')
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Validação Parcial (Partial Triggering) para Avançar
  const handleNextStep = async () => {
    if (!isEditMode) {
      const fieldsToValidate = STEP_FIELDS_MAP[currentStep] || []
      if (fieldsToValidate.length > 0) {
        const isStepValid = await form.trigger(fieldsToValidate)
        if (!isStepValid) {
          toast.error('Por favor, preencha os campos obrigatórios destacados em vermelho.')
          return
        }
      }
    }

    let next = Math.min(currentStep + 1, 5)
    if (!hasFinancialModule && next === 4) {
      next = 5
    }
    setCurrentStep(next)
    setHighestVisitedStep((prev) => Math.max(prev, next))
    scrollToTop()
  }

  const handlePrevStep = () => {
    let prevStep = Math.max(currentStep - 1, 1)
    if (!hasFinancialModule && prevStep === 4) {
      prevStep = 3
    }
    setCurrentStep(prevStep)
    scrollToTop()
  }

  const handleStepClick = async (targetStep: number) => {
    if (!hasFinancialModule && targetStep === 4) {
      return
    }

    if (isEditMode || targetStep <= currentStep) {
      setCurrentStep(targetStep)
      setHighestVisitedStep((prev) => Math.max(prev, targetStep))
      scrollToTop()
      return
    }

    // Se estiver em modo de criação pulando para a frente, valida o passo atual antes
    const fieldsToValidate = STEP_FIELDS_MAP[currentStep] || []
    if (fieldsToValidate.length > 0) {
      const isStepValid = await form.trigger(fieldsToValidate)
      if (!isStepValid) {
        toast.error('Preencha os campos obrigatórios antes de avançar.')
        return
      }
    }

    setCurrentStep(targetStep)
    setHighestVisitedStep((prev) => Math.max(prev, targetStep))
    scrollToTop()
  }

  // Salvamento unificado no banco (Parcial ao salvar no passo, ou Final no passo 5)
  const executeSave = async (
    values: PropertyWizardFormValues,
    stayOnPage = false
  ) => {
    try {
      setIsSubmitting(true)

      const payload = {
        name: values.name,
        propertyName: values.name,
        branchId: values.branchId || branches[0]?.id || initialData?.branchId,
        producerId: values.producerId || producers[0]?.id,
        ownershipType: values.ownershipType || 'PROPRIETARIO',
        propertyStatus: values.propertyStatus || 'QUITADA',
        explorationPercentage: values.explorationPercentage ?? 100,
        contractStartDate: values.contractStartDate || null,
        contractEndDate: values.contractEndDate || null,
        landlordName: values.landlordName || null,
        landlordDocument: values.landlordDocument || null,
        contractType: values.contractType || null,
        exploredAreaHa: values.exploredAreaHa ? Number(values.exploredAreaHa) : null,

        // Áreas
        totalArea: values.totalArea ?? 0,
        consolidatedArea: values.consolidatedArea ?? 0,
        productiveArea: values.productiveArea ?? 0,
        pastureArea: values.pastureArea ?? 0,
        preserveArea: values.preserveArea ?? 0,
        ruralModules: values.ruralModules ?? 0,
        vtnPerHectare: values.vtnPerHectare ?? 0,
        vtnValuePerHa: values.vtnPerHectare ?? 0,
        totalLandValue: Math.round((Number(values.totalArea) || 0) * (Number(values.vtnPerHectare) || 0) * 100) / 100 || values.totalLandValue || 0,
        totalVtnAmount: Math.round((Number(values.totalArea) || 0) * (Number(values.vtnPerHectare) || 0) * 100) / 100 || values.totalLandValue || 0,

        // Registros
        registrationNumber: values.registrationNumber || '',
        registryOffice: values.registryOffice || '',
        comarca: values.comarca || '',
        car: values.car || '',
        ccir: values.ccir || '',
        itr: values.itr || '',

        // Localização e Posse
        city: values.city || '',
        state: values.state || 'TO',
        latitude: values.latitude || '',
        longitude: values.longitude || '',
        accessRoute: values.accessRoute || '',
        explorationActivity: values.explorationActivity || 'Pecuária de Cria',
        possessionYears: values.possessionYears ?? 0,

        // Indicadores
        impenhorabilidade: values.impenhorabilidade || 'PENHORAVEL',
        hasLien: Boolean(values.hasLien),
        hasInsurance: Boolean(values.hasInsurance),
        isBorderProperty: Boolean(values.isBorderProperty),
        conservationState: values.conservationState || 'BOM',

        // Confrontantes
        confrontantNorth: values.confrontantNorth || '',
        confrontantSouth: values.confrontantSouth || '',
        confrontantEast: values.confrontantEast || '',
        confrontantWest: values.confrontantWest || '',
        confrontants: {
          norte: values.confrontantNorth || '',
          sul: values.confrontantSouth || '',
          leste: values.confrontantEast || '',
          oeste: values.confrontantWest || '',
        },

        // Arrays dinâmicos com coerção numérica estrita
        machineries: (values.machineries || []).map((m: any) => ({
          ...m,
          year: m.year ? Number(m.year) : null,
          participationPercent: m.participationPercent ? Number(m.participationPercent) : 100,
          value: Number(m.value) || 0,
        })),
        improvements: (values.improvements || []).map((imp: any) => ({
          ...imp,
          quantity: Number(imp.quantity) || 0,
          unitValue: Number(imp.unitValue) || 0,
          totalValue: Math.round((Number(imp.quantity) || 0) * (Number(imp.unitValue) || 0) * 100) / 100,
          isArtificialPasture: Boolean(imp.isArtificialPasture || imp.specification === 'Pastagem Artificial'),
        })),
        livestocks: (values.livestocks || []).map((l: any) => ({
          ...l,
          category: l.category || l.categoryBB || 'Vaca',
          categoryBB: l.categoryBB || l.category || 'Vaca',
          purpose: l.purpose || l.purposeBB || 'Produção de Crias',
          purposeBB: l.purposeBB || l.purpose || 'Produção de Crias',
          quantity: Number(l.quantity) || 0,
          ageMonths: Number(l.ageMonths) || 0,
          avgWeightKg: Number(l.avgWeightKg) || 0,
          unitValue: Number(l.unitValue) || 0,
          totalValue: Math.round((Number(l.quantity) || 0) * (Number(l.unitValue) || 0) * 100) / 100,
          brandingType: l.markingType || l.brandingType || 'Ferro Quente',
          brandingLocation: l.markingLocation || l.brandingLocation || 'Perna Traseira Direita',
        })),

        // Financeiro & Base de Limite de Crédito
        effectiveAgroRevenue: values.effectiveAgroRevenue ?? 0,
        projectedAgroRevenue: values.projectedAgroRevenue ?? 0,
        otherRevenues: values.otherRevenues ?? 0,
        operationalExpenses: values.operationalExpenses ?? 0,
        existingDebtService: values.existingDebtService ?? 0,
        familyLivingCosts: values.familyLivingCosts ?? 0,
        creditLimitRequested: values.creditLimitRequested ?? 0,
        creditLimitPurpose: values.creditLimitPurpose || 'CUSTEIO_AGRICOLA',
        creditLimitTargetBank: values.creditLimitTargetBank || 'BANCO_DO_BRASIL',
        creditLimitTermMonths: values.creditLimitTermMonths ?? 12,
        creditLimitNotes: values.creditLimitNotes || '',
      }

      let res
      if (isEditMode && propertyId) {
        res = await updateProperty(propertyId, payload)
      } else {
        res = await createProperty(payload)
      }

      if (res?.error) {
        toast.error(typeof res.error === 'string' ? res.error : 'Erro ao salvar propriedade.')
        return
      }

      toast.success(
        isEditMode
          ? 'Alterações salvas com sucesso!'
          : 'Propriedade e Dossiê cadastrados com sucesso!'
      )

      if (stayOnPage) {
        router.refresh()
      } else {
        router.push('/admin/crm/properties')
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Erro inesperado ao salvar. Verifique sua conexão.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handler rápido para salvar dados atuais sem validação bloqueante de passos futuros
  const handleSaveCurrent = async () => {
    try {
      const values = form.getValues()

      if (!values.name || values.name.trim().length < 2) {
        toast.error('O nome da fazenda é obrigatório (mínimo 2 caracteres).')
        return
      }

      await executeSave(values, true)
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao salvar alterações.')
    }
  }

  const onFormError = (errors: any) => {
    console.error('Validation errors:', errors)
    const errorKeys = Object.keys(errors)
    if (errorKeys.length > 0) {
      const firstError = errors[errorKeys[0]]
      const msg = firstError?.message || `Existem campos com pendências: ${errorKeys.join(', ')}`
      toast.error(msg)
    }
  }

  // Submissão Final Unificada (Acionada no Step 5)
  const onFinalSubmit = async (values: PropertyWizardFormValues) => {
    await executeSave(values, false)
  }

  const selectedProducer = producers.find(
    (p) => p.id === form.watch('producerId')
  )
  const selectedBranch = branches.find(
    (b) => b.id === form.watch('branchId')
  )

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-20">
      {/* Barra de Navegação Superior */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/crm/properties"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isEditMode ? 'Editar Levantamento Patrimonial' : 'Novo Cadastro Patrimonial (Wizard)'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Padrão Operacional Bancário: Banco do Brasil (SICOR) e Sicredi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditMode && (
            <Button
              type="button"
              onClick={handleSaveCurrent}
              disabled={isSubmitting}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs h-9 px-3.5 shadow-xs cursor-pointer flex items-center gap-1.5 mr-1"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Salvar Alterações
            </Button>
          )}

          {currentStep < 5 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 shadow-xs cursor-pointer flex items-center gap-1"
            >
              Avançar
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={form.handleSubmit(onFinalSubmit, onFormError)}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 shadow-xs cursor-pointer flex items-center gap-1"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Concluir
            </Button>
          )}

          <span className="text-xs text-slate-500 font-medium hidden sm:inline ml-1">
            Estado:
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {isEditMode ? 'Edição Cadastral' : 'Em Preenchimento'}
          </span>
        </div>
      </div>

      {/* Header Stepper */}
      <WizardStepperHeader
        currentStep={currentStep}
        onStepClick={handleStepClick}
        highestVisitedStep={highestVisitedStep}
        isEditMode={isEditMode}
        hasFinancialModule={hasFinancialModule}
        isFinancialModuleDisabledForOrg={isFinancialModuleDisabledForOrg}
      />

      {/* Formulário Principal com Contexto RHF */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFinalSubmit, onFormError)} className="space-y-6">
          {/* RENDERIZAÇÃO CONDICIONAL DO PASSO ATIVO */}
          {currentStep === 1 && (
            <Step1Land
              form={form}
              producers={producers}
              branches={branches}
            />
          )}

          {currentStep === 2 && <Step2Machinery form={form} />}

          {currentStep === 3 && <Step3ImprovementsHerd form={form} />}

          {hasFinancialModule && currentStep === 4 && (
            <Step4FinancialSummary 
              form={form} 
              isFinancialModuleDisabledForOrg={isFinancialModuleDisabledForOrg}
            />
          )}

          {currentStep === 5 && (
            <Step5ReviewDossier
              form={form}
              producerName={selectedProducer?.name}
              selectedProducer={selectedProducer}
              branchName={selectedBranch?.name}
              isSubmitting={isSubmitting}
              onSubmit={form.handleSubmit(onFinalSubmit, onFormError)}
              hasFinancialModule={hasFinancialModule}
              isFinancialModuleDisabledForOrg={isFinancialModuleDisabledForOrg}
            />
          )}

          {/* BARRA DE NAVEGAÇÃO INFERIOR DO WIZARD (FLUXO NATURAL - NÃO COBRE OS CAMPOS AO ROLAR) */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between mt-8">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="text-xs sm:text-sm font-medium h-10 px-4 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 mr-1.5" />
                  Voltar Etapa
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden md:inline mr-2">
                Passo {currentStep === 5 && !hasFinancialModule ? 4 : currentStep} de {hasFinancialModule ? 5 : 4}
              </span>

              {isEditMode && currentStep < 5 && (
                <Button
                  type="button"
                  onClick={handleSaveCurrent}
                  disabled={isSubmitting}
                  variant="outline"
                  className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold text-xs sm:text-sm h-10 px-4 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar Alterações
                </Button>
              )}

              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm h-10 px-6 shadow-xs cursor-pointer"
                >
                  Avançar Etapa
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm h-10 px-6 shadow-md cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Concluir e Salvar no CRM
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
