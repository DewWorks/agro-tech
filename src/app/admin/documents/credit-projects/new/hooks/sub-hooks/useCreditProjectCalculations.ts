import { useMemo } from 'react'
import { CustomOptions, ProducerData, PropertyData } from '../../types/wizard-types'
import { CreditTemplateMeta } from '@/lib/document-templates'
import { sanitizeAccessRoute } from '@/lib/document-templates/limite-credito-bb/formatters'

export interface UseCreditProjectCalculationsParams {
  currentProducer?: ProducerData
  currentProperty?: PropertyData
  currentTemplate?: CreditTemplateMeta
  customOptions: CustomOptions
  defaultOrgName?: string
  defaultOrgCnpj?: string
  defaultResponsibleName?: string
  selectedTemplateCode: string
}

export function useCreditProjectCalculations({
  currentProducer,
  currentProperty,
  currentTemplate,
  customOptions,
  defaultOrgName = 'Organização',
  defaultOrgCnpj,
  defaultResponsibleName,
  selectedTemplateCode,
}: UseCreditProjectCalculationsParams) {
  // Calculate BaseData for the Preview synchronously based on customOptions and currentProducer
  const documentData = useMemo(() => {
    if (!currentProducer || !currentProperty || !currentTemplate) return null

    let totalInv = 0
    let finAmount: number | undefined = undefined
    let ownRes: number | undefined = undefined
    let term: number | undefined = undefined
    let grace: number | undefined = undefined
    let rate: number | undefined = undefined

    if (selectedTemplateCode === 'PROJETO_INOVAGRO') {
      totalInv = Number(customOptions.inovagroTotalInvestment || 0)
      finAmount = Number(customOptions.inovagroFinanced || 0)
      ownRes = Number(customOptions.inovagroOwnResources || 0)
      term = Number(customOptions.inovagroTermYears || 0)
      grace = Number(customOptions.inovagroGraceMonths || 0)
      rate = Number(customOptions.inovagroInterestRate || 0)
    } else if (selectedTemplateCode === 'PROJETO_RENOVAGRO') {
      totalInv = Number(customOptions.renovagroTotalInvestment || 0)
      finAmount = Number(customOptions.renovagroFinanced || 0)
      ownRes = Number(customOptions.renovagroOwnResources || 0)
      term = Number(customOptions.renovagroTermYears || 0)
      grace = Number(customOptions.renovagroGraceMonths || 0)
      rate = Number(customOptions.renovagroInterestRate || 0)
    } else if (selectedTemplateCode === 'PROJETO_CUSTEIO_SAFRA') {
      rate = Number(customOptions.custeioInterestRate || 0)
    }

    return {
      template: currentTemplate,
      producer: {
        name: currentProducer.name,
        document: currentProducer.document,
        type: currentProducer.type as 'PF' | 'PJ',
        spouseName: currentProducer.spouseName,
        spouseCpf: currentProducer.spouseCpf,
        spouseRg: currentProducer.spouseRg,
        spouseRgIssuer: currentProducer.spouseRgIssuer,
        spouseNationality: currentProducer.spouseNationality,
        spouseEducationLevel: currentProducer.spouseEducationLevel,
        marriageRegime: currentProducer.marriageRegime,
        representativeCpf: customOptions.representativeCpf || currentProducer.representativeCpf || undefined,
        representativeName:
          customOptions.representativeName ||
          (currentProducer.type === 'PJ'
            ? currentProducer.name.replace(/\s*\(PJ\)\s*/i, '').trim()
            : undefined),
        phone: currentProducer.phone,
        civilStatus: currentProducer.civilStatus,
        branchName: currentProducer.branchName,
        city: currentProducer.city || currentProperty.city,
        state: currentProducer.state || currentProperty.state,
      },
      property: {
        name: currentProperty.name,
        registrationNumber: customOptions.propertyRegistrationNumber || currentProperty.registrationNumber,
        registryOffice: customOptions.propertyRegistryOffice || currentProperty.registryOffice,
        car: customOptions.propertyCar || currentProperty.car,
        ccir: customOptions.propertyCcir || currentProperty.ccir,
        itr: customOptions.propertyItr || currentProperty.itr,
        city: currentProperty.city,
        state: currentProperty.state,
        totalAreaHa: Number(customOptions.propertyTotalArea) || currentProperty.totalArea || 0,
        openAreaHa: currentProperty.productiveArea || 0,
        pastureAreaHa: currentProperty.pastureArea || 0,
        agricultureAreaHa: (currentProperty.productiveArea || 0) - (currentProperty.pastureArea || 0),
        preservationAreaHa: currentProperty.preserveArea || 0,
        explorationActivity: customOptions.propertyActivity || currentProperty.explorationActivity,
        accessRoute: sanitizeAccessRoute(customOptions.propertyAccessRoute || currentProperty.accessRoute),
        livestockData: (currentProperty as any).livestockData || (currentProperty as any).livestock || {
          totalCattle:
            customOptions.livestockCattleHeads ||
            (currentProperty.livestockList?.reduce((acc: number, l: any) => acc + (Number(l.quantity) || 0), 0) ?? 0),
          brandRegistrationAdapec: customOptions.livestockBrandAdapec,
          brandDescription: customOptions.livestockBrandDescription,
        },
        livestockList: customOptions.livestockItems || currentProperty.livestockList || (currentProperty as any).livestocks || [],
        livestocks: customOptions.livestockItems || currentProperty.livestockList || (currentProperty as any).livestocks || [],
      },
      organization: {
        name: defaultOrgName || 'Organização',
        cnpj: defaultOrgCnpj,
        ownerName: defaultResponsibleName,
      },
      options: {
        ...customOptions,
        responsibleName: customOptions.responsibleName || defaultResponsibleName,
        estimatedLandValuePerHa: Number(customOptions.estimatedLandValuePerHa || 0),
        improvementsValue: Number(customOptions.improvementsValue || 0),
        machineryValue: Number(customOptions.machineryValue || 0),
        annualRevenue: Number(customOptions.annualRevenue || 0),
        annualExpenses: Number(customOptions.annualExpenses || 0),
        existingDebts: Number(customOptions.existingDebts || 0),
        machineryItems: customOptions.machineryItems || currentProperty.machineries || [],
        improvementItems: customOptions.improvementItems || currentProperty.improvements || [],
        livestockItems: customOptions.livestockItems || currentProperty.livestockList || (currentProperty as any).livestocks || [],

        // InovAgro
        equipmentName: customOptions.inovagroEquipment,
        equipmentSpec: customOptions.inovagroSpec,
        equipmentCapacity: customOptions.inovagroCapacity,
        systemPowerKw: Number(customOptions.inovagroPower || 0),
        cnaeCode: customOptions.inovagroCnae,
        estimatedMonthlySavings: Number(customOptions.inovagroMonthlySavings || 0),

        // RenovAgro
        subline: customOptions.renovagroSubline,
        areaToRecoverHa: Number(customOptions.renovagroAreaHa || 0),
        costPerHa:
          selectedTemplateCode === 'PROJETO_RENOVAGRO'
            ? Number(customOptions.renovagroCostPerHa || 0)
            : Number(customOptions.custeioCostPerHa || 0),

        // Custeio Safra
        safraYear: customOptions.custeioSafraYear,
        cropName: customOptions.custeioCropName,
        cropAreaHa: Number(customOptions.custeioAreaHa || 0),
        expectedYieldScHa: Number(customOptions.custeioExpectedYield || 0),
        pricePerSc: Number(customOptions.custeioPricePerUnit || 0),

        // Template-specific resolved financial values
        totalInvestment: totalInv,
        financedAmount: finAmount,
        ownResources: ownRes,
        termYears: term,
        graceMonths: grace,
        interestRate: rate,
      },
    }
  }, [
    currentProducer,
    currentProperty,
    currentTemplate,
    customOptions,
    defaultOrgName,
    defaultOrgCnpj,
    defaultResponsibleName,
    selectedTemplateCode,
  ])

  return {
    documentData,
  }
}
