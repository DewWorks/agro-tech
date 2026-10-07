'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { CREDIT_LINES_CATALOG } from '@/constants/credit-lines'
import {
  calculateFullCreditRiskAnalysis,
  AmortizationSystem,
  CreditLineAxis,
  AgroActivityType,
  RevenueRealizationType,
  ExpenseCategory,
  UrbanPropertyType,
  VehicleType,
} from '@/lib/financial-engine'
import {
  getPropertySimulationData,
  saveCreditLimitSimulation,
  generateCreditLimitDossierHtml,
  getPropertiesForCreditLimitSelect,
} from '@/actions/credit-limit'
import {
  PropertySimulationData,
  PropertySelectOption,
} from '@/types/credit-limit.types'

export function resolveCreditLineCode(rawInput?: string | null): string | null {
  if (!rawInput) return null
  const clean = rawInput.trim()
  const exact = CREDIT_LINES_CATALOG.find((l) => l.code.toUpperCase() === clean.toUpperCase())
  if (exact) return exact.code

  const lower = clean.toLowerCase()
  if (lower.includes('solo') || lower.includes('água') || lower.includes('agua') || lower.includes('renovagro')) {
    return 'RENOVAGRO'
  }
  if (lower.includes('custeio')) {
    return 'PRONAMP_CUSTEIO'
  }
  if (lower.includes('moderfrota') || lower.includes('trator') || lower.includes('colheitadeira')) {
    return 'MODERFROTA'
  }
  if (lower.includes('inovagro') || lower.includes('solar')) {
    return 'INOVAGRO'
  }
  if (lower.includes('armazém') || lower.includes('armazem') || lower.includes('silo') || lower.includes('pca')) {
    return 'PCA'
  }
  if (lower.includes('mais alimentos fixo') || lower.includes('alimentos - fixo')) {
    return 'PRONAF_MAIS_ALIMENTOS_FIXO'
  }
  if (lower.includes('mais alimentos') || lower.includes('semifixo')) {
    return 'PRONAF_MAIS_ALIMENTOS_SEMIFIXO'
  }
  if (lower.includes('mulher')) {
    return 'PRONAF_MULHER'
  }
  if (lower.includes('jovem')) {
    return 'PRONAF_JOVEM'
  }
  if (lower.includes('agroecologia')) {
    return 'PRONAF_AGROECOLOGIA'
  }
  if (lower.includes('bioeconomia')) {
    return 'PRONAF_BIOECONOMIA'
  }
  if (lower.includes('investe agro')) {
    return 'INVESTE_AGRO'
  }

  const byName = CREDIT_LINES_CATALOG.find(
    (l) => l.name.toLowerCase().includes(lower) || lower.includes(l.name.toLowerCase())
  )
  if (byName) return byName.code

  return clean
}

export interface UseCreditRiskSimulatorOptions {
  initialPropertyId?: string
  initialProducerId?: string
  initialAmount?: number
  initialCreditLine?: string
  initialTargetBank?: string
  initialPropertiesList?: PropertySelectOption[]
  initialSimulationData?: PropertySimulationData | null
  onPropertyChange?: (propertyId: string) => void
}

export function useCreditRiskSimulator({
  initialPropertyId,
  initialProducerId,
  initialAmount,
  initialCreditLine,
  initialTargetBank,
  initialPropertiesList,
  initialSimulationData,
  onPropertyChange,
}: UseCreditRiskSimulatorOptions = {}) {
  const searchParams = useSearchParams()

  // 1. INICIALIZAÇÃO SÍNCRONA DE PARÂMETROS DE URL (Eliminação de estados vazios iniciais)
  const [selectedProducerId, setSelectedProducerId] = useState<string | null>(() => {
    return searchParams?.get('producerId') || initialProducerId || null
  })

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(() => {
    return searchParams?.get('propertyId') || initialPropertyId || ''
  })

  const [requestedAmount, setRequestedAmount] = useState<number>(() => {
    const raw = searchParams?.get('amount') || searchParams?.get('requestedAmount')
    if (raw) {
      const parsed = Number(raw)
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
    if (initialAmount && initialAmount > 0) return initialAmount
    if (initialSimulationData?.simulationParams?.requestedAmount) {
      return initialSimulationData.simulationParams.requestedAmount
    }
    return 250000
  })

  const [creditLineCode, setCreditLineCode] = useState<string>(() => {
    const raw = searchParams?.get('creditLine') || searchParams?.get('creditLineCode') || initialCreditLine
    const matched = resolveCreditLineCode(raw)
    if (matched) return matched
    if (initialSimulationData?.simulationParams?.creditLineCode) {
      return initialSimulationData.simulationParams.creditLineCode
    }
    return 'PRONAMP_CUSTEIO'
  })

  const [targetBank, setTargetBank] = useState<string>(() => {
    const raw = searchParams?.get('bank') || searchParams?.get('targetBank') || initialTargetBank
    if (raw) return raw
    if (initialSimulationData?.simulationParams?.creditLimitTargetBank) {
      return initialSimulationData.simulationParams.creditLimitTargetBank
    }
    return 'BANCO_DO_BRASIL'
  })

  const [purpose, setPurpose] = useState<string>(() => {
    return initialSimulationData?.simulationParams?.creditLimitPurpose || 'CUSTEIO_AGRICOLA'
  })

  const [termMonths, setTermMonths] = useState<number>(() => {
    if (initialSimulationData?.simulationParams?.termMonths) {
      return initialSimulationData.simulationParams.termMonths
    }
    const lineDef = CREDIT_LINES_CATALOG.find((l) => l.code === creditLineCode)
    return lineDef?.defaultTermMonths || 12
  })

  const [graceMonths, setGraceMonths] = useState<number>(() => {
    if (initialSimulationData?.simulationParams?.graceMonths !== undefined) {
      return initialSimulationData.simulationParams.graceMonths
    }
    const lineDef = CREDIT_LINES_CATALOG.find((l) => l.code === creditLineCode)
    return lineDef?.defaultGraceMonths ?? 0
  })

  const [interestRate, setInterestRate] = useState<number>(() => {
    if (initialSimulationData?.simulationParams?.interestRateAnnual) {
      return initialSimulationData.simulationParams.interestRateAnnual
    }
    const lineDef = CREDIT_LINES_CATALOG.find((l) => l.code === creditLineCode)
    return lineDef?.defaultInterestRate || 8.0
  })

  const [amortizationSystem, setAmortizationSystem] = useState<AmortizationSystem>(() => {
    if (initialSimulationData?.simulationParams?.amortizationSystem) {
      return initialSimulationData.simulationParams.amortizationSystem
    }
    const lineDef = CREDIT_LINES_CATALOG.find((l) => l.code === creditLineCode)
    return (lineDef?.axis === CreditLineAxis.INVESTIMENTO ? 'SAC' : 'PRICE') as AmortizationSystem
  })

  const [simulationData, setSimulationData] = useState<PropertySimulationData | null>(() => {
    return initialSimulationData || null
  })

  const [propertiesList, setPropertiesList] = useState<PropertySelectOption[]>(() => {
    return initialPropertiesList || []
  })

  // LOADING PROPERTY: Se temos um ID de propriedade ou produtor passado na URL/props,
  // e ainda NÃO temos simulationData, nós nascemos síncronos com loadingProperty = true!
  const [loadingProperty, setLoadingProperty] = useState<boolean>(() => {
    const targetPropId = searchParams?.get('propertyId') || initialPropertyId
    const targetProdId = searchParams?.get('producerId') || initialProducerId
    return Boolean((targetPropId || targetProdId) && !initialSimulationData)
  })

  // Estados de ações e preview modal
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewFileName, setPreviewFileName] = useState<string>('')
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false)

  const hasUrlParams = useMemo(() => {
    return Boolean(
      searchParams?.get('propertyId') ||
      searchParams?.get('producerId') ||
      searchParams?.get('amount') ||
      searchParams?.get('creditLine') ||
      initialPropertyId ||
      initialProducerId
    )
  }, [searchParams, initialPropertyId, initialProducerId])

  // 1. Carregar lista de propriedades para o seletor (se ainda não carregada)
  useEffect(() => {
    if (propertiesList.length === 0) {
      getPropertiesForCreditLimitSelect()
        .then((props) => {
          setPropertiesList(props)
          if (!selectedPropertyId && props.length > 0) {
            let target = props[0]
            if (selectedProducerId) {
              const match = props.find((p) => p.producerId === selectedProducerId)
              if (match) target = match
            }
            setSelectedPropertyId(target.id)
            if (onPropertyChange) onPropertyChange(target.id)
          }
        })
        .catch((err) => console.error('Erro ao buscar lista de propriedades:', err))
    }
  }, [propertiesList.length, selectedProducerId, selectedPropertyId, onPropertyChange])

  // Sincronizar se prop initialSimulationData for fornecida ou atualizada externamente
  useEffect(() => {
    if (initialSimulationData && (!simulationData || simulationData.property.id !== initialSimulationData.property.id)) {
      setSimulationData(initialSimulationData)
      setLoadingProperty(false)
    }
  }, [initialSimulationData])

  // Sincronizar se prop initialPropertyId mudar externamente
  useEffect(() => {
    if (initialPropertyId && initialPropertyId !== selectedPropertyId) {
      setSelectedPropertyId(initialPropertyId)
    }
  }, [initialPropertyId, selectedPropertyId])

  // Sincronizar quando os parâmetros de URL mudarem dinamicamente (navegação cliente)
  useEffect(() => {
    const urlProp = searchParams?.get('propertyId')
    const urlProd = searchParams?.get('producerId')
    const urlAmt = searchParams?.get('amount') || searchParams?.get('requestedAmount')
    const urlLine = searchParams?.get('creditLine') || searchParams?.get('creditLineCode')

    if (urlProp && urlProp !== selectedPropertyId) {
      setSelectedPropertyId(urlProp)
    }
    if (urlProd && urlProd !== selectedProducerId) {
      setSelectedProducerId(urlProd)
    }
    if (urlAmt) {
      const parsed = Number(urlAmt)
      if (!isNaN(parsed) && parsed > 0 && parsed !== requestedAmount) {
        setRequestedAmount(parsed)
      }
    }
    if (urlLine) {
      const matched = resolveCreditLineCode(urlLine)
      if (matched && matched !== creditLineCode) {
        setCreditLineCode(matched)
      }
    }
  }, [searchParams])

  // 2. Carregar dados detalhados da propriedade selecionada (sem waterfalls)
  useEffect(() => {
    if (!selectedPropertyId) return

    // Se já temos a simulação carregada para essa mesma propriedade, evita refetch desnecessário
    if (simulationData?.property?.id === selectedPropertyId) {
      setLoadingProperty(false)
      return
    }

    let isMounted = true
    setLoadingProperty(true)

    getPropertySimulationData(selectedPropertyId)
      .then((res) => {
        if (!isMounted) return
        if (res.success && res.data) {
          setSimulationData(res.data)
          const params = res.data.simulationParams
          const urlLine = searchParams?.get('creditLine') || searchParams?.get('creditLineCode')
          const matchedLine = resolveCreditLineCode(urlLine)
          if (matchedLine) {
            setCreditLineCode(matchedLine)
          } else if (params.creditLineCode) {
            setCreditLineCode(params.creditLineCode)
          }

          if (params.creditLimitPurpose) {
            setPurpose(params.creditLimitPurpose)
          }

          const urlBnk = searchParams?.get('bank') || searchParams?.get('targetBank')
          if (urlBnk) {
            setTargetBank(urlBnk)
          } else if (params.creditLimitTargetBank) {
            setTargetBank(params.creditLimitTargetBank)
          }

          const rawAmt = searchParams?.get('amount') || searchParams?.get('requestedAmount')
          const parsedAmt = rawAmt ? Number(rawAmt) : null
          if (parsedAmt && !isNaN(parsedAmt) && parsedAmt > 0) {
            setRequestedAmount(parsedAmt)
          } else if (params.requestedAmount) {
            setRequestedAmount(params.requestedAmount)
          }

          setTermMonths(params.termMonths || 12)
          setGraceMonths(params.graceMonths || 0)
          setInterestRate(params.interestRateAnnual || 8.0)
          setAmortizationSystem(params.amortizationSystem || 'PRICE')
        } else {
          toast.error(res.error || 'Falha ao carregar dados da propriedade.')
        }
      })
      .catch((err) => {
        if (!isMounted) return
        console.error(err)
        toast.error('Erro de conexão ao carregar propriedade.')
      })
      .finally(() => {
        if (isMounted) setLoadingProperty(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedPropertyId, searchParams])

  // 3. Execução em tempo real do Motor Matemático e Risco Bancário (Aditivo 003)
  const riskAnalysis = useMemo(() => {
    if (!simulationData || requestedAmount <= 0) return null

    const lineDef = CREDIT_LINES_CATALOG.find((l) => l.code === creditLineCode)
    const axis =
      lineDef?.axis ||
      (termMonths <= 12 ? CreditLineAxis.CUSTEIO : CreditLineAxis.INVESTIMENTO)

    const cf = simulationData.cashFlow
    const col = simulationData.collateral

    const agroRevs =
      cf.customAgroRevenues && cf.customAgroRevenues.length > 0
        ? cf.customAgroRevenues.map((r: any) => ({
            description: r.description || 'Cultura',
            activityType: (r.activityType || 'AGRICOLA_GRAOS') as AgroActivityType,
            realizationType: (r.realizationType || 'PROJETADA_SAFRA') as RevenueRealizationType,
            quantity: Number(r.quantity) || 1,
            unit: r.unit || 'un',
            unitPrice: Number(r.unitPrice) || 0,
            productionCostTotal: Number(r.productionCostTotal) || 0,
          }))
        : [
            ...(cf.effectiveAgroRevenue > 0
              ? [
                  {
                    description: 'Receita Agropecuária Efetiva (Safra Anterior)',
                    activityType: 'AGRICOLA_GRAOS' as AgroActivityType,
                    realizationType: 'EFETIVA_HISTORICA' as RevenueRealizationType,
                    quantity: 1,
                    unit: 'un',
                    unitPrice: cf.effectiveAgroRevenue,
                    productionCostTotal: 0,
                  },
                ]
              : []),
            ...(cf.projectedAgroRevenue > 0
              ? [
                  {
                    description: 'Receita Agropecuária Projetada (Safra Vigente)',
                    activityType: 'AGRICOLA_GRAOS' as AgroActivityType,
                    realizationType: 'PROJETADA_SAFRA' as RevenueRealizationType,
                    quantity: 1,
                    unit: 'un',
                    unitPrice: cf.projectedAgroRevenue,
                    productionCostTotal: cf.operationalExpenses,
                  },
                ]
              : cf.effectiveAgroRevenue > 0 && cf.operationalExpenses > 0
              ? [
                  {
                    description: 'Custos Operacionais & Insumos',
                    activityType: 'AGRICOLA_GRAOS' as AgroActivityType,
                    realizationType: 'PROJETADA_SAFRA' as RevenueRealizationType,
                    quantity: 1,
                    unit: 'un',
                    unitPrice: 0,
                    productionCostTotal: cf.operationalExpenses,
                  },
                ]
              : []),
          ]

    return calculateFullCreditRiskAnalysis({
      requestedAmount,
      termMonths,
      graceMonths,
      annualInterestRate: interestRate,
      amortizationSystem,
      creditLineAxis: axis,
      creditLineCode,
      creditLineName: lineDef?.name || 'Linha Agro BB/Sicredi',
      agroRevenues: agroRevs,
      nonAgroRevenues:
        cf.otherRevenues > 0
          ? [{ description: 'Outras Rendas', annualAmount: cf.otherRevenues }]
          : [],
      expenses: [
        {
          category: ExpenseCategory.CUSTEIO_OPERACIONAL,
          description: 'Custo de Produção / Operacional',
          annualAmount: cf.operationalExpenses,
        },
        {
          category: ExpenseCategory.MANUTENCAO_FAMILIAR,
          description: 'Manutenção Familiar',
          annualAmount: cf.familyLivingCosts,
        },
        {
          category: ExpenseCategory.PASSIVO_EXISTENTE_BANCARIO,
          description: 'Dívidas Bancárias Vigentes',
          annualAmount: cf.existingDebtService,
        },
      ],
      ruralCollateral: {
        landValue: col.landValue,
        improvementsValue: col.improvementsValue,
        machineryValue: col.machineryValue,
        livestockValue: col.livestockValue,
      },
      urbanProperties: (col.urbanProperties || []).map((u: any) => ({
        description: u.description || 'Imóvel Urbano',
        propertyType: (u.propertyType || 'RESIDENCIAL') as UrbanPropertyType,
        marketValue: Number(u.marketValue) || 0,
        hasLien: Boolean(u.hasLien),
        liquidityRating: u.liquidityRating || 'MEDIA',
      })),
      vehicles: (col.vehicles || []).map((v: any) => ({
        brand: v.brand || '',
        model: v.model || '',
        vehicleType: (v.vehicleType || 'CAMINHONETE') as VehicleType,
        declaredValue: Number(v.declaredValue) || 0,
        hasLien: Boolean(v.hasLien),
      })),
    })
  }, [
    simulationData,
    requestedAmount,
    termMonths,
    graceMonths,
    interestRate,
    amortizationSystem,
    creditLineCode,
  ])

  // Salvar Simulação
  const handleSaveSimulation = useCallback(async () => {
    if (!selectedPropertyId) return
    setIsSaving(true)
    const toastId = toast.loading('Salvando e homologando parâmetros de limite...')
    try {
      const res = await saveCreditLimitSimulation(selectedPropertyId, {
        requestedAmount,
        creditLineCode,
        creditLimitPurpose: purpose,
        creditLimitTargetBank: targetBank,
        termMonths,
        graceMonths,
        interestRateAnnual: interestRate,
        amortizationSystem,
      })
      if (!res.success) throw new Error(res.error || 'Erro ao salvar simulação')
      toast.dismiss(toastId)
      toast.success('Parâmetros de crédito e análise de risco salvos com sucesso!')
    } catch (err: any) {
      console.error(err)
      toast.dismiss(toastId)
      toast.error(err.message || 'Erro ao salvar.')
    } finally {
      setIsSaving(false)
    }
  }, [
    selectedPropertyId,
    requestedAmount,
    creditLineCode,
    purpose,
    targetBank,
    termMonths,
    graceMonths,
    interestRate,
    amortizationSystem,
  ])

  // Abrir Pré-Visualização do Dossiê Técnico Oficial
  const handleOpenPreviewModal = useCallback(async () => {
    if (!selectedPropertyId) return
    setIsPreviewOpen(true)
    setIsLoadingPreview(true)
    try {
      const res = await generateCreditLimitDossierHtml(selectedPropertyId, {
        creditLineCode,
        creditLimitPurpose: purpose,
        creditLimitTargetBank: targetBank,
        creditLimitRequested: requestedAmount,
        creditLimitTermMonths: termMonths,
        gracePeriodMonths: graceMonths,
        interestRateAnnual: interestRate,
        amortizationSystem,
      })

      if (!res.success || !res.html) {
        throw new Error(res.error || 'Erro ao gerar HTML do dossiê.')
      }

      setPreviewHtml(res.html)
      setPreviewFileName(res.fileName || `Dossie_Limite_Credito_${Date.now()}.pdf`)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Falha ao carregar pré-visualização do dossiê.')
    } finally {
      setIsLoadingPreview(false)
    }
  }, [
    selectedPropertyId,
    creditLineCode,
    purpose,
    targetBank,
    requestedAmount,
    termMonths,
    graceMonths,
    interestRate,
    amortizationSystem,
  ])

  const handleClosePreviewModal = useCallback(() => {
    setIsPreviewOpen(false)
  }, [])

  const handleSelectCreditLine = useCallback((code: string) => {
    if (!code) return
    const found = CREDIT_LINES_CATALOG.find((l) => l.code === code)
    if (found) {
      setCreditLineCode(found.code)
      setTermMonths(found.defaultTermMonths)
      setInterestRate(found.defaultInterestRate)
      setGraceMonths(found.defaultGraceMonths)
      setAmortizationSystem(
        found.axis === CreditLineAxis.INVESTIMENTO ? 'SAC' : 'PRICE'
      )
    }
  }, [])

  const handleSelectProperty = useCallback(
    (propertyId: string) => {
      if (propertyId) {
        setSelectedPropertyId(propertyId)
        if (onPropertyChange) onPropertyChange(propertyId)
      }
    },
    [onPropertyChange]
  )

  const currentProperty = useMemo(() => {
    const found = propertiesList.find((p) => p.id === selectedPropertyId)
    if (found) return found
    if (simulationData?.property && simulationData.property.id === selectedPropertyId) {
      return {
        id: simulationData.property.id,
        name: simulationData.property.name || simulationData.property.propertyName || 'Propriedade',
        propertyName: simulationData.property.propertyName,
        city: simulationData.property.city,
        state: simulationData.property.state,
        totalArea: simulationData.property.totalArea,
        producerName: simulationData.producer.name,
        producerId: simulationData.producer.id,
      }
    }
    return undefined
  }, [propertiesList, selectedPropertyId, simulationData])

  return {
    propertiesList,
    selectedPropertyId,
    selectedProducerId,
    currentProperty,
    loadingProperty,
    hasUrlParams,
    simulationData,
    creditLineCode,
    purpose,
    targetBank,
    requestedAmount,
    termMonths,
    graceMonths,
    interestRate,
    amortizationSystem,
    riskAnalysis,
    isSaving,
    isPreviewOpen,
    previewHtml,
    previewFileName,
    isLoadingPreview,
    setCreditLineCode,
    setPurpose,
    setTargetBank,
    setRequestedAmount,
    setTermMonths,
    setGraceMonths,
    setInterestRate,
    setAmortizationSystem,
    handleSelectCreditLine,
    handleSelectProperty,
    handleSaveSimulation,
    handleOpenPreviewModal,
    handleClosePreviewModal,
  }
}
