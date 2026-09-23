import { redirect } from 'next/navigation'

interface ProducerDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProducerDetailPage(props: ProducerDetailPageProps) {
  const params = await props.params
  redirect(`/admin/crm/${params.id}/edit`)
}
