import React from 'react'
import prisma from '@/lib/prisma'
import {
  getFinancialSettings,
  getBranchFinancialSettings,
  getBankAccounts,
} from '@/actions/financial/settings'
import { requireFinancialAuth } from '@/lib/financial/auth-guard'
import FinancialSettingsClient from '@/components/financial/FinancialSettingsClient'

export const metadata = {
  title: 'Configurações Financeiras & Tesouraria | AgroTech Financeiro',
  description: 'Parâmetros de honorários, metas orçamentárias por filial e contas bancárias.',
}

export default async function FinancialSettingsPage({
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

  const globalSettings = globalSettingsRes.data || null
  const branchSettings = branchSettingsRes.data || null
  const bankAccounts = bankAccountsRes.data || []

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
