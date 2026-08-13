import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
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
import { Users as UsersIcon, Plus, Pencil, Tractor } from 'lucide-react'
import { ConfirmActionModal } from '@/components/admin/ConfirmActionModal'
import { toggleProducerStatus } from '@/actions/producers'

export default async function CRMPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || !dbUser.organizationId) {
    return <div>Organização não encontrada.</div>
  }

  // Busca todos os produtores das filiais que pertencem à organização do usuário logado
  const producers = await prisma.producer.findMany({
    where: { 
      branch: {
        organizationId: dbUser.organizationId
      }
    },
    include: {
      branch: true,
      properties: true
    },
    orderBy: { createdAt: 'desc' }
  })

  // Formatador de CPF/CNPJ para exibição
  const formatDoc = (doc: string, type: 'PF' | 'PJ') => {
    if (type === 'PF' && doc.length === 11) {
      return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    }
    if (type === 'PJ' && doc.length === 14) {
      return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    }
    return doc
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
            <Tractor className="h-8 w-8" />
            CRM & Cadastro Único
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestão unificada de Produtores Rurais e Imóveis Vinculados.
          </p>
        </div>
        <Link href="/admin/crm/new">
          <Button className="bg-[#1B4D3E] hover:bg-[#13382D]">
            <Plus className="mr-2 h-4 w-4" /> Novo Produtor
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead>Produtor</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Imóveis Vinculados</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {producers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                  Nenhum produtor cadastrado na base de dados.
                </TableCell>
              </TableRow>
            ) : (
              producers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-[#1B4D3E]">
                    {p.name}
                    <div className="text-xs text-muted-foreground font-normal">
                      Filial: {p.branch.name}
                    </div>
                  </TableCell>
                  <TableCell>{formatDoc(p.document, p.type)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={p.type === 'PF' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}>
                      {p.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{p.phone || '-'}</div>
                    <div className="text-xs text-muted-foreground">{p.email || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {p.properties.length}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? 'default' : 'secondary'} className={p.isActive ? 'bg-green-600 hover:bg-green-700' : ''}>
                      {p.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <ConfirmActionModal
                      title={p.isActive ? "Desativar Produtor?" : "Ativar Produtor?"}
                      description={p.isActive 
                        ? `Tem a certeza que deseja desativar o cadastro de ${p.name}? Projetos atrelados podem ser bloqueados.` 
                        : `Deseja reativar o cadastro de ${p.name}?`
                      }
                      triggerText={p.isActive ? 'Desativar' : 'Ativar'}
                      triggerVariant="outline"
                      action={async () => {
                        'use server'
                        return await toggleProducerStatus(p.id, !p.isActive)
                      }}
                      successMessage={`Produtor ${p.isActive ? 'desativado' : 'ativado'} com sucesso!`}
                      actionLabel="Confirmar"
                      actionVariant={p.isActive ? 'destructive' : 'default'}
                    />
                    <Link href={`/admin/crm/${p.id}/edit`}>
                      <Button variant="outline" size="icon">
                        <Pencil className="h-4 w-4 text-blue-600" />
                      </Button>
                    </Link>
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
