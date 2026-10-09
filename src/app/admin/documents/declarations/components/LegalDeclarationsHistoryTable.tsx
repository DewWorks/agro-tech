'use client'

import React, { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  Search,
  Clock,
  Eye,
  Calendar,
  Building2,
  User,
  ArrowRight,
  ShieldCheck,
  TreePine,
  Users,
  Sparkles,
  Printer,
  Plus
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LegalDeclarationHistoryItem } from '@/actions/legal-documents'
import { UniversalDocumentPreviewModal } from '@/components/documents/UniversalDocumentPreviewModal'
import { A4DocumentPreview } from '@/app/admin/documents/credit-projects/new/components/preview/A4DocumentPreview'
import { CREDIT_TEMPLATES_REGISTRY } from '@/lib/document-templates'
import { printElementCleanly } from '@/lib/utils/clean-print'
import { toast } from 'sonner'

interface LegalDeclarationsHistoryTableProps {
  initialDeclarations: LegalDeclarationHistoryItem[]
}

export function LegalDeclarationsHistoryTable({ initialDeclarations }: LegalDeclarationsHistoryTableProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'TODOS' | 'COMPLIANCE' | 'AMBIENTAL' | 'SOCIAL_GARANTIAS'>('TODOS')
  const [previewItem, setPreviewItem] = useState<LegalDeclarationHistoryItem | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const filteredDeclarations = useMemo(() => {
    let list = initialDeclarations

    if (categoryFilter !== 'TODOS') {
      list = list.filter((d) => d.category === categoryFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (d) =>
          d.producerName.toLowerCase().includes(q) ||
          d.producerDocument.toLowerCase().includes(q) ||
          d.propertyName.toLowerCase().includes(q) ||
          d.templateName.toLowerCase().includes(q) ||
          d.categoryLabel.toLowerCase().includes(q)
      )
    }

    return list
  }, [initialDeclarations, categoryFilter, search])

  // Mock de documentData para preview em UniversalDocumentPreviewModal
  const previewDocData = useMemo(() => {
    if (!previewItem) return null
    const tmplMeta =
      CREDIT_TEMPLATES_REGISTRY.find((t) => t.code === previewItem.templateCode) || {
        code: previewItem.templateCode,
        title: previewItem.templateName,
        subtitle: 'Declaração Legal Padrão Banco do Brasil',
        type: 'LEGAL' as const,
        category: 'DECLARACAO' as const,
        bank: 'Banco do Brasil',
        description: '',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      }

    return {
      template: tmplMeta,
      producer: {
        id: previewItem.producerId,
        name: previewItem.producerName,
        document: previewItem.producerDocument,
      },
      property: {
        id: previewItem.propertyId || '',
        name: previewItem.propertyName,
        city: previewItem.propertyCity,
        state: previewItem.propertyState,
      },
      organization: {
        name: 'LN Consultoria & Gestão Rural',
      },
      options: previewItem.payloadSnapshot || {},
    }
  }, [previewItem])

  const handleDownloadPdfModal = async () => {
    if (!contentRef.current || !previewDocData) {
      toast.error('Pré-visualização do documento não encontrada.')
      return
    }

    setIsDownloading(true)
    const toastId = toast.loading('Compilando documento PDF oficial...')

    try {
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready
      }
      const { jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default
      const element = contentRef.current

      const sanitizedTitle = (previewDocData.template.title || 'Declaracao_Legal').replace(/[^a-zA-Z0-9]/g, '_')
      const sanitizedName = (previewDocData.producer.name || 'Produtor').replace(/[^a-zA-Z0-9]/g, '_')
      const fileName = `${sanitizedTitle}_${sanitizedName}.pdf`

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
        ignoreElements: (node: Element) => node.tagName?.toLowerCase() === 'noscript',
      })
      const imgData = canvas.toDataURL('image/jpeg', 0.98)
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)

      const pdfBlob: Blob = pdf.output('blob')
      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error('Falha ao compilar o arquivo PDF.')
      }

      toast.dismiss(toastId)
      setIsDownloading(false)

      const blobUrl = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)

      toast.success('Documento PDF baixado com sucesso!')
    } catch (err: any) {
      console.error('PDF error:', err)
      toast.dismiss(toastId)
      toast.error(err?.message || 'Erro ao compilar o PDF.')
    } finally {
      setIsDownloading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'COMPLIANCE':
        return <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
      case 'AMBIENTAL':
        return <TreePine className="h-3.5 w-3.5 text-emerald-700" />
      case 'SOCIAL_GARANTIAS':
        return <Users className="h-3.5 w-3.5 text-emerald-700" />
      default:
        return <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
      {/* Header da Seção de Histórico */}
      <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#1B4D3E]" />
            Histórico de Documentos & Declarações Emitidas
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Consulte, visualize ou continue a emissão dos documentos regulatórios e minutas geradas no escritório.
          </p>
        </div>

        {/* Filtros de Categoria */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            type="button"
            size="sm"
            variant={categoryFilter === 'TODOS' ? 'default' : 'outline'}
            onClick={() => setCategoryFilter('TODOS')}
            className={`text-xs h-8 px-3 rounded-lg ${
              categoryFilter === 'TODOS'
                ? 'bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold'
                : 'text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Todas ({initialDeclarations.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={categoryFilter === 'COMPLIANCE' ? 'default' : 'outline'}
            onClick={() => setCategoryFilter('COMPLIANCE')}
            className={`text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 ${
              categoryFilter === 'COMPLIANCE'
                ? 'bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold'
                : 'text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Autorizações Bancárias ({initialDeclarations.filter((d) => d.category === 'COMPLIANCE').length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={categoryFilter === 'AMBIENTAL' ? 'default' : 'outline'}
            onClick={() => setCategoryFilter('AMBIENTAL')}
            className={`text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 ${
              categoryFilter === 'AMBIENTAL'
                ? 'bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold'
                : 'text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <TreePine className="h-3.5 w-3.5" />
            Regularidade Ambiental ({initialDeclarations.filter((d) => d.category === 'AMBIENTAL').length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={categoryFilter === 'SOCIAL_GARANTIAS' ? 'default' : 'outline'}
            onClick={() => setCategoryFilter('SOCIAL_GARANTIAS')}
            className={`text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 ${
              categoryFilter === 'SOCIAL_GARANTIAS'
                ? 'bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold'
                : 'text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Enquadramento & Garantias ({initialDeclarations.filter((d) => d.category === 'SOCIAL_GARANTIAS').length})
          </Button>
        </div>
      </div>

      {/* Barra de Busca Rápida */}
      <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por produtor, CPF/CNPJ, imóvel ou modelo de declaração..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white text-xs h-9 rounded-xl border-gray-200 focus-visible:ring-1 focus-visible:ring-[#1B4D3E]"
          />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {filteredDeclarations.length}{' '}
          {filteredDeclarations.length === 1 ? 'registro encontrado' : 'registros encontrados'}
        </span>
      </div>

      {/* Tabela de Histórico */}
      <div className="overflow-x-auto">
        {filteredDeclarations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Clock className="h-10 w-10 text-gray-300 mx-auto" />
            <h4 className="text-sm font-bold text-gray-700">Nenhum documento emitido encontrado</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search.trim()
                ? 'Nenhum resultado corresponde aos termos da busca digitada.'
                : 'Ainda não foram geradas declarações legais nesta organização. Escolha uma das categorias acima para emitir.'}
            </p>
            <Link href="/admin/documents/declarations/new">
              <Button size="sm" className="mt-2 bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-bold gap-1.5 cursor-pointer">
                <Plus className="h-3.5 w-3.5" />
                Emitir Nova Declaração
              </Button>
            </Link>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <th className="py-3 px-4">Documento / Modelo</th>
                <th className="py-3 px-4">Produtor Rural</th>
                <th className="py-3 px-4">Imóvel Rural</th>
                <th className="py-3 px-4">Data de Emissão</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDeclarations.map((item) => (
                <tr key={item.id} className="hover:bg-emerald-50/20 transition-colors group">
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-[#1B4D3E] shrink-0 mt-0.5">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 group-hover:text-[#1B4D3E] transition-colors">
                          {item.templateName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-200 text-emerald-800 bg-emerald-50/50">
                            {item.categoryLabel}
                          </Badge>
                          <span className="text-[11px] text-gray-400">• Padrão BB</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-medium text-gray-900">
                      <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="truncate max-w-[200px]">{item.producerName}</span>
                    </div>
                    {item.producerDocument && (
                      <span className="text-[11px] text-muted-foreground block ml-5">
                        Doc: {item.producerDocument}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-medium text-gray-700">
                      <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="truncate max-w-[180px]">{item.propertyName}</span>
                    </div>
                    {(item.propertyCity || item.propertyState) && (
                      <span className="text-[11px] text-muted-foreground block ml-5">
                        {[item.propertyCity, item.propertyState].filter(Boolean).join(' - ')}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>{format(new Date(item.createdAt), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground block ml-5">
                      {format(new Date(item.createdAt), 'HH:mm')}h
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewItem(item)}
                        className="text-xs h-8 px-2.5 rounded-lg border-emerald-200 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer flex items-center gap-1"
                        title="Pré-visualizar documento oficial (336 DPI)"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Visualizar
                      </Button>

                      <Link href={`/admin/documents/declarations/new?template=${item.templateCode}`}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8 px-2.5 rounded-lg text-gray-600 hover:text-[#1B4D3E] hover:bg-gray-100 cursor-pointer flex items-center gap-1"
                          title="Emitir nova declaração com este modelo"
                        >
                          Emitir Novo
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Universal de Pré-Visualização */}
      {previewItem && previewDocData && (
        <UniversalDocumentPreviewModal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          title={`Pré-Visualização — ${previewDocData.template.title} — ${previewDocData.property?.name || 'Imóvel Rural'}`}
          subtitle={previewDocData.producer?.name}
          badges={
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="text-[10px] font-bold px-2 py-0 border bg-emerald-50 text-emerald-700 border-emerald-300"
              >
                Padrão Banco do Brasil
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] font-semibold px-2 py-0 border bg-slate-50 text-slate-700 border-slate-300"
              >
                {previewItem.categoryLabel}
              </Badge>
            </div>
          }
          children={
            <div ref={contentRef} className="p-4 sm:p-6 bg-white w-full">
              <A4DocumentPreview documentData={previewDocData} />
            </div>
          }
          dpiInfo={
            <>
              Resolução Nativa <strong>336 DPI</strong> • Padrão Banco do Brasil / BACEN • Conformidade Legal
            </>
          }
          primaryActionLabel="Confirmar e Baixar Documento Oficial (PDF)"
          onConfirm={handleDownloadPdfModal}
          showPrintAction={true}
          printActionLabel="Imprimir"
          onPrint={() => {
            if (contentRef.current) {
              printElementCleanly(contentRef.current, previewDocData.template.title || 'Declaração Oficial')
            }
          }}
          isDownloading={isDownloading}
        />
      )}
    </div>
  )
}
