import React from 'react'
import { Sparkles, Check, AlertTriangle, LucideIcon, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepMeta {
  num: number
  title: string
  subtitle: string
  icon: LucideIcon
  pending: boolean
}

interface CreditStepperHeaderProps {
  currentTemplate?: {
    code: string
    title: string
    category?: string
    bank?: string
    type?: string
  }
  currentStep: number
  totalSteps: number
  isFormValid: boolean
  validationErrors: string[]
  stepsMeta: StepMeta[]
  onStepClick: (stepNum: number) => void
  isLimiteCredito: boolean
  hasParamsStep: boolean
}

export function CreditStepperHeader({
  currentTemplate,
  currentStep,
  totalSteps,
  isFormValid,
  validationErrors,
  stepsMeta,
  onStepClick,
  isLimiteCredito,
  hasParamsStep,
}: CreditStepperHeaderProps) {
  return (
    <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[#1B4D3E]">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900">
              {currentTemplate?.type === 'LEGAL' ? 'Passo a Passo da Declaração' : 'Passo a Passo do Projeto de Crédito'}
            </span>
            {currentTemplate && (
              <span className="text-xs font-semibold text-[#1B4D3E] mt-0.5 inline-flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span>{currentTemplate.title}</span>
                {currentTemplate.category && (
                  <span className="ml-1.5 text-[10px] text-muted-foreground font-medium">({currentTemplate.bank || 'BB'})</span>
                )}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            • Etapa {currentStep} de {totalSteps}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1.5",
            isFormValid 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-amber-50 text-amber-800 border-amber-200"
          )}>
            {isFormValid ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Pronto para Emissão Oficial
              </>
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                {validationErrors.length} pendência(s) cadastral(is)
              </>
            )}
          </span>
        </div>
      </div>

      <div className={cn(
        "grid gap-2",
        isLimiteCredito 
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" 
          : hasParamsStep 
            ? "grid-cols-2 sm:grid-cols-4" 
            : "grid-cols-3"
      )}>
        {stepsMeta.map((s) => {
          const Icon = s.icon
          const isActive = currentStep === s.num
          const isCompleted = currentStep > s.num && !s.pending && s.num !== stepsMeta[stepsMeta.length - 1].num
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => onStepClick(s.num)}
              className={cn(
                "flex items-center gap-2.5 p-3 rounded-xl text-left transition-all cursor-pointer border relative text-xs",
                isActive 
                  ? "bg-[#1B4D3E] text-white border-[#1B4D3E] shadow-sm font-semibold" 
                  : isCompleted
                    ? "bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-100/60"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50/80"
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                isActive 
                  ? "bg-white/20 text-white" 
                  : isCompleted 
                    ? "bg-emerald-200/70 text-emerald-800" 
                    : "bg-gray-100 text-gray-500"
              )}>
                {isCompleted && !isActive ? (
                  <Check className="h-4 w-4 text-emerald-700" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <div className="truncate min-w-0">
                <div className="font-bold truncate text-[11.5px] leading-tight">
                  {s.title}
                </div>
                <div className={cn(
                  "text-[10px] truncate leading-tight mt-0.5",
                  isActive ? "text-white/80" : "text-muted-foreground"
                )}>
                  {s.subtitle}
                </div>
              </div>
              {s.pending && !isActive && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500" title="Pendências nesta etapa" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
