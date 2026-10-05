import React from 'react'
import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/auth'
import prisma from '@/lib/prisma'
import FinancialNavTabs from '@/components/financial/FinancialNavTabs'
import { Landmark } from 'lucide-react'

export const metadata = {
  title: 'Gestão Financeira & ERP | AgroTech',
  description: 'Contas a pagar/receber, livro-caixa, trava de comissões e DRE gerencial da safra.',
}

export default async function FinancialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUserContext()
  if (!user) {
    redirect('/login')
  }

  // Verificação de Autorização Financeira (RBAC)
  const isExecutive =
    user.role === 'OWNER' ||
    user.role === 'SUPER_ADMIN' ||
    user.realRole === 'SUPER_ADMIN'
  const isAuthorized = isExecutive || user.role === 'ADMIN' || user.role === 'OPERATOR'

  if (!isAuthorized) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center">
        <Landmark className="h-12 w-12 text-slate-300 mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Acesso Restrito ao Módulo Financeiro</h2>
        <p className="text-sm text-slate-500 max-w-md mt-1">
          Você não possui os privilégios de acesso necessários para visualizar ou movimentar o ERP Financeiro da empresa.
        </p>
      </div>
    )
  }

  // Carrega as filiais ativas da organização para o seletor
  const branches = user.organizationId
    ? await prisma.branch.findMany({
        where: {
          organizationId: user.organizationId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          city: true,
        },
        orderBy: { name: 'asc' },
      })
    : []

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-800 p-2 text-white shadow-xs">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Gestão Financeira & ERP
              </h1>
              <p className="text-xs font-medium text-slate-500">
                LN Consultoria e Projetos Rurais • Safra 2025/2026 • Opção ERP Completo (Aditivo 004)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação por Abas e Seletor de Filiais */}
      <FinancialNavTabs
        branches={branches}
        isExecutive={isExecutive}
        currentBranchId={user.branchId}
      />

      {/* Conteúdo da Rota Ativa */}
      <div>{children}</div>
    </div>
  )
}
