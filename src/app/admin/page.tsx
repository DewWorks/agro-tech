import React, { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  ExternalLink,
  HardDrive,
} from 'lucide-react'
import { ConfirmActionModal } from '@/components/admin/ConfirmActionModal'
import { startImpersonating } from '@/actions/impersonate'
import { toggleOrganizationStatus } from '@/actions/organizations'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { getUserContext } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Greeting from '@/components/admin/layout/Greeting'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'
import DataTableToolbar from '@/components/admin/DataTableToolbar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getHomeDashboardData } from '@/actions/home-dashboard'
import { HomeHeader } from '@/components/admin/home/HomeHeader'
import { QuickActionsGrid } from '@/components/admin/home/QuickActionsGrid'
import { DemandsOverviewColumn } from '@/components/admin/home/DemandsOverviewColumn'
import { GedHealthColumn } from '@/components/admin/home/GedHealthColumn'
import { PatrimonialSummaryFooter } from '@/components/admin/home/PatrimonialSummaryFooter'
import { HomeDashboardSkeleton } from '@/components/admin/home/HomeDashboardSkeleton'

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; branchId?: string }>
}) {
  const resolvedParams = await searchParams
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }

  const role = dbUser.role

  // 1. Visão Global SaaS: SUPER_ADMIN quando não estiver personificando uma organização cliente
  if (role === 'SUPER_ADMIN' && !dbUser.isSuperAdminImpersonating) {
    const q = resolvedParams.q || ''

    // Consultas consolidadas para os cards globais
    const [totalOrgs, docAggregate] = await Promise.all([
      prisma.organization.count(),
      prisma.document.aggregate({ _count: { id: true }, _sum: { fileSize: true } }),
    ])

    const totalBytes = docAggregate._sum.fileSize || 0
    let storageValue = '0.00'
    let storageUnit = 'MB'
    if (totalBytes > 0) {
      if (totalBytes < 1024 * 1024) {
        storageValue = (totalBytes / 1024).toFixed(2)
        storageUnit = 'KB'
      } else if (totalBytes < 1024 * 1024 * 1024) {
        storageValue = (totalBytes / (1024 * 1024)).toFixed(2)
        storageUnit = 'MB'
      } else {
        storageValue = (totalBytes / (1024 * 1024 * 1024)).toFixed(2)
        storageUnit = 'GB'
      }
    }

    // Busca de organizações
    const organizations = await prisma.organization.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' },
        ...(resolvedParams.status && resolvedParams.status !== 'TODOS'
          ? { isActive: resolvedParams.status === 'ACTIVE' }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    return (
      <div className="space-y-6">
        <PageHeaderBanner
          badge="Painel Global • AgroTech Multi-Tenant"
          badgeIcon={<Building2 className="h-4 w-4 shrink-0 text-emerald-300" />}
          title={`Olá, ${dbUser.fullName?.split(' ')[0] || 'Admin'}!`}
          description="Painel Global da AgroTech — Visão consolidada de organizações clientes, armazenamento e licenças ativas."
        />

        {/* Cards de Resumo e Gestão Global */}
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
                  Empresas cadastradas na plataforma
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/ged-global" className="block transition-transform hover:-translate-y-1">
            <Card className="h-full border hover:border-[#1B4D3E] shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1B4D3E] flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Armazenamento Global
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {storageValue} <span className="text-base font-normal text-muted-foreground">{storageUnit}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Volume total de arquivos em nuvem
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Gestão das Organizações com Toolbar e Filtro */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Organizações Clientes</h2>
          </div>

          <DataTableToolbar
            searchPlaceholder="Buscar por nome da organização..."
            filterParamName="status"
            filterOptions={[
              { label: 'Todas', value: 'TODOS' },
              {
                label: (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Ativa
                  </div>
                ),
                value: 'ACTIVE',
              },
              {
                label: (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700">
                    <AlertTriangle className="h-3 w-3" />
                    Inativa
                  </div>
                ),
                value: 'INACTIVE',
              },
            ]}
          />

          <div className="rounded-md border bg-white shadow-sm overflow-hidden">
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
                            {org.modules.map((mod) => {
                              let modColor = 'bg-gray-100 text-gray-700'
                              if (mod === 'CRM') modColor = 'bg-blue-50 text-blue-700 border border-blue-200'
                              if (mod === 'GED') modColor = 'bg-amber-50 text-amber-700 border border-amber-200'

                              return (
                                <span
                                  key={mod}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider ${modColor}`}
                                >
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
                            title={org.isActive ? 'Desativar Organização?' : 'Ativar Organização?'}
                            description={
                              org.isActive
                                ? `Tem certeza de que deseja desativar a organização ${org.name}? Todos os usuários, filiais e produtores associados perderão o acesso temporariamente.`
                                : `Deseja reativar a organização ${org.name}?`
                            }
                            triggerText=""
                            useSwitch={true}
                            isActive={org.isActive}
                            tooltip={org.isActive ? 'Desativar' : 'Ativar'}
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
                              <p>Acessar Painel</p>
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

  // 2. Validação de organização vinculada
  if (!dbUser.organizationId) {
    return (
      <div className="space-y-6">
        <div>
          <Greeting name={dbUser.fullName?.split(' ')[0] || 'Usuário'} />
          <p className="text-muted-foreground mt-1">
            Você não pertence a nenhuma organização ativa.
          </p>
        </div>
      </div>
    )
  }

  // 3. Central de Comando e Dashboard Operacional Completo
  const dashboardData = await getHomeDashboardData(resolvedParams.branchId, dbUser)

  const isOwnerOrSuperAdmin =
    role === 'OWNER' || role === 'SUPER_ADMIN' || dbUser.realRole === 'SUPER_ADMIN'

  return (
    <Suspense fallback={<HomeDashboardSkeleton />}>
      <div className="space-y-6">
        {/* Seção 1: Cabeçalho com Saudação, Data por Extenso e Contexto de Filial */}
        <HomeHeader
          userName={dbUser.fullName || undefined}
          activeBranchName={dashboardData.activeBranchName}
          branches={dashboardData.branches}
          currentBranchId={dashboardData.currentBranchId}
          isOwnerOrSuperAdmin={isOwnerOrSuperAdmin}
        />

        {/* Seção 2: Central de Ações Rápidas (Cards Coloridos e Temáticos) */}
        <QuickActionsGrid />

        {/* Seção 3: Painel Analítico Integrado (Demandas vs. GED em Duas Colunas) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <DemandsOverviewColumn metrics={dashboardData.demands} />
          <GedHealthColumn ged={dashboardData.ged} />
        </div>

        {/* Seção 4: Resumo Patrimonial do CRM e Governança */}
        <PatrimonialSummaryFooter summary={dashboardData.summary} />
      </div>
    </Suspense>
  )
}
