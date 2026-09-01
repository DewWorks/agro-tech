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
import { Building2, Plus, Pencil, Ban, CheckCircle2 } from 'lucide-react'
import { toggleBranchStatus } from '@/actions/branches'
import { ConfirmActionModal } from '@/components/admin/ConfirmActionModal'
import { DeleteBranchModal } from '@/components/admin/branches/DeleteBranchModal'
import DataTableToolbar from '@/components/admin/DataTableToolbar'

export default async function BranchesPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined } }) {
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

  // Apenas OWNER e SUPER_ADMIN podem gerir filiais
  if (dbUser.role !== 'OWNER' && dbUser.role !== 'SUPER_ADMIN') {
    redirect('/admin')
  }

  // Configuração do filtro
  const whereClause: any = {
    organizationId: dbUser.organizationId,
    deletedAt: null // Não mostrar apagadas
  }

  if (q) {
    whereClause.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { cnpj: { contains: q } },
      { city: { contains: q, mode: 'insensitive' } }
    ]
  }

  if (status === 'ATIVO') {
    whereClause.isActive = true
  } else if (status === 'INATIVO') {
    whereClause.isActive = false
  }

  const branches = await prisma.branch.findMany({
    where: whereClause,
    include: {
      _count: {
        select: {
          users: true,
          producers: true,
          properties: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Gestão de Filiais
          </h1>
          <p className="text-muted-foreground mt-2">
            Gira as unidades da sua organização.
          </p>
        </div>
        <Link href="/admin/branches/new">
          <Button className="bg-[#1B4D3E] hover:bg-[#13382D]">
            <Plus className="mr-2 h-4 w-4" /> Nova Filial
          </Button>
        </Link>
      </div>

      <DataTableToolbar 
        searchPlaceholder="Buscar por Nome, CNPJ ou Cidade..."
        filterOptions={[
          { label: <Badge className="bg-green-600 hover:bg-green-700 font-normal py-0">Ativas</Badge>, value: 'ATIVO' },
          { label: <Badge variant="secondary" className="font-normal py-0">Inativas</Badge>, value: 'INATIVO' }
        ]}
      />

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                  Nenhuma filial cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell>{branch.cnpj}</TableCell>
                  <TableCell>{branch.city} - {branch.state}</TableCell>
                  <TableCell>
                    <Badge variant={branch.isActive ? 'default' : 'secondary'} className={branch.isActive ? 'bg-green-600 hover:bg-green-700' : ''}>
                      {branch.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <ConfirmActionModal
                      title={branch.isActive ? "Desativar Filial?" : "Ativar Filial?"}
                      description={branch.isActive 
                        ? `Tem a certeza que deseja desativar a filial ${branch.name}?` 
                        : `Deseja reativar a filial ${branch.name}?`
                      }
                      triggerText=""
                      useSwitch={true}
                      isActive={branch.isActive}
                      tooltip={branch.isActive ? "Desativar" : "Ativar"}
                      action={async () => {
                        'use server'
                        return await toggleBranchStatus(branch.id, !branch.isActive)
                      }}
                      successMessage={`Filial ${branch.isActive ? 'desativada' : 'ativada'} com sucesso!`}
                      actionLabel="Confirmar"
                      actionVariant={branch.isActive ? 'destructive' : 'default'}
                    />
                    <Tooltip>
                      <TooltipTrigger render={<Link href={`/admin/branches/${branch.id}/edit`} />}>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Editar</p>
                      </TooltipContent>
                    </Tooltip>
                    <DeleteBranchModal 
                      branchId={branch.id} 
                      branchName={branch.name}
                      counts={{
                        users: branch._count?.users || 0,
                        producers: branch._count?.producers || 0,
                        properties: branch._count?.properties || 0,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
