'use client'

import React, { useState, useEffect } from 'react'
import { FinancialModal } from './FinancialModal'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { updateCommercialPartnerName } from '@/actions/financial/partners'
import { toast } from 'sonner'
import { Edit2 } from 'lucide-react'

interface EditPartnerNameModalProps {
  isOpen: boolean
  onClose: () => void
  partnerId: string
  currentName: string
  onSuccess: () => void
}

export default function EditPartnerNameModal({
  isOpen,
  onClose,
  partnerId,
  currentName,
  onSuccess,
}: EditPartnerNameModalProps) {
  const [name, setName] = useState(currentName)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setName(currentName)
  }, [currentName])

  const handleSubmit = async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length < 2) {
      toast.error('O nome do parceiro deve ter pelo menos 2 caracteres.')
      return
    }

    try {
      setLoading(true)
      const res = await updateCommercialPartnerName(partnerId, trimmed)
      if (res.error) {
        toast.error(res.error)
        return
      }

      toast.success('Nome do parceiro atualizado com sucesso!')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao atualizar nome do parceiro.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <FinancialModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Edit2 className="w-4 h-4 text-emerald-700" />
          <span>Editar Nome do Parceiro Comercial</span>
        </span>
      }
      loading={loading}
      submitLabel="Salvar Alteração"
      submitDisabled={!name.trim() || name.trim() === currentName}
      onSubmit={handleSubmit}
    >
      <div className="space-y-3 py-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">
            Nome Completo / Razão Social *
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Digite o novo nome do parceiro..."
            className="text-xs h-9 bg-white"
            autoFocus
          />
        </div>
        <p className="text-[11px] text-slate-500">
          A alteração do nome é refletida em todos os extratos, relatórios de comissões e títulos a receber vinculados.
        </p>
      </div>
    </FinancialModal>
  )
}
