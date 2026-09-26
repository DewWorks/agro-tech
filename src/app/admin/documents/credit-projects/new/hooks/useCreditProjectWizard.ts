import { useState, useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { getSavedCreditProjectData, saveCreditProjectData } from '@/actions/credit-projects'
import { CreditProjectWizardProps, CustomOptions, ProducerData, PropertyData } from '../types/wizard-types'
import { CreditTemplateMeta } from '@/lib/document-templates'
import { validateCPF, validateCNPJ } from '@/lib/utils/masks'

export function useCreditProjectWizard(props: CreditProjectWizardProps) {
  const { producers, templates, defaultResponsibleName = '', initialTemplateCode, initialSavedData } = props
  
  const activeProducers = useMemo(() => {
    return producers.filter(p => p.isActive !== false)
  }, [producers])

  const initialTemplate = initialTemplateCode || templates[0]?.code || 'CHECKLIST_PROFISSIONAL'

  const [selectedProducerId, setSelectedProducerId] = useState<string>(activeProducers[0]?.id || '')
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(activeProducers[0]?.properties[0]?.id || '')
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>(initialTemplate)

  const [customOptions, setCustomOptions] = useState<CustomOptions>(() => {
    const initProd = activeProducers[0]
    const initProp = initProd?.properties?.[0]
    const initRepName = initProd?.type === 'PJ' 
      ? initProd.name.replace(/\s*\(PJ\)\s*/i, '').trim() 
      : initProd?.name || ''
    const initRepCpf = initProd?.type === 'PJ' 
      ? (initProd.representativeCpf || '') 
      : (initProd?.document || '')

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
        propertyRegistrationNumber: initialSavedData.propertyRegistrationNumber || defaults.propertyRegistrationNumber,
        propertyCar: initialSavedData.propertyCar || defaults.propertyCar,
        propertyActivity: initialSavedData.propertyActivity || defaults.propertyActivity,
        responsibleName: initialSavedData.responsibleName || defaultResponsibleName || '',
      }
    }
    return defaults
  })

  const [isLoadingSavedData, setIsLoadingSavedData] = useState<boolean>(false)
  const isFirstMount = useRef<boolean>(true)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isSaveDraftModalOpen, setIsSaveDraftModalOpen] = useState(false)
  const [saveModalStep, setSaveModalStep] = useState<number>(1)

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

        const prod = activeProducers.find(p => p.id === selectedProducerId)
        const prop = prod?.properties?.find(p => p.id === selectedPropertyId)

        const autoRepName = prod?.type === 'PJ' 
          ? prod.name.replace(/\s*\(PJ\)\s*/i, '').trim() 
          : prod?.name || ''
        const autoRepCpf = prod?.type === 'PJ' 
          ? (prod.representativeCpf || '') 
          : (prod?.document || '')

        const autoRegNumber = prop?.registrationNumber || ''
        const autoRegOffice = prop?.registryOffice || ''
        const autoCar = prop?.car || ''
        const autoCcir = prop?.ccir || ''
        const autoItr = prop?.itr || ''
        const autoTotalArea = prop?.totalArea ? Number(prop.totalArea) : 0
        const autoActivity = prop?.explorationActivity || 'Pecuária de Corte'
        const autoAccessRoute = prop?.accessRoute || ''

        setCustomOptions(prev => ({
          ...prev,
          ...(saved || {}),
          representativeName: saved?.representativeName?.trim() || autoRepName || prev.representativeName || '',
          representativeCpf: saved?.representativeCpf?.trim() || autoRepCpf || prev.representativeCpf || '',
          propertyRegistrationNumber: saved?.propertyRegistrationNumber?.trim() || autoRegNumber || prev.propertyRegistrationNumber || '',
          propertyRegistryOffice: saved?.propertyRegistryOffice?.trim() || autoRegOffice || prev.propertyRegistryOffice || '',
          propertyCar: saved?.propertyCar?.trim() || autoCar || prev.propertyCar || '',
          propertyCcir: saved?.propertyCcir?.trim() || autoCcir || prev.propertyCcir || '',
          propertyItr: saved?.propertyItr?.trim() || autoItr || prev.propertyItr || '',
          propertyTotalArea: (saved?.propertyTotalArea !== undefined && saved?.propertyTotalArea !== null && Number(saved.propertyTotalArea) > 0)
            ? Number(saved.propertyTotalArea)
            : (autoTotalArea || prev.propertyTotalArea || 0),
          propertyActivity: saved?.propertyActivity?.trim() || autoActivity || prev.propertyActivity || 'Pecuária de Corte',
          propertyAccessRoute: saved?.propertyAccessRoute?.trim() || autoAccessRoute || prev.propertyAccessRoute || '',
          responsibleName: saved?.responsibleName?.trim() || prev.responsibleName || defaultResponsibleName || '',
        }))

        if (saved && Object.keys(saved).length > 0) {
          toast.info('Dados salvos deste projeto foram carregados automaticamente!')
        }

        // Se o rascunho não possuir maquinários ou benfeitorias, carrega da propriedade vinculada
        if (prop && (!saved?.machineryItems || saved.machineryItems.length === 0) && prop.machineries && prop.machineries.length > 0) {
          const machs = prop.machineries.map(m => ({
            id: m.id || Math.random().toString(),
            type: m.type || 'Trator de Pneus',
            brand: m.brand || '',
            model: m.model || '',
            year: m.year || new Date().getFullYear(),
            chassi: m.chassi || '',
            value: Number(m.value) || 0,
          }))
          const totalVal = machs.reduce((acc, m) => acc + (Number(m.value) || 0), 0)
          setCustomOptions(prev => ({
            ...prev,
            machineryItems: machs,
            machineryValue: prev.machineryValue || totalVal,
          }))
        }

        if (prop && (!saved?.improvementItems || saved.improvementItems.length === 0) && prop.improvements && prop.improvements.length > 0) {
          const imps = prop.improvements.map(imp => ({
            id: imp.id || Math.random().toString(),
            specification: imp.specification || '',
            unit: imp.unit || 'm²',
            quantity: Number(imp.quantity) || 0,
            unitValue: Number(imp.unitValue) || 0,
            totalValue: Number(imp.totalValue) || (Number(imp.quantity) || 0) * (Number(imp.unitValue) || 0),
          }))
          const totalVal = imps.reduce((acc, imp) => acc + (Number(imp.totalValue) || 0), 0)
          setCustomOptions(prev => ({
            ...prev,
            improvementItems: imps,
            improvementsValue: prev.improvementsValue || totalVal,
          }))
        }

        if (prop && (!saved?.livestockItems || saved.livestockItems.length === 0) && prop.livestockList && prop.livestockList.length > 0) {
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
          setCustomOptions(prev => ({
            ...prev,
            livestockItems: lvs,
            livestockCattleHeads: prev.livestockCattleHeads || totalHeads,
            livestockCattleHeadValue: prev.livestockCattleHeadValue || (totalHeads > 0 ? Math.round(totalVal / totalHeads) : 2800),
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
    return () => { isMounted = false }
  }, [selectedProducerId, selectedPropertyId, selectedTemplateCode, activeProducers, defaultResponsibleName, initialSavedData])

  const currentProducer = activeProducers.find(p => p.id === selectedProducerId)
  const availableProperties = currentProducer?.properties || []
  const currentProperty = availableProperties.find(p => p.id === selectedPropertyId)
  const currentTemplate = templates.find(t => t.code === selectedTemplateCode)

  // Validation of mandatory fields by template
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
      'IDENTIFICACAO_ANIMAIS'
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

        // Se o documento exigir CPF pessoal (todas as declarações legais ou enquadramento CAF exigem pessoa física / rep legal)
        const templateRequiresPersonalCpf = isLegalTemplate || selectedTemplateCode === 'ENQUADRAMENTO_CAF'
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
        spouseRg: currentProducer.spouseRg,
        spouseRgIssuer: currentProducer.spouseRgIssuer,
        spouseNationality: currentProducer.spouseNationality,
        spouseEducationLevel: currentProducer.spouseEducationLevel,
        marriageRegime: currentProducer.marriageRegime,
        representativeCpf: customOptions.representativeCpf || currentProducer.representativeCpf || undefined,
        representativeName: customOptions.representativeName || (currentProducer.type === 'PJ' ? currentProducer.name.replace(/\s*\(PJ\)\s*/i, '').trim() : undefined),
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
        accessRoute: customOptions.propertyAccessRoute || currentProperty.accessRoute,
        livestockData: (currentProperty as any).livestockData || (currentProperty as any).livestock || {
          totalCattle: customOptions.livestockCattleHeads || (currentProperty.livestockList?.reduce((acc: number, l: any) => acc + (Number(l.quantity) || 0), 0) ?? 0),
          brandRegistrationAdapec: customOptions.livestockBrandAdapec,
          brandDescription: customOptions.livestockBrandDescription,
        },
        livestockList: customOptions.livestockItems || currentProperty.livestockList || (currentProperty as any).livestocks || [],
        livestocks: customOptions.livestockItems || currentProperty.livestockList || (currentProperty as any).livestocks || [],
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

  const handleSetSelectedProducerId = (newProducerId: string) => {
    setSelectedProducerId(newProducerId)
    const p = activeProducers.find((prod) => prod.id === newProducerId)
    const prop = p?.properties?.[0]
    const propId = prop?.id || ''
    setSelectedPropertyId(propId)

    const repName = p?.type === 'PJ' 
      ? p.name.replace(/\s*\(PJ\)\s*/i, '').trim() 
      : p?.name || ''
    const repCpf = p?.type === 'PJ' 
      ? (p.representativeCpf || '') 
      : (p?.document || '')

    setCustomOptions(prev => ({
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
    const prod = activeProducers.find(p => p.id === selectedProducerId)
    const prop = prod?.properties?.find(p => p.id === newPropertyId)
    if (prop) {
      setCustomOptions(prev => ({
        ...prev,
        propertyRegistrationNumber: prop.registrationNumber || prev.propertyRegistrationNumber || '',
        propertyRegistryOffice: prop.registryOffice || prev.propertyRegistryOffice || '',
        propertyCar: prop.car || prev.propertyCar || '',
        propertyCcir: prop.ccir || prev.propertyCcir || '',
        propertyItr: prop.itr || prev.propertyItr || '',
        propertyTotalArea: prop.totalArea ? Number(prop.totalArea) : (prev.propertyTotalArea || 0),
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
      documentData, // Data for React-based A4 rendering
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
    }
  }
}
