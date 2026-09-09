'use client'

import React from 'react'
import { Control } from 'react-hook-form'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2 } from 'lucide-react'
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
  producers: Array<{ id: string; name: string; document?: string }>
}

export function LandIdentificationCard({ control, branches, producers }: LandIdentificationCardProps) {
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
              <Select onValueChange={field.onChange} value={field.value}>
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
                  {producers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.document ? `(${p.document})` : ''}
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
          name="contractEndDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Término de Contrato (se não proprietário)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
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
      </CardContent>
    </Card>
  )
}
