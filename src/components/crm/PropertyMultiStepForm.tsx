'use client'

import React from 'react'
import { PropertyWizardContainer } from '@/components/property-wizard/PropertyWizardContainer'

interface PropertyMultiStepFormProps {
  branches: Array<{ id: string; name: string }>
  initialData?: any
  producers?: Array<{ id: string; name: string; document?: string; branchId?: string; [key: string]: any }>
  initialProducerId?: string
  initialBranchId?: string
  hasFinancialModule?: boolean
  isFinancialModuleDisabledForOrg?: boolean
  hasCreditLimitModule?: boolean
  isCreditLimitModuleDisabledForOrg?: boolean
}

export default function PropertyMultiStepForm({
  branches,
  initialData,
  producers = [],
  initialProducerId,
  initialBranchId,
  hasFinancialModule = false,
  isFinancialModuleDisabledForOrg = false,
  hasCreditLimitModule = false,
  isCreditLimitModuleDisabledForOrg = false,
}: PropertyMultiStepFormProps) {
  return (
    <PropertyWizardContainer
      branches={branches}
      initialData={initialData}
      producers={producers}
      initialProducerId={initialProducerId}
      initialBranchId={initialBranchId}
      isEditMode={Boolean(initialData?.id)}
      propertyId={initialData?.id}
      hasFinancialModule={hasFinancialModule}
      isFinancialModuleDisabledForOrg={isFinancialModuleDisabledForOrg}
      hasCreditLimitModule={hasCreditLimitModule}
      isCreditLimitModuleDisabledForOrg={isCreditLimitModuleDisabledForOrg}
    />
  )
}
