import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users } from "lucide-react"
import Link from "next/link"
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let role = 'OPERATOR'
  let totalOrgs = 0

  if (user) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (dbUser) {
      role = dbUser.role
    }
  }

  if (role === 'SUPER_ADMIN') {
    totalOrgs = await prisma.organization.count()
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E]">Painel Global SaaS</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao centro de controlo de assinantes AgroTech.
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
        <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E]">Visão Geral</h1>
        <p className="text-muted-foreground">
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
              <CardTitle className="text-sm font-medium">Usuários e Permissões</CardTitle>
              <Users className="h-4 w-4 text-[#1B4D3E]" />
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
