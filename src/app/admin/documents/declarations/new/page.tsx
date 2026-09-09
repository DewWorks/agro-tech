import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getProducersWithPropertiesForCredit, getCreditTemplatesList } from '@/actions/credit-projects'
import CreditProjectWizard from '../../credit-projects/new/credit-project-wizard'

export default async function NewDeclarationPage() {
  const user = await getUserContext()
  if (!user) redirect('/login')

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
      backUrl="/admin/documents/declarations"
      pageTitle="Gerador de Declarações & Autorizações BB"
    />
  )
}
