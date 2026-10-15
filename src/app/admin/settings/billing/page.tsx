import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getOrganizationBillingDetails } from '@/actions/billing'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  FileText,
  Building2,
  Users,
  HardDrive,
  FileCheck2,
  ExternalLink,
} from 'lucide-react'
import { PixCopyButton } from '@/components/billing/PixCopyButton'
import { BillingHistory } from '@/components/billing/BillingHistory'

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

  const { plan, invoices, status, effectivePrice, currentPeriodEnd } = billingData

  const formattedPeriodEnd = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('pt-BR')
    : 'N/A'

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(effectivePrice)

  const pendingInvoice = invoices.find(
    (inv) => inv.status === 'PENDING' || inv.status === 'OVERDUE',
  )

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'ACTIVE':
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 gap-1 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Assinatura Ativa
          </Badge>
        )
      case 'TRIAL':
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700 text-xs">
            Período de Avaliação / Implantação
          </Badge>
        )
      case 'OVERDUE':
        return (
          <Badge className="bg-amber-600 hover:bg-amber-700 gap-1 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            Em Atraso (Tolerância Ativa)
          </Badge>
        )
      case 'SUSPENDED':
        return <Badge variant="destructive">Acesso Suspenso</Badge>
      default:
        return <Badge variant="outline">{st}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Resumo do Plano Atual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200/80 shadow-xs md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>{plan.name}</span>
                  {getStatusBadge(status)}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1">
                  {plan.description}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-700 font-mono">
                  {formattedPrice}
                  <span className="text-xs font-normal text-slate-500">/mês</span>
                </div>
                <span className="text-[11px] text-slate-400">Cobrança Recorrente</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>Até {plan.maxBranches} Filiais</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Users className="w-4 h-4 text-slate-400" />
              <span>Até {plan.maxUsers} Usuários</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <span>{plan.storageLimitGb} GB Armazenamento</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <FileCheck2 className="w-4 h-4 text-slate-400" />
              <span>{plan.pdfQuotaMonthly} PDFs Mensais</span>
            </div>
          </CardContent>
        </Card>

        {/* Ciclo de Faturamento */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Vigência e Vencimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block">Próxima Renovação:</span>
              <strong className="text-slate-800 text-sm">{formattedPeriodEnd}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Dia Base de Vencimento:</span>
              <strong className="text-slate-800">Dia {billingData.billingDueDay} de cada mês</strong>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
              Gateway Oficial: <strong className="text-slate-600">Asaas Pagamentos</strong>
            </div>
          </CardContent>
        </Card>
      </div>

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
