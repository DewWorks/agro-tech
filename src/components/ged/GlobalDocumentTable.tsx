'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import DocumentToolbar from './DocumentToolbar'
import { DocumentStatus } from '@/lib/ged/semaphore'
import DocumentStatusBadge from './DocumentStatusBadge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileText, Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DocumentPreviewModal from './DocumentPreviewModal'
import { DOCUMENT_TYPE_LABELS } from '@/lib/ged/semaphore'
import type { DocumentRow } from './DocumentTable'
import { getSignedUrlForDownload } from '@/actions/documents'

export function GlobalDocumentTable({ initialDocuments }: { initialDocuments: DocumentRow[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [previewDoc, setPreviewDoc] = useState<DocumentRow | null>(null)

  const search = searchParams.get('q') || ''
  const statusFilter = searchParams.get('status') || 'TODOS'
  const typeFilter = searchParams.get('type') || 'TODOS'

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'TODOS') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const filteredDocs = useMemo(() => {
    return initialDocuments.filter(doc => {
      // 1. Status Filter
      if (statusFilter !== 'TODOS' && doc.calculatedStatus !== statusFilter) return false
      
      // 2. Type Filter
      if (typeFilter !== 'TODOS' && doc.documentType !== typeFilter) return false
      
      // 3. Search text
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = doc.fileName.toLowerCase().includes(q)
        const matchProducer = doc.producer?.name?.toLowerCase().includes(q) || false
        if (!matchName && !matchProducer) return false
      }

      return true
    })
  }, [initialDocuments, search, statusFilter, typeFilter])

  const handlePreview = (doc: DocumentRow) => {
    setPreviewDoc(doc)
  }

  const handleDownload = async (doc: DocumentRow) => {
    const result = await getSignedUrlForDownload(doc.storagePath, doc.fileName)
    if (result.success && result.data) {
      window.open(result.data.signedUrl, '_blank')
    }
  }

  return (
    <div className="flex flex-col h-full relative">
      {isPending && (
        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4D3E]"></div>
        </div>
      )}
      
      <div className="p-4 border-b bg-white">
        <DocumentToolbar
          search={search}
          onSearchChange={(v) => updateFilters('q', v)}
          statusFilter={statusFilter}
          onStatusFilterChange={(v) => updateFilters('status', v)}
          typeFilter={typeFilter}
          onTypeFilterChange={(v) => updateFilters('type', v)}
          selectedCount={0}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
            <tr>
              <th className="px-4 py-3 font-medium">Documento</th>
              <th className="px-4 py-3 font-medium">Produtor</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Validade</th>
              <th className="px-4 py-3 font-medium">Semáforo</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  <FileText className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  Nenhum documento encontrado com os filtros atuais.
                </td>
              </tr>
            ) : (
              filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50/50 bg-white transition-colors">
                  <td className="px-4 py-3 max-w-[200px] truncate" title={doc.fileName}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#1B4D3E] flex-shrink-0" />
                      <span className="font-medium truncate">{doc.fileName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {doc.producer?.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                  </td>
                  <td className="px-4 py-3">
                    {doc.expirationDate ? format(new Date(doc.expirationDate), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <DocumentStatusBadge 
                      expirationDate={doc.expirationDate}
                      documentType={doc.documentType}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handlePreview(doc)}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DocumentPreviewModal 
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />
    </div>
  )
}
