import { getOrganizations, toggleOrganizationStatus, type OrganizationListItem } from '@/actions/organizations'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Building2, ExternalLink, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { startImpersonating } from '@/actions/impersonate'
import { ConfirmActionModal } from '@/components/admin/ConfirmActionModal'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'
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

import { getSubscriptionPlans } from '@/actions/billing'
import { SubscriptionManagementModal } from '@/components/billing/SubscriptionManagementModal'
import { CreditCard, ShieldAlert } from 'lucide-react'

export default async function OrganizationsPage() {
  const [organizations, plans] = await Promise.all([
    getOrganizations(),
    getSubscriptionPlans(),
  ])

  const formatCnpj = (cnpj: string) => {
    if (cnpj.length === 14) {
      return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    }
    return cnpj
  }

  const getSubscriptionBadge = (sub: OrganizationListItem['subscription']) => {
    if (!sub) {
      return <Badge variant="outline" className="text-slate-400 border-slate-300">Sem Assinatura</Badge>
    }
    switch (sub.status) {
      case 'ACTIVE':
        return <Badge className="bg-emerald-600 hover:bg-emerald-700">Ativa</Badge>
      case 'TRIAL':
        return <Badge className="bg-blue-600 hover:bg-blue-700">Trial</Badge>
      case 'OVERDUE':
        return <Badge className="bg-amber-600 hover:bg-amber-700">Em Atraso</Badge>
      case 'SUSPENDED':
        return <Badge variant="destructive">Suspensa</Badge>
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelada</Badge>
      default:
        return <Badge variant="outline">{sub.status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Padronizado */}
      <PageHeaderBanner
        badge="SaaS Multi-Tenant • Clientes Corporativos"
        badgeIcon={<Building2 className="h-4 w-4 shrink-0 text-emerald-300" />}
        title="Organizações Clientes"
        description="Gestão global de assinantes e empresas do SaaS."
        actions={
          <Link href="/admin/organizations/new">
            <Button className="bg-white hover:bg-emerald-50 text-[#1B4D3E] font-bold shadow-md px-6 py-6 text-sm flex items-center gap-2">
              <Plus className="h-5 w-5" /> Nova Organização
            </Button>
          </Link>
        }
      />

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Plano SaaS / Status</TableHead>
              <TableHead>Owner (Principal)</TableHead>
              <TableHead>Filiais</TableHead>
              <TableHead>Utilizadores</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                  Nenhuma organização cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org: OrganizationListItem) => {
                const owner = org.users[0]
                const impersonate = startImpersonating.bind(null, org.id)
                const sub = org.subscription
                const effectivePrice = sub?.customPrice ? Number(sub.customPrice) : (sub?.plan?.price ? Number(sub.plan.price) : null)

                return (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium text-[#1B4D3E]">
                      {org.name}
                    </TableCell>
                    <TableCell>{formatCnpj(org.cnpj)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-1.5">
                          {getSubscriptionBadge(sub)}
                          {sub?.plan && (
                            <span className="text-xs font-semibold text-slate-800">
                              {sub.plan.name}
                            </span>
                          )}
                        </div>
                        {effectivePrice !== null && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(effectivePrice)}/mês
                          </span>
                        )}
                        <div className="pt-0.5">
                          <SubscriptionManagementModal
                            organizationId={org.id}
                            organizationName={org.name}
                            organizationCnpj={org.cnpj}
                            ownerEmail={owner?.email}
                            currentPlanCode={sub?.plan?.code}
                            currentCustomPrice={sub?.customPrice ? Number(sub.customPrice) : null}
                            currentDueDay={sub?.billingDueDay}
                            plans={plans}
                            isUpdateMode={!!sub}
                          />
                        </div>
                      </div>
                    </TableCell>
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
                    <TableCell className="text-right flex items-center justify-end gap-1">
                      <ConfirmActionModal
                        title={org.isActive ? "Desativar Organização?" : "Ativar Organização?"}
                        description={org.isActive 
                          ? `Tem a certeza que deseja desativar a organização ${org.name}? Todos os utilizadores, filiais e produtores associados perderão o acesso.` 
                          : `Deseja reativar a organização ${org.name}?`
                        }
                        triggerText=""
                        useSwitch={true}
                        isActive={org.isActive}
                        tooltip={org.isActive ? "Desativar" : "Ativar"}
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
                          <p>Aceder Painel</p>
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
  )
}
