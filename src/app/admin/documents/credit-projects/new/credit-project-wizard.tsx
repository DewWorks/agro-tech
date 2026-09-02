'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, 
  Printer, 
  Download, 
  ArrowLeft, 
  Loader2, 
  User, 
  MapPin, 
  Landmark, 
  CheckCircle2, 
  Sparkles,
  Settings2,
  RefreshCw,
  Check,
  ChevronsUpDown,
  AlertTriangle,
  Building2,
  Coins,
  ShieldCheck,
  Calendar,
  Save,
  Database
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { 
  resolveCreditProjectDocument, 
  saveCreditProjectData, 
  getSavedCreditProjectData 
} from '@/actions/credit-projects'
import { CreditTemplateMeta } from '@/lib/document-templates'

function formatCPF(v?: string) {
  if (!v) return ''
  const c = v.replace(/\D/g, '')
  if (c.length !== 11) return v
  return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatCNPJ(v?: string) {
  if (!v) return ''
  const c = v.replace(/\D/g, '')
  if (c.length !== 14) return v
  return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

interface CreditProjectWizardProps {
  producers: Array<{
    id: string
    name: string
    document: string
    type: string
    spouseName?: string | null
    spouseCpf?: string | null
    phone?: string | null
    properties: Array<{
      id: string
      name: string
      city?: string | null
      state?: string | null
      registrationNumber?: string | null
      registryOffice?: string | null
      car?: string | null
      ccir?: string | null
      itr?: string | null
      totalArea?: number
      productiveArea?: number
      pastureArea?: number
      preserveArea?: number
      explorationActivity?: string | null
      accessRoute?: string | null
    }>
  }>
  templates: CreditTemplateMeta[]
  defaultResponsibleName?: string
  defaultOrgName?: string
  defaultOrgCnpj?: string
}

export default function CreditProjectWizard({ 
  producers, 
  templates,
  defaultResponsibleName = '',
  defaultOrgName = '',
  defaultOrgCnpj = ''
}: CreditProjectWizardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTemplate = searchParams.get('template') || templates[0]?.code || 'CHECKLIST_PROFISSIONAL'

  // Filtrar estritamente produtores ativos
  const activeProducers = useMemo(() => {
    return producers.filter((p: any) => p.isActive !== false)
  }, [producers])

  const [selectedProducerId, setSelectedProducerId] = useState<string>(activeProducers[0]?.id || '')
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(activeProducers[0]?.properties[0]?.id || '')
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>(initialTemplate)

  // Combobox Popover states
  const [openProducer, setOpenProducer] = useState(false)
  const [openProperty, setOpenProperty] = useState(false)
  const [openTemplate, setOpenTemplate] = useState(false)
  
  // Custom options com ZERO dados mockados (tudo vazio/zero ou recuperado do banco de dados)
  const [customOptions, setCustomOptions] = useState({
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

  const [loading, setLoading] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isSaveDraftModalOpen, setIsSaveDraftModalOpen] = useState(false)

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

  const handleOpenSaveModal = () => {
    if (!selectedProducerId || !selectedTemplateCode) {
      toast.error('Selecione um produtor e um modelo antes de salvar.')
      return
    }
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

  const [generatedDoc, setGeneratedDoc] = useState<{
    html: string
    templateMeta: CreditTemplateMeta
    producerName: string
    propertyName: string
  } | null>(null)

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

    // Validação obrigatória dos dados fundiários do imóvel beneficiado (sem "Pendente" ou "0.00 ha")
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

  // Generate document on parameter changes with debounce
  const handleGenerate = async (optionsOverride?: typeof customOptions) => {
    if (!selectedProducerId || !selectedPropertyId || !selectedTemplateCode) {
      return
    }

    setLoading(true)
    try {
      const res = await resolveCreditProjectDocument(
        selectedProducerId,
        selectedPropertyId,
        selectedTemplateCode,
        optionsOverride || customOptions
      )
      setGeneratedDoc(res)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar documento.')
    } finally {
      setLoading(false)
    }
  }

  // Automatic live update as user types (400ms debounce)
  useEffect(() => {
    if (!selectedProducerId || !selectedPropertyId || !selectedTemplateCode) return

    const timer = setTimeout(() => {
      handleGenerate()
    }, 400)

    return () => clearTimeout(timer)
  }, [selectedProducerId, selectedPropertyId, selectedTemplateCode, customOptions])

  const contentRef = useRef<HTMLDivElement>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const handlePrintIsolated = () => {
    if (!generatedDoc) return
    const printWindow = window.open('', '_blank', 'width=900,height=1100')
    if (!printWindow) {
      toast.error('Por favor, permita pop-ups para abrir a impressão.')
      return
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${generatedDoc.templateMeta.title} - ${generatedDoc.producerName}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-family: 'Segoe UI', Arial, sans-serif;
              color: #1f2937;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .document-page {
              padding: 0 !important;
              max-width: 100% !important;
            }
          </style>
        </head>
        <body>
          ${generatedDoc.html}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownloadPdf = async () => {
    if (!contentRef.current || !generatedDoc) return
    setIsGeneratingPdf(true)
    const toastId = toast.loading('Compilando documento PDF oficial...')

    try {
      const html2pdf = (await import('html2pdf.js')).default
      const element = contentRef.current

      const sanitizedTitle = generatedDoc.templateMeta.title.replace(/[^a-zA-Z0-9]/g, '_')
      const sanitizedName = generatedDoc.producerName.replace(/[^a-zA-Z0-9]/g, '_')

      const opt = {
        margin: 6,
        filename: `${sanitizedTitle}_${sanitizedName}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          ignoreElements: (node: Element) => {
            const tag = node.tagName?.toLowerCase()
            return tag === 'style' || tag === 'link' || tag === 'noscript'
          },
          onclone: (clonedDoc: Document) => {
            clonedDoc.querySelectorAll('style, link').forEach(el => el.remove())
          }
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      }

      await html2pdf().set(opt).from(element).save()

      // Auto-salvar no banco de dados para reutilização posterior
      if (selectedProducerId && selectedTemplateCode) {
        saveCreditProjectData(selectedProducerId, selectedPropertyId, selectedTemplateCode, customOptions).catch(() => {})
      }

      toast.dismiss(toastId)
      toast.success('Documento PDF oficial gerado e baixado com sucesso!')
    } catch (err: any) {
      console.error('PDF error:', err)
      toast.dismiss(toastId)
      toast.error(err.message || 'Erro ao compilar o PDF.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleDownloadOriginalTemplate = () => {
    const url = `/api/credit-templates/download?code=${selectedTemplateCode}`
    window.open(url, '_blank')
    toast.success('Download do modelo base iniciado!')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/admin/documents/credit-projects">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              Gerador de Documentos & Projetos BB
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Selecione o produtor, imóvel e o modelo desejado para emitir o documento pré-preenchido.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {generatedDoc && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenSaveModal}
              disabled={isSavingDraft || !selectedProducerId}
              className="border-blue-300 text-blue-700 hover:bg-blue-50 flex items-center gap-1.5 text-xs font-semibold"
              title="Salvar alterações preenchidas para este projeto"
            >
              {isSavingDraft ? <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-700" /> : <Save className="h-3.5 w-3.5 text-blue-700" />}
              Salvar Dados
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadOriginalTemplate}
              className="border-emerald-300 text-[#1B4D3E] hover:bg-emerald-50 flex items-center gap-1.5 text-xs font-semibold"
              title="Baixar arquivo original Word/Excel de referência"
            >
              <Download className="h-3.5 w-3.5 text-[#1B4D3E]" />
              Baixar Template Base (.docx/.xls)
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handlePrintIsolated}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 text-xs font-semibold"
            >
              <Printer className="h-3.5 w-3.5 text-gray-500" />
              Imprimir (Página Limpa)
            </Button>

            <Button
              type="button"
              onClick={() => {
                if (!isFormValid) {
                  toast.error(`Atenção: ${validationErrors[0]}`)
                  return
                }
                setIsConfirmModalOpen(true)
              }}
              disabled={isGeneratingPdf || !isFormValid}
              className={cn(
                "flex items-center gap-2 text-xs font-bold shadow-xs px-4 transition-all",
                isFormValid 
                  ? "bg-[#1B4D3E] hover:bg-[#13382D] text-white cursor-pointer" 
                  : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
              )}
              title={!isFormValid ? `Preencha todos os campos obrigatórios (${validationErrors.length} pendente(s))` : 'Emitir Documento Oficial'}
            >
              {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {isGeneratingPdf ? 'Gerando PDF...' : 'Conferir e Emitir PDF'}
            </Button>
          </div>
        )}
      </div>

      {/* Main Grid: Control Panel (Left) & Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Config Panel */}
        <div className="lg:col-span-4 space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-2xs print:hidden">
          
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-[#1B4D3E]" />
              Parâmetros de Geração
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Vincule o produtor rural e a propriedade base.
            </p>
          </div>

          {/* 1. Seleção do Produtor (Com Busca e Filtro de Ativos) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-[#1B4D3E]" />
                1. Produtor Rural (Proponente) *
              </span>
              <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Apenas Ativos ({activeProducers.length})
              </span>
            </Label>
            <Popover open={openProducer} onOpenChange={setOpenProducer}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openProducer}
                    className="w-full justify-between font-normal text-left text-xs h-9 px-3 bg-white border-gray-200 hover:bg-gray-50 shadow-2xs"
                  />
                }
              >
                <span className="truncate">
                  {currentProducer
                    ? `${currentProducer.name} (${currentProducer.type})`
                    : "Buscar e selecionar produtor..."}
                </span>
                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0 shadow-lg border-gray-200" align="start">
                <Command>
                  <CommandInput placeholder="Buscar produtor por nome ou CPF/CNPJ..." className="text-xs" />
                  <CommandList className="max-h-[260px]">
                    <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                      Nenhum produtor ativo encontrado.
                    </CommandEmpty>
                    <CommandGroup>
                      {activeProducers.map((prod) => {
                        const cmdValue = `${prod.name} ${prod.document || ''} ${prod.type} | ${prod.id}`
                        const isSelected = selectedProducerId === prod.id
                        return (
                          <CommandItem
                            key={prod.id}
                            value={cmdValue}
                            onSelect={() => {
                              setSelectedProducerId(prod.id)
                              setOpenProducer(false)
                            }}
                            className="text-xs flex items-center justify-between py-2 cursor-pointer"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Check
                                className={cn(
                                  "h-3.5 w-3.5 text-[#1B4D3E]",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="truncate">
                                <p className="font-medium text-gray-900 truncate">{prod.name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {prod.document} • {prod.type}
                                </p>
                              </div>
                            </div>
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* 2. Seleção da Propriedade (Com Busca) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#1B4D3E]" />
                2. Propriedade / Imóvel Beneficiado *
              </span>
              {availableProperties.length > 0 && (
                <span className="text-[10px] text-gray-500">
                  {availableProperties.length} vinculada(s)
                </span>
              )}
            </Label>
            {availableProperties.length === 0 ? (
              <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-xs border border-amber-200">
                Este produtor não possui propriedades rurais vinculadas.
              </div>
            ) : (
              <Popover open={openProperty} onOpenChange={setOpenProperty}>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openProperty}
                      className="w-full justify-between font-normal text-left text-xs h-9 px-3 bg-white border-gray-200 hover:bg-gray-50 shadow-2xs"
                    />
                  }
                >
                  <span className="truncate">
                    {currentProperty
                      ? `${currentProperty.name}${currentProperty.registrationNumber ? ` (Matr. ${currentProperty.registrationNumber})` : ''}`
                      : "Buscar e selecionar propriedade..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0 shadow-lg border-gray-200" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar por nome, matrícula ou município..." className="text-xs" />
                    <CommandList className="max-h-[260px]">
                      <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                        Nenhuma propriedade encontrada.
                      </CommandEmpty>
                      <CommandGroup>
                        {availableProperties.map((prop) => {
                          const cmdValue = `${prop.name} ${prop.registrationNumber || ''} ${prop.city || ''} ${prop.state || ''} | ${prop.id}`
                          const isSelected = selectedPropertyId === prop.id
                          return (
                            <CommandItem
                              key={prop.id}
                              value={cmdValue}
                              onSelect={() => {
                                setSelectedPropertyId(prop.id)
                                setOpenProperty(false)
                              }}
                              className="text-xs flex items-center justify-between py-2 cursor-pointer"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Check
                                  className={cn(
                                    "h-3.5 w-3.5 text-[#1B4D3E]",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="truncate">
                                  <p className="font-medium text-gray-900 truncate">{prop.name}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {prop.registrationNumber ? `Matr. ${prop.registrationNumber}` : 'Sem matrícula'}
                                    {prop.city ? ` • ${prop.city}/${prop.state || ''}` : ''}
                                    {prop.totalArea ? ` • ${prop.totalArea} ha` : ''}
                                  </p>
                                </div>
                              </div>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Dados Fundiários & Cadastrais do Imóvel Beneficiado */}
          {selectedPropertyId && (
            <div className="p-3 bg-slate-50/80 border border-gray-200 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#1B4D3E]" />
                  Dados Fundiários do Imóvel
                </span>
                {(!customOptions.propertyRegistrationNumber?.trim() || !customOptions.propertyCar?.trim() || !customOptions.propertyTotalArea || !customOptions.propertyAccessRoute?.trim() || !customOptions.propertyActivity?.trim()) ? (
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Pendências Cadastrais
                  </span>
                ) : (
                  <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Imóvel Regular
                  </span>
                )}
              </div>

              {(!customOptions.propertyRegistrationNumber?.trim() || !customOptions.propertyCar?.trim() || !customOptions.propertyTotalArea || !customOptions.propertyAccessRoute?.trim() || !customOptions.propertyActivity?.trim()) && (
                <p className="text-[10px] text-amber-800 bg-amber-50/90 p-2 rounded border border-amber-200 leading-tight">
                  ⚠️ Preencha os dados fundiários pendentes abaixo para regularizar e emitir o documento oficial:
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Matrícula / Registro *</Label>
                  <Input
                    value={customOptions.propertyRegistrationNumber}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyRegistrationNumber: e.target.value }))}
                    className={cn("h-8 text-xs", !customOptions.propertyRegistrationNumber?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
                    placeholder="Ex: 12.345"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Cartório de Registro (CRI)</Label>
                  <Input
                    value={customOptions.propertyRegistryOffice}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyRegistryOffice: e.target.value }))}
                    className="h-8 text-xs"
                    placeholder="Ex: CRI de Palmas - TO"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Nº do CAR (Recibo) *</Label>
                  <Input
                    value={customOptions.propertyCar}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyCar: e.target.value }))}
                    className={cn("h-8 text-xs", !customOptions.propertyCar?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
                    placeholder="Ex: TO-1700000-XXXXXXXX"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Área Total do Imóvel (ha) *</Label>
                  <Input
                    type="number"
                    value={customOptions.propertyTotalArea || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyTotalArea: Number(e.target.value) }))}
                    className={cn("h-8 text-xs", (!customOptions.propertyTotalArea || Number(customOptions.propertyTotalArea) <= 0) && "border-amber-400 focus-visible:ring-amber-400")}
                    placeholder="Ex: 1500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10.5px] text-gray-600">Atividade Principal do Imóvel *</Label>
                <Input
                  value={customOptions.propertyActivity}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyActivity: e.target.value }))}
                  className={cn("h-8 text-xs", !customOptions.propertyActivity?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
                  placeholder="Ex: Pecuária de Corte e Cria"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10.5px] text-gray-600">Roteiro de Acesso à Propriedade *</Label>
                <Input
                  value={customOptions.propertyAccessRoute}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyAccessRoute: e.target.value }))}
                  className={cn("h-8 text-xs", !customOptions.propertyAccessRoute?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
                  placeholder="Ex: Partindo de Palmas pela TO-050 por 45km..."
                />
              </div>
            </div>
          )}

          {/* 3. Seleção do Modelo (Com Busca) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5 text-[#1B4D3E]" />
                3. Modelo Oficial Banco do Brasil *
              </span>
              <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Padrão BB / SICOR
              </span>
            </Label>
            <Popover open={openTemplate} onOpenChange={setOpenTemplate}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openTemplate}
                    className="w-full justify-between font-medium text-left text-xs h-9 px-3 bg-white border-gray-200 hover:bg-gray-50 shadow-2xs"
                  />
                }
              >
                <span className="truncate">
                  {currentTemplate ? currentTemplate.title : "Buscar e selecionar modelo..."}
                </span>
                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0 shadow-lg border-gray-200" align="start">
                <Command>
                  <CommandInput placeholder="Buscar modelo (ex: Checklist, Custeio, RenovAgro...)" className="text-xs" />
                  <CommandList className="max-h-[280px]">
                    <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                      Nenhum modelo encontrado.
                    </CommandEmpty>
                    <CommandGroup>
                      {templates.map((tmpl) => {
                        const cmdValue = `${tmpl.title} ${tmpl.category} ${tmpl.description || ''} | ${tmpl.code}`
                        const isSelected = selectedTemplateCode === tmpl.code
                        return (
                          <CommandItem
                            key={tmpl.code}
                            value={cmdValue}
                            onSelect={() => {
                              setSelectedTemplateCode(tmpl.code)
                              setOpenTemplate(false)
                            }}
                            className="text-xs flex items-center justify-between py-2 cursor-pointer"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Check
                                className={cn(
                                  "h-3.5 w-3.5 text-[#1B4D3E]",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="truncate">
                                <p className="font-medium text-gray-900 truncate">{tmpl.title}</p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {tmpl.category} • {tmpl.bank}
                                </p>
                              </div>
                            </div>
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* 4. Parâmetros Específicos por Modelo */}
          {selectedTemplateCode === 'LIMITE_CREDITO_BB' && (
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                  Parâmetros Patrimoniais & Finanças
                </span>
                <span className="text-[10px] text-muted-foreground">Ficha Cadastral</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Terra Nua (R$ / ha)</Label>
                  <Input
                    type="number"
                    value={customOptions.estimatedLandValuePerHa || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, estimatedLandValuePerHa: Number(e.target.value) }))}
                    className="h-8 text-xs"
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Benfeitorias (R$)</Label>
                  <Input
                    type="number"
                    value={customOptions.improvementsValue || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, improvementsValue: Number(e.target.value) }))}
                    className="h-8 text-xs"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Máquinas (R$)</Label>
                  <Input
                    type="number"
                    value={customOptions.machineryValue || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, machineryValue: Number(e.target.value) }))}
                    className="h-8 text-xs"
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Receita Bruta Anual (R$)</Label>
                  <Input
                    type="number"
                    value={customOptions.annualRevenue || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, annualRevenue: Number(e.target.value) }))}
                    className="h-8 text-xs"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Custos / Despesas (R$)</Label>
                  <Input
                    type="number"
                    value={customOptions.annualExpenses || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, annualExpenses: Number(e.target.value) }))}
                    className="h-8 text-xs"
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Dívidas SCR / BACEN (R$)</Label>
                  <Input
                    type="number"
                    value={customOptions.existingDebts || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, existingDebts: Number(e.target.value) }))}
                    className="h-8 text-xs"
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedTemplateCode === 'PROJETO_INOVAGRO' && (
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                  Parâmetros do InovAgro
                </span>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  Investimento Tecnológico
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10.5px] text-gray-700 font-medium">Equipamento / Objeto *</Label>
                  <span className={cn(
                    "text-[9.5px] font-medium px-1.5 py-0.2 rounded border",
                    customOptions.inovagroEquipment?.trim()
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : "text-amber-700 bg-amber-50 border-amber-200 font-bold"
                  )}>
                    {customOptions.inovagroEquipment?.trim() ? 'Preenchido' : 'Obrigatório'}
                  </span>
                </div>
                <Input
                  value={customOptions.inovagroEquipment}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroEquipment: e.target.value }))}
                  className={cn("h-8 text-xs", !customOptions.inovagroEquipment?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
                  placeholder="Selecione abaixo ou digite..."
                />
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {[
                    'Gerador Solar Fotovoltaico On-Grid',
                    'Trator Agrícola com Piloto Automático',
                    'Sistema de Irrigação Automatizado',
                    'Estação Meteorológica e Sensores'
                  ].map((eq) => (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => setCustomOptions(prev => ({ ...prev, inovagroEquipment: eq }))}
                      className={cn(
                        "text-[9.5px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer text-left",
                        customOptions.inovagroEquipment === eq
                          ? "bg-emerald-100 text-[#1B4D3E] border-emerald-300 font-semibold"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:text-[#1B4D3E]"
                      )}
                    >
                      {eq.split('com')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10.5px] text-gray-600">Especificação Técnica</Label>
                <Input
                  value={customOptions.inovagroSpec}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroSpec: e.target.value }))}
                  className="h-8 text-xs"
                  placeholder="Ex: Módulos Monocristalinos Tier-1 + Inversor"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Potência (kWp)</Label>
                  <Input
                    type="number"
                    value={customOptions.inovagroPower || ''}
                    onChange={(e) => {
                      const power = Number(e.target.value)
                      setCustomOptions(prev => ({
                        ...prev,
                        inovagroPower: power,
                        inovagroMonthlySavings: power > 0 ? Math.round(power * 135 * 0.95) : prev.inovagroMonthlySavings
                      }))
                    }}
                    className="h-8 text-xs"
                    placeholder="Ex: 45"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">CNAE BNDES</Label>
                  <Input
                    value={customOptions.inovagroCnae}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroCnae: e.target.value }))}
                    className="h-8 text-xs"
                    placeholder="Ex: 01.50-1/00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10.5px] font-semibold text-gray-800">Investimento Total (R$)</Label>
                  <Input
                    type="number"
                    value={customOptions.inovagroTotalInvestment || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setCustomOptions(prev => ({
                        ...prev,
                        inovagroTotalInvestment: val,
                        inovagroFinanced: Math.round(val * 0.9),
                        inovagroOwnResources: Math.round(val * 0.1)
                      }))
                    }}
                    className="h-8 text-xs font-semibold"
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Financiamento (R$)</Label>
                  <Input
                    type="number"
                    value={customOptions.inovagroFinanced || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroFinanced: Number(e.target.value) }))}
                    className="h-8 text-xs"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Recursos Próprios (R$)</Label>
                  <Input
                    type="number"
                    value={customOptions.inovagroOwnResources || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroOwnResources: Number(e.target.value) }))}
                    className="h-8 text-xs"
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Economia Mensal (R$)</Label>
                  <Input
                    type="number"
                    value={customOptions.inovagroMonthlySavings || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroMonthlySavings: Number(e.target.value) }))}
                    className="h-8 text-xs"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-medium">Condições Financeiras *</span>
                  <button
                    type="button"
                    onClick={() => setCustomOptions(prev => ({
                      ...prev,
                      inovagroTermYears: 10,
                      inovagroGraceMonths: 24,
                      inovagroInterestRate: 12.5
                    }))}
                    className="text-[9.5px] text-emerald-700 hover:underline cursor-pointer font-medium"
                  >
                    Usar padrão (10a / 24m / 12.5%)
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-gray-600">Prazo (anos) *</Label>
                    <Input
                      type="number"
                      value={customOptions.inovagroTermYears || ''}
                      onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroTermYears: Number(e.target.value) }))}
                      className="h-8 text-xs"
                      placeholder="Ex: 10"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-gray-600">Carência (m)</Label>
                    <Input
                      type="number"
                      value={customOptions.inovagroGraceMonths || ''}
                      onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroGraceMonths: Number(e.target.value) }))}
                      className="h-8 text-xs"
                      placeholder="Ex: 24"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-gray-600">Juros (% a.a.) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={customOptions.inovagroInterestRate || ''}
                      onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroInterestRate: Number(e.target.value) }))}
                      className="h-8 text-xs"
                      placeholder="Ex: 12.5"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTemplateCode === 'PROJETO_RENOVAGRO' && (
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                  Parâmetros do RenovAgro
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Recuperação Sustentável
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10.5px] text-gray-700 font-medium">Sublinha do Programa *</Label>
                  <span className={cn(
                    "text-[9.5px] font-medium px-1.5 py-0.2 rounded border",
                    customOptions.renovagroSubline?.trim()
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : "text-amber-700 bg-amber-50 border-amber-200 font-bold"
                  )}>
                    {customOptions.renovagroSubline?.trim() ? 'Preenchido' : 'Obrigatório'}
                  </span>
                </div>
                <Input
                  value={customOptions.renovagroSubline}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, renovagroSubline: e.target.value }))}
                  className={cn("h-8 text-xs", !customOptions.renovagroSubline?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
                  placeholder="Selecione abaixo ou digite..."
                />
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {[
                    'Recuperação de Pastagens Degradadas (MCR 11.7.1.c.I)',
                    'Integração Lavoura-Pecuária-Floresta (ILPF)',
                    'Sistemas Agroflorestais (SAF)',
                    'Manejo de Solo e Água'
                  ].map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setCustomOptions(prev => ({ ...prev, renovagroSubline: sub }))}
                      className={cn(
                        "text-[9.5px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer text-left",
                        customOptions.renovagroSubline === sub
                          ? "bg-emerald-100 text-[#1B4D3E] border-emerald-300 font-semibold"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:text-[#1B4D3E]"
                      )}
                    >
                      {sub.startsWith('Recuperação') ? 'Recup. de Pastagens' : sub.split('(')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Área a Recuperar (ha) *</Label>
                  <Input
                    type="number"
                    value={customOptions.renovagroAreaHa || ''}
                    onChange={(e) => {
                      const area = Number(e.target.value)
                      setCustomOptions(prev => {
                        const cost = prev.renovagroCostPerHa || 3500
                        const total = area * cost
                        return {
                          ...prev,
                          renovagroAreaHa: area,
                          renovagroCostPerHa: cost,
                          renovagroTotalInvestment: total,
                          renovagroFinanced: Math.round(total * 0.9),
                          renovagroOwnResources: Math.round(total * 0.1)
                        }
                      })
                    }}
                    className="h-8 text-xs"
                    placeholder="Ex: 50"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Custo / ha (R$) *</Label>
                  <Input
                    type="number"
                    value={customOptions.renovagroCostPerHa || ''}
                    onChange={(e) => {
                      const cost = Number(e.target.value)
                      setCustomOptions(prev => {
                        const total = prev.renovagroAreaHa * cost
                        return {
                          ...prev,
                          renovagroCostPerHa: cost,
                          renovagroTotalInvestment: total,
                          renovagroFinanced: Math.round(total * 0.9),
                          renovagroOwnResources: Math.round(total * 0.1)
                        }
                      })
                    }}
                    className="h-8 text-xs"
                    placeholder="Ex: 3500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10.5px] font-semibold text-gray-800">Investimento Total (R$) *</Label>
                  <Input
                    type="number"
                    value={customOptions.renovagroTotalInvestment || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setCustomOptions(prev => ({
                        ...prev,
                        renovagroTotalInvestment: val,
                        renovagroFinanced: Math.round(val * 0.9),
                        renovagroOwnResources: Math.round(val * 0.1)
                      }))
                    }}
                    className="h-8 text-xs font-semibold"
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Financiamento (R$) *</Label>
                  <Input
                    type="number"
                    value={customOptions.renovagroFinanced || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, renovagroFinanced: Number(e.target.value) }))}
                    className="h-8 text-xs"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-medium">Condições Financeiras *</span>
                  <button
                    type="button"
                    onClick={() => setCustomOptions(prev => ({
                      ...prev,
                      renovagroTermYears: 8,
                      renovagroGraceMonths: 24,
                      renovagroInterestRate: 10.5
                    }))}
                    className="text-[9.5px] text-emerald-700 hover:underline cursor-pointer font-medium"
                  >
                    Usar padrão (8a / 24m / 10.5%)
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-gray-600">Prazo (anos) *</Label>
                    <Input
                      type="number"
                      value={customOptions.renovagroTermYears || ''}
                      onChange={(e) => setCustomOptions(prev => ({ ...prev, renovagroTermYears: Number(e.target.value) }))}
                      className="h-8 text-xs"
                      placeholder="Ex: 8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-gray-600">Carência (m)</Label>
                    <Input
                      type="number"
                      value={customOptions.renovagroGraceMonths || ''}
                      onChange={(e) => setCustomOptions(prev => ({ ...prev, renovagroGraceMonths: Number(e.target.value) }))}
                      className="h-8 text-xs"
                      placeholder="Ex: 24"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-gray-600">Juros (% a.a.) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={customOptions.renovagroInterestRate || ''}
                      onChange={(e) => setCustomOptions(prev => ({ ...prev, renovagroInterestRate: Number(e.target.value) }))}
                      className="h-8 text-xs"
                      placeholder="Ex: 10.5"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTemplateCode === 'PROJETO_CUSTEIO_SAFRA' && (
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                  Parâmetros de Custeio
                </span>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  Safra & Orçamento
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Ano Safra *</Label>
                  <Input
                    value={customOptions.custeioSafraYear}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, custeioSafraYear: e.target.value }))}
                    className="h-8 text-xs"
                    placeholder="Ex: 2026/2027"
                  />
                  <div className="flex gap-1 pt-0.5">
                    {['2025/2026', '2026/2027'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCustomOptions(prev => ({ ...prev, custeioSafraYear: s }))}
                        className="text-[9px] px-1 py-0.2 rounded bg-gray-100 hover:bg-blue-50 text-gray-700 border border-gray-200 cursor-pointer"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Cultura / Atividade *</Label>
                  <Input
                    value={customOptions.custeioCropName}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, custeioCropName: e.target.value }))}
                    className="h-8 text-xs"
                    placeholder="Ex: Soja Grão, Milho"
                  />
                  <div className="flex gap-1 pt-0.5">
                    {['Soja Grão', 'Milho', 'Bovinocultura'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCustomOptions(prev => ({ ...prev, custeioCropName: c }))}
                        className="text-[9px] px-1 py-0.2 rounded bg-gray-100 hover:bg-blue-50 text-gray-700 border border-gray-200 cursor-pointer"
                      >
                        + {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Área de Plantio (ha) *</Label>
                  <Input
                    type="number"
                    value={customOptions.custeioAreaHa || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, custeioAreaHa: Number(e.target.value) }))}
                    className="h-8 text-xs"
                    placeholder="Ex: 100"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Custo / ha (R$) *</Label>
                  <Input
                    type="number"
                    value={customOptions.custeioCostPerHa || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, custeioCostPerHa: Number(e.target.value) }))}
                    className="h-8 text-xs"
                    placeholder="Ex: 3850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-600">Produtividade (sc/ha) *</Label>
                  <Input
                    type="number"
                    value={customOptions.custeioExpectedYield || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, custeioExpectedYield: Number(e.target.value) }))}
                    className="h-8 text-xs"
                    placeholder="Ex: 62"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-600">Preço / Saca (R$) *</Label>
                  <Input
                    type="number"
                    value={customOptions.custeioPricePerUnit || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, custeioPricePerUnit: Number(e.target.value) }))}
                    className="h-8 text-xs"
                    placeholder="Ex: 128"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-600">Juros (% a.a.) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={customOptions.custeioInterestRate || ''}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, custeioInterestRate: Number(e.target.value) }))}
                    className="h-8 text-xs"
                    placeholder="Ex: 8.0"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedTemplateCode === 'CHECKLIST_PROFISSIONAL' && (
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                  Parâmetros do Atendimento
                </span>
                <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                  Esteira & Dossiê
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Instituição Financeira</Label>
                  <Input
                    value={customOptions.targetBank}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, targetBank: e.target.value }))}
                    className="h-8 text-xs"
                    placeholder="Banco do Brasil"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10.5px] text-gray-600">Finalidade Principal</Label>
                  <Input
                    value={customOptions.purpose}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, purpose: e.target.value }))}
                    className="h-8 text-xs"
                    placeholder="Custeio / Investimento"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. Responsável Técnico */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              Responsável Técnico & Dados
            </span>
            
            <div className="space-y-1">
              <Label className="text-[11px] text-gray-600">Responsável Técnico (Owner da Organização)</Label>
              <Input
                value={customOptions.responsibleName}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, responsibleName: e.target.value }))}
                className="h-8 text-xs"
                placeholder="Nome do Responsável Técnico"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-gray-600">Nº do CREA</Label>
                <Input
                  value={customOptions.creaNumber}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, creaNumber: e.target.value }))}
                  className="h-8 text-xs"
                  placeholder="Ex: CREA/TO 12345-D"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-gray-600">Nº da ART/TRT</Label>
                <Input
                  value={customOptions.artNumber}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, artNumber: e.target.value }))}
                  className="h-8 text-xs"
                  placeholder="Ex: ART 2026/0987654"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenSaveModal()}
                disabled={isSavingDraft || !selectedProducerId}
                className="w-full text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
              >
                {isSavingDraft ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                Salvar Dados
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleGenerate()}
                disabled={loading}
                className="w-full text-xs text-[#1B4D3E] border-[#1B4D3E]/30 hover:bg-emerald-50"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                Atualizar
              </Button>
            </div>

            {/* Status de Validação dos Parâmetros */}
            <div className="pt-2">
              {!isFormValid ? (
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-lg text-amber-900 text-xs space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Campos pendentes para emissão ({validationErrors.length})</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[10.5px] text-amber-800/90 pl-1">
                    {validationErrors.map((err, idx) => (
                      <li key={idx} className="leading-tight">{err}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Todos os parâmetros validados! Pronto para emissão.</span>
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={() => {
                if (!isFormValid) {
                  toast.error(`Atenção: ${validationErrors[0]}`)
                  return
                }
                setIsConfirmModalOpen(true)
              }}
              disabled={!isFormValid || isGeneratingPdf}
              className={cn(
                "w-full text-xs font-bold py-2.5 flex items-center justify-center gap-2 rounded-lg transition-all shadow-xs",
                isFormValid 
                  ? "bg-[#1B4D3E] hover:bg-[#13382D] text-white cursor-pointer" 
                  : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
              )}
            >
              {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Conferir e Emitir Documento
            </Button>
          </div>

        </div>

        {/* Right Live Preview Panel */}
        <div className="lg:col-span-8">
          
          <div className="bg-slate-100 p-3 sm:p-6 rounded-2xl border border-slate-200 overflow-x-auto min-h-[700px] flex flex-col items-center justify-start print:p-0 print:border-0 print:bg-white">
            
            {loading ? (
              <div className="py-32 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#1B4D3E]" />
                <p className="text-xs font-medium">Resolvendo variáveis e gerando documento institucional...</p>
              </div>
            ) : generatedDoc ? (
              <div className="w-full max-w-[800px] bg-white shadow-lg rounded-sm border border-gray-200 overflow-hidden print:shadow-none print:border-0 print:max-w-none print:w-full animate-in fade-in duration-200 flex justify-center">
                <div 
                  ref={contentRef}
                  id="printable-document"
                  style={{ 
                    width: '100%', 
                    backgroundColor: '#ffffff',
                    color: '#1f2937',
                    boxSizing: 'border-box'
                  }}
                  dangerouslySetInnerHTML={{ __html: generatedDoc.html }}
                />
              </div>
            ) : (
              <div className="py-32 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <FileText className="h-10 w-10 text-gray-300" />
                <p className="text-xs font-medium">Selecione um produtor e propriedade para exibir o documento.</p>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Modal de Confirmação e Conferência dos Dados Antes de Emitir */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-2xl">
          
          {/* Header */}
          <div className="p-6 bg-slate-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-[#1B4D3E]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  Conferência e Emissão do Projeto de Crédito
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-0.5">
                  Revise atentamente os dados oficiais antes de compilar o PDF definitivo para o Banco do Brasil / SICOR.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Cards Body */}
          <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh]">
            
            {/* Card 1: 👤 Proponente & Imóvel Beneficiado */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-2">
                <User className="h-4 w-4 text-[#1B4D3E]" />
                <span>Card 1 • Proponente & Imóvel Beneficiado</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 text-[11px] block">Proponente / Produtor:</span>
                  <p className="font-semibold text-gray-900">{currentProducer?.name || 'Não selecionado'}</p>
                  <p className="text-gray-600 text-[11px]">
                    {currentProducer?.document ? (currentProducer.type === 'PF' ? `CPF: ${formatCPF(currentProducer.document)}` : `CNPJ: ${formatCNPJ(currentProducer.document)}`) : ''}
                  </p>
                  {currentProducer?.phone && <p className="text-gray-500 text-[11px]">Tel: {currentProducer.phone}</p>}
                </div>

                <div>
                  <span className="text-gray-500 text-[11px] block">Imóvel Beneficiado:</span>
                  <p className="font-semibold text-gray-900">{currentProperty?.name || 'Não selecionado'}</p>
                  <p className="text-gray-600 text-[11px]">
                    {currentProperty?.city && currentProperty?.state ? `${currentProperty.city} - ${currentProperty.state}` : ''}
                    {customOptions.propertyTotalArea ? ` • Área: ${Number(customOptions.propertyTotalArea).toFixed(2)} ha` : ''}
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    Matrícula: {customOptions.propertyRegistrationNumber || 'Pendente'} {customOptions.propertyRegistryOffice ? `(${customOptions.propertyRegistryOffice})` : ''} • CAR: {customOptions.propertyCar || 'Pendente'}
                  </p>
                  <p className="text-gray-500 text-[10.5px]">
                    Atividade: {customOptions.propertyActivity || 'Não informada'}
                  </p>
                  <p className="text-gray-500 text-[10.5px] truncate">
                    Acesso: {customOptions.propertyAccessRoute || 'Não informado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: 📑 Modelo & Enquadramento Institucional */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-2">
                <Landmark className="h-4 w-4 text-[#1B4D3E]" />
                <span>Card 2 • Enquadramento & Modelo Oficial</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 text-[11px] block">Modelo Selecionado:</span>
                  <p className="font-semibold text-gray-900">{currentTemplate?.title || selectedTemplateCode}</p>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                    Padrão Banco do Brasil / SICOR
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 text-[11px] block">Finalidade / Sublinha:</span>
                  <p className="font-semibold text-gray-900">
                    {selectedTemplateCode === 'PROJETO_RENOVAGRO' && customOptions.renovagroSubline}
                    {selectedTemplateCode === 'PROJETO_INOVAGRO' && customOptions.inovagroEquipment}
                    {selectedTemplateCode === 'PROJETO_CUSTEIO_SAFRA' && `Safra ${customOptions.custeioSafraYear} - ${customOptions.custeioCropName}`}
                    {selectedTemplateCode === 'LIMITE_CREDITO_BB' && 'Levantamento Cadastral e Limite de Crédito'}
                    {selectedTemplateCode === 'CHECKLIST_PROFISSIONAL' && `${customOptions.purpose} (${customOptions.targetBank})`}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: 💰 Dimensionamento Físico & Finanças */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-2">
                <Coins className="h-4 w-4 text-[#1B4D3E]" />
                <span>Card 3 • Dimensionamento & Valores Financeiros</span>
              </div>

              {selectedTemplateCode === 'PROJETO_RENOVAGRO' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Área a Recuperar:</span>
                    <p className="font-bold text-gray-900 text-sm">{customOptions.renovagroAreaHa} ha</p>
                    <span className="text-gray-400 text-[10px]">Custo: R$ {customOptions.renovagroCostPerHa}/ha</span>
                  </div>
                  <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-emerald-700 text-[10.5px] block font-medium">Investimento Total:</span>
                    <p className="font-bold text-emerald-900 text-sm">R$ {Number(customOptions.renovagroTotalInvestment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Financiamento:</span>
                    <p className="font-bold text-gray-900 text-sm">R$ {Number(customOptions.renovagroFinanced).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Prazo & Carência:</span>
                    <p className="font-bold text-gray-900">{customOptions.renovagroTermYears} anos • {customOptions.renovagroGraceMonths}m</p>
                    <span className="text-gray-400 text-[10px]">Juros: {customOptions.renovagroInterestRate}% a.a.</span>
                  </div>
                </div>
              )}

              {selectedTemplateCode === 'PROJETO_INOVAGRO' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Potência / Capacidade:</span>
                    <p className="font-bold text-gray-900 text-sm">{customOptions.inovagroPower} kWp</p>
                    <span className="text-gray-400 text-[10px]">CNAE: {customOptions.inovagroCnae || 'N/I'}</span>
                  </div>
                  <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-emerald-700 text-[10.5px] block font-medium">Investimento Total:</span>
                    <p className="font-bold text-emerald-900 text-sm">R$ {Number(customOptions.inovagroTotalInvestment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Financiamento:</span>
                    <p className="font-bold text-gray-900 text-sm">R$ {Number(customOptions.inovagroFinanced).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Prazo & Carência:</span>
                    <p className="font-bold text-gray-900">{customOptions.inovagroTermYears} anos • {customOptions.inovagroGraceMonths}m</p>
                    <span className="text-gray-400 text-[10px]">Juros: {customOptions.inovagroInterestRate}% a.a.</span>
                  </div>
                </div>
              )}

              {selectedTemplateCode === 'PROJETO_CUSTEIO_SAFRA' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Área & Cultura:</span>
                    <p className="font-bold text-gray-900 text-sm">{customOptions.custeioAreaHa} ha</p>
                    <span className="text-gray-400 text-[10px]">{customOptions.custeioCropName}</span>
                  </div>
                  <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-emerald-700 text-[10.5px] block font-medium">Orçamento Financiado:</span>
                    <p className="font-bold text-emerald-900 text-sm">R$ {(customOptions.custeioAreaHa * customOptions.custeioCostPerHa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Produtividade Esperada:</span>
                    <p className="font-bold text-gray-900 text-sm">{customOptions.custeioExpectedYield} sc/ha</p>
                    <span className="text-gray-400 text-[10px]">Preço: R$ {customOptions.custeioPricePerUnit}/sc</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Taxa de Juros:</span>
                    <p className="font-bold text-gray-900 text-sm">{customOptions.custeioInterestRate}% a.a.</p>
                    <span className="text-gray-400 text-[10px]">Custo: R$ {customOptions.custeioCostPerHa}/ha</span>
                  </div>
                </div>
              )}

              {selectedTemplateCode === 'LIMITE_CREDITO_BB' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Cotação Terra (R$/ha):</span>
                    <p className="font-bold text-gray-900">R$ {Number(customOptions.estimatedLandValuePerHa).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Benfeitorias & Máquinas:</span>
                    <p className="font-bold text-gray-900">R$ {(Number(customOptions.improvementsValue) + Number(customOptions.machineryValue)).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-emerald-700 text-[10.5px] block font-medium">Receita Bruta Anual:</span>
                    <p className="font-bold text-emerald-900">R$ {Number(customOptions.annualRevenue).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Dívidas SCR / BACEN:</span>
                    <p className="font-bold text-gray-900">R$ {Number(customOptions.existingDebts).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              )}

              {selectedTemplateCode === 'CHECKLIST_PROFISSIONAL' && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Banco Destinatário:</span>
                    <p className="font-bold text-gray-900">{customOptions.targetBank}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Operação:</span>
                    <p className="font-bold text-gray-900">{customOptions.purpose}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Card 4: ✍️ Responsabilidade Técnica & Elaboração */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-2">
                <Building2 className="h-4 w-4 text-[#1B4D3E]" />
                <span>Card 4 • Responsabilidade Técnica & Elaboração</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 text-[11px] block">Responsável Técnico (Owner):</span>
                  <p className="font-semibold text-gray-900">{customOptions.responsibleName}</p>
                  <p className="text-gray-600 text-[11px]">
                    Registro: {customOptions.creaNumber} • ART/TRT: {customOptions.artNumber}
                  </p>
                </div>

                <div>
                  <span className="text-gray-500 text-[11px] block">Consultoria / Organização:</span>
                  <p className="font-semibold text-gray-900">{defaultOrgName || 'Organização'}</p>
                  {defaultOrgCnpj && <p className="text-gray-600 text-[11px]">CNPJ: {formatCNPJ(defaultOrgCnpj)}</p>}
                  <p className="text-gray-500 text-[11px]">Emissão Oficial em Conformidade com as Normas do Crédito Rural</p>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-gray-200 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmModalOpen(false)}
              className="text-xs"
            >
              Voltar para Ajustar
            </Button>

            <Button
              type="button"
              onClick={async () => {
                setIsConfirmModalOpen(false)
                await handleDownloadPdf()
              }}
              disabled={isGeneratingPdf}
              className="bg-[#1B4D3E] hover:bg-[#13382D] text-white flex items-center gap-2 text-xs font-bold shadow-xs px-5"
            >
              {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Confirmar e Emitir PDF Oficial
            </Button>
          </div>

        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Gravação Permanente no Cadastro */}
      <Dialog open={isSaveDraftModalOpen} onOpenChange={setIsSaveDraftModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-2xl">
          {/* Header */}
          <div className="p-6 bg-slate-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                <Save className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  Confirmar Gravação Permanente no Cadastro
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-0.5">
                  Esta ação gravará os dados preenchidos diretamente no cadastro permanente do Produtor Rural e da Propriedade Rural, além de atualizar o rascunho oficial deste documento.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh]">
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
              <Database className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Atualização Simultânea da Base Oficial</p>
                <p className="text-[11px] text-blue-800/90 mt-0.5">
                  Os dados listados abaixo serão sincronizados com as páginas oficiais de cadastro do cliente e do imóvel rural, ficando disponíveis permanentemente para novos contratos, projetos e consultas no sistema.
                </p>
              </div>
            </div>

            {/* Card 1: 🏡 Propriedade Rural */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wide">
                  <MapPin className="h-4 w-4 text-[#1B4D3E]" />
                  Propriedade Rural • {currentProperty?.name || 'Imóvel'}
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                  Salvo na Página do Imóvel
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 text-[10.5px] block">Matrícula / Registro:</span>
                  <p className="font-semibold text-gray-900">{customOptions.propertyRegistrationNumber || 'Pendente'}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[10.5px] block">Cartório de Imóveis (CRI):</span>
                  <p className="font-semibold text-gray-900">{customOptions.propertyRegistryOffice || 'Não informado'}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[10.5px] block">Nº do CAR (Recibo):</span>
                  <p className="font-semibold text-gray-900">{customOptions.propertyCar || 'Pendente'}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[10.5px] block">Área Total do Imóvel:</span>
                  <p className="font-semibold text-gray-900">{customOptions.propertyTotalArea ? `${customOptions.propertyTotalArea} ha` : '0.00 ha'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 text-[10.5px] block">Atividade Principal do Imóvel:</span>
                  <p className="font-semibold text-gray-900">{customOptions.propertyActivity || 'Não informada'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 text-[10.5px] block">Roteiro de Acesso à Propriedade:</span>
                  <p className="font-semibold text-gray-900 text-[11.5px]">{customOptions.propertyAccessRoute || 'Não informado'}</p>
                </div>
              </div>
            </div>

            {/* Card 2: 👤 Produtor Rural */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wide">
                  <User className="h-4 w-4 text-[#1B4D3E]" />
                  Produtor Rural • {currentProducer?.name || 'Cliente'}
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                  Salvo na Página do Produtor
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 text-[10.5px] block">Documento Oficial:</span>
                  <p className="font-semibold text-gray-900">
                    {currentProducer?.document ? (currentProducer.type === 'PF' ? `CPF: ${formatCPF(currentProducer.document)}` : `CNPJ: ${formatCNPJ(currentProducer.document)}`) : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-[10.5px] block">Telefone de Contato:</span>
                  <p className="font-semibold text-gray-900">{currentProducer?.phone || 'Não informado'}</p>
                </div>
              </div>
            </div>

            {/* Card 3: 📋 Parâmetros Técnicos do Documento */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wide">
                  <FileText className="h-4 w-4 text-[#1B4D3E]" />
                  Parâmetros do Modelo • {currentTemplate?.title}
                </span>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                  Salvo no Rascunho Oficial
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {selectedTemplateCode === 'PROJETO_RENOVAGRO' && (
                  <>
                    <div className="col-span-2">
                      <span className="text-gray-500 text-[10.5px] block">Sublinha do Programa:</span>
                      <p className="font-semibold text-gray-900">{customOptions.renovagroSubline || 'Não informada'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10.5px] block">Área a Recuperar:</span>
                      <p className="font-semibold text-gray-900">{customOptions.renovagroAreaHa} ha</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10.5px] block">Investimento Total:</span>
                      <p className="font-semibold text-gray-900">R$ {Number(customOptions.renovagroTotalInvestment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10.5px] block">Financiamento Solicitado:</span>
                      <p className="font-semibold text-gray-900">R$ {Number(customOptions.renovagroFinanced).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10.5px] block">Condições Financeiras:</span>
                      <p className="font-semibold text-gray-900">{customOptions.renovagroTermYears} anos • {customOptions.renovagroGraceMonths}m • {customOptions.renovagroInterestRate}% a.a.</p>
                    </div>
                  </>
                )}
                {selectedTemplateCode === 'PROJETO_INOVAGRO' && (
                  <>
                    <div className="col-span-2">
                      <span className="text-gray-500 text-[10.5px] block">Equipamento / Inovação:</span>
                      <p className="font-semibold text-gray-900">{customOptions.inovagroEquipment || 'Não informado'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10.5px] block">Investimento Total:</span>
                      <p className="font-semibold text-gray-900">R$ {Number(customOptions.inovagroTotalInvestment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10.5px] block">Potência / Capacidade:</span>
                      <p className="font-semibold text-gray-900">{customOptions.inovagroPower} kWp</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10.5px] block">Condições Financeiras:</span>
                      <p className="font-semibold text-gray-900">{customOptions.inovagroTermYears} anos • {customOptions.inovagroGraceMonths}m • {customOptions.inovagroInterestRate}% a.a.</p>
                    </div>
                  </>
                )}
                {selectedTemplateCode === 'PROJETO_CUSTEIO_SAFRA' && (
                  <>
                    <div>
                      <span className="text-gray-500 text-[10.5px] block">Ano Safra & Cultura:</span>
                      <p className="font-semibold text-gray-900">{customOptions.custeioSafraYear} • {customOptions.custeioCropName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10.5px] block">Área de Plantio:</span>
                      <p className="font-semibold text-gray-900">{customOptions.custeioAreaHa} ha</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10.5px] block">Orçamento Financiado:</span>
                      <p className="font-semibold text-gray-900">R$ {(customOptions.custeioAreaHa * customOptions.custeioCostPerHa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10.5px] block">Taxa de Juros:</span>
                      <p className="font-semibold text-gray-900">{customOptions.custeioInterestRate}% a.a.</p>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-gray-500 text-[10.5px] block">Responsável Técnico:</span>
                  <p className="font-semibold text-gray-900">{customOptions.responsibleName || 'Não informado'}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[10.5px] block">CREA / ART:</span>
                  <p className="font-semibold text-gray-900">
                    {customOptions.creaNumber ? `CREA: ${customOptions.creaNumber}` : 'Sem CREA'} • {customOptions.artNumber ? `ART: ${customOptions.artNumber}` : 'Sem ART'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-gray-200 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSaveDraftModalOpen(false)}
              className="text-xs"
            >
              Voltar para Ajustar
            </Button>

            <Button
              type="button"
              onClick={executeSaveDraft}
              disabled={isSavingDraft}
              className="bg-[#1B4D3E] hover:bg-[#13382D] text-white flex items-center gap-2 text-xs font-bold shadow-xs px-5"
            >
              {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Confirmar e Gravar no Cadastro Oficial
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
