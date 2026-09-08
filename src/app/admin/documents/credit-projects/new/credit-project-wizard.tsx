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
  Database,
  ArrowRight,
  Lock
} from 'lucide-react'
import { ProducerSelect } from './components/form/ProducerSelect';
import { PropertySelect } from './components/form/PropertySelect';
import { PropertyDataForm } from './components/form/PropertyDataForm';
import { TemplateSelect } from './components/form/TemplateSelect';
import { TemplateParamsForm } from './components/form/TemplateParamsForm';
import { TechnicalResponsibleForm } from './components/form/TechnicalResponsibleForm';
import { CreditProjectStepper } from './components/form/CreditProjectStepper';
import { A4DocumentPreview } from './components/preview/A4DocumentPreview';
import { ConfirmEmitModal } from './components/modals/ConfirmEmitModal';
import { SaveDraftModal } from './components/modals/SaveDraftModal';
import { useCreditProjectWizard } from './hooks/useCreditProjectWizard';

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
    email?: string | null
    civilStatus?: string | null
    branchName?: string | null
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

  const { state, actions } = useCreditProjectWizard({
    producers,
    templates,
    defaultResponsibleName,
    defaultOrgName,
    defaultOrgCnpj,
    initialTemplateCode: initialTemplate,
  })

  const {
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
    documentData
  } = state

  const {
    setSelectedProducerId,
    setSelectedPropertyId,
    setSelectedTemplateCode,
    setCustomOptions,
    setIsConfirmModalOpen,
    setIsSaveDraftModalOpen,
    setSaveModalStep,
    handleOpenSaveModal,
    executeSaveDraft,
  } = actions

  // UI state not in hook
  const [openProducer, setOpenProducer] = useState(false)
  const [openProperty, setOpenProperty] = useState(false)
  const [openTemplate, setOpenTemplate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)

  const handlePrintIsolated = () => {
    if (!documentData) return
    const printWindow = window.open('', '_blank', 'width=900,height=1100')
    if (!printWindow) {
      toast.error('Por favor, permita pop-ups para abrir a impressão.')
      return
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${documentData.template.title} - ${documentData.producer.name}</title>
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
          ${contentRef.current?.innerHTML || ''}
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

  const handleGenerate = () => {
    toast.success('Pré-visualização atualizada com sucesso!')
  }

  const handleDownloadPdf = async () => {
    if (!contentRef.current || !documentData) return
    setIsGeneratingPdf(true)
    const toastId = toast.loading('Compilando documento PDF oficial...')

    try {
      const html2pdf = (await import('html2pdf.js')).default
      const element = contentRef.current

      const sanitizedTitle = documentData.template.title.replace(/[^a-zA-Z0-9]/g, '_')
      const sanitizedName = documentData.producer.name.replace(/[^a-zA-Z0-9]/g, '_')

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
            {currentTemplate ? (
              <p className="text-sm font-semibold text-[#1B4D3E] mt-1 flex items-center gap-1.5">
                📄 {currentTemplate.title}
                <span className="text-[10px] text-muted-foreground font-medium ml-1">({currentTemplate.bank || 'Banco do Brasil'})</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                Selecione o produtor, imóvel e o modelo desejado para emitir o documento pré-preenchido.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {documentData && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenSaveModal}
              disabled={isSavingDraft || !selectedProducerId}
              className={cn(
                "border-blue-300 text-blue-700 hover:bg-blue-50 flex items-center gap-1.5 text-xs font-semibold cursor-pointer",
                !isFormValid && "border-amber-300 text-amber-800 bg-amber-50/50 hover:bg-amber-100/50"
              )}
              title={!isFormValid ? "Revisar dados e pendências para gravação" : "Conferir e salvar dados deste projeto"}
            >
              {isSavingDraft ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-700" />
              ) : !isFormValid ? (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              ) : (
                <Save className="h-3.5 w-3.5 text-blue-700" />
              )}
              Salvar Dados
              {!isFormValid && (
                <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-1.5 py-0.2 rounded-full ml-0.5">
                  {validationErrors.length}
                </span>
              )}
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

      {/* Top Selectors Bar: Produtor, Propriedade e Modelo Oficial (3 colunas) */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3 print:hidden">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-[#1B4D3E]" />
            Parâmetros de Geração do Projeto
          </h2>
          <span className="text-[11px] text-muted-foreground">
            Selecione o proponente, o imóvel beneficiado e o modelo bancário
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {/* 1. Seleção do Produtor */}
          <ProducerSelect
            activeProducers={activeProducers}
            selectedProducerId={selectedProducerId}
            setSelectedProducerId={setSelectedProducerId}
            currentProducer={currentProducer}
          />

          {/* 2. Seleção da Propriedade */}
          <PropertySelect
            availableProperties={availableProperties}
            selectedPropertyId={selectedPropertyId}
            setSelectedPropertyId={setSelectedPropertyId}
            currentProperty={currentProperty}
          />

          {/* 3. Seleção do Modelo */}
          <TemplateSelect
            templates={templates}
            selectedTemplateCode={selectedTemplateCode}
            setSelectedTemplateCode={setSelectedTemplateCode}
            currentTemplate={currentTemplate}
          />
        </div>
      </div>

      {/* Stepper Multi-Passos (Ocupa 100% da Largura, com Preview A4 no Último Passo) */}
      {selectedPropertyId ? (
        <CreditProjectStepper
          selectedTemplateCode={selectedTemplateCode}
          currentProducer={currentProducer}
          currentProperty={currentProperty}
          currentTemplate={currentTemplate}
          customOptions={customOptions}
          setCustomOptions={setCustomOptions}
          validationErrors={validationErrors}
          isFormValid={isFormValid}
          isSavingDraft={isSavingDraft}
          handleOpenSaveModal={handleOpenSaveModal}
          setIsConfirmModalOpen={setIsConfirmModalOpen}
          documentData={documentData}
          contentRef={contentRef}
          handlePrintIsolated={handlePrintIsolated}
          handleDownloadOriginalTemplate={handleDownloadOriginalTemplate}
          handleDownloadPdf={handleDownloadPdf}
          isGeneratingPdf={isGeneratingPdf}
        />
      ) : (
        <div className="p-12 bg-white rounded-2xl border border-gray-200 text-center space-y-3 shadow-2xs">
          <FileText className="h-10 w-10 text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-700">Selecione uma Propriedade Rural</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Vincule um produtor ativo e selecione a propriedade rural para carregar os dados cadastrais e iniciar o preenchimento do projeto de crédito.
          </p>
        </div>
      )}

      
      <ConfirmEmitModal 
        isOpen={isConfirmModalOpen}
        setIsOpen={setIsConfirmModalOpen}
        currentProducer={currentProducer}
        currentProperty={currentProperty}
        currentTemplate={currentTemplate}
        customOptions={customOptions}
        selectedTemplateCode={selectedTemplateCode}
        defaultOrgName={defaultOrgName}
        defaultOrgCnpj={defaultOrgCnpj}
        isGeneratingPdf={isGeneratingPdf}
        handleDownloadPdf={handleDownloadPdf}
      />

      <SaveDraftModal 
        isOpen={isSaveDraftModalOpen}
        setIsOpen={setIsSaveDraftModalOpen}
        saveModalStep={saveModalStep}
        setSaveModalStep={setSaveModalStep}
        propertyErrors={propertyErrors}
        producerErrors={producerErrors}
        projectErrors={projectErrors}
        validationErrors={validationErrors}
        isFormValid={isFormValid}
        currentProperty={currentProperty}
        currentProducer={currentProducer}
        currentTemplate={currentTemplate}
        customOptions={customOptions}
        selectedTemplateCode={selectedTemplateCode}
        isSavingDraft={isSavingDraft}
        executeSaveDraft={executeSaveDraft}
      />
    </div>
  )
}






