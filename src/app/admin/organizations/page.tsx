import { getOrganizations } from '@/actions/organizations'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function OrganizationsPage() {
  const organizations = await getOrganizations()

  const formatCnpj = (cnpj: string) => {
    if (cnpj.length === 14) {
      return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    }
    return cnpj
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Organizações Clientes
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestão global de assinantes e empresas do SaaS.
          </p>
        </div>
        <Link href="/admin/organizations/new">
          <Button className="bg-[#1B4D3E] hover:bg-[#13382D]">
            <Plus className="mr-2 h-4 w-4" /> Nova Organização
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Owner (Principal)</TableHead>
              <TableHead>Filiais</TableHead>
              <TableHead>Utilizadores</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                  Nenhuma organização cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => {
                const owner = org.users[0]
                return (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium text-[#1B4D3E]">
                      {org.name}
                    </TableCell>
                    <TableCell>{formatCnpj(org.cnpj)}</TableCell>
                    <TableCell>
                      {owner ? (
                        <div>
                          <div className="text-sm font-medium">{owner.fullName}</div>
                          <div className="text-xs text-muted-foreground">{owner.email}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">Sem Owner</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {org._count.branches}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {org._count.users}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={org.isActive ? 'default' : 'secondary'} className={org.isActive ? 'bg-green-600 hover:bg-green-700' : ''}>
                        {org.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(org.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
