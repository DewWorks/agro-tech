import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import DocumentsClient from './documents-client'
import { getDocumentTree, listDocuments } from '@/actions/documents'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'

export default async function DocumentsPage() {
  const dbUser = await getUserContext()

  if (!dbUser) redirect('/login')
  if (!dbUser.organizationId) {
    return <div>Organização não encontrada.</div>
  }

  // Buscar dados iniciais no servidor
  const [treeResult, docsResult] = await Promise.all([
    getDocumentTree(),
    listDocuments({}),
  ])

  const treeData = treeResult.success ? treeResult.data : []
  const docsData = docsResult.success ? docsResult.data : []

  return (
    <div className="space-y-6">
      {/* Page Header Padronizado */}
      <PageHeaderBanner
        badge="GED Enterprise • Gestão Documental"
        badgeIcon={<FileText className="h-4 w-4 shrink-0 text-emerald-300" />}
        title="Documentos (GED)"
        description="Gestão Eletrônica de Documentos — Armazenamento seguro, semáforo de validades e herança documental."
      />

      {/* Client-side Split View */}
      <DocumentsClient
        initialTree={treeData || []}
        initialDocuments={docsData || []}
      />
    </div>
  )
}
