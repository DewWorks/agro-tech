import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tractor, Users as UsersIcon, Building2, MapPin, ExternalLink } from 'lucide-react'
import { getUserContext } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from "next/link"
import Greeting from '@/components/admin/layout/Greeting'

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

  return (
    <div className="space-y-6">
      <div>
        <Greeting name={dbUser.fullName?.split(' ')[0] || 'Utilizador'} />
        <p className="text-muted-foreground mt-1">
          Bem-vindo ao Painel de Administração da AgroTech.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/branches" className="block transition-transform hover:scale-105">
          <Card className="hover:border-[#1B4D3E] transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gestão de Filiais</CardTitle>
              <Building2 className="h-4 w-4 text-[#1B4D3E]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Módulo</div>
              <p className="text-xs text-muted-foreground mt-1">
                Gerenciar unidades e pólos
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users" className="block transition-transform hover:scale-105">
          <Card className="hover:border-[#1B4D3E] transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Utilizadores Ativos
              </CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Módulo</div>
              <p className="text-xs text-muted-foreground mt-1">
                Controle de acesso e papéis
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
