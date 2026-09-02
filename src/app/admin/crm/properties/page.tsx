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
import { MapPin, Plus, Pencil, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'
import DataViewContainer, { FilterOption } from '@/components/admin/DataViewContainer'
import CRMNavigationTabs from '@/components/crm/CRMNavigationTabs'
import PropertyCardGrid from '@/components/crm/PropertyCardGrid'

export default async function PropertiesPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined }
}) {
  const searchParams = await props.searchParams || {}
  const q = searchParams.q || ''
  const branchFilter = searchParams.branchId || 'TODOS'
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }
  if (!dbUser.organizationId) {
    return <div>Organização não encontrada.</div>
  }

  // Obter filiais permitidas do usuário
  let userBranches: any[] = []
  if (dbUser.role === 'OWNER' || dbUser.role === 'ADMIN' || dbUser.realRole === 'SUPER_ADMIN') {
    userBranches = await prisma.branch.findMany({
      where: { organizationId: dbUser.organizationId },
      orderBy: { name: 'asc' }
    })
  } else {
    const userBranchesData = await prisma.userBranch.findMany({
      where: { userId: dbUser.id },
      include: { branch: true }
    })
    userBranches = userBranchesData.map(ub => ub.branch)
  }

  const allowedBranchIds = userBranches.map(b => b.id)

  // Configuração do filtro
  const whereClause: any = {
    branch: {
      organizationId: dbUser.organizationId,
      id: { in: allowedBranchIds }
    }
  }

  if (branchFilter && branchFilter !== 'TODOS') {
    whereClause.branchId = branchFilter
  }

  if (q) {
    whereClause.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { propertyName: { contains: q, mode: 'insensitive' } },
      { city: { contains: q, mode: 'insensitive' } },
      { state: { contains: q, mode: 'insensitive' } },
      { car: { contains: q, mode: 'insensitive' } },
      { registrationNumber: { contains: q, mode: 'insensitive' } },
      { explorationActivity: { contains: q, mode: 'insensitive' } },
      {
        producers: {
          some: {
            producer: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { document: { contains: q } }
              ]
            }
          }
        }
      }
    ]
  }

  // Contadores globais para as abas
  const [properties, producersCount, totalPropertiesCount] = await Promise.all([
    prisma.property.findMany({
      where: whereClause,
      include: {
        branch: true,
        producers: {
          include: {
            producer: true
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
    prisma.producer.count({
      where: {
        branch: {
          organizationId: dbUser.organizationId,
          id: { in: allowedBranchIds }
        }
      }
    }),
    prisma.property.count({
      where: {
        branch: {
          organizationId: dbUser.organizationId,
          id: { in: allowedBranchIds }
        }
      }
    })
  ])

  // Formatador de Documento CPF/CNPJ
  const formatDoc = (doc: string, type: 'PF' | 'PJ') => {
    if (!doc) return '-'
    if (type === 'PF' && doc.length === 11) {
      return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    }
    if (type === 'PJ' && doc.length === 14) {
      return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    }
    return doc
  }

  // Formatador do tipo de vínculo
  const formatOwnership = (type: string) => {
    const map: Record<string, string> = {
      PROPRIETARIO: 'Proprietário(a)',
      ARRENDATARIO: 'Arrendatário(a)',
      MEEIRO: 'Meeiro(a)',
      COMODATARIO: 'Comodatário(a)',
      CONDOMINO: 'Condômino(a)'
    }
    return map[type] || type
  }

  const branchFilterOptions: FilterOption[] = userBranches.map(b => ({
    label: b.name,
    value: b.id
  }))

  const currentBranchName = branchFilter !== 'TODOS'
    ? userBranches.find(b => b.id === branchFilter)?.name
    : (userBranches.length === 1 ? userBranches[0].name : 'GLOBAL')

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          CLIENTES & PROPRIEDADES · UNIDADE {currentBranchName}
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
            <MapPin className="h-8 w-8" />
            Propriedades Rurais
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200/60 shadow-xs">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-600" />
              Sincronizado
            </div>
          </div>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Gestão e controle fundiário, cartorário, rebanho e documentos vinculados a cada imóvel.
        </p>
      </div>

      {/* Navigation Tabs (Produtores Rurais / Propriedades Rurais) */}
      <CRMNavigationTabs
        producersCount={producersCount}
        propertiesCount={totalPropertiesCount}
        branchName={currentBranchName}
      />

      {/* Unified DataViewContainer with instant client toggle & skeleton transition */}
      <DataViewContainer
        searchPlaceholder="Buscar produtor, CPF ou fazenda..."
        extraFilters={userBranches.length > 1 ? [
          {
            paramName: 'branchId',
            placeholder: 'Filtrar por Filial...',
            options: branchFilterOptions,
            defaultValue: 'TODOS'
          }
        ] : undefined}
        showViewToggle={true}
        defaultView="table"
        cardsView={<PropertyCardGrid properties={properties as any} />}
        tableView={
          <div className="rounded-xl border bg-white shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70">
                  <TableHead className="font-semibold text-slate-700">Propriedade / Imóvel</TableHead>
                  <TableHead className="font-semibold text-slate-700">Titular Vinculado</TableHead>
                  <TableHead className="font-semibold text-slate-700">Áreas (ha)</TableHead>
                  <TableHead className="font-semibold text-slate-700">Matrícula & CAR</TableHead>
                  <TableHead className="font-semibold text-slate-700">Atividade / Rebanho</TableHead>
                  <TableHead className="font-semibold text-slate-700">Documentos</TableHead>
                  <TableHead className="font-semibold text-slate-700">Filial</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-40 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <MapPin className="h-8 w-8 text-muted-foreground/40 mb-1" />
                        <p className="font-medium">Nenhuma propriedade cadastrada na base de dados.</p>
                        <p className="text-xs text-muted-foreground">Clique em &quot;Nova Propriedade&quot; para cadastrar o primeiro imóvel.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  properties.map((p) => {
                    const mainProducerLink = p.producers?.[0]
                    const mainProducer = mainProducerLink?.producer
                    const locationStr = [p.city, p.state].filter(Boolean).join('/') || 'Não informada'
                    const livestock = p.livestock as any || {}
                    const totalAreaStr = p.totalArea > 0 ? `${p.totalArea} ha` : (p.pastureArea > 0 ? `${p.pastureArea} ha` : '-')

                    return (
                      <TableRow key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Propriedade */}
                        <TableCell className="font-medium text-[#1B4D3E]">
                          <Link 
                            href={`/admin/crm/properties/${p.id}/edit`}
                            className="hover:underline font-semibold block"
                          >
                            {p.name || p.propertyName || 'Propriedade Rural'}
                          </Link>
                          <div className="text-xs text-muted-foreground font-normal flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {locationStr}
                          </div>
                        </TableCell>

                        {/* Titular Vinculado */}
                        <TableCell>
                          {mainProducer ? (
                            <div>
                              <Link 
                                href={`/admin/crm/${mainProducer.id}/edit`}
                                className="font-medium text-slate-800 hover:text-[#1B4D3E] hover:underline"
                              >
                                {mainProducer.name}
                              </Link>
                              <div className="text-xs text-muted-foreground font-mono">
                                {formatDoc(mainProducer.document, mainProducer.type as any)}
                              </div>
                              <div className="mt-1">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50 text-slate-600 border-slate-200">
                                  {formatOwnership(mainProducerLink.ownershipType)}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Sem produtor vinculado
                            </span>
                          )}
                        </TableCell>

                        {/* Áreas */}
                        <TableCell>
                          <div className="text-sm font-semibold font-mono text-slate-800">
                            {totalAreaStr}
                          </div>
                          {p.pastureArea > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Pastagem: {p.pastureArea} ha
                            </div>
                          )}
                        </TableCell>

                        {/* Matrícula & CAR */}
                        <TableCell>
                          {p.registrationNumber && (
                            <div className="text-xs font-mono text-slate-700">
                              Matrícula: {p.registrationNumber}
                            </div>
                          )}
                          {p.car ? (
                            <div className="text-xs text-slate-500 font-mono truncate max-w-[140px]" title={p.car}>
                              CAR: {p.car}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Atividade / Rebanho */}
                        <TableCell>
                          <div className="text-sm text-slate-800">
                            {p.explorationActivity || 'Não informada'}
                          </div>
                          {livestock.totalHeadCount ? (
                            <div className="text-xs text-muted-foreground font-medium">
                              {livestock.totalHeadCount} cabeças
                            </div>
                          ) : null}
                        </TableCell>

                        {/* Documentos */}
                        <TableCell>
                          <Badge variant="secondary" className="font-mono bg-blue-50 text-blue-700 hover:bg-blue-100">
                            <FileText className="h-3 w-3 mr-1" />
                            {p._count.documents}
                          </Badge>
                        </TableCell>

                        {/* Filial */}
                        <TableCell className="text-xs text-slate-600 font-medium">
                          {p.branch.name}
                        </TableCell>

                        {/* Ações */}
                        <TableCell className="text-right space-x-1">
                          <Tooltip>
                            <TooltipTrigger render={<Link href={`/admin/crm/properties/${p.id}/edit`} />}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Editar Propriedade</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>

                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        }
      />

    </div>
  )
}
