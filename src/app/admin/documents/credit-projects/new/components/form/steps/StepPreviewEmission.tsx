import React from 'react'
import {
  ShieldCheck,
  Save,
  Download,
  Printer,
  FileText,
  Loader2,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { A4DocumentPreview } from '../../preview/A4DocumentPreview'

interface StepPreviewEmissionProps {
  documentData: any
  contentRef: React.RefObject<HTMLDivElement | null>
  isLimiteCredito: boolean
  vtnEstimated: number
  totalImprovements: number
  totalMachinery: number
  cattleHeads: number
  cattleEstimated: number
  totalPatrimony: number
  netCapacity: number
  isFormValid: boolean
  validationErrors: string[]
  isGeneratingPdf: boolean
  isSavingDraft: boolean
  handleOpenSaveModal: () => void
  handleDownloadOriginalTemplate: () => void
  handlePrintIsolated: () => void
  setIsConfirmModalOpen: (open: boolean) => void
  onBack: () => void
}

export function StepPreviewEmission({
  documentData,
  contentRef,
  isLimiteCredito,
  vtnEstimated,
  totalImprovements,
  totalMachinery,
  cattleHeads,
  cattleEstimated,
  totalPatrimony,
  netCapacity,
  isFormValid,
  validationErrors,
  isGeneratingPdf,
  isSavingDraft,
  handleOpenSaveModal,
  handleDownloadOriginalTemplate,
  handlePrintIsolated,
  setIsConfirmModalOpen,
  onBack
}: StepPreviewEmissionProps) {
  const deferredDocumentData = React.useDeferredValue(documentData)
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#1B4D3E]" />
            Conferência Final e Emissão do Documento Oficial
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Revise a Ficha Cadastral no modelo oficial do Banco do Brasil abaixo antes de imprimir ou gerar o arquivo PDF.
          </p>
        </div>

        {/* Action Bar (Top Right) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenSaveModal}
            disabled={isSavingDraft}
            className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50 h-9 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer"
            title="Salvar rascunho dos dados deste projeto"
          >
            <Save className="h-3.5 w-3.5 text-blue-600" />
            Salvar Dados
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadOriginalTemplate}
            className="text-xs text-emerald-800 border-emerald-300 hover:bg-emerald-50 h-9 px-3 rounded-xl hidden sm:flex items-center gap-1.5 cursor-pointer"
            title="Baixar arquivo DOCX/XLS original de referência"
          >
            <Download className="h-3.5 w-3.5 text-[#1B4D3E]" />
            Modelo Base (.docx)
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (!isFormValid || validationErrors.length > 0) {
                toast.error(`Atenção: ${validationErrors[0] || 'Existem campos obrigatórios pendentes.'}`)
                return
              }
              setIsConfirmModalOpen(true)
            }}
            disabled={!isFormValid || validationErrors.length > 0 || isGeneratingPdf}
            className={cn(
              "text-xs font-semibold h-9 px-3.5 rounded-xl flex items-center gap-1.5 transition-all border",
              isFormValid && validationErrors.length === 0
                ? "border-emerald-300 text-emerald-800 hover:bg-emerald-50 cursor-pointer" 
                : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
            )}
            title={(!isFormValid || validationErrors.length > 0) ? `Pendências: ${validationErrors.length}` : 'Conferir e validar dados antes da emissão'}
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
      </div>

      {/* Resumo Patrimonial Consolidado */}
      {isLimiteCredito && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
            <span className="text-[10.5px] text-gray-500 block">Terras (VTN)</span>
            <strong className="text-xs text-gray-900">R$ {vtnEstimated.toLocaleString('pt-BR')}</strong>
          </div>
          <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
            <span className="text-[10.5px] text-gray-500 block">Benfeitorias</span>
            <strong className="text-xs text-gray-900">R$ {totalImprovements.toLocaleString('pt-BR')}</strong>
          </div>
          <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
            <span className="text-[10.5px] text-gray-500 block">Máquinas</span>
            <strong className="text-xs text-gray-900">R$ {totalMachinery.toLocaleString('pt-BR')}</strong>
          </div>
          <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
            <span className="text-[10.5px] text-gray-500 block">Semoventes ({cattleHeads} cab)</span>
            <strong className="text-xs text-gray-900">R$ {cattleEstimated.toLocaleString('pt-BR')}</strong>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl">
            <span className="text-[10.5px] text-emerald-800 block font-semibold">Patrimônio Total</span>
            <strong className="text-xs text-[#1B4D3E] font-extrabold">R$ {totalPatrimony.toLocaleString('pt-BR')}</strong>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-300 rounded-xl">
            <span className="text-[10.5px] text-blue-800 block font-semibold">Capacidade Líquida</span>
            <strong className="text-xs text-blue-900 font-extrabold">R$ {netCapacity.toLocaleString('pt-BR')}</strong>
          </div>
        </div>
      )}

      {/* Checklist de Conformidade */}
      {!isFormValid && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-900">
          <div className="font-bold flex items-center gap-1.5 text-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Atenção: Existem pendências cadastrais antes da emissão definitiva ({validationErrors.length})
          </div>
          <ul className="list-disc list-inside text-xs space-y-0.5 pl-2 opacity-90">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* O PREVIEW OFICIAL A4 */}
      <div className="bg-slate-100 p-4 sm:p-8 rounded-2xl border border-slate-200 overflow-x-auto flex flex-col items-center justify-start print:p-0 print:border-0 print:bg-white shadow-inner">
        <div className="text-xs text-gray-500 mb-3 font-medium flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-gray-400" />
          Pré-visualização Oficial A4 (Padrão Banco do Brasil / SICOR)
        </div>
        
        {documentData ? (
          <div className="w-full max-w-[820px] bg-white shadow-xl rounded-sm border border-gray-300 overflow-hidden print:shadow-none print:border-0 print:max-w-none print:w-full animate-in fade-in duration-200">
            <div 
              id="printable-document"
              style={{ 
                width: '100%', 
                backgroundColor: '#ffffff',
                color: '#1f2937',
                boxSizing: 'border-box'
              }}
            >
              <A4DocumentPreview documentData={deferredDocumentData} />
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-muted-foreground text-xs">
            Selecione o produtor e a propriedade para gerar a pré-visualização.
          </div>
        )}
      </div>
    </div>
  )
}
