'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import Handlebars from 'handlebars'

interface DocumentPaperPreviewProps {
  template: any
  resolvedVariables: Record<string, string | number>
  onSavePdfMetadata: (storagePath: string) => void
}

export function DocumentPaperPreview({ template, resolvedVariables, onSavePdfMetadata }: DocumentPaperPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [htmlContent, setHtmlContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

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

  // Custom Handlebars initialization to wrap variables in a span for styling
  useEffect(() => {
    Handlebars.registerHelper('helperMissing', function( /* dynamic arguments */) {
      const options = arguments[arguments.length - 1];
      const args = Array.prototype.slice.call(arguments, 0,arguments.length-1)
      return new Handlebars.SafeString(`<span style="color: #047857; background-color: #ecfdf5; padding: 0 4px; border-radius: 4px;">${options.name}</span>`);
    });
  }, [])


  const generatePdf = async () => {
    if (!contentRef.current) return
    setIsGenerating(true)
    
    try {
      // Dynamic import of html2pdf to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default

      const element = contentRef.current
      const opt = {
        margin:       0,
        filename:     `${template.code}_${new Date().getTime()}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true,
          ignoreElements: (node: Element) => {
            const tag = node.tagName?.toLowerCase()
            return tag === 'style' || tag === 'link' || tag === 'noscript'
          }
        },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      }

      // 1. Gerar e fazer download do PDF
      await html2pdf().set(opt).from(element).save()

      // 2. Fazer Upload para Supabase Storage (Omitido o código real do Supabase client para simplicidade)
      // Idealmente aqui chamariamos um Supabase Client para upload:
      // const file = await html2pdf().set(opt).from(element).output('blob')
      // const path = await uploadToSupabase(file)
      
      const storagePath = `declarations/${template.code}_${new Date().getTime()}.pdf`
      
      // 3. Salvar Metadata
      onSavePdfMetadata(storagePath)

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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{template.title}</h3>
          <p className="text-sm text-slate-500">{template.description}</p>
        </div>
        <Button 
          onClick={generatePdf} 
          disabled={isGenerating}
          className="bg-[#1B4D3E] hover:bg-[#113025] text-white"
        >
          <Printer className="w-4 h-4 mr-2" />
          {isGenerating ? 'Gerando...' : 'Emitir em 1 clique (PDF)'}
        </Button>
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
    </div>
  )
}
