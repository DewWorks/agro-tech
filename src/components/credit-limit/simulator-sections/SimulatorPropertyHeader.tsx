'use client'

import React from 'react'
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Landmark, ExternalLink, Save, Download, Loader2 } from 'lucide-react'
import { SimulatorPropertyHeaderProps } from '@/types/credit-limit.types'

export function SimulatorPropertyHeader({
  propertiesList,
  selectedPropertyId,
  currentProperty,
  onSelectProperty,
  onSave,
  isSaving,
  onOpenPreview,
  isLoadingProperty,
  hasSimulationData,
}: SimulatorPropertyHeaderProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* SELETOR DE PROPRIEDADE */}
      <div className="flex-1 max-w-xl">
        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-emerald-600" />
          Propriedade Rural para Simulação de Limite
        </Label>
        <Select
          value={selectedPropertyId}
          onValueChange={(id) => {
            if (id) onSelectProperty(id)
          }}
        >
          <SelectTrigger className="text-xs h-10 bg-slate-50 dark:bg-slate-800/60 font-semibold truncate text-left">
            <SelectValue placeholder="Selecione um imóvel rural...">
              {currentProperty ? (
                <span className="truncate">
                  <strong className="text-slate-900 dark:text-slate-100">
                    {currentProperty.name || currentProperty.propertyName}
                  </strong>{' '}
                  <span className="text-slate-500 dark:text-slate-400 font-normal">
                    ({currentProperty.producerName || 'Sem produtor'}) -{' '}
                    {Number(currentProperty.totalArea || 0).toFixed(1)} ha
                  </span>
                </span>
              ) : (
                'Selecione uma propriedade...'
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {propertiesList.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-xs py-2">
                <div className="flex flex-col text-left">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {p.name || p.propertyName}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {p.producerName || 'Sem produtor'} • {p.city || 'Sem município'}/{p.state || 'UF'} •{' '}
                    {Number(p.totalArea || 0).toFixed(1)} ha
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* AÇÕES DE CABEÇALHO */}
      <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
        {selectedPropertyId && (
          <Link
            href={`/admin/crm/properties/${selectedPropertyId}/edit`}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-emerald-50"
            title="Abrir cadastro de terras, máquinas e benfeitorias no CRM"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Editar no CRM</span>
          </Link>
        )}

        <Button
          type="button"
          onClick={onSave}
          disabled={isSaving || !hasSimulationData}
          variant="outline"
          className="text-xs h-10 px-3.5 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold gap-1.5"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Salvar Parâmetros</span>
        </Button>

        <Button
          type="button"
          onClick={onOpenPreview}
          disabled={isLoadingProperty || !hasSimulationData}
          className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs h-10 px-4 font-bold gap-1.5 shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Emitir Dossiê Técnico (PDF)</span>
        </Button>
      </div>
    </div>
  )
}
