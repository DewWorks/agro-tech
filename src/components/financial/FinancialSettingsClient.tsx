'use client'

import React, { useState } from 'react'
import { SlidersHorizontal, Building2, Landmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import GlobalSettingsForm from './settings/GlobalSettingsForm'
import BranchSettingsForm from './settings/BranchSettingsForm'
import BankAccountsSection from './settings/BankAccountsSection'
import NewBankAccountModal from './modals/NewBankAccountModal'
import InternalTransferModal from './modals/InternalTransferModal'

interface FinancialSettingsClientProps {
  globalSettings: any
  branchSettings: any
  bankAccounts: any[]
  branches: any[]
  isExecutive?: boolean
  currentBranchId?: string | null
}

export default function FinancialSettingsClient({
  globalSettings,
  branchSettings,
  bankAccounts,
  branches,
  isExecutive,
  currentBranchId,
}: FinancialSettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'GLOBAL' | 'BRANCH' | 'ACCOUNTS'>('GLOBAL')
  const [newAccountModalOpen, setNewAccountModalOpen] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Abas Internas de Configurações - Design Pill Neutro Suave sem Corte de Texto */}
      <div className="flex items-center">
        <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('GLOBAL')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-xs transition-all duration-150 cursor-pointer',
              activeTab === 'GLOBAL'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold'
            )}
          >
            <SlidersHorizontal
              className={cn(
                'h-4 w-4 shrink-0',
                activeTab === 'GLOBAL' ? 'text-emerald-800' : 'text-slate-500'
              )}
            />
            <span>Parâmetros Globais</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BRANCH')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-xs transition-all duration-150 cursor-pointer',
              activeTab === 'BRANCH'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold'
            )}
          >
            <Building2
              className={cn(
                'h-4 w-4 shrink-0',
                activeTab === 'BRANCH' ? 'text-emerald-800' : 'text-slate-500'
              )}
            />
            <span>Parâmetros por Filial</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ACCOUNTS')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-xs transition-all duration-150 cursor-pointer',
              activeTab === 'ACCOUNTS'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold'
            )}
          >
            <Landmark
              className={cn(
                'h-4 w-4 shrink-0',
                activeTab === 'ACCOUNTS' ? 'text-emerald-800' : 'text-slate-500'
              )}
            />
            <span>Contas Bancárias & Caixas ({bankAccounts.length})</span>
          </button>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'GLOBAL' && (
        <GlobalSettingsForm
          globalSettings={globalSettings}
          isExecutive={isExecutive}
        />
      )}

      {activeTab === 'BRANCH' && (
        <BranchSettingsForm
          branchSettings={branchSettings}
          branches={branches}
          currentBranchId={currentBranchId}
        />
      )}

      {activeTab === 'ACCOUNTS' && (
        <BankAccountsSection
          bankAccounts={bankAccounts}
          onOpenNewAccount={() => setNewAccountModalOpen(true)}
          onOpenTransfer={() => setTransferModalOpen(true)}
        />
      )}

      {/* Modais Montados Sob Demanda */}
      {newAccountModalOpen && (
        <NewBankAccountModal
          isOpen={newAccountModalOpen}
          onClose={() => setNewAccountModalOpen(false)}
          branches={branches}
          currentBranchId={currentBranchId}
        />
      )}

      {transferModalOpen && (
        <InternalTransferModal
          isOpen={transferModalOpen}
          onClose={() => setTransferModalOpen(false)}
          bankAccounts={bankAccounts}
        />
      )}
    </div>
  )
}
