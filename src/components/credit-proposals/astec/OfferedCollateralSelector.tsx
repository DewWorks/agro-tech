'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ShieldCheck, Info } from 'lucide-react'
import { OfferedCollateralModality } from '@prisma/client'

export interface OfferedCollateralOption {
  value: OfferedCollateralModality
  label: string
  description: string
  legalBasis: string
}

export const COLLATERAL_MODALITY_OPTIONS: OfferedCollateralOption[] = [
  {
    value: 'ALIENACAO_FIDUCIARIA_IMOVEL',
    label: 'Alienação Fiduciária de Imóvel Rural',
    description: 'Transferência resolúvel da propriedade do imóvel ao credor em garantia.',
    legalBasis: 'Lei nº 9.514/1997 / Lei do Agro',
  },
  {
    value: 'HIPOTECA_RURAL_CEDULAR',
    label: 'Hipoteca Rural Cedular (1º Grau)',
    description: 'Garantia real vinculada à Cédula de Crédito Rural sobre a matrícula do imóvel.',
    legalBasis: 'Decreto-Lei nº 167/1967',
  },
  {
    value: 'PENHOR_RURAL',
    label: 'Penhor Rural (Bens, Semoventes ou Safra)',
    description: 'Vínculo formal sobre rebanho bovino, maquinários, grãos ou colheita futura.',
    legalBasis: 'Art. 1.438 do Código Civil',
  },
  {
    value: 'FIANCA_AVALISTA',
    label: 'Fiança / Aval Pessoal',
    description: 'Garantia fidejussória prestada por terceiro idôneo ou cônjuge meeiro.',
    legalBasis: 'Código Civil / MCR 3-2',
  },
  {
    value: 'PATRIMONIO_RURAL_AFETACAO',
    label: 'Patrimônio Rural em Afetação',
    description: 'Segregação de fração de imóvel rural para lastro exclusivo de CIR/CPR.',
    legalBasis: 'Lei nº 13.986/2020 (Lei do Agro)',
  },
  {
    value: 'ANTICRESE',
    label: 'Anticrese',
    description: 'Consignação dos rendimentos e frutos do imóvel rural para abatimento da dívida.',
    legalBasis: 'Art. 1.506 do Código Civil',
  },
]

export interface OfferedCollateralSelectorProps {
  value?: string
  onChange: (val: OfferedCollateralModality) => void
  disabled?: boolean
  className?: string
  label?: string
}

export function OfferedCollateralSelector({
  value,
  onChange,
  disabled = false,
  className,
  label = 'Modalidade Oficial de Garantia (SICOR / MCR)',
}: OfferedCollateralSelectorProps) {
  const selected = COLLATERAL_MODALITY_OPTIONS.find((opt) => opt.value === value)

  return (
    <div className={className}>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#1B4D3E]" />
            {label}
          </Label>
          <span className="text-[10px] text-slate-400 font-medium">Exigência Bancária</span>
        </div>

        <Select
          disabled={disabled}
          value={value || 'ALIENACAO_FIDUCIARIA_IMOVEL'}
          onValueChange={(val) => onChange(val as OfferedCollateralModality)}
        >
          <SelectTrigger className="h-10 text-xs bg-white dark:bg-slate-900 border-slate-300">
            <SelectValue placeholder="Selecione a modalidade de garantia..." />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {COLLATERAL_MODALITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs py-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                  {opt.label}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {opt.description} ({opt.legalBasis})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selected && (
          <p className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Fundamento Legal: <strong>{selected.legalBasis}</strong></span>
          </p>
        )}
      </div>
    </div>
  )
}
