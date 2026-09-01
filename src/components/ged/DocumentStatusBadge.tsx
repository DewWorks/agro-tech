'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2, AlertTriangle, XCircle, MinusCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  type DocumentStatus,
  STATUS_CONFIG,
  calculateDocumentStatus,
  getExpirationText,
} from '@/lib/ged/semaphore'

interface DocumentStatusBadgeProps {
  expirationDate: Date | string | null | undefined
  documentType?: string
  showTooltip?: boolean
}

const ICON_MAP = {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MinusCircle,
}

export default function DocumentStatusBadge({
  expirationDate,
  documentType,
  showTooltip = true,
}: DocumentStatusBadgeProps) {
  const parsedDate = expirationDate ? new Date(expirationDate) : null
  const status = calculateDocumentStatus(parsedDate, documentType)
  const config = STATUS_CONFIG[status]
  const IconComponent = ICON_MAP[config.icon as keyof typeof ICON_MAP]

  const badge = (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap"
      style={{
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      <IconComponent size={14} />
      {config.label}
    </span>
  )

  if (!showTooltip) return badge

  const tooltipText = parsedDate
    ? `${getExpirationText(parsedDate)} — ${format(parsedDate, "dd/MM/yyyy", { locale: ptBR })}`
    : 'Este documento não possui data de validade'

  return (
    <Tooltip>
      <TooltipTrigger>
        {badge}
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  )
}
