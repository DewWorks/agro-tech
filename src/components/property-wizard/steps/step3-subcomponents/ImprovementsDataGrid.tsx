'use client'

import React from 'react'
import { UseFormReturn, useFieldArray, useFormContext } from 'react-hook-form'
import { PropertyWizardFormValues } from '@/lib/validations/property-wizard'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Warehouse, Plus } from 'lucide-react'
import { ImprovementTableRow } from './ImprovementTableRow'

interface ImprovementsDataGridProps {
  form?: UseFormReturn<any>
}

export function ImprovementsDataGrid({ form }: ImprovementsDataGridProps) {
  const context = useFormContext()
  const activeForm: UseFormReturn<any> = (form || context) as any
  const { control, register, watch, setValue } = activeForm

  const {
    fields: improvementFields,
    append: appendImprovement,
    remove: removeImprovement,
  } = useFieldArray({
    control,
    name: 'improvements',
  })

  const improvements = watch('improvements') || []

  const totalImprovementsValue = improvements.reduce(
    (acc: number, cur: any) => acc + (Number(cur.quantity || 0) * Number(cur.unitValue || 0)),
    0
  )

  const handleAddDefaultImprovement = () => {
    appendImprovement({
      specification: 'Curral em cordoalha',
      unit: 'm linear',
      quantity: 120,
      unitValue: 405,
      totalValue: 48600,
      conservationState: 'BOM',
      observation: '',
    })
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Warehouse className="w-5 h-5 text-emerald-600" />
            1. Benfeitorias, Edificações e Instalações Rurais
          </CardTitle>
          <CardDescription className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Casas, currais, cercas, galpões, silos e sistemas solares precificados conforme tabela referencial do Banco do Brasil.
          </CardDescription>
        </div>
        <Button
          type="button"
          onClick={handleAddDefaultImprovement}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm h-9 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Adicionar Benfeitoria
        </Button>
      </CardHeader>

      <CardContent className="pt-4">
        {improvementFields.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
              <Warehouse className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Nenhuma benfeitoria cadastrada
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mt-1 mb-4">
              O laudo de avaliação patrimonial exige o levantamento das edificações com estado de conservação e valor sugerido de mercado.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddDefaultImprovement}
              className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Adicionar Benfeitoria Exemplo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <Table className="min-w-[900px]">
                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                  <TableRow className="border-b border-slate-200 dark:border-slate-800">
                    <TableHead className="w-[300px] text-xs font-bold text-slate-700 dark:text-slate-300">
                      Especificação (Tabela BB) *
                    </TableHead>
                    <TableHead className="w-[120px] text-xs font-bold text-slate-700 dark:text-slate-300">
                      Unidade *
                    </TableHead>
                    <TableHead className="w-[100px] text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      Quantidade *
                    </TableHead>
                    <TableHead className="w-[140px] text-xs font-bold text-slate-700 dark:text-slate-300">
                      Valor Unit. (R$) *
                    </TableHead>
                    <TableHead className="w-[140px] text-xs font-bold text-slate-700 dark:text-slate-300">
                      Subtotal (R$)
                    </TableHead>
                    <TableHead className="w-[140px] text-xs font-bold text-slate-700 dark:text-slate-300">
                      Conservação *
                    </TableHead>
                    <TableHead className="w-[60px] text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {improvementFields.map((fieldItem: any, index) => (
                    <ImprovementTableRow
                      key={fieldItem.id}
                      index={index}
                      fieldItem={fieldItem}
                      register={register}
                      setValue={setValue}
                      watch={watch}
                      remove={removeImprovement}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totalizador de Benfeitorias */}
            <div className="flex justify-end p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="text-right">
                <span className="text-xs text-slate-600 dark:text-slate-300 mr-3">
                  Total em Benfeitorias & Instalações:
                </span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  R$ {totalImprovementsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
