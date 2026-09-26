import React from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserContext } from '@/lib/auth'
import { getCreditLimitPortfolioData } from '@/actions/credit-limit'
import { CreditLimitNavigationTabs } from '@/components/credit-limit/CreditLimitNavigationTabs'
import { CreditLimitKpiCards } from '@/components/credit-limit/CreditLimitKpiCards'
import { CreditLimitPortfolioTable } from '@/components/credit-limit/CreditLimitPortfolioTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Landmark, Plus, AlertCircle, ShieldAlert } from 'lucide-react'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'

export default async function CreditLimitPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined }
}) {
  const searchParams = (await props.searchParams) || {}
  const user = await getUserContext()

  if (!user) {
    redirect('/login')
  }

  const isSuperAdmin =
    user.role === 'SUPER_ADMIN' || (user as any).realRole === 'SUPER_ADMIN'
  const isOrgFinancialEnabled = (user.organization?.modules || []).includes(
    'FINANCIAL_SUMMARY'
  )
  const hasFinancialModule = isSuperAdmin || isOrgFinancialEnabled
  const isFinancialModuleDisabledForOrg = isSuperAdmin && !isOrgFinancialEnabled

  // Bloqueio rigoroso: se usuário comum não possui FINANCIAL_SUMMARY, redireciona
  if (!hasFinancialModule) {
    redirect('/admin')
  }

  // Consulta dados da carteira e consolidação MCR
  const data = await getCreditLimitPortfolioData({
    branchId: searchParams.branchId,
    search: searchParams.q,
    purpose: searchParams.purpose,
    bank: searchParams.bank,
    status: searchParams.status,
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ALERTA INFORMATIVO SUPER ADMIN (SE MÓDULO ESTIVER DESLIGADO NO CLIENTE) */}
      {isFinancialModuleDisabledForOrg && (
        <div className="bg-amber-50/90 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60 rounded-xl p-4 flex items-start gap-3.5 text-amber-900 dark:text-amber-200 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs">
                Módulo Desligado no Cliente (Visível apenas para Super Admin)
              </span>
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold uppercase tracking-wider"
              >
                OFF Cliente
              </Badge>
            </div>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
              A organização ativa não possui o módulo <strong>Resumo Financeiro & Limites</strong> habilitado em seu plano comercial. Como Super Administrador, você possui permissão técnica para auditar e visualizar estes dados. Usuários comuns desta organização não têm acesso a esta tela nem aos atalhos de limite de crédito.
            </p>
          </div>
        </div>
      )}

      {/* Top Header com Identidade Visual Padronizada */}
      <PageHeaderBanner
        badge="Módulo Financeiro & Crédito Rural"
        badgeIcon={<Landmark className="h-4 w-4 shrink-0 text-emerald-300" />}
        title="Limite de Crédito Rural"
        description="Painel consolidado de capacidade de pagamento, garantias reais (hipotecas e penhor) e limites operacionais de crédito rural sob as regras do Manual de Crédito Rural (MCR)."
        actions={
          <div className="flex items-center gap-3">
            {isFinancialModuleDisabledForOrg && (
              <Badge className="bg-amber-500 text-white hover:bg-amber-600 text-[10px] font-bold">
                OFF Cliente (Super Admin)
              </Badge>
            )}
            <Link href="/admin/crm/properties/new">
              <Button
                className="bg-white text-[#1B4D3E] hover:bg-emerald-50 text-xs font-bold shadow-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Novo Levantamento
              </Button>
            </Link>
          </div>
        }
      />

      {/* Abas de Navegação (Aba 1 Ativa) */}
      <CreditLimitNavigationTabs totalAnalyzed={data.kpis.totalAnalyzedProperties} />

      {/* Cards de Métricas e KPIs Executivos */}
      <CreditLimitKpiCards kpis={data.kpis} />

      {/* Tabela Interativa de Carteira de Limites */}
      <CreditLimitPortfolioTable
        initialProperties={data.properties}
        branches={data.branches}
      />
    </div>
  )
}
