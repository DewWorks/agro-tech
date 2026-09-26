'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createProducer, updateProducer } from '@/actions/producers'
import { toast } from 'sonner'
import { Loader2, User, Users, FileText, CheckCircle2, AlertTriangle, Plus, BookText, MapPin, ClipboardList } from 'lucide-react'
import {
  validateCPF,
  validateCNPJ,
  formatCPF,
  formatCNPJ,
  formatPhone,
  maskRG,
  maskIssuerUF,
  maskBankAgency,
  maskBankAccount,
} from '@/lib/utils/masks'
import { ProducerBasicInfoStep } from './producer-steps/ProducerBasicInfoStep'
import { ProducerSpouseStep } from './producer-steps/ProducerSpouseStep'
import { ProducerPropertyStep, type IbgeLocation } from './producer-steps/ProducerPropertyStep'
import { ProducerLegalDataStep } from './producer-steps/ProducerLegalDataStep'
import { ProducerQualificationStep } from './producer-steps/ProducerQualificationStep'
import { CrmDemandsList } from './CrmDemandsList'

export default function ProducerMultiStepForm({
  branches,
  initialData,
  demands = [],
  initialTab = 'DADOS',
}: {
  branches: any[]
  initialData?: any
  demands?: any[]
  initialTab?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isPendingTab, startTransition] = useTransition()
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
    birthDate: initialData?.birthDate
      ? (typeof initialData.birthDate === 'string'
          ? initialData.birthDate.split('T')[0]
          : new Date(initialData.birthDate).toISOString().split('T')[0])
      : '',
    representativeCpf: initialData?.representativeCpf ? formatCPF(initialData.representativeCpf) : '',
    
    // Qualificação Civil e Bancária
    educationLevel: initialData?.educationLevel || '',
    naturalness: initialData?.naturalness || '',
    producerSize: initialData?.producerSize || 'MEDIO',
    bankName: initialData?.bankName || '',
    bankAgency: initialData?.bankAgency || '',
    bankAccount: initialData?.bankAccount || '',
    bankAccountType: initialData?.bankAccountType || 'CORRENTE',
    spouseRg: initialData?.spouseRg || '',
    spouseRgIssuer: initialData?.spouseRgIssuer || '',
    spouseNationality: initialData?.spouseNationality || 'Brasileira',
    spouseEducationLevel: initialData?.spouseEducationLevel || '',

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
    ...(initialData?.id
      ? [{ id: 'DEMANDAS', label: `Serviços & Demandas (${demands.length})`, icon: ClipboardList }]
      : []),
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
    if (field === 'rg' || field === 'spouseRg') {
      formattedValue = maskRG(value)
    }
    if (field === 'rgIssuer' || field === 'spouseRgIssuer') {
      formattedValue = maskIssuerUF(value)
    }
    if (field === 'bankAgency') {
      formattedValue = maskBankAgency(value)
    }
    if (field === 'bankAccount') {
      formattedValue = maskBankAccount(value)
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
      if (!formData.name?.trim()) {
        newErrors.name = 'O Nome / Razão Social é obrigatório.'
      } else if (formData.name.trim().length < 3) {
        newErrors.name = 'O nome deve conter pelo menos 3 caracteres.'
      } else if (formData.type === 'PF' && !/\S+\s+\S+/.test(formData.name.trim())) {
        newErrors.name = 'Informe o nome e o sobrenome completos.'
      }
      
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

      if (formData.phone?.trim()) {
        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/
        if (!phoneRegex.test(formData.phone.trim())) {
          newErrors.phone = 'Telefone inválido. Formato: (00) 00000-0000'
        }
      }

      if (formData.email?.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email.trim())) {
          newErrors.email = 'E-mail inválido.'
        }
      }
    }

    if (stepId === 'CONJUGE' && requireSpouse) {
      if (!formData.marriageRegime) newErrors.marriageRegime = 'O Regime de Casamento é obrigatório.'
      if (!formData.spouseName?.trim()) {
        newErrors.spouseName = 'O Nome do Cônjuge é obrigatório.'
      } else if (formData.spouseName.trim().length < 3 || !/\S+\s+\S+/.test(formData.spouseName.trim())) {
        newErrors.spouseName = 'Informe o nome e o sobrenome completos do cônjuge.'
      }
      
      const cleanSpouseDoc = (formData.spouseCpf || '').replace(/[^\d]/g, '')
      const cleanTitularDoc = (formData.document || '').replace(/[^\d]/g, '')
      if (!cleanSpouseDoc) {
        newErrors.spouseCpf = 'O CPF do cônjuge é obrigatório.'
      } else if (!validateCPF(cleanSpouseDoc)) {
        newErrors.spouseCpf = 'CPF do cônjuge matematicamente inválido.'
      } else if (cleanSpouseDoc === cleanTitularDoc) {
        newErrors.spouseCpf = 'O CPF do cônjuge não pode ser igual ao CPF do titular.'
      }

      if (!formData.spouseRg?.trim()) {
        newErrors.spouseRg = 'O RG do cônjuge é obrigatório.'
      } else if (formData.spouseRg.trim().length > 14) {
        newErrors.spouseRg = 'O RG do cônjuge deve ter no máximo 14 caracteres.'
      }

      if (formData.spouseRgIssuer?.trim() && !/^[A-Z0-9]{2,8}\/[A-Z]{2}$/i.test(formData.spouseRgIssuer.trim())) {
        newErrors.spouseRgIssuer = 'Órgão emissor deve estar no formato ÓRGÃO/UF (Ex: SSP/TO).'
      }
    }

    if (stepId === 'LEGAIS') {
      if (formData.type === 'PF' && formData.birthDate) {
        const birth = new Date(formData.birthDate)
        const now = new Date()
        if (birth > now) {
          newErrors.birthDate = 'A data de nascimento não pode estar no futuro.'
        } else {
          let age = now.getFullYear() - birth.getFullYear()
          const m = now.getMonth() - birth.getMonth()
          if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
            age--
          }
          if (age < 18) {
            newErrors.birthDate = 'O titular deve ter no mínimo 18 anos de idade.'
          }
        }
      }

      if (formData.rg?.trim() && (formData.rg.trim().length < 3 || formData.rg.trim().length > 14)) {
        newErrors.rg = 'O RG deve conter entre 3 e 14 caracteres.'
      }

      if (formData.rgIssuer?.trim() && !/^[A-Z0-9]{2,8}\/[A-Z]{2}$/i.test(formData.rgIssuer.trim())) {
        newErrors.rgIssuer = 'Órgão emissor deve estar no formato ÓRGÃO/UF (Ex: SSP/TO).'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const formTabs = tabs.filter(t => t.id !== 'DEMANDAS')

  const handleNext = () => {
    if (validateStep(activeTab)) {
      const idx = formTabs.findIndex(t => t.id === activeTab)
      if (idx !== -1 && idx + 1 < formTabs.length) {
        startTransition(() => {
          setActiveTab(formTabs[idx + 1].id)
        })
      }
    } else {
      toast.error('Corrija os campos obrigatórios antes de avançar.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    for (const tab of formTabs) {
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
              
              if (tab.id === 'DEMANDAS' || targetIndex < currentIndex || validateStep(activeTab)) {
                startTransition(() => {
                  setActiveTab(tab.id)
                })
                e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
              } else {
                toast.error('Corrija os campos obrigatórios antes de mudar de aba.')
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
          <ProducerBasicInfoStep
            branches={branches}
            initialData={initialData}
            formData={formData}
            handleChange={handleChange}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'CONJUGE' && requireSpouse && (
          <ProducerSpouseStep
            formData={formData}
            handleChange={handleChange}
            errors={errors}
          />
        )}

        {activeTab === 'PROPRIEDADE' && (
          <ProducerPropertyStep
            initialData={initialData}
            formData={formData}
            handleChange={handleChange}
            states={states}
            cities={cities}
            openUfSelect={openUfSelect}
            setOpenUfSelect={setOpenUfSelect}
            openCitySelect={openCitySelect}
            setOpenCitySelect={setOpenCitySelect}
            citySelectAttemptedWithoutUf={citySelectAttemptedWithoutUf}
            setCitySelectAttemptedWithoutUf={setCitySelectAttemptedWithoutUf}
          />
        )}

        {activeTab === 'LEGAIS' && (
          <ProducerLegalDataStep
            formData={formData}
            handleChange={handleChange}
            errors={errors}
          />
        )}

        {activeTab === 'QUALIFICACAO' && (
          <ProducerQualificationStep
            initialData={initialData}
            formData={formData}
            handleChange={handleChange}
            errors={errors}
          />
        )}

        {activeTab === 'DEMANDAS' && initialData?.id && (
          <CrmDemandsList
            producerId={initialData.id}
            producerName={initialData.name}
            initialDemands={demands}
          />
        )}

        {activeTab !== 'DEMANDAS' && (
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
                    const idx = formTabs.findIndex(t => t.id === activeTab)
                    if (idx > 0) {
                      startTransition(() => {
                        setActiveTab(formTabs[idx - 1].id)
                      })
                    }
                  }}
                >
                  Anterior
                </Button>
              )}
              
              {activeTab !== formTabs[formTabs.length - 1].id ? (
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
        )}
      </form>
    </div>
  )
}
