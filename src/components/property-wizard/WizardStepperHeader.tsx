'use client'

import React from 'react'
import { Check, LandPlot, Tractor, Warehouse, Landmark, FileCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WizardStepperHeaderProps {
  currentStep: number
  onStepClick: (step: number) => void
  highestVisitedStep: number
  isEditMode?: boolean
}

const STEPS = [
  {
    step: 1,
    title: 'Dados Fundiários',
    description: 'Matrícula, CAR, Áreas e VTN',
    icon: LandPlot,
  },
  {
    step: 2,
    title: 'Máquinas & Veículos',
    description: 'Chassi, Valor e Penhor',
    icon: Tractor,
  },
  {
    step: 3,
    title: 'Benfeitorias & Rebanho',
    description: 'Tabela BB e Zootecnia',
    icon: Warehouse,
  },
  {
    step: 4,
    title: 'Resumo Financeiro',
    description: 'Patrimônio e Capacidade',
    icon: Landmark,
  },
  {
    step: 5,
    title: 'Dossiê & Emissão',
    description: 'Conferência A4 e Envio',
    icon: FileCheck,
  },
]

export function WizardStepperHeader({
  currentStep,
  onStepClick,
  highestVisitedStep,
  isEditMode = false,
}: WizardStepperHeaderProps) {
  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs mb-6">
      {/* Barra de Progresso Superior */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Etapa {currentStep} de {STEPS.length}
          </span>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {STEPS[currentStep - 1]?.title}
          </h2>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {Math.round(progressPercent)}% Concluído
          </span>
          <div className="w-32 sm:w-48 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
            <div
              className="bg-emerald-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid de Steps */}
      <div className="grid grid-cols-5 gap-2 sm:gap-4 relative pt-2">
        {STEPS.map((s) => {
          const Icon = s.icon
          const isCurrent = s.step === currentStep
          const isCompleted = s.step < currentStep
          const isAccessible = isEditMode || s.step <= highestVisitedStep

          return (
            <button
              key={s.step}
              type="button"
              disabled={!isAccessible}
              onClick={() => onStepClick(s.step)}
              className={cn(
                'flex flex-col items-center text-center p-2 rounded-lg transition-all text-xs sm:text-sm group focus:outline-hidden',
                isAccessible ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60' : 'cursor-not-allowed opacity-50',
                isCurrent && 'bg-emerald-50/70 dark:bg-emerald-950/30 ring-1 ring-emerald-500/30'
              )}
            >
              {/* Círculo do Ícone */}
              <div
                className={cn(
                  'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1.5 transition-all shadow-xs',
                  isCompleted && 'bg-emerald-600 text-white shadow-emerald-500/20',
                  isCurrent && 'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-900/50 shadow-emerald-500/30',
                  !isCompleted && !isCurrent && 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </div>

              {/* Títulos */}
              <span
                className={cn(
                  'font-medium line-clamp-1',
                  isCurrent && 'text-emerald-700 dark:text-emerald-300 font-bold',
                  isCompleted && 'text-slate-700 dark:text-slate-300',
                  !isCompleted && !isCurrent && 'text-slate-700 dark:text-slate-200'
                )}
              >
                {s.step}. {s.title}
              </span>
              <span className="hidden md:block text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                {s.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
