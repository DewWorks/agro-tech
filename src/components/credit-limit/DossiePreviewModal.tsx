'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  X,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { downloadCreditLimitDossierPdf } from '@/lib/utils/dossie-pdf-downloader'
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
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isContinuousScroll, setIsContinuousScroll] = useState<boolean>(false)
  const [zoom, setZoom] = useState<number>(1.0)
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1)
      setIsDownloading(false)
      // Ajuste inicial inteligente dependendo da largura da tela
      if (typeof window !== 'undefined') {
        const width = window.innerWidth
        if (width < 900) {
          setZoom(0.75)
        } else if (width < 1400) {
          setZoom(0.85)
        } else {
          setZoom(1.0)
        }
      }
    }
  }, [isOpen])

  // Desabilita rolagem do body quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Decompor o HTML em folhas isoladas com tags de estilo injetadas
  const parsedPages = useMemo(() => {
    if (!html || typeof window === 'undefined') return []
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const styleTags = Array.from(doc.querySelectorAll('style'))
        .map((s) => s.outerHTML)
        .join('\n')

      const pageNodes = Array.from(doc.querySelectorAll('.dossie-page'))
      if (pageNodes.length === 0) {
        return [styleTags + doc.body.innerHTML]
      }
      return pageNodes.map((p) => styleTags + p.outerHTML)
    } catch {
      return [html]
    }
  }, [html])

  const totalPages = parsedPages.length || 3

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  }

  const handleFitToScreen = () => {
    if (containerRef.current) {
      const availableWidth = containerRef.current.clientWidth - 64 // 32px padding cada lado
      const scale = Math.min(1.25, Math.max(0.6, availableWidth / 794))
      setZoom(Number(scale.toFixed(2)))
    } else {
      setZoom(0.85)
    }
  }

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

  if (!isOpen) return null

  // Badges computadas
  const resolvedIcsdStatus =
    icsdStatus || (icsdValue && icsdValue >= 1.2 ? 'APROVADO' : 'REPROVADO')
  const isIcsdApproved =
    resolvedIcsdStatus === 'APROVADO' || resolvedIcsdStatus === 'APROVADO_CONFORTAVEL'
  const isIcsdAlert = resolvedIcsdStatus === 'APROVADO_ALERTA' || resolvedIcsdStatus === 'ALERTA'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      {/* =================================================================== */}
      {/* 1. TOOLBAR SUPERIOR FIXA */}
      {/* =================================================================== */}
      <header className="h-16 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 z-10 shadow-xs">
        {/* Título & Badges Executivas */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-[#1B4D3E] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                Pré-Visualização do Dossiê Técnico de Limite — {propertyName}
              </h2>
              {producerName && (
                <span className="hidden lg:inline text-xs text-slate-500 font-medium truncate">
                  • {producerName}
                </span>
              )}
            </div>
            {/* Badges de Solvência e Garantias */}
            <div className="flex items-center gap-2 mt-0.5">
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
            </div>
          </div>
        </div>

        {/* Controles Centrais: Navegação de Páginas e Zoom */}
        <div className="flex items-center gap-3">
          {/* Navegação entre folhas (apenas em modo folha por folha) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePrevPage}
              disabled={isContinuousScroll || currentPage <= 1}
              className="h-7 w-7 p-0 text-slate-600 dark:text-slate-300"
              title="Página Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-semibold px-2 text-slate-700 dark:text-slate-300 select-none">
              {isContinuousScroll
                ? `Todas as ${totalPages} Folhas`
                : `Folha 0${currentPage} de 0${totalPages}`}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleNextPage}
              disabled={isContinuousScroll || currentPage >= totalPages}
              className="h-7 w-7 p-0 text-slate-600 dark:text-slate-300"
              title="Próxima Página"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Alternar Rolagem Contínua vs. Folha a Folha */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsContinuousScroll((prev) => !prev)}
            className="hidden sm:inline-flex text-xs h-8 px-2.5 gap-1.5 font-medium border-slate-300 text-slate-700 dark:text-slate-300"
            title={isContinuousScroll ? 'Ver folha por folha' : 'Ver rolagem contínua de todas as folhas'}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isContinuousScroll ? 'Folha Única' : 'Todas as Folhas'}</span>
          </Button>

          {/* Controles de Zoom */}
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))))}
              className="h-7 w-7 p-0 text-slate-600 dark:text-slate-300"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>

            <button
              type="button"
              onClick={() => setZoom(1.0)}
              className="text-xs font-bold font-mono px-2 text-slate-700 dark:text-slate-300 hover:text-emerald-700 select-none cursor-pointer"
              title="Redefinir para 100%"
            >
              {Math.round(zoom * 100)}%
            </button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.15).toFixed(2))))}
              className="h-7 w-7 p-0 text-slate-600 dark:text-slate-300"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFitToScreen}
              className="h-7 px-2 text-xs text-slate-600 dark:text-slate-300 gap-1 font-medium"
              title="Ajustar à Largura da Tela"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Ajustar</span>
            </Button>
          </div>

          {/* Botão Fechar Modal (X) */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            title="Fechar Visualizador"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. ÁREA CENTRAL (VISUALIZADOR A4 COM FUNDO NEUTRO) */}
      {/* =================================================================== */}
      <main
        ref={containerRef}
        className="flex-1 overflow-auto bg-slate-200 dark:bg-slate-950 p-4 sm:p-8 flex justify-center items-start"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center my-auto p-12 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-md">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                Compilando Dossiê Técnico...
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Consultando dados fundiários, balanço de semoventes e serviço da dívida.
              </p>
            </div>
            {/* Skeleton visual de 3 barras */}
            <div className="w-full space-y-2 pt-2">
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse w-5/6 mx-auto" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse w-4/6 mx-auto" />
            </div>
          </div>
        ) : !html || parsedPages.length === 0 ? (
          <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 text-center space-y-3 max-w-md my-auto">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Dossiê não disponível
            </h3>
            <p className="text-xs text-slate-500">
              Não foi possível gerar a pré-visualização. Verifique se a propriedade possui cadastro completo de produtor e limites.
            </p>
          </div>
        ) : (
          /* Container com escala CSS de zoom */
          <div
            className="flex flex-col items-center transition-transform duration-150 origin-top pb-12"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
            }}
          >
            {isContinuousScroll ? (
              /* Modo Rolagem Contínua: Renderiza as 3 folhas empilhadas */
              <div className="flex flex-col gap-8">
                {parsedPages.map((pageHtml, index) => (
                  <div
                    key={`page-${index}`}
                    className="relative bg-white shadow-2xl rounded-xs border border-slate-300 text-left select-text"
                    style={{ width: '794px', minHeight: '1120px' }}
                    dangerouslySetInnerHTML={{ __html: pageHtml }}
                  />
                ))}
              </div>
            ) : (
              /* Modo Folha Única: Renderiza a folha ativa (1, 2 ou 3) */
              <div
                className="relative bg-white shadow-2xl rounded-xs border border-slate-300 text-left select-text"
                style={{ width: '794px', minHeight: '1120px' }}
                dangerouslySetInnerHTML={{
                  __html: parsedPages[currentPage - 1] || parsedPages[0],
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* 3. FOOTER STICKY: AÇÕES DEFINITIVAS */}
      {/* =================================================================== */}
      <footer className="h-16 shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 z-10 shadow-md">
        {/* Metadados Técnicos de Emissão */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <FileCheck className="w-4 h-4 text-emerald-600" />
          <span>
            Resolução Nativa <strong>336 DPI</strong> • 3 Páginas Padronizadas • Conformidade BACEN/MCR
          </span>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Botão Secundário: Editar no CRM */}
          {propertyId && (
            <Link
              href={`/admin/crm/properties/${propertyId}/edit`}
              className="text-xs text-slate-700 hover:text-emerald-700 font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100"
              title="Abrir cadastro de terras, máquinas e benfeitorias no CRM"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Editar no CRM</span>
            </Link>
          )}

          {/* Botão Secundário: Fechar */}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDownloading}
            className="text-xs h-9 px-4 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
          >
            Fechar
          </Button>

          {/* Botão Primário: Confirmar e Baixar Dossiê Oficial */}
          <Button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading || isLoading || !html}
            className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs h-9 px-5 font-bold gap-2 shadow-sm"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando PDF (336 DPI)...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Confirmar e Baixar Dossiê Oficial (PDF)</span>
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}
