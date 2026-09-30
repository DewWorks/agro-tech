'use client'

import { useMemo, useEffect } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  propertyWizardSchema,
  PropertyWizardFormValues,
} from '@/lib/validations/property-wizard'
import {
  mapPropertyToInitialValues,
  MapPropertyInitialValuesParams,
} from '../utils/initial-values-mapper'

export interface UsePropertyWizardFormOptions extends MapPropertyInitialValuesParams {
  isEditMode?: boolean
}

export interface UsePropertyWizardFormReturn {
  form: UseFormReturn<PropertyWizardFormValues>
  mappedInitialValues: Partial<PropertyWizardFormValues>
}

export function usePropertyWizardForm({
  initialData,
  branches,
  producers,
  initialProducerId,
  initialBranchId,
  isEditMode = false,
}: UsePropertyWizardFormOptions): UsePropertyWizardFormReturn {
  const mappedInitialValues = useMemo(() => {
    return mapPropertyToInitialValues({
      initialData,
      branches,
      producers,
      initialProducerId,
      initialBranchId,
    })
  }, [initialData, branches, producers, initialProducerId, initialBranchId])

  const form = useForm<PropertyWizardFormValues>({
    resolver: zodResolver(propertyWizardSchema) as any,
    defaultValues: mappedInitialValues as PropertyWizardFormValues,
    mode: 'onBlur',
  })

  // Sincronizar initialProducerId e initialBranchId dinamicamente se o form ainda não tiver
  useEffect(() => {
    if (!isEditMode) {
      if (initialProducerId && !form.getValues('producerId')) {
        form.setValue('producerId', initialProducerId, { shouldValidate: true })
      }
      if (initialBranchId && !form.getValues('branchId')) {
        form.setValue('branchId', initialBranchId, { shouldValidate: true })
      }
    }
  }, [initialProducerId, initialBranchId, isEditMode, form])

  return {
    form,
    mappedInitialValues,
  }
}
