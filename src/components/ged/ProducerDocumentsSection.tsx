'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { FileText, Loader2, Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  listProducerDocuments,
  getSignedUrlForDownload,
  archiveDocument,
} from '@/actions/documents'
import UploadDropzone from './UploadDropzone'
import DocumentPreviewModal from './DocumentPreviewModal'
import DocumentTable, { type DocumentRow } from './DocumentTable'
import DocumentToolbar from './DocumentToolbar'

interface ProducerDocumentsSectionProps {
  producerId: string
  branchId: string
}

export default function ProducerDocumentsSection({
  producerId,
  branchId,
}: ProducerDocumentsSectionProps) {
  const [documents, setDocuments] = useState<DocumentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [previewDoc, setPreviewDoc] = useState<DocumentRow | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [typeFilter, setTypeFilter] = useState('TODOS')

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    const result = await listProducerDocuments(producerId)
    if (result.success && result.data) {
      setDocuments(result.data as DocumentRow[])
    }
    setLoading(false)
  }, [producerId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const filteredDocuments = useMemo(() => {
    let filtered = [...documents]
    if (search) {
      const lowerSearch = search.toLowerCase()
      filtered = filtered.filter(d => 
        d.fileName.toLowerCase().includes(lowerSearch) || 
        d.documentType.toLowerCase().includes(lowerSearch)
      )
    }
    if (statusFilter !== 'TODOS') {
      filtered = filtered.filter(d => d.calculatedStatus === statusFilter)
    }
    if (typeFilter !== 'TODOS') {
      filtered = filtered.filter(d => d.documentType === typeFilter)
    }
    return filtered
  }, [documents, search, statusFilter, typeFilter])

  const handleView = async (doc: DocumentRow) => {
    setPreviewDoc(doc)
  }

  const handleDownload = async (doc: DocumentRow) => {
    const result = await getSignedUrlForDownload(doc.storagePath, doc.fileName)
    if (result.success && result.data) {
      window.open(result.data.signedUrl, '_blank')
    } else {
      toast.error('Erro ao gerar link de download.')
    }
  }

  const handleArchive = async (doc: DocumentRow) => {
    const result = await archiveDocument(doc.id)
    if (result.success) {
      toast.success('Documento removido com sucesso.')
      fetchDocuments()
    } else {
      toast.error(result.error || 'Erro ao remover documento.')
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm">Carregando documentos...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-sm font-semibold text-[#1B4D3E] flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Novo Documento
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            Faça o upload seguro de documentos. Formatos aceitos: PDF, JPG, PNG.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <UploadDropzone
            producerId={producerId}
            branchId={branchId}
            onUploadComplete={() => {
              fetchDocuments()
            }}
          />
        </CardContent>
      </Card>

      {/* List Card */}
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-sm font-semibold text-[#1B4D3E] flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {documents.length > 0 || search || statusFilter !== 'TODOS' || typeFilter !== 'TODOS' ? (
            <div className="space-y-4">
              <DocumentToolbar
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                selectedCount={0}
              />

              <div className="border rounded-md">
                <DocumentTable
                  documents={filteredDocuments}
                  onView={handleView}
                  onDownload={handleDownload}
                  onReplace={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                    toast.info('Utilize a área de upload acima para substituir o documento. Não se esqueça de arquivar o antigo.')
                  }}
                  onArchive={handleArchive}
                  showProducerColumn={false}
                />
              </div>
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-slate-50">
              <FileText className="h-8 w-8 mb-2 opacity-50" />
              <p className="font-medium text-sm">Nenhum documento encontrado</p>
              <p className="text-xs text-center mt-1 max-w-md">
                Os documentos anexados a este produtor aparecerão aqui.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <DocumentPreviewModal
        document={previewDoc}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  )
}
