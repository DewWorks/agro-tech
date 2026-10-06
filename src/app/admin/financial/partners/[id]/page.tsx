import React from 'react'
import { notFound } from 'next/navigation'
import { getPartnerCommissionSummary } from '@/actions/financial/partners'
import PartnerStatementClient from '@/components/financial/PartnerStatementClient'

import { serializeDecimals } from '@/lib/utils'

export const metadata = {
  title: 'Extrato do Parceiro Comercial | AgroTech Financeiro',
  description: 'Prestação de contas e conferência de comissões liberadas.',
}

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const res = await getPartnerCommissionSummary(id)

  if (res.error || !res.data) {
    notFound()
  }

  const safeData = serializeDecimals(res.data)
  const { partner, metrics, commissions } = safeData

  return (
    <div className="space-y-6">
      <PartnerStatementClient
        partner={partner}
        metrics={metrics}
        commissions={commissions}
      />
    </div>
  )
}
