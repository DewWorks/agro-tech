'use client'

import Image from 'next/image'
import { ShieldAlert, Download, QrCode, Lock, Mail, MessageSquare, LogOut } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PixCopyButton } from './PixCopyButton'
import type { SerializedInvoice } from '@/lib/billing/invoice-helpers'
import { logout } from '@/actions/auth'

interface SuspendedScreenProps {
  invoice: SerializedInvoice | null
  organizationName: string
}

export default function SuspendedScreen({
  invoice,
  organizationName,
}: SuspendedScreenProps) {
  const formattedDueDate = invoice?.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('pt-BR')
    : 'Não disponível'

  const formattedAmount = invoice?.amount
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
        invoice.amount,
      )
    : 'R$ 300,00'

  const paymentUrl = invoice?.bankSlipUrl || invoice?.invoiceUrl

  // Formata imagem base64 se necessário
  let qrCodeSrc = invoice?.pixQrCodeImage || null
  if (qrCodeSrc && !qrCodeSrc.startsWith('data:')) {
    qrCodeSrc = `data:image/png;base64,${qrCodeSrc}`
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header de Bloqueio */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-2 shadow-lg shadow-rose-950/40">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Acesso Temporariamente Suspenso
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            Identificamos uma pendência financeira referente à licença de uso da organização{' '}
            <span className="font-semibold text-slate-200">{organizationName}</span>.
          </p>
        </div>

        {/* Card de Fatura e Pagamento Imediato */}
        <Card className="bg-slate-800/90 border-slate-700/80 text-slate-100 shadow-2xl backdrop-blur-md">
          <CardHeader className="border-b border-slate-700/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-white">
                  Regularização da Assinatura
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Vencimento original em {formattedDueDate}
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                  Valor Total
                </span>
                <span className="text-2xl font-bold text-emerald-400">
                  {formattedAmount}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Seção Pix */}
            <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-700/50 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <QrCode className="w-5 h-5" />
                <span>Pagamento Instantâneo via Pix (Liberação Automática)</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {qrCodeSrc ? (
                  <div className="bg-white p-3 rounded-lg shadow-md shrink-0">
                    <img
                      src={qrCodeSrc}
                      alt="QR Code Pix"
                      className="w-36 h-36 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-36 h-36 rounded-lg bg-slate-800 border border-slate-700 flex flex-col items-center justify-center text-slate-400 p-2 text-center text-xs shrink-0">
                    <QrCode className="w-8 h-8 mb-2 opacity-50" />
                    Utilize o código copia e cola abaixo
                  </div>
                )}

                <div className="flex-1 space-y-3 w-full">
                  <p className="text-xs text-slate-400">
                    Abra o app do seu banco, escolha <strong>Pagar via Pix</strong> e escaneie o QR Code ou cole o código abaixo:
                  </p>

                  {invoice?.pixQrCodePayload ? (
                    <div className="space-y-2">
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 break-all select-all max-h-20 overflow-y-auto">
                        {invoice.pixQrCodePayload}
                      </div>
                      <PixCopyButton
                        payload={invoice.pixQrCodePayload}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none font-semibold"
                        size="default"
                      />
                    </div>
                  ) : (
                    <div className="text-xs text-amber-400/90 bg-amber-950/30 p-3 rounded-lg border border-amber-900/40">
                      O código Pix está sendo sincronizado. Você pode acessar a via digital completa pelo boleto bancário abaixo.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ações Secundárias: Boleto PDF */}
            {paymentUrl && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-700/50">
                <div className="text-xs text-slate-400">
                  Prefere liquidar via código de barras convencional?
                </div>
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'w-full sm:w-auto border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white',
                  )}
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span>Visualizar Boleto Bancário</span>
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Garantia de Preservação e Suporte */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <ShieldAlert className="w-4 h-4 text-sky-400" />
            <span>Preservação Estrita de Dados (SLA Enterprise)</span>
          </div>
          <p>
            Todos os seus cadastros de produtores rurais, análises de risco de crédito, laudos agronômicos e acervo do GED permanecem integralmente salvaguardados e intactos. O acesso é desbloqueado no instante da confirmação bancária.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/30">
            <span className="text-slate-400">Dúvidas financeiras ou comprovante?</span>
            <div className="flex items-center gap-4 text-slate-300">
              <span className="flex items-center gap-1.5 hover:text-white">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                financeiro@agrotech.agr.br
              </span>
            </div>
          </div>
        </div>

        {/* Botão de Logout para alternar usuário */}
        <div className="text-center pt-2">
          <form action={async () => { await logout() }}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>Sair da conta</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

