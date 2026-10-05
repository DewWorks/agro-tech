import React from 'react'
import prisma from '@/lib/prisma'
import { getCommercialPartners } from '@/actions/financial/partners'
import { requireFinancialAuth, buildFinancialBranchWhere } from '@/lib/financial/auth-guard'
import PartnersListClient from '@/components/financial/PartnersListClient'
import { formatCurrency } from '@/lib/utils'
import { Users2, Lock, Unlock, CheckCircle2, DollarSign } from 'lucide-react'

export const metadata = {
  title: 'Parceiros Comerciais & Comissões | AgroTech Financeiro',
  description: 'Gestão de correspondentes bancários, controle da trava de comissões e pagamentos PIX.',
}

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>
}) {
  const resolvedParams = await searchParams
  const branchId = resolvedParams.branchId || null
  const auth = await requireFinancialAuth(branchId)

  const [partnersRes, commissions, branches] = await Promise.all([
    getCommercialPartners(branchId),
    prisma.partnerCommission.findMany({
      where: {
        branch: {
          organizationId: auth.organizationId,
          ...(auth.isGlobalView ? {} : { id: auth.effectiveBranchId! }),
        },
      },
      select: {
        calculationBasisAmount: true,
        totalCommissionAmount: true,
        releasedAmount: true,
        paidAmount: true,
        status: true,
      },
    }),
    prisma.branch.findMany({
      where: {
        organizationId: auth.organizationId,
        isActive: true,
        ...(auth.isGlobalView ? {} : { id: auth.effectiveBranchId! }),
      },
      select: {
        id: true,
        name: true,
        city: true,
      },
      orderBy: { name: 'asc' },
    }),
  ])

  const partners = partnersRes.data || []

  // Métricas Consolidadas de Comissões
  let totalOriginated = 0
  let totalCommissions = 0
  let totalReleased = 0
  let totalPaid = 0

  commissions.forEach((c) => {
    totalOriginated += Number(c.calculationBasisAmount) || 0
    totalCommissions += Number(c.totalCommissionAmount) || 0
    totalReleased += Number(c.releasedAmount) || 0
    totalPaid += Number(c.paidAmount) || 0
  })

  const totalBlocked = Math.max(0, totalCommissions - totalReleased)
  const availableToPay = Math.max(0, totalReleased - totalPaid)

  return (
    <div className="space-y-6">
      {/* Cards de Métricas de Comissões */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Volume Originado */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Volume Originado</span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {formatCurrency(totalOriginated)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Base gerada por intermediadores</p>
        </div>

        {/* Bloqueado sob Trava */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Bloqueado sob Trava</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-amber-900">
            {formatCurrency(totalBlocked)}
          </div>
          <p className="mt-1 text-[11px] text-amber-700/80">Aguardando quitação do produtor</p>
        </div>

        {/* Liberado para Saque */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Liberado para Pagamento</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
              <Unlock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-emerald-700">
            {formatCurrency(availableToPay)}
          </div>
          <p className="mt-1 text-[11px] text-emerald-600/80">Destravado por liquidação de parcelas</p>
        </div>

        {/* Histórico Efetivamente Pago */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Comissões Pagas</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-blue-900">
            {formatCurrency(totalPaid)}
          </div>
          <p className="mt-1 text-[11px] text-blue-600/80">Repasses liquidados via PIX</p>
        </div>
      </div>

      {/* Listagem de Parceiros */}
      <PartnersListClient
        partners={partners}
        branches={branches}
        currentBranchId={branchId}
      />
    </div>
  )
}
