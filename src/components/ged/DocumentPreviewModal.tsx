'use client'

import { useState, useEffect } from 'react'
import { X, Download, FileText, ImageIcon, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DOCUMENT_TYPE_LABELS } from '@/lib/ged/semaphore'
import { formatFileSize } from '@/lib/ged/utils'
import { getSignedUrlForView, getSignedUrlForDownload } from '@/actions/documents'
import DocumentStatusBadge from './DocumentStatusBadge'
import type { DocumentRow } from './DocumentTable'

interface DocumentPreviewModalProps {
  document: DocumentRow | null
  isOpen: boolean
  onClose: () => void
}

export default function DocumentPreviewModal({
  document,
  isOpen,
  onClose,
}: DocumentPreviewModalProps) {
  const [viewUrl, setViewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && document) {
      loadViewUrl(document.storagePath)
    } else {
      setViewUrl(null)
    }
  }, [isOpen, document])

  const loadViewUrl = async (storagePath: string) => {
    setLoading(true)
    try {
      const result = await getSignedUrlForView(storagePath)
      if (result.success && result.data) {
        setViewUrl(result.data.signedUrl)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!document) return
    const result = await getSignedUrlForDownload(document.storagePath, document.fileName)
    if (result.success && result.data) {
      window.open(result.data.signedUrl, '_blank')
    }
  }

  const isPdf = document?.mimeType === 'application/pdf'
  const isImage = document?.mimeType?.startsWith('image/')

  if (!document) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-[50vw] w-full h-[95vh] flex flex-col p-0 gap-0">
        <DialogTitle className="sr-only">Pré-visualização de Documento</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#1B4D3E]/10 flex items-center justify-center flex-shrink-0">
              {isPdf ? <FileText className="h-5 w-5 text-[#1B4D3E]" /> : <ImageIcon className="h-5 w-5 text-[#1B4D3E]" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {document.fileName}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {DOCUMENT_TYPE_LABELS[document.documentType] || document.documentType}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{formatFileSize(document.fileSize)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <DocumentStatusBadge
              expirationDate={document.expirationDate}
              documentType={document.documentType}
            />
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Baixar
            </Button>
            {viewUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(viewUrl, '_blank')}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-[#1B4D3E]" />
            </div>
          ) : viewUrl ? (
            isPdf ? (
              <iframe
                src={viewUrl}
                className="w-full h-full border-0"
                title="Preview do documento"
              />
            ) : isImage ? (
              <div className="flex items-center justify-center h-full p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewUrl}
                  alt={document.fileName}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FileText className="h-16 w-16 mb-4 opacity-30" />
                <p className="font-medium">Pré-visualização não disponível</p>
                <p className="text-xs mt-1">Use o botão &quot;Baixar&quot; para visualizar o arquivo.</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FileText className="h-16 w-16 mb-4 opacity-30" />
              <p className="font-medium">Não foi possível carregar o preview</p>
            </div>
          )}
        </div>

        {/* Footer - Metadata */}
        <div className="px-6 py-3 border-t bg-white grid grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Emissão:</span>
            <span className="ml-1 font-medium">
              {document.issueDate
                ? format(new Date(document.issueDate), 'dd/MM/yyyy', { locale: ptBR })
                : '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Validade:</span>
            <span className="ml-1 font-medium">
              {document.expirationDate
                ? format(new Date(document.expirationDate), 'dd/MM/yyyy', { locale: ptBR })
                : '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Produtor:</span>
            <span className="ml-1 font-medium">{document.producer?.name || '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Propriedade:</span>
            <span className="ml-1 font-medium">{document.property?.name || 'Pessoal'}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
