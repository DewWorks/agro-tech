'use client'

import { useState } from 'react'
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
import { createProducer, updateProducer } from '@/actions/producers'
import { toast } from 'sonner'
import { Loader2, User, Users, FileText, CheckCircle2, AlertTriangle, Plus } from 'lucide-react'

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
  })

  const requireSpouse = formData.type === 'PF' && (formData.civilStatus === 'CASADO' || formData.civilStatus === 'UNIAO_ESTAVEL')

  const tabs = [
    { id: 'DADOS', label: 'Dados Gerais', icon: User },
    ...(requireSpouse ? [{ id: 'CONJUGE', label: 'Cônjuge / Outorga', icon: Users }] : []),
    { id: 'QUALIFICACAO', label: 'Qualificação', icon: FileText },
  ]

  const handleChange = (field: string, value: string) => {
    let formattedValue = value
    if (field === 'document') {
      formattedValue = formData.type === 'PF' ? formatCPF(value) : formatCNPJ(value)
    }
    if (field === 'spouseCpf') {
      formattedValue = formatCPF(value)
    }
    if (field === 'phone') {
      formattedValue = formatPhone(value)
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }))
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
    if (!validateStep(activeTab)) {
      toast.error('Corrija os campos obrigatórios antes de salvar.')
      return
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
      {branches.length === 0 && (
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
      )}

      <div className="flex space-x-2 border-b overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              const currentIndex = tabs.findIndex(t => t.id === activeTab)
              const targetIndex = tabs.findIndex(t => t.id === tab.id)
              if (targetIndex < currentIndex) setActiveTab(tab.id)
            }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-[#1B4D3E] text-[#1B4D3E]' 
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
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
                        ? `${branches.find(b => b.id === formData.branchId)?.name} (${formatCNPJ(branches.find(b => b.id === formData.branchId)?.cnpj || '')})`
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} ({formatCNPJ(b.cnpj || '')})
                      </SelectItem>
                    ))}
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

        {activeTab === 'QUALIFICACAO' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 col-span-1 md:col-span-2">
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
            <div className="col-span-1 md:col-span-2 p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-slate-50">
              <FileText className="h-8 w-8 mb-2 opacity-50" />
              <p className="font-medium">Gestão Eletrônica de Documentos (Em Breve)</p>
              <p className="text-xs text-center mt-1 max-w-md">
                O upload de arquivos (RG, CNH, Certidões) para a nuvem será libertado na Fase de GED do MVP.
              </p>
            </div>
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

          <div className="space-x-2">
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
