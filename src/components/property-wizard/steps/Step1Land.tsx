'use client'

import React, { useEffect } from 'react'
import { UseFormReturn, useFormContext } from 'react-hook-form'
import { PropertyWizardFormValues } from '@/lib/validations/property-wizard'
import { LandIdentificationCard } from './step1-subcomponents/LandIdentificationCard'
import { LandDocumentationCard } from './step1-subcomponents/LandDocumentationCard'
import { LandAreasBalanceCard } from './step1-subcomponents/LandAreasBalanceCard'
import { LandLocationCard } from './step1-subcomponents/LandLocationCard'
import { LandLegalRiskCard } from './step1-subcomponents/LandLegalRiskCard'

interface Step1LandProps {
  form?: UseFormReturn<any>
  producers: Array<{ id: string; name: string; document?: string }>
  branches: Array<{ id: string; name: string }>
}

export function Step1Land({ form, producers, branches }: Step1LandProps) {
  const context = useFormContext()
  const activeForm: UseFormReturn<any> = (form || context) as any
  const { control, watch, setValue } = activeForm

  const totalArea = watch('totalArea')
  const vtnPerHectare = watch('vtnPerHectare')

  useEffect(() => {
    const area = Number(totalArea) || 0
    const vtn = Number(vtnPerHectare) || 0
    const val = Math.round(area * vtn * 100) / 100
    setValue('totalLandValue', val)
    setValue('computedLandValue', val)
  }, [totalArea, vtnPerHectare, setValue])

  return (
    <div className="space-y-6">
      {/* 1. IDENTIFICAÇÃO E PROPRIETÁRIO */}
      <LandIdentificationCard
        control={control}
        branches={branches}
        producers={producers}
      />

      {/* 2. REGISTROS LEGAIS E DOCUMENTAIS (COM MÁSCARAS) */}
      <LandDocumentationCard control={control} />

      {/* 3. ÁREAS (ha) E NATUREZA DA TERRA (VTN) */}
      <LandAreasBalanceCard control={control} watch={watch} />

      {/* 4. LOCALIZAÇÃO GEODÉSICA E BUSCA */}
      <LandLocationCard control={control} setValue={setValue} watch={watch} />

      {/* 5 e 6. INDICADORES DE RISCO BANCÁRIO, ROTEIRO E CONFRONTAÇÕES */}
      <LandLegalRiskCard control={control} />
    </div>
  )
}
