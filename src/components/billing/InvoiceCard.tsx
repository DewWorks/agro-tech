'use client'

import { FileText, ExternalLink, QrCode, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { PixCopyButton } from './PixCopyButton'
import type { SerializedInvoice } from '@/lib/billing/invoice-helpers'

interface InvoiceCardProps {
  invoice: SerializedInvoice
}

export function InvoiceCard({ invoice }: InvoiceCardProps) {
  const formattedDueDate = new Date(invoice.dueDate).toLocaleDateString('pt-BR')
  const formattedPaidAt = invoice.paidAt
    ? new Date(invoice.paidAt).toLocaleDateString('pt-BR')
    : null

  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(invoice.amount)

  const paymentUrl = invoice.bankSlipUrl || invoice.invoiceUrl

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20 gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Quitada
          </Badge>
        )
      case 'OVERDUE':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Em Atraso
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            A Vencer
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Card className="border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 text-base">{formattedAmount}</span>
            {getStatusBadge(invoice.status)}
          </div>
          <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
            <span>Vencimento: <strong className="text-slate-700">{formattedDueDate}</strong></span>
            {formattedPaidAt && (
              <span>Pago em: <strong className="text-emerald-700">{formattedPaidAt}</strong></span>
            )}
            {invoice.invoiceNumber && (
              <span>Nº: {invoice.invoiceNumber}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {invoice.status !== 'RECEIVED' && invoice.pixQrCodePayload && (
            <PixCopyButton payload={invoice.pixQrCodePayload} size="sm" />
          )}

          {paymentUrl && (
            <a
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'gap-1.5 text-xs inline-flex items-center',
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Boleto / Detalhes</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
