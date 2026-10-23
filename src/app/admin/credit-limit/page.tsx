import React from 'react'
import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/auth'
import {
  getCreditLimitPortfolioData,
  getPropertiesForCreditLimitSelect,
  getSimulationInitialBundle,
} from '@/actions/credit-limit'
import { CreditLimitContainer } from '@/components/credit-limit/CreditLimitContainer'
import { parseUrlAmount } from '@/lib/utils/formatters'

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
  const isOrgCreditLimitEnabled = (user.organization?.modules || []).includes(
    'CREDIT_LIMIT'
  )
  const hasCreditLimitModule = isSuperAdmin || isOrgCreditLimitEnabled
  const isCreditLimitModuleDisabledForOrg = isSuperAdmin && !isOrgCreditLimitEnabled

  // Bloqueio rigoroso: se usuário comum não possui CREDIT_LIMIT, redireciona
  if (!hasCreditLimitModule) {
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
      initialAmount={searchParams.amount ? (parseUrlAmount(searchParams.amount) || undefined) : undefined}
      initialCreditLine={searchParams.creditLine || searchParams.creditLineCode}
      initialTargetBank={searchParams.bank || searchParams.targetBank}
      initialPropertiesList={selectProperties}
      initialSimulationData={initialSimulationBundle?.simulationData || null}
      isFinancialModuleDisabledForOrg={isCreditLimitModuleDisabledForOrg}
    />
  )
}
