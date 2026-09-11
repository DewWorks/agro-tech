'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TimePoint } from '@/actions/owner-dashboard';
import { TrendingUp, FileCheck } from 'lucide-react';

interface EmissionsChartProps {
  data: TimePoint[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-sm font-bold text-[#1B4D3E] mt-1 flex items-center gap-1.5">
          <FileCheck className="h-4 w-4" />
          {payload[0].value} {payload[0].value === 1 ? 'documento emitido' : 'documentos emitidos'}
        </p>
      </div>
    );
  }
  return null;
};

export default function EmissionsChart({ data }: EmissionsChartProps) {
  const totalEmissionsPeriod = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900">Volume de Emissões Diárias</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <TrendingUp className="h-3 w-3" />
              Últimos 30 dias
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Evolução temporal das emissões de projetos de crédito e declarações
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-[#1B4D3E]">{totalEmissionsPeriod}</span>
          <span className="text-xs text-gray-500 block">no período</span>
        </div>
      </div>

      <div className="h-[280px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="emissionsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1B4D3E" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#1B4D3E" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis
              dataKey="formattedDate"
              stroke="#9CA3AF"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={8}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#1B4D3E"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#emissionsGradient)"
              activeDot={{ r: 6, fill: '#1B4D3E', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
