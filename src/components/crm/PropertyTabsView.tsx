'use client'

import React, { useState } from 'react'
import { MapPin, ClipboardList } from 'lucide-react'
import PropertyMultiStepForm from '@/components/crm/PropertyMultiStepForm'
import { CrmDemandsList } from '@/components/crm/CrmDemandsList'
import { cn } from '@/lib/utils'

interface PropertyTabsViewProps {
  property: any
  userBranches: any[]
  producers: any[]
  hasFinancialModule: boolean
  isFinancialModuleDisabledForOrg: boolean
  demands: any[]
  initialTab?: string
}

export function PropertyTabsView({
  property,
  userBranches,
  producers,
  hasFinancialModule,
  isFinancialModuleDisabledForOrg,
  demands,
  initialTab = 'CADASTRO',
}: PropertyTabsViewProps) {
  const [activeTab, setActiveTab] = useState<'CADASTRO' | 'DEMANDAS'>(
    initialTab === 'DEMANDAS' ? 'DEMANDAS' : 'CADASTRO'
  )

  const primaryProducerId = producers[0]?.id || property.producers?.[0]?.producerId

  return (
    <div className="space-y-4">
      {/* Abas Superiores do Perfil da Propriedade */}
      <div className="flex space-x-1.5 border-b overflow-x-auto pb-1 scrollbar-thin">
        <button
          type="button"
          onClick={() => setActiveTab('CADASTRO')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap shrink-0 rounded-t-lg cursor-pointer',
            activeTab === 'CADASTRO'
              ? 'border-[#1B4D3E] text-[#1B4D3E] font-bold bg-emerald-50/70'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 hover:bg-gray-50/50'
          )}
        >
          <MapPin className="w-4 h-4" />
          <span>Ficha Cadastral & Bens</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DEMANDAS')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap shrink-0 rounded-t-lg cursor-pointer',
            activeTab === 'DEMANDAS'
              ? 'border-[#1B4D3E] text-[#1B4D3E] font-bold bg-emerald-50/70'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 hover:bg-gray-50/50'
          )}
        >
          <ClipboardList className="w-4 h-4 text-emerald-600" />
          <span>Serviços & Demandas</span>
          <span className="px-2 py-0.2 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            {demands.length}
          </span>
        </button>
      </div>

      {/* Conteúdo da Aba */}
      <div className="bg-white rounded-xl shadow-xs border p-6">
        {activeTab === 'CADASTRO' ? (
          <PropertyMultiStepForm
            branches={userBranches}
            initialData={property}
            producers={producers}
            hasFinancialModule={hasFinancialModule}
            isFinancialModuleDisabledForOrg={isFinancialModuleDisabledForOrg}
          />
        ) : (
          <CrmDemandsList
            propertyId={property.id}
            propertyName={property.name || property.propertyName}
            producerId={primaryProducerId}
            initialDemands={demands}
          />
        )}
      </div>
    </div>
  )
}
