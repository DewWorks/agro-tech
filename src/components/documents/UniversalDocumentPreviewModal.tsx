'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  X,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Layers,
  FileCheck,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { printElementCleanly } from '@/lib/utils/clean-print'

export interface PreviewSecondaryAction {
  label: string
  onClick?: () => void
  href?: string
  icon?: React.ReactNode
  variant?: 'outline' | 'ghost' | 'default'
  disabled?: boolean
  title?: string
}

export interface UniversalDocumentPreviewModalProps {
  isOpen: boolean
  onClose: () => void

  // Identificação do Documento
  title: string
  subtitle?: string
  icon?: React.ReactNode
  badges?: React.ReactNode

  // Conteúdo: fornecido via HTML string, array de páginas ou children
  html?: string | null
  pages?: React.ReactNode[]
  children?: React.ReactNode

  // Estado de carregamento e mensagens
  isLoading?: boolean
  loadingTitle?: string
  loadingSubtitle?: string
  emptyTitle?: string
  emptySubtitle?: string

  // Metadados técnicos & Telemetria do rodapé
  dpiInfo?: React.ReactNode
  totalPages?: number
  initialPage?: number
  defaultContinuousScroll?: boolean

  // Ações Principais
  onConfirm?: () => Promise<void> | void
  onDownloadPdf?: () => Promise<void> | void
  onPrint?: () => void
  isDownloading?: boolean
  downloadingLabel?: string
  primaryActionLabel?: string
  primaryActionIcon?: React.ReactNode

  // Ação Secundária de Impressão Direta
  showPrintAction?: boolean
  printActionLabel?: string

  // Ações secundárias customizadas
  secondaryActions?: PreviewSecondaryAction[]

  // Customizações de estilo da folha A4
  pageWidth?: string
  pageMinHeight?: string
  pageClassName?: string
}

export function UniversalDocumentPreviewModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  badges,
  html,
  pages,
  children,
  isLoading = false,
  loadingTitle = 'Compilando Documento Oficial...',
  loadingSubtitle = 'Processando dados cadastrais, formatação técnica e layout A4 de alta resolução.',
  emptyTitle = 'Documento não disponível',
  emptySubtitle = 'Não foi possível compilar a pré-visualização. Verifique se os dados obrigatórios foram preenchidos.',
  dpiInfo,
  totalPages: propTotalPages,
  initialPage = 1,
  defaultContinuousScroll = false,
  onConfirm,
  onDownloadPdf,
  onPrint,
  isDownloading = false,
  downloadingLabel = 'Gerando Documento Oficial (336 DPI)...',
  primaryActionLabel = 'Confirmar e Baixar Documento Oficial (PDF)',
  primaryActionIcon,
  showPrintAction = false,
  printActionLabel = 'Imprimir',
  secondaryActions = [],
  pageWidth = '794px',
  pageMinHeight = '1120px',
  pageClassName,
}: UniversalDocumentPreviewModalProps) {
  const [currentPage, setCurrentPage] = useState<number>(initialPage)
  const [isContinuousScroll, setIsContinuousScroll] = useState<boolean>(defaultContinuousScroll)
  const [zoom, setZoom] = useState<number>(1.0)
  const containerRef = useRef<HTMLDivElement>(null)
  const pageContainerRef = useRef<HTMLDivElement>(null)

  // Reseta estados ao abrir e calcula zoom responsivo inicial
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(initialPage)
      setIsContinuousScroll(defaultContinuousScroll)
      if (typeof window !== 'undefined') {
        const width = window.innerWidth
        if (width < 900) {
          setZoom(0.7)
        } else if (width < 1400) {
          setZoom(0.85)
        } else {
          setZoom(1.0)
        }
      }
    }
  }, [isOpen, initialPage, defaultContinuousScroll])

  // Trava a rolagem do body enquanto o modal estiver aberto
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

  // Decompõe HTML em páginas se aplicável
  const parsedHtmlPages = useMemo(() => {
    if (!html || typeof window === 'undefined') return []
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const styleTags = Array.from(doc.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((s) => s.outerHTML)
        .join('\n')

      const pageNodes = Array.from(
        doc.querySelectorAll('.dossie-page, .a4-page, .document-page, [data-page]')
      )
      if (pageNodes.length === 0) {
        return [styleTags + doc.body.innerHTML]
      }
      return pageNodes.map((p) => styleTags + p.outerHTML)
    } catch {
      return [html]
    }
  }, [html])

  // Calcula total de páginas efetivo
  const totalPages = useMemo(() => {
    if (propTotalPages) return propTotalPages
    if (pages && pages.length > 0) return pages.length
    if (parsedHtmlPages.length > 0) return parsedHtmlPages.length
    return children ? 1 : 1
  }, [propTotalPages, pages, parsedHtmlPages, children])

  // Navegação
  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  }

  // Ajuste inteligente à largura disponível da tela
  const handleFitToScreen = () => {
    if (containerRef.current) {
      const availableWidth = containerRef.current.clientWidth - 64 // 32px de respiro lateral
      const scale = Math.min(1.25, Math.max(0.5, availableWidth / 794))
      setZoom(Number(scale.toFixed(2)))
    } else {
      setZoom(0.85)
    }
  }

  // Ação primária
  const handlePrimaryAction = async () => {
    if (onConfirm) {
      await onConfirm()
      return
    }
    if (onDownloadPdf) {
      await onDownloadPdf()
      return
    }
    if (onPrint) {
      onPrint()
      return
    }
    // Fallback de impressão nativa limpa
    if (pageContainerRef.current) {
      printElementCleanly(pageContainerRef.current, title)
    }
  }

  // Ação de impressão direta
  const handleDirectPrint = () => {
    if (onPrint) {
      onPrint()
      return
    }
    if (pageContainerRef.current) {
      printElementCleanly(pageContainerRef.current, title)
    }
  }

  // Suporte a atalhos de teclado
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && !isContinuousScroll) {
        handlePrevPage()
      } else if (e.key === 'ArrowRight' && !isContinuousScroll) {
        handleNextPage()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isContinuousScroll, totalPages])

  if (!isOpen) return null

  const hasContent = Boolean(
    (pages && pages.length > 0) ||
      (parsedHtmlPages && parsedHtmlPages.length > 0) ||
      children
  )

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      {/* =================================================================== */}
      {/* 1. TOOLBAR SUPERIOR FIXA */}
      {/* =================================================================== */}
      <header className="h-16 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 z-10 shadow-xs">
        {/* Título & Badges Executivas */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-[#1B4D3E] dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
            {icon || <FileText className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                {title}
              </h2>
              {subtitle && (
                <span className="hidden lg:inline text-xs text-slate-500 font-medium truncate">
                  {subtitle.startsWith('•') ? subtitle : `• ${subtitle}`}
                </span>
              )}
            </div>
            {badges && <div className="flex items-center gap-2 mt-0.5">{badges}</div>}
          </div>
        </div>

        {/* Controles Centrais: Navegação de Páginas e Zoom */}
        <div className="flex items-center gap-3">
          {/* Navegação entre folhas */}
          {totalPages > 1 && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePrevPage}
                disabled={isContinuousScroll || currentPage <= 1}
                className="h-7 w-7 p-0 text-slate-600 dark:text-slate-300"
                title="Página Anterior (Seta Esquerda)"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-semibold px-2 text-slate-700 dark:text-slate-300 select-none">
                {isContinuousScroll
                  ? `Todas as ${totalPages} Folhas`
                  : `Folha ${String(currentPage).padStart(2, '0')} de ${String(totalPages).padStart(2, '0')}`}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleNextPage}
                disabled={isContinuousScroll || currentPage >= totalPages}
                className="h-7 w-7 p-0 text-slate-600 dark:text-slate-300"
                title="Próxima Página (Seta Direita)"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Alternar Rolagem Contínua vs. Folha a Folha */}
          {totalPages > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsContinuousScroll((prev) => !prev)}
              className="hidden sm:inline-flex text-xs h-8 px-2.5 gap-1.5 font-medium border-slate-300 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              title={
                isContinuousScroll
                  ? 'Ver folha por folha'
                  : 'Ver rolagem contínua de todas as folhas'
              }
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isContinuousScroll ? 'Folha Única' : 'Todas as Folhas'}</span>
            </Button>
          )}

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
              onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))))}
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
              className="h-7 px-2 text-xs text-slate-600 dark:text-slate-300 gap-1 font-medium hover:text-[#1B4D3E]"
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
            title="Fechar Visualizador (Esc)"
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
            <Loader2 className="w-10 h-10 animate-spin text-[#1B4D3E] mx-auto" />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {loadingTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{loadingSubtitle}</p>
            </div>
            {/* Skeleton visual de 3 barras */}
            <div className="w-full space-y-2 pt-2">
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse w-5/6 mx-auto" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse w-4/6 mx-auto" />
            </div>
          </div>
        ) : !hasContent ? (
          <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 text-center space-y-3 max-w-md my-auto">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {emptyTitle}
            </h3>
            <p className="text-xs text-slate-500">{emptySubtitle}</p>
          </div>
        ) : (
          /* Container com escala CSS de zoom */
          <div
            ref={pageContainerRef}
            className="flex flex-col items-center transition-transform duration-150 origin-top pb-12"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Modo 1: Array de páginas React */}
            {pages && pages.length > 0 ? (
              isContinuousScroll ? (
                <div className="flex flex-col gap-8">
                  {pages.map((page, index) => (
                    <div
                      key={`page-${index}`}
                      className={cn(
                        'relative bg-white shadow-2xl rounded-xs border border-slate-300 text-left select-text',
                        pageClassName
                      )}
                      style={{ width: pageWidth, minHeight: pageMinHeight }}
                    >
                      {page}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={cn(
                    'relative bg-white shadow-2xl rounded-xs border border-slate-300 text-left select-text',
                    pageClassName
                  )}
                  style={{ width: pageWidth, minHeight: pageMinHeight }}
                >
                  {pages[currentPage - 1] || pages[0]}
                </div>
              )
            ) : parsedHtmlPages.length > 0 ? (
              /* Modo 2: String HTML com decomposição em páginas */
              isContinuousScroll ? (
                <div className="flex flex-col gap-8">
                  {parsedHtmlPages.map((pageHtml, index) => (
                    <div
                      key={`html-page-${index}`}
                      className={cn(
                        'relative bg-white shadow-2xl rounded-xs border border-slate-300 text-left select-text',
                        pageClassName
                      )}
                      style={{ width: pageWidth, minHeight: pageMinHeight }}
                      dangerouslySetInnerHTML={{ __html: pageHtml }}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className={cn(
                    'relative bg-white shadow-2xl rounded-xs border border-slate-300 text-left select-text',
                    pageClassName
                  )}
                  style={{ width: pageWidth, minHeight: pageMinHeight }}
                  dangerouslySetInnerHTML={{
                    __html: parsedHtmlPages[currentPage - 1] || parsedHtmlPages[0],
                  }}
                />
              )
            ) : (
              /* Modo 3: Children React direto */
              <div
                className={cn(
                  'relative bg-white shadow-2xl rounded-xs border border-slate-300 text-left select-text',
                  pageClassName
                )}
                style={{ width: pageWidth, minHeight: pageMinHeight }}
              >
                {children}
              </div>
            )}
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* 3. FOOTER STICKY: AÇÕES DEFINITIVAS & RESOLUÇÃO EXPLICADA */}
      {/* =================================================================== */}
      <footer className="h-16 shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 z-10 shadow-md">
        {/* Metadados Técnicos de Emissão e Resolução Explicada */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {dpiInfo || (
              <>
                Resolução Nativa <strong>336 DPI</strong> • {totalPages}{' '}
                {totalPages === 1 ? 'Página Padronizada' : 'Páginas Padronizadas'} • Conformidade
                Bancária Oficial
              </>
            )}
          </span>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Ações Secundárias Customizadas */}
          {secondaryActions.map((action, idx) => {
            if (action.href) {
              return (
                <Link
                  key={idx}
                  href={action.href}
                  className="text-xs text-slate-700 hover:text-emerald-700 font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                  title={action.title}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </Link>
              )
            }
            return (
              <Button
                key={idx}
                type="button"
                variant={action.variant || 'outline'}
                onClick={action.onClick}
                disabled={action.disabled || isDownloading}
                className="text-xs h-9 px-3 border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
                title={action.title}
              >
                {action.icon}
                <span className={action.icon ? 'ml-1.5' : ''}>{action.label}</span>
              </Button>
            )
          })}

          {/* Botão Secundário de Impressão Direta */}
          {showPrintAction && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDirectPrint}
              disabled={isDownloading || isLoading || !hasContent}
              className="text-xs h-9 px-3.5 border-slate-300 text-slate-700 hover:bg-slate-100 font-medium flex items-center gap-1.5"
              title="Acionar diálogo de impressão do navegador"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>{printActionLabel}</span>
            </Button>
          )}

          {/* Botão Fechar */}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDownloading}
            className="text-xs h-9 px-4 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
          >
            Fechar
          </Button>

          {/* Botão Primário: Emissão / Download / Confirmação */}
          <Button
            type="button"
            onClick={handlePrimaryAction}
            disabled={isDownloading || isLoading || !hasContent}
            className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs h-9 px-5 font-bold gap-2 shadow-sm transition-all cursor-pointer"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{downloadingLabel}</span>
              </>
            ) : (
              <>
                {primaryActionIcon || <Download className="w-4 h-4" />}
                <span>{primaryActionLabel}</span>
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}
