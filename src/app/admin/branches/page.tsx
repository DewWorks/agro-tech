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

export default async function BranchesPage() {
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

  const branches = await prisma.branch.findMany({
    where: { 
      organizationId: dbUser.organizationId,
      deletedAt: null // Não mostrar apagadas
    },
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
