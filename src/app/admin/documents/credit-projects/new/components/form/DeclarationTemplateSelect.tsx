'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Check, ChevronsUpDown, ShieldCheck, TreePine, Users, FileSignature, Filter, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { CreditTemplateMeta } from '@/lib/document-templates'

export const DECLARATION_CATEGORIES = [
  {
    id: 'TODAS',
    label: 'Todas as Declarações',
    shortLabel: 'Todas (8)',
    codes: [
      'AUTORIZACAO_SCR',
      'AUTORIZACAO_SICOR',
      'AUTORIZACAO_COMPARTILHAMENTO',
      'DECLARACAO_POSSE_MANSA',
      'DECLARACAO_REGULARIDADE_AMBIENTAL',
      'DECLARACAO_FORA_BIOMA',
      'ENQUADRAMENTO_CAF',
      'IDENTIFICACAO_ANIMAIS'
    ]
  },
  {
    id: 'COMPLIANCE',
    label: 'Autorizações Bancárias & Compliance',
    shortLabel: 'Autorizações (3)',
    codes: ['AUTORIZACAO_SCR', 'AUTORIZACAO_SICOR', 'AUTORIZACAO_COMPARTILHAMENTO']
  },
  {
    id: 'AMBIENTAL',
    label: 'Regularidade Ambiental & Fundiária',
    shortLabel: 'Ambiental (3)',
    codes: ['DECLARACAO_POSSE_MANSA', 'DECLARACAO_REGULARIDADE_AMBIENTAL', 'DECLARACAO_FORA_BIOMA']
  },
  {
    id: 'SOCIAL_GARANTIAS',
    label: 'Enquadramento Social & Garantias',
    shortLabel: 'Garantias (2)',
    codes: ['ENQUADRAMENTO_CAF', 'IDENTIFICACAO_ANIMAIS']
  }
]

interface DeclarationTemplateSelectProps {
  templates: CreditTemplateMeta[]
  selectedTemplateCode: string
  setSelectedTemplateCode: (code: string) => void
  currentTemplate: CreditTemplateMeta | undefined
  initialCategory?: string
}

export function DeclarationTemplateSelect({
  templates,
  selectedTemplateCode,
  setSelectedTemplateCode,
  currentTemplate,
  initialCategory,
}: DeclarationTemplateSelectProps) {
  const [open, setOpen] = useState(false)

  // Determina a categoria inicial baseada no parâmetro de rota ou no template selecionado
  const getCategoryFromParamOrCode = (catParam?: string, code?: string) => {
    if (catParam) {
      if (catParam.includes('compliance') || catParam.includes('bancario')) return 'COMPLIANCE'
      if (catParam.includes('ambiental') || catParam.includes('fundiaria')) return 'AMBIENTAL'
      if (catParam.includes('social') || catParam.includes('garantias')) return 'SOCIAL_GARANTIAS'
    }
    if (code) {
      if (['AUTORIZACAO_SCR', 'AUTORIZACAO_SICOR', 'AUTORIZACAO_COMPARTILHAMENTO'].includes(code)) return 'COMPLIANCE'
      if (['DECLARACAO_POSSE_MANSA', 'DECLARACAO_REGULARIDADE_AMBIENTAL', 'DECLARACAO_FORA_BIOMA'].includes(code)) return 'AMBIENTAL'
      if (['ENQUADRAMENTO_CAF', 'IDENTIFICACAO_ANIMAIS'].includes(code)) return 'SOCIAL_GARANTIAS'
    }
    return 'TODAS'
  }

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>(() =>
    getCategoryFromParamOrCode(initialCategory, selectedTemplateCode)
  )

  useEffect(() => {
    if (initialCategory) {
      setActiveCategoryFilter(getCategoryFromParamOrCode(initialCategory, selectedTemplateCode))
    }
  }, [initialCategory])

  // Identifica a categoria do template selecionado para badge
  const selectedCategoryMeta = useMemo(() => {
    if (['AUTORIZACAO_SCR', 'AUTORIZACAO_SICOR', 'AUTORIZACAO_COMPARTILHAMENTO'].includes(selectedTemplateCode)) {
      return { label: 'Autorizações BB', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
    }
    if (['DECLARACAO_POSSE_MANSA', 'DECLARACAO_REGULARIDADE_AMBIENTAL', 'DECLARACAO_FORA_BIOMA'].includes(selectedTemplateCode)) {
      return { label: 'Ambiental & Fundiária', color: 'bg-teal-50 text-teal-800 border-teal-200' }
    }
    if (['ENQUADRAMENTO_CAF', 'IDENTIFICACAO_ANIMAIS'].includes(selectedTemplateCode)) {
      return { label: 'Enquadramento & Penhor', color: 'bg-blue-50 text-blue-800 border-blue-200' }
    }
    return { label: 'Declaração Oficial', color: 'bg-slate-50 text-slate-700 border-slate-200' }
  }, [selectedTemplateCode])

  // Filtra templates de acordo com a aba de categoria selecionada
  const filteredTemplates = useMemo(() => {
    if (activeCategoryFilter === 'TODAS') return templates
    const cat = DECLARATION_CATEGORIES.find((c) => c.id === activeCategoryFilter)
    if (!cat) return templates
    return templates.filter((t) => cat.codes.includes(t.code))
  }, [templates, activeCategoryFilter])

  return (
    <div className="space-y-1.5 flex flex-col justify-start w-full">
      <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between h-[26px] min-h-[26px] w-full">
        <span className="flex items-center gap-1.5 truncate min-w-0 mr-2">
          <FileSignature className="h-3.5 w-3.5 text-[#1B4D3E] shrink-0" />
          <span className="truncate">3. Modelo de Declaração Legal *</span>
        </span>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${selectedCategoryMeta.color}`}>
          {selectedCategoryMeta.label}
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
          <div className="flex items-center gap-2 truncate mr-1">
            <span className="truncate text-gray-900 font-semibold">
              {currentTemplate ? currentTemplate.title : 'Selecione uma declaração...'}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
        </PopoverTrigger>

        <PopoverContent className="w-[360px] sm:w-[420px] p-0 shadow-xl border-gray-200 rounded-2xl" align="start">
          <div className="p-3 bg-gray-50/80 border-b border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1">
                <Filter className="h-3 w-3 text-[#1B4D3E]" />
                Filtrar por Categoria:
              </span>
              <span className="text-[10px] text-muted-foreground">8 modelos disponíveis</span>
            </div>

            {/* Abas / Pills de Filtro de Categoria */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
              {DECLARATION_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategoryFilter(cat.id)}
                  className={cn(
                    'text-[10.5px] py-1 px-2 rounded-lg font-medium transition-all text-center truncate cursor-pointer',
                    activeCategoryFilter === cat.id
                      ? 'bg-[#1B4D3E] text-white shadow-xs font-bold'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  {cat.shortLabel}
                </button>
              ))}
            </div>
          </div>

          <Command>
            <CommandInput placeholder="Buscar modelo (ex: SCR, SICOR, Posse Mansa, CAF...)" className="text-xs" />
            <CommandList className="max-h-[300px]">
              <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                Nenhuma declaração encontrada nesta categoria.
              </CommandEmpty>

              <CommandGroup heading={DECLARATION_CATEGORIES.find((c) => c.id === activeCategoryFilter)?.label || 'Modelos Disponíveis'}>
                {filteredTemplates.map((tmpl) => {
                  const cmdValue = `${tmpl.title} ${tmpl.subtitle || ''} ${tmpl.description || ''} | ${tmpl.code}`
                  const isSelected = selectedTemplateCode === tmpl.code

                  return (
                    <CommandItem
                      key={tmpl.code}
                      value={cmdValue}
                      onSelect={() => {
                        setSelectedTemplateCode(tmpl.code)
                        setOpen(false)
                      }}
                      className={cn(
                        'text-xs py-2.5 px-3 cursor-pointer rounded-lg transition-colors flex items-start gap-2.5',
                        isSelected ? 'bg-emerald-50 text-emerald-950 font-medium' : 'hover:bg-gray-50'
                      )}
                    >
                      <div className="mt-0.5 shrink-0">
                        <Check
                          className={cn(
                            'h-4 w-4 text-[#1B4D3E]',
                            isSelected ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="font-bold text-gray-900 text-xs truncate">
                            {tmpl.title}
                          </p>
                          <Badge variant="outline" className="text-[9.5px] px-1 py-0 shrink-0 border-gray-200 text-gray-600">
                            {tmpl.bank}
                          </Badge>
                        </div>
                        {tmpl.subtitle && (
                          <p className="text-[10.5px] text-emerald-800 line-clamp-1 mb-0.5">
                            {tmpl.subtitle}
                          </p>
                        )}
                        {tmpl.description && (
                          <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight">
                            {tmpl.description}
                          </p>
                        )}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
