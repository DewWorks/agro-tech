import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { getSavedCreditProjectData, saveCreditProjectData } from '@/actions/credit-projects'
import { CreditProjectWizardProps, CustomOptions, ProducerData, PropertyData } from '../types/wizard-types'
import { CreditTemplateMeta } from '@/lib/document-templates'

export function useCreditProjectWizard(props: CreditProjectWizardProps) {
  const { producers, templates, defaultResponsibleName = '' } = props
  
  const activeProducers = useMemo(() => {
    return producers.filter(p => p.isActive !== false)
  }, [producers])

  const initialTemplate = templates[0]?.code || 'CHECKLIST_PROFISSIONAL'

  const [selectedProducerId, setSelectedProducerId] = useState<string>(activeProducers[0]?.id || '')
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(activeProducers[0]?.properties[0]?.id || '')
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>(initialTemplate)

  const [customOptions, setCustomOptions] = useState<CustomOptions>({
    responsibleName: defaultResponsibleName || '',
    creaNumber: '',
    artNumber: '',
    targetBank: '',
    purpose: '',
    
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
    propertyRegistrationNumber: '',
    propertyRegistryOffice: '',
    propertyCar: '',
    propertyCcir: '',
    propertyItr: '',
    propertyTotalArea: 0,
    propertyAccessRoute: '',
    propertyActivity: '',
  })

  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isSaveDraftModalOpen, setIsSaveDraftModalOpen] = useState(false)
  const [saveModalStep, setSaveModalStep] = useState<number>(1)

  // Recuperar CREA/ART reais do RT persistidos no navegador
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCrea = localStorage.getItem('agrotech_rt_crea')
      const savedArt = localStorage.getItem('agrotech_rt_art')
      const savedRtName = localStorage.getItem('agrotech_rt_name')
      if (savedCrea || savedArt || savedRtName) {
        setCustomOptions(prev => ({
          ...prev,
          creaNumber: prev.creaNumber || savedCrea || '',
          artNumber: prev.artNumber || savedArt || '',
          responsibleName: prev.responsibleName || savedRtName || defaultResponsibleName
        }))
      }
    }
  }, [defaultResponsibleName])

  // Recuperar dados salvos no banco de dados para este produtor, propriedade e modelo
  useEffect(() => {
    if (!selectedProducerId || !selectedTemplateCode) return

    let isMounted = true
    const loadSaved = async () => {
      try {
        const saved = await getSavedCreditProjectData(selectedProducerId, selectedPropertyId, selectedTemplateCode)
        if (saved && isMounted && Object.keys(saved).length > 0) {
          setCustomOptions(prev => ({
            ...prev,
            ...saved
          }))
          toast.info('Dados salvos deste projeto foram carregados automaticamente!')
        }
      } catch (e) {
        // Silencioso
      }
    }

    loadSaved()
    return () => { isMounted = false }
  }, [selectedProducerId, selectedPropertyId, selectedTemplateCode])

  const currentProducer = activeProducers.find(p => p.id === selectedProducerId)
  const availableProperties = currentProducer?.properties || []
  const currentProperty = availableProperties.find(p => p.id === selectedPropertyId)
  const currentTemplate = templates.find(t => t.code === selectedTemplateCode)

  // Sincronizar dados fundiários do imóvel selecionado com o formulário
  useEffect(() => {
    if (currentProperty) {
      setCustomOptions(prev => ({
        ...prev,
        propertyRegistrationNumber: prev.propertyRegistrationNumber || currentProperty.registrationNumber || '',
        propertyRegistryOffice: prev.propertyRegistryOffice || currentProperty.registryOffice || '',
        propertyCar: prev.propertyCar || currentProperty.car || '',
        propertyCcir: prev.propertyCcir || currentProperty.ccir || '',
        propertyItr: prev.propertyItr || currentProperty.itr || '',
        propertyTotalArea: (prev.propertyTotalArea && prev.propertyTotalArea > 0) ? prev.propertyTotalArea : (currentProperty.totalArea || 0),
        propertyAccessRoute: prev.propertyAccessRoute || currentProperty.accessRoute || '',
        propertyActivity: prev.propertyActivity || currentProperty.explorationActivity || '',
      }))
    }
  }, [selectedPropertyId, currentProperty])

  // Validation of mandatory fields by template
  const validationErrors = useMemo(() => {
    const errors: string[] = []
    if (!selectedProducerId) errors.push('Selecione o Produtor Rural (Proponente)')
    if (!selectedPropertyId) errors.push('Selecione a Propriedade / Imóvel Beneficiado')
    if (!selectedTemplateCode) errors.push('Selecione o Modelo Oficial Banco do Brasil')

    if (selectedPropertyId) {
      if (!customOptions.propertyRegistrationNumber?.trim()) {
        errors.push('Matrícula / Registro do Imóvel (CRI) é obrigatório')
      }
      if (!customOptions.propertyCar?.trim()) {
        errors.push('Nº do CAR (Cadastro Ambiental Rural) é obrigatório')
      }
      if (!customOptions.propertyTotalArea || Number(customOptions.propertyTotalArea) <= 0) {
        errors.push('Área Total do Imóvel (ha) deve ser maior que 0')
      }
      if (!customOptions.propertyAccessRoute?.trim()) {
        errors.push('Roteiro de Acesso ao Imóvel é obrigatório')
      }
      if (!customOptions.propertyActivity?.trim()) {
        errors.push('Atividade Principal do Imóvel é obrigatória')
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
      errors.push('Nome do Responsável Técnico é obrigatório')
    }

    if (selectedTemplateCode === 'PROJETO_INOVAGRO') {
      if (!customOptions.inovagroEquipment?.trim()) errors.push('Equipamento / Objeto da inovação é obrigatório')
      if (!customOptions.inovagroPower || Number(customOptions.inovagroPower) <= 0) errors.push('Potência / Capacidade do sistema deve ser maior que 0')
      if (!customOptions.inovagroTotalInvestment || Number(customOptions.inovagroTotalInvestment) <= 0) errors.push('Investimento Total (R$) deve ser maior que 0')
      if (!customOptions.inovagroFinanced || Number(customOptions.inovagroFinanced) <= 0) errors.push('Financiamento Solicitado (R$) deve ser maior que 0')
      if (!customOptions.inovagroTermYears || Number(customOptions.inovagroTermYears) <= 0) errors.push('Prazo do financiamento (anos) deve ser maior que 0')
      if (!customOptions.inovagroInterestRate || Number(customOptions.inovagroInterestRate) <= 0) errors.push('Taxa de Juros (% a.a.) deve ser informada')
      if (!customOptions.creaNumber?.trim()) errors.push('Nº do CREA é obrigatório')
      if (!customOptions.artNumber?.trim()) errors.push('Nº da ART/TRT é obrigatório')
    } else if (selectedTemplateCode === 'PROJETO_RENOVAGRO') {
      if (!customOptions.renovagroSubline?.trim()) errors.push('Sublinha do Programa RenovAgro é obrigatória')
      if (!customOptions.renovagroAreaHa || Number(customOptions.renovagroAreaHa) <= 0) errors.push('Área a Recuperar (ha) deve ser maior que 0')
      if (!customOptions.renovagroTotalInvestment || Number(customOptions.renovagroTotalInvestment) <= 0) errors.push('Investimento Total do RenovAgro (R$) deve ser maior que 0')
      if (!customOptions.renovagroFinanced || Number(customOptions.renovagroFinanced) <= 0) errors.push('Financiamento Solicitado (R$) deve ser maior que 0')
      if (!customOptions.renovagroTermYears || Number(customOptions.renovagroTermYears) <= 0) errors.push('Prazo do financiamento (anos) deve ser maior que 0')
      if (!customOptions.renovagroInterestRate || Number(customOptions.renovagroInterestRate) <= 0) errors.push('Taxa de Juros (% a.a.) deve ser informada')
      if (!customOptions.creaNumber?.trim()) errors.push('Nº do CREA é obrigatório')
      if (!customOptions.artNumber?.trim()) errors.push('Nº da ART/TRT é obrigatório')
    } else if (selectedTemplateCode === 'PROJETO_CUSTEIO_SAFRA') {
      if (!customOptions.custeioSafraYear?.trim()) errors.push('Ano Safra é obrigatório (ex: 2026/2027)')
      if (!customOptions.custeioCropName?.trim()) errors.push('Cultura / Atividade de Custeio é obrigatória')
      if (!customOptions.custeioAreaHa || Number(customOptions.custeioAreaHa) <= 0) errors.push('Área de Plantio (ha) deve ser maior que 0')
      if (!customOptions.custeioCostPerHa || Number(customOptions.custeioCostPerHa) <= 0) errors.push('Custo Financiado / ha (R$) deve ser maior que 0')
      if (!customOptions.custeioExpectedYield || Number(customOptions.custeioExpectedYield) <= 0) errors.push('Produtividade Esperada (sc/ha) deve ser maior que 0')
      if (!customOptions.custeioPricePerUnit || Number(customOptions.custeioPricePerUnit) <= 0) errors.push('Preço / Saca (R$) deve ser maior que 0')
      if (!customOptions.custeioInterestRate || Number(customOptions.custeioInterestRate) <= 0) errors.push('Taxa de Juros (% a.a.) deve ser informada')
      if (!customOptions.creaNumber?.trim()) errors.push('Nº do CREA é obrigatório')
      if (!customOptions.artNumber?.trim()) errors.push('Nº da ART/TRT é obrigatório')
    } else if (selectedTemplateCode === 'LIMITE_CREDITO_BB') {
      const hasAnyValue = (customOptions.estimatedLandValuePerHa && Number(customOptions.estimatedLandValuePerHa) > 0) ||
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
  }, [selectedProducerId, selectedPropertyId, selectedTemplateCode, customOptions])

  const isFormValid = validationErrors.length === 0

  const propertyErrors = useMemo(() => {
    return validationErrors.filter(err => 
      err.includes('Imóvel') || 
      err.includes('Matrícula') || 
      err.includes('CAR') || 
      err.includes('Área Total') || 
      err.includes('Roteiro') || 
      err.includes('Atividade Principal')
    )
  }, [validationErrors])

  const producerErrors = useMemo(() => {
    return validationErrors.filter(err => err.includes('Produtor'))
  }, [validationErrors])

  const projectErrors = useMemo(() => {
    return validationErrors.filter(err => !propertyErrors.includes(err) && !producerErrors.includes(err))
  }, [validationErrors, propertyErrors, producerErrors])

  // Update property when producer changes
  useEffect(() => {
    if (availableProperties.length > 0) {
      const exists = availableProperties.some(p => p.id === selectedPropertyId)
      if (!exists) {
        setSelectedPropertyId(availableProperties[0].id)
      }
    } else {
      setSelectedPropertyId('')
    }
  }, [selectedProducerId, availableProperties, selectedPropertyId])

  const handleOpenSaveModal = () => {
    if (!selectedProducerId || !selectedTemplateCode) {
      toast.error('Selecione um produtor e um modelo antes de salvar.')
      return
    }
    setSaveModalStep(1)
    setIsSaveDraftModalOpen(true)
  }

  const executeSaveDraft = async () => {
    if (!selectedProducerId || !selectedTemplateCode) {
      toast.error('Selecione um produtor e um modelo para salvar.')
      return
    }
    setIsSavingDraft(true)
    try {
      await saveCreditProjectData(selectedProducerId, selectedPropertyId, selectedTemplateCode, customOptions)
      if (typeof window !== 'undefined') {
        if (customOptions.creaNumber) localStorage.setItem('agrotech_rt_crea', customOptions.creaNumber)
        if (customOptions.artNumber) localStorage.setItem('agrotech_rt_art', customOptions.artNumber)
        if (customOptions.responsibleName) localStorage.setItem('agrotech_rt_name', customOptions.responsibleName)
      }
      setIsSaveDraftModalOpen(false)
      toast.success('Informações salvas e sincronizadas com sucesso no cadastro permanente do Produtor e da Propriedade!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar informações do projeto.')
    } finally {
      setIsSavingDraft(false)
    }
  }

  // Calculate BaseData for the Preview synchronously based on customOptions and currentProducer
  const documentData = useMemo(() => {
    if (!currentProducer || !currentProperty || !currentTemplate) return null;

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
        phone: currentProducer.phone,
        civilStatus: currentProducer.civilStatus,
        branchName: currentProducer.branchName,
        city: currentProperty.city,
        state: currentProperty.state,
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
        accessRoute: customOptions.propertyAccessRoute || currentProperty.accessRoute,
      },
      organization: {
        name: props.defaultOrgName || 'Organização',
        cnpj: props.defaultOrgCnpj,
        ownerName: props.defaultResponsibleName,
      },
      options: {
        ...customOptions,
        responsibleName: customOptions.responsibleName || props.defaultResponsibleName,
        estimatedLandValuePerHa: Number(customOptions.estimatedLandValuePerHa || 0),
        improvementsValue: Number(customOptions.improvementsValue || 0),
        machineryValue: Number(customOptions.machineryValue || 0),
        annualRevenue: Number(customOptions.annualRevenue || 0),
        annualExpenses: Number(customOptions.annualExpenses || 0),
        existingDebts: Number(customOptions.existingDebts || 0),

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
        costPerHa: selectedTemplateCode === 'PROJETO_RENOVAGRO' 
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
      }
    }
  }, [currentProducer, currentProperty, currentTemplate, customOptions, props.defaultOrgName, props.defaultOrgCnpj, props.defaultResponsibleName, selectedTemplateCode])

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
      isSavingDraft,
      isConfirmModalOpen,
      isSaveDraftModalOpen,
      saveModalStep,
      validationErrors,
      propertyErrors,
      producerErrors,
      projectErrors,
      isFormValid,
      documentData, // Data for React-based A4 rendering
    },
    actions: {
      setSelectedProducerId,
      setSelectedPropertyId,
      setSelectedTemplateCode,
      setCustomOptions,
      setIsConfirmModalOpen,
      setIsSaveDraftModalOpen,
      setSaveModalStep,
      handleOpenSaveModal,
      executeSaveDraft,
    }
  }
}
