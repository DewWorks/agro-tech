'use client'

import React from 'react'
import { Control } from 'react-hook-form'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

interface LandDocumentationCardProps {
  control: Control<any>
}

export function LandDocumentationCard({ control }: LandDocumentationCardProps) {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <FileText className="w-5 h-5 text-emerald-600" />
          Documentação Fundiária & Registros Oficiais
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={control}
          name="registrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Matrícula (Apenas Números) *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: 2718"
                  {...field}
                  onChange={(e) => {
                    const numOnly = e.target.value.replace(/\D/g, '')
                    field.onChange(numOnly)
                  }}
                />
              </FormControl>
              <FormDescription>CRI - Sem letras ou pontos</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="registryOffice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cartório de Registro (CRI) *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 1º Ofício de Registro de Imóveis" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="comarca"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comarca do Cartório *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Taguatinga" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="car"
          render={({ field }) => (
            <FormItem className="md:col-span-3">
              <FormLabel>Código do CAR (Cadastro Ambiental Rural) *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: TO-1700000-ABCD.1234.EF56.7890.1234.5678.90AB"
                  className="font-mono uppercase text-xs"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase().trim())}
                />
              </FormControl>
              <FormDescription>
                Padrão federal: UF-CódigoMunicípio-Hash.Hash.Hash.Hash.Hash.Hash.Hash
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="ccir"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CCIR (Código INCRA - 13 dígitos) *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: 0000276332244"
                  maxLength={13}
                  className="font-mono"
                  {...field}
                  onChange={(e) => {
                    const num = e.target.value.replace(/\D/g, '').slice(0, 13)
                    field.onChange(num)
                  }}
                />
              </FormControl>
              <FormDescription>{field.value?.length || 0}/13 dígitos</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="itr"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ITR / NIRF (Receita Federal - 8 dígitos) *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: 54444829"
                  maxLength={8}
                  className="font-mono"
                  {...field}
                  onChange={(e) => {
                    const num = e.target.value.replace(/\D/g, '').slice(0, 8)
                    field.onChange(num)
                  }}
                />
              </FormControl>
              <FormDescription>{field.value?.length || 0}/8 dígitos</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="ruralModules"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Módulos Fiscais / Rurais</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="Ex: 2.5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
