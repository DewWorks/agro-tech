'use client'

import { useState, useMemo, useCallback } from 'react'
import FolderTree, { type TreeProducer } from '@/components/ged/FolderTree'
import DocumentTable, { type DocumentRow } from '@/components/ged/DocumentTable'
import DocumentToolbar from '@/components/ged/DocumentToolbar'
import DocumentPreviewModal from '@/components/ged/DocumentPreviewModal'
import UploadDropzone from '@/components/ged/UploadDropzone'
import { listDocuments, getSignedUrlForDownload, archiveDocument } from '@/actions/documents'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface DocumentsClientProps {
  initialTree: TreeProducer[]
  initialDocuments: DocumentRow[]
}

export default function DocumentsClient({
  initialTree,
  initialDocuments,
}: DocumentsClientProps) {
  const [tree] = useState<TreeProducer[]>(initialTree)
  const [documents, setDocuments] = useState<DocumentRow[]>(initialDocuments)

  // Selection state
  const [selectedProducerId, setSelectedProducerId] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [typeFilter, setTypeFilter] = useState('TODOS')

  // Modals
  const [previewDoc, setPreviewDoc] = useState<DocumentRow | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [replacingDoc, setReplacingDoc] = useState<DocumentRow | null>(null)

  // Get selected producer's branchId for upload
  const selectedProducer = useMemo(
    () => tree.find(p => p.id === (replacingDoc?.producer?.id || selectedProducerId)),
    [tree, selectedProducerId, replacingDoc]
  )

  // Filter documents based on current selection and filters
  const filteredDocuments = useMemo(() => {
    let filtered = [...documents]

    // Filter by producer
    if (selectedProducerId) {
      filtered = filtered.filter(d => d.producer?.id === selectedProducerId)

      // Filter by section (personal or property)
      if (selectedSection === 'pessoal') {
        filtered = filtered.filter(d => !d.property)
      } else if (selectedSection && selectedSection !== 'pessoal') {
        filtered = filtered.filter(d => d.property?.id === selectedSection)
      }
    }

    // Filter by search
    if (search) {
      const lowerSearch = search.toLowerCase()
      filtered = filtered.filter(d =>
        d.fileName.toLowerCase().includes(lowerSearch) ||
        d.documentType.toLowerCase().includes(lowerSearch) ||
        d.producer?.name.toLowerCase().includes(lowerSearch) ||
        d.property?.name.toLowerCase().includes(lowerSearch)
      )
    }

    // Filter by status
    if (statusFilter !== 'TODOS') {
      filtered = filtered.filter(d => d.calculatedStatus === statusFilter)
    }

    // Filter by type
    if (typeFilter !== 'TODOS') {
      filtered = filtered.filter(d => d.documentType === typeFilter)
    }

    return filtered
  }, [documents, selectedProducerId, selectedSection, search, statusFilter, typeFilter])

  const handleSelectProducer = (producerId: string) => {
    setSelectedProducerId(producerId)
  }

  const handleSelectSection = (producerId: string, section: string | null) => {
    setSelectedProducerId(producerId)
    setSelectedSection(section)
  }

  const handleView = (doc: DocumentRow) => {
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

  const handleReplace = (doc: DocumentRow) => {
    setReplacingDoc(doc)
    if (doc.producer?.id) {
      setSelectedProducerId(doc.producer.id)
    }
    setShowUpload(true)
  }

  const handleArchive = async (doc: DocumentRow) => {
    try {
      const result = await archiveDocument(doc.id)
      if (result.success) {
        toast.success(`Documento "${doc.fileName}" arquivado com sucesso.`)
        refreshDocuments()
      } else {
        toast.error(result.error || 'Erro ao arquivar documento.')
      }
    } catch {
      toast.error('Erro inesperado ao arquivar documento.')
    }
  }

  const refreshDocuments = useCallback(async () => {
    const result = await listDocuments({
      producerId: selectedProducerId || undefined,
    })
    if (result.success && result.data) {
      setDocuments(result.data as DocumentRow[])
    }
  }, [selectedProducerId])

  const handleUploadComplete = () => {
    setShowUpload(false)
    setReplacingDoc(null)
    refreshDocuments()
  }

  return (
    <>
      <div className="flex gap-6 h-[calc(100vh-220px)]">
        {/* Left Panel: Folder Tree */}
        <div className="w-[280px] flex-shrink-0 bg-white border rounded-lg overflow-y-auto">
          <FolderTree
            producers={tree}
            selectedProducerId={selectedProducerId}
            selectedPropertyId={null}
            selectedSection={selectedSection}
            onSelectProducer={handleSelectProducer}
            onSelectSection={handleSelectSection}
          />
        </div>

        {/* Right Panel: Toolbar + Table */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Toolbar */}
          <DocumentToolbar
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            onNewDocument={() => {
              setReplacingDoc(null)
              setShowUpload(true)
            }}
            selectedCount={0}
          />

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <DocumentTable
              documents={filteredDocuments}
              onView={handleView}
              onDownload={handleDownload}
              onReplace={handleReplace}
              onArchive={handleArchive}
              showProducerColumn={!selectedProducerId}
            />
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <DocumentPreviewModal
        document={previewDoc}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      {/* Upload / Replace Dialog */}
      <Dialog open={showUpload} onOpenChange={(open) => {
        setShowUpload(open)
        if (!open) setReplacingDoc(null)
      }}>
        <DialogContent className="max-w-xl">
          <DialogTitle className="text-lg font-semibold text-[#1B4D3E]">
            {replacingDoc ? `Substituir Documento: ${replacingDoc.fileName}` : 'Enviar Novo Documento'}
          </DialogTitle>
          {selectedProducer ? (
            <UploadDropzone
              producerId={selectedProducer.id}
              branchId={selectedProducer.branchId}
              propertyId={replacingDoc?.property?.id || undefined}
              replacingDocumentId={replacingDoc?.id}
              isReplacement={!!replacingDoc}
              initialDocumentType={replacingDoc?.documentType}
              initialIssueDate={replacingDoc?.issueDate ? format(new Date(replacingDoc.issueDate), 'yyyy-MM-dd') : ''}
              initialExpirationDate={replacingDoc?.expirationDate ? format(new Date(replacingDoc.expirationDate), 'yyyy-MM-dd') : ''}
              onUploadComplete={handleUploadComplete}
              onClose={() => {
                setShowUpload(false)
                setReplacingDoc(null)
              }}
            />
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <p className="text-sm font-medium">Selecione um produtor na árvore de diretórios</p>
              <p className="text-xs mt-1">É necessário selecionar o produtor antes de enviar um documento.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
