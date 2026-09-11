import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getProducersWithPropertiesForCredit, getCreditTemplatesList, getSavedCreditProjectData } from '@/actions/credit-projects'
import CreditProjectWizard from './credit-project-wizard'

export default async function NewCreditProjectPage({
  searchParams
}: {
  searchParams?: Promise<{ template?: string }>
}) {
  const user = await getUserContext()
  if (!user) redirect('/login')

  const resolvedSearchParams = searchParams ? await searchParams : {}

  const [producers, templates, orgOwner] = await Promise.all([
    getProducersWithPropertiesForCredit(),
    getCreditTemplatesList().then(list => list.filter(t => t.type === 'CREDIT')),
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
  const requestedTemplateCode = resolvedSearchParams?.template
  const initialTemplateCode = (requestedTemplateCode && templates.some(t => t.code === requestedTemplateCode))
    ? requestedTemplateCode
    : (templates[0]?.code || 'CHECKLIST_PROFISSIONAL')

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
      backUrl="/admin/documents/credit-projects"
      pageTitle="Gerador de Documentos & Projetos BB"
    />
  )
}
