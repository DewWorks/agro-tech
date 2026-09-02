'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { createProducer, updateProducer } from '@/actions/producers'
import { toast } from 'sonner'
import { Loader2, User, Users, FileText, CheckCircle2, AlertTriangle, Plus, BookText, MapPin, Check, ChevronsUpDown } from 'lucide-react'
import ProducerDocumentsSection from '../ged/ProducerDocumentsSection'

interface IbgeLocation {
  id: number
  nome: string
  sigla?: string
}

function validateCPF(cpf: string) {
  cpf = cpf.replace(/[^\d]+/g, '')
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false
  const values = cpf.split('').map(Number)
  const calc = (n: number) => {
    let sum = 0
    for (let i = 0; i < n; i++) sum += values[i] * (n + 1 - i)
    return (sum % 11) < 2 ? 0 : 11 - (sum % 11)
  }
  return calc(9) === values[9] && calc(10) === values[10]
}

function validateCNPJ(cnpj: string) {
  cnpj = cnpj.replace(/[^\d]+/g, '')
  if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false
  const values = cnpj.split('').map(Number)
  const calc = (n: number, weights: number[]) => {
    let sum = 0
    for (let i = 0; i < n; i++) sum += values[i] * weights[i]
    return (sum % 11) < 2 ? 0 : 11 - (sum % 11)
  }
  return calc(12, [5,4,3,2,9,8,7,6,5,4,3,2]) === values[12] && 
         calc(13, [6,5,4,3,2,9,8,7,6,5,4,3,2]) === values[13]
}

function formatCPF(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

function formatCNPJ(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1')
}

export default function ProducerMultiStepForm({ branches, initialData }: { branches: any[], initialData?: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('DADOS')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    branchId: initialData?.branchId || branches[0]?.id || '',
    type: initialData?.type || 'PF',
    document: initialData ? (initialData.type === 'PF' ? formatCPF(initialData.document) : formatCNPJ(initialData.document)) : '',
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone ? formatPhone(initialData.phone) : '',
    civilStatus: initialData?.civilStatus || 'SOLTEIRO',
    marriageRegime: initialData?.marriageRegime || '',
    spouseName: initialData?.spouseName || '',
    spouseCpf: initialData?.spouseCpf ? formatCPF(initialData.spouseCpf) : '',
    dapCafNumber: initialData?.dapCafNumber || '',
    rg: initialData?.rg || '',
    rgIssuer: initialData?.rgIssuer || '',
    profession: initialData?.profession || '',
    nationality: initialData?.nationality || '',
    representativeCpf: initialData?.representativeCpf ? formatCPF(initialData.representativeCpf) : '',
    
    // Propriedade Principal
    propertyName: initialData?.properties?.[0]?.property?.name || initialData?.properties?.[0]?.property?.propertyName || '',
    propertyCity: initialData?.properties?.[0]?.property?.city || '',
    propertyState: initialData?.properties?.[0]?.property?.state || '',
    pastureArea: initialData?.properties?.[0]?.property?.pastureArea?.toString() || '',
    totalHeadCount: (initialData?.properties?.[0]?.property?.livestock as any)?.totalHeadCount?.toString() || '',
    
    // GED Property Fields
    registrationNumber: initialData?.properties?.[0]?.property?.registrationNumber || '',
    registryOffice: initialData?.properties?.[0]?.property?.registryOffice || '',
    car: initialData?.properties?.[0]?.property?.car || '',
    possessionYears: (initialData?.properties?.[0]?.property?.possessionData as any)?.possessionYears?.toString() || '',
    explorationActivity: initialData?.properties?.[0]?.property?.explorationActivity || '',
    brandDescription: (initialData?.properties?.[0]?.property?.livestock as any)?.brandDescription || '',
    brandRegistrationAdapec: (initialData?.properties?.[0]?.property?.livestock as any)?.brandRegistrationAdapec || '',
    brandLocation: (initialData?.properties?.[0]?.property?.livestock as any)?.brandLocation || '',
  })

  const requireSpouse = formData.type === 'PF' && (formData.civilStatus === 'CASADO' || formData.civilStatus === 'UNIAO_ESTAVEL')

  const [states, setStates] = useState<IbgeLocation[]>([])
  const [cities, setCities] = useState<IbgeLocation[]>([])
  const [openUfSelect, setOpenUfSelect] = useState(false)
  const [openCitySelect, setOpenCitySelect] = useState(false)
  const [citySelectAttemptedWithoutUf, setCitySelectAttemptedWithoutUf] = useState(false)

  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then(data => setStates(data))
  }, [])

  useEffect(() => {
    if (formData.propertyState) {
      const selectedUf = states.find(s => s.sigla === formData.propertyState)
      if (selectedUf) {
        fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf.id}/municipios?orderBy=nome`)
          .then(res => res.json())
          .then(data => setCities(data))
      }
    } else {
      setCities([])
    }
  }, [formData.propertyState, states])

  const tabs = [
    { id: 'DADOS', label: 'Dados Gerais', icon: User },
    ...(requireSpouse ? [{ id: 'CONJUGE', label: 'Cônjuge / Outorga', icon: Users }] : []),
    { id: 'PROPRIEDADE', label: 'Propriedade e Rebanho', icon: MapPin },
    { id: 'LEGAIS', label: 'Dados Legais', icon: BookText },
    { id: 'QUALIFICACAO', label: 'Qualificação', icon: FileText },
  ]

  const handleChange = (field: string, value: string) => {
    let formattedValue = value
    if (field === 'document') {
      formattedValue = formData.type === 'PF' ? formatCPF(value) : formatCNPJ(value)
    }
    if (field === 'spouseCpf' || field === 'representativeCpf') {
      formattedValue = formatCPF(value)
    }
    if (field === 'phone') {
      formattedValue = formatPhone(value)
    }

    setFormData(prev => {
      let newFormData = { ...prev, [field]: formattedValue }
      
      // Reset city if state changes
      if (field === 'propertyState') {
        newFormData.propertyCity = ''
      }

      return newFormData
    })
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep = (stepId: string): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (stepId === 'DADOS') {
      if (!formData.branchId) newErrors.branchId = 'A Filial é obrigatória.'
      if (!formData.name.trim()) newErrors.name = 'O Nome / Razão Social é obrigatório.'
      
      const cleanDoc = formData.document.replace(/[^\d]/g, '')
      if (!cleanDoc) {
        newErrors.document = 'O Documento é obrigatório.'
      } else {
        if (formData.type === 'PF' && !validateCPF(cleanDoc)) {
          newErrors.document = 'CPF matematicamente inválido.'
        } else if (formData.type === 'PJ' && !validateCNPJ(cleanDoc)) {
          newErrors.document = 'CNPJ matematicamente inválido.'
        }
        
        if (formData.type === 'PJ') {
          const cleanRep = formData.representativeCpf.replace(/[^\d]/g, '')
          if (cleanRep && !validateCPF(cleanRep)) {
            newErrors.representativeCpf = 'CPF do representante matematicamente inválido.'
          } else if (!cleanRep) {
            newErrors.representativeCpf = 'O CPF do representante é obrigatório.'
          }
        }
      }
    }

    if (stepId === 'CONJUGE' && requireSpouse) {
      if (!formData.marriageRegime) newErrors.marriageRegime = 'O Regime de Casamento é obrigatório.'
      if (!formData.spouseName.trim()) newErrors.spouseName = 'O Nome do Cônjuge é obrigatório.'
      
      const cleanSpouseDoc = formData.spouseCpf.replace(/[^\d]/g, '')
      if (cleanSpouseDoc && !validateCPF(cleanSpouseDoc)) {
        newErrors.spouseCpf = 'CPF do cônjuge matematicamente inválido.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(activeTab)) {
      const idx = tabs.findIndex(t => t.id === activeTab)
      setActiveTab(tabs[idx + 1].id)
    } else {
      toast.error('Corrija os campos obrigatórios antes de avançar.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    for (const tab of tabs) {
      if (!validateStep(tab.id)) {
        setActiveTab(tab.id)
        toast.error('Corrija os campos obrigatórios antes de salvar.')
        return
      }
    }

    setLoading(true)
    let res;
    if (initialData?.id) {
      res = await updateProducer(initialData.id, formData)
    } else {
      res = await createProducer(formData)
    }
    setLoading(false)

    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success(initialData?.id ? 'Produtor atualizado com sucesso!' : 'Produtor cadastrado com sucesso!')
      router.push('/admin/crm')
    }
  }

  return (
    <div className="space-y-8">
      {branches.length === 0 ? (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} />
            <div>
              <h3 className="font-bold">Nenhuma Filial Encontrada</h3>
              <p className="text-sm">Você precisa de uma filial cadastrada para adicionar produtores.</p>
            </div>
          </div>
          <Link href="/admin/branches/new">
            <Button variant="outline" className="bg-white hover:bg-red-50 text-red-700 border-red-200">
              <Plus className="mr-2 h-4 w-4" /> Criar Filial
            </Button>
          </Link>
        </div>
      ) : branches.every(b => !b.isActive) && !initialData?.id ? (
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} />
            <div>
              <h3 className="font-bold">Filiais Inativas</h3>
              <p className="text-sm">As suas filiais estão inativas. Para adicionar um novo produtor, ative uma filial primeiro.</p>
            </div>
          </div>
          <Link href="/admin/branches">
            <Button variant="outline" className="bg-white hover:bg-yellow-50 text-yellow-700 border-yellow-200">
              Gerir Filiais
            </Button>
          </Link>
        </div>
      ) : null}

      <div className="flex space-x-1.5 border-b overflow-x-auto pb-1 scroll-smooth scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={(e) => {
              if (tab.id === activeTab) return
              const currentIndex = tabs.findIndex(t => t.id === activeTab)
              const targetIndex = tabs.findIndex(t => t.id === tab.id)
              
              if (targetIndex < currentIndex) {
                setActiveTab(tab.id)
                e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
              } else {
                if (validateStep(activeTab)) {
                  setActiveTab(tab.id)
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
                } else {
                  toast.error('Corrija os campos obrigatórios antes de mudar de aba.')
                }
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === tab.id 
                ? 'border-[#1B4D3E] text-[#1B4D3E] font-semibold bg-emerald-50/70 rounded-t-lg' 
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 hover:bg-gray-50/50 rounded-t-lg'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {activeTab === 'DADOS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label>Filial de Vínculo *</Label>
              <div className="flex gap-2">
                <Select 
                  value={formData.branchId} 
                  onValueChange={(val) => handleChange('branchId', val)}
                  disabled={branches.length === 0}
                >
                  <SelectTrigger className={`w-full flex-1 ${errors.branchId ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder={branches.length === 0 ? "Nenhuma filial disponível" : "Selecione a filial"}>
                      {formData.branchId && branches.find(b => b.id === formData.branchId) 
                        ? `${branches.find(b => b.id === formData.branchId)?.name} - CNPJ: ${formatCNPJ(branches.find(b => b.id === formData.branchId)?.cnpj || '')}`
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => {
                      // Se for inativa, não renderiza no dropdown em hipótese alguma (pedido explícito)
                      if (!branch.isActive) return null

                      return (
                        <SelectItem 
                          key={branch.id} 
                          value={branch.id}
                        >
                          <div className="flex items-center gap-3">
                            <span>{branch.name}</span>
                            {branch.isActive ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 pointer-events-none">
                                Ativa
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 pointer-events-none">
                                Inativa
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {branches.length > 0 && (
                  <Link href="/admin/branches/new">
                    <Button type="button" variant="outline" title="Criar Nova Filial">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
              {errors.branchId && <p className="text-xs text-red-500 font-medium">{errors.branchId}</p>}
            </div>

            <div className="space-y-2">
              <Label>Tipo de Produtor</Label>
              <Select 
                value={formData.type} 
                onValueChange={(val) => {
                  setFormData({ ...formData, type: val, document: '' })
                  setErrors({ ...errors, document: '' })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PF">Pessoa Física (CPF)</SelectItem>
                  <SelectItem value="PJ">Pessoa Jurídica (CNPJ)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{formData.type === 'PF' ? 'CPF' : 'CNPJ'} *</Label>
              <Input 
                value={formData.document}
                onChange={(e) => handleChange('document', e.target.value)}
                placeholder={formData.type === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                className={errors.document ? 'border-red-500 focus-visible:ring-red-500' : ''}
                maxLength={formData.type === 'PF' ? 14 : 18}
              />
              {errors.document && <p className="text-xs text-red-500 font-medium">{errors.document}</p>}
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label>Nome Completo / Razão Social *</Label>
              <Input 
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: João da Silva / AgroTech LTDA"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input 
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Telemóvel / Telefone</Label>
              <Input 
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>

            {formData.type === 'PJ' && (
              <div className="space-y-2 col-span-1 md:col-span-2 bg-slate-50 p-4 rounded-lg border">
                <Label className="text-[#1B4D3E]">CPF do Representante Legal *</Label>
                <Input 
                  value={formData.representativeCpf}
                  onChange={(e) => handleChange('representativeCpf', e.target.value)}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={errors.representativeCpf ? 'border-red-500' : ''}
                />
                <p className="text-xs text-slate-500">
                  Necessário para assinatura de documentos, procurações e declarações onde a Pessoa Jurídica é representada.
                </p>
                {errors.representativeCpf && <p className="text-xs text-red-500 font-medium">{errors.representativeCpf}</p>}
              </div>
            )}

            {formData.type === 'PF' && (
              <div className="space-y-2 col-span-1 md:col-span-2 bg-slate-50 p-4 rounded-lg border">
                <Label className="text-[#1B4D3E]">Estado Civil</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Importante: O estado civil dita a exigência de Outorga Uxória para garantias.
                </p>
                <Select 
                  value={formData.civilStatus} 
                  onValueChange={(val) => {
                    setFormData({ ...formData, civilStatus: val, marriageRegime: '' })
                  }}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOLTEIRO">Solteiro(a)</SelectItem>
                    <SelectItem value="CASADO">Casado(a)</SelectItem>
                    <SelectItem value="UNIAO_ESTAVEL">União Estável</SelectItem>
                    <SelectItem value="DIVORCIADO">Divorciado(a)</SelectItem>
                    <SelectItem value="VIUVO">Viúvo(a)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {activeTab === 'CONJUGE' && requireSpouse && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="col-span-1 md:col-span-2 p-4 bg-orange-50 text-orange-800 rounded-lg border border-orange-200">
              <strong className="block mb-1">Atenção: Exigência de Outorga Uxória</strong>
              Como o estado civil é Casado ou União Estável, os dados do cônjuge e o regime de casamento são cruciais para a emissão de garantias (Hipoteca/Alienação).
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label>Regime de Casamento *</Label>
              <Select 
                value={formData.marriageRegime} 
                onValueChange={(val) => handleChange('marriageRegime', val)}
              >
                <SelectTrigger className={`w-full ${errors.marriageRegime ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Selecione o regime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMUNHAO_PARCIAL">Comunhão Parcial de Bens</SelectItem>
                  <SelectItem value="COMUNHAO_UNIVERSAL">Comunhão Universal de Bens</SelectItem>
                  <SelectItem value="SEPARACAO_TOTAL">Separação Total (Convencional)</SelectItem>
                  <SelectItem value="SEPARACAO_OBRIGATORIA">Separação Obrigatória (Legal)</SelectItem>
                  <SelectItem value="PARTICIPACAO_FINAL">Participação Final nos Aquestos</SelectItem>
                </SelectContent>
              </Select>
              {errors.marriageRegime && <p className="text-xs text-red-500 font-medium">{errors.marriageRegime}</p>}
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label>Nome do Cônjuge *</Label>
              <Input 
                value={formData.spouseName}
                onChange={(e) => handleChange('spouseName', e.target.value)}
                placeholder="Nome completo do cônjuge"
                className={errors.spouseName ? 'border-red-500' : ''}
              />
              {errors.spouseName && <p className="text-xs text-red-500 font-medium">{errors.spouseName}</p>}
            </div>

            <div className="space-y-2">
              <Label>CPF do Cônjuge</Label>
              <Input 
                value={formData.spouseCpf}
                onChange={(e) => handleChange('spouseCpf', e.target.value)}
                placeholder="000.000.000-00"
                className={errors.spouseCpf ? 'border-red-500' : ''}
                maxLength={14}
              />
              {errors.spouseCpf && <p className="text-xs text-red-500 font-medium">{errors.spouseCpf}</p>}
            </div>
          </div>
        )}

        {activeTab === 'PROPRIEDADE' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-sm">
              <h3 className="text-lg font-semibold text-[#1B4D3E]">Dados da Propriedade Principal</h3>
              <p className="text-sm text-muted-foreground mt-0">
                Informações sobre a área e localização.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label>Nome da Propriedade</Label>
                  <Input 
                    value={formData.propertyName}
                    onChange={(e) => handleChange('propertyName', e.target.value)}
                    placeholder="Ex: Fazenda Boa Esperança"
                  />
                </div>
                <div className="space-y-2 flex flex-col">
                  <Label>Estado (UF)</Label>
                  <Popover open={openUfSelect} onOpenChange={setOpenUfSelect}>
                    <PopoverTrigger 
                      render={
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between font-normal bg-white h-10",
                            !formData.propertyState && "text-muted-foreground"
                          )}
                        />
                      }
                    >
                      {formData.propertyState ? formData.propertyState : "Selecione o estado..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar estado..." />
                        <CommandList>
                          <CommandEmpty>Nenhum estado encontrado.</CommandEmpty>
                          <CommandGroup>
                            {states.map((s) => (
                              <CommandItem
                                key={s.id}
                                value={`${s.nome} ${s.sigla}`}
                                onSelect={() => {
                                  handleChange('propertyState', s.sigla || '')
                                  setOpenUfSelect(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.propertyState === s.sigla ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {s.nome} ({s.sigla})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2 flex flex-col">
                  <Label>Município</Label>
                  <Popover 
                    open={openCitySelect} 
                    onOpenChange={(val) => {
                      if (val && !formData.propertyState) {
                        setCitySelectAttemptedWithoutUf(true)
                        return
                      }
                      setCitySelectAttemptedWithoutUf(false)
                      setOpenCitySelect(val)
                    }}
                  >
                    <PopoverTrigger 
                      render={
                        <Button
                          variant="outline"
                          role="combobox"
                          onClick={(e) => {
                            if (!formData.propertyState) {
                              e.preventDefault()
                              setCitySelectAttemptedWithoutUf(true)
                            }
                          }}
                          className={cn(
                            "w-full justify-between font-normal bg-white h-10",
                            !formData.propertyCity && "text-muted-foreground",
                            !formData.propertyState && "opacity-60"
                          )}
                        />
                      }
                    >
                      <span className="truncate block">
                        {formData.propertyCity ? formData.propertyCity : "Selecione o município..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar município..." />
                        <CommandList>
                          <CommandEmpty>Nenhum município encontrado.</CommandEmpty>
                          <CommandGroup>
                            {cities.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={c.nome}
                                onSelect={() => {
                                  handleChange('propertyCity', c.nome)
                                  setOpenCitySelect(false)
                                  setCitySelectAttemptedWithoutUf(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.propertyCity === c.nome ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {c.nome}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {citySelectAttemptedWithoutUf && !formData.propertyState && (
                    <p className="text-xs text-red-500 font-medium">Selecione o estado primeiro.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Área de Pastagem (ha)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.pastureArea}
                    onChange={(e) => handleChange('pastureArea', e.target.value)}
                    placeholder="Ex: 150"
                  />
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-sm mt-4">
              <h3 className="text-lg font-semibold text-[#1B4D3E]">Dados de Rebanho</h3>
              <p className="text-sm text-muted-foreground mt-0">
                Detalhes do rebanho e rebanho atual.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Total de Cabeças</Label>
                  <Input 
                    type="number"
                    value={formData.totalHeadCount}
                    onChange={(e) => handleChange('totalHeadCount', e.target.value)}
                    placeholder="Informe total de cabeças"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Registro ADAPEC da Marca</Label>
                  <Input 
                    value={formData.brandRegistrationAdapec}
                    onChange={(e) => handleChange('brandRegistrationAdapec', e.target.value)}
                    placeholder="Ex: 123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição da Marca (Visual)</Label>
                  <Input 
                    value={formData.brandDescription}
                    onChange={(e) => handleChange('brandDescription', e.target.value)}
                    placeholder="Ex: Letra J, Círculo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Localização da Marca</Label>
                  <Input 
                    value={formData.brandLocation}
                    onChange={(e) => handleChange('brandLocation', e.target.value)}
                    placeholder="Ex: Perna Esquerda"
                  />
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-sm mt-4">
              <h3 className="text-lg font-semibold text-[#1B4D3E]">Documentação da Propriedade</h3>
              <p className="text-sm text-muted-foreground mt-0">
                Matrícula, CAR e registro.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Matrícula</Label>
                  <Input 
                    value={formData.registrationNumber}
                    onChange={(e) => handleChange('registrationNumber', e.target.value)}
                    placeholder="Número da Matrícula"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cartório</Label>
                  <Input 
                    value={formData.registryOffice}
                    onChange={(e) => handleChange('registryOffice', e.target.value)}
                    placeholder="Nome do Cartório"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número do CAR</Label>
                  <Input 
                    value={formData.car}
                    onChange={(e) => handleChange('car', e.target.value)}
                    placeholder="Ex: TO-1234..."
                  />
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-sm mt-4">
              <h3 className="text-lg font-semibold text-[#1B4D3E]">Dados de Posse e Exploração</h3>
              <p className="text-sm text-muted-foreground mt-0">
                Atividade exercida e tempo de posse para declarações.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Tempo de Posse (Anos)</Label>
                  <Input 
                    type="number"
                    value={formData.possessionYears}
                    onChange={(e) => handleChange('possessionYears', e.target.value)}
                    placeholder="Ex: 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Atividade Explorada</Label>
                  <Input 
                    value={formData.explorationActivity}
                    onChange={(e) => handleChange('explorationActivity', e.target.value)}
                    placeholder="Ex: Pecuária de Corte"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'LEGAIS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-sm">
              <h3 className="text-lg font-semibold text-[#1B4D3E]">Documentação e Informações Legais</h3>
              <p className="text-sm text-muted-foreground mt-0">Essas informações costumam ser preenchidas automaticamente pela emissão de documentos, mas você pode editar aqui.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Nacionalidade</Label>
                  <Input 
                    value={formData.nationality}
                    onChange={(e) => handleChange('nationality', e.target.value)}
                    placeholder="Ex: Brasileiro(a)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Profissão</Label>
                  <Input 
                    value={formData.profession}
                    onChange={(e) => handleChange('profession', e.target.value)}
                    placeholder="Ex: Produtor(a) Rural"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Registro Geral (RG)</Label>
                  <Input 
                    value={formData.rg}
                    onChange={(e) => handleChange('rg', e.target.value)}
                    placeholder="Ex: 0000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Órgão Emissor do RG</Label>
                  <Input 
                    value={formData.rgIssuer}
                    onChange={(e) => handleChange('rgIssuer', e.target.value)}
                    placeholder="Ex: SSP/TO"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'QUALIFICACAO' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-sm">
              <div className="space-y-2">
                <Label>Nº DAP / CAF (Opcional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Necessário para enquadramento no PRONAF e taxas subsidiadas.
                </p>
                <Input 
                  value={formData.dapCafNumber}
                  onChange={(e) => handleChange('dapCafNumber', e.target.value)}
                  placeholder="Código DAP ou CAF"
                />
              </div>
            </div>
            {initialData?.id ? (
              <div className="col-span-1 md:col-span-2">
                <ProducerDocumentsSection
                  producerId={initialData.id}
                  branchId={formData.branchId}
                />
              </div>
            ) : (
              <div className="col-span-1 md:col-span-2 p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-slate-50">
                <FileText className="h-8 w-8 mb-2 opacity-50" />
                <p className="font-medium">Gestão Eletrônica de Documentos</p>
                <p className="text-xs text-center mt-1 max-w-md">
                  Salve o produtor primeiro para habilitar o upload de documentos (RG, CNH, Certidões) para a nuvem.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/admin/crm')}
          >
            Cancelar
          </Button>

          <div className="flex items-center gap-2">
            {activeTab !== 'DADOS' && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  const idx = tabs.findIndex(t => t.id === activeTab)
                  setActiveTab(tabs[idx - 1].id)
                }}
              >
                Anterior
              </Button>
            )}
            
            {activeTab !== tabs[tabs.length - 1].id ? (
              <Button 
                type="button" 
                className="bg-[#1B4D3E] hover:bg-[#13382D]"
                onClick={handleNext}
              >
                Próximo Passo
              </Button>
            ) : (
              <Button 
                type="button"
                onClick={handleSubmit}
                disabled={loading || branches.length === 0}
                className="bg-[#1B4D3E] hover:bg-[#13382D]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Salvar Produtor
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
