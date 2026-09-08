'use client'

import React from 'react'
import { UseFormReturn, useFieldArray } from 'react-hook-form'
import {
  PropertyWizardFormValues,
  BB_IMPROVEMENTS_CATALOG,
  LIVESTOCK_CATEGORIES,
  LIVESTOCK_BREEDS,
  LIVESTOCK_PURPOSES,
} from '@/lib/validations/property-wizard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Warehouse, Beef, Plus, Trash2 } from 'lucide-react'

interface Step3ImprovementsHerdProps {
  form: UseFormReturn<any>
}

export function Step3ImprovementsHerd({ form }: Step3ImprovementsHerdProps) {
  const { control, register, watch, setValue } = form

  // 1. DataGrid de Benfeitorias
  const {
    fields: improvementFields,
    append: appendImprovement,
    remove: removeImprovement,
  } = useFieldArray({
    control,
    name: 'improvements',
  })

  // 2. DataGrid de Semoventes / Rebanho
  const {
    fields: livestockFields,
    append: appendLivestock,
    remove: removeLivestock,
  } = useFieldArray({
    control,
    name: 'livestocks',
  })

  const improvements = watch('improvements') || []
  const livestocks = watch('livestocks') || []

  const totalImprovementsValue = improvements.reduce(
    (acc: number, cur: any) => acc + (Number(cur.quantity || 0) * Number(cur.unitValue || 0)),
    0
  )

  const totalLivestockValue = livestocks.reduce(
    (acc: number, cur: any) => acc + (Number(cur.quantity || 0) * Number(cur.unitValue || 0)),
    0
  )

  const totalHeadCount = livestocks.reduce(
    (acc: number, cur: any) => acc + (Number(cur.quantity) || 0),
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
    <div className="space-y-8">
      {/* SEÇÃO 1: BENFEITORIAS E CONSTRUÇÕES (TABELA OFICIAL BB) */}
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
            <div className="py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 mb-2">
                <Warehouse className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Nenhuma benfeitoria cadastrada
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddDefaultImprovement}
                className="mt-3 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Adicionar Benfeitoria BB
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900">
                    <TableRow className="border-b border-slate-200 dark:border-slate-800">
                      <TableHead className="w-[260px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Especificação (Tabela BB) *
                      </TableHead>
                      <TableHead className="w-[100px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Unidade *
                      </TableHead>
                      <TableHead className="w-[110px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Quantidade *
                      </TableHead>
                      <TableHead className="w-[130px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Vlr. Unit. (R$) *
                      </TableHead>
                      <TableHead className="w-[140px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Subtotal (R$)
                      </TableHead>
                      <TableHead className="w-[120px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Conservação
                      </TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {improvementFields.map((fieldItem: any, index) => {
                      const qty = Number(watch(`improvements.${index}.quantity`)) || 0
                      const unitVal = Number(watch(`improvements.${index}.unitValue`)) || 0
                      const rowTotal = Math.round(qty * unitVal * 100) / 100

                      return (
                        <TableRow
                          key={fieldItem.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800"
                        >
                          {/* Especificação com Autocomplete BB */}
                          <TableCell className="p-2 align-top">
                            <Select
                              defaultValue={fieldItem.specification}
                              onValueChange={(val) => {
                                if (!val) return
                                setValue(`improvements.${index}.specification`, val)
                                const matched = BB_IMPROVEMENTS_CATALOG.find(
                                  (item) => item.specification === val
                                )
                                if (matched) {
                                  setValue(`improvements.${index}.unit`, matched.unit)
                                  setValue(
                                    `improvements.${index}.unitValue`,
                                    matched.suggestedValue
                                  )
                                }
                              }}
                            >
                              <SelectTrigger className="h-9 text-xs w-full">
                                <SelectValue placeholder="Selecione ou busque..." />
                              </SelectTrigger>
                              <SelectContent className="max-h-60">
                                {BB_IMPROVEMENTS_CATALOG.map((item) => (
                                  <SelectItem
                                    key={item.specification}
                                    value={item.specification}
                                    className="text-xs"
                                  >
                                    {item.specification} ({item.unit})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Unidade */}
                          <TableCell className="p-2 align-top">
                            <Input
                              placeholder="m², km, un"
                              className="h-9 text-xs"
                              {...register(`improvements.${index}.unit`)}
                            />
                          </TableCell>

                          {/* Quantidade */}
                          <TableCell className="p-2 align-top">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0"
                              className="h-9 text-xs font-mono"
                              {...register(`improvements.${index}.quantity`)}
                            />
                          </TableCell>

                          {/* Valor Unitário */}
                          <TableCell className="p-2 align-top">
                            <Input
                              type="number"
                              step="10"
                              placeholder="R$ 0,00"
                              className="h-9 text-xs font-mono"
                              {...register(`improvements.${index}.unitValue`)}
                            />
                          </TableCell>

                          {/* Subtotal Calculado */}
                          <TableCell className="p-2 align-top font-bold text-xs text-emerald-700 dark:text-emerald-400">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(rowTotal)}
                          </TableCell>

                          {/* Estado de Conservação */}
                          <TableCell className="p-2 align-top">
                            <Select
                              defaultValue={fieldItem.conservationState || 'BOM'}
                              onValueChange={(val) =>
                                setValue(`improvements.${index}.conservationState`, val || 'BOM')
                              }
                            >
                              <SelectTrigger className="h-9 text-xs w-full">
                                <SelectValue placeholder="Estado" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="NOVO" className="text-xs">Novo</SelectItem>
                                <SelectItem value="OTIMO" className="text-xs">Ótimo</SelectItem>
                                <SelectItem value="BOM" className="text-xs">Bom</SelectItem>
                                <SelectItem value="REGULAR" className="text-xs">Regular</SelectItem>
                                <SelectItem value="RUIM" className="text-xs">Ruim</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Remover */}
                          <TableCell className="p-2 align-top text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeImprovement(index)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Total em Benfeitorias e Edificações:
                  </span>
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(totalImprovementsValue)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEÇÃO 2: REBANHO E SEMOVENTES (ZOOTECNIA & GARANTIAS BB) */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Beef className="w-5 h-5 text-emerald-600" />
              2. Rebanho, Semoventes e Indicadores Zootécnicos
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Categorização zootécnica de bovinos e animais da fazenda com raça, peso, idade e marca para garantia bancária.
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
            <div className="py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 mb-2">
                <Beef className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Nenhum lote de semoventes cadastrado
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddDefaultLivestock}
                className="mt-3 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Cadastrar Rebanho Bovino
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900">
                    <TableRow className="border-b border-slate-200 dark:border-slate-800">
                      <TableHead className="w-[160px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Categoria Zootécnica *
                      </TableHead>
                      <TableHead className="w-[120px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Finalidade *
                      </TableHead>
                      <TableHead className="w-[130px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Raça *
                      </TableHead>
                      <TableHead className="w-[90px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Cabeças *
                      </TableHead>
                      <TableHead className="w-[90px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Idade (m)
                      </TableHead>
                      <TableHead className="w-[90px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Peso (kg)
                      </TableHead>
                      <TableHead className="w-[120px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Vlr. Unit. (R$) *
                      </TableHead>
                      <TableHead className="w-[130px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Total (R$)
                      </TableHead>
                      <TableHead className="w-[180px] text-xs font-bold text-slate-700 dark:text-slate-300">
                        Marcação / Local
                      </TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {livestockFields.map((fieldItem: any, index) => {
                      const heads = Number(watch(`livestocks.${index}.quantity`)) || 0
                      const unitPrice = Number(watch(`livestocks.${index}.unitValue`)) || 0
                      const rowTotal = Math.round(heads * unitPrice * 100) / 100

                      return (
                        <TableRow
                          key={fieldItem.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800"
                        >
                          {/* Categoria */}
                          <TableCell className="p-2 align-top">
                            <Select
                              defaultValue={fieldItem.category}
                              onValueChange={(val) =>
                                setValue(`livestocks.${index}.category`, val || '')
                              }
                            >
                              <SelectTrigger className="h-9 text-xs w-full">
                                <SelectValue placeholder="Categoria" />
                              </SelectTrigger>
                              <SelectContent>
                                {LIVESTOCK_CATEGORIES.map((cat) => (
                                  <SelectItem key={cat} value={cat} className="text-xs">
                                    {cat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Finalidade */}
                          <TableCell className="p-2 align-top">
                            <Select
                              defaultValue={fieldItem.purpose || 'Cria'}
                              onValueChange={(val) =>
                                setValue(`livestocks.${index}.purpose`, val || 'Cria')
                              }
                            >
                              <SelectTrigger className="h-9 text-xs w-full">
                                <SelectValue placeholder="Finalidade" />
                              </SelectTrigger>
                              <SelectContent>
                                {LIVESTOCK_PURPOSES.map((purp) => (
                                  <SelectItem key={purp} value={purp} className="text-xs">
                                    {purp}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Raça */}
                          <TableCell className="p-2 align-top">
                            <Select
                              defaultValue={fieldItem.breed || 'Nelore'}
                              onValueChange={(val) =>
                                setValue(`livestocks.${index}.breed`, val || 'Nelore')
                              }
                            >
                              <SelectTrigger className="h-9 text-xs w-full">
                                <SelectValue placeholder="Raça" />
                              </SelectTrigger>
                              <SelectContent>
                                {LIVESTOCK_BREEDS.map((breed) => (
                                  <SelectItem key={breed} value={breed} className="text-xs">
                                    {breed}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Cabeças */}
                          <TableCell className="p-2 align-top">
                            <Input
                              type="number"
                              min={1}
                              placeholder="100"
                              className="h-9 text-xs font-mono font-bold"
                              {...register(`livestocks.${index}.quantity`)}
                            />
                          </TableCell>

                          {/* Idade Meses */}
                          <TableCell className="p-2 align-top">
                            <Input
                              type="number"
                              min={0}
                              placeholder="48"
                              className="h-9 text-xs font-mono"
                              {...register(`livestocks.${index}.ageMonths`)}
                            />
                          </TableCell>

                          {/* Peso Médio */}
                          <TableCell className="p-2 align-top">
                            <Input
                              type="number"
                              min={0}
                              placeholder="450"
                              className="h-9 text-xs font-mono"
                              {...register(`livestocks.${index}.avgWeightKg`)}
                            />
                          </TableCell>

                          {/* Valor Unitário */}
                          <TableCell className="p-2 align-top">
                            <Input
                              type="number"
                              step="100"
                              placeholder="R$ 0,00"
                              className="h-9 text-xs font-mono font-semibold"
                              {...register(`livestocks.${index}.unitValue`)}
                            />
                          </TableCell>

                          {/* Total */}
                          <TableCell className="p-2 align-top font-bold text-xs text-emerald-700 dark:text-emerald-400">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(rowTotal)}
                          </TableCell>

                          {/* Marcação e Local */}
                          <TableCell className="p-2 align-top space-y-1">
                            <Input
                              placeholder="Ex: Ferro Quente"
                              className="h-8 text-xs"
                              {...register(`livestocks.${index}.markingType`)}
                            />
                            <Input
                              placeholder="Ex: Perna Traseira Dir."
                              className="h-8 text-xs text-slate-600 dark:text-slate-300"
                              {...register(`livestocks.${index}.markingLocation`)}
                            />
                          </TableCell>

                          {/* Remover */}
                          <TableCell className="p-2 align-top text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLivestock(index)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-600 dark:text-slate-300 mb-2 sm:mb-0">
                  Total do Plantel: <span className="font-bold text-slate-800 dark:text-slate-100">{totalHeadCount.toLocaleString('pt-BR')}</span> cabeças
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Total em Semoventes / Rebanho:
                  </span>
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(totalLivestockValue)}
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
