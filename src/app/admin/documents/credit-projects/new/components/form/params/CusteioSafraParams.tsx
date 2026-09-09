import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CustomOptions } from '../../../types/wizard-types'

interface ParamsProps {
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
}

const CUSTEIO_SAFRAS = ['2025/2026', '2026/2027']
const CUSTEIO_CROPS = ['Soja Grão', 'Milho', 'Bovinocultura']

export function CusteioSafraParams({ customOptions, setCustomOptions }: ParamsProps) {
  return (
    <div className="space-y-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
          Parâmetros de Custeio
        </span>
        <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
          Safra & Orçamento
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Ano Safra *</Label>
          <Input
            value={customOptions.custeioSafraYear}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, custeioSafraYear: e.target.value }))}
            className="h-8 text-xs"
            placeholder="Ex: 2026/2027"
          />
          <div className="flex gap-1 pt-0.5">
            {CUSTEIO_SAFRAS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setCustomOptions(prev => ({ ...prev, custeioSafraYear: s }))}
                className="text-[9px] px-1 py-0.2 rounded bg-gray-100 hover:bg-blue-50 text-gray-700 border border-gray-200 cursor-pointer"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Cultura / Atividade *</Label>
          <Input
            value={customOptions.custeioCropName}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, custeioCropName: e.target.value }))}
            className="h-8 text-xs"
            placeholder="Ex: Soja Grão, Milho"
          />
          <div className="flex gap-1 pt-0.5">
            {CUSTEIO_CROPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCustomOptions(prev => ({ ...prev, custeioCropName: c }))}
                className="text-[9px] px-1 py-0.2 rounded bg-gray-100 hover:bg-blue-50 text-gray-700 border border-gray-200 cursor-pointer"
              >
                + {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Área de Plantio (ha) *</Label>
          <Input
            type="number"
            value={customOptions.custeioAreaHa || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, custeioAreaHa: Number(e.target.value) }))}
            className="h-8 text-xs"
            placeholder="Ex: 100"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10.5px] text-gray-600">Custo / ha (R$) *</Label>
          <Input
            type="number"
            value={customOptions.custeioCostPerHa || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, custeioCostPerHa: Number(e.target.value) }))}
            className="h-8 text-xs"
            placeholder="Ex: 3850"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-gray-600">Produtividade (sc/ha) *</Label>
          <Input
            type="number"
            value={customOptions.custeioExpectedYield || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, custeioExpectedYield: Number(e.target.value) }))}
            className="h-8 text-xs"
            placeholder="Ex: 62"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-gray-600">Preço / Saca (R$) *</Label>
          <Input
            type="number"
            value={customOptions.custeioPricePerUnit || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, custeioPricePerUnit: Number(e.target.value) }))}
            className="h-8 text-xs"
            placeholder="Ex: 128"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-gray-600">Juros (% a.a.) *</Label>
          <Input
            type="number"
            step="0.1"
            value={customOptions.custeioInterestRate || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, custeioInterestRate: Number(e.target.value) }))}
            className="h-8 text-xs"
            placeholder="Ex: 8.0"
          />
        </div>
      </div>
    </div>
  )
}
