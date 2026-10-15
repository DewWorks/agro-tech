'use client'

import React, { useState } from 'react'
import { FinancialModal } from './FinancialModal'
import { deleteCommercialPartner } from '@/actions/financial/partners'
import { toast } from 'sonner'
import { Trash2, AlertTriangle } from 'lucide-react'

interface DeletePartnerModalProps {
  isOpen: boolean
  onClose: () => void
  partner: { id: string; name: string } | null
  onSuccess: () => void
}

export default function DeletePartnerModal({
  isOpen,
  onClose,
  partner,
  onSuccess,
}: DeletePartnerModalProps) {
  const [loading, setLoading] = useState(false)

  if (!partner) return null

  const handleDelete = async () => {
    try {
      setLoading(true)
      const res = await deleteCommercialPartner(partner.id)
      if (res.error) {
        toast.error(res.error)
        return
      }

      if (res.inactivated) {
        toast.success(res.message || 'Parceiro inativado com sucesso. O histórico financeiro foi preservado para auditoria.')
      } else {
        toast.success(res.message || `Parceiro "${partner.name}" excluído com sucesso.`)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao excluir parceiro.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <FinancialModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2 text-rose-700">
          <Trash2 className="w-4 h-4 text-rose-600" />
          <span>Excluir Parceiro Comercial</span>
        </span>
      }
      loading={loading}
      submitLabel="Excluir Definitivamente"
      submitVariant="rose"
      onSubmit={handleDelete}
    >
      <div className="space-y-3 py-2 text-xs">
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-900 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            Tem certeza de que deseja excluir o parceiro comercial <strong>"{partner.name}"</strong>?
          </div>
        </div>

        <p className="text-slate-600 leading-relaxed">
          Por motivos de compliance e rastreabilidade contábil, a exclusão só será permitida se o parceiro não possuir propostas indicadas nem comissões apuradas no histórico. Caso existam movimentações, recomenda-se <strong>inativar</strong> o parceiro.
        </p>
      </div>
    </FinancialModal>
  )
}
