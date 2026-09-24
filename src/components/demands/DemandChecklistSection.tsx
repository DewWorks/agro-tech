'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Circle,
  FileText,
  Upload,
  Link as LinkIcon,
  Trash2,
  Plus,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Paperclip,
  Eye,
  Search,
  X,
} from 'lucide-react'
import {
  toggleChecklistItem,
  attachDocumentToChecklistItem,
  linkExistingGedDocument,
  addChecklistItem,
  deleteChecklistItem,
} from '@/actions/demands'
import { getSignedUrlForUpload, getSignedUrlForView } from '@/actions/documents'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface ChecklistItemData {
  id: string
  demandId: string
  title: string
  documentType?: string | null
  documentId?: string | null
  isRequired: boolean
  isDelivered: boolean
  deliveredAt?: Date | string | null
  notes?: string | null
  document?: {
    id: string
    fileName: string
    storagePath: string
    complianceStatus?: string | null
  } | null
}

interface DemandChecklistSectionProps {
  demandId: string
  branchId?: string
  producerId?: string
  propertyId?: string | null
  items: ChecklistItemData[]
  producerName: string
  producerPhone?: string | null
  serviceTitle: string
  existingGedDocs?: {
    id: string
    fileName: string
    documentType: string
    createdAt?: Date | string
  }[]
  onRefresh?: () => void
}

export function DemandChecklistSection({
  demandId,
  branchId,
  producerId,
  propertyId,
  items,
  producerName,
  producerPhone,
  serviceTitle,
  existingGedDocs = [],
  onRefresh,
}: DemandChecklistSectionProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null)
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null)
  const [viewingItemId, setViewingItemId] = useState<string | null>(null)
  const [linkModalItemId, setLinkModalItemId] = useState<string | null>(null)
  const [docFilterQuery, setDocFilterQuery] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeUploadTargetItem, setActiveUploadTargetItem] = useState<ChecklistItemData | null>(null)

  // Dispara seleção de arquivo para upload direto
  const handleTriggerUpload = (item: ChecklistItemData) => {
    setActiveUploadTargetItem(item)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  // Upload direto do arquivo selecionado para Supabase Storage + GED + Checklist
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeUploadTargetItem) return

    const item = activeUploadTargetItem
    const targetBranchId = branchId
    const targetProducerId = producerId

    if (!targetBranchId || !targetProducerId) {
      toast.error('Dados de filial ou produtor ausentes para upload no GED.')
      return
    }

    // Validações básicas de formato e tamanho (máx 25MB)
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/tiff',
    ]
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Aceitos: PDF, JPG, PNG e TIFF.')
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error('O arquivo excede o limite de 25MB.')
      return
    }

    try {
      setUploadingItemId(item.id)
      const docType = item.documentType || 'OUTROS'

      // 1. Obter Signed URL de Upload
      const urlRes = await getSignedUrlForUpload({
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        producerId: targetProducerId,
        branchId: targetBranchId,
        propertyId: propertyId || undefined,
        documentType: docType,
      })

      if (!urlRes.success || !urlRes.data) {
        throw new Error(urlRes.error || 'Falha ao gerar autorização de upload no Storage.')
      }

      // 2. Upload via PUT no Supabase Storage
      const uploadResp = await fetch(urlRes.data.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!uploadResp.ok) {
        throw new Error('Falha na transferência do arquivo para o bucket do Storage.')
      }

      // 3. Vincular e registrar no GED corporativo
      const attachRes = await attachDocumentToChecklistItem(item.id, {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storagePath: urlRes.data.storagePath,
        documentType: docType,
      })

      if (!attachRes.success) {
        throw new Error(
          typeof attachRes.error === 'string'
            ? attachRes.error
            : 'Erro ao registrar vínculo com o GED.'
        )
      }

      toast.success(`Documento "${file.name}" anexado e catalogado no GED!`)
      router.refresh()
      if (onRefresh) onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar upload do documento.')
    } finally {
      setUploadingItemId(null)
      setActiveUploadTargetItem(null)
    }
  }

  // Visualização rápida via Signed URL segura
  const handleQuickView = async (item: ChecklistItemData) => {
    if (!item.document?.storagePath) {
      toast.error('Caminho de armazenamento do documento não encontrado.')
      return
    }

    try {
      setViewingItemId(item.id)
      const res = await getSignedUrlForView(item.document.storagePath)
      if (!res.success || !res.data?.signedUrl) {
        throw new Error(res.error || 'Falha ao gerar link seguro de visualização.')
      }
      window.open(res.data.signedUrl, '_blank')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao abrir visualização do arquivo.')
    } finally {
      setViewingItemId(null)
    }
  }

  // Marcar/Desmarcar manualmente
  const handleToggle = async (itemId: string, currentState: boolean) => {
    try {
      setLoadingItemId(itemId)
      const res = await toggleChecklistItem(itemId, !currentState)
      if (!res.success) throw new Error('Erro ao atualizar item')
      toast.success(!currentState ? 'Documento marcado como entregue.' : 'Documento marcado como pendente.')
      router.refresh()
      if (onRefresh) onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Falha ao atualizar')
    } finally {
      setLoadingItemId(null)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    try {
      setIsAdding(true)
      const res = await addChecklistItem(demandId, newTitle.trim())
      if (!res.success) throw new Error('Erro ao adicionar documento')
      toast.success('Documento adicionado ao checklist.')
      setNewTitle('')
      router.refresh()
      if (onRefresh) onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Falha ao adicionar item')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Deseja realmente remover este documento do checklist?')) return

    try {
      setLoadingItemId(itemId)
      const res = await deleteChecklistItem(itemId)
      if (!res.success) throw new Error('Erro ao remover documento')
      toast.success('Documento removido.')
      router.refresh()
      if (onRefresh) onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Falha ao remover item')
    } finally {
      setLoadingItemId(null)
    }
  }

  // Copia mensagem padronizada de pendências
  const handleCopyPendingMessage = () => {
    const pendingItems = items.filter((i) => !i.isDelivered)
    if (pendingItems.length === 0) {
      toast.info('Não há documentos pendentes para este projeto!')
      return
    }

    const textLines = [
      `*AgroTech Consultoria Rural*`,
      `Olá, *${producerName}*!`,
      ``,
      `Para darmos andamento à sua solicitação de *${serviceTitle}*, precisamos dos seguintes documentos pendentes:`,
      ``,
      ...pendingItems.map((item, idx) => `${idx + 1}. ${item.title}`),
      ``,
      `Por favor, nos envie fotos legíveis ou PDFs destes documentos para protocolarmos o projeto.`,
      `Qualquer dúvida, estamos à disposição!`,
    ]

    const fullText = textLines.join('\n')
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    toast.success('Lista de pendências copiada para a área de transferência!')
    setTimeout(() => setCopied(false), 3000)
  }

  const total = items.length
  const delivered = items.filter((i) => i.isDelivered).length
  const pending = total - delivered
  const percentage = total > 0 ? Math.round((delivered / total) * 100) : 100

  // Documentos filtrados no modal do GED
  const filteredGedDocs = existingGedDocs.filter((doc) => {
    if (!docFilterQuery.trim()) return true
    const term = docFilterQuery.toLowerCase()
    return (
      doc.fileName.toLowerCase().includes(term) ||
      doc.documentType.toLowerCase().includes(term)
    )
  })

  return (
    <div className="bg-white rounded-xl border shadow-xs overflow-hidden">
      {/* Input Oculto de Arquivo */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf,image/png,image/jpeg,image/tiff"
        className="hidden"
      />

      {/* Cabeçalho */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-[#1B4D3E]" />
            <h3 className="font-bold text-[#1B4D3E] text-base">Checklist Documental do GED</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Entrada única de dados: documentos anexados são sincronizados com o repositório corporativo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyPendingMessage}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-emerald-600" />}
            <span>{copied ? 'Copiado!' : 'Copiar Mensagem de Pendências'}</span>
          </button>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Progresso Geral:</span>
          <span className="font-bold text-emerald-700">
            {delivered} de {total} documentos ({percentage}%)
          </span>
        </div>
        {pending > 0 ? (
          <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
            {pending} pendência{pending > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Completo
          </span>
        )}
      </div>

      {/* Lista de Itens do Checklist */}
      <div className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Nenhum documento exigido cadastrado para esta demanda.
          </div>
        ) : (
          items.map((item) => {
            const isLoading = loadingItemId === item.id
            const isUploading = uploadingItemId === item.id
            const isViewing = viewingItemId === item.id

            return (
              <div
                key={item.id}
                className={cn(
                  'p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors',
                  item.isDelivered ? 'bg-slate-50/40 hover:bg-slate-50' : 'bg-white hover:bg-slate-50/60'
                )}
              >
                {/* Lado Esquerdo: Checkbox & Título */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id, item.isDelivered)}
                    disabled={isLoading || isUploading}
                    className="mt-0.5 text-slate-400 hover:text-emerald-600 focus:outline-hidden transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    ) : item.isDelivered ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          'text-sm font-semibold truncate',
                          item.isDelivered ? 'text-slate-800' : 'text-slate-900'
                        )}
                      >
                        {item.title}
                      </span>
                      {item.isRequired && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200/60">
                          Obrigatório
                        </span>
                      )}
                    </div>

                    {/* Vínculo de Arquivo no GED */}
                    {item.document ? (
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                        <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate font-medium text-slate-700 max-w-[280px]">
                          {item.document.fileName}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Anexado
                        </span>
                      </div>
                    ) : item.isDelivered ? (
                      <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                        Marcado manualmente como entregue
                      </p>
                    ) : (
                      <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                        Pendente de recebimento
                      </p>
                    )}
                  </div>
                </div>

                {/* Lado Direito: Ações rápidas */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center flex-wrap">
                  {item.document ? (
                    <>
                      {/* Botão de Visualização Rápida (Eye) */}
                      <button
                        type="button"
                        onClick={() => handleQuickView(item)}
                        disabled={isViewing}
                        className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                        title="Visualizar documento em nova aba"
                      >
                        {isViewing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-emerald-700" />
                        )}
                        <span>Visualizar</span>
                      </button>

                      {/* Substituir Arquivo */}
                      <button
                        type="button"
                        onClick={() => handleTriggerUpload(item)}
                        disabled={isUploading}
                        className="px-2 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Substituir arquivo por nova versão"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Substituir</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Botão Upload Direto */}
                      <button
                        type="button"
                        onClick={() => handleTriggerUpload(item)}
                        disabled={isUploading}
                        className="px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                        title="Anexar arquivo do seu computador diretamente para o GED"
                      >
                        {isUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>Anexar Arquivo</span>
                      </button>

                      {/* Botão Vincular Documento do GED Existente */}
                      <button
                        type="button"
                        onClick={() => setLinkModalItemId(item.id)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Vincular documento já existente no repositório GED"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Vincular do GED</span>
                      </button>
                    </>
                  )}

                  {/* Excluir do Checklist */}
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={isLoading || isUploading}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remover documento do checklist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Formulário para Adicionar Novo Documento */}
      <form onSubmit={handleAddItem} className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="+ Adicionar outro documento exigido ao checklist..."
          className="flex-1 text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={isAdding || !newTitle.trim()}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 inline-flex items-center gap-1 shadow-2xs cursor-pointer"
        >
          {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          <span>Adicionar</span>
        </button>
      </form>

      {/* Modal de Seleção de Documento Pré-existente no GED */}
      {linkModalItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900 text-base">Vincular Documento do GED Existente</h4>
              <button
                type="button"
                onClick={() => {
                  setLinkModalItemId(null)
                  setDocFilterQuery('')
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Selecione um arquivo já armazenado no repositório deste produtor/fazenda para associar ao checklist:
            </p>

            {/* Campo de Busca Rápida de Documentos */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={docFilterQuery}
                onChange={(e) => setDocFilterQuery(e.target.value)}
                placeholder="Filtrar por nome ou tipo de documento..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl mb-4">
              {filteredGedDocs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  {existingGedDocs.length === 0
                    ? 'Nenhum documento arquivado no GED para este produtor ainda. Faça o upload direto pelo botão "Anexar Arquivo".'
                    : 'Nenhum documento encontrado com o filtro informado.'}
                </div>
              ) : (
                filteredGedDocs.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await linkExistingGedDocument(linkModalItemId, doc.id)
                        if (!res.success) throw new Error('Falha ao vincular documento')
                        toast.success(`Documento "${doc.fileName}" vinculado com sucesso!`)
                        setLinkModalItemId(null)
                        setDocFilterQuery('')
                        router.refresh()
                        if (onRefresh) onRefresh()
                      } catch (e: any) {
                        toast.error(e.message || 'Erro ao vincular documento')
                      }
                    }}
                    className="w-full text-left p-3 hover:bg-emerald-50/50 transition-colors flex items-center justify-between text-xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate group-hover:text-emerald-800">
                        {doc.fileName}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium uppercase shrink-0">
                      {doc.documentType}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setLinkModalItemId(null)
                  setDocFilterQuery('')
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
