'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Users2,
  PlusCircle,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Unlock,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building,
} from 'lucide-react'
import { formatCurrency, formatCPF, formatCNPJ } from '@/lib/utils'
import { createCommercialPartner, toggleCommercialPartnerStatus } from '@/actions/financial/partners'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Formulário de Cadastro
  const [branchId, setBranchId] = useState(currentBranchId || branches[0]?.id || '')
  const [name, setName] = useState('')
  const [document, setDocument] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [pixKey, setPixKey] = useState('')
  const [pixKeyType, setPixKeyType] = useState<'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA'>('CPF')
  const [defaultCommissionRate, setDefaultCommissionRate] = useState<number>(20.0)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // Cadastrar parceiro
  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!branchId || !name || !document || !pixKey) {
      toast.error('Preencha os campos obrigatórios (Nome, CPF/CNPJ, Chave PIX).')
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading('Cadastrando parceiro comercial...')

    try {
      const res = await createCommercialPartner({
        branchId,
        name: name.trim(),
        document: document.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        pixKey: pixKey.trim(),
        pixKeyType,
        defaultCommissionRate,
      })

      if (res.error) {
        toast.dismiss(toastId)
        toast.error(res.error)
        return
      }

      toast.dismiss(toastId)
      toast.success('Parceiro cadastrado com sucesso!')
      setModalOpen(false)
      window.location.reload()
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err?.message || 'Falha ao cadastrar parceiro.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de Ações Superior */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Rede de Correspondentes e Corretores Cadastrados
          </h3>
          <p className="text-xs text-slate-500">
            Governança da Trava de Comissões e gestão de liquidação de honorários por chave PIX.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs gap-1.5"
        >
          <PlusCircle className="h-4 w-4" />
          Novo Parceiro Comercial
        </Button>
      </div>

      {/* Grid de Cards dos Parceiros */}
      {partners.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400">
          Nenhum parceiro comercial cadastrado nesta filial.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => {
            const hasPix = !!partner.pixKey

            return (
              <div
                key={partner.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all"
              >
                <div>
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{partner.name}</span>
                        {!partner.isActive && (
                          <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 border border-rose-200 uppercase">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {partner.document?.length === 11
                          ? formatCPF(partner.document)
                          : formatCNPJ(partner.document)}
                        {partner.branch ? ` • ${partner.branch.name}` : ''}
                      </div>
                    </div>

                    <div className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-200">
                      {Number(partner.defaultCommissionRate || 20)}% comissão
                    </div>
                  </div>

                  {/* Chave PIX com cópia em 1-clique */}
                  <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                      <span>Chave PIX ({partner.pixKeyType || 'CHAVE'})</span>
                      {hasPix && (
                        <button
                          type="button"
                          onClick={() => handleCopyPix(partner.pixKey, partner.id)}
                          className="flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-bold transition-colors"
                        >
                          {copiedId === partner.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span className="text-emerald-600">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="mt-1 font-mono text-xs font-bold text-slate-800 break-all select-all">
                      {partner.pixKey || 'Chave PIX não informada'}
                    </div>
                  </div>

                  {/* Resumo de Propostas */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-600 px-1">
                    <span>Propostas Originadas:</span>
                    <span className="font-extrabold text-slate-900">
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

      {/* MODAL DE CADASTRO DE PARCEIRO COMERCIAL */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Cadastrar Parceiro Comercial (Corretor / Prospectador)
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreatePartner} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Filial:</Label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    📍 {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nome Completo / Razão Social:</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Eduardo Silveira"
                className="text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">CPF ou CNPJ:</Label>
                <Input
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  placeholder="000.000.000-00"
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Telefone / WhatsApp:</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(63) 99999-0000"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">E-mail (Opcional):</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parceiro@email.com"
                className="text-xs"
              />
            </div>

            {/* Configuração da Chave PIX */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-500">
                Dados Bancários para Repasse (PIX):
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Tipo de Chave:</Label>
                  <select
                    value={pixKeyType}
                    onChange={(e) => setPixKeyType(e.target.value as any)}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800"
                  >
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="TELEFONE">Telefone</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="ALEATORIA">Aleatória</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1">
                  <Label className="text-[11px] font-semibold">Chave PIX:</Label>
                  <Input
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="Chave para pagamento"
                    className="text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <Label className="text-[11px] font-semibold">Percentual de Comissão Padrão (%):</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={defaultCommissionRate}
                  onChange={(e) => setDefaultCommissionRate(parseFloat(e.target.value) || 0)}
                  className="text-xs font-bold text-emerald-800"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Cadastrar Parceiro'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
