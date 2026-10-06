import React, { Suspense } from 'react'
import prisma from '@/lib/prisma'
import {
  getFinancialSettings,
  getBranchFinancialSettings,
  getBankAccounts,
} from '@/actions/financial/settings'
import { requireFinancialAuth } from '@/lib/financial/auth-guard'
import FinancialSettingsClient from '@/components/financial/FinancialSettingsClient'
import { serializeDecimals } from '@/lib/utils'
import { MetricCardsSkeleton, TableSkeleton } from '@/components/financial/FinancialSkeletons'

export const metadata = {
  title: 'Configurações Financeiras & Tesouraria | AgroTech Financeiro',
  description: 'Parâmetros de honorários, metas orçamentárias por filial e contas bancárias.',
}

async function SettingsContent({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>
}) {
  const resolvedParams = await searchParams
  const branchId = resolvedParams.branchId || null
  const auth = await requireFinancialAuth(branchId)

  const [globalSettingsRes, branchSettingsRes, bankAccountsRes, branches] =
    await Promise.all([
      getFinancialSettings(),
      getBranchFinancialSettings(auth.effectiveBranchId || ''),
      getBankAccounts(branchId),
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

  const globalSettings = serializeDecimals(globalSettingsRes.data || null)
  const branchSettings = serializeDecimals(branchSettingsRes.data || null)
  const bankAccounts = serializeDecimals(bankAccountsRes.data || [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Central de Configurações & Tesouraria
        </h2>
        <p className="text-xs text-slate-500">
          Governança de parâmetros do ERP, metas orçamentárias por filial, cadastro de contas bancárias e transferências internas de tesouraria.
        </p>
      </div>

      <FinancialSettingsClient
        globalSettings={globalSettings}
        branchSettings={branchSettings}
        bankAccounts={bankAccounts}
        branches={branches}
        isExecutive={auth.isExecutive}
        currentBranchId={branchId}
      />
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-100">
      <div className="space-y-1">
        <div className="h-6 w-72 bg-slate-200/70 rounded-md animate-pulse" />
        <div className="h-4 w-96 bg-slate-100 rounded-md animate-pulse" />
      </div>
      <MetricCardsSkeleton count={3} />
      <TableSkeleton rows={4} />
    </div>
  )
}

export default function FinancialSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>
}) {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent searchParams={searchParams} />
    </Suspense>
  )
}
