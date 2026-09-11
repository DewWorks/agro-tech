import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getProducersWithPropertiesForCredit, getCreditTemplatesList, getSavedCreditProjectData } from '@/actions/credit-projects'
import CreditProjectWizard from '../../credit-projects/new/credit-project-wizard'

export default async function NewDeclarationPage({
  searchParams
}: {
  searchParams?: Promise<{ template?: string }>
}) {
  const user = await getUserContext()
  if (!user) redirect('/login')

  const resolvedSearchParams = searchParams ? await searchParams : {}

  const [producers, templates, orgOwner] = await Promise.all([
    getProducersWithPropertiesForCredit(),
    getCreditTemplatesList().then(list => list.filter(t => t.type === 'LEGAL')),
    user.organizationId ? prisma.user.findFirst({
      where: {
        organizationId: user.organizationId,
        role: 'OWNER'
      },
      select: { fullName: true }
    }) : null
  ])

  const initialProducerId = producers[0]?.id
  const initialPropertyId = producers[0]?.properties?.[0]?.id
  const initialTemplateCode = resolvedSearchParams?.template || templates[0]?.code || 'AUTORIZACAO_COMPARTILHAMENTO'

  const initialSavedData = (initialProducerId && initialTemplateCode)
    ? await getSavedCreditProjectData(initialProducerId, initialPropertyId || '', initialTemplateCode)
    : null

  const defaultResponsibleName = orgOwner?.fullName || user.fullName || ''
  const defaultOrgName = user.organization?.name || ''
  const defaultOrgCnpj = user.organization?.cnpj || ''

  return (
    <CreditProjectWizard 
      producers={producers} 
      templates={templates} 
      defaultResponsibleName={defaultResponsibleName}
      defaultOrgName={defaultOrgName}
      defaultOrgCnpj={defaultOrgCnpj}
      initialTemplateCode={initialTemplateCode}
      initialSavedData={initialSavedData as any}
      backUrl="/admin/documents/declarations"
      pageTitle="Gerador de Declarações & Autorizações BB"
    />
  )
}
