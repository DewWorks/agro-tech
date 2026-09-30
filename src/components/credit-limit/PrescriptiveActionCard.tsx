'use client'

import React from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  FileSpreadsheet,
  ArrowRight,
  Calculator,
  Calendar,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface PrescriptiveActionCardProps {
  propertyId: string
  requestedAmount: number
  annualDebtService: number
  paymentCapacity: number
  icsd: number
  ltvPercent: number
  totalCollateral: number
  acceptableCollateral: number
  creditLineName: string
  termMonths: number
  amortizationSystem: 'PRICE' | 'SAC' | string
  purpose?: string
  hasRevenues: boolean
  isApproved: boolean
  overallStatus: string
  summaryOpinion: string
  regulatoryNotes?: string[]
  onSetAmortizationSystem?: (sys: 'PRICE' | 'SAC') => void
  onSetTermMonths?: (months: number) => void
}

export function PrescriptiveActionCard({
  propertyId,
  requestedAmount,
  annualDebtService,
  paymentCapacity,
  icsd,
  ltvPercent,
  totalCollateral,
  acceptableCollateral,
  creditLineName,
  termMonths,
  amortizationSystem,
  purpose = '',
  hasRevenues,
  isApproved,
  overallStatus,
  summaryOpinion,
  regulatoryNotes = [],
  onSetAmortizationSystem,
  onSetTermMonths,
}: PrescriptiveActionCardProps) {
  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  // Cálculos de Prescrição Financeira
  const targetCPForApproval = annualDebtService * 1.20
  const cpDeficit = Math.max(0, targetCPForApproval - paymentCapacity)
  const maxCreditSupportedWithCurrentCP =
    paymentCapacity > 0 && annualDebtService > 0 && requestedAmount > 0
      ? (paymentCapacity / 1.20) / (annualDebtService / requestedAmount)
      : 0

  const isLtvOk = ltvPercent >= 100
  const isIcsdOk = icsd >= 1.20
  const isCusteio = (purpose || '').toUpperCase().includes('CUSTEIO')

  const statusColorClass =
    overallStatus === 'APROVADO'
      ? 'bg-emerald-600 text-white'
      : overallStatus === 'APROVADO_COM_RESTRICOES'
      ? 'bg-amber-600 text-white'
      : 'bg-rose-600 text-white'

  return (
    <div className="bg-slate-900 border border-slate-700/80 text-white rounded-xl p-5 mt-4 space-y-4 shadow-xl">
      {/* 1. Header Unificado com Status Executivo do Parecer de Risco */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-tight text-slate-100 flex items-center gap-2">
              Inteligência Consultiva & Diagnóstico Prescritivo
            </h4>
            <p className="text-[11px] text-slate-400">
              Parecer analítico do projetista rural e plano de viabilização para deferimento no comitê bancário
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Badge className={`text-[10px] font-bold px-2.5 py-0.5 tracking-wider uppercase ${statusColorClass}`}>
            {overallStatus.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      {/* 2. Parecer Preliminar e Fundamentação Normativa MCR Integrada */}
      <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-2">
        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Parecer Preliminar de Risco Bancário</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-300">
          {summaryOpinion}
        </p>

        {regulatoryNotes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-700/60">
            {regulatoryNotes.map((note: string, idx: number) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono border border-slate-700"
              >
                {note}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. Diagnóstico dos 3 Pilares Fundamentais (Cards Rápidos) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Pilar 1: Garantias & Lastro */}
        <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              1. Garantias & Lastro
            </span>
            <Badge
              className={`text-[9px] font-bold px-1.5 py-0 ${
                isLtvOk
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {isLtvOk ? `Adequado (${ltvPercent.toFixed(1)}%)` : `Insuficiente (${ltvPercent.toFixed(1)}%)`}
            </Badge>
          </div>
          <div className="text-xs font-semibold text-slate-200">
            {isLtvOk ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Patrimônio cobre a operação com folga
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Déficit de garantias reais/pignoratícias
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Lastro aceito: {formatBRL(acceptableCollateral)}
          </span>
        </div>

        {/* Pilar 2: Enquadramento MCR */}
        <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              2. Enquadramento MCR
            </span>
            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0">
              {creditLineName ? `Elegível: ${creditLineName.split('-')[0].trim()}` : 'Elegível ao PRONAMP'}
            </Badge>
          </div>
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            Em conformidade com as normas BACEN
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Juros regulamentados e finalidade compatível
          </span>
        </div>

        {/* Pilar 3: Capacidade de Pagamento (ICSD) */}
        <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              3. Solvência & ICSD
            </span>
            <Badge
              className={`text-[9px] font-bold px-1.5 py-0 ${
                isIcsdOk
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {isIcsdOk ? `Viável (${icsd.toFixed(2)}x)` : `Inviável (${icsd.toFixed(2)}x)`}
            </Badge>
          </div>
          <div className="text-xs font-semibold">
            {isIcsdOk ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Fluxo livre cobre o encargo com folga
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Déficit no fluxo operacional livre
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {cpDeficit > 0 ? `Falta: ${formatBRL(cpDeficit)} de margem` : `Margem aprovada (≥ 1,20x)`}
          </span>
        </div>
      </div>

      {/* 4. Detalhamento do Motivo da Reprovação */}
      <div className="p-3.5 rounded-lg bg-slate-800/40 border border-slate-700/50 text-xs leading-relaxed text-slate-300">
        <p>
          O proponente possui patrimônio sólido ({formatBRL(acceptableCollateral)} em garantias regulamentares aceitáveis pelo MCR), porém{' '}
          {!hasRevenues ? (
            <span className="text-amber-300 font-semibold">
              não registrou receitas operacionais ou histórico de safra comprovada no exercício
            </span>
          ) : paymentCapacity <= 0 ? (
            <span className="text-rose-300 font-semibold">
              o total de despesas e passivos supera o faturamento apurado, resultando em capacidade de pagamento nula
            </span>
          ) : (
            <span className="text-rose-300 font-semibold">
              a capacidade de pagamento apurada de {formatBRL(paymentCapacity)} não atinge a margem de estresse exigida
            </span>
          )}
          . Para suportar o encargo anual de <span className="font-mono text-white font-bold">{formatBRL(annualDebtService)}</span>, o Banco do Brasil exige Capacidade de Pagamento líquida comprovada de no mínimo{' '}
          <strong className="text-emerald-400 font-mono">{formatBRL(targetCPForApproval)}</strong> (índice regulamentar ICSD ≥ 1,20).
        </p>
      </div>

      {/* 5. Plano de Ação para Viabilização com Gatilhos 1-Clique */}
      <div className="space-y-2 pt-1">
        <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
          <ArrowRight className="w-3.5 h-3.5" />
          Plano de Ação para Viabilização da Proposta (Gatilhos Rápidos)
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Ação 1: Comprovação de Renda no CRM com Link 1-Clique */}
          <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700 flex flex-col justify-between text-xs space-y-2">
            <div className="flex gap-2.5">
              <div className="p-1.5 rounded bg-blue-500/10 text-blue-400 h-fit mt-0.5 shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-100 block">
                  Ação 1: Comprovação de Receitas no CRM
                </span>
                <p className="text-slate-300 text-[11px] leading-snug">
                  Cadastrar no CRM as notas fiscais de venda da safra passada ou contratos de compra e venda futura totalizando margem líquida de ao menos{' '}
                  <strong className="text-emerald-300 font-mono">{formatBRL(targetCPForApproval)}</strong>.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/60">
              <Link
                href={`/admin/crm/properties/${propertyId}/edit?step=4`}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-2.5 py-1 rounded inline-flex items-center gap-1 transition-colors shadow-xs"
              >
                Adicionar Receitas no CRM ↗
              </Link>
            </div>
          </div>

          {/* Ação 2: Ajuste de Condições com Gatilhos Rápidos */}
          <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700 flex flex-col justify-between text-xs space-y-2">
            <div className="flex gap-2.5">
              <div className="p-1.5 rounded bg-amber-500/10 text-amber-400 h-fit mt-0.5 shrink-0">
                <Calculator className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-100 block">
                  Ação 2: Ajuste de Prazo e Amortização
                </span>
                <p className="text-slate-300 text-[11px] leading-snug">
                  {isCusteio ? (
                    <span>
                      Operações de custeio possuem limite de ciclo produtivo. Para diluir o encargo, avalie adequar o montante pretendido ou utilizar o Sistema SAC para amortização decrescente.
                    </span>
                  ) : (
                    <span>
                      Simular a extensão de prazo (ex: 24 ou 36 meses se a linha permitir), diluindo a parcela anual do encargo. Comparar com o Sistema SAC para amortização decrescente.
                    </span>
                  )}
                  {paymentCapacity > 0 && maxCreditSupportedWithCurrentCP > 0 && (
                    <span className="block mt-1 text-emerald-300">
                      Com a renda líquida atual de {formatBRL(paymentCapacity)}, o limite máximo aprovável de imediato é de <strong className="font-mono">{formatBRL(maxCreditSupportedWithCurrentCP)}</strong>.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/60 flex flex-wrap items-center gap-2">
              {/* Botão para alternar Sistema de Amortização */}
              {amortizationSystem === 'PRICE' ? (
                <button
                  type="button"
                  onClick={() => onSetAmortizationSystem?.('SAC')}
                  className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 px-2.5 py-1 rounded text-slate-200 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Calculator className="w-3 h-3 text-amber-400" />
                  Testar Tabela SAC
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onSetAmortizationSystem?.('PRICE')}
                  className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 px-2.5 py-1 rounded text-slate-200 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Calculator className="w-3 h-3 text-emerald-400" />
                  Voltar para Tabela PRICE
                </button>
              )}

              {/* Botões rápidos de prazo quando não for custeio (linhas de investimento) */}
              {!isCusteio && onSetTermMonths && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Calendar className="w-3 h-3 ml-1" />
                  <span>Prazos:</span>
                  {[24, 36, 48].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onSetTermMonths(m)}
                      className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                        termMonths === m
                          ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-300'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
