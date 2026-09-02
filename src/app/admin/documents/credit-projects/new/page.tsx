import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getProducersWithPropertiesForCredit, getCreditTemplatesList } from '@/actions/credit-projects'
import CreditProjectWizard from './credit-project-wizard'

export default async function NewCreditProjectPage() {
  const user = await getUserContext()
  if (!user) redirect('/login')

  const [producers, templates] = await Promise.all([
    getProducersWithPropertiesForCredit(),
    getCreditTemplatesList()
  ])

  return (
    <CreditProjectWizard 
      producers={producers} 
      templates={templates} 
    />
  )
}
