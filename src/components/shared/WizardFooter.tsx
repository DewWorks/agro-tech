'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Save, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WizardFooterProps {
  onBack?: () => void
  onSave?: () => void
  onNext?: () => void
  isFirstStep?: boolean
  isLastStep?: boolean
  isSubmitting?: boolean
  isSaving?: boolean
  disableNext?: boolean
  nextLabel?: string
  backLabel?: string
  saveLabel?: string
  className?: string
}

export const WizardFooter = React.memo(function WizardFooter({
  onBack,
  onSave,
  onNext,
  isFirstStep = false,
  isLastStep = false,
  isSubmitting = false,
  isSaving = false,
  disableNext = false,
  nextLabel = 'Avançar Etapa',
  backLabel = 'Voltar Etapa',
  saveLabel = 'Salvar Alterações',
  className,
}: WizardFooterProps) {
  return (
    <div
      className={cn(
        'w-full flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800 gap-3',
        className
      )}
    >
      <div>
        {!isFirstStep && onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting || isSaving}
            className="flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onSave && (
          <Button
            type="button"
            variant="outline"
            onClick={onSave}
            disabled={isSubmitting || isSaving}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saveLabel}
          </Button>
        )}

        {onNext && (
          <Button
            type="button"
            onClick={onNext}
            disabled={disableNext || isSubmitting || isSaving}
            className="bg-[#1B4D3E] hover:bg-[#13382D] text-white flex items-center gap-2 cursor-pointer shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : isLastStep ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {nextLabel === 'Avançar Etapa' ? 'Concluir Levantamento' : nextLabel}
              </>
            ) : (
              <>
                {nextLabel}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
})

WizardFooter.displayName = 'WizardFooter'
