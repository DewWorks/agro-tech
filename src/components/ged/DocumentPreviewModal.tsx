'use client'

import { useState, useEffect } from 'react'
import { Download, FileText, ImageIcon, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DOCUMENT_TYPE_LABELS } from '@/lib/ged/semaphore'
import { formatFileSize } from '@/lib/ged/utils'
import { getSignedUrlForView, getSignedUrlForDownload } from '@/actions/documents'
import DocumentStatusBadge from './DocumentStatusBadge'
import type { DocumentRow } from './DocumentTable'
import { UniversalDocumentPreviewModal } from '@/components/documents/UniversalDocumentPreviewModal'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export interface DocumentPreviewModalProps {
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
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (isOpen && document) {
      loadViewUrl(document.storagePath)
    } else {
      setViewUrl(null)
      setIsDownloading(false)
    }
  }, [isOpen, document])

  const loadViewUrl = async (storagePath: string) => {
    setLoading(true)
    try {
      const result = await getSignedUrlForView(storagePath)
      if (result.success && result.data) {
        setViewUrl(result.data.signedUrl)
      } else {
        toast.error('Não foi possível carregar a visualização deste documento.')
      }
    } catch {
      toast.error('Erro ao conectar ao repositório de documentos.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!document) return
    setIsDownloading(true)
    try {
      const result = await getSignedUrlForDownload(document.storagePath, document.fileName)
      if (result.success && result.data) {
        window.open(result.data.signedUrl, '_blank')
        toast.success('Download iniciado com sucesso!')
      } else {
        toast.error('Falha ao obter link seguro de download.')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao realizar download.')
    } finally {
      setIsDownloading(false)
    }
  }

  if (!isOpen || !document) return null

  const isPdf = document.mimeType === 'application/pdf'
  const isImage = document.mimeType?.startsWith('image/')

  const formattedIssueDate = document.issueDate
    ? format(new Date(document.issueDate), 'dd/MM/yyyy', { locale: ptBR })
    : '—'
  const formattedExpirationDate = document.expirationDate
    ? format(new Date(document.expirationDate), 'dd/MM/yyyy', { locale: ptBR })
    : 'Sem vencimento'

  const subtitleParts = [
    DOCUMENT_TYPE_LABELS[document.documentType] || document.documentType,
    document.fileSize ? formatFileSize(document.fileSize) : null,
    document.producer?.name,
  ].filter(Boolean)

  const badges = (
    <div className="flex items-center gap-2">
      <DocumentStatusBadge
        expirationDate={document.expirationDate}
        documentType={document.documentType}
      />
      {document.isInherited && (
        <Badge
          variant="outline"
          className="text-[10px] font-bold bg-blue-50 text-blue-700 border-blue-200"
        >
          Herdado
        </Badge>
      )}
    </div>
  )

  const secondaryActions = viewUrl
    ? [
        {
          label: 'Abrir em Nova Aba',
          onClick: () => window.open(viewUrl, '_blank'),
          icon: <ExternalLink className="w-3.5 h-3.5" />,
          title: 'Abrir arquivo original em nova aba',
        },
      ]
    : []

  const pdfViewerUrl = viewUrl
    ? viewUrl.includes('#')
      ? viewUrl
      : `${viewUrl}#toolbar=0&navpanes=0`
    : null

  return (
    <UniversalDocumentPreviewModal
      isOpen={isOpen}
      onClose={onClose}
      title={document.fileName}
      subtitle={subtitleParts.join(' • ')}
      icon={
        isPdf ? (
          <FileText className="w-5 h-5 text-[#1B4D3E]" />
        ) : isImage ? (
          <ImageIcon className="w-5 h-5 text-[#1B4D3E]" />
        ) : (
          <FileText className="w-5 h-5 text-[#1B4D3E]" />
        )
      }
      badges={badges}
      isLoading={loading}
      loadingTitle="Carregando Documento Digital..."
      loadingSubtitle="Buscando arquivo criptografado no armazenamento seguro GED..."
      emptyTitle="Visualização Indisponível"
      emptySubtitle="Não foi possível obter a URL segura de visualização do arquivo."
      dpiInfo={
        <>
          Repositório GED • Emissão: <strong>{formattedIssueDate}</strong> • Validade:{' '}
          <strong>{formattedExpirationDate}</strong> • Imóvel:{' '}
          <strong>{document.property?.name || 'Geral / Pessoal'}</strong>
        </>
      }
      primaryActionLabel="Baixar Arquivo"
      primaryActionIcon={<Download className="w-4 h-4" />}
      onConfirm={handleDownload}
      isDownloading={isDownloading}
      downloadingLabel="Baixando..."
      secondaryActions={secondaryActions}
      showPrintAction={Boolean(isPdf || isImage)}
      printActionLabel="Imprimir"
      onPrint={() => {
        if (viewUrl) {
          const printWin = window.open(viewUrl, '_blank')
          if (printWin) {
            printWin.focus()
          }
        }
      }}
      pageWidth="850px"
      pageMinHeight="1120px"
      pageClassName="overflow-hidden bg-white shadow-2xl rounded-xs"
    >
      {viewUrl ? (
        isPdf ? (
          <iframe
            src={pdfViewerUrl || viewUrl}
            className="w-full h-[1120px] border-0 bg-white"
            title={document.fileName}
          />
        ) : isImage ? (
          <div className="flex items-center justify-center p-6 min-h-[1120px] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewUrl}
              alt={document.fileName}
              className="max-w-full max-h-[1060px] object-contain rounded-xs shadow-md"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[500px] text-muted-foreground p-8 text-center space-y-3 bg-white">
            <FileText className="h-16 w-16 mb-2 opacity-30 text-[#1B4D3E]" />
            <p className="font-bold text-slate-800 text-sm">
              Pré-visualização direta indisponível para este formato ({document.mimeType || 'binário'})
            </p>
            <p className="text-xs text-slate-500 max-w-sm">
              Utilize o botão &quot;Baixar Arquivo&quot; abaixo para abrir o documento com o software padrão no seu computador.
            </p>
          </div>
        )
      ) : null}
    </UniversalDocumentPreviewModal>
  )
}
