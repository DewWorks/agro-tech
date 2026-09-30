import { useState, useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { getSavedCreditProjectData } from '@/actions/credit-projects'
import { CreditProjectWizardProps, CustomOptions } from '../types/wizard-types'
import { useCreditLineConfig } from './sub-hooks/useCreditLineConfig'
import { useCreditProjectCalculations } from './sub-hooks/useCreditProjectCalculations'
import { useCreditProjectEmission } from './sub-hooks/useCreditProjectEmission'

export function useCreditProjectWizard(props: CreditProjectWizardProps) {
  const { producers, templates, defaultResponsibleName = '', initialTemplateCode, initialSavedData } = props

  const activeProducers = useMemo(() => {
    return producers.filter((p) => p.isActive !== false)
  }, [producers])

  const initialTemplate = initialTemplateCode || templates[0]?.code || 'CHECKLIST_PROFISSIONAL'

  const [selectedProducerId, setSelectedProducerId] = useState<string>(activeProducers[0]?.id || '')
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(activeProducers[0]?.properties[0]?.id || '')
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>(initialTemplate)

  const [customOptions, setCustomOptions] = useState<CustomOptions>(() => {
    const initProd = activeProducers[0]
    const initProp = initProd?.properties?.[0]
    const initRepName =
      initProd?.type === 'PJ'
        ? initProd.name.replace(/\s*\(PJ\)\s*/i, '').trim()
        : initProd?.name || ''
    const initRepCpf =
      initProd?.type === 'PJ'
        ? initProd.representativeCpf || ''
        : initProd?.document || ''

    const defaults: CustomOptions = {
      responsibleName: defaultResponsibleName || '',
      creaNumber: '',
      artNumber: '',
      targetBank: '',
      purpose: '',
      representativeCpf: initRepCpf,
      representativeName: initRepName,

      // Limite de Crédito BB
      estimatedLandValuePerHa: 0,
      improvementsValue: 0,
      machineryValue: 0,
      annualRevenue: 0,
      annualExpenses: 0,
      existingDebts: 0,

      // InovAgro
      inovagroEquipment: '',
      inovagroSpec: '',
      inovagroPower: 0,
      inovagroCapacity: '',
      inovagroCnae: '',
      inovagroTotalInvestment: 0,
      inovagroFinanced: 0,
      inovagroOwnResources: 0,
      inovagroTermYears: 0,
      inovagroGraceMonths: 0,
      inovagroInterestRate: 0,
      inovagroMonthlySavings: 0,

      // RenovAgro
      renovagroSubline: '',
      renovagroAreaHa: 0,
      renovagroCostPerHa: 0,
      renovagroTotalInvestment: 0,
      renovagroFinanced: 0,
      renovagroOwnResources: 0,
      renovagroTermYears: 0,
      renovagroGraceMonths: 0,
      renovagroInterestRate: 0,

      // Custeio Safra
      custeioSafraYear: '',
      custeioCropName: '',
      custeioAreaHa: 0,
      custeioExpectedYield: 0,
      custeioPricePerUnit: 0,
      custeioCostPerHa: 0,
      custeioInterestRate: 0,

      // Dados Fundiários do Imóvel Beneficiado
      propertyRegistrationNumber: initProp?.registrationNumber || '',
      propertyRegistryOffice: initProp?.registryOffice || '',
      propertyCar: initProp?.car || '',
      propertyCcir: initProp?.ccir || '',
      propertyItr: initProp?.itr || '',
      propertyTotalArea: initProp?.totalArea ? Number(initProp.totalArea) : 0,
      propertyAccessRoute: initProp?.accessRoute || '',
      propertyActivity: initProp?.explorationActivity || 'Pecuária de Corte',
    }

    if (initialSavedData && Object.keys(initialSavedData).length > 0) {
      return {
        ...defaults,
        ...initialSavedData,
        representativeName: initialSavedData.representativeName || defaults.representativeName,
        representativeCpf: initialSavedData.representativeCpf || defaults.representativeCpf,
        propertyRegistrationNumber:
          initialSavedData.propertyRegistrationNumber || defaults.propertyRegistrationNumber,
        propertyCar: initialSavedData.propertyCar || defaults.propertyCar,
        propertyActivity: initialSavedData.propertyActivity || defaults.propertyActivity,
        responsibleName: initialSavedData.responsibleName || defaultResponsibleName || '',
      }
    }
    return defaults
  })

  const [isLoadingSavedData, setIsLoadingSavedData] = useState<boolean>(false)
  const isFirstMount = useRef<boolean>(true)

  // Recuperar dados salvos no banco de dados para este produtor, propriedade e modelo
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      if (initialSavedData && Object.keys(initialSavedData).length > 0) {
        return
      }
    }

    if (!selectedProducerId || !selectedTemplateCode) return

    let isMounted = true
    setIsLoadingSavedData(true)

    const loadSaved = async () => {
      try {
        const saved = await getSavedCreditProjectData(selectedProducerId, selectedPropertyId, selectedTemplateCode)
        if (!isMounted) return

        const prod = activeProducers.find((p) => p.id === selectedProducerId)
        const prop = prod?.properties?.find((p) => p.id === selectedPropertyId)

        const autoRepName =
          prod?.type === 'PJ'
            ? prod.name.replace(/\s*\(PJ\)\s*/i, '').trim()
            : prod?.name || ''
        const autoRepCpf =
          prod?.type === 'PJ'
            ? prod.representativeCpf || ''
            : prod?.document || ''

        const autoRegNumber = prop?.registrationNumber || ''
        const autoRegOffice = prop?.registryOffice || ''
        const autoCar = prop?.car || ''
        const autoCcir = prop?.ccir || ''
        const autoItr = prop?.itr || ''
        const autoTotalArea = prop?.totalArea ? Number(prop.totalArea) : 0
        const autoActivity = prop?.explorationActivity || 'Pecuária de Corte'
        const autoAccessRoute = prop?.accessRoute || ''

        setCustomOptions((prev) => ({
          ...prev,
          ...(saved || {}),
          representativeName: saved?.representativeName?.trim() || autoRepName || prev.representativeName || '',
          representativeCpf: saved?.representativeCpf?.trim() || autoRepCpf || prev.representativeCpf || '',
          propertyRegistrationNumber:
            saved?.propertyRegistrationNumber?.trim() || autoRegNumber || prev.propertyRegistrationNumber || '',
          propertyRegistryOffice:
            saved?.propertyRegistryOffice?.trim() || autoRegOffice || prev.propertyRegistryOffice || '',
          propertyCar: saved?.propertyCar?.trim() || autoCar || prev.propertyCar || '',
          propertyCcir: saved?.propertyCcir?.trim() || autoCcir || prev.propertyCcir || '',
          propertyItr: saved?.propertyItr?.trim() || autoItr || prev.propertyItr || '',
          propertyTotalArea:
            saved?.propertyTotalArea !== undefined && saved?.propertyTotalArea !== null && Number(saved.propertyTotalArea) > 0
              ? Number(saved.propertyTotalArea)
              : autoTotalArea || prev.propertyTotalArea || 0,
          propertyActivity:
            saved?.propertyActivity?.trim() || autoActivity || prev.propertyActivity || 'Pecuária de Corte',
          propertyAccessRoute: saved?.propertyAccessRoute?.trim() || autoAccessRoute || prev.propertyAccessRoute || '',
          responsibleName: saved?.responsibleName?.trim() || prev.responsibleName || defaultResponsibleName || '',
        }))

        if (saved && Object.keys(saved).length > 0) {
          toast.info('Dados salvos deste projeto foram carregados automaticamente!')
        }

        // Se o rascunho não possuir maquinários ou benfeitorias, carrega da propriedade vinculada
        if (
          prop &&
          (!saved?.machineryItems || saved.machineryItems.length === 0) &&
          prop.machineries &&
          prop.machineries.length > 0
        ) {
          const machs = prop.machineries.map((m) => ({
            id: m.id || Math.random().toString(),
            type: m.type || 'Trator de Pneus',
            brand: m.brand || '',
            model: m.model || '',
            year: m.year || new Date().getFullYear(),
            chassi: m.chassi || '',
            value: Number(m.value) || 0,
          }))
          const totalVal = machs.reduce((acc, m) => acc + (Number(m.value) || 0), 0)
          setCustomOptions((prev) => ({
            ...prev,
            machineryItems: machs,
            machineryValue: prev.machineryValue || totalVal,
          }))
        }

        if (
          prop &&
          (!saved?.improvementItems || saved.improvementItems.length === 0) &&
          prop.improvements &&
          prop.improvements.length > 0
        ) {
          const imps = prop.improvements.map((imp) => ({
            id: imp.id || Math.random().toString(),
            specification: imp.specification || '',
            unit: imp.unit || 'm²',
            quantity: Number(imp.quantity) || 0,
            unitValue: Number(imp.unitValue) || 0,
            totalValue: Number(imp.totalValue) || (Number(imp.quantity) || 0) * (Number(imp.unitValue) || 0),
          }))
          const totalVal = imps.reduce((acc, imp) => acc + (Number(imp.totalValue) || 0), 0)
          setCustomOptions((prev) => ({
            ...prev,
            improvementItems: imps,
            improvementsValue: prev.improvementsValue || totalVal,
          }))
        }

        if (
          prop &&
          (!saved?.livestockItems || saved.livestockItems.length === 0) &&
          prop.livestockList &&
          prop.livestockList.length > 0
        ) {
          const lvs = prop.livestockList.map((lv: any) => ({
            id: lv.id || Math.random().toString(),
            category: lv.category || 'Vaca',
            categoryBB: lv.categoryBB || 'VACA',
            purposeBB: lv.purposeBB || 'PRODUCAO_DE_CRIAS',
            breed: lv.breed || 'Nelore',
            quantity: Number(lv.quantity) || 0,
            ageMonths: lv.ageMonths ? Number(lv.ageMonths) : null,
            avgWeightKg: lv.avgWeightKg ? Number(lv.avgWeightKg) : null,
            unitValue: Number(lv.unitValue) || 2800,
            totalValue: (Number(lv.quantity) || 0) * (Number(lv.unitValue) || 2800),
            brandingType: lv.brandingType || 'FERRO_QUENTE',
            brandingLocation: lv.brandingLocation || 'PERNA_TRASEIRA_ESQUERDA',
            observation: lv.observation || '',
          }))
          const totalHeads = lvs.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 0), 0)
          const totalVal = lvs.reduce((acc: number, item: any) => acc + (Number(item.totalValue) || 0), 0)
          setCustomOptions((prev) => ({
            ...prev,
            livestockItems: lvs,
            livestockCattleHeads: prev.livestockCattleHeads || totalHeads,
            livestockCattleHeadValue:
              prev.livestockCattleHeadValue || (totalHeads > 0 ? Math.round(totalVal / totalHeads) : 2800),
          }))
        }
      } catch (e) {
        // Silencioso
      } finally {
        if (isMounted) {
          setIsLoadingSavedData(false)
        }
      }
    }

    loadSaved()
    return () => {
      isMounted = false
    }
  }, [
    selectedProducerId,
    selectedPropertyId,
    selectedTemplateCode,
    activeProducers,
    defaultResponsibleName,
    initialSavedData,
  ])

  const currentProducer = activeProducers.find((p) => p.id === selectedProducerId)
  const availableProperties = currentProducer?.properties || []
  const currentProperty = availableProperties.find((p) => p.id === selectedPropertyId)
  const currentTemplate = templates.find((t) => t.code === selectedTemplateCode)

  // Sub-hook 1: Validações e enquadramento da linha
  const {
    validationErrors,
    isFormValid,
    propertyErrors,
    producerErrors,
    projectErrors,
  } = useCreditLineConfig({
    selectedProducerId,
    selectedPropertyId,
    selectedTemplateCode,
    currentProducer,
    customOptions,
    isLoadingSavedData,
  })

  // Sub-hook 2: Cálculos e resolução do documentData
  const { documentData } = useCreditProjectCalculations({
    currentProducer,
    currentProperty,
    currentTemplate,
    customOptions,
    defaultOrgName: props.defaultOrgName,
    defaultOrgCnpj: props.defaultOrgCnpj,
    defaultResponsibleName: props.defaultResponsibleName,
    selectedTemplateCode,
  })

  // Sub-hook 3: Modais e persistência de rascunho
  const {
    isSavingDraft,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    isSaveDraftModalOpen,
    setIsSaveDraftModalOpen,
    saveModalStep,
    setSaveModalStep,
    handleOpenSaveModal,
    executeSaveDraft,
  } = useCreditProjectEmission({
    selectedProducerId,
    selectedPropertyId,
    selectedTemplateCode,
    customOptions,
  })

  // Update property when producer changes
  useEffect(() => {
    if (availableProperties.length > 0) {
      const exists = availableProperties.some((p) => p.id === selectedPropertyId)
      if (!exists) {
        setSelectedPropertyId(availableProperties[0].id)
      }
    } else {
      setSelectedPropertyId('')
    }
  }, [selectedProducerId, availableProperties, selectedPropertyId])

  const handleSetSelectedProducerId = (newProducerId: string) => {
    setSelectedProducerId(newProducerId)
    const p = activeProducers.find((prod) => prod.id === newProducerId)
    const prop = p?.properties?.[0]
    const propId = prop?.id || ''
    setSelectedPropertyId(propId)

    const repName =
      p?.type === 'PJ' ? p.name.replace(/\s*\(PJ\)\s*/i, '').trim() : p?.name || ''
    const repCpf = p?.type === 'PJ' ? p.representativeCpf || '' : p?.document || ''

    setCustomOptions((prev) => ({
      ...prev,
      representativeName: repName,
      representativeCpf: repCpf,
      propertyRegistrationNumber: prop?.registrationNumber || '',
      propertyRegistryOffice: prop?.registryOffice || '',
      propertyCar: prop?.car || '',
      propertyCcir: prop?.ccir || '',
      propertyItr: prop?.itr || '',
      propertyTotalArea: prop?.totalArea ? Number(prop.totalArea) : 0,
      propertyActivity: prop?.explorationActivity || 'Pecuária de Corte',
      propertyAccessRoute: prop?.accessRoute || '',
    }))
  }

  const handleSetSelectedPropertyId = (newPropertyId: string) => {
    setSelectedPropertyId(newPropertyId)
    const prod = activeProducers.find((p) => p.id === selectedProducerId)
    const prop = prod?.properties?.find((p) => p.id === newPropertyId)
    if (prop) {
      setCustomOptions((prev) => ({
        ...prev,
        propertyRegistrationNumber: prop.registrationNumber || prev.propertyRegistrationNumber || '',
        propertyRegistryOffice: prop.registryOffice || prev.propertyRegistryOffice || '',
        propertyCar: prop.car || prev.propertyCar || '',
        propertyCcir: prop.ccir || prev.propertyCcir || '',
        propertyItr: prop.itr || prev.propertyItr || '',
        propertyTotalArea: prop.totalArea ? Number(prop.totalArea) : prev.propertyTotalArea || 0,
        propertyActivity: prop.explorationActivity || prev.propertyActivity || 'Pecuária de Corte',
        propertyAccessRoute: prop.accessRoute || prev.propertyAccessRoute || '',
      }))
    }
  }

  return {
    state: {
      activeProducers,
      availableProperties,
      currentProducer,
      currentProperty,
      currentTemplate,
      selectedProducerId,
      selectedPropertyId,
      selectedTemplateCode,
      customOptions,
      isLoadingSavedData,
      isSavingDraft,
      isConfirmModalOpen,
      isSaveDraftModalOpen,
      saveModalStep,
      validationErrors,
      propertyErrors,
      producerErrors,
      projectErrors,
      isFormValid,
      documentData,
    },
    actions: {
      setSelectedProducerId: handleSetSelectedProducerId,
      setSelectedPropertyId: handleSetSelectedPropertyId,
      setSelectedTemplateCode,
      setCustomOptions,
      setIsConfirmModalOpen,
      setIsSaveDraftModalOpen,
      setSaveModalStep,
      handleOpenSaveModal,
      executeSaveDraft,
    },
  }
}
