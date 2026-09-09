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
  producers: Array<{ id: string; name: string; document?: string }>
  isEditMode?: boolean
  propertyId?: string
}

export function PropertyWizardContainer({
  initialData,
  branches,
  producers,
  isEditMode = false,
  propertyId,
}: PropertyWizardContainerProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [highestVisitedStep, setHighestVisitedStep] = useState<number>(isEditMode ? 5 : 1)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Mapeamento dos valores iniciais se estiver em modo de edição
  const mappedInitialValues: Partial<PropertyWizardFormValues> = React.useMemo(() => {
    if (!initialData) return defaultPropertyWizardValues

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
      explorationPercentage: primaryProducer?.explorationPercentage ?? 100,
      contractEndDate: primaryProducer?.contractEndDate
        ? new Date(primaryProducer.contractEndDate).toISOString().split('T')[0]
        : '',
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
      vtnPerHectare: Number(initialData.vtnPerHectare) || 0,
      totalLandValue: Number(initialData.totalLandValue) || 0,
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
      confrontantNorth: initialData.confrontants?.norte || '',
      confrontantSouth: initialData.confrontants?.sul || '',
      confrontantEast: initialData.confrontants?.leste || '',
      confrontantWest: initialData.confrontants?.oeste || '',
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
        unit: imp.unit || 'm²',
        quantity: Number(imp.quantity) || 0,
        unitValue: Number(imp.unitValue) || 0,
        totalValue: (Number(imp.quantity) || 0) * (Number(imp.unitValue) || 0),
        conservationState: 'BOM',
        observation: imp.observation || '',
      })) || [],

      livestocks: initialData.livestockList?.map((l: any) => ({
        id: l.id,
        species: l.species || 'BOVINO',
        category: l.category || 'MATRIZES',
        purpose: l.purpose || 'Cria',
        breed: 'Nelore',
        geneticGrade: '1/2 Sangue',
        quantity: Number(l.quantity) || 0,
        ageMonths: l.ageMonths || 0,
        avgWeightKg: Number(l.avgWeightKg) || 0,
        unitValue: Number(l.unitValue) || 0,
        totalValue: (Number(l.quantity) || 0) * (Number(l.unitValue) || 0),
        markingType: 'Ferro Quente',
        markingLocation: 'Perna Traseira Direita',
      })) || [],
    }
  }, [initialData, branches, producers])

  // Inicialização do React Hook Form com Zod Resolver
  const form = useForm<PropertyWizardFormValues>({
    resolver: zodResolver(propertyWizardSchema) as any,
    defaultValues: mappedInitialValues as PropertyWizardFormValues,
    mode: 'onBlur',
  })

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

    const next = Math.min(currentStep + 1, 5)
    setCurrentStep(next)
    setHighestVisitedStep((prev) => Math.max(prev, next))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleStepClick = async (targetStep: number) => {
    if (isEditMode || targetStep <= currentStep) {
      setCurrentStep(targetStep)
      setHighestVisitedStep((prev) => Math.max(prev, targetStep))
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
        explorationPercentage: values.explorationPercentage ?? 100,
        contractEndDate: values.contractEndDate || null,

        // Áreas
        totalArea: values.totalArea ?? 0,
        consolidatedArea: values.consolidatedArea ?? 0,
        productiveArea: values.productiveArea ?? 0,
        pastureArea: values.pastureArea ?? 0,
        preserveArea: values.preserveArea ?? 0,
        ruralModules: values.ruralModules ?? 0,
        vtnPerHectare: values.vtnPerHectare ?? 0,
        totalLandValue: values.totalLandValue ?? 0,

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
        confrontants: {
          norte: values.confrontantNorth || '',
          sul: values.confrontantSouth || '',
          leste: values.confrontantEast || '',
          oeste: values.confrontantWest || '',
        },

        // Arrays dinâmicos
        machineries: values.machineries || [],
        improvements: values.improvements || [],
        livestocks: values.livestocks || [],

        // Financeiro
        effectiveAgroRevenue: values.effectiveAgroRevenue ?? 0,
        projectedAgroRevenue: values.projectedAgroRevenue ?? 0,
        otherRevenues: values.otherRevenues ?? 0,
        operationalExpenses: values.operationalExpenses ?? 0,
        existingDebtService: values.existingDebtService ?? 0,
        familyLivingCosts: values.familyLivingCosts ?? 0,
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
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Estado do Formulário:
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {isEditMode ? 'Edição Cadastral' : 'Em Preenchimento'}
          </span>
        </div>
      </div>

      {/* Header Stepper (5 Passos) */}
      <WizardStepperHeader
        currentStep={currentStep}
        onStepClick={handleStepClick}
        highestVisitedStep={highestVisitedStep}
        isEditMode={isEditMode}
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

          {currentStep === 4 && <Step4FinancialSummary form={form} />}

          {currentStep === 5 && (
            <Step5ReviewDossier
              form={form}
              producerName={selectedProducer?.name}
              branchName={selectedBranch?.name}
              isSubmitting={isSubmitting}
              onSubmit={form.handleSubmit(onFinalSubmit, onFormError)}
            />
          )}

          {/* BARRA DE NAVEGAÇÃO INFERIOR DO WIZARD */}
          <div className="sticky bottom-4 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg flex items-center justify-between">
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
                Passo {currentStep} de 5
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
