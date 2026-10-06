import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getProducersWithPropertiesForCredit, getCreditTemplatesList, getSavedCreditProjectData } from '@/actions/credit-projects'
import CreditProjectWizard from './credit-project-wizard'

export default async function NewCreditProjectPage({
  searchParams
}: {
  searchParams?: Promise<{ template?: string; demandId?: string; axis?: string }>
}) {
  const user = await getUserContext()
  if (!user) redirect('/login')

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const demandId = resolvedSearchParams?.demandId

  let linkedDemand = null
  if (demandId) {
    linkedDemand = await prisma.serviceDemand.findUnique({
      where: { id: demandId },
      include: {
        producer: { select: { id: true, name: true, document: true } },
        property: { select: { id: true, name: true, city: true, state: true } },
      },
    })
  }

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

  const initialProducerId = linkedDemand?.producerId || producers[0]?.id
  const matchedProducer = producers.find(p => p.id === initialProducerId)
  const initialPropertyId = linkedDemand?.propertyId || matchedProducer?.properties?.[0]?.id

  let requestedTemplateCode = resolvedSearchParams?.template
  if (!requestedTemplateCode && linkedDemand) {
    if (linkedDemand.serviceType === 'PROJETO_CUSTEIO') {
      requestedTemplateCode = 'PROJETO_CUSTEIO_SAFRA'
    } else if (linkedDemand.serviceType === 'PROJETO_INVESTIMENTO') {
      requestedTemplateCode = 'PROJETO_RENOVAGRO'
    } else if (linkedDemand.serviceType === 'LIMITE_CREDITO') {
      requestedTemplateCode = 'LIMITE_CREDITO_BB'
    }
  }

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
      initialProducerId={initialProducerId}
      initialPropertyId={initialPropertyId}
      initialDemandId={demandId}
      linkedDemand={linkedDemand ? {
        id: linkedDemand.id,
        serviceType: linkedDemand.serviceType,
        producerId: linkedDemand.producerId,
        propertyId: linkedDemand.propertyId,
        producerName: linkedDemand.producer.name,
        propertyName: linkedDemand.property?.name,
      } : null}
      initialSavedData={initialSavedData as any}
      backUrl={demandId ? `/admin/demands/${demandId}` : '/admin/documents/credit-projects'}
      pageTitle={demandId ? `Emissão de Projeto • Demanda #${demandId.slice(-6).toUpperCase()}` : 'Gerador de Documentos & Projetos BB'}
    />
  )
}
