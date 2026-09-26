import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HardDrive, FileText, Download } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'

export default async function GlobalGedDashboardPage() {
  const dbUser = await getUserContext()

  if (!dbUser || dbUser.role !== 'SUPER_ADMIN') {
    redirect('/admin')
  }

  // Estatísticas globais
  const [totalOrgs, docAggregate, allDocuments] = await Promise.all([
    prisma.organization.count(),
    prisma.document.aggregate({ _count: { id: true }, _sum: { fileSize: true } }),
    prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        branch: {
          include: {
            organization: true
          }
        }
      },
      take: 100 // Limite de 100 para não estourar a memória na lista inicial
    })
  ])

  const totalDocs = docAggregate._count.id
  const totalBytes = docAggregate._sum.fileSize || 0
  let storageValue = "0.00"
  let storageUnit = "MB"
  
  if (totalBytes > 0) {
    if (totalBytes < 1024 * 1024) {
      storageValue = (totalBytes / 1024).toFixed(2)
      storageUnit = "KB"
    } else if (totalBytes < 1024 * 1024 * 1024) {
      storageValue = (totalBytes / (1024 * 1024)).toFixed(2)
      storageUnit = "MB"
    } else {
      storageValue = (totalBytes / (1024 * 1024 * 1024)).toFixed(2)
      storageUnit = "GB"
    }
  }

  // Função para formatar o tamanho do arquivo na tabela
  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "0 B"
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB"
    return (bytes / 1048576).toFixed(2) + " MB"
  }

  return (
    <div className="space-y-6">
      {/* Top Header Padronizado */}
      <PageHeaderBanner
        badge="SaaS Multi-Tenant • Armazenamento Global"
        badgeIcon={<HardDrive className="h-4 w-4 shrink-0 text-emerald-300" />}
        title="Painel Global GED"
        description="Visão consolidada do armazenamento e documentos de todos os clientes."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="h-full border shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1B4D3E] flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Volume de Storage Consumido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{storageValue} <span className="text-base font-normal">{storageUnit}</span></div>
            <p className="text-xs text-muted-foreground mt-1">Espaço utilizado por todos os ficheiros</p>
          </CardContent>
        </Card>

        <Card className="h-full border shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1B4D3E] flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total de Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalDocs}</div>
            <p className="text-xs text-muted-foreground mt-1">Documentos processados pelo GED</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-[#1B4D3E]">Documentos Recentes (Global)</h2>
        
        <div className="rounded-md border bg-white shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead>Arquivo</TableHead>
                <TableHead>Organização / Filial</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Data de Geração</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhum documento gerado ainda na plataforma.
                  </TableCell>
                </TableRow>
              ) : (
                allDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-600" />
                        <span className="truncate max-w-[250px]" title={doc.fileName}>{doc.fileName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-800">{doc.branch.organization.name}</span>
                        <span className="text-xs text-gray-500">{doc.branch.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {formatBytes(doc.fileSize)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {format(new Date(doc.createdAt), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {doc.documentType.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
