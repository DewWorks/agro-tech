'use client'

import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import {
  PropertyWizardFormValues,
  STEP_FIELDS_MAP,
  focusAndScrollToField,
} from '@/lib/validations/property-wizard'

export interface UseWizardNavigationOptions {
  form: UseFormReturn<PropertyWizardFormValues>
  isEditMode?: boolean
  hasFinancialModule?: boolean
}

export function useWizardNavigation({
  form,
  isEditMode = false,
  hasFinancialModule = false,
}: UseWizardNavigationOptions) {
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [highestVisitedStep, setHighestVisitedStep] = useState<number>(isEditMode ? 5 : 1)

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
          const errors = form.formState.errors
          const firstInvalidField = fieldsToValidate.find(
            (field) => errors[field as keyof PropertyWizardFormValues]
          )
          if (firstInvalidField) {
            focusAndScrollToField(firstInvalidField)
          }
          toast.error('Por favor, verifique os campos com pendência destacados em amarelo de atenção.')
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
        const errors = form.formState.errors
        const firstInvalidField = fieldsToValidate.find(
          (field) => errors[field as keyof PropertyWizardFormValues]
        )
        if (firstInvalidField) {
          focusAndScrollToField(firstInvalidField)
        }
        toast.error('Preencha ou corrija os campos destacados em amarelo antes de avançar.')
        return
      }
    }

    setCurrentStep(targetStep)
    setHighestVisitedStep((prev) => Math.max(prev, targetStep))
    scrollToTop()
  }

  return {
    currentStep,
    setCurrentStep,
    highestVisitedStep,
    setHighestVisitedStep,
    scrollToTop,
    handleNextStep,
    handlePrevStep,
    handleStepClick,
  }
}
