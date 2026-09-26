import { getUserContext } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { FileText, Folder } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import ProducerDocumentsSection from '@/components/ged/ProducerDocumentsSection'
import VirtualFolderSidebar from '@/components/ged/VirtualFolderSidebar'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'

export default async function GedExplorerPage({
  searchParams
}: {
  searchParams: Promise<{ folderId?: string, q?: string }>
}) {
  const resolvedParams = await searchParams
  const dbUser = await getUserContext()
  if (!dbUser?.organizationId) redirect('/admin')

  // Fetch all producers for the virtual folders
  const producers = await prisma.producer.findMany({
    where: { 
      branch: { organizationId: dbUser.organizationId }
    },
    select: {
      id: true,
      name: true,
      branchId: true,
      isActive: true,
      _count: {
        select: { documents: true }
      }
    },
    orderBy: { name: 'asc' }
  })

  const selectedFolderId = resolvedParams.folderId || (producers.length > 0 ? producers[0].id : undefined)
  const selectedProducer = producers.find(p => p.id === selectedFolderId)

  return (
    <div className="space-y-6">
      {/* Top Header Padronizado */}
      <PageHeaderBanner
        badge="GED Enterprise • Pastas Virtuais"
        badgeIcon={<Folder className="h-4 w-4 shrink-0 text-emerald-300" />}
        title="Explorador de Arquivos"
        description="Navegue pelas pastas virtuais de cada produtor e gerencie os seus documentos centralizadamente."
      />

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Sidebar - Pastas Virtuais (Componente Client-side com Busca) */}
        <VirtualFolderSidebar 
          producers={producers} 
          selectedFolderId={selectedFolderId} 
        />

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {selectedFolderId ? (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[#1B4D3E]">
                  <Folder className="h-5 w-5" />
                  <h2 className="font-semibold text-lg">{selectedProducer?.name}</h2>
                </div>
              </div>
              
              <ProducerDocumentsSection 
                producerId={selectedFolderId}
                branchId={selectedProducer?.branchId || ''}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg border shadow-sm p-12 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Selecione uma pasta à esquerda para ver os documentos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
