import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tractor, Users as UsersIcon, Building2, FolderTree, FileText, Plus, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { getUserContext } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from "next/link"
import Greeting from '@/components/admin/layout/Greeting'
import { calculateDocumentStatus } from '@/lib/ged/semaphore'

export default async function AdminDashboardPage() {
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }

  const role = dbUser.role
  let totalOrgs = 0

  if (role === 'SUPER_ADMIN') {
    totalOrgs = await prisma.organization.count()
    
    return (
      <div className="space-y-6">
        <div>
          <Greeting name={dbUser.fullName?.split(' ')[0] || 'Admin'} />
          <p className="text-muted-foreground mt-1">
            Bem-vindo ao Painel Global SaaS da AgroTech.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/organizations" className="block transition-transform hover:scale-105">
            <Card className="hover:border-[#1B4D3E] transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Organizações Clientes</CardTitle>
                <Building2 className="h-4 w-4 text-[#1B4D3E]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrgs}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Empresas cadastradas no sistema
                </p>
              </CardContent>
            </Card>
          </Link>
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
