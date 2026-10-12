'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users2,
  PlusCircle,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Unlock,
  Building,
  Edit2,
  Trash2,
} from 'lucide-react'
import { formatCPF, formatCNPJ } from '@/lib/utils'
import { toggleCommercialPartnerStatus } from '@/actions/financial/partners'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import NewPartnerModal from './modals/NewPartnerModal'
import EditPartnerNameModal from './modals/EditPartnerNameModal'
import DeletePartnerModal from './modals/DeletePartnerModal'

interface PartnersListClientProps {
  partners: any[]
  branches: any[]
  currentBranchId?: string | null
}

export default function PartnersListClient({
  partners,
  branches,
  currentBranchId,
}: PartnersListClientProps) {
  const router = useRouter()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editPartner, setEditPartner] = useState<{ id: string; name: string } | null>(null)
  const [deletePartner, setDeletePartner] = useState<{ id: string; name: string } | null>(null)

  // Copiar chave PIX em 1 clique
  const handleCopyPix = (key: string, id: string) => {
    if (!key) {
      toast.error('Parceiro não possui chave PIX cadastrada.')
      return
    }
    navigator.clipboard.writeText(key)
    setCopiedId(id)
    toast.success(`Chave PIX copiada: ${key}`)
    setTimeout(() => setCopiedId(null), 2500)
  }

  // Ativar / Inativar Parceiro
  const handleToggleStatus = async (partnerId: string, currentActive: boolean) => {
    const actionLabel = currentActive ? 'Inativando' : 'Reativando'
    const toastId = toast.loading(`${actionLabel} parceiro comercial...`)

    try {
      const res = await toggleCommercialPartnerStatus(partnerId, !currentActive)
      if (res.error) {
        toast.dismiss(toastId)
        toast.error(res.error)
        return
      }

      toast.dismiss(toastId)
      toast.success(
        currentActive
          ? 'Parceiro inativado para novas indicações.'
          : 'Parceiro reativado com sucesso!'
      )
      router.refresh()
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err?.message || 'Falha ao alterar status.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra de Ações Rápidas */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Parceiros Comerciais & Correspondentes
          </h2>
          <p className="text-xs text-slate-500">
            Originação externa de propostas, cadastro de chaves PIX para repasse e controle da trava de segurança com liberação proporcional à quitação do produtor.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-emerald-800 hover:bg-emerald-900 text-white gap-2 text-xs font-semibold shadow-xs"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Cadastrar Parceiro</span>
        </Button>
      </div>

      {/* Grid de Parceiros */}
      {partners.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Users2 className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-sm font-bold text-slate-800">
            Nenhum parceiro comercial cadastrado
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Cadastre os intermediadores, corretores e agrônomos que indicam operações de crédito.
          </p>
          <Button
            onClick={() => setModalOpen(true)}
            variant="outline"
            className="mt-4 gap-2 text-xs font-semibold"
          >
            <PlusCircle className="h-4 w-4" />
            Cadastrar Primeiro Parceiro
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => {
            const isCpf = partner.document.length === 11
            const formattedDoc = isCpf ? formatCPF(partner.document) : formatCNPJ(partner.document)

            return (
              <div
                key={partner.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-sm"
              >
                <div>
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs uppercase">
                        {partner.name.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          {partner.name}
                        </h4>
                        <span className="font-mono text-[11px] text-slate-400">
                          {formattedDoc}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditPartner({ id: partner.id, name: partner.name })}
                        title="Editar Nome do Parceiro"
                        className="text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors p-1 rounded-md cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(partner.id, partner.isActive)}
                        title={partner.isActive ? 'Inativar Parceiro' : 'Reativar Parceiro'}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors p-1 rounded-md cursor-pointer"
                      >
                        {partner.isActive ? (
                          <Unlock className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletePartner({ id: partner.id, name: partner.name })}
                        title="Excluir Parceiro"
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors p-1 rounded-md cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          partner.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {partner.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>

                  {/* Informações da Filial e Taxa */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-50 p-2.5">
                      <span className="text-[10px] text-slate-400 block font-medium">Filial Base</span>
                      <div className="flex items-center gap-1 font-bold text-slate-700 mt-0.5">
                        <Building className="h-3 w-3 text-slate-400" />
                        <span className="truncate">{partner.branch?.name || 'Geral'}</span>
                      </div>
                    </div>

                    <div className="rounded-lg bg-emerald-50/60 p-2.5">
                      <span className="text-[10px] text-emerald-800 block font-medium">Comissão Padrão</span>
                      <div className="font-black text-emerald-900 mt-0.5">
                        {Number(partner.defaultCommissionRate)}%
                      </div>
                    </div>
                  </div>

                  {/* Dados PIX com Cópia Rápida */}
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Chave PIX ({partner.pixKeyType})
                      </span>
                      <button
                        onClick={() => handleCopyPix(partner.pixKey, partner.id)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
                      >
                        {copiedId === partner.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-700" />
                            <span className="text-emerald-700">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="mt-1 font-mono text-xs font-semibold text-slate-800 truncate select-all">
                      {partner.pixKey}
                    </div>
                  </div>

                  {/* Indicadores de Propostas */}
                  <div className="mt-3 flex items-center justify-between text-xs px-1 text-slate-500">
                    <span>Propostas Indicadas:</span>
                    <span className="font-bold text-slate-800">
                      {partner._count?.receivableTitles || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs px-1 text-slate-500 mt-1">
                    <span>Comissões Geradas:</span>
                    <span className="font-bold text-slate-800">
                      {partner._count?.commissions || 0}
                    </span>
                  </div>
                </div>

                {/* Rodapé: Link para Extrato Individual */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {partner.phone || 'Sem telefone'}
                  </span>
                  <Link
                    href={`/admin/financial/partners/${partner.id}`}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
                  >
                    <span>Extrato de Comissões</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Decomposto Montado Sob Demanda */}
      {modalOpen && (
        <NewPartnerModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          branches={branches}
          currentBranchId={currentBranchId}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* Modal de Edição de Nome */}
      {editPartner && (
        <EditPartnerNameModal
          isOpen={Boolean(editPartner)}
          onClose={() => setEditPartner(null)}
          partnerId={editPartner.id}
          currentName={editPartner.name}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* Modal de Exclusão com Validação de Vínculos */}
      {deletePartner && (
        <DeletePartnerModal
          isOpen={Boolean(deletePartner)}
          onClose={() => setDeletePartner(null)}
          partner={deletePartner}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  )
}
