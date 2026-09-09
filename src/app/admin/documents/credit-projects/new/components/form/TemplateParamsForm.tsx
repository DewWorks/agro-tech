import React from 'react'
import { CustomOptions } from '../../types/wizard-types'
import { LimiteCreditoParams } from './params/LimiteCreditoParams'
import { InovagroParams } from './params/InovagroParams'
import { RenovagroParams } from './params/RenovagroParams'
import { CusteioSafraParams } from './params/CusteioSafraParams'
import { ChecklistParams } from './params/ChecklistParams'

interface TemplateParamsFormProps {
  selectedTemplateCode: string
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
}

export function TemplateParamsForm({
  selectedTemplateCode,
  customOptions,
  setCustomOptions
}: TemplateParamsFormProps) {
  switch (selectedTemplateCode) {
    case 'LIMITE_CREDITO_BB':
      return <LimiteCreditoParams customOptions={customOptions} setCustomOptions={setCustomOptions} />
    case 'PROJETO_INOVAGRO':
      return <InovagroParams customOptions={customOptions} setCustomOptions={setCustomOptions} />
    case 'PROJETO_RENOVAGRO':
      return <RenovagroParams customOptions={customOptions} setCustomOptions={setCustomOptions} />
    case 'PROJETO_CUSTEIO_SAFRA':
      return <CusteioSafraParams customOptions={customOptions} setCustomOptions={setCustomOptions} />
    case 'CHECKLIST_PROFISSIONAL':
      return <ChecklistParams customOptions={customOptions} setCustomOptions={setCustomOptions} />
    default:
      return null
  }
}
