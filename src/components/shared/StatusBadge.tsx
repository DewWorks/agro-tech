'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type StatusType = 
  | 'VALID' 
  | 'WARNING' 
  | 'EXPIRED' 
  | 'PENDING' 
  | 'ACTIVE' 
  | 'INACTIVE' 
  | 'DRAFT'

interface StatusBadgeProps {
  status: StatusType | string
  label?: string
  className?: string
  showDot?: boolean
}

const STATUS_CONFIGS: Record<string, { label: string; className: string; dotColor: string }> = {
  VALID: {
    label: 'Válido / Conforme',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
  },
  ACTIVE: {
    label: 'Ativo',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
  },
  WARNING: {
    label: 'Atenção / A Vencer',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    dotColor: 'bg-amber-500',
  },
  PENDING: {
    label: 'Pendente',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    dotColor: 'bg-amber-500',
  },
  EXPIRED: {
    label: 'Vencido / Inconforme',
    className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
    dotColor: 'bg-rose-500',
  },
  INACTIVE: {
    label: 'Inativo',
    className: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
    dotColor: 'bg-slate-400',
  },
  DRAFT: {
    label: 'Rascunho',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    dotColor: 'bg-blue-500',
  },
}

export const StatusBadge = React.memo(function StatusBadge({
  status,
  label,
  className,
  showDot = true,
}: StatusBadgeProps) {
  const config = STATUS_CONFIGS[status.toUpperCase()] || {
    label: status,
    className: 'bg-slate-50 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
  }

  const displayText = label || config.label

  return (
    <Badge
      variant="outline"
      className={cn('inline-flex items-center gap-1.5 font-semibold text-xs px-2.5 py-0.5 pointer-events-none', config.className, className)}
    >
      {showDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
      )}
      <span>{displayText}</span>
    </Badge>
  )
})

StatusBadge.displayName = 'StatusBadge'
