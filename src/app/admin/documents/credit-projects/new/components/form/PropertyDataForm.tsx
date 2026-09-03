import React from 'react'
import { MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { CustomOptions } from '../../types/wizard-types'

interface PropertyDataFormProps {
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
}

export function PropertyDataForm({ customOptions, setCustomOptions }: PropertyDataFormProps) {
  const isPending = !customOptions.propertyRegistrationNumber?.trim() || 
                    !customOptions.propertyCar?.trim() || 
                    !customOptions.propertyTotalArea || 
                    !customOptions.propertyAccessRoute?.trim() || 
                    !customOptions.propertyActivity?.trim()

  return (
    <div className="p-3 bg-slate-50/80 border border-gray-200 rounded-lg space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-[#1B4D3E]" />
          Dados Fundiários do Imóvel
        </span>
        {isPending ? (
          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Pendências Cadastrais
          </span>
        ) : (
          <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Imóvel Regular
          </span>
        )}
      </div>

      {isPending && (
        <p className="text-[10px] text-amber-800 bg-amber-50/90 p-2 rounded border border-amber-200 leading-tight">
          ⚠️ Preencha os dados fundiários pendentes abaixo para regularizar e emitir o documento oficial:
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Matrícula / Registro *</Label>
          <Input
            value={customOptions.propertyRegistrationNumber}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyRegistrationNumber: e.target.value }))}
            className={cn("h-8 text-xs", !customOptions.propertyRegistrationNumber?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
            placeholder="Ex: 12.345"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Cartório de Registro (CRI)</Label>
          <Input
            value={customOptions.propertyRegistryOffice}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyRegistryOffice: e.target.value }))}
            className="h-8 text-xs"
            placeholder="Ex: CRI de Palmas - TO"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Nº do CAR (Recibo) *</Label>
          <Input
            value={customOptions.propertyCar}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyCar: e.target.value }))}
            className={cn("h-8 text-xs", !customOptions.propertyCar?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
            placeholder="Ex: TO-1700000-XXXXXXXX"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Área Total do Imóvel (ha) *</Label>
          <Input
            type="number"
            value={customOptions.propertyTotalArea || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyTotalArea: Number(e.target.value) }))}
            className={cn("h-8 text-xs", (!customOptions.propertyTotalArea || Number(customOptions.propertyTotalArea) <= 0) && "border-amber-400 focus-visible:ring-amber-400")}
            placeholder="Ex: 1500"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[10.5px] text-gray-600">Atividade Principal do Imóvel *</Label>
        <Input
          value={customOptions.propertyActivity}
          onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyActivity: e.target.value }))}
          className={cn("h-8 text-xs", !customOptions.propertyActivity?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
          placeholder="Ex: Pecuária de Corte e Cria"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-[10.5px] text-gray-600">Roteiro de Acesso à Propriedade *</Label>
        <Input
          value={customOptions.propertyAccessRoute}
          onChange={(e) => setCustomOptions(prev => ({ ...prev, propertyAccessRoute: e.target.value }))}
          className={cn("h-8 text-xs", !customOptions.propertyAccessRoute?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
          placeholder="Ex: Partindo de Palmas pela TO-050 por 45km..."
        />
      </div>
    </div>
  )
}
