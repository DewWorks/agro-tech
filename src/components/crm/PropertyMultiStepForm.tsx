'use client'

import { useState, useEffect, useRef } from 'react'
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
import { createProperty, updateProperty, getProducersForBranch } from '@/actions/properties'
import { toast } from 'sonner'
import { 
  Loader2, 
  MapPin, 
  User, 
  Layers, 
  FileText, 
  History, 
  Compass, 
  Tag, 
  Check, 
  ChevronsUpDown,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import ProducerDocumentsSection from '../ged/ProducerDocumentsSection'

interface IbgeLocation {
  id: number
  nome: string
  sigla?: string
}

interface PropertyMultiStepFormProps {
  branches: any[]
  initialData?: any
  producers?: any[]
}

export default function PropertyMultiStepForm({ 
  branches, 
  initialData,
  producers: initialProducers = []
}: PropertyMultiStepFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('DADOS')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [producersList, setProducersList] = useState<any[]>(initialProducers)
  const [loadingProducers, setLoadingProducers] = useState(false)

  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const tabs = [
    { id: 'DADOS', label: 'Dados do Imóvel', icon: MapPin },
    { id: 'VINCULO', label: 'Produtor Titular', icon: User },
    { id: 'AREAS', label: 'Áreas & Uso do Solo', icon: Layers },
    { id: 'DOCUMENTACAO', label: 'Matrícula & CAR', icon: FileText },
    { id: 'POSSE', label: 'Posse & Atividade', icon: History },
    { id: 'REBANHO', label: 'Rebanho & Marca', icon: Tag },
    { id: 'GED', label: 'Documentos (GED)', icon: FileText },
  ]

  const checkScroll = () => {
    const el = tabsContainerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 5)
    setCanScrollRight(el.scrollWidth > el.clientWidth && el.scrollLeft < el.scrollWidth - el.clientWidth - 5)
  }

  useEffect(() => {
    checkScroll()
    const timer = setTimeout(checkScroll, 100)
    window.addEventListener('resize', checkScroll)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkScroll)
    }
  }, [])

  const scrollTabs = (direction: 'left' | 'right') => {
    const el = tabsContainerRef.current
    if (!el) return
    const scrollAmount = 240
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
    setTimeout(checkScroll, 300)
  }

  const initialMainProducerLink = initialData?.producers?.[0]

  const [formData, setFormData] = useState({
    branchId: initialData?.branchId || branches[0]?.id || '',
    name: initialData?.name || initialData?.propertyName || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    latitude: initialData?.latitude?.toString() || '',
    longitude: initialData?.longitude?.toString() || '',

    // Produtor Titular
    producerId: initialMainProducerLink?.producerId || '',
    ownershipType: initialMainProducerLink?.ownershipType || 'PROPRIETARIO',
    explorationPercentage: initialMainProducerLink?.explorationPercentage?.toString() || '100',
    contractEndDate: initialMainProducerLink?.contractEndDate 
      ? new Date(initialMainProducerLink.contractEndDate).toISOString().split('T')[0] 
      : '',

    // Áreas (ha)
    totalArea: initialData?.totalArea?.toString() || '',
    productiveArea: initialData?.productiveArea?.toString() || '',
    pastureArea: initialData?.pastureArea?.toString() || '',
    preserveArea: initialData?.preserveArea?.toString() || '',

    // Documentação Fundiária
    registrationNumber: initialData?.registrationNumber || '',
    registryOffice: initialData?.registryOffice || '',
    car: initialData?.car || '',
    ccir: initialData?.ccir || '',
    itr: initialData?.itr || '',

    // Posse & Exploração
    possessionYears: (initialData?.possessionData as any)?.possessionYears?.toString() || '',
    explorationActivity: initialData?.explorationActivity || (initialData?.possessionData as any)?.explorationActivity || '',

    // Rebanho & Marcas
    totalHeadCount: (initialData?.livestock as any)?.totalHeadCount?.toString() || '',
    brandDescription: (initialData?.livestock as any)?.brandDescription || '',
    brandRegistrationAdapec: (initialData?.livestock as any)?.brandRegistrationAdapec || '',
    brandLocation: (initialData?.livestock as any)?.brandLocation || '',
  })

  // IBGE State & City
  const [states, setStates] = useState<IbgeLocation[]>([])
  const [cities, setCities] = useState<IbgeLocation[]>([])
  const [openUfSelect, setOpenUfSelect] = useState(false)
  const [openCitySelect, setOpenCitySelect] = useState(false)
  const [openProducerSelect, setOpenProducerSelect] = useState(false)
  const [citySelectAttemptedWithoutUf, setCitySelectAttemptedWithoutUf] = useState(false)

  // Fetch States on mount
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setStates(data)
      })
      .catch(err => console.error('Erro ao buscar estados IBGE', err))
  }, [])

  // Fetch Cities when state changes
  useEffect(() => {
    if (!formData.state) {
      setCities([])
      return
    }

    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCities(data)
      })
      .catch(err => console.error('Erro ao buscar cidades IBGE', err))
  }, [formData.state])

  // Fetch Producers when branchId changes
  useEffect(() => {
    if (!formData.branchId) return
    setLoadingProducers(true)
    getProducersForBranch(formData.branchId)
      .then(prods => {
        setProducersList(prods || [])
      })
      .finally(() => setLoadingProducers(false))
  }, [formData.branchId])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Nome da propriedade é obrigatório'
    if (!formData.branchId) newErrors.branchId = 'Selecione a filial'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Por favor, preencha os campos obrigatórios.')
      setActiveTab('DADOS')
      return
    }

    setLoading(true)
    try {
      if (initialData?.id) {
        const res = await updateProperty(initialData.id, formData)
        if (res?.error) {
          toast.error(res.error)
        } else {
          toast.success('Propriedade atualizada com sucesso!')
          router.push('/admin/crm/properties')
        }
      } else {
        const res = await createProperty(formData)
        if (res?.error) {
          toast.error(res.error)
        } else {
          toast.success('Propriedade cadastrada com sucesso!')
          router.push('/admin/crm/properties')
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Ocorreu um erro ao salvar.')
    } finally {
      setLoading(false)
    }
  }

  const selectedProducer = producersList.find(p => p.id === formData.producerId) || 
    (initialMainProducerLink?.producer?.id === formData.producerId ? initialMainProducerLink.producer : null)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Navigation Tabs with Left/Right Scroll Controls */}
      <div className="relative border-b border-gray-200">
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center bg-linear-to-r from-white via-white/90 to-transparent pr-4">
            <button
              type="button"
              onClick={() => scrollTabs('left')}
              className="h-7 w-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:text-black transition-all"
              title="Rolar abas para esquerda"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}

        <div 
          ref={tabsContainerRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto gap-1 pb-1.5 scroll-smooth scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 px-1 w-full"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={(e) => {
                  setActiveTab(tab.id)
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
                }}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-all shrink-0 rounded-t-lg ${
                  isActive
                    ? 'border-[#1B4D3E] text-[#1B4D3E] font-semibold bg-emerald-50/80 shadow-2xs'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50/70'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#1B4D3E]' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center bg-linear-to-l from-white via-white/90 to-transparent pl-4">
            <button
              type="button"
              onClick={() => scrollTabs('right')}
              className="h-7 w-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:text-black transition-all"
              title="Rolar abas para direita"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tab Contents */}
      <div className="pt-2">

        {/* 1. DADOS DO IMÓVEL */}
        {activeTab === 'DADOS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-xs">
              <h3 className="text-lg font-semibold text-[#1B4D3E]">Identificação da Propriedade</h3>
              <p className="text-sm text-muted-foreground mt-0">
                Informações principais sobre o imóvel rural e localização.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label>Nome da Propriedade / Fazenda *</Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Ex: Fazenda Boa Esperança"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label>Filial de Cadastro *</Label>
                  <Select 
                    value={formData.branchId} 
                    onValueChange={(val) => handleChange('branchId', val)}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Selecione a Filial" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(b => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name} ({b.city}/{b.state})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                            !formData.state && "text-muted-foreground"
                          )}
                        />
                      }
                    >
                      {formData.state ? formData.state : "Selecione o estado..."}
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
                                  handleChange('state', s.sigla || '')
                                  setOpenUfSelect(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.state === s.sigla ? "opacity-100" : "opacity-0"
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
                      if (val && !formData.state) {
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
                            if (!formData.state) {
                              e.preventDefault()
                              setCitySelectAttemptedWithoutUf(true)
                            }
                          }}
                          className={cn(
                            "w-full justify-between font-normal bg-white h-10",
                            !formData.city && "text-muted-foreground",
                            !formData.state && "opacity-60"
                          )}
                        />
                      }
                    >
                      <span className="truncate block">
                        {formData.city ? formData.city : "Selecione o município..."}
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
                                  handleChange('city', c.nome)
                                  setOpenCitySelect(false)
                                  setCitySelectAttemptedWithoutUf(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.city === c.nome ? "opacity-100" : "opacity-0"
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
                  {citySelectAttemptedWithoutUf && !formData.state && (
                    <p className="text-xs text-red-500 font-medium">Selecione o estado primeiro.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Latitude (Opcional)</Label>
                  <Input 
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => handleChange('latitude', e.target.value)}
                    placeholder="Ex: -10.184321"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Longitude (Opcional)</Label>
                  <Input 
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => handleChange('longitude', e.target.value)}
                    placeholder="Ex: -48.333214"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PRODUTOR TITULAR & VÍNCULO */}
        {activeTab === 'VINCULO' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-xs">
              <h3 className="text-lg font-semibold text-[#1B4D3E]">Vínculo do Produtor Rural</h3>
              <p className="text-sm text-muted-foreground mt-0">
                Associe a propriedade rural ao cliente titular e defina o regime de exploração.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2 col-span-1 md:col-span-2 flex flex-col">
                  <Label>Produtor Titular</Label>
                  <Popover open={openProducerSelect} onOpenChange={setOpenProducerSelect}>
                    <PopoverTrigger 
                      render={
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between font-normal bg-white h-10",
                            !formData.producerId && "text-muted-foreground"
                          )}
                        />
                      }
                    >
                      <span className="truncate block">
                        {selectedProducer 
                          ? `${selectedProducer.name} (${selectedProducer.document})` 
                          : "Selecione o produtor titular..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar produtor por nome ou CPF/CNPJ..." />
                        <CommandList>
                          <CommandEmpty>
                            {loadingProducers ? "Carregando produtores..." : "Nenhum produtor encontrado nesta filial."}
                          </CommandEmpty>
                          <CommandGroup>
                            {producersList.map((prod) => (
                              <CommandItem
                                key={prod.id}
                                value={`${prod.name} ${prod.document}`}
                                onSelect={() => {
                                  handleChange('producerId', prod.id)
                                  setOpenProducerSelect(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.producerId === prod.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-900">{prod.name}</span>
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {prod.type === 'PF' ? 'CPF' : 'CNPJ'}: {prod.document}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    O titular da propriedade herdará os documentos e declarações geradas.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Vínculo / Posse</Label>
                  <Select 
                    value={formData.ownershipType} 
                    onValueChange={(val) => handleChange('ownershipType', val)}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Selecione o vínculo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROPRIETARIO">Proprietário(a)</SelectItem>
                      <SelectItem value="ARRENDATARIO">Arrendatário(a)</SelectItem>
                      <SelectItem value="MEEIRO">Meeiro(a)</SelectItem>
                      <SelectItem value="COMODATARIO">Comodatário(a)</SelectItem>
                      <SelectItem value="CONDOMINO">Condômino(a)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>% de Exploração</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.explorationPercentage}
                    onChange={(e) => handleChange('explorationPercentage', e.target.value)}
                    placeholder="Ex: 100"
                  />
                </div>

                {formData.ownershipType !== 'PROPRIETARIO' && (
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label>Data de Término do Contrato</Label>
                    <Input 
                      type="date"
                      value={formData.contractEndDate}
                      onChange={(e) => handleChange('contractEndDate', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. ÁREAS & USO DO SOLO */}
        {activeTab === 'AREAS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-xs">
              <h3 className="text-lg font-semibold text-[#1B4D3E]">Dimensionamento de Áreas</h3>
              <p className="text-sm text-muted-foreground mt-0">
                Informações em hectares (ha) utilizadas para dimensionamento zootécnico e ambiental.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Área Total (ha)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.totalArea}
                    onChange={(e) => handleChange('totalArea', e.target.value)}
                    placeholder="Ex: 500"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Área Produtiva / Utilizada (ha)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.productiveArea}
                    onChange={(e) => handleChange('productiveArea', e.target.value)}
                    placeholder="Ex: 350"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Área de Pastagem (ha)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.pastureArea}
                    onChange={(e) => handleChange('pastureArea', e.target.value)}
                    placeholder="Ex: 200"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Área de Preservação / Reserva Legal (ha)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.preserveArea}
                    onChange={(e) => handleChange('preserveArea', e.target.value)}
                    placeholder="Ex: 100"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. DOCUMENTAÇÃO FUNDIÁRIA & CAR */}
        {activeTab === 'DOCUMENTACAO' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-xs">
              <h3 className="text-lg font-semibold text-[#1B4D3E]">Documentação Fundiária e Registros</h3>
              <p className="text-sm text-muted-foreground mt-0">
                Identificadores cartorários e cadastros ambientais da propriedade.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Matrícula do Imóvel</Label>
                  <Input 
                    value={formData.registrationNumber}
                    onChange={(e) => handleChange('registrationNumber', e.target.value)}
                    placeholder="Ex: 12.345"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cartório de Registro de Imóveis (CRI)</Label>
                  <Input 
                    value={formData.registryOffice}
                    onChange={(e) => handleChange('registryOffice', e.target.value)}
                    placeholder="Ex: 1º Ofício de Taguatinga/TO"
                  />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label>Número do CAR (Cadastro Ambiental Rural)</Label>
                  <Input 
                    value={formData.car}
                    onChange={(e) => handleChange('car', e.target.value)}
                    placeholder="Ex: TO-1721000-8F9E82A..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Código CCIR (INCRA)</Label>
                  <Input 
                    value={formData.ccir}
                    onChange={(e) => handleChange('ccir', e.target.value)}
                    placeholder="Ex: 950.123.456.789-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Número do ITR / NIRF</Label>
                  <Input 
                    value={formData.itr}
                    onChange={(e) => handleChange('itr', e.target.value)}
                    placeholder="Ex: 1.234.567-8"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. POSSE & ATIVIDADE */}
        {activeTab === 'POSSE' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-xs">
              <h3 className="text-lg font-semibold text-[#1B4D3E]">Posse e Atividade Econômica</h3>
              <p className="text-sm text-muted-foreground mt-0">
                Histórico de posse e atividades agropecuárias exercidas no imóvel.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Tempo de Posse Contínua (Anos)</Label>
                  <Input 
                    type="number"
                    value={formData.possessionYears}
                    onChange={(e) => handleChange('possessionYears', e.target.value)}
                    placeholder="Ex: 12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Atividade Principal Explorada</Label>
                  <Input 
                    value={formData.explorationActivity}
                    onChange={(e) => handleChange('explorationActivity', e.target.value)}
                    placeholder="Ex: Pecuária de Corte (Cria e Recria)"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. REBANHO & MARCAS */}
        {activeTab === 'REBANHO' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-xs">
              <h3 className="text-lg font-semibold text-[#1B4D3E]">Controle de Rebanho e Marcas</h3>
              <p className="text-sm text-muted-foreground mt-0">
                Dados de animais e identificação para penhor ou trânsito zootécnico.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Total de Cabeças (Gado Bovino)</Label>
                  <Input 
                    type="number"
                    value={formData.totalHeadCount}
                    onChange={(e) => handleChange('totalHeadCount', e.target.value)}
                    placeholder="Ex: 250"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Registro ADAPEC da Marca</Label>
                  <Input 
                    value={formData.brandRegistrationAdapec}
                    onChange={(e) => handleChange('brandRegistrationAdapec', e.target.value)}
                    placeholder="Ex: 987654"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição Visual da Marca</Label>
                  <Input 
                    value={formData.brandDescription}
                    onChange={(e) => handleChange('brandDescription', e.target.value)}
                    placeholder="Ex: Letra J estilizada com arco"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Localização da Marca no Animal</Label>
                  <Input 
                    value={formData.brandLocation}
                    onChange={(e) => handleChange('brandLocation', e.target.value)}
                    placeholder="Ex: Perna Esquerda"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. DOCUMENTOS GED */}
        {activeTab === 'GED' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {initialData?.id && formData.producerId ? (
              <div className="col-span-1 md:col-span-2">
                <ProducerDocumentsSection
                  producerId={formData.producerId}
                  branchId={formData.branchId}
                />
              </div>
            ) : (
              <div className="col-span-1 md:col-span-2 p-10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-slate-50 text-center">
                <FileText className="h-10 w-10 mb-3 opacity-40 text-[#1B4D3E]" />
                <p className="font-semibold text-slate-800">Documentação GED da Propriedade</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md">
                  {initialData?.id 
                    ? "Selecione e salve um Produtor Titular na aba 'Produtor Titular' para habilitar o envio de documentos."
                    : "Salve o cadastro da propriedade para habilitar o upload de documentos (Matrícula, CAR, Certidões) para a nuvem."}
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Form Actions Toolbar */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/crm/properties')}
          disabled={loading}
        >
          Cancelar
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#1B4D3E] hover:bg-[#13382D] text-white shadow-sm"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData?.id ? 'Salvar Alterações' : 'Cadastrar Propriedade'}
          </Button>
        </div>
      </div>

    </form>
  )
}
