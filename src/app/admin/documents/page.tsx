import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import DocumentsClient from './documents-client'
import { getDocumentTree, listDocuments } from '@/actions/documents'

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
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Documentos (GED)
        </h1>
        <p className="text-muted-foreground mt-2">
          Gestão Eletrônica de Documentos — Armazenamento seguro, semáforo de validades e herança documental.
        </p>
      </div>

      {/* Client-side Split View */}
      <DocumentsClient
        initialTree={treeData || []}
        initialDocuments={docsData || []}
      />
    </div>
  )
}
