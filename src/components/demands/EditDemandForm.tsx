'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateDemand } from '@/actions/demands'
import {
  RURAL_SERVICE_TYPES,
  RURAL_SERVICES_CATALOG,
  RuralServiceTypeCode,
  DemandPriorityCode,
} from '@/lib/validations/demands'
import {
  Briefcase,
  User,
  Home,
  Calendar,
  Loader2,
  ArrowLeft,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'

interface PropertyOption {
  id: string
  name: string
  city?: string | null
  state?: string | null
}

interface UserOption {
  id: string
  fullName?: string | null
  email: string
}

interface EditDemandFormProps {
  demand: any
  properties: PropertyOption[]
  users: UserOption[]
}

export function EditDemandForm({ demand, properties, users }: EditDemandFormProps) {
  const router = useRouter()

  const [propertyId, setPropertyId] = useState(demand.propertyId || '')
  const [assignedToId, setAssignedToId] = useState(demand.assignedToId || demand.assigneeId || '')
  const [serviceType, setServiceType] = useState<RuralServiceTypeCode>(demand.serviceType)
  const [customServiceType, setCustomServiceType] = useState(demand.customServiceType || '')
  const [priority, setPriority] = useState<DemandPriorityCode>(demand.priority)
  const [proposalId, setProposalId] = useState(demand.proposalId || '')
  const [description, setDescription] = useState(demand.description || '')
  const [notes, setNotes] = useState(demand.notes || '')

  const requestDateStr = demand.requestDate
    ? new Date(demand.requestDate).toISOString().split('T')[0]
    : ''
  const [requestDate, setRequestDate] = useState(requestDateStr)

  const estimatedDateStr = demand.estimatedDeliveryDate
    ? new Date(demand.estimatedDeliveryDate).toISOString().split('T')[0]
    : ''
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(estimatedDateStr)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)
      const payload = {
        propertyId: propertyId || null,
        assignedToId: assignedToId || null,
        serviceType,
        customServiceType: serviceType === 'OUTROS' ? customServiceType.trim() : null,
        priority,
        proposalId: proposalId.trim() || null,
        description: description.trim() || null,
        notes: notes.trim() || null,
        requestDate: requestDate ? new Date(requestDate) : undefined,
        estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
      }

      const res = await updateDemand(demand.id, payload)
      if (!res.success) {
        throw new Error(typeof res.error === 'string' ? res.error : 'Erro ao atualizar demanda')
      }

      toast.success('Demanda atualizada com sucesso!')
      router.push(`/admin/demands/${demand.id}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Falha ao salvar alterações')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/demands/${demand.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Detalhes</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="font-bold text-slate-900 text-base">Editar Cadastro da Demanda</h2>
          <p className="text-xs text-slate-500">
            Produtor:{' '}
            <strong className="text-slate-800">{demand.producer?.name || 'Não identificado'}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Propriedade / Fazenda
            </label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">Nenhuma propriedade vinculada</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.city ? `(${p.city}/${p.state})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Responsável Técnico
            </label>
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">Não atribuído</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName || u.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tipo de Serviço Oficial
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as RuralServiceTypeCode)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {RURAL_SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {RURAL_SERVICES_CATALOG[type]?.label || type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Prioridade
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as DemandPriorityCode)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
        </div>

        {serviceType === 'OUTROS' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Especifique o Serviço
            </label>
            <input
              type="text"
              value={customServiceType}
              onChange={(e) => setCustomServiceType(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Proposta / Dossiê
            </label>
            <input
              type="text"
              value={proposalId}
              onChange={(e) => setProposalId(e.target.value)}
              placeholder="Ex: PRP-2026-089"
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Data de Solicitação
            </label>
            <input
              type="date"
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Previsão de Entrega (SLA)
            </label>
            <input
              type="date"
              value={estimatedDeliveryDate}
              onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Descrição / Especificações
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full text-sm rounded-xl border border-slate-300 p-3 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Notas Internas
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full text-sm rounded-xl border border-slate-300 p-3 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href={`/admin/demands/${demand.id}`}
          className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
