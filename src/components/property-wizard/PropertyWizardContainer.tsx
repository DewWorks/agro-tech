'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  PropertyWizardFormValues,
  STEP_NAMES,
  FIELD_LABELS_MAP,
  getStepForField,
  focusAndScrollToField,
} from '@/lib/validations/property-wizard'
import { createProperty, updateProperty } from '@/actions/properties'
import { saveCreditAnalysis } from '@/actions/credit-analysis'
import { WizardStepperHeader } from './WizardStepperHeader'
import { Step1Land } from './steps/Step1Land'
import { Step2Machinery } from './steps/Step2Machinery'
import { Step3ImprovementsHerd } from './steps/Step3ImprovementsHerd'
import { Step4FinancialSummary } from './steps/Step4FinancialSummary'
import { Step5ReviewDossier } from './steps/Step5ReviewDossier'
import { usePropertyWizardForm } from './hooks/usePropertyWizardForm'
import { useWizardNavigation } from './hooks/useWizardNavigation'

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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Hook isolado para gerenciamento do formulário RHF + Zod
  const { form } = usePropertyWizardForm({
    initialData,
    branches,
    producers,
    initialProducerId,
    initialBranchId,
    isEditMode,
  })

  // Hook isolado para navegação e Feature Flags
  const {
    currentStep,
    setCurrentStep,
    highestVisitedStep,
    handleNextStep,
    handlePrevStep,
    handleStepClick,
  } = useWizardNavigation({
    form,
    isEditMode,
    hasFinancialModule,
  })

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
        branchId: values.branchId || initialBranchId || branches[0]?.id || initialData?.branchId,
        producerId: values.producerId || initialProducerId || producers[0]?.id,
        ownershipType: values.ownershipType || 'PROPRIETARIO',
        propertyStatus: values.propertyStatus || 'QUITADA',
        explorationPercentage: values.explorationPercentage ?? 100,
        contractStartDate: values.contractStartDate || null,
        contractEndDate: values.contractEndDate || null,
        landlordName: values.landlordName || null,
        landlordDocument: values.landlordDocument || null,
        contractType: values.contractType || null,
        exploredAreaHa: values.exploredAreaHa ? Number(values.exploredAreaHa) : 0,

        // Áreas
        totalArea: Number(values.totalArea) || 0,
        consolidatedArea: Number(values.consolidatedArea) || 0,
        productiveArea: Number(values.productiveArea) || 0,
        pastureArea: Number(values.pastureArea) || 0,
        preserveArea: Number(values.preserveArea) || 0,
        ruralModules: Number(values.ruralModules) || 0,
        vtnPerHectare: Number(values.vtnPerHectare) || 0,
        vtnValuePerHa: Number(values.vtnPerHectare) || 0,
        totalLandValue:
          Math.round((Number(values.totalArea) || 0) * (Number(values.vtnPerHectare) || 0) * 100) / 100 ||
          Number(values.totalLandValue) ||
          0,
        totalVtnAmount:
          Math.round((Number(values.totalArea) || 0) * (Number(values.vtnPerHectare) || 0) * 100) / 100 ||
          Number(values.totalLandValue) ||
          0,

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
        possessionYears: Number(values.possessionYears) || 0,

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

        // Arrays dinâmicos filtrando linhas vazias e com coerção numérica estrita
        machineries: (values.machineries || [])
          .filter((m: any) => m && (m.model?.trim() || m.brand?.trim() || m.chassisSerial?.trim() || Number(m.value) > 0))
          .map((m: any) => ({
            ...m,
            year: m.year ? Number(m.year) : null,
            participationPercent: m.participationPercent ? Number(m.participationPercent) : 100,
            value: Number(m.value) || 0,
          })),
        improvements: (values.improvements || [])
          .filter((imp: any) => imp && (imp.specification?.trim() || Number(imp.quantity) > 0 || Number(imp.unitValue) > 0))
          .map((imp: any) => ({
            ...imp,
            quantity: Number(imp.quantity) || 0,
            unitValue: Number(imp.unitValue) || 0,
            totalValue: Math.round((Number(imp.quantity) || 0) * (Number(imp.unitValue) || 0) * 100) / 100,
            isArtificialPasture: Boolean(imp.isArtificialPasture || imp.specification === 'Pastagem Artificial'),
          })),
        livestocks: (values.livestocks || [])
          .filter((l: any) => l && (Number(l.quantity) > 0 || Number(l.unitValue) > 0 || (l.category && l.category !== 'Vaca')))
          .map((l: any) => ({
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
        effectiveAgroRevenue: Number(values.effectiveAgroRevenue) || 0,
        projectedAgroRevenue: Number(values.projectedAgroRevenue) || 0,
        otherRevenues: Number(values.otherRevenues) || 0,
        operationalExpenses: Number(values.operationalExpenses) || 0,
        existingDebtService: Number(values.existingDebtService) || 0,
        familyLivingCosts: Number(values.familyLivingCosts) || 0,
        creditLimitRequested: Number(values.creditLimitRequested) || 0,
        creditLimitPurpose: values.creditLimitPurpose || 'CUSTEIO_AGRICOLA',
        creditLimitTargetBank: values.creditLimitTargetBank || 'BANCO_DO_BRASIL',
        creditLimitTermMonths: Number(values.creditLimitTermMonths) || 12,
        creditLimitNotes: values.creditLimitNotes || '',

        // Parâmetros do Motor Financeiro
        creditLineCode: values.creditLineCode || 'PRONAMP_CUSTEIO',
        amortizationSystem: values.amortizationSystem || 'PRICE',
        interestRateAnnual: Number(values.interestRateAnnual) || 8.0,
        gracePeriodMonths: Number(values.gracePeriodMonths) || 0,
        urbanProperties: values.urbanProperties || [],
        vehicles: values.vehicles || [],
        customAgroRevenues: values.customAgroRevenues || [],
        customExpenses: values.customExpenses || [],
      }

      let res: any
      if (isEditMode && propertyId) {
        res = await updateProperty(propertyId, payload)
      } else {
        res = await createProperty(payload)
      }

      if (!res || res.error || res.success === false) {
        const errorMsg = typeof res?.error === 'string' ? res.error : 'Erro ao salvar propriedade.'

        // 1. Tratamento de pendências estruturadas retornadas pela Server Action
        if (res?.issues && Array.isArray(res.issues) && res.issues.length > 0) {
          res.issues.forEach((issue: { path: string; message: string }) => {
            form.setError(issue.path as any, {
              type: 'manual',
              message: issue.message,
            })
          })

          const firstIssue = res.issues[0]
          const targetStep = getStepForField(firstIssue.path)
          const fieldLabel = FIELD_LABELS_MAP[firstIssue.path] || firstIssue.path
          const stepName = STEP_NAMES[targetStep] || `Etapa ${targetStep}`

          if (targetStep !== currentStep) {
            setCurrentStep(targetStep)
          }

          toast.error(`Corrija os dados pendentes em ${stepName}: [${fieldLabel}] -> ${firstIssue.message}`)
          focusAndScrollToField(firstIssue.path)
        } else {
          // 2. Extração caso o erro venha formatado como "[Campo: nome] -> mensagem"
          const match = errorMsg.match(/\[Campo:\s*([a-zA-Z0-9_.]+)\]\s*->\s*(.*)/)
          if (match) {
            const fieldPath = match[1]
            const msg = match[2]
            form.setError(fieldPath as any, { type: 'manual', message: msg })
            const targetStep = getStepForField(fieldPath)
            const fieldLabel = FIELD_LABELS_MAP[fieldPath] || fieldPath
            const stepName = STEP_NAMES[targetStep] || `Etapa ${targetStep}`

            if (targetStep !== currentStep) {
              setCurrentStep(targetStep)
            }
            toast.error(`Corrija os dados pendentes em ${stepName}: [${fieldLabel}] -> ${msg}`)
            focusAndScrollToField(fieldPath)
          } else {
            toast.error(errorMsg)
          }
        }

        return { success: false, error: errorMsg }
      }

      // Sincronização atômica da Análise de Crédito no Banco de Dados
      if (
        values.producerId &&
        (Number(values.creditLimitRequested) > 0 ||
          Number(values.effectiveAgroRevenue) > 0 ||
          Number(values.projectedAgroRevenue) > 0)
      ) {
        try {
          const landVal =
            values.totalArea && values.vtnPerHectare
              ? Number(values.totalArea) * Number(values.vtnPerHectare)
              : 0
          const impVal = (values.improvements || []).reduce(
            (sum: number, i: any) => sum + (Number(i.quantity) || 0) * (Number(i.unitValue) || 0),
            0
          )
          const machVal = (values.machineries || []).reduce(
            (sum: number, m: any) => sum + (Number(m.value) || 0),
            0
          )
          const liveVal = (values.livestocks || []).reduce(
            (sum: number, l: any) => sum + (Number(l.quantity) || 0) * (Number(l.unitValue) || 0),
            0
          )

          await saveCreditAnalysis({
            producerId: values.producerId,
            propertyId: res?.data?.id || propertyId,
            branchId: values.branchId || undefined,
            creditLineCode: values.creditLineCode || undefined,
            requestedAmount: Number(values.creditLimitRequested) || 0,
            amortizationSystem: values.amortizationSystem as any,
            totalTermMonths: Number(values.creditLimitTermMonths) || 12,
            gracePeriodMonths: Number(values.gracePeriodMonths) || 0,
            interestRateAnnual: Number(values.interestRateAnnual) || 8.0,
            effectiveAgroRevenue: Number(values.effectiveAgroRevenue) || 0,
            projectedAgroRevenue: Number(values.projectedAgroRevenue) || 0,
            nonAgroRevenue: Number(values.otherRevenues) || 0,
            productionCosts: Number(values.operationalExpenses) || 0,
            familyLivingExpenses: Number(values.familyLivingCosts) || 0,
            existingDebtService: Number(values.existingDebtService) || 0,
            landValue: landVal,
            improvementsValue: impVal,
            machineryValue: machVal,
            livestockValue: liveVal,
            creditLimitPurpose: values.creditLimitPurpose || undefined,
            creditLimitTargetBank: values.creditLimitTargetBank || undefined,
            urbanProperties: values.urbanProperties as any,
            vehicles: values.vehicles as any,
            customAgroRevenues: values.customAgroRevenues as any,
            customExpenses: values.customExpenses as any,
          })
        } catch (caErr) {
          console.error('[PropertyWizardContainer] Erro na sincronização com CreditAnalysis:', caErr)
        }
      }

      toast.success(
        isEditMode
          ? 'Alterações salvas com sucesso!'
          : 'Propriedade e Dossiê cadastrados com sucesso!'
      )

      const savedId = res?.data?.id || propertyId

      if (stayOnPage) {
        router.refresh()
      } else {
        router.push('/admin/crm/properties')
        router.refresh()
      }

      return { success: true, id: savedId }
    } catch (err: any) {
      console.error(err)
      toast.error('Erro inesperado ao salvar. Verifique sua conexão.')
      return { success: false, error: err?.message || 'Erro inesperado' }
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
        form.setError('name', { type: 'manual', message: 'O nome da fazenda é obrigatório.' })
        if (currentStep !== 1) setCurrentStep(1)
        focusAndScrollToField('name')
        return
      }

      await executeSave(values, true)
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao salvar alterações.')
    }
  }

  // Handler rápido para salvar dados atuais e navegar diretamente para o Simulador de Crédito
  const handleSaveAndGoToCreditLimit = async () => {
    try {
      const values = form.getValues()
      if (!values.name || values.name.trim().length < 2) {
        toast.error('O nome da fazenda é obrigatório (mínimo 2 caracteres).')
        form.setError('name', { type: 'manual', message: 'O nome da fazenda é obrigatório.' })
        if (currentStep !== 1) setCurrentStep(1)
        focusAndScrollToField('name')
        return
      }

      const saveResult = await executeSave(values, true)

      // TRAVA RÍGIDA DE NAVEGAÇÃO:
      // Se não houver sucesso comprovado (result.success !== true), a navegação é estritamente bloqueada!
      if (!saveResult || !saveResult.success) {
        console.warn('[PropertyWizardContainer] Navegação abortada: operação de salvamento falhou ou foi rejeitada.', saveResult)
        return
      }

      const targetId = saveResult.id || propertyId || initialData?.id
      if (targetId) {
        router.push(`/admin/credit-limit?propertyId=${targetId}&tab=simulator`)
      } else {
        router.push(`/admin/credit-limit?tab=simulator`)
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao salvar dados para simulação.')
    }
  }

  const onFormError = (errors: any) => {
    console.error('Validation errors:', errors)
    const errorKeys = Object.keys(errors)
    if (errorKeys.length > 0) {
      const firstField = errorKeys[0]
      const firstError = errors[firstField]
      const targetStep = getStepForField(firstField)
      const fieldLabel = FIELD_LABELS_MAP[firstField] || firstField
      const stepName = STEP_NAMES[targetStep] || `Etapa ${targetStep}`
      const msg = firstError?.message || `Campo com pendência: ${fieldLabel}`

      if (targetStep !== currentStep) {
        setCurrentStep(targetStep)
      }

      toast.error(`Corrija os dados pendentes em ${stepName}: [${fieldLabel}] -> ${msg}`)
      focusAndScrollToField(firstField)
    }
  }

  // Submissão Final Unificada (Acionada no Step 5)
  const onFinalSubmit = async (values: PropertyWizardFormValues) => {
    await executeSave(values, false)
  }

  const selectedProducer = producers.find((p) => p.id === form.watch('producerId'))
  const selectedBranch = branches.find((b) => b.id === form.watch('branchId'))

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-20">
      {/* Barra de Navegação Superior */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 print:hidden">
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
      <div className="print:hidden">
        <WizardStepperHeader
          currentStep={currentStep}
          onStepClick={handleStepClick}
          highestVisitedStep={highestVisitedStep}
          isEditMode={isEditMode}
          hasFinancialModule={hasFinancialModule}
          isFinancialModuleDisabledForOrg={isFinancialModuleDisabledForOrg}
        />
      </div>

      {/* Formulário Principal com Contexto RHF */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFinalSubmit, onFormError)} className="space-y-6">
          {/* RENDERIZAÇÃO CONDICIONAL DO PASSO ATIVO */}
          {currentStep === 1 && (
            <Step1Land form={form} producers={producers} branches={branches} />
          )}

          {currentStep === 2 && <Step2Machinery form={form} />}

          {currentStep === 3 && <Step3ImprovementsHerd form={form} />}

          {hasFinancialModule && currentStep === 4 && (
            <Step4FinancialSummary
              form={form}
              isFinancialModuleDisabledForOrg={isFinancialModuleDisabledForOrg}
              propertyId={propertyId || (initialData?.id as string)}
              onSaveAndSimulate={handleSaveAndGoToCreditLimit}
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

          {/* BARRA DE NAVEGAÇÃO INFERIOR DO WIZARD */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between mt-8 print:hidden">
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
                Passo {currentStep === 5 && !hasFinancialModule ? 4 : currentStep} de{' '}
                {hasFinancialModule ? 5 : 4}
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
