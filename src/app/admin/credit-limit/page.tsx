import React from 'react'
import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/auth'
import {
  getCreditLimitPortfolioData,
  getPropertiesForCreditLimitSelect,
  getSimulationInitialBundle,
} from '@/actions/credit-limit'
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

  const targetPropertyId = searchParams.propertyId
  const targetProducerId = searchParams.producerId
  const initialTab =
    (searchParams.tab as 'overview' | 'simulator') ||
    (targetPropertyId || targetProducerId ? 'simulator' : 'overview')

  // Paralelização de Queries em Promise.all eliminando waterfalls
  const [data, selectProperties, initialSimulationBundle] = await Promise.all([
    getCreditLimitPortfolioData({
      branchId: searchParams.branchId,
      search: searchParams.q,
      purpose: searchParams.purpose,
      bank: searchParams.bank,
      status: searchParams.status,
    }),
    getPropertiesForCreditLimitSelect(),
    (targetPropertyId || targetProducerId) && initialTab === 'simulator'
      ? getSimulationInitialBundle({
          producerId: targetProducerId,
          propertyId: targetPropertyId,
        })
      : Promise.resolve(null),
  ])

  const resolvedPropertyId =
    targetPropertyId || initialSimulationBundle?.resolvedPropertyId || undefined

  return (
    <CreditLimitContainer
      kpis={data.kpis}
      properties={data.properties}
      branches={data.branches}
      initialTab={initialTab}
      initialPropertyId={resolvedPropertyId}
      initialProducerId={targetProducerId}
      initialAmount={searchParams.amount ? Number(searchParams.amount) : undefined}
      initialCreditLine={searchParams.creditLine || searchParams.creditLineCode}
      initialTargetBank={searchParams.bank || searchParams.targetBank}
      initialPropertiesList={selectProperties}
      initialSimulationData={initialSimulationBundle?.simulationData || null}
      isFinancialModuleDisabledForOrg={isFinancialModuleDisabledForOrg}
    />
  )
}
