'use client'

import React, { useState } from 'react'
import {
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { downloadCreditLimitDossierPdf } from '@/lib/utils/dossie-pdf-downloader'
import { UniversalDocumentPreviewModal } from '@/components/documents/UniversalDocumentPreviewModal'
import { toast } from 'sonner'

export interface DossiePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  html?: string | null
  isLoading?: boolean
  fileName?: string
  propertyId?: string
  propertyName?: string
  producerName?: string
  icsdStatus?: 'APROVADO' | 'ALERTA' | 'REPROVADO' | string
  icsdValue?: number
  ltvPercent?: number
  ltvApproved?: boolean
  onDownloadStart?: () => void
  onDownloadEnd?: () => void
}

export function DossiePreviewModal({
  isOpen,
  onClose,
  html,
  isLoading = false,
  fileName,
  propertyId,
  propertyName = 'Propriedade Rural',
  producerName,
  icsdStatus,
  icsdValue,
  ltvPercent,
  ltvApproved,
  onDownloadStart,
  onDownloadEnd,
}: DossiePreviewModalProps) {
  const [isDownloading, setIsDownloading] = useState<boolean>(false)

  // Badges computadas de solvência e garantias
  const resolvedIcsdStatus =
    icsdStatus || (icsdValue && icsdValue >= 1.2 ? 'APROVADO' : 'REPROVADO')
  const isIcsdApproved =
    resolvedIcsdStatus === 'APROVADO' || resolvedIcsdStatus === 'APROVADO_CONFORTAVEL'
  const isIcsdAlert = resolvedIcsdStatus === 'APROVADO_ALERTA' || resolvedIcsdStatus === 'ALERTA'

  const handleDownload = async () => {
    if (!html) {
      toast.error('Nenhum conteúdo de dossiê disponível para emissão.')
      return
    }

    setIsDownloading(true)
    if (onDownloadStart) onDownloadStart()
    const toastId = toast.loading('Compilando Dossiê em Alta Resolução (336 DPI)...')

    try {
      const targetFileName =
        fileName ||
        `Dossie_Limite_Credito_${propertyName.replace(/\s+/g, '_')}_${Date.now()}.pdf`

      await downloadCreditLimitDossierPdf(html, targetFileName)
      toast.dismiss(toastId)
      toast.success('Dossiê Técnico emitido com sucesso!')
      onClose()
    } catch (err: any) {
      console.error('[DossiePreviewModal] Erro ao baixar PDF:', err)
      toast.dismiss(toastId)
      toast.error(err.message || 'Falha ao compilar PDF oficial.')
    } finally {
      setIsDownloading(false)
      if (onDownloadEnd) onDownloadEnd()
    }
  }

  const badges = (
    <>
      {icsdValue !== undefined && (
        <Badge
          variant="outline"
          className={`text-[10px] font-bold px-2 py-0 border ${
            isIcsdApproved
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : isIcsdAlert
              ? 'bg-amber-50 text-amber-700 border-amber-300'
              : 'bg-rose-50 text-rose-700 border-rose-300'
          }`}
        >
          {isIcsdApproved ? (
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 inline" />
          ) : isIcsdAlert ? (
            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600 inline" />
          ) : (
            <XCircle className="w-3 h-3 mr-1 text-rose-600 inline" />
          )}
          ICSD: {icsdValue.toFixed(2)}x ({isIcsdApproved ? 'Aprovado' : isIcsdAlert ? 'Alerta' : 'Reprovado'})
        </Badge>
      )}

      {ltvPercent !== undefined && (
        <Badge
          variant="outline"
          className={`text-[10px] font-bold px-2 py-0 border ${
            ltvApproved !== false && ltvPercent >= 100
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-rose-50 text-rose-700 border-rose-300'
          }`}
        >
          LTV: {ltvPercent.toFixed(1)}% ({ltvApproved !== false ? 'Garantias OK' : 'Insuficiente'})
        </Badge>
      )}
    </>
  )

  const secondaryActions = propertyId
    ? [
        {
          label: 'Editar no CRM',
          href: `/admin/crm/properties/${propertyId}/edit`,
          icon: <ExternalLink className="w-3.5 h-3.5" />,
          title: 'Abrir cadastro de terras, máquinas e benfeitorias no CRM',
        },
      ]
    : []

  return (
    <UniversalDocumentPreviewModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pré-Visualização do Dossiê Técnico de Limite — ${propertyName}`}
      subtitle={producerName}
      badges={badges}
      html={html}
      isLoading={isLoading}
      loadingTitle="Compilando Dossiê Técnico..."
      loadingSubtitle="Consultando dados fundiários, balanço de semoventes e serviço da dívida."
      emptyTitle="Dossiê não disponível"
      emptySubtitle="Não foi possível gerar a pré-visualização. Verifique se a propriedade possui cadastro completo de produtor e limites."
      dpiInfo={
        <>
          Resolução Nativa <strong>336 DPI</strong> • 3 Páginas Padronizadas • Conformidade BACEN/MCR
        </>
      }
      onConfirm={handleDownload}
      primaryActionLabel="Confirmar e Baixar Dossiê Oficial (PDF)"
      downloadingLabel="Gerando PDF (336 DPI)..."
      isDownloading={isDownloading}
      secondaryActions={secondaryActions}
    />
  )
}
