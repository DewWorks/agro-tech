import { useMemo } from 'react'
import { CustomOptions, ProducerData } from '../../types/wizard-types'
import { validateCPF, validateCNPJ } from '@/lib/utils/masks'

export interface UseCreditLineConfigParams {
  selectedProducerId: string
  selectedPropertyId: string
  selectedTemplateCode: string
  currentProducer?: ProducerData
  customOptions: CustomOptions
  isLoadingSavedData: boolean
}

export function useCreditLineConfig({
  selectedProducerId,
  selectedPropertyId,
  selectedTemplateCode,
  currentProducer,
  customOptions,
  isLoadingSavedData,
}: UseCreditLineConfigParams) {
  // Validação dos campos obrigatórios conforme o modelo oficial
  const validationErrors = useMemo(() => {
    if (isLoadingSavedData) return []

    const errors: string[] = []
    if (!selectedProducerId) errors.push('Selecione o Produtor Rural (Proponente)')
    if (!selectedPropertyId) errors.push('Selecione a Propriedade / Imóvel Beneficiado')
    if (!selectedTemplateCode) errors.push('Selecione o Modelo Oficial Banco do Brasil')

    const isLegalTemplate = [
      'AUTORIZACAO_COMPARTILHAMENTO',
      'AUTORIZACAO_SCR',
      'AUTORIZACAO_SICOR',
      'DECLARACAO_POSSE_MANSA',
      'DECLARACAO_REGULARIDADE_AMBIENTAL',
      'DECLARACAO_FORA_BIOMA',
      'ENQUADRAMENTO_CAF',
      'IDENTIFICACAO_ANIMAIS',
    ].includes(selectedTemplateCode)

    // Validação estrita de CPF vs CNPJ
    if (currentProducer) {
      if (currentProducer.type === 'PF') {
        if (!currentProducer.document?.trim()) {
          errors.push('CPF do produtor rural (proponente) é obrigatório')
        } else if (!validateCPF(currentProducer.document)) {
          errors.push('CPF do produtor rural proponente é inválido')
        }
      } else if (currentProducer.type === 'PJ') {
        if (!currentProducer.document?.trim()) {
          errors.push('CNPJ da empresa proponente é obrigatório')
        } else if (!validateCNPJ(currentProducer.document)) {
          errors.push('CNPJ da empresa proponente é inválido')
        }

        // Se o documento exigir CPF pessoal (declarações legais ou enquadramento CAF)
        const templateRequiresPersonalCpf =
          isLegalTemplate || selectedTemplateCode === 'ENQUADRAMENTO_CAF'
        const repCpf = customOptions.representativeCpf || currentProducer.representativeCpf
        if (templateRequiresPersonalCpf) {
          if (!repCpf?.trim()) {
            errors.push('Este documento exige identificação por CPF. Preencha o CPF do Representante Legal.')
          } else if (!validateCPF(repCpf)) {
            errors.push('O CPF do Representante Legal informado é matematicamente inválido.')
          }
        } else if (customOptions.representativeCpf?.trim() && !validateCPF(customOptions.representativeCpf)) {
          errors.push('O CPF do Representante Legal informado é matematicamente inválido.')
        }
      }
    }

    if (selectedPropertyId) {
      // Matrícula e CAR são obrigatórios para qualquer emissão oficial vinculada a uma propriedade rural
      if (!customOptions.propertyRegistrationNumber?.trim()) {
        errors.push('Matrícula / Registro do Imóvel (CRI) é obrigatório')
      }
      if (!customOptions.propertyCar?.trim()) {
        errors.push('Nº do CAR (Cadastro Ambiental Rural) é obrigatório')
      }

      if (!isLegalTemplate) {
        if (!customOptions.propertyTotalArea || Number(customOptions.propertyTotalArea) <= 0) {
          errors.push('Área Total do Imóvel (ha) deve ser maior que 0')
        }
        if (!customOptions.propertyAccessRoute?.trim()) {
          errors.push('Roteiro de Acesso ao Imóvel é obrigatório')
        }
        if (!customOptions.propertyActivity?.trim()) {
          errors.push('Atividade Principal do Imóvel é obrigatória')
        }
      }

      if (selectedTemplateCode === 'PROJETO_RENOVAGRO') {
        const areaRec = Number(customOptions.renovagroAreaHa || 0)
        const totalArea = Number(customOptions.propertyTotalArea || 0)
        if (totalArea > 0 && areaRec > totalArea) {
          errors.push(`Área do projeto (${areaRec} ha) não pode exceder a Área Total do imóvel (${totalArea} ha)`)
        }
      } else if (selectedTemplateCode === 'PROJETO_CUSTEIO_SAFRA') {
        const cropArea = Number(customOptions.custeioAreaHa || 0)
        const totalArea = Number(customOptions.propertyTotalArea || 0)
        if (totalArea > 0 && cropArea > totalArea) {
          errors.push(`Área de plantio (${cropArea} ha) não pode exceder a Área Total do imóvel (${totalArea} ha)`)
        }
      }
    }

    if (!customOptions.responsibleName?.trim()) {
      errors.push('Nome do Responsável Técnico / Elaborador é obrigatório')
    }

    if (selectedTemplateCode === 'PROJETO_INOVAGRO') {
      if (!customOptions.inovagroEquipment?.trim()) errors.push('Equipamento / Objeto da inovação é obrigatório')
      if (!customOptions.inovagroPower || Number(customOptions.inovagroPower) <= 0)
        errors.push('Potência / Capacidade do sistema deve ser maior que 0')
      if (!customOptions.inovagroTotalInvestment || Number(customOptions.inovagroTotalInvestment) <= 0)
        errors.push('Investimento Total (R$) deve ser maior que 0')
      if (!customOptions.inovagroFinanced || Number(customOptions.inovagroFinanced) <= 0)
        errors.push('Financiamento Solicitado (R$) deve ser maior que 0')
      if (!customOptions.inovagroTermYears || Number(customOptions.inovagroTermYears) <= 0)
        errors.push('Prazo do financiamento (anos) deve ser maior que 0')
      if (!customOptions.inovagroInterestRate || Number(customOptions.inovagroInterestRate) <= 0)
        errors.push('Taxa de Juros (% a.a.) deve ser informada')
      if (!customOptions.creaNumber?.trim()) errors.push('Nº do CREA é obrigatório')
      if (!customOptions.artNumber?.trim()) errors.push('Nº da ART/TRT é obrigatório')
    } else if (selectedTemplateCode === 'PROJETO_RENOVAGRO') {
      if (!customOptions.renovagroSubline?.trim()) errors.push('Sublinha do Programa RenovAgro é obrigatória')
      if (!customOptions.renovagroAreaHa || Number(customOptions.renovagroAreaHa) <= 0)
        errors.push('Área a Recuperar (ha) deve ser maior que 0')
      if (!customOptions.renovagroTotalInvestment || Number(customOptions.renovagroTotalInvestment) <= 0)
        errors.push('Investimento Total do RenovAgro (R$) deve ser maior que 0')
      if (!customOptions.renovagroFinanced || Number(customOptions.renovagroFinanced) <= 0)
        errors.push('Financiamento Solicitado (R$) deve ser maior que 0')
      if (!customOptions.renovagroTermYears || Number(customOptions.renovagroTermYears) <= 0)
        errors.push('Prazo do financiamento (anos) deve ser maior que 0')
      if (!customOptions.renovagroInterestRate || Number(customOptions.renovagroInterestRate) <= 0)
        errors.push('Taxa de Juros (% a.a.) deve ser informada')
      if (!customOptions.creaNumber?.trim()) errors.push('Nº do CREA é obrigatório')
      if (!customOptions.artNumber?.trim()) errors.push('Nº da ART/TRT é obrigatório')
    } else if (selectedTemplateCode === 'PROJETO_CUSTEIO_SAFRA') {
      if (!customOptions.custeioSafraYear?.trim()) errors.push('Ano Safra é obrigatório (ex: 2026/2027)')
      if (!customOptions.custeioCropName?.trim()) errors.push('Cultura / Atividade de Custeio é obrigatória')
      const isPec =
        customOptions.custeioActivityType === 'PECUARIA' ||
        customOptions.custeioCropName?.toLowerCase().includes('bovino') ||
        customOptions.custeioCropName?.toLowerCase().includes('pecu')
      if (isPec) {
        const qty = customOptions.custeioQuantity || customOptions.custeioAreaHa || 0
        const price = customOptions.custeioUnitPrice || customOptions.custeioCostPerHa || 0
        if (Number(qty) <= 0) errors.push('Quantidade de Animais (cabeças) deve ser maior que 0')
        if (Number(price) <= 0) errors.push('Valor Unitário do Animal (R$) deve ser maior que 0')
      } else {
        if (!customOptions.custeioAreaHa || Number(customOptions.custeioAreaHa) <= 0)
          errors.push('Área de Plantio (ha) deve ser maior que 0')
        if (!customOptions.custeioCostPerHa || Number(customOptions.custeioCostPerHa) <= 0)
          errors.push('Custo Financiado / ha (R$) deve ser maior que 0')
        if (!customOptions.custeioExpectedYield || Number(customOptions.custeioExpectedYield) <= 0)
          errors.push('Produtividade Esperada (sc/ha) deve ser maior que 0')
        if (!customOptions.custeioPricePerUnit || Number(customOptions.custeioPricePerUnit) <= 0)
          errors.push('Preço / Saca (R$) deve ser maior que 0')
      }
      if (!customOptions.custeioInterestRate || Number(customOptions.custeioInterestRate) <= 0)
        errors.push('Taxa de Juros (% a.a.) deve ser informada')
      if (!customOptions.creaNumber?.trim()) errors.push('Nº do CREA é obrigatório')
      if (!customOptions.artNumber?.trim()) errors.push('Nº da ART/TRT é obrigatório')
    } else if (selectedTemplateCode === 'LIMITE_CREDITO_BB') {
      const hasAnyValue =
        (customOptions.estimatedLandValuePerHa && Number(customOptions.estimatedLandValuePerHa) > 0) ||
        (customOptions.improvementsValue && Number(customOptions.improvementsValue) > 0) ||
        (customOptions.machineryValue && Number(customOptions.machineryValue) > 0) ||
        (customOptions.annualRevenue && Number(customOptions.annualRevenue) > 0)
      if (!hasAnyValue) {
        errors.push('Informe ao menos a cotação da terra (R$/ha), benfeitorias, máquinas ou receita anual')
      }
    } else if (selectedTemplateCode === 'CHECKLIST_PROFISSIONAL') {
      if (!customOptions.targetBank?.trim()) errors.push('Instituição Financeira é obrigatória')
      if (!customOptions.purpose?.trim()) errors.push('Finalidade Principal da operação é obrigatória')
    }

    return errors
  }, [selectedProducerId, selectedPropertyId, selectedTemplateCode, customOptions, currentProducer, isLoadingSavedData])

  const isFormValid = validationErrors.length === 0

  const propertyErrors = useMemo(() => {
    return validationErrors.filter(
      (err) =>
        err.includes('Imóvel') ||
        err.includes('Matrícula') ||
        err.includes('CAR') ||
        err.includes('Área Total') ||
        err.includes('Roteiro') ||
        err.includes('Atividade Principal')
    )
  }, [validationErrors])

  const producerErrors = useMemo(() => {
    return validationErrors.filter((err) => err.includes('Produtor'))
  }, [validationErrors])

  const projectErrors = useMemo(() => {
    return validationErrors.filter((err) => !propertyErrors.includes(err) && !producerErrors.includes(err))
  }, [validationErrors, propertyErrors, producerErrors])

  return {
    validationErrors,
    isFormValid,
    propertyErrors,
    producerErrors,
    projectErrors,
  }
}
