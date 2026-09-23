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
  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200'
  let Icon = Clock

  switch (sla.status) {
    case 'NO_PRAZO':
      badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200'
      Icon = Clock
      break
    case 'ALERTA':
      badgeColor = 'bg-amber-50 text-amber-700 border-amber-200'
      Icon = AlertTriangle
      break
    case 'ATRASADO':
      badgeColor = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
      Icon = ShieldAlert
      break
    case 'CONCLUIDO_NO_PRAZO':
      badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200'
      Icon = CheckCircle2
      break
    case 'CONCLUIDO_COM_ATRASO':
      badgeColor = 'bg-amber-50 text-amber-800 border-amber-300'
      Icon = CheckCircle2
      break
    default:
      badgeColor = 'bg-slate-100 text-slate-600 border-slate-200'
      Icon = Clock
      break
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all duration-200 shadow-xs',
        badgeColor,
        className
      )}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{sla.label}</span>
    </span>
  )
}
