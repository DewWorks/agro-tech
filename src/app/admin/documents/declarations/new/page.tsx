import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getProducersWithPropertiesForCredit, getCreditTemplatesList, getSavedCreditProjectData } from '@/actions/credit-projects'
import CreditProjectWizard from '../../credit-projects/new/credit-project-wizard'

export default async function NewDeclarationPage({
  searchParams
}: {
  searchParams?: Promise<{ template?: string; category?: string }>
}) {
  const user = await getUserContext()
  if (!user) redirect('/login')

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const categoryParam = resolvedSearchParams?.category

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

  // Determinar template inicial baseado no parâmetro de rota ou na categoria selecionada no card mestre
  let defaultTemplateCode = 'AUTORIZACAO_SCR'
  if (categoryParam) {
    if (categoryParam.includes('compliance') || categoryParam.includes('bancario')) {
      defaultTemplateCode = 'AUTORIZACAO_SCR'
    } else if (categoryParam.includes('ambiental') || categoryParam.includes('fundiaria')) {
      defaultTemplateCode = 'DECLARACAO_REGULARIDADE_AMBIENTAL'
    } else if (categoryParam.includes('social') || categoryParam.includes('garantias')) {
      defaultTemplateCode = 'ENQUADRAMENTO_CAF'
    }
  }

  const initialProducerId = producers[0]?.id
  const initialPropertyId = producers[0]?.properties?.[0]?.id
  const initialTemplateCode = resolvedSearchParams?.template || defaultTemplateCode

  const initialSavedData = (initialProducerId && initialTemplateCode)
    ? await getSavedCreditProjectData(initialProducerId, initialPropertyId || '', initialTemplateCode)
    : null

  const activeOrgId = user.organizationId || user.organization?.id
  const activeOrg = activeOrgId
    ? (await prisma.organization.findUnique({ where: { id: activeOrgId } })) || user.organization
    : user.organization

  const defaultResponsibleName = orgOwner?.fullName || user.fullName || ''
  const defaultOrgName = activeOrg?.tradeName || activeOrg?.name || 'DevWorks'
  const defaultOrgCnpj = activeOrg?.cnpj || ''

  const { resolveOrganizationLogoBase64 } = await import('@/lib/pdf/resolve-branding')
  const logoHorizontalBase64 = await resolveOrganizationLogoBase64(activeOrg?.logoHorizontalUrl)

  const organizationData = activeOrg ? {
    id: activeOrg.id,
    name: activeOrg.name,
    tradeName: activeOrg.tradeName,
    cnpj: activeOrg.cnpj,
    logoHorizontalUrl: activeOrg.logoHorizontalUrl,
    logoHorizontalBase64,
    primaryColorHex: activeOrg.primaryColorHex || '#050E94',
    accentColorHex: activeOrg.accentColorHex || '#FFAC00',
    ownerName: defaultResponsibleName
  } : null

  return (
    <CreditProjectWizard 
      producers={producers} 
      templates={templates} 
      defaultResponsibleName={defaultResponsibleName}
      defaultOrgName={defaultOrgName}
      defaultOrgCnpj={defaultOrgCnpj}
      organization={organizationData}
      initialTemplateCode={initialTemplateCode}
      initialSavedData={initialSavedData as any}
      backUrl="/admin/documents/declarations"
      pageTitle="Documento e Declarações legais"
      initialCategory={categoryParam}
    />
  )
}
