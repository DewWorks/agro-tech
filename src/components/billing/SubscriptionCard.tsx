'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  HardDrive,
  FileCheck2,
  ExternalLink,
  CreditCard,
  Clock,
} from 'lucide-react'
import { PixCopyButton } from './PixCopyButton'
import type { SerializedInvoice } from '@/lib/billing/invoice-helpers'

export interface SubscriptionCardProps {
  plan: {
    id: string
    code: string
    name: string
    description: string | null
    price: number
    billingCycle: string
    maxBranches: number
    maxUsers: number
    storageLimitGb: number
    pdfQuotaMonthly: number
  }
  status: string
  effectivePrice: number
  billingDueDay: number
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  gracePeriodUntil?: string | null
  pendingInvoice?: SerializedInvoice | null
}

export function SubscriptionCard({
  plan,
  status,
  effectivePrice,
  billingDueDay,
  currentPeriodEnd,
  gracePeriodUntil,
  pendingInvoice,
}: SubscriptionCardProps) {
  const formattedPeriodEnd = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('pt-BR')
    : 'N/A'

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(effectivePrice)

  // Cálculo defensivo de dias de carência restantes
  const getGracePeriodRemaining = () => {
    if (!gracePeriodUntil) return null
    const end = new Date(gracePeriodUntil).getTime()
    const now = new Date().getTime()
    const diffDays = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)))
    return {
      days: diffDays,
      dateFormatted: new Date(gracePeriodUntil).toLocaleDateString('pt-BR'),
    }
  }

  const graceInfo = status === 'OVERDUE' ? getGracePeriodRemaining() : null

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'ACTIVE':
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 gap-1 text-xs text-white">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Assinatura Ativa
          </Badge>
        )
      case 'TRIAL':
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700 text-xs text-white">
            Período de Avaliação / Implantação
          </Badge>
        )
      case 'OVERDUE':
        return (
          <Badge className="bg-amber-600 hover:bg-amber-700 gap-1 text-xs text-white">
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
    <div className="space-y-4">
      {/* Alerta de Carência em Atraso (OVERDUE) */}
      {status === 'OVERDUE' && graceInfo && (
        <div
          role="alert"
          className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-4 sm:p-5 text-amber-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-700 shrink-0 mt-0.5 md:mt-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-amber-900">
                Atenção: Assinatura em Período de Tolerância Contratual
              </h4>
              <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
                Restam <strong className="font-semibold text-amber-950">{graceInfo.days} {graceInfo.days === 1 ? 'dia' : 'dias'}</strong> (até {graceInfo.dateFormatted}) para quitação antes da suspensão automática do acesso ao ecossistema.
              </p>
            </div>
          </div>

          {pendingInvoice && (
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto flex-wrap">
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
                    'bg-amber-700 hover:bg-amber-800 text-white gap-1.5 inline-flex items-center text-xs font-semibold',
                  )}
                >
                  <span>Regularizar Imediatamente</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grid Resumo do Plano e Ciclo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card do Plano */}
        <Card className="border-slate-200/80 shadow-xs md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-start sm:items-center justify-between gap-2 flex-col sm:flex-row">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>{plan.name}</span>
                  {getStatusBadge(status)}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1 max-w-md">
                  {plan.description}
                </CardDescription>
              </div>
              <div className="text-left sm:text-right shrink-0">
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
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Até {plan.maxBranches} Filiais</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Até {plan.maxUsers} Usuários</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <HardDrive className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{plan.storageLimitGb} GB Armazenamento</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <FileCheck2 className="w-4 h-4 text-slate-400 shrink-0" />
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
              <strong className="text-slate-800">Dia {billingDueDay} de cada mês</strong>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Gateway Oficial:</span>
              <strong className="text-slate-700">Asaas Pagamentos</strong>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
