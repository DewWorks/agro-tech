'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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

interface UseCreditRiskSimulatorOptions {
  initialPropertyId?: string
  onPropertyChange?: (propertyId: string) => void
}

export function useCreditRiskSimulator({
  initialPropertyId,
  onPropertyChange,
}: UseCreditRiskSimulatorOptions = {}) {
  const [propertiesList, setPropertiesList] = useState<PropertySelectOption[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(initialPropertyId || '')
  const [loadingProperty, setLoadingProperty] = useState<boolean>(false)
  const [simulationData, setSimulationData] = useState<PropertySimulationData | null>(null)

  // Estados dos parâmetros de simulação
  const [creditLineCode, setCreditLineCode] = useState<string>('PRONAMP_CUSTEIO')
  const [purpose, setPurpose] = useState<string>('CUSTEIO_AGRICOLA')
  const [targetBank, setTargetBank] = useState<string>('BANCO_DO_BRASIL')
  const [requestedAmount, setRequestedAmount] = useState<number>(250000)
  const [termMonths, setTermMonths] = useState<number>(12)
  const [graceMonths, setGraceMonths] = useState<number>(0)
  const [interestRate, setInterestRate] = useState<number>(8.0)
  const [amortizationSystem, setAmortizationSystem] = useState<AmortizationSystem>('PRICE')

  // Estados de ações e preview modal
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewFileName, setPreviewFileName] = useState<string>('')
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false)

  // 1. Carregar lista de propriedades para o seletor
  useEffect(() => {
    getPropertiesForCreditLimitSelect()
      .then((props) => {
        setPropertiesList(props)
        if (!selectedPropertyId && props.length > 0) {
          const firstId = props[0].id
          setSelectedPropertyId(firstId)
          if (onPropertyChange) onPropertyChange(firstId)
        }
      })
      .catch((err) => console.error('Erro ao buscar lista de propriedades:', err))
  }, [])

  // Sincronizar se prop initialPropertyId mudar externamente
  useEffect(() => {
    if (initialPropertyId && initialPropertyId !== selectedPropertyId) {
      setSelectedPropertyId(initialPropertyId)
    }
  }, [initialPropertyId])

  // 2. Carregar dados detalhados da propriedade selecionada
  useEffect(() => {
    if (!selectedPropertyId) return

    setLoadingProperty(true)
    getPropertySimulationData(selectedPropertyId)
      .then((res) => {
        if (res.success && res.data) {
          setSimulationData(res.data)
          const params = res.data.simulationParams
          setCreditLineCode(params.creditLineCode || 'PRONAMP_CUSTEIO')
          setPurpose(params.creditLimitPurpose || 'CUSTEIO_AGRICOLA')
          setTargetBank(params.creditLimitTargetBank || 'BANCO_DO_BRASIL')
          setRequestedAmount(params.requestedAmount || 250000)
          setTermMonths(params.termMonths || 12)
          setGraceMonths(params.graceMonths || 0)
          setInterestRate(params.interestRateAnnual || 8.0)
          setAmortizationSystem(params.amortizationSystem || 'PRICE')
        } else {
          toast.error(res.error || 'Falha ao carregar dados da propriedade.')
        }
      })
      .catch((err) => {
        console.error(err)
        toast.error('Erro de conexão ao carregar propriedade.')
      })
      .finally(() => setLoadingProperty(false))
  }, [selectedPropertyId])

  // 3. Execução em tempo real do Motor Matemático e Risco Bancário (Aditivo 003)
  const riskAnalysis = useMemo(() => {
    if (!simulationData || requestedAmount <= 0) return null

    const lineDef = CREDIT_LINES_CATALOG.find((l) => l.code === creditLineCode)
    const axis =
      lineDef?.axis ||
      (termMonths <= 12 ? CreditLineAxis.CUSTEIO : CreditLineAxis.INVESTIMENTO)

    const cf = simulationData.cashFlow
    const col = simulationData.collateral

    const baseAgro =
      cf.projectedAgroRevenue > 0 ? cf.projectedAgroRevenue : cf.effectiveAgroRevenue

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
            {
              description: 'Receita Agropecuária Anual Consolidada',
              activityType: 'AGRICOLA_GRAOS' as AgroActivityType,
              realizationType: 'PROJETADA_SAFRA' as RevenueRealizationType,
              quantity: 1,
              unit: 'un',
              unitPrice: baseAgro,
              productionCostTotal: cf.operationalExpenses,
            },
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

  const currentProperty = useMemo(
    () => propertiesList.find((p) => p.id === selectedPropertyId),
    [propertiesList, selectedPropertyId]
  )

  return {
    propertiesList,
    selectedPropertyId,
    currentProperty,
    loadingProperty,
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
