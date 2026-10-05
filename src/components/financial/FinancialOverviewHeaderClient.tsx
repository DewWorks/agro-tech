'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import FinancialQuickActions from '@/components/financial/FinancialQuickActions'
import FinancialExportModal, { DreExportData } from '@/components/financial/FinancialExportModal'
import NewPayableModal from '@/components/financial/modals/NewPayableModal'
import InternalTransferModal from '@/components/financial/modals/InternalTransferModal'

interface FinancialOverviewHeaderClientProps {
  exportData: DreExportData
  bankAccounts?: any[]
  branches?: any[]
  categories?: any[]
  demands?: any[]
  currentBranchId?: string | null
}

export default function FinancialOverviewHeaderClient({
  exportData,
  bankAccounts = [],
  branches = [],
  categories = [],
  demands = [],
  currentBranchId = null,
}: FinancialOverviewHeaderClientProps) {
  const router = useRouter()
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [payableModalOpen, setPayableModalOpen] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)

  const handleExpenseClick = () => {
    if (branches.length > 0 && categories.length > 0) {
      setPayableModalOpen(true)
    } else {
      router.push('/admin/financial/payables')
    }
  }

  const handleTransferClick = () => {
    if (bankAccounts.length >= 2) {
      setTransferModalOpen(true)
    } else {
      router.push('/admin/financial/settings')
    }
  }

  return (
    <div className="space-y-4">
      {/* Central de Ações Rápidas (Cards Escuros Institucionais Padrão Home) */}
      <FinancialQuickActions
        onOpenExpenseModal={handleExpenseClick}
        onOpenTransferModal={handleTransferClick}
        onOpenExportModal={() => setExportModalOpen(true)}
      />

      {/* Modal de Exportação Contábil */}
      <FinancialExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        exportData={exportData}
      />

      {/* Modal de Nova Despesa Sob Demanda */}
      {payableModalOpen && (
        <NewPayableModal
          isOpen={payableModalOpen}
          onClose={() => setPayableModalOpen(false)}
          branches={branches}
          categories={categories}
          demands={demands}
          currentBranchId={currentBranchId}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* Modal de Transferência Interna Sob Demanda */}
      {transferModalOpen && (
        <InternalTransferModal
          isOpen={transferModalOpen}
          onClose={() => setTransferModalOpen(false)}
          bankAccounts={bankAccounts}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  )
}
