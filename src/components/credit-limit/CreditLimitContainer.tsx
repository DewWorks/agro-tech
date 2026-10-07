'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditLimitNavigationTabs } from './CreditLimitNavigationTabs'
import { CreditLimitKpiCards } from './CreditLimitKpiCards'
import { CreditLimitPortfolioTable } from './CreditLimitPortfolioTable'
import { CreditRiskSimulator } from './CreditRiskSimulator'
import { NewCreditAnalysisModal } from './NewCreditAnalysisModal'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Landmark, Plus, ShieldAlert } from 'lucide-react'
import {
  CreditLimitPortfolioKPIs,
  CreditLimitPropertyItem,
  PropertySimulationData,
} from '@/actions/credit-limit'
import { PropertySelectOption } from '@/types/credit-limit.types'
import { WorkflowStepsGuideCard } from '@/components/documents'

const CREDIT_LIMIT_WORKFLOW_STEPS = [
  {
    step: 1,
    title: 'Cadastro Patrimonial',
    description:
      'Dados de terras, benfeitorias, rebanho e máquinas cadastrados no CRM compõem automaticamente o lastro de garantias.',
  },
  {
    step: 2,
    title: 'Simulador MCR',
    description:
      'Calibre montante, prazos, amortização SAC/PRICE e apure instantaneamente a Capacidade de Pagamento e o ICSD.',
  },
  {
    step: 3,
    title: 'Inteligência Consultiva',
    description:
      'O sistema diagnostica a elegibilidade perante as normas do BACEN e prescreve ações de viabilização do crédito.',
  },
  {
    step: 4,
    title: 'Dossiê Técnico',
    description:
      'Pré-visualize em alta nitidez (336 DPI) e emita o laudo oficial no padrão Banco do Brasil e cooperativas.',
  },
]


interface CreditLimitContainerProps {
  kpis: CreditLimitPortfolioKPIs
  properties: CreditLimitPropertyItem[]
  branches: Array<{ id: string; name: string }>
  initialTab?: 'overview' | 'simulator'
  initialPropertyId?: string
  initialProducerId?: string
  initialAmount?: number
  initialCreditLine?: string
  initialTargetBank?: string
  initialPropertiesList?: PropertySelectOption[]
  initialSimulationData?: PropertySimulationData | null
  isFinancialModuleDisabledForOrg?: boolean
}

export function CreditLimitContainer({
  kpis,
  properties,
  branches,
  initialTab = 'overview',
  initialPropertyId,
  initialProducerId,
  initialAmount,
  initialCreditLine,
  initialTargetBank,
  initialPropertiesList,
  initialSimulationData,
  isFinancialModuleDisabledForOrg = false,
}: CreditLimitContainerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Inicialização síncrona dos parâmetros de URL via lazy initializers (sem piscar tela vazia)
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator'>(() => {
    const tabParam = searchParams?.get('tab')
    if (tabParam === 'simulator' || tabParam === 'overview') return tabParam
    if (searchParams?.get('propertyId') || searchParams?.get('producerId')) return 'simulator'
    return initialTab || 'overview'
  })
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(() => {
    return searchParams?.get('propertyId') || initialPropertyId || ''
  })
  const [selectedProducerId, setSelectedProducerId] = useState<string | null>(() => {
    return searchParams?.get('producerId') || initialProducerId || null
  })
  const [isNewAnalysisModalOpen, setIsNewAnalysisModalOpen] = useState(false)

  // Sincronizar parâmetros de URL quando tabs ou propertyId mudam
  const handleTabChange = (tab: 'overview' | 'simulator') => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    if (tab === 'simulator' && selectedPropertyId) {
      params.set('propertyId', selectedPropertyId)
    } else if (tab === 'overview') {
      params.delete('propertyId')
    }
    router.replace(`/admin/credit-limit?${params.toString()}`)
  }

  const handleOpenSimulatorForProperty = (propId: string) => {
    setSelectedPropertyId(propId)
    setActiveTab('simulator')
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'simulator')
    params.set('propertyId', propId)
    router.replace(`/admin/credit-limit?${params.toString()}`)
  }

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
            <Button
              type="button"
              onClick={() => setIsNewAnalysisModalOpen(true)}
              className="bg-white text-[#1B4D3E] hover:bg-emerald-50 text-xs font-bold shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo Levantamento
            </Button>
          </div>
        }
      />

      {/* Abas de Navegação (Aba 1 e Aba 2 ativas) */}
      <CreditLimitNavigationTabs
        totalAnalyzed={kpis.totalAnalyzedProperties}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        propertyId={selectedPropertyId}
      />

      {/* RENDERIZAÇÃO CONDICIONAL POR ABA */}
      {activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* Cards de Métricas e KPIs Executivos */}
          <CreditLimitKpiCards kpis={kpis} />

          {/* Tabela Interativa de Carteira de Limites */}
          <CreditLimitPortfolioTable
            initialProperties={properties}
            branches={branches}
            onOpenSimulator={handleOpenSimulatorForProperty}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Simulador de Risco Bancário MCR */}
          <CreditRiskSimulator
            initialPropertyId={selectedPropertyId}
            initialProducerId={selectedProducerId || undefined}
            initialAmount={initialAmount}
            initialCreditLine={initialCreditLine}
            initialTargetBank={initialTargetBank}
            initialPropertiesList={initialPropertiesList}
            initialSimulationData={initialSimulationData}
            onPropertyChange={(id) => {
              setSelectedPropertyId(id)
              const params = new URLSearchParams(searchParams.toString())
              params.set('tab', 'simulator')
              params.set('propertyId', id)
              router.replace(`/admin/credit-limit?${params.toString()}`)
            }}
          />
        </div>
      )}

      {/* Guia Didático da Esteira de Limite de Crédito Rural */}
      <WorkflowStepsGuideCard
        title="COMO FUNCIONA A ESTEIRA DE LIMITE DE CRÉDITO RURAL"
        steps={CREDIT_LIMIT_WORKFLOW_STEPS}
      />

      {/* Modal para Novo Levantamento de Crédito */}
      <NewCreditAnalysisModal
        isOpen={isNewAnalysisModalOpen}
        onClose={() => setIsNewAnalysisModalOpen(false)}
        onSelectProperty={(propId) => {
          handleOpenSimulatorForProperty(propId)
        }}
      />
    </div>
  )
}
