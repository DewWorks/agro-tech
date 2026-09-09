'use client'

import React from 'react'
import { PropertyWizardContainer } from '@/components/property-wizard/PropertyWizardContainer'

interface PropertyMultiStepFormProps {
  branches: Array<{ id: string; name: string }>
  initialData?: any
  producers?: Array<{ id: string; name: string; document?: string }>
  hasFinancialModule?: boolean
}

export default function PropertyMultiStepForm({
  branches,
  initialData,
  producers = [],
  hasFinancialModule = false,
}: PropertyMultiStepFormProps) {
  return (
    <PropertyWizardContainer
      branches={branches}
      initialData={initialData}
      producers={producers}
      isEditMode={Boolean(initialData?.id)}
      propertyId={initialData?.id}
      hasFinancialModule={hasFinancialModule}
    />
  )
}
