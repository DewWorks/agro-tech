'use client'

import { Clock, AlertTriangle, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { SlaInfo } from '@/lib/validations/demands'
import { cn } from '@/lib/utils'

export type { SlaInfo }

interface DemandSlaBadgeProps {
  sla: SlaInfo
  className?: string
  showIcon?: boolean
}

export function DemandSlaBadge({ sla, className, showIcon = true }: DemandSlaBadgeProps) {
  let badgeColor = 'bg-slate-50 text-slate-600 border-slate-200'
  let Icon = Clock
  let labelText = sla.label

  if (sla.status === 'CONCLUIDO_NO_PRAZO') {
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200'
    Icon = CheckCircle2
    labelText = sla.label || 'Concluído no Prazo'
  } else if (sla.status === 'CONCLUIDO_COM_ATRASO') {
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-300'
    Icon = CheckCircle2
    labelText = sla.label || `Concluído com ${sla.daysDelayed ?? 0} dia(s) de atraso`
  } else if (sla.daysRemaining === null || sla.daysRemaining === undefined) {
    badgeColor = 'bg-slate-50 text-slate-600 border-slate-200'
    Icon = Clock
    labelText = sla.label || 'Sem Prazo Definido'
  } else if (sla.daysRemaining < 0 || sla.status === 'ATRASADO') {
    badgeColor = 'bg-red-50 text-red-700 border-red-200 font-medium'
    Icon = ShieldAlert
    const delayed = sla.daysDelayed ?? Math.abs(sla.daysRemaining)
    labelText = `Atrasado há ${delayed} dia(s)`
  } else if (sla.daysRemaining >= 0 && sla.daysRemaining <= 7) {
    badgeColor = 'bg-orange-50 text-orange-800 border-orange-300 font-medium'
    Icon = AlertTriangle
    labelText = sla.daysRemaining === 0 ? 'Vence Hoje' : `Vence em ${sla.daysRemaining} dia(s)`
  } else if (sla.daysRemaining > 7 && sla.daysRemaining <= 30) {
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-200 font-medium'
    Icon = AlertTriangle
    labelText = `Vence em ${sla.daysRemaining} dias`
  } else {
    // daysRemaining > 30
    badgeColor = 'bg-slate-50 text-slate-600 border-slate-200'
    Icon = Clock
    labelText = `Prazo: ${sla.daysRemaining} dias`
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all duration-200 shadow-2xs',
        badgeColor,
        className
      )}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{labelText}</span>
    </span>
  )
}
