import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CustomOptions } from '../../types/wizard-types'

interface TemplateParamsFormProps {
  selectedTemplateCode: string
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
}

export function TemplateParamsForm({ selectedTemplateCode, customOptions, setCustomOptions }: TemplateParamsFormProps) {
  return (
    <>
      {selectedTemplateCode === 'LIMITE_CREDITO_BB' && (
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
              Parâmetros Patrimoniais & Finanças
            </span>
            <span className="text-[10px] text-muted-foreground">Ficha Cadastral</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10.5px] text-gray-600">Terra Nua (R$ / ha)</Label>
              <Input
                type="number"
                value={customOptions.estimatedLandValuePerHa || ''}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, estimatedLandValuePerHa: Number(e.target.value) }))}
                className="h-8 text-xs"
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10.5px] text-gray-600">Benfeitorias (R$)</Label>
              <Input
                type="number"
                value={customOptions.improvementsValue || ''}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, improvementsValue: Number(e.target.value) }))}
                className="h-8 text-xs"
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10.5px] text-gray-600">Máquinas (R$)</Label>
              <Input
                type="number"
                value={customOptions.machineryValue || ''}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, machineryValue: Number(e.target.value) }))}
                className="h-8 text-xs"
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10.5px] text-gray-600">Receita Bruta Anual (R$)</Label>
              <Input
                type="number"
                value={customOptions.annualRevenue || ''}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, annualRevenue: Number(e.target.value) }))}
                className="h-8 text-xs"
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10.5px] text-gray-600">Custos / Despesas (R$)</Label>
              <Input
                type="number"
                value={customOptions.annualExpenses || ''}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, annualExpenses: Number(e.target.value) }))}
                className="h-8 text-xs"
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10.5px] text-gray-600">Dívidas SCR / BACEN (R$)</Label>
              <Input
                type="number"
                value={customOptions.existingDebts || ''}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, existingDebts: Number(e.target.value) }))}
                className="h-8 text-xs"
                placeholder="0,00"
              />
            </div>
          </div>
        </div>
      )}

      {selectedTemplateCode === 'PROJETO_INOVAGRO' && (
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
              Parâmetros do InovAgro
            </span>
            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              Investimento Tecnológico
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10.5px] text-gray-700 font-medium">Equipamento / Objeto *</Label>
              <span className={cn(
                "text-[9.5px] font-medium px-1.5 py-0.2 rounded border",
                customOptions.inovagroEquipment?.trim()
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-amber-700 bg-amber-50 border-amber-200 font-bold"
              )}>
                {customOptions.inovagroEquipment?.trim() ? 'Preenchido' : 'Obrigatório'}
              </span>
            </div>
            <Input
              value={customOptions.inovagroEquipment}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroEquipment: e.target.value }))}
              className={cn("h-8 text-xs", !customOptions.inovagroEquipment?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
              placeholder="Selecione abaixo ou digite..."
            />
            <div className="flex flex-wrap gap-1 pt-0.5">
              {[
                'Gerador Solar Fotovoltaico On-Grid',
                'Trator Agrícola com Piloto Automático',
                'Sistema de Irrigação Automatizado',
                'Estação Meteorológica e Sensores'
              ].map((eq) => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => setCustomOptions(prev => ({ ...prev, inovagroEquipment: eq }))}
                  className={cn(
                    "text-[9.5px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer text-left",
                    customOptions.inovagroEquipment === eq
                      ? "bg-emerald-100 text-[#1B4D3E] border-emerald-300 font-semibold"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:text-[#1B4D3E]"
                  )}
                >
                  {eq.split('com')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10.5px] text-gray-600">Especificação Técnica</Label>
            <Input
              value={customOptions.inovagroSpec}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroSpec: e.target.value }))}
              className="h-8 text-xs"
              placeholder="Ex: Módulos Monocristalinos Tier-1 + Inversor"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10.5px] text-gray-600">Potência (kWp)</Label>
              <Input
                type="number"
                value={customOptions.inovagroPower || ''}
                onChange={(e) => {
                  const power = Number(e.target.value)
                  setCustomOptions(prev => ({
                    ...prev,
                    inovagroPower: power,
                    inovagroMonthlySavings: power > 0 ? Math.round(power * 135 * 0.95) : prev.inovagroMonthlySavings
                  }))
                }}
                className="h-8 text-xs"
                placeholder="Ex: 45"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10.5px] text-gray-600">CNAE BNDES</Label>
              <Input
                value={customOptions.inovagroCnae}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroCnae: e.target.value }))}
                className="h-8 text-xs"
                placeholder="Ex: 01.50-1/00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10.5px] font-semibold text-gray-800">Investimento Total (R$)</Label>
              <Input
                type="number"
                value={customOptions.inovagroTotalInvestment || ''}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setCustomOptions(prev => ({
                    ...prev,
                    inovagroTotalInvestment: val,
                    inovagroFinanced: Math.round(val * 0.9),
                    inovagroOwnResources: Math.round(val * 0.1)
                  }))
                }}
                className="h-8 text-xs font-semibold"
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10.5px] text-gray-600">Financiamento (R$)</Label>
              <Input
                type="number"
                value={customOptions.inovagroFinanced || ''}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroFinanced: Number(e.target.value) }))}
                className="h-8 text-xs"
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10.5px] text-gray-600">Recursos Próprios (R$)</Label>
              <Input
                type="number"
                value={customOptions.inovagroOwnResources || ''}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroOwnResources: Number(e.target.value) }))}
                className="h-8 text-xs"
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10.5px] text-gray-600">Economia Mensal (R$)</Label>
              <Input
                type="number"
                value={customOptions.inovagroMonthlySavings || ''}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroMonthlySavings: Number(e.target.value) }))}
                className="h-8 text-xs"
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-medium">Condições Financeiras *</span>
              <button
                type="button"
                onClick={() => setCustomOptions(prev => ({
                  ...prev,
                  inovagroTermYears: 10,
                  inovagroGraceMonths: 24,
                  inovagroInterestRate: 12.5
                }))}
                className="text-[9.5px] text-emerald-700 hover:underline cursor-pointer font-medium"
              >
                Usar padrão (10a / 24m / 12.5%)
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-gray-600">Prazo (anos) *</Label>
                <Input
                  type="number"
                  value={customOptions.inovagroTermYears || ''}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroTermYears: Number(e.target.value) }))}
                  className="h-8 text-xs"
                  placeholder="Ex: 10"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-gray-600">Carência (m)</Label>
                <Input
                  type="number"
                  value={customOptions.inovagroGraceMonths || ''}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroGraceMonths: Number(e.target.value) }))}
                  className="h-8 text-xs"
                  placeholder="Ex: 24"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-gray-600">Juros (% a.a.) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={customOptions.inovagroInterestRate || ''}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, inovagroInterestRate: Number(e.target.value) }))}
                  className="h-8 text-xs"
                  placeholder="Ex: 12.5"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTemplateCode === 'PROJETO_RENOVAGRO' && (
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
              Parâmetros do RenovAgro
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Recuperação Sustentável
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10.5px] text-gray-700 font-medium">Sublinha do Programa *</Label>
              <span className={cn(
                "text-[9.5px] font-medium px-1.5 py-0.2 rounded border",
                customOptions.renovagroSubline?.trim()
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-amber-700 bg-amber-50 border-amber-200 font-bold"
              )}>
                {customOptions.renovagroSubline?.trim() ? 'Preenchido' : 'Obrigatório'}
              </span>
            </div>
            <Input
              value={customOptions.renovagroSubline}
              onChange={(e) => setCustomOptions(prev => ({ ...prev, renovagroSubline: e.target.value }))}
              className={cn("h-8 text-xs", !customOptions.renovagroSubline?.trim() && "border-amber-400 focus-visible:ring-amber-400")}
              placeholder="Selecione abaixo ou digite..."
            />
            <div className="flex flex-wrap gap-1 pt-0.5">
              {[
                'Recuperação de Pastagens Degradadas (MCR 11.7.1.c.I)',
                'Integração Lavoura-Pecuária-Floresta (ILPF)',
                'Sistemas Agroflorestais (SAF)',
                'Manejo de Solo e Água'
              ].map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setCustomOptions(prev => ({ ...prev, renovagroSubline: sub }))}
                  className={cn(
                    "text-[9.5px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer text-left",
                    customOptions.renovagroSubline === sub
                      ? "bg-emerald-100 text-[#1B4D3E] border-emerald-300 font-semibold"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:text-[#1B4D3E]"
                  )}
                >
                  {sub.startsWith('Recuperação') ? 'Recup. de Pastagens' : sub.split('(')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10.5px] text-gray-600">Área a Recuperar (ha) *</Label>
              <Input
                type="number"
                value={customOptions.renovagroAreaHa || ''}
                onChange={(e) => {
                  const area = Number(e.target.value)
                  setCustomOptions(prev => {
                    const cost = prev.renovagroCostPerHa || 3500
                    const total = area * cost
                    return {
                      ...prev,
                      renovagroAreaHa: area,
                      renovagroCostPerHa: cost,
                      renovagroTotalInvestment: total,
                      renovagroFinanced: Math.round(total * 0.9),
                      renovagroOwnResources: Math.round(total * 0.1)
                    }
                  })
                }}
                className="h-8 text-xs"
                placeholder="Ex: 50"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10.5px] text-gray-600">Custo / ha (R$) *</Label>
              <Input
                type="number"
                value={customOptions.renovagroCostPerHa || ''}
                onChange={(e) => {
                  const cost = Number(e.target.value)
                  setCustomOptions(prev => {
                    const total = prev.renovagroAreaHa * cost
                    return {
                      ...prev,
                      renovagroCostPerHa: cost,
                      renovagroTotalInvestment: total,
                      renovagroFinanced: Math.round(total * 0.9),
                      renovagroOwnResources: Math.round(total * 0.1)
                    }
                  })
                }}
                className="h-8 text-xs"
                placeholder="Ex: 3500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10.5px] font-semibold text-gray-800">Investimento Total (R$) *</Label>
              <Input
                type="number"
                value={customOptions.renovagroTotalInvestment || ''}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setCustomOptions(prev => ({
                    ...prev,
                    renovagroTotalInvestment: val,
                    renovagroFinanced: Math.round(val * 0.9),
                    renovagroOwnResources: Math.round(val * 0.1)
                  }))
                }}
                className="h-8 text-xs font-semibold"
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10.5px] text-gray-600">Financiamento (R$) *</Label>
              <Input
                type="number"
                value={customOptions.renovagroFinanced || ''}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, renovagroFinanced: Number(e.target.value) }))}
                className="h-8 text-xs"
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-medium">Condições Financeiras *</span>
              <button
                type="button"
                onClick={() => setCustomOptions(prev => ({
                  ...prev,
                  renovagroTermYears: 8,
                  renovagroGraceMonths: 24,
                  renovagroInterestRate: 10.5
                }))}
                className="text-[9.5px] text-emerald-700 hover:underline cursor-pointer font-medium"
              >
                Usar padrão (8a / 24m / 10.5%)
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-gray-600">Prazo (anos) *</Label>
                <Input
                  type="number"
                  value={customOptions.renovagroTermYears || ''}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, renovagroTermYears: Number(e.target.value) }))}
                  className="h-8 text-xs"
                  placeholder="Ex: 8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-gray-600">Carência (m)</Label>
                <Input
                  type="number"
                  value={customOptions.renovagroGraceMonths || ''}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, renovagroGraceMonths: Number(e.target.value) }))}
                  className="h-8 text-xs"
                  placeholder="Ex: 24"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-gray-600">Juros (% a.a.) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={customOptions.renovagroInterestRate || ''}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, renovagroInterestRate: Number(e.target.value) }))}
                  className="h-8 text-xs"
                  placeholder="Ex: 10.5"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTemplateCode === 'PROJETO_CUSTEIO_SAFRA' && (
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
                {['2025/2026', '2026/2027'].map((s) => (
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
                {['Soja Grão', 'Milho', 'Bovinocultura'].map((c) => (
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
      )}

      {selectedTemplateCode === 'CHECKLIST_PROFISSIONAL' && (
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
              Parâmetros do Atendimento
            </span>
            <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
              Esteira & Dossiê
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10.5px] text-gray-600">Instituição Financeira</Label>
              <Input
                value={customOptions.targetBank}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, targetBank: e.target.value }))}
                className="h-8 text-xs"
                placeholder="Banco do Brasil"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10.5px] text-gray-600">Finalidade Principal</Label>
              <Input
                value={customOptions.purpose}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, purpose: e.target.value }))}
                className="h-8 text-xs"
                placeholder="Custeio / Investimento"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
