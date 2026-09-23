'use client'

import React, { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  FileText,
  Upload,
  Link as LinkIcon,
  Trash2,
  Plus,
  MessageCircle,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Paperclip,
} from 'lucide-react'
import {
  toggleChecklistItem,
  attachDocumentToChecklistItem,
  linkExistingGedDocument,
  addChecklistItem,
  deleteChecklistItem,
} from '@/actions/demands'
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
  items: ChecklistItemData[]
  producerName: string
  producerPhone?: string | null
  serviceTitle: string
  existingGedDocs?: {
    id: string
    fileName: string
    documentType: string
  }[]
  onRefresh?: () => void
}

export function DemandChecklistSection({
  demandId,
  items,
  producerName,
  producerPhone,
  serviceTitle,
  existingGedDocs = [],
  onRefresh,
}: DemandChecklistSectionProps) {
  const [copied, setCopied] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null)
  const [linkModalItemId, setLinkModalItemId] = useState<string | null>(null)
  const [uploadModalItemId, setUploadModalItemId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Handlers
  const handleToggle = async (itemId: string, currentState: boolean) => {
    try {
      setLoadingItemId(itemId)
      const res = await toggleChecklistItem(itemId, !currentState)
      if (!res.success) throw new Error('Erro ao atualizar item')
      toast.success(!currentState ? 'Documento marcado como entregue.' : 'Documento marcado como pendente.')
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
      if (onRefresh) onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Falha ao remover item')
    } finally {
      setLoadingItemId(null)
    }
  }

  // Ação WhatsApp: Copia texto pronto das pendências
  const handleCopyWhatsApp = () => {
    const pendingItems = items.filter((i) => !i.isDelivered)
    if (pendingItems.length === 0) {
      toast.info('Não há documentos pendentes para este projeto!')
      return
    }

    const textLines = [
      `🌾 *AgroTech Consultoria Rural*`,
      `Olá, *${producerName}*!`,
      ``,
      `Para darmos andamento à sua solicitação de *${serviceTitle}*, precisamos dos seguintes documentos pendentes:`,
      ``,
      ...pendingItems.map((item, idx) => `${idx + 1}. 📄 ${item.title}`),
      ``,
      `Por favor, nos envie fotos legíveis ou PDFs destes documentos por aqui para protocolarmos o projeto.`,
      `Qualquer dúvida, estamos à disposição! 👍`,
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

  return (
    <div className="bg-white rounded-xl border shadow-xs overflow-hidden">
      {/* Cabeçalho */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-[#1B4D3E]" />
            <h3 className="font-bold text-[#1B4D3E] text-base">Checklist Documental do GED</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Entrada única de dados: documentos anexados são arquivados diretamente no GED corporativo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyWhatsApp}
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
                    disabled={isLoading}
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
                          item.isDelivered ? 'text-slate-800 line-through/60' : 'text-slate-900'
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
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                        <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate font-medium text-slate-700">
                          {item.document.fileName}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          No GED
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
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!item.document && (
                    <>
                      {/* Botão Vincular Documento do GED */}
                      {existingGedDocs.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setLinkModalItemId(item.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100/80 border border-sky-200 rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs"
                          title="Vincular documento já existente no GED"
                        >
                          <LinkIcon className="w-3 h-3" />
                          <span>Vincular GED</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* Excluir do Checklist */}
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={isLoading}
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
          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 inline-flex items-center gap-1 shadow-2xs"
        >
          {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          <span>Adicionar</span>
        </button>
      </form>

      {/* Modal Simples de Seleção de Documento Pré-existente no GED */}
      {linkModalItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h4 className="font-bold text-slate-900 text-base mb-1">Vincular Documento do GED</h4>
            <p className="text-xs text-slate-500 mb-4">
              Selecione um arquivo já armazenado no repositório deste cliente/fazenda:
            </p>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl mb-4">
              {existingGedDocs.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await linkExistingGedDocument(linkModalItemId, doc.id)
                      if (!res.success) throw new Error('Falha ao vincular')
                      toast.success(`Documento "${doc.fileName}" vinculado com sucesso!`)
                      setLinkModalItemId(null)
                      if (onRefresh) onRefresh()
                    } catch (e: any) {
                      toast.error(e.message || 'Erro ao vincular documento')
                    }
                  }}
                  className="w-full text-left p-3 hover:bg-emerald-50/50 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{doc.fileName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase shrink-0">{doc.documentType}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setLinkModalItemId(null)}
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
