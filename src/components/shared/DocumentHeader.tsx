'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Landmark } from 'lucide-react'

export interface DocumentHeaderProps {
  title: string
  subtitle?: string
  code?: string
  bank?: string
  organizationName?: string
  className?: string
  showBorder?: boolean
}

export const DocumentHeader = React.memo(function DocumentHeader({
  title,
  subtitle,
  code,
  bank,
  organizationName,
  className,
  showBorder = true,
}: DocumentHeaderProps) {
  return (
    <div
      className={cn(
        'w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4',
        showBorder && 'border-b-2 border-[#1B4D3E]',
        className
      )}
    >
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-extrabold text-[#1B4D3E] tracking-tight uppercase">
            {title}
          </h1>
          {bank && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Landmark className="w-3 h-3" />
              {bank}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {(code || organizationName) && (
        <div className="text-right sm:self-start">
          {code && (
            <span className="text-[11px] font-mono font-semibold text-slate-600 block">
              Ref: {code}
            </span>
          )}
          {organizationName && (
            <span className="text-[10px] text-slate-400 block">
              {organizationName}
            </span>
          )}
        </div>
      )}
    </div>
  )
})

DocumentHeader.displayName = 'DocumentHeader'
