import React from 'react'
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react'
import { usePayablesFilter } from '@/components/financial/hooks/usePayablesFilter'
import { useReceivablesFilter } from '@/components/financial/hooks/useReceivablesFilter'
import SettleReceivableModal from '@/components/financial/modals/SettleReceivableModal'
import ReverseReceivableModal from '@/components/financial/modals/ReverseReceivableModal'
import SettlePayableModal from '@/components/financial/modals/SettlePayableModal'
import NewPartnerModal from '@/components/financial/modals/NewPartnerModal'
import GlobalSettingsForm from '@/components/financial/settings/GlobalSettingsForm'
import BranchSettingsForm from '@/components/financial/settings/BranchSettingsForm'
import BankAccountsSection from '@/components/financial/settings/BankAccountsSection'

const pushMock = jest.fn()
const refreshMock = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
  usePathname: () => '/admin/financial',
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('@/actions/financial/receivables', () => ({
  settleReceivableInstallment: jest.fn().mockResolvedValue({ success: true }),
  reverseReceivablePayment: jest.fn().mockResolvedValue({ success: true }),
}))

jest.mock('@/actions/financial/payables', () => ({
  createDirectPayableTitle: jest.fn().mockResolvedValue({ success: true }),
  settlePayableInstallment: jest.fn().mockResolvedValue({ success: true }),
}))

jest.mock('@/actions/financial/partners', () => ({
  createCommercialPartner: jest.fn().mockResolvedValue({ success: true }),
  toggleCommercialPartnerStatus: jest.fn().mockResolvedValue({ success: true }),
}))

jest.mock('@/actions/financial/settings', () => ({
  updateFinancialSettings: jest.fn().mockResolvedValue({ success: true }),
  updateBranchFinancialSettings: jest.fn().mockResolvedValue({ success: true }),
  createBankAccount: jest.fn().mockResolvedValue({ success: true }),
  transferBetweenBankAccounts: jest.fn().mockResolvedValue({ success: true }),
}))

describe('Módulo Financeiro ERP — Decomposição Atômica e Arquitetura Limpa', () => {
  beforeEach(() => {
    pushMock.mockClear()
    refreshMock.mockClear()
  })

  describe('Custom Filter Hooks', () => {
    test('usePayablesFilter filtra corretamente por texto e status', () => {
      const payables = [
        { id: '1', supplierName: 'Agroquímicos Silva', documentNumber: 'NF-100', status: 'PENDENTE', expenseType: 'CUSTO_DIRETO_PROPOSTA' },
        { id: '2', supplierName: 'Posto Central', documentNumber: 'NF-200', status: 'PAGO', expenseType: 'DESPESA_FIXA_FILIAL' },
      ]

      const { result } = renderHook(() => usePayablesFilter(payables))

      expect(result.current.filteredPayables).toHaveLength(2)

      // Filtrar por busca
      act(() => {
        result.current.setSearchTerm('Agro')
      })
      expect(result.current.filteredPayables).toHaveLength(1)
      expect(result.current.filteredPayables[0].id).toBe('1')

      // Filtrar por status
      act(() => {
        result.current.setSearchTerm('')
        result.current.setStatusFilter('PAGO')
      })
      expect(result.current.filteredPayables).toHaveLength(1)
      expect(result.current.filteredPayables[0].id).toBe('2')
    })

    test('useReceivablesFilter filtra corretamente por produtor e status', () => {
      const titles = [
        { id: 'r1', producer: { name: 'João Fazendeiro' }, documentNumber: 'REC-001', status: 'QUITADO' },
        { id: 'r2', producer: { name: 'Maria Produtora' }, documentNumber: 'REC-002', status: 'PENDENTE' },
      ]

      const { result } = renderHook(() => useReceivablesFilter(titles))
      expect(result.current.filteredTitles).toHaveLength(2)

      act(() => {
        result.current.setSearchTerm('Maria')
      })
      expect(result.current.filteredTitles).toHaveLength(1)
      expect(result.current.filteredTitles[0].id).toBe('r2')
    })
  })

  describe('Modais Atômicos Isolados', () => {
    test('SettleReceivableModal calcula saldo residual e monta formulário limpo', () => {
      render(
        <SettleReceivableModal
          isOpen={true}
          onClose={jest.fn()}
          selectedTitle={{
            id: 't-1',
            documentNumber: 'HON-001',
            netAmount: 10000,
            producer: { name: 'Produtor Teste' },
            commissions: [{ totalCommissionAmount: 2000 }],
            partner: { name: 'Parceiro Indicador' },
          }}
          selectedInstallment={{
            id: 'i-1',
            installmentNumber: 1,
            totalInstallments: 2,
            dueDate: new Date().toISOString(),
            amount: 5000,
            receivedAmount: 2000,
          }}
          bankAccounts={[{ id: 'acc-1', bankName: 'Banco do Brasil', currentBalance: 50000 }]}
          onSuccess={jest.fn()}
        />
      )

      expect(screen.getByText(/Liquidação Declaratória de Parcela/i)).toBeInTheDocument()
      expect(screen.getByText(/Produtor Teste • HON-001/i)).toBeInTheDocument()
      expect(screen.getByText(/R\$\s*3\.000,00/i)).toBeInTheDocument()
    })

    test('ReverseReceivableModal valida justificativa mínima de 15 caracteres', () => {
      render(
        <ReverseReceivableModal
          isOpen={true}
          onClose={jest.fn()}
          selectedTransaction={{ id: 'tx-1' }}
          onSuccess={jest.fn()}
        />
      )

      expect(screen.getByText(/Estorno de Liquidação Financeira/i)).toBeInTheDocument()
      const confirmBtn = screen.getByRole('button', { name: /Confirmar Estorno/i })
      expect(confirmBtn).toBeDisabled()
    })

    test('SettlePayableModal renderiza campos de débito em conta', () => {
      render(
        <SettlePayableModal
          isOpen={true}
          onClose={jest.fn()}
          selectedPayable={{ supplierName: 'Fornecedor A', documentNumber: 'DOC-123' }}
          selectedInstallment={{
            id: 'inst-1',
            installmentNumber: 1,
            totalInstallments: 1,
            dueDate: new Date().toISOString(),
            amount: 1500,
            paidAmount: 0,
          }}
          bankAccounts={[{ id: 'acc-1', bankName: 'Sicoob', currentBalance: 12000 }]}
          onSuccess={jest.fn()}
        />
      )

      expect(screen.getByText(/Liquidação de Pagamento \/ Débito em Conta/i)).toBeInTheDocument()
      expect(screen.getByText(/Fornecedor A • DOC-123/i)).toBeInTheDocument()
    })

    test('NewPartnerModal renderiza formulário de cadastro com validações', () => {
      render(
        <NewPartnerModal
          isOpen={true}
          onClose={jest.fn()}
          branches={[{ id: 'b-1', name: 'Filial Central', city: 'Taguatinga' }]}
          onSuccess={jest.fn()}
        />
      )

      expect(screen.getByText(/Cadastrar Parceiro Comercial/i)).toBeInTheDocument()
      expect(screen.getByText(/Nome Completo \/ Razão Social/i)).toBeInTheDocument()
    })
  })

  describe('Formulários de Configurações Decompostos', () => {
    test('GlobalSettingsForm exibe parâmetros e trava de acesso executivo', () => {
      render(
        <GlobalSettingsForm
          globalSettings={{
            defaultSuccessFeePercent: 2.5,
            defaultPartnerCommissionPercent: 20,
            defaultFieldSurveyCostPerKm: 3.0,
          }}
          isExecutive={false}
        />
      )

      expect(screen.getByText(/Parâmetros Globais da Organização/i)).toBeInTheDocument()
      expect(screen.getByText(/Apenas a Diretoria Executiva possui permissão/i)).toBeInTheDocument()
    })

    test('BranchSettingsForm renderiza metas orçamentárias', () => {
      render(
        <BranchSettingsForm
          branchSettings={{
            monthlyFixedCostTarget: 18000,
            monthlyRevenueTarget: 75000,
            activeCropYear: '2025/2026',
          }}
          branches={[{ id: 'b-1', name: 'Filial Ponte Alta', city: 'Ponte Alta do Bom Jesus' }]}
        />
      )

      expect(screen.getByText(/Metas Orçamentárias & Faturamento por Filial/i)).toBeInTheDocument()
      expect(screen.getByText(/Teto de Custos Fixos Mensais/i)).toBeInTheDocument()
    })

    test('BankAccountsSection renderiza cards de contas bancárias', () => {
      render(
        <BankAccountsSection
          bankAccounts={[
            { id: 'acc-1', bankName: 'Banco do Brasil', accountType: 'CORRENTE', currentBalance: 25000 },
            { id: 'acc-2', bankName: 'Caixa Espécie', accountType: 'CAIXA_ESPECIE', currentBalance: 1200 },
          ]}
          onOpenNewAccount={jest.fn()}
          onOpenTransfer={jest.fn()}
        />
      )

      expect(screen.getByText(/Contas Bancárias & Caixas de Tesouraria/i)).toBeInTheDocument()
      expect(screen.getByText(/Banco do Brasil/i)).toBeInTheDocument()
      expect(screen.getByText(/Caixa Espécie/i)).toBeInTheDocument()
    })
  })
})
