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
import { Users as UsersIcon, Plus, Pencil, Mail, Key } from 'lucide-react'
import { toggleUserStatus, resendWelcomeEmailAction, resetUserPasswordAction } from '@/actions/users'
import { ConfirmActionModal } from '@/components/admin/ConfirmActionModal'
import DataTableToolbar from '@/components/admin/DataTableToolbar'

const roleLabels: Record<string, string> = {
  OWNER: 'Administrador (Prop.)',
  ADMIN: 'Gerente',
  OPERATOR: 'Usuário',
}

export default async function UsersPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined } }) {
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
    organizationId: dbUser.organizationId
  }

  if (q) {
    whereClause.OR = [
      { fullName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } }
    ]
  }

  if (status === 'ATIVO') {
    whereClause.isActive = true
  } else if (status === 'INATIVO') {
    whereClause.isActive = false
  }

  // Fetch all users for this organization, including their branch relationships
  const users = await prisma.user.findMany({
    where: whereClause,
    include: {
      userBranches: {
        include: {
          branch: true
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
            <UsersIcon className="h-8 w-8" />
            Gestão de Utilizadores
          </h1>
          <p className="text-muted-foreground mt-2">
            Controle de acessos, cargos e permissões por filial.
          </p>
        </div>
        <Link href="/admin/users/new">
          <Button className="bg-[#1B4D3E] hover:bg-[#13382D]">
            <Plus className="mr-2 h-4 w-4" /> Novo Utilizador
          </Button>
        </Link>
      </div>

      <DataTableToolbar 
        searchPlaceholder="Buscar por Nome ou E-mail..."
        filterOptions={[
          { label: <Badge className="bg-green-600 hover:bg-green-700 font-normal py-0">Ativos</Badge>, value: 'ATIVO' },
          { label: <Badge variant="secondary" className="font-normal py-0">Inativos</Badge>, value: 'INATIVO' }
        ]}
      />

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Cargo Global</TableHead>
              <TableHead>Acessos (Filiais)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                  Nenhum utilizador encontrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.fullName || 'Sem Nome'}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50">
                      {roleLabels[u.role] || u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.role === 'OWNER' ? (
                      <span className="text-xs text-muted-foreground italic">Todas as filiais</span>
                    ) : u.userBranches.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {u.userBranches.map(ub => (
                          <span key={ub.branchId} className="text-xs">
                            • {ub.branch.name} <Badge variant="secondary" className="text-[10px] h-4 ml-1">{roleLabels[ub.role] || ub.role}</Badge>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-red-500">Sem acessos</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? 'default' : 'secondary'} className={u.isActive ? 'bg-green-600 hover:bg-green-700' : ''}>
                      {u.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {dbUser.id !== u.id && (
                      <ConfirmActionModal
                        title={u.isActive ? "Desativar Utilizador?" : "Ativar Utilizador?"}
                        description={u.isActive 
                          ? `Tem a certeza que deseja desativar o utilizador ${u.fullName}? Ele perderá imediatamente o acesso ao sistema.` 
                          : `Deseja reativar o acesso de ${u.fullName}?`
                        }
                        triggerText=""
                        useSwitch={true}
                        isActive={u.isActive}
                        tooltip={u.isActive ? "Desativar" : "Ativar"}
                        action={async () => {
                          'use server'
                          return await toggleUserStatus(u.id, !u.isActive)
                        }}
                        successMessage={`Utilizador ${u.isActive ? 'desativado' : 'ativado'} com sucesso!`}
                        actionLabel="Confirmar"
                        actionVariant={u.isActive ? 'destructive' : 'default'}
                      />
                    )}
                    <ConfirmActionModal
                      title="Reenviar E-mail de Acesso?"
                      description={`Deseja gerar uma nova password temporária e reenviar o e-mail de acesso para ${u.fullName}?`}
                      triggerText=""
                      triggerVariant="ghost"
                      triggerSize="icon"
                      tooltip="Reenviar E-mail"
                      triggerIcon={<Mail className="h-4 w-4 text-orange-600" />}
                      action={async () => {
                        'use server'
                        const res = await resendWelcomeEmailAction(u.id)
                        if (res?.error) {
                           return { error: res.error }
                        }
                        return res
                      }}
                      successMessage={`E-mail enviado com sucesso para ${u.email}!`}
                      actionLabel="Reenviar"
                    />
                    {dbUser.realRole === 'SUPER_ADMIN' && (
                      <ConfirmActionModal
                        title="Gerar Nova Senha?"
                        description={`Deseja gerar uma nova password para ${u.fullName}? A senha antiga deixará de funcionar imediatamente. A nova senha será exibida no ecrã para que a possa copiar.`}
                        triggerText=""
                        triggerVariant="ghost"
                        triggerSize="icon"
                        tooltip="Gerar Nova Senha"
                        triggerIcon={<Key className="h-4 w-4 text-emerald-600" />}
                        action={async () => {
                          'use server'
                          return await resetUserPasswordAction(u.id)
                        }}
                        successMessage={`Senha gerada com sucesso!`}
                        actionLabel="Gerar"
                      />
                    )}
                    <Tooltip>
                      <TooltipTrigger render={<Link href={`/admin/users/${u.id}/edit`} />}>
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
    </div>
  )
}
