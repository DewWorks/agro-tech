'use client'

import React, { useState } from 'react'
import { FileText, ChevronDown, ChevronUp, StickyNote } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DemandDescriptionBlockProps {
  description?: string | null
  notes?: string | null
  className?: string
  charLimit?: number
}

export function DemandDescriptionBlock({
  description,
  notes,
  className,
  charLimit = 150,
}: DemandDescriptionBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const text = description?.trim() || ''
  const isLong = text.length > charLimit

  const displayText = isLong && !isExpanded ? `${text.slice(0, charLimit)}...` : text

  return (
    <div className={cn('space-y-2 mt-2', className)}>
      {/* Bloco de Descrição com borda esquerda sutil */}
      <div className="border-l-2 border-slate-300 pl-3 py-1.5 text-xs text-slate-600 bg-slate-50/70 rounded-r border-y border-r border-slate-100">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold text-slate-700 mr-1.5">Descrição:</span>
            <span>{displayText || 'Nenhuma descrição detalhada informada.'}</span>
            {isLong && (
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="inline-flex items-center gap-0.5 ml-2 text-xs font-bold text-slate-800 hover:text-slate-950 underline cursor-pointer"
              >
                <span>{isExpanded ? 'colapsar' : 'ver mais'}</span>
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bloco de Notas Internas (quando houver) */}
      {notes && (
        <div className="border-l-2 border-amber-400 pl-3 py-1 text-xs text-amber-900 bg-amber-50/60 rounded-r border-y border-r border-amber-100 flex items-center gap-2">
          <StickyNote className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <div className="flex-1 text-[11px] leading-snug">
            <span className="font-bold mr-1">Notas Internas:</span>
            <span className="italic">{notes}</span>
          </div>
        </div>
      )}
    </div>
  )
}
