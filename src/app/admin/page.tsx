import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tractor, Users as UsersIcon, Building2, FolderTree, FileText, Plus, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, Settings2, HardDrive, Pencil, ExternalLink } from 'lucide-react'
import { ConfirmActionModal } from '@/components/admin/ConfirmActionModal'
import { startImpersonating } from '@/actions/impersonate'
import { toggleOrganizationStatus } from '@/actions/organizations'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { getUserContext } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from "next/link"
import Greeting from '@/components/admin/layout/Greeting'
import { calculateDocumentStatus } from '@/lib/ged/semaphore'
import DataTableToolbar from "@/components/admin/DataTableToolbar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const resolvedParams = await searchParams
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }

  const role = dbUser.role

  if (role === 'SUPER_ADMIN') {
    const q = resolvedParams.q || ''
    
    // Fetch data for cards
    const [totalOrgs, docAggregate] = await Promise.all([
      prisma.organization.count(),
      prisma.document.aggregate({ _count: { id: true }, _sum: { fileSize: true } })
    ])
    
    // Format storage size
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

        // Fetch organizations for table
    const organizations = await prisma.organization.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' },
        ...(resolvedParams.status && resolvedParams.status !== 'TODOS' 
            ? { isActive: resolvedParams.status === 'ACTIVE' } 
            : {})
      },
      orderBy: { createdAt: 'desc' }
    })

    return (
      <div className="space-y-6">
        <div>
          <Greeting name={dbUser.fullName?.split(' ')[0] || 'Admin'} />
          <p className="text-muted-foreground mt-1">
            Painel Global SaaS da AgroTech
          </p>
        </div>

        {/* Cards de Resumo e Gestão */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/admin/organizations" className="block transition-transform hover:-translate-y-1">
            <Card className="h-full border hover:border-[#1B4D3E] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1B4D3E] flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Organizações Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalOrgs}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Empresas ativas na plataforma
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="h-full border hover:border-[#1B4D3E] shadow-sm transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#1B4D3E] flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Volume de Documentos (GED)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-3xl font-bold">{totalDocs}</div>
                  <p className="text-xs text-muted-foreground mt-1">Ficheiros</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-amber-600">{storageValue} <span className="text-base font-normal">{storageUnit}</span></div>
                  <p className="text-xs text-muted-foreground mt-1">Storage Utilizado</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Link href="/admin/modules" className="block transition-transform hover:-translate-y-1 h-full">
            <Card className="h-full hover:shadow-md transition-all cursor-pointer bg-slate-50 border-slate-200">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center text-[#1B4D3E]">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Gestão de Módulos Globais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium text-[#1B4D3E]">Feature Flags</div>
                <p className="text-xs text-muted-foreground mt-1">Controlar ativação/desativação de módulos para todo o ecossistema SaaS.</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Listagem de Organizações */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-[#1B4D3E]">Organizações na Plataforma</h2>
          </div>
          
          <DataTableToolbar 
            searchPlaceholder="Buscar organização por nome..."
            filterOptions={[
              { label: (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Ativa
                </div>
              ), value: 'ACTIVE' },
              { label: (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700">
                  <AlertTriangle className="h-3 w-3" />
                  Inativa
                </div>
              ), value: 'INACTIVE' }
            ]}
          />

          <div className="rounded-md border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>Organização</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Módulos Ativos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhuma organização encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  organizations.map((org) => {
                    const impersonate = startImpersonating.bind(null, org.id)
                    return (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium text-[#1B4D3E]">{org.name}</TableCell>
                        <TableCell className="text-muted-foreground">{org.cnpj || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1.5 flex-wrap">
                            {org.modules.map(mod => {
                              let modColor = "bg-gray-100 text-gray-700"
                              if (mod === 'CRM') modColor = "bg-blue-50 text-blue-700 border border-blue-200"
                              if (mod === 'GED') modColor = "bg-amber-50 text-amber-700 border border-amber-200"
                              
                              return (
                                <span key={mod} className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider ${modColor}`}>
                                  {mod}
                                </span>
                              )
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {org.isActive ? (
                            <span className="bg-green-50 border border-green-200 text-green-700 px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center w-fit gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Ativa
                            </span>
                          ) : (
                            <span className="bg-red-50 border border-red-200 text-red-700 px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center w-fit gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Inativa
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right flex items-center justify-end gap-1">
                          <ConfirmActionModal
                            title={org.isActive ? "Desativar Organização?" : "Ativar Organização?"}
                            description={org.isActive 
                              ? `Tem a certeza que deseja desativar a organização ${org.name}? Todos os utilizadores, filiais e produtores associados perderão o acesso.` 
                              : `Deseja reativar a organização ${org.name}?`
                            }
                            triggerText=""
                            useSwitch={true}
                            isActive={org.isActive}
                            tooltip={org.isActive ? "Desativar" : "Ativar"}
                            action={async () => {
                              'use server'
                              return await toggleOrganizationStatus(org.id, !org.isActive)
                            }}
                            successMessage={`Organização ${org.isActive ? 'desativada' : 'ativada'} com sucesso!`}
                            actionLabel="Confirmar"
                            actionVariant={org.isActive ? 'destructive' : 'default'}
                          />
                          <Tooltip>
                            <TooltipTrigger render={<Link href={`/admin/organizations/${org.id}/edit`} />}>
                              <Button size="icon" variant="ghost">
                                <Pencil className="h-4 w-4 text-blue-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Editar</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger render={<form action={impersonate} />}>
                              <Button type="submit" size="icon" variant="ghost">
                                <ExternalLink className="h-4 w-4 text-[#1B4D3E]" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Aceder Painel</p>
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
        </div>
      </div>
    )
  }

  if (!dbUser.organizationId) {
    return (
      <div className="space-y-6">
        <div>
          <Greeting name={dbUser.fullName?.split(' ')[0] || 'Utilizador'} />
          <p className="text-muted-foreground mt-1">
            Você não pertence a nenhuma organização.
          </p>
        </div>
      </div>
    )
  }

  // Buscar dados reais para o Dashboard Operacional
  const [producersCount, propertiesCount, branchesCount, usersCount, documents] = await Promise.all([
    prisma.producer.count({ where: { branch: { organizationId: dbUser.organizationId }, isActive: true } }),
    prisma.property.count({ where: { branch: { organizationId: dbUser.organizationId } } }),
    prisma.branch.count({ where: { organizationId: dbUser.organizationId, isActive: true } }),
    prisma.user.count({ where: { organizationId: dbUser.organizationId, isActive: true } }),
    prisma.document.findMany({ 
      where: { branch: { organizationId: dbUser.organizationId }, isArchived: false, isSuperseded: false },
      select: { expirationDate: true, documentType: true }
    })
  ])

  let validCount = 0
  let alertCount = 0
  let expiredCount = 0
  
  documents.forEach(doc => {
    const status = calculateDocumentStatus(doc.expirationDate, doc.documentType)
    if (status === 'VALIDO') validCount++
    if (status === 'ALERTA') alertCount++
    if (status === 'VENCIDO') expiredCount++
  })

  return (
    <div className="space-y-8">
      <div>
        <Greeting name={dbUser.fullName?.split(' ')[0] || 'Utilizador'} />
        <p className="text-muted-foreground mt-1">
          Painel Operacional
        </p>
      </div>

      {/* Ações Rápidas */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/crm/new" className="flex flex-col items-center justify-center p-4 bg-[#1B4D3E] text-white rounded-lg hover:bg-[#1B4D3E]/90 transition-colors shadow-sm gap-2">
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Novo Produtor</span>
          </Link>
          <Link href="/admin/crm" className="flex flex-col items-center justify-center p-4 bg-[#1B4D3E] text-white rounded-lg hover:bg-[#1B4D3E]/90 transition-colors shadow-sm gap-2">
            <Tractor className="h-6 w-6" />
            <span className="text-sm font-medium">Ver CRM</span>
          </Link>
          <Link href="/admin/ged/explorer" className="flex flex-col items-center justify-center p-4 bg-[#1B4D3E] text-white rounded-lg hover:bg-[#1B4D3E]/90 transition-colors shadow-sm gap-2">
            <FolderTree className="h-6 w-6" />
            <span className="text-sm font-medium">GED Explorador</span>
          </Link>
          <Link href="/admin/ged/semaphore" className="flex flex-col items-center justify-center p-4 bg-[#1B4D3E] text-white rounded-lg hover:bg-[#1B4D3E]/90 transition-colors shadow-sm gap-2">
            <ShieldAlert className="h-6 w-6" />
            <span className="text-sm font-medium">Semáforo</span>
          </Link>
        </div>
      </div>

      {/* Cards de Módulos */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Resumo dos Módulos</h2>
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* CRM Card */}
          <Link href="/admin/crm" className="block transition-transform hover:-translate-y-1">
            <Card className="h-full border hover:border-[#1B4D3E] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1B4D3E] flex items-center gap-2">
                  <Tractor className="h-4 w-4" />
                  CRM e Cadastro Único
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8 mb-4">
                  <div>
                    <div className="text-3xl font-bold">{producersCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">Produtores ativos</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{propertiesCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">Imóveis mapeados</p>
                  </div>
                </div>
                <div className="flex items-center text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full w-fit">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Sincronizado
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* GED Card */}
          <Link href="/admin/ged/semaphore" className="block transition-transform hover:-translate-y-1">
            <Card className="h-full border hover:border-[#1B4D3E] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1B4D3E] flex items-center gap-2">
                  <FolderTree className="h-4 w-4" />
                  GED Inteligente e Validades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-600"></div>
                      {expiredCount}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase">Vencidas</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600 flex items-center justify-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-amber-600"></div>
                      {alertCount}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase">A Vencer</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-600"></div>
                      {validCount}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase">Válidas</p>
                  </div>
                </div>
                {expiredCount > 0 ? (
                  <div className="flex items-center text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-full w-fit">
                    <ShieldAlert className="h-3 w-3 mr-1" />
                    {expiredCount} documento{expiredCount > 1 ? 's' : ''} requer{expiredCount > 1 ? 'em' : ''} atenção
                  </div>
                ) : (
                  <div className="flex items-center text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full w-fit">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Nenhuma pendência crítica
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Filiais e Utilizadores */}
          <Link href="/admin/branches" className="block transition-transform hover:-translate-y-1">
            <Card className="h-full border hover:border-[#1B4D3E] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1B4D3E] flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Estrutura e Acessos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8 mb-4">
                  <div>
                    <div className="text-3xl font-bold">{branchesCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">Filiais</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{usersCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">Utilizadores</p>
                  </div>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  Gerir acessos e permissões <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

        </div>
      </div>
    </div>
  )
}
