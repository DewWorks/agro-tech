'use client'

import React from 'react'
import { Control, UseFormWatch } from 'react-hook-form'
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
import { LandPlot } from 'lucide-react'

interface LandAreasBalanceCardProps {
  control: Control<any>
  watch: UseFormWatch<any>
}

export function LandAreasBalanceCard({ control, watch }: LandAreasBalanceCardProps) {
  const totalArea = watch('totalArea')
  const vtnPerHectare = watch('vtnPerHectare')
  const totalLandValue = watch('totalLandValue')

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <LandPlot className="w-5 h-5 text-emerald-600" />
          Balanço de Áreas e Avaliação da Terra Nua (VTN)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <FormField
            control={control}
            name="totalArea"
            render={({ field }) => (
              <FormItem className="col-span-2 md:col-span-1">
                <FormLabel className="text-emerald-700 dark:text-emerald-400 font-bold">
                  Área Total (ha) *
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    className="border-emerald-500/40 font-bold"
                    placeholder="Ex: 500"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="consolidatedArea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área Consolidada (ha)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Ex: 350" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="productiveArea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agricultura / Lavoura (ha)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Ex: 200" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="pastureArea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pastagens (ha)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Ex: 150" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="preserveArea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reserva Legal & APP (ha)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Ex: 100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Cálculo do Valor da Terra Nua */}
        <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <FormField
            control={control}
            name="vtnPerHectare"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-emerald-800 dark:text-emerald-300 font-semibold">
                  Valor da Terra Nua - VTN (R$ / ha)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="100"
                    placeholder="Ex: 25000"
                    className="bg-white dark:bg-slate-900 border-emerald-300"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Valor médio de mercado local por hectare</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="bg-white dark:bg-slate-900 p-3 rounded-md border border-emerald-300/60 dark:border-emerald-800 flex flex-col justify-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Valor Total da Terra Nua (Cálculo Automático)
            </span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(Number(totalLandValue) || 0)}
            </span>
            <span className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
              {totalArea || 0} ha × R$ {Number(vtnPerHectare || 0).toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
