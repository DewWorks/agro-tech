import { getSystemModules, toggleSystemModuleStatus } from '@/actions/modules'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Settings2, Pencil, CheckCircle2, AlertTriangle } from 'lucide-react'
import { ConfirmActionModal } from '@/components/admin/ConfirmActionModal'
import DataTableToolbar from '@/components/admin/DataTableToolbar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function SystemModulesPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined } }) {
  const searchParams = await props.searchParams || {}
  const q = searchParams.q || ''
  const status = searchParams.status || 'TODOS'
  
  const allModules = await getSystemModules()

  // Filtros em memória
  const filteredModules = allModules.filter(mod => {
    if (q && !mod.name.toLowerCase().includes(q.toLowerCase()) && !mod.code.toLowerCase().includes(q.toLowerCase())) {
      return false
    }
    if (status === 'ACTIVE' && !mod.isActive) return false
    if (status === 'INACTIVE' && mod.isActive) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E] flex items-center gap-2">
            <Settings2 className="h-8 w-8" />
            Módulos do Sistema
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestão global de módulos. Ativar ou desativar módulos afetará todos os clientes da plataforma.
          </p>
        </div>
        <Link href="/admin/modules/new">
          <Button className="bg-[#1B4D3E] hover:bg-[#13382D]">
            <Plus className="mr-2 h-4 w-4" /> Novo Módulo
          </Button>
        </Link>
      </div>

      <DataTableToolbar 
        searchPlaceholder="Buscar por Código ou Nome..."
        filterOptions={[
          { label: (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ativos
            </div>
          ), value: 'ACTIVE' },
          { label: (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              Inativos
            </div>
          ), value: 'INACTIVE' }
        ]}
      />

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status Global</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredModules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                  Nenhum módulo encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredModules.map((mod) => (
                <TableRow key={mod.id}>
                  <TableCell className="font-semibold text-gray-700">{mod.code}</TableCell>
                  <TableCell className="font-medium text-[#1B4D3E]">{mod.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[300px] truncate">{mod.description || '-'}</TableCell>
                  <TableCell>
                    {mod.isActive ? (
                      <span className="bg-green-50 border border-green-200 text-green-700 px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center w-fit gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Ativo
                      </span>
                    ) : (
                      <span className="bg-red-50 border border-red-200 text-red-700 px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center w-fit gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Inativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    <ConfirmActionModal
                      title={mod.isActive ? "Desativar Módulo?" : "Ativar Módulo?"}
                      description={mod.isActive 
                        ? `Atenção: Desativar o módulo ${mod.code} impedirá o seu acesso em TODO o sistema, afetando todas as organizações.` 
                        : `Deseja reativar o módulo ${mod.code}?`
                      }
                      triggerText=""
                      useSwitch={true}
                      isActive={mod.isActive}
                      tooltip={mod.isActive ? "Desativar" : "Ativar"}
                      action={async () => {
                        'use server'
                        return await toggleSystemModuleStatus(mod.id, !mod.isActive)
                      }}
                      successMessage={`Módulo ${mod.isActive ? 'desativado' : 'ativado'} com sucesso!`}
                      actionLabel="Confirmar"
                      actionVariant={mod.isActive ? 'destructive' : 'default'}
                    />
                    <Tooltip>
                      <TooltipTrigger render={<Link href={`/admin/modules/${mod.id}/edit`} />}>
                        <Button size="icon" variant="ghost">
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
