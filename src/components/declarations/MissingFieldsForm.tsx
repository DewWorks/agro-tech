'use client'

import { formatCPF, formatCNPJ } from '@/lib/validations'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Check, ChevronsUpDown, Save, Database, User, MapPin, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MissingFieldsFormProps {
  missingFields: Array<any>
  onSave: (values: Record<string, any>) => void
  isSubmitting: boolean
}

interface IbgeLocation {
  id: number
  nome: string
  sigla?: string // Apenas para estados
}

export function MissingFieldsForm({ missingFields, onSave, isSubmitting }: MissingFieldsFormProps) {
  const [values, setValues] = useState<Record<string, any>>({})
  const [states, setStates] = useState<IbgeLocation[]>([])
  const [cities, setCities] = useState<IbgeLocation[]>([])
  const [openUfSelect, setOpenUfSelect] = useState<string | null>(null)
  const [openCitySelect, setOpenCitySelect] = useState<string | null>(null)
  const [citySelectAttemptedWithoutUf, setCitySelectAttemptedWithoutUf] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)

  // Identificar chaves de UF e Município
  const ufField = missingFields.find(f => f.label.toLowerCase() === 'uf' || f.label.toLowerCase().includes('estado'))
  const cityField = missingFields.find(f => f.label.toLowerCase() === 'município' || f.label.toLowerCase() === 'cidade')

  useEffect(() => {
    if (ufField) {
      fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
        .then(res => res.json())
        .then(data => setStates(data))
    }
  }, [ufField])

  useEffect(() => {
    if (cityField && ufField && values[ufField.key]) {
      const selectedUf = states.find(s => s.sigla === values[ufField.key])
      if (selectedUf) {
        fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf.id}/municipios?orderBy=nome`)
          .then(res => res.json())
          .then(data => setCities(data))
      }
    } else {
      setCities([])
    }
  }, [values, ufField, cityField, states])

  const handleChange = (key: string, value: string) => {
    let finalValue = value
    const field = missingFields.find(f => f.key === key)
    
    if (field) {
      const keyStr = (field.key || '').toUpperCase()
      const labelStr = (field.label || '').toUpperCase()
      
      if (keyStr.includes('CPF') || labelStr.includes('CPF')) {
        finalValue = formatCPF(value)
      } else if (keyStr.includes('CNPJ') || labelStr.includes('CNPJ')) {
        finalValue = formatCNPJ(value)
      }
    }

    setValues(prev => {
      const next = { ...prev, [key]: finalValue }
      // Resetar a cidade se a UF mudar
      if (ufField && key === ufField.key && cityField) {
        next[cityField.key] = ''
      }
      return next
    })
    if (formError) setFormError(null)
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar se UF e Município estão preenchidos, se existirem
    if (ufField && !values[ufField.key]) {
      setFormError('Selecione o estado (UF).')
      return
    }
    if (cityField && !values[cityField.key]) {
      setFormError('Selecione o município.')
      return
    }

    setIsConfirmModalOpen(true)
  }

  const handleConfirmSave = () => {
    setIsConfirmModalOpen(false)
    onSave(values)
  }

  // Agrupar campos pela origem (source)
  const groupedFields = missingFields.reduce((acc, field) => {
    const group = field.source || 'Outros'
    if (!acc[group]) acc[group] = []
    acc[group].push(field)
    return acc
  }, {} as Record<string, Array<any>>)

  const groupLabels: Record<string, string> = {
    'Producer': 'Dados do Produtor',
    'Property': 'Dados da Propriedade',
    'Property.livestock': 'Dados de Rebanho',
    'Property.possessionData': 'Dados de Posse'
  }

  const groupDescriptions: Record<string, string> = {
    'Producer': 'Informações pessoais e de qualificação.',
    'Property': 'Informações sobre a área e localização.',
    'Property.livestock': 'Detalhes do rebanho e rebanho atual.',
    'Property.possessionData': 'Informações de posse, histórico e vizinhos.'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Informações Incompletas</h3>
        <p className="text-slate-500 text-sm">
          Faltam alguns dados para preencher esta minuta. Preencha os campos abaixo e eles serão salvos no cadastro para emissões futuras.
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedFields).map(([group, fields]) => (
          <Card key={group}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{groupLabels[group] || 'Outros Dados'}</CardTitle>
              <CardDescription>
                {groupDescriptions[group] || 'Preencha as informações complementares.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(fields as Array<any>).map((field: any) => {
                  const isUf = ufField && field.key === ufField.key
                  const isCity = cityField && field.key === cityField.key

                  return (
                    <div key={field.key} className="space-y-2 flex flex-col">
                      <Label htmlFor={field.key} className="text-xs font-semibold text-slate-600">
                        {field.label}
                      </Label>
                      
                      {isUf ? (
                        <Popover open={openUfSelect === field.key} onOpenChange={(val) => setOpenUfSelect(val ? field.key : null)}>
                          <PopoverTrigger 
                            render={
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between font-normal bg-white",
                                  !values[field.key] && "text-muted-foreground"
                                )}
                              />
                            }
                          >
                            {values[field.key] ? values[field.key] : "Selecione o estado..."}
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
                                        handleChange(field.key, s.sigla || '')
                                        setOpenUfSelect(null)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          values[field.key] === s.sigla ? "opacity-100" : "opacity-0"
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
                      ) : isCity ? (
                        <div className="flex flex-col space-y-1 w-full">
                          <Popover 
                            open={openCitySelect === field.key} 
                            onOpenChange={(val) => {
                              if (val && !values[ufField?.key || '']) {
                                setCitySelectAttemptedWithoutUf(true)
                                return
                              }
                              setCitySelectAttemptedWithoutUf(false)
                              setOpenCitySelect(val ? field.key : null)
                            }}
                          >
                            <PopoverTrigger 
                              render={
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  onClick={(e) => {
                                    if (!values[ufField?.key || '']) {
                                      e.preventDefault()
                                      setCitySelectAttemptedWithoutUf(true)
                                    }
                                  }}
                                  className={cn(
                                    "w-full justify-between font-normal bg-white",
                                    !values[field.key] && "text-muted-foreground",
                                    !values[ufField?.key || ''] && "opacity-60"
                                  )}
                                />
                              }
                            >
                              <span className="truncate block">
                                {values[field.key] ? values[field.key] : "Selecione o município..."}
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
                                          handleChange(field.key, c.nome)
                                          setOpenCitySelect(null)
                                          setCitySelectAttemptedWithoutUf(false)
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            values[field.key] === c.nome ? "opacity-100" : "opacity-0"
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
                          {citySelectAttemptedWithoutUf && !values[ufField?.key || ''] && (
                            <span className="text-xs text-red-500 font-medium">
                              Selecione o estado (UF) primeiro.
                            </span>
                          )}
                        </div>
                      ) : (
                        <Input
                          id={field.key}
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={values[field.key] || ''}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          placeholder={`Informe ${field.label}`}
                          required
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col items-end gap-3 mt-8">
        {formError && (
          <p className="text-sm font-medium text-red-500">
            {formError}
          </p>
        )}
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="bg-[#1B4D3E] text-white hover:bg-[#113025] px-8"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar e Gerar Preview'}
        </Button>
      </div>

      {/* Modal de Confirmação para Salvar no Cadastro Oficial */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-2xl">
          <div className="p-6 bg-slate-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-[#1B4D3E]">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  Confirmar Gravação de Dados no Cadastro Oficial
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-0.5">
                  Esta ação salvará as informações preenchidas diretamente no cadastro permanente do Produtor e da Propriedade Rural no sistema.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh]">
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Sincronização com o Cadastro Permanente</p>
                <p className="text-[11px] text-emerald-800/90 mt-0.5">
                  Os dados preenchidos abaixo ficarão salvos na página do produtor e da propriedade vinculada, ficando disponíveis permanentemente para futuras emissões e relatórios.
                </p>
              </div>
            </div>

            {Object.entries(groupedFields).map(([group, fieldsList]) => {
              const fields = fieldsList as Array<any>
              const filledFields = fields.filter((f: any) => values[f.key] !== undefined && values[f.key] !== '')
              if (filledFields.length === 0) return null

              return (
                <div key={group} className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wide">
                      {group === 'Producer' ? <User className="h-4 w-4 text-[#1B4D3E]" /> : <MapPin className="h-4 w-4 text-[#1B4D3E]" />}
                      {groupLabels[group] || group}
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      {group === 'Producer' ? 'Salvo na Página do Produtor' : 'Salvo na Página da Propriedade'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {filledFields.map((field: any) => (
                      <div key={field.key} className="bg-slate-50/60 p-2 rounded border border-slate-100">
                        <span className="text-gray-500 text-[10.5px] block">{field.label}:</span>
                        <p className="font-semibold text-gray-900">{values[field.key]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="p-4 bg-slate-50 border-t border-gray-200 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmModalOpen(false)}
              className="text-xs"
            >
              Voltar para Ajustar
            </Button>

            <Button
              type="button"
              onClick={handleConfirmSave}
              disabled={isSubmitting}
              className="bg-[#1B4D3E] hover:bg-[#113025] text-white flex items-center gap-2 text-xs font-bold shadow-xs px-5"
            >
              {isSubmitting ? 'Gravando...' : 'Confirmar e Gravar no Cadastro'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  )
}
