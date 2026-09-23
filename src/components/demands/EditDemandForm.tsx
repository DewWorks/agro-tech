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
  ClipboardList,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'

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

interface BranchOption {
  id: string
  name: string
}

interface EditDemandFormProps {
  demand: any
  properties: PropertyOption[]
  branches?: BranchOption[]
  users: UserOption[]
}

export function EditDemandForm({ demand, properties, branches = [], users }: EditDemandFormProps) {
  const router = useRouter()

  const [branchId, setBranchId] = useState(demand.branchId || '')
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
        branchId: branchId || undefined,
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
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/demands/${demand.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Detalhes</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl p-6 border shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="font-bold text-[#1B4D3E] text-base flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#1B4D3E]" />
            Editar Cadastro da Demanda
          </h2>
          <p className="text-xs text-muted-foreground">
            Produtor:{' '}
            <strong className="text-foreground">{demand.producer?.name || 'Não identificado'}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filial de Atendimento */}
          {branches.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Filial de Atendimento
              </label>
              <Select value={branchId} onValueChange={(val) => setBranchId(val || '')}>
                <SelectTrigger className="w-full text-sm rounded-xl border border-slate-300 bg-white h-11 text-slate-800">
                  <SelectValue placeholder="Selecione a filial...">
                    {(() => {
                      const b = branches.find((item) => item.id === branchId)
                      return b ? b.name : undefined
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Propriedade / Fazenda
            </label>
            <Select
              value={propertyId || 'NONE'}
              onValueChange={(val) => setPropertyId(val === 'NONE' || !val ? '' : val)}
            >
              <SelectTrigger className="w-full text-sm rounded-xl border border-slate-300 bg-white h-11 text-slate-800">
                <SelectValue placeholder="Nenhuma propriedade vinculada">
                  {(() => {
                    if (!propertyId || propertyId === 'NONE') return undefined
                    const p = properties.find((prop) => prop.id === propertyId)
                    return p ? `${p.name} ${p.city ? `(${p.city}/${p.state})` : ''}` : undefined
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Nenhuma propriedade vinculada</SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.city ? `(${p.city}/${p.state})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Responsável Técnico
            </label>
            <Select
              value={assignedToId || 'UNASSIGNED'}
              onValueChange={(val) => setAssignedToId(val === 'UNASSIGNED' || !val ? '' : val)}
            >
              <SelectTrigger className="w-full text-sm rounded-xl border border-slate-300 bg-white h-11 text-slate-800">
                <SelectValue placeholder="Não atribuído">
                  {(() => {
                    if (!assignedToId || assignedToId === 'UNASSIGNED') return undefined
                    const u = users.find((usr) => usr.id === assignedToId)
                    return u ? (u.fullName || u.email) : undefined
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNASSIGNED">Não atribuído</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.fullName || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tipo de Serviço Oficial
            </label>
            <Select
              value={serviceType}
              onValueChange={(val) => val && setServiceType(val as RuralServiceTypeCode)}
            >
              <SelectTrigger className="w-full text-sm rounded-xl border border-slate-300 bg-white h-11 text-slate-800 font-medium">
                <SelectValue placeholder="Selecione o tipo de serviço">
                  {RURAL_SERVICES_CATALOG[serviceType]?.label || serviceType}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {RURAL_SERVICE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {RURAL_SERVICES_CATALOG[type]?.label || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Prioridade
            </label>
            <Select
              value={priority}
              onValueChange={(val) => val && setPriority(val as DemandPriorityCode)}
            >
              <SelectTrigger className="w-full text-sm rounded-xl border border-slate-300 bg-white h-11 text-slate-800">
                <SelectValue placeholder="Selecione a prioridade">
                  {priority === 'BAIXA'
                    ? 'Baixa'
                    : priority === 'MEDIA'
                    ? 'Média'
                    : priority === 'ALTA'
                    ? 'Alta'
                    : 'Urgente'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BAIXA">Baixa</SelectItem>
                <SelectItem value="MEDIA">Média</SelectItem>
                <SelectItem value="ALTA">Alta</SelectItem>
                <SelectItem value="URGENTE">Urgente</SelectItem>
              </SelectContent>
            </Select>
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
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 h-11 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 h-11 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Data de Solicitação
            </label>
            <DatePicker
              value={requestDate}
              onChange={(val) => setRequestDate(val)}
              placeholder="DD/MM/AAAA"
              showPresets={false}
              className="w-full h-11 text-sm rounded-xl border border-slate-300 bg-white text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Previsão de Entrega (SLA)
            </label>
            <DatePicker
              value={estimatedDeliveryDate}
              onChange={(val) => setEstimatedDeliveryDate(val)}
              placeholder="DD/MM/AAAA"
              showPresets={true}
              className="w-full h-11 text-sm rounded-xl border border-slate-300 bg-white text-slate-800"
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
        <Link href={`/admin/demands/${demand.id}`}>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#1B4D3E] hover:bg-[#13382D]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              <span>Salvar Alterações</span>
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
