'use client'

import { InvoiceCard } from './InvoiceCard'
import type { SerializedInvoice } from '@/lib/billing/invoice-helpers'
import { Receipt } from 'lucide-react'

interface BillingHistoryProps {
  invoices: SerializedInvoice[]
}

export function BillingHistory({ invoices }: BillingHistoryProps) {
  if (!invoices || invoices.length === 0) {
    return (
      <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-700">Nenhuma fatura emitida</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          As faturas geradas pelo gateway Asaas serão listadas aqui com seus respectivos boletos e Pix Copia-e-Cola.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <InvoiceCard key={invoice.id} invoice={invoice} />
      ))}
    </div>
  )
}
