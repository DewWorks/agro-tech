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
import { Check, ChevronsUpDown } from 'lucide-react'
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
    </form>
  )
}
