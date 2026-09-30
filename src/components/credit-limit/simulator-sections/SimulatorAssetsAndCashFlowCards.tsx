'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, TrendingUp, AlertCircle, ArrowUpRight } from 'lucide-react'
import { formatBRL, formatCPF, formatCNPJ } from '@/lib/utils/formatters'
import { SimulatorAssetsAndCashFlowCardsProps } from '@/types/credit-limit.types'

export function SimulatorAssetsAndCashFlowCards({
  simulationData,
  selectedPropertyId,
}: SimulatorAssetsAndCashFlowCardsProps) {
  const isCadastralEmpty =
    simulationData.property.totalArea <= 0 ||
    (simulationData.collateral.totalAssets <= 0 &&
      simulationData.cashFlow.paymentCapacity <= 0)

  return (
    <div className="space-y-6">
      {/* BANNER DE RESUMO DO IMÓVEL & PRODUTOR */}
      <div className="bg-gradient-to-r from-emerald-900 to-[#1B4D3E] text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">
              {simulationData.property.propertyName || simulationData.property.name}
            </span>
            <Badge className="bg-emerald-500/30 text-emerald-200 border-emerald-400/40 text-[10px] font-bold">
              {simulationData.property.totalArea.toFixed(1)} ha
            </Badge>
          </div>
          <p className="text-xs text-emerald-100/90">
            Produtor(a): <strong>{simulationData.producer.name}</strong> •{' '}
            {simulationData.producer.document?.length > 11
              ? formatCNPJ(simulationData.producer.document)
              : formatCPF(simulationData.producer.document)}{' '}
            • {simulationData.property.city || 'Sem município'}/
            {simulationData.property.state || 'UF'}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-[10px] text-emerald-200 uppercase block font-sans">
              Garantias MCR
            </span>
            <span className="font-bold text-sm">
              {formatBRL(simulationData.collateral.acceptableCollateral)}
            </span>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-right">
            <span className="text-[10px] text-emerald-200 uppercase block font-sans">
              Capacidade Pagamento (CP)
            </span>
            <span
              className={`font-bold text-sm ${
                simulationData.cashFlow.paymentCapacity >= 0
                  ? 'text-emerald-200'
                  : 'text-rose-300'
              }`}
            >
              {formatBRL(simulationData.cashFlow.paymentCapacity)}
            </span>
          </div>
        </div>
      </div>

      {/* AVISO CONTEXTUAL PARA PROPRIEDADE COM DADOS ZERADOS NO CRM */}
      {isCadastralEmpty && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Atenção:</strong> Esta propriedade ainda não possui ativos ou fluxo de caixa lançados no CRM. O cálculo de ICSD e LTV será afetado.
            </span>
          </div>
          <Link
            href={`/admin/crm/properties/${selectedPropertyId}/edit`}
            className="inline-flex items-center gap-1 font-bold text-amber-800 dark:text-amber-300 hover:underline shrink-0 text-xs"
          >
            <span>Completar Cadastro no CRM</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* QUADROS DE ENTRADA: BALANÇO DE GARANTIAS & FLUXO DE CAIXA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lastro de Garantias */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Lastro de Ativos & Garantias Cadastradas
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-normal">
                Total: {formatBRL(simulationData.collateral.totalAssets)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
              <span className="text-slate-600 dark:text-slate-400">Terra Nua (VTN):</span>
              <span className="font-mono font-semibold">
                {formatBRL(simulationData.collateral.landValue)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
              <span className="text-slate-600 dark:text-slate-400">Benfeitorias e Instalações:</span>
              <span className="font-mono font-semibold">
                {formatBRL(simulationData.collateral.improvementsValue)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
              <span className="text-slate-600 dark:text-slate-400">Máquinas e Implementos:</span>
              <span className="font-mono font-semibold">
                {formatBRL(simulationData.collateral.machineryValue)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
              <span className="text-slate-600 dark:text-slate-400">Rebanho Semovente:</span>
              <span className="font-mono font-semibold">
                {formatBRL(simulationData.collateral.livestockValue)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
              <span className="text-slate-600 dark:text-slate-400">Imóveis Urbanos & Frotas:</span>
              <span className="font-mono font-semibold">
                {formatBRL(
                  simulationData.collateral.urbanTotal +
                    simulationData.collateral.vehiclesTotal
                )}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 font-bold text-emerald-700 dark:text-emerald-400">
              <span>Limite de Garantia Ofertável (MCR):</span>
              <span className="font-mono text-sm">
                {formatBRL(simulationData.collateral.acceptableCollateral)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Demonstrativo de Fluxo de Caixa */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Fluxo de Caixa Operacional Anual
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-normal">
                Margem Líquida: {formatBRL(simulationData.cashFlow.netMargin)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
              <span className="text-slate-600 dark:text-slate-400">Receita Agro (Efetiva/Histórica):</span>
              <span className="font-mono font-semibold">
                {formatBRL(simulationData.cashFlow.effectiveAgroRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
              <span className="text-slate-600 dark:text-slate-400">Receita Agro (Projetada Safra):</span>
              <span className="font-mono font-semibold">
                {formatBRL(simulationData.cashFlow.projectedAgroRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
              <span className="text-slate-600 dark:text-slate-400">Custos Operacionais & Insumos:</span>
              <span className="font-mono font-semibold text-rose-600">
                - {formatBRL(simulationData.cashFlow.operationalExpenses)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
              <span className="text-slate-600 dark:text-slate-400">Manutenção Familiar:</span>
              <span className="font-mono font-semibold text-rose-600">
                - {formatBRL(simulationData.cashFlow.familyLivingCosts)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
              <span className="text-slate-600 dark:text-slate-400">Dívidas Bancárias Vigentes:</span>
              <span className="font-mono font-semibold text-rose-600">
                - {formatBRL(simulationData.cashFlow.existingDebtService)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 font-bold">
              <span>Capacidade de Pagamento Anual (CP):</span>
              <span
                className={`font-mono text-sm ${
                  simulationData.cashFlow.paymentCapacity >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {formatBRL(simulationData.cashFlow.paymentCapacity)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
