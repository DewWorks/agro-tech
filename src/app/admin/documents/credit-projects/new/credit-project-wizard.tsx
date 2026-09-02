'use client'

import { useState, useEffect, useRef } from 'react'
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
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { resolveCreditProjectDocument } from '@/actions/credit-projects'
import { CreditTemplateMeta } from '@/lib/document-templates'

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
      totalArea?: number
      productiveArea?: number
      pastureArea?: number
      preserveArea?: number
    }>
  }>
  templates: CreditTemplateMeta[]
}

export default function CreditProjectWizard({ producers, templates }: CreditProjectWizardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTemplate = searchParams.get('template') || templates[0]?.code || 'CHECKLIST_PROFISSIONAL'

  const [selectedProducerId, setSelectedProducerId] = useState<string>(producers[0]?.id || '')
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(producers[0]?.properties[0]?.id || '')
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>(initialTemplate)
  
  // Custom options
  const [customOptions, setCustomOptions] = useState({
    responsibleName: 'Eng. Agrônomo Consultor',
    creaNumber: 'CREA/TO 12345-D',
    artNumber: 'ART 2026/0987654',
    targetBank: 'Banco do Brasil',
    purpose: 'Custeio / Investimento Agropecuário',
    safraYear: '2026/2027',
    estimatedLandValuePerHa: 12000,
    improvementsValue: 0,
    machineryValue: 0,
    annualRevenue: 0,
    annualExpenses: 0,
    existingDebts: 0,
  })

  const [loading, setLoading] = useState(false)
  const [generatedDoc, setGeneratedDoc] = useState<{
    html: string
    templateMeta: CreditTemplateMeta
    producerName: string
    propertyName: string
  } | null>(null)

  const currentProducer = producers.find(p => p.id === selectedProducerId)
  const availableProperties = currentProducer?.properties || []
  const currentProperty = availableProperties.find(p => p.id === selectedPropertyId)
  const currentTemplate = templates.find(t => t.code === selectedTemplateCode)

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

  // Generate document on parameter changes
  const handleGenerate = async () => {
    if (!selectedProducerId || !selectedPropertyId || !selectedTemplateCode) {
      toast.error('Selecione um produtor e uma propriedade para gerar o documento.')
      return
    }

    setLoading(true)
    try {
      const res = await resolveCreditProjectDocument(
        selectedProducerId,
        selectedPropertyId,
        selectedTemplateCode,
        customOptions
      )
      setGeneratedDoc(res)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar documento.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedProducerId && selectedPropertyId && selectedTemplateCode) {
      handleGenerate()
    }
  }, [selectedProducerId, selectedPropertyId, selectedTemplateCode])

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
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-[#1B4D3E] hover:bg-[#13382D] text-white flex items-center gap-2 text-xs font-bold shadow-xs px-4"
            >
              {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {isGeneratingPdf ? 'Gerando PDF...' : 'Gerar e Baixar PDF'}
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

          {/* 1. Seleção do Produtor */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[#1B4D3E]" />
              1. Produtor Rural (Proponente) *
            </Label>
            <Select value={selectedProducerId} onValueChange={(val) => val && setSelectedProducerId(val)}>
              <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="Selecione o Produtor">
                  {currentProducer ? `${currentProducer.name} (${currentProducer.type})` : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {producers.map((prod) => (
                  <SelectItem key={prod.id} value={prod.id} className="text-xs">
                    {prod.name} ({prod.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Seleção da Propriedade */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#1B4D3E]" />
              2. Propriedade / Imóvel Beneficiado *
            </Label>
            {availableProperties.length === 0 ? (
              <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-xs border border-amber-200">
                Este produtor não possui propriedades rurais vinculadas.
              </div>
            ) : (
              <Select value={selectedPropertyId} onValueChange={(val) => val && setSelectedPropertyId(val)}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Selecione a Propriedade">
                    {currentProperty ? `${currentProperty.name}${currentProperty.registrationNumber ? ` (Matr. ${currentProperty.registrationNumber})` : ''}` : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableProperties.map((prop) => (
                    <SelectItem key={prop.id} value={prop.id} className="text-xs">
                      {prop.name} {prop.registrationNumber ? `(Matr. ${prop.registrationNumber})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 3. Seleção do Modelo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5 text-[#1B4D3E]" />
              3. Modelo Oficial Banco do Brasil *
            </Label>
            <Select value={selectedTemplateCode} onValueChange={(val) => val && setSelectedTemplateCode(val)}>
              <SelectTrigger className="w-full text-xs font-medium">
                <SelectValue placeholder="Selecione o Modelo">
                  {currentTemplate ? currentTemplate.title : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {templates.map((tmpl) => (
                  <SelectItem key={tmpl.code} value={tmpl.code} className="text-xs">
                    {tmpl.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. Valores & Parâmetros Patrimoniais (Opcional) */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
              Parâmetros Patrimoniais & Finanças (Opcional)
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10.5px] text-gray-600">Terra (R$ / ha)</Label>
                <Input
                  type="number"
                  value={customOptions.estimatedLandValuePerHa || ''}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, estimatedLandValuePerHa: Number(e.target.value) }))}
                  className="h-8 text-xs"
                  placeholder="12000"
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
                <Label className="text-[10.5px] text-gray-600">Receita Anual (R$)</Label>
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

          {/* 5. Responsável Técnico */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              Responsável Técnico & Dados
            </span>
            
            <div className="space-y-1">
              <Label className="text-[11px] text-gray-600">Nome do Engenheiro / RT</Label>
              <Input
                value={customOptions.responsibleName}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, responsibleName: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-gray-600">Nº do CREA</Label>
                <Input
                  value={customOptions.creaNumber}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, creaNumber: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-gray-600">Nº da ART/TRT</Label>
                <Input
                  value={customOptions.artNumber}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, artNumber: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full text-xs text-[#1B4D3E] border-[#1B4D3E]/30 hover:bg-emerald-50 mt-2"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
              Atualizar Pré-Visualização
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

    </div>
  )
}
