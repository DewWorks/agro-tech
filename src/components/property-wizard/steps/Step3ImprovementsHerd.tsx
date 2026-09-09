'use client'

import React, { useEffect } from 'react'
import { UseFormReturn, useFormContext } from 'react-hook-form'
import { PropertyWizardFormValues } from '@/lib/validations/property-wizard'
import { ImprovementsDataGrid } from './step3-subcomponents/ImprovementsDataGrid'
import { LivestockDataGrid } from './step3-subcomponents/LivestockDataGrid'

interface Step3ImprovementsHerdProps {
  form?: UseFormReturn<any>
}

export function Step3ImprovementsHerd({ form }: Step3ImprovementsHerdProps) {
  const context = useFormContext()
  const activeForm: UseFormReturn<any> = (form || context) as any
  const { watch, setValue } = activeForm

  const improvements = watch('improvements') || []
  const livestocks = watch('livestocks') || []

  const totalImprovementsValue = improvements.reduce(
    (acc: number, cur: any) => acc + (Number(cur.quantity || 0) * Number(cur.unitValue || 0)),
    0
  )

  const totalLivestockValue = livestocks.reduce(
    (acc: number, cur: any) => acc + (Number(cur.quantity || 0) * Number(cur.unitValue || 0)),
    0
  )

  useEffect(() => {
    setValue('computedImprovementsValue', totalImprovementsValue)
    setValue('computedLivestockValue', totalLivestockValue)
  }, [totalImprovementsValue, totalLivestockValue, setValue])

  return (
    <div className="space-y-8">
      {/* SEÇÃO 1: BENFEITORIAS E CONSTRUÇÕES (TABELA OFICIAL BB) */}
      <ImprovementsDataGrid form={activeForm} />

      {/* SEÇÃO 2: SEMOVENTES E REBANHO (ZOOTECNIA & IDENTIFICAÇÃO) */}
      <LivestockDataGrid form={activeForm} />
    </div>
  )
}
