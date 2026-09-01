import { Metadata } from 'next'
import { DeclarationsClient } from './DeclarationsClient'
import { getMinutasRepository, getProducersForDropdown } from '@/actions/legal-documents'
import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Declarações Legais | AgroTech',
}

export default async function DeclarationsPage() {
  const user = await getUserContext()
  if (!user) redirect('/login')

  let branchName = 'GLOBAL'
  if (user.branchId) {
    const b = await prisma.branch.findUnique({ where: { id: user.branchId }})
    if (b) branchName = b.name
  }

  const producers = await getProducersForDropdown()
  const templates = await getMinutasRepository()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Declarações Legais
          </h1>
          <p className="text-muted-foreground mt-2">
            Emissão automatizada de minutas e dossiês legais (Unidade: {branchName.toUpperCase()}).
          </p>
        </div>
      </div>

      <DeclarationsClient 
        producers={producers} 
        templates={templates} 
      />
    </div>
  )
}
