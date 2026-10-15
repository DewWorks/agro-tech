'use client'

import { AlertTriangle, ExternalLink, QrCode } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PixCopyButton } from './PixCopyButton'
import type { SerializedInvoice } from '@/lib/billing/invoice-helpers'

interface OverdueBannerProps {
  dueDate: string
  daysRemaining: number
  invoice: SerializedInvoice | null
}

export default function OverdueBanner({ dueDate, daysRemaining, invoice }: OverdueBannerProps) {
  const formattedDueDate = new Date(dueDate).toLocaleDateString('pt-BR')
  const graceDate = new Date(dueDate)
  graceDate.setDate(graceDate.getDate() + 15)
  const formattedGraceDate = graceDate.toLocaleDateString('pt-BR')

  const paymentUrl = invoice?.bankSlipUrl || invoice?.invoiceUrl

  return (
    <div
      role="alert"
      className="w-full bg-amber-50 border-b border-amber-300 px-4 py-2.5 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-amber-900 shadow-sm animate-in fade-in duration-300"
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-amber-100 rounded-full text-amber-700 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="text-sm">
          <span className="font-semibold text-amber-950">Aviso Financeiro: </span>
          A fatura de uso da plataforma venceu em <span className="font-semibold">{formattedDueDate}</span>.
          Você possui <span className="font-semibold text-amber-800">{daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}</span> de tolerância (até {formattedGraceDate}) para regularizar antes da suspensão automática dos serviços.
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
        {invoice?.pixQrCodePayload && (
          <PixCopyButton
            payload={invoice.pixQrCodePayload}
            variant="outline"
            className="border-amber-300 bg-white/80 hover:bg-white text-amber-900"
          />
        )}

        {paymentUrl && (
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: 'sm' }),
              'bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-xs inline-flex items-center gap-1.5',
            )}
          >
            <span>Pagar Boleto / Pix</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}
