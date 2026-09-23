import { redirect } from 'next/navigation'

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PropertyDetailPage(props: PropertyDetailPageProps) {
  const params = await props.params
  redirect(`/admin/crm/properties/${params.id}/edit`)
}
