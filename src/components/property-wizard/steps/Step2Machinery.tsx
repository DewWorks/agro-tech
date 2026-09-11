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
import { Tractor, Plus } from 'lucide-react'
import { MachineryTableRow } from './step2-subcomponents/MachineryTableRow'

interface Step2MachineryProps {
  form?: UseFormReturn<any>
}

export function Step2Machinery({ form }: Step2MachineryProps) {
  const context = useFormContext()
  const activeForm: UseFormReturn<any> = (form || context) as any
  const { control, register, watch, setValue } = activeForm

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'machineries',
  })

  const machineries = watch('machineries') || []
  const totalMachineryValue = machineries.reduce(
    (acc: number, cur: any) => acc + (Number(cur.value) || 0),
    0
  )

  React.useEffect(() => {
    setValue('computedMachineryValue', totalMachineryValue)
  }, [totalMachineryValue, setValue])

  const handleAddDefault = () => {
    append({
      category: 'Trator de Pneus',
      brand: '',
      model: '',
      year: new Date().getFullYear() - 3,
      powerCapacity: '110 cv',
      chassisSerial: '',
      participationPercent: 100,
      value: 250000,
      hasLien: false,
      lienInstitution: '',
    })
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Tractor className="w-5 h-5 text-emerald-600" />
              Parque de Máquinas, Equipamentos e Veículos Agrícolas
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Cadastre tratores, colheitadeiras, implementos e veículos para composição de patrimônio e garantias (Penhor Rural).
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={handleAddDefault}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm h-9 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Adicionar Máquina
          </Button>
        </CardHeader>

        <CardContent className="pt-4">
          {fields.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                <Tractor className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Nenhum maquinário cadastrado ainda
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mt-1 mb-4">
                Bancos como Banco do Brasil e Sicredi exigem a relação de maquinários com marca, modelo, ano e chassi para análise de capacidade operacional e garantias.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddDefault}
                className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Cadastrar Primeira Máquina
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <Table className="min-w-[1150px]">
                  <TableHeader className="bg-slate-50 dark:bg-slate-900">
                    <TableRow className="border-b border-slate-200 dark:border-slate-800">
                      <TableHead className="w-[190px] min-w-[170px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Categoria *
                      </TableHead>
                      <TableHead className="w-[150px] min-w-[130px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Marca *
                      </TableHead>
                      <TableHead className="w-[150px] min-w-[130px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Modelo *
                      </TableHead>
                      <TableHead className="w-[100px] min-w-[90px] text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                        Ano *
                      </TableHead>
                      <TableHead className="w-[190px] min-w-[170px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Chassi / Série *
                      </TableHead>
                      <TableHead className="w-[150px] min-w-[135px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Valor Unit. (R$) *
                      </TableHead>
                      <TableHead className="w-[200px] min-w-[180px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Tem Penhor? / Credor
                      </TableHead>
                      <TableHead className="w-[60px] min-w-[60px] text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((fieldItem: any, index) => (
                      <MachineryTableRow
                        key={fieldItem.id}
                        index={index}
                        fieldItem={fieldItem}
                        control={control}
                        register={register}
                        setValue={setValue}
                        watch={watch}
                        remove={remove}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Barra de Rodapé com Total de Máquinas */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-600 dark:text-slate-300 mb-2 sm:mb-0">
                  Total de itens: <span className="font-bold text-slate-800 dark:text-slate-100">{fields.length}</span> equipamento(s)
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Total em Máquinas e Veículos:
                  </span>
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(totalMachineryValue)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
