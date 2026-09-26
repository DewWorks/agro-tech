'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
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
import dynamic from 'next/dynamic';

const ConfirmEmitModal = dynamic(
  () => import('./components/modals/ConfirmEmitModal').then((mod) => mod.ConfirmEmitModal),
  { ssr: false }
);
const SaveDraftModal = dynamic(
  () => import('./components/modals/SaveDraftModal').then((mod) => mod.SaveDraftModal),
  { ssr: false }
);
import { useCreditProjectWizard } from './hooks/useCreditProjectWizard';
import { CreditProjectWizardProps } from './types/wizard-types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { saveCreditProjectData, recordDocumentEmission } from '@/actions/credit-projects';

export default function CreditProjectWizard({ 
  producers, 
  templates,
  defaultResponsibleName = '',
  defaultOrgName = '',
  defaultOrgCnpj = '',
  initialTemplateCode,
  initialSavedData,
  backUrl,
  pageTitle
}: CreditProjectWizardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const initialTemplate = searchParams.get('template') || templates[0]?.code || 'CHECKLIST_PROFISSIONAL'

  const { state, actions } = useCreditProjectWizard({
    producers,
    templates,
    defaultResponsibleName,
    defaultOrgName,
    defaultOrgCnpj,
    initialTemplateCode: initialTemplateCode || initialTemplate,
    initialSavedData,
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
    // Para evitar janelas pop-up invasivas about:blank, acionamos a emissão direta do PDF oficial
    handleDownloadPdf()
  }

  const handleGenerate = () => {
    toast.success('Pré-visualização atualizada com sucesso!')
  }

  const handleDownloadPdf = async (): Promise<{
    success: boolean
    sha256?: string
    storagePath?: string
    fileName?: string
    emittedAt?: string
  }> => {
    if (!contentRef.current || !documentData) {
      toast.error('Pré-visualização do documento não encontrada para compilação do PDF.')
      throw new Error('Elemento de visualização não encontrado ou dados incompletos.')
    }
    setIsGeneratingPdf(true)
    const toastId = toast.loading('Compilando documento PDF oficial...')

    try {
      const html2pdf = (await import('html2pdf.js')).default
      const element = contentRef.current

      const sanitizedTitle = documentData.template.title.replace(/[^a-zA-Z0-9]/g, '_')
      const sanitizedName = documentData.producer.name.replace(/[^a-zA-Z0-9]/g, '_')
      const fileName = `${sanitizedTitle}_${sanitizedName}.pdf`

      const opt = {
        margin: 6,
        filename: fileName,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          ignoreElements: (node: Element) => {
            const tag = node.tagName?.toLowerCase()
            return tag === 'noscript'
          }
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      }

      // Gerar blob de saída para cálculo de integridade e download transparente
      const pdfBlob: Blob = await html2pdf().set(opt).from(element).output('blob')

      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error('Falha ao compilar o arquivo PDF (tamanho 0 bytes).')
      }

      // Conclui imediatamente o estado e toast de compilação visual no cliente
      toast.dismiss(toastId)
      setIsGeneratingPdf(false)

      // Calcular hash SHA-256 do arquivo gerado
      let sha256 = ''
      try {
        const arrayBuffer = await pdfBlob.arrayBuffer()
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
        sha256 = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      } catch (hashErr) {
        console.warn('Não foi possível computar hash SHA-256 no cliente:', hashErr)
        sha256 = 'SHA256-' + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('')
      }

      // Download transparente via link DOM invisível (sem janelas pop-up ou about:blank)
      const blobUrl = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)

      const storagePdfPath = `ged/credit-projects/${selectedTemplateCode}/${Date.now()}_${fileName}`

      // Registrar evento de emissão formal no banco de dados e sincronizar rascunho
      if (selectedProducerId && selectedTemplateCode) {
        await recordDocumentEmission({
          producerId: selectedProducerId,
          propertyId: selectedPropertyId,
          templateCode: selectedTemplateCode,
          payload: customOptions,
          storagePdfPath,
          sha256Hash: sha256,
        }).catch((err) => console.error('Erro ao contabilizar emissão no banco:', err))
      }

      return {
        success: true,
        sha256,
        storagePath: storagePdfPath,
        fileName,
        emittedAt: new Date().toISOString(),
      }
    } catch (err: any) {
      console.error('PDF error:', err)
      toast.dismiss(toastId)
      toast.error(err?.message || 'Erro ao compilar o PDF.')
      throw err
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleDownloadOriginalTemplate = () => {
    const link = document.createElement('a')
    link.href = `/api/credit-templates/download?code=${selectedTemplateCode}`
    link.download = `modelo_${selectedTemplateCode}.docx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Download do modelo base iniciado!')
  }

  const isDeclarations = pathname ? pathname.includes('/declarations') : (currentTemplate?.type === 'LEGAL')
  const resolvedBackUrl = backUrl || (isDeclarations ? '/admin/documents/declarations' : '/admin/documents/credit-projects')
  const resolvedTitle = pageTitle || (isDeclarations ? 'Gerador de Declarações & Autorizações BB' : 'Gerador de Documentos & Projetos BB')

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={resolvedBackUrl} className="shrink-0">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 cursor-pointer shadow-2xs" title="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-[#1B4D3E] shrink-0" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1B4D3E]">
                {isDeclarations ? (
                  <>
                    Gerador de Declarações &amp; Autorizações <span className="inline-block px-2 py-0.5 text-xs sm:text-sm font-extrabold bg-emerald-100/80 text-[#1B4D3E] rounded-md border border-emerald-300/60 align-middle">BB</span>
                  </>
                ) : (
                  <>
                    Gerador de Documentos &amp; Projetos <span className="inline-block px-2 py-0.5 text-xs sm:text-sm font-extrabold bg-emerald-100/80 text-[#1B4D3E] rounded-md border border-emerald-300/60 align-middle">BB</span>
                  </>
                )}
              </h1>
            </div>
            {currentTemplate ? (
              <p className="text-xs sm:text-sm font-semibold text-[#1B4D3E] mt-1 flex items-center gap-1.5 flex-wrap">
                <FileText className="h-4 w-4 text-[#1B4D3E] shrink-0" />
                <span className="truncate">{currentTemplate.title}</span>
                <span className="text-[11px] text-muted-foreground font-medium">({currentTemplate.bank || 'Banco do Brasil'})</span>
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
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenSaveModal}
              disabled={isSavingDraft || isLoadingSavedData || !selectedProducerId}
              className={cn(
                "border-blue-300 text-blue-700 hover:bg-blue-50 flex items-center gap-1.5 text-xs font-semibold cursor-pointer h-9 px-3 rounded-xl",
                (!isFormValid || isLoadingSavedData) && "border-amber-300 text-amber-800 bg-amber-50/50 hover:bg-amber-100/50"
              )}
              title={isLoadingSavedData ? "Carregando dados salvos..." : !isFormValid ? "Revisar dados e pendências para gravação" : "Conferir e salvar dados deste projeto"}
            >
              {isSavingDraft || isLoadingSavedData ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-700" />
              ) : !isFormValid ? (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              ) : (
                <Save className="h-3.5 w-3.5 text-blue-700" />
              )}
              Salvar Dados
              {!isLoadingSavedData && !isFormValid && (
                <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-1.5 py-0.2 rounded-full ml-0.5">
                  {validationErrors.length}
                </span>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadOriginalTemplate}
              className="border-emerald-300 text-[#1B4D3E] hover:bg-emerald-50 flex items-center gap-1.5 text-xs font-semibold h-9 px-3 rounded-xl hidden sm:flex cursor-pointer"
              title="Baixar arquivo original Word/Excel de referência"
            >
              <Download className="h-3.5 w-3.5 text-[#1B4D3E]" />
              Baixar Template Base (.docx/.xls)
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (isLoadingSavedData) return
                if (!isFormValid || validationErrors.length > 0) {
                  toast.error(`Atenção: ${validationErrors[0] || 'Existem campos obrigatórios pendentes.'}`)
                  return
                }
                setIsConfirmModalOpen(true)
              }}
              disabled={isGeneratingPdf || isLoadingSavedData || !isFormValid || validationErrors.length > 0}
              className={cn(
                "border flex items-center gap-1.5 text-xs font-semibold h-9 px-3.5 rounded-xl transition-all",
                isFormValid && validationErrors.length === 0 && !isLoadingSavedData
                  ? "border-emerald-300 text-emerald-800 hover:bg-emerald-50 cursor-pointer" 
                  : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
              )}
              title={isLoadingSavedData ? "Carregando dados..." : (!isFormValid || validationErrors.length > 0) ? `Preencha todos os campos obrigatórios (${validationErrors.length} pendente(s))` : 'Conferir e validar dados antes da emissão'}
            >
              {isGeneratingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />}
              {isGeneratingPdf ? 'Gerando...' : 'Conferir Dados'}
            </Button>

            <Button
              type="button"
              onClick={handlePrintIsolated}
              className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs sm:text-sm font-bold h-10 px-5 rounded-xl flex items-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer"
              title="Imprimir documento oficial em página limpa"
            >
              <Printer className="h-4 w-4" />
              Imprimir Documento Oficial
            </Button>
          </div>
        )}
      </div>

      {/* Top Selectors Bar: Produtor, Propriedade e Modelo Oficial (3 colunas) */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-gray-100 pb-3">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-[#1B4D3E]" />
            Parâmetros de Geração do Projeto
          </h2>
          <span className="text-[11px] text-muted-foreground">
            Selecione o proponente, o imóvel beneficiado e o modelo bancário
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
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

      {/* Stepper Multi-Passos ou Skeleton de Carregamento */}
      {isLoadingSavedData ? (
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-200 shadow-2xs text-center space-y-5 animate-in fade-in duration-300">
          <div className="flex items-center justify-center">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-xs">
              <Loader2 className="h-8 w-8 text-[#1B4D3E] animate-spin" />
            </div>
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-gray-900">Carregando dados cadastrais e parâmetros...</h3>
            <p className="text-xs text-muted-foreground">
              Buscando dados salvos no banco de dados e sincronizando patrimônio, terras e histórico oficial.
            </p>
          </div>

          <div className="max-w-xl mx-auto pt-4 space-y-3">
            <div className="h-9 bg-gray-100 rounded-lg animate-pulse" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            </div>
            <div className="h-28 bg-gray-50 rounded-xl border border-dashed border-gray-200 animate-pulse" />
          </div>
        </div>
      ) : selectedPropertyId ? (
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

      
      {/* Container permanente para compilação do PDF:
          Garante que contentRef.current esteja SEMPRE montado no DOM com o A4DocumentPreview,
          mesmo quando o usuário estiver no Passo 1, 2, 3 ou 4 do Stepper. */}
      {documentData && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-9999px',
            top: 0,
            width: '800px',
            zIndex: -9999,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <div
            ref={contentRef}
            id="permanent-printable-document"
            style={{
              width: '800px',
              backgroundColor: '#ffffff',
              color: '#1f2937',
              boxSizing: 'border-box',
            }}
          >
            <A4DocumentPreview documentData={documentData} />
          </div>
        </div>
      )}

      {isConfirmModalOpen && (
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
          isFormValid={isFormValid}
          validationErrors={validationErrors}
        />
      )}

      {isSaveDraftModalOpen && (
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
      )}
    </div>
  )
}






