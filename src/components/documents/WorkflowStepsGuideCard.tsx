import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WorkflowGuideStep {
  step: number | string
  title: string
  description: string
}

export interface WorkflowStepsGuideCardProps {
  title: string
  steps: WorkflowGuideStep[]
  icon?: React.ReactNode
  className?: string
}

/**
 * Componente compartilhado didático de orientação operacional da esteira em 4 passos simétricos.
 * Utilizado nas páginas de Declarações Legais, Limite de Crédito e Projetos Técnicos de Crédito.
 */
export function WorkflowStepsGuideCard({
  title,
  steps,
  icon,
  className,
}: WorkflowStepsGuideCardProps) {
  return (
    <div
      className={cn(
        'bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 transition-all',
        className
      )}
    >
      <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-3.5 uppercase tracking-wider flex items-center gap-2">
        {icon || <CheckCircle2 className="h-4 w-4 text-[#1B4D3E] shrink-0" />}
        <span>{title}</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-600">
        {steps.map((item) => (
          <div
            key={String(item.step)}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-start hover:border-slate-300 transition-colors"
          >
            <span className="font-bold text-[#1B4D3E] block mb-1.5 text-xs sm:text-[13px]">
              {item.step}. {item.title}
            </span>
            <p className="text-slate-600 text-xs leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
