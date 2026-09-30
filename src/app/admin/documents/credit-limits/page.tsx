import { redirect } from 'next/navigation'

export default async function DocumentsCreditLimitsRedirect(props: {
  searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined }
}) {
  const searchParams = (await props.searchParams) || {}
  const params = new URLSearchParams()

  for (const [key, val] of Object.entries(searchParams)) {
    if (val !== undefined) {
      params.set(key, val)
    }
  }

  const query = params.toString()
  redirect(`/admin/credit-limit${query ? `?${query}` : ''}`)
}
