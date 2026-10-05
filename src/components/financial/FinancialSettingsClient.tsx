'use client'

import React, { useState } from 'react'
import { SlidersHorizontal, Building, Landmark } from 'lucide-react'
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
      {/* Abas Internas de Configurações */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6" aria-label="Abas de Configurações">
          <button
            onClick={() => setActiveTab('GLOBAL')}
            className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'GLOBAL'
                ? 'border-emerald-800 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Parâmetros Globais
          </button>

          <button
            onClick={() => setActiveTab('BRANCH')}
            className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'BRANCH'
                ? 'border-emerald-800 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="h-4 w-4" />
            Parâmetros por Filial
          </button>

          <button
            onClick={() => setActiveTab('ACCOUNTS')}
            className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'ACCOUNTS'
                ? 'border-emerald-800 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Landmark className="h-4 w-4" />
            Contas Bancárias & Caixas ({bankAccounts.length})
          </button>
        </nav>
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
