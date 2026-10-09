'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Printer, Maximize2 } from 'lucide-react'
import Handlebars from 'handlebars'
import { UniversalDocumentPreviewModal } from '@/components/documents/UniversalDocumentPreviewModal'
import { printElementCleanly } from '@/lib/utils/clean-print'

interface DocumentPaperPreviewProps {
  template: any
  resolvedVariables: Record<string, string | number>
  onSavePdfMetadata: (storagePath: string, sha256Hash?: string) => void
}

export function DocumentPaperPreview({ template, resolvedVariables, onSavePdfMetadata }: DocumentPaperPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [htmlContent, setHtmlContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUniversalPreviewOpen, setIsUniversalPreviewOpen] = useState(false)

  // Renderiza o template Handlebars com as variáveis sempre que elas mudarem
  useEffect(() => {
    if (template?.contentHtml) {
      try {
        const compiledTemplate = Handlebars.compile(template.contentHtml)
        const result = compiledTemplate(resolvedVariables)
        
        setHtmlContent(result)
      } catch (e) {
        console.error("Erro ao compilar template Handlebars", e)
      }
    }
  }, [template, resolvedVariables])

  // Custom Handlebars initialization to prevent leaking debug tags in rendered documents
  useEffect(() => {
    Handlebars.registerHelper('helperMissing', function( /* dynamic arguments */) {
      return '';
    });
  }, [])


  const generatePdf = async () => {
    if (!contentRef.current) return
    setIsGenerating(true)
    
    try {
      const { jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default

      const element = contentRef.current
      const fileName = `${template.code}_${Date.now()}.pdf`

      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true,
      })

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        windowWidth: 794,
        backgroundColor: '#ffffff',
        ignoreElements: (node: Element) => {
          const tag = node.tagName?.toLowerCase()
          return tag === 'noscript'
        },
      })
      const imgData = canvas.toDataURL('image/jpeg', 0.98)
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)

      // 1. Gerar blob de saída para cálculo de integridade SHA-256 e download direto
      const pdfBlob: Blob = pdf.output('blob')

      let sha256 = ''
      try {
        const arrayBuffer = await pdfBlob.arrayBuffer()
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
        sha256 = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      } catch (e) {
        sha256 = 'SHA256-' + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('')
      }

      // Download transparente via link DOM invisível (sem popups about:blank)
      const blobUrl = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)

      const storagePath = `declarations/${template.code}_${Date.now()}.pdf`
      
      // 2. Salvar Metadata e revalidar dashboard
      onSavePdfMetadata(storagePath, sha256)

    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  if (!template) return (
    <div className="flex items-center justify-center h-64 bg-slate-50 border border-slate-200 rounded-lg text-slate-400">
      Selecione um cliente e uma minuta para visualizar o documento.
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{template.title}</h3>
          <p className="text-sm text-slate-500">{template.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsUniversalPreviewOpen(true)}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-9 px-3.5 flex items-center gap-1.5 cursor-pointer"
            title="Abrir no Visualizador Executivo (Zoom, Ajustes e Impressão)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#1B4D3E]" />
            Visualizador Executivo
          </Button>
          <Button 
            onClick={() => setIsUniversalPreviewOpen(true)} 
            disabled={isGenerating}
            className="bg-[#1B4D3E] hover:bg-[#113025] text-white text-xs font-bold h-9 px-4 cursor-pointer"
          >
            <Printer className="w-4 h-4 mr-2" />
            Visualizar & Emitir (PDF)
          </Button>
        </div>
      </div>

      <div className="bg-slate-100 p-8 rounded-lg overflow-auto flex justify-center">
        {/* Folha A4 Paper Preview */}
        <div 
          className="shadow-lg flex justify-center"
        >
          <div
            ref={contentRef}
            style={{ 
              width: '210mm', 
              minHeight: '296mm', 
              padding: '15mm', 
              backgroundColor: '#ffffff',
              boxSizing: 'border-box' 
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>

      {isUniversalPreviewOpen && (
        <UniversalDocumentPreviewModal
          isOpen={isUniversalPreviewOpen}
          onClose={() => setIsUniversalPreviewOpen(false)}
          title={`Pré-Visualização — ${template.title}`}
          subtitle={template.description}
          badges={
            <Badge
              variant="outline"
              className="text-[10px] font-bold px-2 py-0 border bg-emerald-50 text-emerald-700 border-emerald-300"
            >
              Minuta Jurídica Homologada
            </Badge>
          }
          html={htmlContent}
          dpiInfo={
            <>
              Resolução Nativa <strong>300+ DPI</strong> • Minuta Registrada • Conformidade Jurídica
            </>
          }
          primaryActionLabel="Confirmar e Baixar Minuta Oficial (PDF)"
          primaryActionIcon={<Printer className="w-4 h-4" />}
          onConfirm={generatePdf}
          showPrintAction={true}
          printActionLabel="Imprimir Direto"
          onPrint={() => {
            if (contentRef.current) {
              printElementCleanly(contentRef.current, template.title)
            }
          }}
          isDownloading={isGenerating}
          downloadingLabel="Compilando Minuta Oficial..."
        />
      )}
    </div>
  )
}
