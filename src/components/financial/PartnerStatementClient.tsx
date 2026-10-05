'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Copy,
  Check,
  Printer,
  Lock,
  Unlock,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Clock,
  Landmark,
} from 'lucide-react'
import { formatCurrency, formatCPF, formatCNPJ } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface PartnerStatementClientProps {
  partner: any
  metrics: {
    totalVolumeOriginado: number
    totalComissao: number
    totalBloqueado: number
    totalLiberado: number
    totalPago: number
    saldoDisponivelSaque: number
    totalPropostas: number
  }
  commissions: any[]
}

export default function PartnerStatementClient({
  partner,
  metrics,
  commissions,
}: PartnerStatementClientProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyPix = () => {
    if (!partner.pixKey) {
      toast.error('Chave PIX não cadastrada.')
      return
    }
    navigator.clipboard.writeText(partner.pixKey)
    setCopied(true)
    toast.success(`Chave PIX copiada: ${partner.pixKey}`)
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Botões Superiores */}
      <div className="flex items-center justify-between no-print">
        <Link href="/admin/financial/partners">
          <Button variant="ghost" size="sm" className="text-slate-600 gap-1.5 text-xs">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Parceiros
          </Button>
        </Link>

        <Button
          onClick={handlePrint}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-semibold text-slate-700"
        >
          <Printer className="h-4 w-4" />
          Imprimir Prestação de Contas
        </Button>
      </div>

      {/* Cartão de Identificação do Parceiro */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-emerald-800 p-2 text-white">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">{partner.name}</h2>
                <p className="text-xs text-slate-500">
                  {partner.document?.length === 11
                    ? formatCPF(partner.document)
                    : formatCNPJ(partner.document)}{' '}
                  • Filial: {partner.branch?.name || 'LN Consultoria'} ({partner.branch?.city || 'TO'})
                </p>
              </div>
            </div>
          </div>

          {/* Box Chave PIX */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 flex items-center justify-between gap-4">
            <div>
              <span className="block text-[10px] font-bold uppercase text-emerald-800">
                Chave PIX Cadastrada ({partner.pixKeyType || 'CHAVE'})
              </span>
              <span className="font-mono text-xs font-black text-slate-900">
                {partner.pixKey || 'Não informada'}
              </span>
            </div>
            {partner.pixKey && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyPix}
                className="h-8 text-xs font-bold text-emerald-800 border-emerald-300 hover:bg-emerald-100 gap-1"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            )}
          </div>
        </div>

        {/* Métricas do Parceiro */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Originado</span>
            <div className="text-sm font-black text-slate-900 mt-1">
              {formatCurrency(metrics.totalVolumeOriginado)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
            <span className="text-[10px] font-bold uppercase text-slate-400">Comissão Prevista</span>
            <div className="text-sm font-black text-slate-900 mt-1">
              {formatCurrency(metrics.totalComissao)}
            </div>
          </div>

          <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-3">
            <span className="text-[10px] font-bold uppercase text-amber-800">Sob Trava (Bloqueado)</span>
            <div className="text-sm font-black text-amber-900 mt-1">
              {formatCurrency(metrics.totalBloqueado)}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
            <span className="text-[10px] font-bold uppercase text-emerald-800">Total Liberado</span>
            <div className="text-sm font-black text-emerald-800 mt-1">
              {formatCurrency(metrics.totalLiberado)}
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
            <span className="text-[10px] font-bold uppercase text-blue-800">Histórico Pago</span>
            <div className="text-sm font-black text-blue-900 mt-1">
              {formatCurrency(metrics.totalPago)}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-300 bg-emerald-800 p-3 text-white">
            <span className="text-[10px] font-bold uppercase text-emerald-200">Saldo a Pagar</span>
            <div className="text-base font-black mt-1">
              {formatCurrency(metrics.saldoDisponivelSaque)}
            </div>
          </div>
        </div>
      </div>

      {/* Extrato Detalhado por Proposta */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Discriminação por Proposta / Esteira de Crédito
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold uppercase text-slate-400">
              <tr>
                <th className="py-2.5 px-4">Proposta / Produtor</th>
                <th className="py-2.5 px-4">Data Registro</th>
                <th className="py-2.5 px-4 text-right">Base Cálculo</th>
                <th className="py-2.5 px-4 text-center">% Comis.</th>
                <th className="py-2.5 px-4 text-right">Comissão Total</th>
                <th className="py-2.5 px-4 text-right">Liberado</th>
                <th className="py-2.5 px-4 text-right">Pago</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Nenhuma comissão originada por este parceiro até o momento.
                  </td>
                </tr>
              ) : (
                commissions.map((c) => {
                  const title = c.receivableTitle
                  const producer = title?.producer
                  const base = Number(c.calculationBasisAmount)
                  const total = Number(c.totalCommissionAmount)
                  const rel = Number(c.releasedAmount)
                  const paid = Number(c.paidAmount)

                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {producer?.name || 'Cliente / Produtor'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {title?.documentNumber || 'FAT-ESTEIRA'} •{' '}
                          {producer?.document ? formatCPF(producer.document) : ''}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-slate-800">
                        {formatCurrency(base)}
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {Number(c.commissionPercent)}%
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-slate-900">
                        {formatCurrency(total)}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatCurrency(rel)}
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-blue-700">
                        {formatCurrency(paid)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase border ${
                            c.status === 'PAGO'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : c.status === 'LIBERADO_TOTAL'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : c.status === 'LIBERADO_PARCIAL'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
