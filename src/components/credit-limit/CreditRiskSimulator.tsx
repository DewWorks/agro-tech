'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sparkles,
  FileCheck,
  ShieldCheck,
  Landmark,
  Download,
  Save,
  Loader2,
  ExternalLink,
  Coins,
  Scale,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Percent,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react'
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
  PropertySimulationData,
} from '@/actions/credit-limit'
import { downloadCreditLimitDossierPdf } from '@/lib/utils/dossie-pdf-downloader'
import { PrescriptiveActionCard } from './PrescriptiveActionCard'
import { toast } from 'sonner'
import { formatCPF, formatCNPJ } from '@/lib/validations'

const PURPOSE_OPTIONS = [
  { value: 'CUSTEIO_AGRICOLA', label: 'Custeio Agrícola (Safra)', color: 'text-amber-600' },
  { value: 'CUSTEIO_PECUARIO', label: 'Custeio Pecuário', color: 'text-emerald-600' },
  { value: 'INVESTIMENTO_FIXO', label: 'Investimento em Benfeitorias/Instalações', color: 'text-blue-600' },
  { value: 'INVESTIMENTO_SEMI_FIXO', label: 'Investimento em Máquinas e Frotas', color: 'text-purple-600' },
  { value: 'COMERCIALIZACAO', label: 'Comercialização / FGPP', color: 'text-teal-600' },
]

const BANK_OPTIONS = [
  { value: 'BANCO_DO_BRASIL', label: 'Banco do Brasil (Líder Agro)' },
  { value: 'SICREDI', label: 'Sicredi (Cooperativa)' },
  { value: 'SICOOB', label: 'Sicoob (Cooperativa)' },
  { value: 'BRADESCO', label: 'Bradesco Agro' },
  { value: 'ITAU', label: 'Itaú BBA' },
  { value: 'SANTANDER', label: 'Santander Agro' },
  { value: 'CAIXA', label: 'Caixa Econômica Federal' },
  { value: 'OUTROS', label: 'Outro Agente Financeiro MCR' },
]

interface CreditRiskSimulatorProps {
  initialPropertyId?: string
  onPropertyChange?: (propertyId: string) => void
}

export function CreditRiskSimulator({
  initialPropertyId,
  onPropertyChange,
}: CreditRiskSimulatorProps) {
  const [propertiesList, setPropertiesList] = useState<
    Array<{
      id: string
      name: string
      propertyName: string | null
      city: string | null
      state: string | null
      totalArea: number
      producerName: string
      producerId: string
    }>
  >([])
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

  // Estados de ações
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false)

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

  // Formatação em BRL
  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  // 3. Execução em tempo real do Motor Matemático e Risco Bancário (Aditivo 003)
  const riskAnalysis = useMemo(() => {
    if (!simulationData || requestedAmount <= 0) return null

    const lineDef = CREDIT_LINES_CATALOG.find((l) => l.code === creditLineCode)
    const axis = lineDef?.axis || (termMonths <= 12 ? CreditLineAxis.CUSTEIO : CreditLineAxis.INVESTIMENTO)

    const cf = simulationData.cashFlow
    const col = simulationData.collateral

    const baseAgro = cf.projectedAgroRevenue > 0 ? cf.projectedAgroRevenue : cf.effectiveAgroRevenue

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
        cf.otherRevenues > 0 ? [{ description: 'Outras Rendas', annualAmount: cf.otherRevenues }] : [],
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
  const handleSaveSimulation = async () => {
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
  }

  // Emitir / Baixar Dossiê Técnico Oficial em PDF (Aditivo 003)
  const handleDownloadDossier = async () => {
    if (!selectedPropertyId) return
    setIsGeneratingPdf(true)
    const toastId = toast.loading('Gerando Dossiê Técnico de Limite de Crédito (BB/Sicredi)...')
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

      await downloadCreditLimitDossierPdf(
        res.html,
        res.fileName || `Dossie_Limite_Credito_${Date.now()}.pdf`
      )

      toast.dismiss(toastId)
      toast.success('Dossiê Técnico emitido e baixado com sucesso!')
    } catch (err: any) {
      console.error(err)
      toast.dismiss(toastId)
      toast.error(err.message || 'Falha na compilação do PDF.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const currentProperty = propertiesList.find((p) => p.id === selectedPropertyId)

  return (
    <div className="space-y-6">
      {/* SELETOR PRINCIPAL DE PROPRIEDADE RURAL */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex-1 max-w-xl">
          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-emerald-600" />
            Propriedade Rural para Simulação de Limite
          </Label>
          <Select
            value={selectedPropertyId}
            onValueChange={(id) => {
              if (id) {
                setSelectedPropertyId(id)
                if (onPropertyChange) onPropertyChange(id)
              }
            }}
          >
            <SelectTrigger className="text-xs h-10 bg-slate-50 dark:bg-slate-800/60 font-semibold truncate text-left">
              <SelectValue placeholder="Selecione um imóvel rural...">
                {currentProperty ? (
                  <span className="truncate">
                    <strong className="text-slate-900 dark:text-slate-100">
                      {currentProperty.name || currentProperty.propertyName}
                    </strong>{' '}
                    <span className="text-slate-500 dark:text-slate-400 font-normal">
                      ({currentProperty.producerName || 'Sem produtor'}) -{' '}
                      {Number(currentProperty.totalArea || 0).toFixed(1)} ha
                    </span>
                  </span>
                ) : (
                  'Selecione uma propriedade...'
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {propertiesList.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs py-2">
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {p.name || p.propertyName}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {p.producerName || 'Sem produtor'} • {p.city || 'Sem município'}/{p.state || 'UF'} •{' '}
                      {Number(p.totalArea || 0).toFixed(1)} ha
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ações de Cabeçalho: Emitir Dossiê Oficial e Salvar */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
          {selectedPropertyId && (
            <Link
              href={`/admin/crm/properties/${selectedPropertyId}/edit`}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-emerald-50"
              title="Abrir cadastro de terras, máquinas e benfeitorias no CRM"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Editar no CRM</span>
            </Link>
          )}

          <Button
            type="button"
            onClick={handleSaveSimulation}
            disabled={isSaving || !simulationData}
            variant="outline"
            className="text-xs h-10 px-3.5 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold gap-1.5"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Salvar Parâmetros</span>
          </Button>

          <Button
            type="button"
            onClick={handleDownloadDossier}
            disabled={isGeneratingPdf || !simulationData}
            className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs h-10 px-4 font-bold gap-1.5 shadow-sm"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Emitir Dossiê Técnico (PDF)</span>
          </Button>
        </div>
      </div>

      {loadingProperty ? (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            Carregando lastro patrimonial e fluxo de caixa da propriedade...
          </p>
        </div>
      ) : !simulationData ? (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <Coins className="w-8 h-8 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Nenhuma Propriedade Selecionada
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Selecione uma propriedade na caixa acima para carregar o balanço financeiro e efetuar a simulação de risco MCR.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* BANNER DE RESUMO DO IMÓVEL & PRODUTOR */}
          <div className="bg-gradient-to-r from-emerald-900 to-[#1B4D3E] text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">
                  {simulationData.property.propertyName || simulationData.property.name}
                </span>
                <Badge className="bg-emerald-500/30 text-emerald-200 border-emerald-400/40 text-[10px] font-bold">
                  {simulationData.property.totalArea.toFixed(1)} ha
                </Badge>
              </div>
              <p className="text-xs text-emerald-100/90">
                Produtor(a): <strong>{simulationData.producer.name}</strong> •{' '}
                {simulationData.producer.document?.length > 11
                  ? formatCNPJ(simulationData.producer.document)
                  : formatCPF(simulationData.producer.document)}{' '}
                • {simulationData.property.city || 'Sem município'}/{simulationData.property.state || 'UF'}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <span className="text-[10px] text-emerald-200 uppercase block font-sans">
                  Garantias MCR
                </span>
                <span className="font-bold text-sm">
                  {formatBRL(simulationData.collateral.acceptableCollateral)}
                </span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="text-right">
                <span className="text-[10px] text-emerald-200 uppercase block font-sans">
                  Capacidade Pagamento (CP)
                </span>
                <span
                  className={`font-bold text-sm ${
                    simulationData.cashFlow.paymentCapacity >= 0
                      ? 'text-emerald-200'
                      : 'text-rose-300'
                  }`}
                >
                  {formatBRL(simulationData.cashFlow.paymentCapacity)}
                </span>
              </div>
            </div>
          </div>

          {/* AVISO CONTEXTUAL PARA PROPRIEDADE COM DADOS ZERADOS NO CRM */}
          {(simulationData.property.totalArea <= 0 ||
            (simulationData.collateral.totalAssets <= 0 && simulationData.cashFlow.paymentCapacity <= 0)) && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Atenção:</strong> Esta propriedade ainda não possui ativos ou fluxo de caixa lançados no CRM. O cálculo de ICSD e LTV será afetado.
                </span>
              </div>
              <Link
                href={`/admin/crm/properties/${selectedPropertyId}/edit`}
                className="inline-flex items-center gap-1 font-bold text-amber-800 dark:text-amber-300 hover:underline shrink-0 text-xs"
              >
                <span>Completar Cadastro no CRM</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* QUADROS DE ENTRADA: BALANÇO DE GARANTIAS & FLUXO DE CAIXA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lastro de Garantias */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Lastro de Ativos & Garantias Cadastradas
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-normal">
                    Total: {formatBRL(simulationData.collateral.totalAssets)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-600 dark:text-slate-400">Terra Nua (VTN):</span>
                  <span className="font-mono font-semibold">{formatBRL(simulationData.collateral.landValue)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-600 dark:text-slate-400">Benfeitorias e Instalações:</span>
                  <span className="font-mono font-semibold">{formatBRL(simulationData.collateral.improvementsValue)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-600 dark:text-slate-400">Máquinas e Implementos:</span>
                  <span className="font-mono font-semibold">{formatBRL(simulationData.collateral.machineryValue)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-600 dark:text-slate-400">Rebanho Semovente:</span>
                  <span className="font-mono font-semibold">{formatBRL(simulationData.collateral.livestockValue)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-600 dark:text-slate-400">Imóveis Urbanos & Frotas:</span>
                  <span className="font-mono font-semibold">
                    {formatBRL(simulationData.collateral.urbanTotal + simulationData.collateral.vehiclesTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 font-bold text-emerald-700 dark:text-emerald-400">
                  <span>Limite de Garantia Ofertável (MCR):</span>
                  <span className="font-mono text-sm">{formatBRL(simulationData.collateral.acceptableCollateral)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Demonstrativo de Fluxo de Caixa */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Fluxo de Caixa Operacional Anual
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-normal">
                    Margem Líquida: {formatBRL(simulationData.cashFlow.netMargin)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-600 dark:text-slate-400">Receita Agro (Efetiva/Histórica):</span>
                  <span className="font-mono font-semibold">{formatBRL(simulationData.cashFlow.effectiveAgroRevenue)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-600 dark:text-slate-400">Receita Agro (Projetada Safra):</span>
                  <span className="font-mono font-semibold">{formatBRL(simulationData.cashFlow.projectedAgroRevenue)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-600 dark:text-slate-400">Custos Operacionais & Insumos:</span>
                  <span className="font-mono font-semibold text-rose-600">
                    - {formatBRL(simulationData.cashFlow.operationalExpenses)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-600 dark:text-slate-400">Manutenção Familiar:</span>
                  <span className="font-mono font-semibold text-rose-600">
                    - {formatBRL(simulationData.cashFlow.familyLivingCosts)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-600 dark:text-slate-400">Dívidas Bancárias Vigentes:</span>
                  <span className="font-mono font-semibold text-rose-600">
                    - {formatBRL(simulationData.cashFlow.existingDebtService)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 font-bold">
                  <span>Capacidade de Pagamento Anual (CP):</span>
                  <span
                    className={`font-mono text-sm ${
                      simulationData.cashFlow.paymentCapacity >= 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {formatBRL(simulationData.cashFlow.paymentCapacity)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SIMULADOR DE CRÉDITO RURAL & ENQUADRAMENTO MCR */}
          <Card className="border-emerald-300 dark:border-emerald-800/80 shadow-md bg-gradient-to-b from-white via-slate-50/50 to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20">
            <CardHeader className="pb-3 border-b border-emerald-100 dark:border-emerald-900/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-[#1B4D3E] dark:text-emerald-400">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    Simulador Financeiro de Risco e Enquadramento MCR
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Motor Financeiro do Aditivo 003: Amortização bancária (PRICE vs. SAC), teste de estresse do ICSD (trava ≥ 1,20) e LTV de garantias.
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="bg-emerald-100 text-[#1B4D3E] border-emerald-300 text-[11px] font-bold px-2.5 py-0.5"
                >
                  Inteligência de Risco Bancário
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-6">
              {/* Seletor do Catálogo Oficial das 15 Linhas */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    Linha de Financiamento Oficial (Catálogo das 15 Linhas BB/Cooperativas)
                  </Label>
                  <span className="text-[10px] text-slate-500">MCR / Banco Central</span>
                </div>

                <Select
                  value={creditLineCode}
                  onValueChange={(code) => {
                    if (!code) return
                    const found = CREDIT_LINES_CATALOG.find((l) => l.code === code)
                    if (found) {
                      setCreditLineCode(found.code)
                      setTermMonths(found.defaultTermMonths)
                      setInterestRate(found.defaultInterestRate)
                      setGraceMonths(found.defaultGraceMonths)
                      setAmortizationSystem(found.axis === CreditLineAxis.INVESTIMENTO ? 'SAC' : 'PRICE')
                    }
                  }}
                >
                  <SelectTrigger className="h-10 text-xs bg-slate-50/60 dark:bg-slate-800/60 font-semibold border-slate-300">
                    <SelectValue placeholder="Selecione o programa de crédito..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[320px]">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
                      Eixo de Custeio Agropecuário
                    </div>
                    {CREDIT_LINES_CATALOG.filter((l) => l.axis === CreditLineAxis.CUSTEIO).map((line) => (
                      <SelectItem key={line.code} value={line.code} className="text-xs py-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{line.name}</span>
                        <span className="text-[10px] text-slate-500 block">
                          Taxa: {line.defaultInterestRate}% a.a. • Prazo: {line.defaultTermMonths}m • {line.mcrRef}
                        </span>
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400 mt-2">
                      Eixo de Investimento & Modernização
                    </div>
                    {CREDIT_LINES_CATALOG.filter((l) => l.axis === CreditLineAxis.INVESTIMENTO).map((line) => (
                      <SelectItem key={line.code} value={line.code} className="text-xs py-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{line.name}</span>
                        <span className="text-[10px] text-slate-500 block">
                          Taxa: {line.defaultInterestRate}% a.a. • Prazo: {line.defaultTermMonths}m • {line.mcrRef}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dados da Proposta: Finalidade & Banco Alvo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Finalidade do Crédito
                  </Label>
                  <Select
                    value={purpose}
                    onValueChange={(val) => {
                      if (val) setPurpose(val)
                    }}
                  >
                    <SelectTrigger className="text-xs h-9 bg-white dark:bg-slate-900">
                      <SelectValue placeholder="Selecione a finalidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {PURPOSE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Instituição Financeira Proponente
                  </Label>
                  <Select
                    value={targetBank}
                    onValueChange={(val) => {
                      if (val) setTargetBank(val)
                    }}
                  >
                    <SelectTrigger className="text-xs h-9 bg-white dark:bg-slate-900">
                      <SelectValue placeholder="Selecione o banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANK_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Inputs de Simulação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Valor Pretendido (R$) *
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={requestedAmount || ''}
                    onChange={(e) => setRequestedAmount(Number(e.target.value) || 0)}
                    className="text-xs h-9 font-mono font-bold bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sistema de Amortização
                  </Label>
                  <Select
                    value={amortizationSystem}
                    onValueChange={(val: any) => {
                      if (val) setAmortizationSystem(val)
                    }}
                  >
                    <SelectTrigger className="text-xs h-9 bg-white dark:bg-slate-900 font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRICE" className="text-xs">
                        PRICE (Prestação Fixa)
                      </SelectItem>
                      <SelectItem value="SAC" className="text-xs">
                        SAC (Amortização Constante)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Prazo Total (Meses)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={240}
                    value={termMonths || ''}
                    onChange={(e) => setTermMonths(Number(e.target.value) || 12)}
                    className="text-xs h-9 font-mono bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Carência (Meses)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    value={graceMonths}
                    onChange={(e) => setGraceMonths(Number(e.target.value) || 0)}
                    className="text-xs h-9 font-mono bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Taxa de Juros (% a.a.)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    step={0.25}
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value) || 8.0)}
                    className="text-xs h-9 font-mono bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* CARDS DE RESULTADOS EM TEMPO REAL: SERVIÇO DA DÍVIDA, ICSD E LTV */}
              {riskAnalysis && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Parcela Anual */}
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Parcela Anual do Serviço da Dívida
                      </span>
                      <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                        {formatBRL(riskAnalysis.amortization.annualDebtService)}
                      </div>
                      <span className="text-[10.5px] text-slate-500 mt-1 block">
                        {amortizationSystem === 'PRICE' ? 'Prestação constante' : '1ª Parcela (Decrescente)'}
                      </span>
                    </div>

                    {/* Semáforo ICSD (Trava >= 1.20) */}
                    <div
                      className={`p-4 rounded-xl border shadow-2xs ${
                        riskAnalysis.icsd.isApproved
                          ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
                          : 'bg-rose-50/70 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          Índice ICSD (Corte ≥ 1,20)
                        </span>
                        <Badge
                          className={`text-[9px] font-bold px-1.5 py-0 ${
                            riskAnalysis.icsd.isApproved
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {riskAnalysis.icsd.isApproved ? 'Aprovado' : 'Reprovado'}
                        </Badge>
                      </div>
                      <div
                        className={`text-xl font-bold font-mono ${
                          riskAnalysis.icsd.isApproved
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {riskAnalysis.icsd.icsdValue.toFixed(2)}x
                      </div>
                      <span className="text-[10.5px] text-slate-500 mt-1 block">
                        CP de {formatBRL(riskAnalysis.icsd.paymentCapacity)}
                      </span>
                    </div>

                    {/* Cobertura de Garantia (LTV) */}
                    <div
                      className={`p-4 rounded-xl border shadow-2xs ${
                        riskAnalysis.ltv.isApproved
                          ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
                          : 'bg-rose-50/70 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          Cobertura de Garantia (LTV)
                        </span>
                        <Badge
                          className={`text-[9px] font-bold px-1.5 py-0 ${
                            riskAnalysis.ltv.isApproved
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {riskAnalysis.ltv.isApproved ? 'Adequado' : 'Insuficiente'}
                        </Badge>
                      </div>
                      <div
                        className={`text-xl font-bold font-mono ${
                          riskAnalysis.ltv.isApproved
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {riskAnalysis.ltv.coverageRatioPercent.toFixed(1)}%
                      </div>
                      <span className="text-[10.5px] text-slate-500 mt-1 block">
                        Garantias: {formatBRL(riskAnalysis.ltv.totalAcceptableCollateral)}
                      </span>
                    </div>
                  </div>

                  {/* PAINEL EXECUTIVO UNIFICADO: INTELIGÊNCIA CONSULTIVA & DIAGNÓSTICO PRESCRITIVO */}
                  <PrescriptiveActionCard
                    propertyId={selectedPropertyId}
                    requestedAmount={requestedAmount}
                    annualDebtService={riskAnalysis.amortization.annualDebtService}
                    paymentCapacity={riskAnalysis.icsd.paymentCapacity}
                    icsd={riskAnalysis.icsd.icsdValue}
                    ltvPercent={riskAnalysis.ltv.coverageRatioPercent}
                    totalCollateral={riskAnalysis.ltv.totalDeclaredCollateral}
                    acceptableCollateral={riskAnalysis.ltv.totalAcceptableCollateral}
                    creditLineName={CREDIT_LINES_CATALOG.find((l) => l.code === creditLineCode)?.name || creditLineCode}
                    termMonths={termMonths}
                    amortizationSystem={amortizationSystem}
                    purpose={purpose}
                    hasRevenues={
                      (simulationData.cashFlow.effectiveAgroRevenue || 0) > 0 ||
                      (simulationData.cashFlow.projectedAgroRevenue || 0) > 0 ||
                      (riskAnalysis.icsd.grossAgroRevenue || 0) > 0
                    }
                    isApproved={riskAnalysis.icsd.isApproved && riskAnalysis.ltv.isApproved}
                    overallStatus={riskAnalysis.overallStatus}
                    summaryOpinion={riskAnalysis.summaryOpinion}
                    regulatoryNotes={riskAnalysis.regulatoryNotes || []}
                    onSetAmortizationSystem={(sys) => setAmortizationSystem(sys)}
                    onSetTermMonths={(months) => setTermMonths(months)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
