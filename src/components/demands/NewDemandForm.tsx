'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createDemand } from '@/actions/demands'
import {
  RURAL_SERVICE_TYPES,
  RURAL_SERVICES_CATALOG,
  RuralServiceTypeCode,
  DemandPriorityCode,
} from '@/lib/validations/demands'
import {
  FileText,
  User,
  Home,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Building2,
  Briefcase,
  Layers,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'

interface ProducerOption {
  id: string
  name: string
  document: string
  branchId?: string | null
  branchName?: string | null
  properties: {
    id: string
    name: string
    city?: string | null
    state?: string | null
  }[]
}

interface BranchOption {
  id: string
  name: string
}

interface UserOption {
  id: string
  fullName?: string | null
  email: string
}

interface NewDemandFormProps {
  producers: ProducerOption[]
  branches?: BranchOption[]
  users: UserOption[]
  defaultProducerId?: string
  defaultPropertyId?: string
  defaultBranchId?: string
}

export function NewDemandForm({
  producers,
  branches = [],
  users,
  defaultProducerId = '',
  defaultPropertyId = '',
  defaultBranchId = '',
}: NewDemandFormProps) {
  const router = useRouter()

  const producerWithProperty = defaultPropertyId
    ? producers.find((p) => p.properties.some((prop) => prop.id === defaultPropertyId))
    : null
  const effectiveProducerId = defaultProducerId || producerWithProperty?.id || ''
  const initialProducer = producers.find((p) => p.id === effectiveProducerId)

  const [producerId, setProducerId] = useState(effectiveProducerId)
  const [branchId, setBranchId] = useState(
    defaultBranchId || initialProducer?.branchId || branches[0]?.id || ''
  )
  const [propertyId, setPropertyId] = useState(defaultPropertyId)
  const [assignedToId, setAssignedToId] = useState('')
  const [serviceType, setServiceType] = useState<RuralServiceTypeCode>('PROJETO_CUSTEIO')
  const [customServiceType, setCustomServiceType] = useState('')
  const [priority, setPriority] = useState<DemandPriorityCode>('MEDIA')
  const [proposalId, setProposalId] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    let resolvedProdId = defaultProducerId
    if (!resolvedProdId && defaultPropertyId) {
      const p = producers.find((prod) => prod.properties.some((prop) => prop.id === defaultPropertyId))
      if (p) resolvedProdId = p.id
    }

    if (resolvedProdId) {
      setProducerId(resolvedProdId)
      const p = producers.find((prod) => prod.id === resolvedProdId)
      if (p?.branchId) setBranchId(p.branchId)
    }

    if (defaultPropertyId) {
      setPropertyId(defaultPropertyId)
    }
  }, [defaultProducerId, defaultPropertyId, producers])

  // Datas
  const todayStr = new Date().toISOString().split('T')[0]
  const [requestDate, setRequestDate] = useState(todayStr)

  // Calcula prazo padrão baseado no serviço
  const defaultEstimatedDays = RURAL_SERVICES_CATALOG['PROJETO_CUSTEIO']?.estimatedDaysDefault || 15
  const defaultEstimatedDate = new Date(Date.now() + defaultEstimatedDays * 86400000)
    .toISOString()
    .split('T')[0]
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(defaultEstimatedDate)

  // Checklist interativo inicial
  const [checklist, setChecklist] = useState<string[]>(
    RURAL_SERVICES_CATALOG['PROJETO_CUSTEIO']?.defaultDocuments || []
  )

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Propriedades do produtor selecionado
  const selectedProducer = producers.find((p) => p.id === producerId)
  const availableProperties = selectedProducer?.properties || []

  // Ao trocar o serviço, atualiza automaticamente estimativa de prazo e checklist
  const handleServiceChange = (newType: RuralServiceTypeCode) => {
    setServiceType(newType)
    const meta = RURAL_SERVICES_CATALOG[newType]
    if (meta) {
      const days = meta.estimatedDaysDefault || 15
      const newEstimatedDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0]
      setEstimatedDeliveryDate(newEstimatedDate)
      setChecklist([...meta.defaultDocuments])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!producerId) {
      toast.error('Por favor, selecione o Produtor Rural.')
      return
    }

    if (serviceType === 'OUTROS' && !customServiceType.trim()) {
      toast.error('Informe o nome do serviço para a opção "Outros".')
      return
    }

    try {
      setIsSubmitting(true)

      const payload = {
        branchId: branchId || undefined,
        producerId,
        propertyId: propertyId || null,
        assignedToId: assignedToId || null,
        proposalId: proposalId.trim() || null,
        serviceType,
        customServiceType: serviceType === 'OUTROS' ? customServiceType.trim() : null,
        priority,
        description: description.trim() || null,
        notes: notes.trim() || null,
        requestDate: new Date(requestDate),
        estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
        checklist: checklist.map((title) => ({
          title,
          isRequired: true,
          isDelivered: false,
        })),
      }

      const res = await createDemand(payload)

      if (!res.success || !res.demand) {
        throw new Error(typeof res.error === 'string' ? res.error : 'Falha ao criar demanda')
      }

      toast.success('Demanda criada com sucesso!')
      router.push(`/admin/demands/${res.demand.id}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar demanda')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {/* Botão Voltar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/demands"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Hub de Demandas</span>
        </Link>
      </div>

      {/* Card 1: Identificação & Vínculos de Negócio */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <User className="w-5 h-5 text-[#1B4D3E]" />
          <h2 className="font-bold text-[#1B4D3E] text-base">Cliente & Propriedade Vinculada</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Seletor de Produtor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Produtor Rural <span className="text-rose-500">*</span>
            </label>
            <Select
              value={producerId}
              onValueChange={(val) => {
                setProducerId(val || '')
                setPropertyId('')
                const selected = producers.find((p) => p.id === val)
                if (selected?.branchId) {
                  setBranchId(selected.branchId)
                }
              }}
            >
              <SelectTrigger className="w-full text-sm rounded-xl border border-slate-300 bg-white h-11 text-slate-800">
                <SelectValue placeholder="Selecione um produtor cadastrado...">
                  {(() => {
                    const p = producers.find((prod) => prod.id === producerId)
                    return p ? `${p.name} (${p.document})` : undefined
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {producers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.document})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seletor de Filial de Atendimento */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Filial de Atendimento <span className="text-rose-500">*</span>
            </label>
            <Select
              value={branchId}
              onValueChange={(val) => setBranchId(val || '')}
            >
              <SelectTrigger className="w-full text-sm rounded-xl border border-slate-300 bg-white h-11 text-slate-800">
                <SelectValue placeholder="Selecione a filial...">
                  {(() => {
                    const b = branches.find((branch) => branch.id === branchId)
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
            <p className="text-[11px] text-muted-foreground mt-1">
              {producerId ? 'Vinculada automaticamente à filial do produtor rural selecionado.' : 'Selecione a filial responsável pela gestão desta ordem.'}
            </p>
          </div>

          {/* Seletor de Propriedade */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Propriedade / Fazenda (Opcional)
            </label>
            <Select
              value={propertyId || 'NONE'}
              onValueChange={(val) => setPropertyId(val === 'NONE' || !val ? '' : val)}
              disabled={!producerId || availableProperties.length === 0}
            >
              <SelectTrigger className="w-full text-sm rounded-xl border border-slate-300 bg-white h-11 text-slate-800 disabled:bg-slate-50 disabled:text-slate-400">
                <SelectValue
                  placeholder={
                    producerId
                      ? availableProperties.length > 0
                        ? 'Selecione uma fazenda...'
                        : 'Nenhuma fazenda vinculada a este produtor'
                      : 'Selecione o produtor primeiro'
                  }
                >
                  {(() => {
                    if (!propertyId || propertyId === 'NONE') return undefined
                    const prop = availableProperties.find((p) => p.id === propertyId)
                    return prop ? `${prop.name} ${prop.city ? `(${prop.city}/${prop.state})` : ''}` : undefined
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Nenhuma fazenda vinculada</SelectItem>
                {availableProperties.map((prop) => (
                  <SelectItem key={prop.id} value={prop.id}>
                    {prop.name} {prop.city ? `(${prop.city}/${prop.state})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Responsável Técnico */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Responsável Técnico / Executor
            </label>
            <Select
              value={assignedToId || 'UNASSIGNED'}
              onValueChange={(val) => setAssignedToId(val === 'UNASSIGNED' || !val ? '' : val)}
            >
              <SelectTrigger className="w-full text-sm rounded-xl border border-slate-300 bg-white h-11 text-slate-800">
                <SelectValue placeholder="Não atribuído (Definir na triagem)">
                  {(() => {
                    if (!assignedToId || assignedToId === 'UNASSIGNED') return undefined
                    const u = users.find((usr) => usr.id === assignedToId)
                    return u ? (u.fullName || u.email) : undefined
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNASSIGNED">Não atribuído (Definir na triagem)</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.fullName || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Proposta / Dossiê Vinculado */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Proposta / Dossiê Vinculado (Opcional)
            </label>
            <input
              type="text"
              value={proposalId}
              onChange={(e) => setProposalId(e.target.value)}
              placeholder="Ex: PRP-2026-089 ou Custeio Soja BB"
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 h-11 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Card 2: Definição do Serviço & Prazos */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Briefcase className="w-5 h-5 text-[#1B4D3E]" />
          <h2 className="font-bold text-[#1B4D3E] text-base">Serviço Rural & Prazos Operacionais</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipo de Serviço */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tipo de Serviço Oficial <span className="text-rose-500">*</span>
            </label>
            <Select
              value={serviceType}
              onValueChange={(val) => val && handleServiceChange(val as RuralServiceTypeCode)}
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
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              {RURAL_SERVICES_CATALOG[serviceType]?.description}
            </p>
          </div>

          {/* Prioridade */}
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
                    ? 'Média (Padrão)'
                    : priority === 'ALTA'
                    ? 'Alta'
                    : 'Urgente'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BAIXA">Baixa</SelectItem>
                <SelectItem value="MEDIA">Média (Padrão)</SelectItem>
                <SelectItem value="ALTA">Alta</SelectItem>
                <SelectItem value="URGENTE">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Service Type se for OUTROS */}
        {serviceType === 'OUTROS' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Especifique o Serviço <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customServiceType}
              onChange={(e) => setCustomServiceType(e.target.value)}
              placeholder="Digite o nome do serviço rural personalizado"
              required
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 h-11 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Data de Solicitação */}
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

          {/* Previsão de Entrega */}
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

        {/* Descrição */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Descrição / Especificações da Demanda
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Informações adicionais fornecidas pelo produtor rural, objetivos do projeto..."
            className="w-full text-sm rounded-xl border border-slate-300 p-3 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Card 3: Checklist Documental Sugerido */}
      {/* Card 3: Checklist Sugerido para o GED */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1B4D3E]" />
            <h2 className="font-bold text-[#1B4D3E] text-base">Checklist Sugerido para o GED</h2>
          </div>
          <span className="text-xs text-muted-foreground">{checklist.length} documentos pré-carregados</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {checklist.map((doc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 bg-slate-50/50 text-xs"
            >
              <div className="flex items-center gap-2 text-slate-700 truncate">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">{doc}</span>
              </div>
              <button
                type="button"
                onClick={() => setChecklist(checklist.filter((_, i) => i !== idx))}
                className="text-slate-400 hover:text-rose-600 ml-2 font-bold px-1.5 cursor-pointer"
                title="Remover do checklist inicial"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/admin/demands">
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
              <span>Registrando...</span>
            </>
          ) : (
            <span>Criar Ordem de Serviço</span>
          )}
        </Button>
      </div>
    </form>
  )
}
