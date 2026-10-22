'use client'

import React, { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { HardDrive, Layers, Sparkles } from 'lucide-react'
import type { StorageCategoryItem } from '@/actions/home-dashboard'

interface GedStorageDistributionChartProps {
  storageBreakdown?: StorageCategoryItem[]
  totalBytes: number
  formattedUsed: string
  limitFormatted: string
  percentage: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: StorageCategoryItem
  }>
}

const StorageCustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload
    return (
      <div className="rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-lg backdrop-blur-xs text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="truncate max-w-[180px]">{item.label}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-600 font-mono pt-1 border-t border-slate-100">
          <span>{item.formattedBytes}</span>
          <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
            {item.percentage}%
          </span>
        </div>
        <p className="text-[10px] text-slate-400">
          {item.count} {item.count === 1 ? 'arquivo indexado' : 'arquivos indexados'}
        </p>
      </div>
    )
  }
  return null
}

export function GedStorageDistributionChart({
  storageBreakdown = [],
  totalBytes,
  formattedUsed,
  limitFormatted,
  percentage,
}: GedStorageDistributionChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Top categorias para exibir na legenda
  const topCategories = storageBreakdown.slice(0, 4)
  const otherCategories = storageBreakdown.slice(4)
  const othersTotalBytes = otherCategories.reduce((acc, curr) => acc + curr.bytes, 0)
  const othersTotalCount = otherCategories.reduce((acc, curr) => acc + curr.count, 0)

  const chartData = [...topCategories]
  if (otherCategories.length > 0 && othersTotalBytes > 0) {
    chartData.push({
      name: 'OUTROS_AGRUPADOS',
      label: 'Demais Categorias',
      bytes: othersTotalBytes,
      formattedBytes: `${(othersTotalBytes / (1024 * 1024)).toFixed(1)} MB`,
      count: othersTotalCount,
      percentage: totalBytes > 0 ? Number(((othersTotalBytes / totalBytes) * 100).toFixed(1)) : 0,
      color: '#5F6873',
    })
  }

  if (storageBreakdown.length === 0 || totalBytes === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600">
          <HardDrive className="w-3.5 h-3.5 text-slate-400" />
          <span>Distribuição de Nuvem</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Nenhum arquivo armazenado nesta filial para gerar o gráfico de distribuição.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Layers className="w-3.5 h-3.5 text-[#05964F]" />
          <span>Distribuição por Categoria de Arquivo</span>
        </div>
        <span className="text-[10px] font-semibold text-[#05964F] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
          {storageBreakdown.length} {storageBreakdown.length === 1 ? 'tipo' : 'tipos'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Gráfico Donut */}
        <div className="sm:col-span-5 h-[120px] w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<StorageCustomTooltip />} />
              <Pie
                data={chartData}
                dataKey="bytes"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={48}
                paddingAngle={3}
                animationDuration={600}
                onMouseEnter={(_, index) => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}-${index}`}
                    fill={entry.color}
                    opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.6}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    className="transition-opacity duration-200 cursor-pointer"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[11px] font-black text-slate-900 leading-none">
              {percentage}%
            </span>
            <span className="text-[9px] text-slate-400 font-medium scale-90">cota</span>
          </div>
        </div>

        {/* Legenda compacta das categorias */}
        <div className="sm:col-span-7 space-y-1.5">
          {chartData.slice(0, 4).map((cat) => (
            <div
              key={cat.name}
              className="flex items-center justify-between text-[11px] gap-2 py-0.5 px-1.5 rounded-md hover:bg-slate-100/70 transition-colors"
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="truncate text-slate-700 font-medium" title={cat.label}>
                  {cat.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-slate-900 font-mono text-[10px]">
                <span className="font-bold">{cat.formattedBytes}</span>
                <span className="text-slate-400">({cat.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GedStorageDistributionChart
