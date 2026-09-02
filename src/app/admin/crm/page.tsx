import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Plus, Pencil, Tractor, CheckCircle2, AlertTriangle, User, MapPin } from 'lucide-react'
import { ConfirmActionModal } from '@/components/admin/ConfirmActionModal'
import { toggleProducerStatus } from '@/actions/producers'
import DataViewContainer from '@/components/admin/DataViewContainer'
import CRMNavigationTabs from '@/components/crm/CRMNavigationTabs'
import { Card, CardContent } from '@/components/ui/card'

export default async function CRMPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined } }) {
  const searchParams = await props.searchParams || {}
  const q = searchParams.q || ''
  const status = searchParams.status || 'TODOS'
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }
  if (!dbUser || !dbUser.organizationId) {
    return <div>Organização não encontrada.</div>
  }

  // Configuração do filtro
  const whereClause: any = {
    branch: {
      organizationId: dbUser.organizationId
    }
  }

  if (q) {
    whereClause.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { document: { contains: q } }
    ]
  }

  if (status === 'ATIVO') {
    whereClause.isActive = true
  } else if (status === 'INATIVO') {
    whereClause.isActive = false
  }

  // Busca todos os produtores e contagem de propriedades
  const [producers, totalPropertiesCount] = await Promise.all([
    prisma.producer.findMany({
      where: whereClause,
      include: {
        branch: true,
        properties: {
          include: {
            property: true
          }
        },
        _count: {
          select: {
            documents: {
              where: {
                isArchived: false,
                isSuperseded: false
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.property.count({
      where: {
        branch: {
          organizationId: dbUser.organizationId
        }
      }
    })
  ])

  // Formatador de CPF/CNPJ para exibição
  const formatDoc = (doc: string, type: 'PF' | 'PJ') => {
    if (type === 'PF' && doc.length === 11) {
      return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    }
    if (type === 'PJ' && doc.length === 14) {
      return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    }
    return doc
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          CLIENTES & PROPRIEDADES · GESTÃO UNIFICADA
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
            <Tractor className="h-8 w-8" />
            Produtores Rurais
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200/60 shadow-xs">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-600" />
              Sincronizado
            </div>
          </div>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Gestão cadastral, qualificação de clientes e documentos unificados por produtor.
        </p>
      </div>

      {/* Navigation Tabs (Produtores Rurais / Propriedades Rurais) */}
      <CRMNavigationTabs
        producersCount={producers.length}
        propertiesCount={totalPropertiesCount}
      />

      {/* Unified DataViewContainer with instant client toggle & skeleton transition */}
      <DataViewContainer 
        searchPlaceholder="Buscar por Nome ou CPF/CNPJ..."
        filterOptions={[
          { label: (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ativos
            </div>
          ), value: 'ATIVO' },
          { label: (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              Inativos
            </div>
          ), value: 'INATIVO' }
        ]}
        showViewToggle={true}
        defaultView="table"
        cardsView={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {producers.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed text-center">
                <User className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <h3 className="font-semibold text-gray-800">Nenhum produtor encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Não foram encontrados produtores rurais com os filtros aplicados.
                </p>
              </div>
            ) : (
              producers.map((p) => (
                <Link 
                  key={p.id} 
                  href={`/admin/crm/${p.id}/edit`}
                  className="block group"
                >
                  <Card className="h-full bg-white hover:border-[#1B4D3E] hover:shadow-md transition-all duration-200 border rounded-2xl overflow-hidden">
                    <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="h-11 w-11 rounded-2xl bg-[#E8F5E9] flex items-center justify-center text-[#1B4D3E] group-hover:scale-110 transition-transform shadow-xs">
                          <User className="h-5 w-5 text-[#1B4D3E]" />
                        </div>
                        <Badge variant="outline" className={p.type === 'PF' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}>
                          {p.type === 'PF' ? 'PF' : 'PJ'}
                        </Badge>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#1B4D3E] transition-colors line-clamp-1">
                          {p.name}
                        </h3>
                        <p className="text-xs font-mono text-slate-500 mt-0.5">
                          {formatDoc(p.document, p.type)}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Filial: {p.branch.name}
                        </p>
                      </div>

                      <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Imóveis vinculados</span>
                          <span className="font-bold text-slate-800 font-mono flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {p.properties.length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Documentos GED</span>
                          <span className="font-bold text-blue-700 font-mono">
                            {p._count.documents}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        }
        tableView={
          <div className="rounded-xl border bg-white shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70">
                  <TableHead>Produtor</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Imóveis Vinculados</TableHead>
                  <TableHead>Documentos Vinculados</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {producers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                      Nenhum produtor cadastrado na base de dados.
                    </TableCell>
                  </TableRow>
                ) : (
                  producers.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-medium text-[#1B4D3E]">
                        <Link href={`/admin/crm/${p.id}/edit`} className="hover:underline font-semibold block">
                          {p.name}
                        </Link>
                        <div className="text-xs text-muted-foreground font-normal">
                          Filial: {p.branch.name}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{formatDoc(p.document, p.type)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={p.type === 'PF' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}>
                          {p.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{p.phone || '-'}</div>
                        <div className="text-xs text-muted-foreground">{p.email || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {p.properties.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono bg-blue-50 text-blue-700 hover:bg-blue-100">
                          {p._count.documents}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.isActive ? 'default' : 'secondary'} className={p.isActive ? 'bg-green-600 hover:bg-green-700' : ''}>
                          {p.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <ConfirmActionModal
                          title={p.isActive ? "Desativar Produtor?" : "Ativar Produtor?"}
                          description={p.isActive 
                            ? `Tem a certeza que deseja desativar o cadastro de ${p.name}? Projetos atrelados podem ser bloqueados.` 
                            : `Deseja reativar o cadastro de ${p.name}?`
                          }
                          triggerText=""
                          useSwitch={true}
                          isActive={p.isActive}
                          tooltip={p.isActive ? "Desativar" : "Ativar"}
                          action={async () => {
                            'use server'
                            return await toggleProducerStatus(p.id, !p.isActive)
                          }}
                          successMessage={`Produtor ${p.isActive ? 'desativado' : 'ativado'} com sucesso!`}
                          actionLabel="Confirmar"
                          actionVariant={p.isActive ? 'destructive' : 'default'}
                        />
                        <Tooltip>
                          <TooltipTrigger render={<Link href={`/admin/crm/${p.id}/edit`} />}>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Editar</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        }
      />
    </div>
  )
}
