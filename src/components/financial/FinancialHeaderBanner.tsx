'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'
import {
  BarChart3,
  ArrowDownLeft,
  ArrowUpRight,
  Users2,
  SlidersHorizontal,
  Landmark,
} from 'lucide-react'

interface RouteInfo {
  title: string
  description: string
  badge: string
  icon: React.ElementType
}

const ROUTE_CONFIG: Record<string, RouteInfo> = {
  '/admin/financial': {
    title: 'Visão Geral & Indicadores (DRE)',
    description:
      'Acompanhamento em tempo real do resultado econômico da safra, apuração do DRE gerencial, conciliação do livro-caixa e projeção de liquidez.',
    badge: 'DRE Executivo • Competência & Caixa',
    icon: BarChart3,
  },
  '/admin/financial/receivables': {
    title: 'Contas a Receber & Faturamento',
    description:
      'Controle de cobranças de honorários de crédito rural, serviços avulsos, liquidações declaratórias com emissão de recibo oficial em PDF e conciliação bancária.',
    badge: 'Faturamento & Contas a Receber',
    icon: ArrowDownLeft,
  },
  '/admin/financial/payables': {
    title: 'Contas a Pagar & Boletos Futuros',
    description:
      'Apropriação de despesas operacionais de projetos (ARTs, vistorias, cartórios), custos fixos da filial e gestão de compras parceladas a prazo para controle orçamentário.',
    badge: 'Despesas & Obrigações • Livro-Caixa',
    icon: ArrowUpRight,
  },
  '/admin/financial/partners': {
    title: 'Parceiros Comerciais & Comissões',
    description:
      'Gestão de intermediadores e correspondentes bancários, cadastro de chaves PIX para repasse e controle da trava de segurança (liberação proporcional vinculada à quitação do produtor).',
    badge: 'Originação & Trava de Segurança',
    icon: Users2,
  },
  '/admin/financial/settings': {
    title: 'Configurações Financeiras & Tesouraria',
    description:
      'Governança de parâmetros corporativos do ERP, definição de metas orçamentárias por filial, cadastro de contas bancárias/caixas físicos e transferências internas de caixa.',
    badge: 'Tesouraria & Governança • Filiais',
    icon: SlidersHorizontal,
  },
}

export default function FinancialHeaderBanner() {
  const pathname = usePathname()

  const currentConfig: RouteInfo =
    ROUTE_CONFIG[pathname] ||
    (pathname.startsWith('/admin/financial/receivables')
      ? ROUTE_CONFIG['/admin/financial/receivables']
      : undefined) ||
    (pathname.startsWith('/admin/financial/payables')
      ? ROUTE_CONFIG['/admin/financial/payables']
      : undefined) ||
    (pathname.startsWith('/admin/financial/partners')
      ? ROUTE_CONFIG['/admin/financial/partners']
      : undefined) ||
    (pathname.startsWith('/admin/financial/settings')
      ? ROUTE_CONFIG['/admin/financial/settings']
      : undefined) ||
    ROUTE_CONFIG['/admin/financial']

  const Icon = currentConfig.icon

  return (
    <PageHeaderBanner
      badge={currentConfig.badge}
      badgeIcon={<Icon className="h-4 w-4 shrink-0 text-emerald-300" />}
      title={currentConfig.title}
      description={currentConfig.description}
    />
  )
}
