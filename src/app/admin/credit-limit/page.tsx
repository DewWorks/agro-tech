import React from 'react'
import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/auth'
import { getCreditLimitPortfolioData } from '@/actions/credit-limit'
import { CreditLimitContainer } from '@/components/credit-limit/CreditLimitContainer'

export default async function CreditLimitPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined }
}) {
  const searchParams = (await props.searchParams) || {}
  const user = await getUserContext()

  if (!user) {
    redirect('/login')
  }

  const isSuperAdmin =
    user.role === 'SUPER_ADMIN' || (user as any).realRole === 'SUPER_ADMIN'
  const isOrgFinancialEnabled = (user.organization?.modules || []).includes(
    'FINANCIAL_SUMMARY'
  )
  const hasFinancialModule = isSuperAdmin || isOrgFinancialEnabled
  const isFinancialModuleDisabledForOrg = isSuperAdmin && !isOrgFinancialEnabled

  // Bloqueio rigoroso: se usuário comum não possui FINANCIAL_SUMMARY, redireciona
  if (!hasFinancialModule) {
    redirect('/admin')
  }

  // Consulta dados da carteira e consolidação MCR
  const data = await getCreditLimitPortfolioData({
    branchId: searchParams.branchId,
    search: searchParams.q,
    purpose: searchParams.purpose,
    bank: searchParams.bank,
    status: searchParams.status,
  })

  const initialTab =
    (searchParams.tab as 'overview' | 'simulator') ||
    (searchParams.propertyId ? 'simulator' : 'overview')

  return (
    <CreditLimitContainer
      kpis={data.kpis}
      properties={data.properties}
      branches={data.branches}
      initialTab={initialTab}
      initialPropertyId={searchParams.propertyId}
      isFinancialModuleDisabledForOrg={isFinancialModuleDisabledForOrg}
    />
  )
}
