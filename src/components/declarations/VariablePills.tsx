'use client'

interface VariablePillsProps {
  resolvedVariables: Record<string, string | number>
}

export function VariablePills({ resolvedVariables }: VariablePillsProps) {
  const entries = Object.entries(resolvedVariables).filter(([key]) => key !== 'DATA_EXTENSO' && key !== 'DATA_CURTA' && !key.startsWith('_'))
  
  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-6 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="w-full text-xs font-semibold text-slate-500 mb-2">Variáveis Substituídas:</div>
      {entries.map(([key, value]) => (
        <span key={key} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="opacity-70 mr-1">{`{{${key}}}`}</span>
          <span>&rarr;</span>
          <span className="font-semibold ml-1">{value}</span>
        </span>
      ))}
    </div>
  )
}
