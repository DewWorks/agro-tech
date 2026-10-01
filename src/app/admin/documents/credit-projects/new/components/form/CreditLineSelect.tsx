'use client'

import React, { useState, useMemo } from 'react'
import {
  Landmark,
  Check,
  ChevronsUpDown,
  Search,
  Sparkles,
  Info,
  Calendar,
  Percent,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  OFFICIAL_CREDIT_LINES,
  OfficialCreditLine,
  findOfficialCreditLine,
  CreditLineAxis,
  getCreditLineBadgeClass,
} from '@/lib/constants/credit-lines-catalog'
import { CustomOptions } from '../../types/wizard-types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CreditLineSelectProps {
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
  operationalAxis?: 'custeio' | 'investimento'
  selectedTemplateCode: string
  setSelectedTemplateCode?: (code: string) => void
  className?: string
}

export function CreditLineSelect({
  customOptions,
  setCustomOptions,
  operationalAxis,
  selectedTemplateCode,
  setSelectedTemplateCode,
  className,
}: CreditLineSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [axisFilter, setAxisFilter] = useState<'AUTO' | 'TODOS' | 'CUSTEIO' | 'INVESTIMENTO'>('AUTO')

  // Linha atualmente selecionada (ou padrão pelo template)
  const currentLine = useMemo(() => {
    if (customOptions.creditLineId) {
      return findOfficialCreditLine(customOptions.creditLineId)
    }
    // Fallback inteligente baseado no template e eixo
    if (selectedTemplateCode === 'PROJETO_CUSTEIO_SAFRA') {
      return findOfficialCreditLine('PRONAMP')
    }
    if (selectedTemplateCode === 'PROJETO_INOVAGRO') {
      return findOfficialCreditLine('INOVAGRO')
    }
    if (selectedTemplateCode === 'PROJETO_RENOVAGRO') {
      return findOfficialCreditLine('RENOVAGRO')
    }
    return undefined
  }, [customOptions.creditLineId, selectedTemplateCode])

  // Filtragem das linhas
  const filteredLines = useMemo(() => {
    let lines = OFFICIAL_CREDIT_LINES

    // Se o filtro for 'AUTO', prioriza o eixo operacional do contexto
    const activeAxis: CreditLineAxis | 'TODOS' =
      axisFilter === 'AUTO'
        ? operationalAxis === 'custeio'
          ? 'CUSTEIO'
          : operationalAxis === 'investimento'
          ? 'INVESTIMENTO'
          : 'TODOS'
        : axisFilter

    if (activeAxis !== 'TODOS') {
      lines = lines.filter((l) => l.axis === activeAxis || l.axis === 'AMBOS')
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      lines = lines.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.shortName.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.targetAudience.toLowerCase().includes(q) ||
          l.suggestedItems.some((item) => item.toLowerCase().includes(q))
      )
    }

    return lines
  }, [axisFilter, operationalAxis, search])

  // Aplica a linha oficial selecionada
  const handleSelectLine = (line: OfficialCreditLine) => {
    setCustomOptions((prev) => {
      const updated: CustomOptions = {
        ...prev,
        creditLineId: line.id,
        creditLineName: line.name,
        creditLineShortName: line.shortName,
        creditLineAxis: line.axis,
      }

      // Aplica parâmetros financeiros conforme o template atual
      if (selectedTemplateCode === 'PROJETO_CUSTEIO_SAFRA') {
        updated.custeioInterestRate = line.defaultInterestRate
      } else if (selectedTemplateCode === 'PROJETO_RENOVAGRO') {
        updated.renovagroInterestRate = line.defaultInterestRate
        updated.renovagroTermYears = line.defaultTermYears
        updated.renovagroGraceMonths = line.defaultGraceMonths

        // Sugestão de sublinha se aplicável
        if (line.id === 'MODERFROTA') {
          updated.renovagroSubline = 'Máquinas e Equipamentos de Baixo Carbono'
        } else if (line.id === 'RENOVAGRO' && !prev.renovagroSubline) {
          updated.renovagroSubline = 'Recuperação de Pastagens Degradadas (MCR 11.7.1.c.I)'
        }
      } else if (selectedTemplateCode === 'PROJETO_INOVAGRO') {
        updated.inovagroInterestRate = line.defaultInterestRate
        updated.inovagroTermYears = line.defaultTermYears
        updated.inovagroGraceMonths = line.defaultGraceMonths
      }

      return updated
    })

    // Caso o operador mude para uma linha de outro template (ex: selecionou Inovagro estando em Renovagro)
    if (
      setSelectedTemplateCode &&
      line.recommendedTemplate &&
      line.recommendedTemplate !== selectedTemplateCode &&
      ['PROJETO_CUSTEIO_SAFRA', 'PROJETO_RENOVAGRO', 'PROJETO_INOVAGRO'].includes(selectedTemplateCode)
    ) {
      setSelectedTemplateCode(line.recommendedTemplate)
    }

    setOpen(false)
    toast.success(`Linha "${line.shortName}" selecionada!`, {
      description: `Taxa: ${line.defaultInterestRate}% a.a. • Prazo: ${line.defaultTermYears} anos • Carência: ${line.defaultGraceMonths}m`,
    })
  }

  return (
    <div className={cn('space-y-1.5 flex flex-col justify-start w-full', className)}>
      <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between h-[26px] min-h-[26px] w-full">
        <span className="flex items-center gap-1.5 truncate min-w-0 mr-2">
          <Landmark className="h-3.5 w-3.5 text-[#1B4D3E] shrink-0" />
          <span className="truncate">3. Linha Oficial de Financiamento *</span>
        </span>
        <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0 whitespace-nowrap">
          {currentLine
            ? `${currentLine.defaultInterestRate}% a.a. • ${currentLine.defaultTermYears}a`
            : '15 Linhas Oficiais'}
        </span>
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-medium text-left text-xs h-10 px-3.5 bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center"
            />
          }
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate font-semibold text-gray-900">
              {currentLine ? currentLine.name : 'Selecione a linha oficial (15 Linhas)...'}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
        </PopoverTrigger>

        <PopoverContent className="w-[360px] sm:w-[460px] p-0" align="start">
          {/* Header do Popover com Filtros de Eixo */}
          <div className="p-3 bg-slate-50 border-b border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Catálogo das 15 Linhas Oficiais
              </span>
              <span className="text-[10px] text-muted-foreground">Plano Safra / BNDES</span>
            </div>

            {/* Abas Rápidas de Filtragem de Eixo */}
            <div className="grid grid-cols-3 gap-1 bg-gray-200/70 p-0.5 rounded-lg text-center">
              <button
                type="button"
                onClick={() => setAxisFilter('AUTO')}
                className={cn(
                  'text-[10px] py-1 rounded-md font-semibold transition-all cursor-pointer',
                  axisFilter === 'AUTO'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Recomendadas
              </button>
              <button
                type="button"
                onClick={() => setAxisFilter('CUSTEIO')}
                className={cn(
                  'text-[10px] py-1 rounded-md font-semibold transition-all cursor-pointer',
                  axisFilter === 'CUSTEIO'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Custeio
              </button>
              <button
                type="button"
                onClick={() => setAxisFilter('INVESTIMENTO')}
                className={cn(
                  'text-[10px] py-1 rounded-md font-semibold transition-all cursor-pointer',
                  axisFilter === 'INVESTIMENTO'
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Investimento
              </button>
            </div>

            {/* Input de Busca */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <Input
                type="text"
                placeholder="Filtrar por nome, taxa, programa ou destinação..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-white"
              />
            </div>
          </div>

          {/* Lista de Opções Rolável */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 p-1">
            {filteredLines.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Nenhuma linha oficial encontrada para o filtro atual.
              </div>
            ) : (
              filteredLines.map((line) => {
                const isSelected = currentLine?.id === line.id
                return (
                  <button
                    key={line.id}
                    type="button"
                    onClick={() => handleSelectLine(line)}
                    className={cn(
                      'w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-2.5 cursor-pointer group',
                      isSelected
                        ? 'bg-emerald-50/80 border border-emerald-300'
                        : 'hover:bg-slate-50 border border-transparent'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 transition-colors',
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-gray-300 group-hover:border-emerald-400'
                      )}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-gray-900 truncate group-hover:text-emerald-800">
                          {line.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] font-semibold px-2 py-0.5 rounded-md border shrink-0',
                            getCreditLineBadgeClass(line.axis)
                          )}
                        >
                          {line.axis === 'AMBOS' ? 'Custeio / Invest.' : line.axis}
                        </Badge>
                      </div>

                      <p className="text-[10.5px] text-gray-500 line-clamp-2 leading-relaxed mb-1.5">
                        {line.description}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-gray-600 font-medium">
                        <span className="flex items-center gap-1 text-emerald-700 font-bold">
                          <Percent className="w-3 h-3 text-emerald-600" />
                          {line.defaultInterestRate}% a.a.
                        </span>
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          Carência até {line.maxGraceMonths}m
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          Até {line.maxTermYears} anos
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div className="p-2 bg-gray-50 border-t border-gray-200 text-center text-[10px] text-gray-500 flex items-center justify-center gap-1">
            <Info className="w-3 h-3 text-gray-400" />
            <span>A alteração da linha atualiza as taxas sem resetar dados cadastrais já preenchidos.</span>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
