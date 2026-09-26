'use client'

import React from 'react'
import { Control, useWatch } from 'react-hook-form'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, FileText, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SmartCreatableCombobox } from '../../subcomponents/SmartCreatableCombobox'
import { RURAL_ACTIVITIES } from '@/lib/validations/property-wizard'

const OWNERSHIP_LABELS: Record<string, string> = {
  PROPRIETARIO: 'Proprietário',
  ARRENDATARIO: 'Arrendatário',
  COMODATARIO: 'Comodatário',
  PARCEIRO: 'Parceiro / Meeiro',
  CONDOMINO: 'Condômino',
  USUFRUTUARIO: 'Usufrutuário',
  POSSEIRO: 'Posseiro',
}

interface LandIdentificationCardProps {
  control: Control<any>
  branches: Array<{ id: string; name: string }>
  producers: Array<{ id: string; name: string; document?: string; branchId?: string }>
  setValue?: (name: string, value: any, options?: any) => void
}

export function LandIdentificationCard({ control, branches, producers, setValue }: LandIdentificationCardProps) {
  const ownershipType = useWatch({ control, name: 'ownershipType' })

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <Building2 className="w-5 h-5 text-emerald-600" />
          Identificação da Propriedade e Titularidade
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Nome da Fazenda / Imóvel Rural *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Fazenda Boa Esperança" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="branchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Filial de Atendimento *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a filial">
                      {branches.find((b) => b.id === field.value)?.name}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="producerId"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Produtor Titular Vinculado *</FormLabel>
              {producers.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-medium text-amber-800">
                      Nenhum produtor cadastrado para vincular a esta propriedade.
                    </span>
                  </div>
                  <Link href="/admin/crm/new">
                    <Button type="button" size="sm" className="bg-[#1B4D3E] hover:bg-[#153e32] text-white text-xs h-7 px-3">
                      Cadastrar Produtor
                    </Button>
                  </Link>
                </div>
              ) : (
                <Select
                  onValueChange={(val) => {
                    field.onChange(val)
                    if (setValue) {
                      const selected = producers.find((prod) => prod.id === val)
                      if (selected?.branchId) {
                        setValue('branchId', selected.branchId, { shouldValidate: true })
                      }
                    }
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o produtor rural">
                        {(() => {
                          const p = producers.find((prod) => prod.id === field.value)
                          return p ? `${p.name} ${p.document ? `(${p.document})` : ''}` : undefined
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {producers.map((p) => {
                      const branchName = branches.find((b) => b.id === p.branchId)?.name
                      return (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} {p.document ? `(${p.document})` : ''}
                          {branchName ? ` • ${branchName}` : ''}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="ownershipType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Vínculo *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Vínculo com a terra">
                      {OWNERSHIP_LABELS[field.value] || field.value}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PROPRIETARIO">Proprietário</SelectItem>
                  <SelectItem value="ARRENDATARIO">Arrendatário</SelectItem>
                  <SelectItem value="COMODATARIO">Comodatário</SelectItem>
                  <SelectItem value="PARCEIRO">Parceiro / Meeiro</SelectItem>
                  <SelectItem value="CONDOMINO">Condômino</SelectItem>
                  <SelectItem value="USUFRUTUARIO">Usufrutuário</SelectItem>
                  <SelectItem value="POSSEIRO">Posseiro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="propertyStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Situação da Propriedade *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || 'QUITADA'}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a situação">
                      {field.value === 'FINANCIADA' ? 'Financiada' : 'Quitada'}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="QUITADA">Quitada (Sem Financiamento Ativo)</SelectItem>
                  <SelectItem value="FINANCIADA">Financiada (Alienação / Hipoteca)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="explorationPercentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>% de Exploração do Titular *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="100"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="explorationActivity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Atividade Principal (Smart Combobox) *</FormLabel>
              <FormControl>
                <SmartCreatableCombobox
                  value={field.value}
                  onChange={field.onChange}
                  options={RURAL_ACTIVITIES}
                  placeholder="Selecione ou digite a atividade"
                  searchPlaceholder="Buscar ou cadastrar atividade..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bloco Condicional para Não Proprietários (Arrendatário / Comodatário / Parceiro / Meeiro) */}
        {ownershipType && ownershipType !== 'PROPRIETARIO' && (
          <div className="col-span-1 md:col-span-3 p-4 rounded-lg border border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Dados da Cedência / Contrato (Arrendamento, Parceria ou Comodato)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <FormField
                control={control}
                name="landlordName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Nome do Cedente / Proprietário *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo do proprietário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="landlordDocument"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">CPF / CNPJ do Cedente *</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="contractType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Tipo de Contrato</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'ARRENDAMENTO'}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Tipo de contrato">
                            {{
                              ARRENDAMENTO: 'Arrendamento',
                              PARCERIA: 'Parceria Agrícola / Pecuária',
                              COMODATO: 'Comodato',
                              MEEIRIA: 'Meeiria',
                              OUTRO: 'Outro Vínculo',
                            }[field.value as string] || field.value}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ARRENDAMENTO">Arrendamento</SelectItem>
                        <SelectItem value="PARCERIA">Parceria Agrícola / Pecuária</SelectItem>
                        <SelectItem value="COMODATO">Comodato</SelectItem>
                        <SelectItem value="MEEIRIA">Meeiria</SelectItem>
                        <SelectItem value="OUTRO">Outro Vínculo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="contractStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Início da Vigência *</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="DD/MM/AAAA"
                        showPresets={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="contractEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Término da Vigência *</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="DD/MM/AAAA"
                        showPresets={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="exploredAreaHa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Área Explorada / Cedida (ha) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 150.00"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
