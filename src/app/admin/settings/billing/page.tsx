import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getOrganizationBillingDetails } from '@/actions/billing'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  CreditCard,
  AlertTriangle,
  FileText,
  ExternalLink,
} from 'lucide-react'
import { PixCopyButton } from '@/components/billing/PixCopyButton'
import { BillingHistory } from '@/components/billing/BillingHistory'
import { SubscriptionCard } from '@/components/billing/SubscriptionCard'

export default async function BillingSettingsPage() {
  const userContext = await getUserContext()

  if (!userContext || !userContext.organizationId) {
    redirect('/admin')
  }

  const billingData = await getOrganizationBillingDetails(userContext.organizationId)

  if (!billingData) {
    return (
      <Card className="border-dashed border-slate-200">
        <CardContent className="py-12 text-center space-y-3">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">
            Nenhuma assinatura ativa encontrada
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Sua organização está operando em período de implantação assistida. Entre em contato com o suporte ou aguarde a emissão da cobrança inicial via Asaas.
          </p>
        </CardContent>
      </Card>
    )
  }

  const { plan, invoices, status, effectivePrice } = billingData

  const pendingInvoice = invoices.find(
    (inv) => inv.status === 'PENDING' || inv.status === 'OVERDUE',
  )

  return (
    <div className="space-y-6">
      {/* Resumo do Plano Atual e Ciclo */}
      <SubscriptionCard
        plan={plan}
        status={status}
        effectivePrice={effectivePrice}
        billingDueDay={billingData.billingDueDay}
        currentPeriodStart={billingData.currentPeriodStart}
        currentPeriodEnd={billingData.currentPeriodEnd}
        gracePeriodUntil={billingData.gracePeriodUntil}
        pendingInvoice={pendingInvoice}
      />

      {/* Fatura em Aberto (Se houver pendência) */}
      {pendingInvoice && (
        <Card className="border-amber-200 bg-amber-50/40 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Fatura Aberta para Pagamento</span>
              </div>
              <Badge variant="outline" className="border-amber-300 text-amber-800 bg-white">
                Vence em {new Date(pendingInvoice.dueDate).toLocaleDateString('pt-BR')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-amber-200/80">
              <div>
                <span className="text-xs text-slate-500">Valor da Mensalidade:</span>
                <div className="text-xl font-bold text-slate-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    pendingInvoice.amount,
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                {pendingInvoice.pixQrCodePayload && (
                  <PixCopyButton payload={pendingInvoice.pixQrCodePayload} size="sm" />
                )}

                {(pendingInvoice.bankSlipUrl || pendingInvoice.invoiceUrl) && (
                  <a
                    href={pendingInvoice.bankSlipUrl || pendingInvoice.invoiceUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ size: 'sm' }),
                      'bg-amber-600 hover:bg-amber-700 text-white gap-1.5 inline-flex items-center',
                    )}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Abrir Boleto / Pix</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico Completo de Faturas */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Histórico de Faturas e Pagamentos
        </h3>
        <BillingHistory invoices={invoices} />
      </div>
    </div>
  )
}
