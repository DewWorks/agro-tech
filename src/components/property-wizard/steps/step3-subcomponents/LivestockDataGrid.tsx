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
import { Beef, Plus } from 'lucide-react'
import { LivestockTableRow } from './LivestockTableRow'

interface LivestockDataGridProps {
  form?: UseFormReturn<any>
}

export function LivestockDataGrid({ form }: LivestockDataGridProps) {
  const context = useFormContext()
  const activeForm: UseFormReturn<any> = (form || context) as any
  const { control, register, watch, setValue } = activeForm

  const {
    fields: livestockFields,
    append: appendLivestock,
    remove: removeLivestock,
  } = useFieldArray({
    control,
    name: 'livestocks',
  })

  const livestocks = watch('livestocks') || []

  const totalLivestockValue = livestocks.reduce(
    (acc: number, cur: any) => acc + (Number(cur.quantity || 0) * Number(cur.unitValue || 0)),
    0
  )

  const totalHeadCount = livestocks.reduce(
    (acc: number, cur: any) => acc + (Number(cur.quantity) || 0),
    0
  )

  const handleAddDefaultLivestock = () => {
    appendLivestock({
      species: 'BOVINO',
      category: 'Matrizes (Vacas)',
      purpose: 'Cria',
      breed: 'Nelore',
      geneticGrade: '1/2 Sangue',
      quantity: 100,
      ageMonths: 48,
      avgWeightKg: 450,
      unitValue: 5500,
      totalValue: 550000,
      markingType: 'Ferro Quente',
      markingLocation: 'Perna Traseira Direita',
    })
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Beef className="w-5 h-5 text-emerald-600" />
            2. Semoventes e Rebanho (Zootecnia & Identificação)
          </CardTitle>
          <CardDescription className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Inventário zootécnico com discriminação de categoria, raça, faixa etária e registro de marcas para penhor pecuário.
          </CardDescription>
        </div>
        <Button
          type="button"
          onClick={handleAddDefaultLivestock}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm h-9 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Adicionar Categoria de Animais
        </Button>
      </CardHeader>

      <CardContent className="pt-4">
        {livestockFields.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
              <Beef className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Nenhum lote de animais cadastrado
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mt-1 mb-4">
              O laudo pecuário exige discriminação dos lotes por categoria, peso e sinais identificadores (marca a fogo, brincos, chips) para fins de garantia.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddDefaultLivestock}
              className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Adicionar Lote Padrão
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <Table className="min-w-[1200px]">
                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                  <TableRow className="border-b border-slate-200 dark:border-slate-800">
                    <TableHead className="w-[180px] text-xs font-bold text-slate-700 dark:text-slate-300">
                      Categoria *
                    </TableHead>
                    <TableHead className="w-[130px] text-xs font-bold text-slate-700 dark:text-slate-300">
                      Finalidade *
                    </TableHead>
                    <TableHead className="w-[130px] text-xs font-bold text-slate-700 dark:text-slate-300">
                      Raça *
                    </TableHead>
                    <TableHead className="w-[90px] text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      Cabeças *
                    </TableHead>
                    <TableHead className="w-[80px] text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      Idade (m)
                    </TableHead>
                    <TableHead className="w-[90px] text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      Peso Méd.
                    </TableHead>
                    <TableHead className="w-[130px] text-xs font-bold text-slate-700 dark:text-slate-300">
                      Valor Unit. (R$) *
                    </TableHead>
                    <TableHead className="w-[130px] text-xs font-bold text-slate-700 dark:text-slate-300">
                      Total Estimado
                    </TableHead>
                    <TableHead className="w-[150px] text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tipo de Marca
                    </TableHead>
                    <TableHead className="w-[160px] text-xs font-bold text-slate-700 dark:text-slate-300">
                      Local Marcação
                    </TableHead>
                    <TableHead className="w-[60px] text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {livestockFields.map((fieldItem: any, index) => (
                    <LivestockTableRow
                      key={fieldItem.id}
                      index={index}
                      fieldItem={fieldItem}
                      control={control}
                      register={register}
                      setValue={setValue}
                      watch={watch}
                      remove={removeLivestock}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totalizadores de Semoventes */}
            <div className="flex flex-col sm:flex-row justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 gap-2">
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Total de Cabeças Cadastradas:{' '}
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {totalHeadCount} cabeças
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-600 dark:text-slate-300 mr-3">
                  Total em Semoventes e Rebanho Bovino:
                </span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  R$ {totalLivestockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
