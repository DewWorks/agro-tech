'use client'

import React from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  FileSpreadsheet,
  ArrowRight,
  Calculator,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/utils/formatters'

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
  acceptableCollateral,
  creditLineName,
  termMonths,
  amortizationSystem,
  purpose = '',
  hasRevenues,
  overallStatus,
  summaryOpinion,
  regulatoryNotes = [],
  onSetAmortizationSystem,
  onSetTermMonths,
}: PrescriptiveActionCardProps) {
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

  return (
    <div
      className={cn(
        'bg-white rounded-xl border shadow-xs p-6 space-y-5 transition-all mt-4',
        // Borda dinâmica semântica
        overallStatus === 'REPROVADO'
          ? 'border-slate-200 border-l-4 border-l-red-500'
          : overallStatus === 'APROVADO_COM_RESTRICOES'
          ? 'border-slate-200 border-l-4 border-l-amber-500'
          : 'border-slate-200 border-l-4 border-l-emerald-600'
      )}
    >
      {/* =================================================================== */}
      {/* A. CABEÇALHO DO CARD                                               */}
      {/* =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 p-2 rounded-lg shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Inteligência Consultiva & Diagnóstico Prescritivo
            </h4>
            <p className="text-xs text-slate-500">
              Parecer analítico do projetista rural e plano de viabilização para deferimento no comitê bancário
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span
            className={cn(
              'font-semibold px-3 py-1 rounded-full text-xs tracking-wide uppercase border',
              overallStatus === 'REPROVADO'
                ? 'bg-red-50 text-red-700 border-red-200'
                : overallStatus === 'APROVADO_COM_RESTRICOES'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            )}
          >
            {overallStatus.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* =================================================================== */}
      {/* B. BLOCO UNIFICADO DE PARECER PRELIMINAR (SEÇÃO SUPERIOR)           */}
      {/* =================================================================== */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-4 space-y-3">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Parecer Preliminar de Risco Bancário</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-700">
          {summaryOpinion}
        </p>

        {regulatoryNotes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/80">
            {regulatoryNotes.map((note: string, idx: number) => (
              <span
                key={idx}
                className="bg-white border border-slate-200 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded shadow-2xs"
              >
                {note}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* C. OS 3 PILARES FUNDAMENTAIS (CARDS RÁPIDOS)                        */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Pilar 1: Garantias & Lastro */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              1. Garantias & Lastro
            </span>
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                isLtvOk
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              )}
            >
              {isLtvOk ? `Adequado (${ltvPercent.toFixed(1)}%)` : `Déficit (${ltvPercent.toFixed(1)}%)`}
            </span>
          </div>
          <div className="mt-1">
            {isLtvOk ? (
              <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 mt-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Patrimônio cobre a operação com folga</span>
              </div>
            ) : (
              <div className="text-xs font-semibold text-red-700 flex items-center gap-1.5 mt-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>Déficit de garantias reais/pignoratícias</span>
              </div>
            )}
            <div className="text-[11px] text-slate-500 mt-1">
              Lastro aceito: <strong className="text-slate-700 font-semibold">{formatBRL(acceptableCollateral)}</strong>
            </div>
          </div>
        </div>

        {/* Pilar 2: Enquadramento MCR */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              2. Enquadramento MCR
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {creditLineName ? `Elegível: ${creditLineName.split('-')[0].trim()}` : 'Elegível ao PRONAMP'}
            </span>
          </div>
          <div className="mt-1">
            <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 mt-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Em conformidade com as normas BACEN</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Juros regulamentados e finalidade compatível
            </div>
          </div>
        </div>

        {/* Pilar 3: Capacidade de Pagamento (ICSD) */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              3. Solvência & ICSD
            </span>
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                isIcsdOk
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              )}
            >
              {isIcsdOk ? `Viável (${icsd.toFixed(2)}x)` : `Inviável (${icsd.toFixed(2)}x)`}
            </span>
          </div>
          <div className="mt-1">
            {isIcsdOk ? (
              <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 mt-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Fluxo livre cobre o encargo com folga</span>
              </div>
            ) : (
              <div className="text-xs font-semibold text-red-700 flex items-center gap-1.5 mt-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>Déficit no fluxo operacional livre</span>
              </div>
            )}
            <div className="text-[11px] text-slate-500 mt-1">
              {cpDeficit > 0 ? (
                <span>
                  Falta: <strong className="text-red-700 font-semibold">{formatBRL(cpDeficit)}</strong> de margem
                </span>
              ) : (
                <span className="text-emerald-700 font-medium">Margem aprovada (≥ 1,20x)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* D. CAIXA EDITORIAL DA JUSTIFICATIVA MATEMÁTICA                      */}
      {/* =================================================================== */}
      <div className="bg-amber-50/60 border border-amber-200/70 rounded-lg p-4 text-xs leading-relaxed text-slate-800">
        <p>
          O proponente possui patrimônio sólido ({formatBRL(acceptableCollateral)} em garantias), porém{' '}
          {!hasRevenues ? (
            <span className="font-bold text-amber-950">
              não registrou receitas operacionais no exercício
            </span>
          ) : paymentCapacity <= 0 ? (
            <span className="font-bold text-red-950">
              o total de despesas e passivos supera o faturamento apurado, resultando em capacidade de pagamento nula
            </span>
          ) : (
            <span className="font-bold text-amber-950">
              a capacidade de pagamento apurada de {formatBRL(paymentCapacity)} não atinge a margem de estresse exigida
            </span>
          )}
          . Para suportar o encargo anual de <span className="font-bold text-slate-900">{formatBRL(annualDebtService)}</span>, o Banco do Brasil exige Capacidade de Pagamento líquida de no mínimo{' '}
          <span className="font-bold text-emerald-900 bg-emerald-100/60 px-1 py-0.5 rounded">{formatBRL(targetCPForApproval)}</span> (ICSD ≥ 1,20).
        </p>
      </div>

      {/* =================================================================== */}
      {/* E. PLANO DE AÇÃO PARA VIABILIZAÇÃO (GATILHOS RÁPIDOS)               */}
      {/* =================================================================== */}
      <div className="space-y-3 pt-1">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
          Plano de Ação para Viabilização da Proposta (Gatilhos Rápidos)
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Ação 1: Comprovação de Renda no CRM com Link 1-Clique */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-lg p-4 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1 rounded bg-emerald-100 text-emerald-800 shrink-0">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </div>
                <span>Ação 1: Comprovação de Receitas no CRM</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed my-2">
                Cadastrar no CRM as notas fiscais de venda da safra passada ou contratos de compra e venda futura totalizando margem líquida de ao menos{' '}
                <strong className="text-emerald-900 font-semibold">{formatBRL(targetCPForApproval)}</strong>.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/80 mt-1">
              <Link
                href={`/admin/crm/properties/${propertyId}/edit?step=4`}
                className="bg-[#1B4D3E] hover:bg-[#143e32] text-white text-xs font-medium px-3.5 py-1.5 rounded-md shadow-2xs inline-flex items-center gap-1.5 w-fit mt-1 transition-colors"
              >
                <span>Adicionar Receitas no CRM</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Ação 2: Ajuste de Condições com Gatilhos Rápidos */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-lg p-4 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1 rounded bg-amber-100 text-amber-800 shrink-0">
                  <Calculator className="w-3.5 h-3.5" />
                </div>
                <span>Ação 2: Ajuste de Prazo e Amortização</span>
              </div>
              <div className="text-[11px] text-slate-600 leading-relaxed my-2 space-y-1">
                {isCusteio ? (
                  <p>
                    Operações de custeio possuem limite de ciclo produtivo. Para diluir o encargo, avalie adequar o montante pretendido ou utilizar o Sistema SAC para amortização decrescente.
                  </p>
                ) : (
                  <p>
                    Simular a extensão de prazo (ex: 24 ou 36 meses se a linha permitir), diluindo a parcela anual do encargo. Comparar com o Sistema SAC para amortização decrescente.
                  </p>
                )}
                {paymentCapacity > 0 && maxCreditSupportedWithCurrentCP > 0 && (
                  <p className="text-emerald-800 font-medium pt-0.5">
                    Com a renda líquida atual de {formatBRL(paymentCapacity)}, o limite máximo aprovável de imediato é de{' '}
                    <strong className="font-bold text-emerald-900">{formatBRL(maxCreditSupportedWithCurrentCP)}</strong>.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 mt-1 flex flex-wrap items-center gap-2">
              {/* Botão para alternar Sistema de Amortização */}
              {amortizationSystem === 'PRICE' ? (
                <button
                  type="button"
                  onClick={() => onSetAmortizationSystem?.('SAC')}
                  className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium px-3.5 py-1.5 rounded-md shadow-2xs inline-flex items-center gap-1.5 w-fit mt-1 transition-colors cursor-pointer"
                >
                  <Calculator className="w-3 h-3 text-amber-600" />
                  <span>Testar Tabela SAC</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onSetAmortizationSystem?.('PRICE')}
                  className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium px-3.5 py-1.5 rounded-md shadow-2xs inline-flex items-center gap-1.5 w-fit mt-1 transition-colors cursor-pointer"
                >
                  <Calculator className="w-3 h-3 text-emerald-600" />
                  <span>Voltar para Tabela PRICE</span>
                </button>
              )}

              {/* Botões rápidos de prazo quando não for custeio (linhas de investimento) */}
              {!isCusteio && onSetTermMonths && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span className="font-medium">Prazos:</span>
                  {[24, 36, 48].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onSetTermMonths(m)}
                      className={cn(
                        'text-xs px-2.5 py-0.5 rounded border transition-colors cursor-pointer',
                        termMonths === m
                          ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                          : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                      )}
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
