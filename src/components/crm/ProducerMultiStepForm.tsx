'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createProducer, updateProducer } from '@/actions/producers'
import { toast } from 'sonner'
import { Loader2, User, Users, FileText, CheckCircle2, AlertTriangle, Plus, BookText, MapPin } from 'lucide-react'
import {
  validateCPF,
  validateCNPJ,
  formatCPF,
  formatCNPJ,
  formatPhone,
} from '@/lib/utils/masks'
import { ProducerBasicInfoStep } from './producer-steps/ProducerBasicInfoStep'
import { ProducerSpouseStep } from './producer-steps/ProducerSpouseStep'
import { ProducerPropertyStep, type IbgeLocation } from './producer-steps/ProducerPropertyStep'
import { ProducerLegalDataStep } from './producer-steps/ProducerLegalDataStep'
import { ProducerQualificationStep } from './producer-steps/ProducerQualificationStep'

export default function ProducerMultiStepForm({ branches, initialData }: { branches: any[], initialData?: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('DADOS')
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
      startTransition(() => {
        setActiveTab(tabs[idx + 1].id)
      })
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
                startTransition(() => {
                  setActiveTab(tab.id)
                })
                e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
              } else {
                if (validateStep(activeTab)) {
                  startTransition(() => {
                    setActiveTab(tab.id)
                  })
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
          />
        )}

        {activeTab === 'QUALIFICACAO' && (
          <ProducerQualificationStep
            initialData={initialData}
            formData={formData}
            handleChange={handleChange}
          />
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
                  startTransition(() => {
                    setActiveTab(tabs[idx - 1].id)
                  })
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
