import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CustomOptions } from '../../../types/wizard-types'

interface ParamsProps {
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
}

const CUSTEIO_SAFRAS = ['2025/2026', '2026/2027']
const CUSTEIO_GRAOS_CROPS = ['Soja Grão', 'Milho Safrinha', 'Sorgo', 'Trigo', 'Arroz Irrigado']
const CUSTEIO_PECUARIA_ITEMS = ['Bovinocultura de Corte', 'Recria e Engorda (Macho)', 'Recria de Novilhas (Fêmea)', 'Bovinocultura de Leite']

export function CusteioSafraParams({ customOptions, setCustomOptions }: ParamsProps) {
  const isPecuaria =
    customOptions.custeioActivityType === 'PECUARIA' ||
    customOptions.custeioCropName?.toLowerCase().includes('bovino') ||
    customOptions.custeioCropName?.toLowerCase().includes('pecu') ||
    customOptions.custeioCropName?.toLowerCase().includes('gado') ||
    customOptions.custeioCropName?.toLowerCase().includes('recria')

  const pecuariaModality = customOptions.custeioPecuariaModality || 'AQUISICAO_ANIMAIS'

  // Cálculos reativos
  const areaOrQty = Number(isPecuaria ? (customOptions.custeioQuantity || customOptions.custeioAreaHa || 0) : (customOptions.custeioAreaHa || 0))
  const costOrPrice = Number(isPecuaria ? (customOptions.custeioUnitPrice || customOptions.custeioCostPerHa || 0) : (customOptions.custeioCostPerHa || 0))
  const totalFinanced = Math.round(areaOrQty * costOrPrice * 100) / 100

  const yieldOrWeight = Number(customOptions.custeioExpectedYield || 0)
  const unitSellingPrice = Number(customOptions.custeioPricePerUnit || 0)
  const totalGrossRevenue = isPecuaria
    ? Math.round(areaOrQty * unitSellingPrice * 100) / 100
    : Math.round(areaOrQty * yieldOrWeight * unitSellingPrice * 100) / 100

  const netMargin = Math.round((totalGrossRevenue - totalFinanced) * 100) / 100

  const isSafraPending = !customOptions.custeioSafraYear?.trim()
  const isCropPending = !customOptions.custeioCropName?.trim()
  const isQtyPending = !areaOrQty || areaOrQty <= 0
  const isCostPending = !costOrPrice || costOrPrice <= 0
  const isYieldPending = !yieldOrWeight || yieldOrWeight <= 0
  const isSellingPricePending = !unitSellingPrice || unitSellingPrice <= 0
  const isInterestPending = !customOptions.custeioInterestRate || Number(customOptions.custeioInterestRate) <= 0

  return (
    <div className="space-y-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
          Parâmetros de Custeio Agrícola e Pecuário
        </span>
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
          <button
            type="button"
            onClick={() => {
              setCustomOptions(prev => ({
                ...prev,
                custeioActivityType: 'AGRICOLA',
                custeioCropName: prev.custeioCropName || 'Soja Grão',
                custeioCostPerHa: prev.custeioCostPerHa || 3850,
                custeioExpectedYield: prev.custeioExpectedYield || 62,
                custeioPricePerUnit: prev.custeioPricePerUnit || 128
              }))
            }}
            className={cn(
              "text-[9.5px] px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer",
              !isPecuaria
                ? "bg-emerald-700 text-white shadow-2xs"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            Agrícola (Grãos)
          </button>
          <button
            type="button"
            onClick={() => {
              setCustomOptions(prev => ({
                ...prev,
                custeioActivityType: 'PECUARIA',
                custeioCropName: 'Bovinocultura de Corte (Recria e Engorda)',
                custeioQuantity: prev.custeioQuantity || prev.custeioAreaHa || 100,
                custeioUnitPrice: prev.custeioUnitPrice || 2800,
                custeioAreaHa: prev.custeioQuantity || prev.custeioAreaHa || 100,
                custeioCostPerHa: prev.custeioUnitPrice || 2800,
                custeioExpectedYield: 1,
                custeioPricePerUnit: prev.custeioPricePerUnit || 3600
              }))
            }}
            className={cn(
              "text-[9.5px] px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer",
              isPecuaria
                ? "bg-blue-700 text-white shadow-2xs"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            Pecuária
          </button>
        </div>
      </div>

      {/* Se for pecuária, permite chavear entre Aquisição de Animais e Custeio da Produção */}
      {isPecuaria && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-2 space-y-1.5">
          <Label className="text-[10px] text-blue-900 font-semibold block">
            Submodalidade do Custeio Pecuário (MCR)
          </Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setCustomOptions(prev => ({
                  ...prev,
                  custeioPecuariaModality: 'AQUISICAO_ANIMAIS',
                  custeioCropName: 'Aquisição de Bovinos para Recria/Engorda'
                }))
              }}
              className={cn(
                "text-[9.5px] px-2 py-1 rounded border font-medium flex-1 text-left transition-colors cursor-pointer",
                pecuariaModality === 'AQUISICAO_ANIMAIS'
                  ? "bg-blue-700 text-white border-blue-800 font-semibold"
                  : "bg-white text-blue-900 border-blue-200 hover:bg-blue-100"
              )}
            >
              1. Aquisição de Animais (Recria/Engorda)
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomOptions(prev => ({
                  ...prev,
                  custeioPecuariaModality: 'CUSTEIO_PRODUCAO',
                  custeioCropName: 'Manejo, Pastagem e Nutrição Pecuária'
                }))
              }}
              className={cn(
                "text-[9.5px] px-2 py-1 rounded border font-medium flex-1 text-left transition-colors cursor-pointer",
                pecuariaModality === 'CUSTEIO_PRODUCAO'
                  ? "bg-blue-700 text-white border-blue-800 font-semibold"
                  : "bg-white text-blue-900 border-blue-200 hover:bg-blue-100"
              )}
            >
              2. Custeio da Produção (Manejo/Nutrição)
            </button>
          </div>
        </div>
      )}

      {/* Ano Safra e Cultura */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10.5px] text-gray-600">Ano Safra / Ciclo *</Label>
            <span
              className={cn(
                "text-[9.5px] font-medium px-1.5 py-0.2 rounded border transition-colors",
                !isSafraPending
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-amber-700 bg-amber-50 border-amber-200 font-bold"
              )}
            >
              {!isSafraPending ? 'Preenchido' : 'Obrigatório'}
            </span>
          </div>
          <Input
            id="field-custeio-year"
            value={customOptions.custeioSafraYear}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, custeioSafraYear: e.target.value }))}
            className={cn(
              "h-8 text-xs transition-colors",
              isSafraPending
                ? "border-amber-400 bg-amber-50/20 focus-visible:ring-amber-400 focus:border-amber-500"
                : "border-gray-200 bg-white focus-visible:ring-emerald-500"
            )}
            placeholder="Ex: 2026/2027"
          />
          <div className="flex gap-1 pt-0.5">
            {CUSTEIO_SAFRAS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setCustomOptions(prev => ({ ...prev, custeioSafraYear: s }))}
                className="text-[9px] px-1 py-0.2 rounded bg-gray-100 hover:bg-emerald-50 text-gray-700 border border-gray-200 cursor-pointer"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10.5px] text-gray-600">
              {isPecuaria ? 'Finalidade / Categoria Animal *' : 'Cultura / Atividade *'}
            </Label>
            <span
              className={cn(
                "text-[9.5px] font-medium px-1.5 py-0.2 rounded border transition-colors",
                !isCropPending
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-amber-700 bg-amber-50 border-amber-200 font-bold"
              )}
            >
              {!isCropPending ? 'Preenchido' : 'Obrigatório'}
            </span>
          </div>
          <Input
            id="field-custeio-crop"
            value={customOptions.custeioCropName}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, custeioCropName: e.target.value }))}
            className={cn(
              "h-8 text-xs transition-colors",
              isCropPending
                ? "border-amber-400 bg-amber-50/20 focus-visible:ring-amber-400 focus:border-amber-500"
                : "border-gray-200 bg-white focus-visible:ring-emerald-500"
            )}
            placeholder={isPecuaria ? 'Ex: Bovinocultura de Corte' : 'Ex: Soja Grão, Milho'}
          />
          <div className="flex flex-wrap gap-1 pt-0.5">
            {(isPecuaria ? CUSTEIO_PECUARIA_ITEMS : CUSTEIO_GRAOS_CROPS).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCustomOptions(prev => ({ ...prev, custeioCropName: c }))}
                className="text-[9px] px-1 py-0.2 rounded bg-gray-100 hover:bg-emerald-50 text-gray-700 border border-gray-200 cursor-pointer"
              >
                {c.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Linha Oficial Ativa */}
      {customOptions.creditLineName && (
        <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/80 px-2.5 py-1.5 rounded-lg text-xs">
          <span className="text-gray-600 font-medium text-[11px]">Linha Oficial Vinculada:</span>
          <span className="font-bold text-emerald-800 text-[11px] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            {customOptions.creditLineName} ({customOptions.custeioInterestRate || 8}% a.a.)
          </span>
        </div>
      )}

      {/* Inputs com Terminologia Alternada Dinamicamente */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10.5px] text-gray-700 font-semibold">
              {isPecuaria
                ? pecuariaModality === 'AQUISICAO_ANIMAIS'
                  ? 'Quantidade de Cabeças para Aquisição (cab) *'
                  : 'Rebanho em Manejo / Nutrição (cab) *'
                : 'Área de Plantio / Explorada (ha) *'}
            </Label>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "text-[9.5px] font-medium px-1.5 py-0.2 rounded border transition-colors",
                  !isQtyPending
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-amber-700 bg-amber-50 border-amber-200 font-bold"
                )}
              >
                {!isQtyPending ? 'Preenchido' : 'Obrigatório'}
              </span>
              <span className="text-[9px] text-gray-400 font-normal">
                {isPecuaria
                  ? pecuariaModality === 'AQUISICAO_ANIMAIS'
                    ? 'Recria / Engorda'
                    : 'Manejo / Nutrição'
                  : 'Hectares (ha)'}
              </span>
            </div>
          </div>
          <Input
            id="field-custeio-qty"
            type="number"
            value={areaOrQty || ''}
            onChange={(e) => {
              const val = Number(e.target.value)
              setCustomOptions(prev => ({
                ...prev,
                custeioAreaHa: val,
                custeioQuantity: val
              }))
            }}
            className={cn(
              "h-8 text-xs font-semibold transition-colors",
              isQtyPending
                ? "border-amber-400 bg-amber-50/20 focus-visible:ring-amber-400 focus:border-amber-500"
                : "border-gray-200 bg-white focus-visible:ring-emerald-500"
            )}
            placeholder={isPecuaria ? (pecuariaModality === 'AQUISICAO_ANIMAIS' ? "Ex: 150" : "Ex: 200") : "Ex: 100"}
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10.5px] text-gray-700 font-semibold">
              {isPecuaria
                ? pecuariaModality === 'AQUISICAO_ANIMAIS'
                  ? 'Valor Médio por Cabeça (R$/cab) *'
                  : 'Custo de Manejo / Cabeça (R$/cab) *'
                : 'Custo por Hectare Financiado (R$/ha) *'}
            </Label>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "text-[9.5px] font-medium px-1.5 py-0.2 rounded border transition-colors",
                  !isCostPending
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-amber-700 bg-amber-50 border-amber-200 font-bold"
                )}
              >
                {!isCostPending ? 'Preenchido' : 'Obrigatório'}
              </span>
              <span className="text-[9px] text-gray-400 font-normal">
                {isPecuaria ? 'R$ por cabeça' : 'R$ por hectare'}
              </span>
            </div>
          </div>
          <Input
            id="field-custeio-cost"
            type="number"
            value={costOrPrice || ''}
            onChange={(e) => {
              const val = Number(e.target.value)
              setCustomOptions(prev => ({
                ...prev,
                custeioCostPerHa: val,
                custeioUnitPrice: val
              }))
            }}
            className={cn(
              "h-8 text-xs font-semibold transition-colors",
              isCostPending
                ? "border-amber-400 bg-amber-50/20 focus-visible:ring-amber-400 focus:border-amber-500"
                : "border-gray-200 bg-white focus-visible:ring-emerald-500"
            )}
            placeholder={isPecuaria ? (pecuariaModality === 'AQUISICAO_ANIMAIS' ? "Ex: 2800" : "Ex: 650") : "Ex: 3850"}
          />
        </div>
      </div>

      {/* Métricas de Receita e Taxa de Juros */}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-gray-600">
            {isPecuaria ? 'Fator Produtivo (Unidade) *' : 'Produtividade (sc/ha) *'}
          </Label>
          <Input
            id="field-custeio-yield"
            type="number"
            value={yieldOrWeight || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, custeioExpectedYield: Number(e.target.value) }))}
            className={cn(
              "h-8 text-xs transition-colors",
              isYieldPending
                ? "border-amber-400 bg-amber-50/20 focus-visible:ring-amber-400 focus:border-amber-500"
                : "border-gray-200 bg-white focus-visible:ring-emerald-500"
            )}
            placeholder={isPecuaria ? "Ex: 1" : "Ex: 62"}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-gray-600">
            {isPecuaria ? 'Preço Venda Final (R$/cab) *' : 'Preço / Saca (R$) *'}
          </Label>
          <Input
            id="field-custeio-selling-price"
            type="number"
            value={unitSellingPrice || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, custeioPricePerUnit: Number(e.target.value) }))}
            className={cn(
              "h-8 text-xs transition-colors",
              isSellingPricePending
                ? "border-amber-400 bg-amber-50/20 focus-visible:ring-amber-400 focus:border-amber-500"
                : "border-gray-200 bg-white focus-visible:ring-emerald-500"
            )}
            placeholder={isPecuaria ? "Ex: 3600" : "Ex: 128"}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-gray-600">Juros (% a.a.) *</Label>
          <Input
            id="field-custeio-interest"
            type="number"
            step="0.1"
            value={customOptions.custeioInterestRate || ''}
            onChange={(e) => setCustomOptions(prev => ({ ...prev, custeioInterestRate: Number(e.target.value) }))}
            className={cn(
              "h-8 text-xs transition-colors",
              isInterestPending
                ? "border-amber-400 bg-amber-50/20 focus-visible:ring-amber-400 focus:border-amber-500"
                : "border-gray-200 bg-white focus-visible:ring-emerald-500"
            )}
            placeholder="Ex: 8.0"
          />
        </div>
      </div>

      {/* Painel Reativo de Fechamento de Custeio */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 grid grid-cols-3 gap-2 text-center">
        <div>
          <span className="text-[9.5px] text-gray-500 block">Total Financiado</span>
          <span className="text-xs font-bold text-gray-900 block">
            R$ {totalFinanced.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-[9.5px] text-gray-500 block">Receita Bruta Est.</span>
          <span className="text-xs font-bold text-emerald-700 block">
            R$ {totalGrossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-[9.5px] text-gray-500 block">Margem Líquida</span>
          <span className={cn(
            "text-xs font-bold block",
            netMargin >= 0 ? "text-emerald-800" : "text-red-700"
          )}>
            R$ {netMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  )
}
