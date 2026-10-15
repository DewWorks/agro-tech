'use client'

import React, { useState, useEffect } from 'react'
import { maskDocument, maskPixKey, validatePixKey, maskPhone } from '@/lib/utils'
import { validateCPF, validateCNPJ } from '@/lib/utils/masks'
import { updateCommercialPartner } from '@/actions/financial/partners'
import { toast } from 'sonner'
import { FinancialModal, FormField, InputField } from './FinancialModal'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Edit2 } from 'lucide-react'

const PIX_CONFIG: Record<string, { placeholder: string; maxLen: number }> = {
  CPF: { placeholder: '000.000.000-00', maxLen: 14 },
  CNPJ: { placeholder: '00.000.000/0000-00', maxLen: 18 },
  TELEFONE: { placeholder: '(63) 99999-0000', maxLen: 15 },
  EMAIL: { placeholder: 'financeiro@parceiro.com', maxLen: 80 },
  ALEATORIA: { placeholder: 'Chave EVP (32+ caracteres)', maxLen: 36 },
}

interface EditPartnerModalProps {
  isOpen: boolean
  onClose: () => void
  partner: any | null
  onSuccess: () => void
}

export default function EditPartnerModal({
  isOpen,
  onClose,
  partner,
  onSuccess,
}: EditPartnerModalProps) {
  const [name, setName] = useState('')
  const [document, setDocument] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [pixKey, setPixKey] = useState('')
  const [pixKeyType, setPixKeyType] = useState<'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA'>('CPF')
  const [rate, setRate] = useState(20.0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (partner) {
      setName(partner.name || '')
      setDocument(partner.document ? maskDocument(partner.document) : '')
      setPhone(partner.phone ? maskPhone(partner.phone) : '')
      setEmail(partner.email || '')
      setPixKey(partner.pixKey || '')
      setPixKeyType(partner.pixKeyType || 'CPF')
      setRate(Number(partner.defaultCommissionRate) || 20.0)
    }
  }, [partner])

  if (!partner) return null

  const pixValidation = pixKey ? validatePixKey(pixKey, pixKeyType) : null
  const pixCfg = PIX_CONFIG[pixKeyType] || PIX_CONFIG.CPF

  const handleUpdatePartner = async () => {
    if (!name.trim() || !document.trim() || !pixKey.trim()) {
      toast.error('Preencha os campos obrigatórios (Nome, CPF/CNPJ, Chave PIX).')
      return
    }

    const cleanDoc = document.replace(/\D/g, '')
    if (
      (cleanDoc.length === 11 && !validateCPF(cleanDoc)) ||
      (cleanDoc.length === 14 && !validateCNPJ(cleanDoc)) ||
      (cleanDoc.length !== 11 && cleanDoc.length !== 14)
    ) {
      toast.error('Documento inválido. Informe CPF ou CNPJ válido.')
      return
    }

    const pixCheck = validatePixKey(pixKey, pixKeyType)
    if (!pixCheck.isValid) {
      toast.error(pixCheck.error || 'Chave PIX inválida.')
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading('Atualizando parceiro...')

    try {
      const res = await updateCommercialPartner(partner.id, {
        name: name.trim(),
        document: cleanDoc,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        pixKey: pixKey.trim(),
        pixKeyType,
        defaultCommissionRate: rate,
      })

      if (res.error) {
        toast.dismiss(toastId)
        toast.error(res.error)
        return
      }

      toast.dismiss(toastId)
      toast.success('Parceiro comercial atualizado com sucesso!')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err?.message || 'Falha ao atualizar parceiro.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FinancialModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Edit2 className="w-4 h-4 text-emerald-700" />
          <span>Editar Parceiro Comercial</span>
        </span>
      }
      submitLabel="Salvar Alterações"
      loading={isSubmitting}
      submitDisabled={!name.trim() || !document.trim() || !pixKey.trim()}
      onSubmit={handleUpdatePartner}
    >
      <InputField
        label="Nome Completo / Razão Social *:"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Carlos Eduardo Silveira"
      />

      <div className="grid grid-cols-2 gap-2">
        <InputField
          label="CPF ou CNPJ *:"
          value={document}
          onChange={(e) => setDocument(maskDocument(e.target.value))}
          placeholder="000.000.000-00"
          maxLength={18}
          className="font-mono"
        />
        <InputField
          label="Telefone / WhatsApp:"
          value={phone}
          onChange={(e) => setPhone(maskPhone(e.target.value))}
          placeholder="(63) 99999-0000"
          maxLength={15}
        />
      </div>

      <InputField
        label="E-mail (Opcional):"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="parceiro@email.com"
      />

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 space-y-2">
        <span className="text-[10px] font-bold uppercase text-slate-500">
          Dados Bancários para Repasse (PIX):
        </span>
        <div className="grid grid-cols-3 gap-2">
          <FormField label="Tipo:">
            <Select
              value={pixKeyType}
              onValueChange={(val: any) => {
                setPixKeyType(val)
                setPixKey((prev) => maskPixKey(prev, val))
              }}
            >
              <SelectTrigger className="w-full text-xs font-semibold bg-white border-slate-200">
                <SelectValue placeholder="Tipo">{pixKeyType}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CPF">CPF</SelectItem>
                <SelectItem value="CNPJ">CNPJ</SelectItem>
                <SelectItem value="TELEFONE">Telefone</SelectItem>
                <SelectItem value="EMAIL">E-mail</SelectItem>
                <SelectItem value="ALEATORIA">Aleatória</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <div className="col-span-2">
            <FormField
              label="Chave PIX *:"
              error={pixValidation && !pixValidation.isValid ? pixValidation.error : undefined}
            >
              <Input
                value={pixKey}
                onChange={(e) => setPixKey(maskPixKey(e.target.value, pixKeyType))}
                placeholder={pixCfg.placeholder}
                maxLength={pixCfg.maxLen}
                className="text-xs font-mono font-bold"
              />
            </FormField>
          </div>
        </div>
        <InputField
          label="Percentual Padrão de Comissão (%):"
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
          className="font-bold text-emerald-800"
        />
      </div>
    </FinancialModal>
  )
}
