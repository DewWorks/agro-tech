jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  unstable_cache: jest.fn((cb) => cb),
}))

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import FinancialNavTabs from '@/components/financial/FinancialNavTabs'
import DashboardPendingReceivablesList from '@/components/financial/DashboardPendingReceivablesList'
import { getFinancialBadgeCounts } from '@/actions/financial/badges'
import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'

const pushMock = jest.fn()
let currentPathname = '/admin/financial'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: jest.fn(),
  }),
  usePathname: () => currentPathname,
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    receivableInstallment: {
      count: jest.fn(),
    },
    payableInstallment: {
      count: jest.fn(),
    },
    partnerCommission: {
      count: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  getUserContext: jest.fn(),
}))

describe('Cockpit Financeiro Executivo & Badges de Alerta (Tarefas A, B, C, D)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    currentPathname = '/admin/financial'
  })

  describe('1. Badges de Notificação nas Abas (FinancialNavTabs)', () => {
    it('renderiza o badge de 1 parcela pendente na aba Contas a Receber', () => {
      render(
        <FinancialNavTabs
          badgeCounts={{
            receivablesCount: 1,
            receivablesOverdueCount: 0,
            payablesPendingCount: 0,
            partnersPendingPayoutCount: 0,
          }}
        />
      )

      const linkReceivables = screen.getByRole('link', { name: /Contas a Receber/i })
      expect(linkReceivables).toBeInTheDocument()
      expect(linkReceivables).toHaveTextContent('1')
    })

    it('renderiza badge com animação pulsante vermelha quando há parcelas em atraso', () => {
      render(
        <FinancialNavTabs
          badgeCounts={{
            receivablesCount: 2,
            receivablesOverdueCount: 1,
            payablesPendingCount: 3,
            partnersPendingPayoutCount: 1,
          }}
        />
      )

      const linkReceivables = screen.getByRole('link', { name: /Contas a Receber/i })
      expect(linkReceivables).toHaveTextContent('2')

      const badgeReceivables = linkReceivables.querySelector('.bg-rose-600')
      expect(badgeReceivables).toBeInTheDocument()
      expect(badgeReceivables?.className).toContain('animate-pulse')

      const linkPayables = screen.getByRole('link', { name: /Contas a Pagar/i })
      expect(linkPayables).toHaveTextContent('3')

      const linkPartners = screen.getByRole('link', { name: /Parceiros & Comissões/i })
      expect(linkPartners).toHaveTextContent('1')
    })
  })

  describe('2. Radar de Cobranças e Títulos Pendentes (DashboardPendingReceivablesList)', () => {
    const mockTitles = [
      {
        id: 'title-1',
        documentNumber: 'FAT-2026-0001',
        serviceSubtype: 'PROJETO_CUSTEIO',
        originType: 'ESTEIRA_CREDITO',
        grossAmount: 9000,
        netAmount: 9000,
        totalReceivedAmount: 0,
        status: 'PENDENTE',
        producer: {
          id: 'prod-1',
          name: 'João Victor Póvoa França',
          document: '03819571108',
        },
        partner: {
          id: 'part-1',
          name: 'Agrícola Cerrado',
        },
        installments: [
          {
            id: 'inst-1',
            installmentNumber: 1,
            totalInstallments: 1,
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            amount: 9000,
            receivedAmount: 0,
            status: 'A_VENCER',
          },
        ],
        commissions: [
          {
            id: 'comm-1',
            totalCommissionAmount: 1800,
            status: 'BLOQUEADO',
          },
        ],
      },
    ]

    const mockBankAccounts = [
      { id: 'acc-1', bankName: 'Banco do Brasil', agency: '1234', accountNumber: '5678-9' },
    ]

    it('renderiza o título a receber com produtor, saldo de R$ 9.000,00 e semáforo A VENCER', () => {
      render(
        <DashboardPendingReceivablesList
          pendingTitles={mockTitles}
          bankAccounts={mockBankAccounts}
        />
      )

      expect(screen.getByText('João Victor Póvoa França')).toBeInTheDocument()
      expect(screen.getByText(/FAT-2026-0001/i)).toBeInTheDocument()
      expect(screen.getByText(/Projeto de Custeio — Banco do Brasil/i)).toBeInTheDocument()
      expect(screen.getByText(/R\$\s*9\.000,00/i)).toBeInTheDocument()
      expect(screen.getByText('A VENCER')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Dar Baixa Declaratória/i })).toBeInTheDocument()
    })

    it('abre o modal de liquidação declaratória ao clicar no botão de ação rápida', () => {
      render(
        <DashboardPendingReceivablesList
          pendingTitles={mockTitles}
          bankAccounts={mockBankAccounts}
        />
      )

      const btn = screen.getByRole('button', { name: /Dar Baixa Declaratória/i })
      fireEvent.click(btn)

      expect(screen.getByText(/Liquidação Declaratória de Parcela/i)).toBeInTheDocument()
      expect(screen.getByText(/Conta Bancária de Crédito:/i)).toBeInTheDocument()
    })

    it('exibe empty state amigável quando todos os honorários estão quitados', () => {
      render(
        <DashboardPendingReceivablesList
          pendingTitles={[]}
          bankAccounts={mockBankAccounts}
        />
      )

      expect(
        screen.getByText(/🟢 Todos os honorários previstos estão 100% quitados!/i)
      ).toBeInTheDocument()
    })
  })

  describe('3. Query Server Action de Contadores (getFinancialBadgeCounts)', () => {
    it('retorna os contadores corretos agregados em paralelo', async () => {
      ;(getUserContext as jest.Mock).mockResolvedValue({
        id: 'user-1',
        role: 'OWNER',
        organizationId: 'org-1',
      })

      ;(prisma.receivableInstallment.count as jest.Mock)
        .mockResolvedValueOnce(4) // receivablesCount
        .mockResolvedValueOnce(1) // receivablesOverdueCount

      ;(prisma.payableInstallment.count as jest.Mock).mockResolvedValueOnce(2) // payablesPendingCount
      ;(prisma.partnerCommission.count as jest.Mock).mockResolvedValueOnce(3) // partnersPendingPayoutCount

      const counts = await getFinancialBadgeCounts('branch-1')

      expect(counts.receivablesCount).toBe(4)
      expect(counts.receivablesOverdueCount).toBe(1)
      expect(counts.payablesPendingCount).toBe(2)
      expect(counts.partnersPendingPayoutCount).toBe(3)
    })
  })
})
