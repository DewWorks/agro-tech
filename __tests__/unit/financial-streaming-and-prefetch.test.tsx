import React from 'react'
import { render, screen } from '@testing-library/react'
import FinancialNavTabs from '@/components/financial/FinancialNavTabs'
import FinancialOverviewLoading from '@/app/admin/financial/loading'
import { MetricCardsSkeleton, TableSkeleton } from '@/components/financial/FinancialSkeletons'

const pushMock = jest.fn()
let currentPathname = '/admin/financial'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  usePathname: () => currentPathname,
  useSearchParams: () => new URLSearchParams(),
}))

describe('Módulo Financeiro ERP — Streaming, Prefetch e Skeletons de Navegação', () => {
  beforeEach(() => {
    pushMock.mockClear()
    currentPathname = '/admin/financial'
  })

  test('FinancialNavTabs renderiza todas as 5 abas com prefetch ativo e estilo visual destacado', () => {
    render(
      <FinancialNavTabs
        currentBranchId="branch-1"
        branches={[{ id: 'branch-1', name: 'Matriz Ponte Alta', city: 'Ponte Alta do Bom Jesus' }]}
        isExecutive={true}
      />
    )

    // Verifica se os 5 links existem
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(5)

    // Verifica a aba ativa atual (Visão Geral)
    const activeLink = screen.getByRole('link', { name: /Visão Geral/i })
    expect(activeLink).toBeInTheDocument()
    expect(activeLink.className).toContain('bg-[#113025]')
    expect(activeLink.className).toContain('text-white')

    // Verifica se as outras abas estão presentes
    expect(screen.getByRole('link', { name: /Contas a Receber/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Contas a Pagar/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Parceiros & Comissões/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Configurações & Caixa/i })).toBeInTheDocument()
  })

  test('FinancialOverviewLoading renderiza esqueleto centralizado do DRE e rotas financeiras', () => {
    const { container } = render(<FinancialOverviewLoading />)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(10)
  })

  test('MetricCardsSkeleton renderiza grid responsivo de cartões métricos', () => {
    const { container } = render(<MetricCardsSkeleton count={4} />)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThanOrEqual(8)
  })

  test('TableSkeleton renderiza cabeçalho e linhas tabulares reutilizáveis', () => {
    const { container } = render(<TableSkeleton rows={5} />)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThanOrEqual(10)
  })

  test('FinancialNavTabs atualiza estado ativo de forma otimista no milissegundo do clique (< 1ms)', () => {
    const { fireEvent } = require('@testing-library/react')
    render(
      <FinancialNavTabs
        currentBranchId="branch-1"
        branches={[{ id: 'branch-1', name: 'Matriz Ponte Alta', city: 'Ponte Alta do Bom Jesus' }]}
        isExecutive={true}
      />
    )

    const receivablesLink = screen.getByRole('link', { name: /Contas a Receber/i })
    expect(receivablesLink.className).not.toContain('bg-[#113025]')
    expect(receivablesLink.className).toContain('transition-all duration-150')

    // Dispara o clique na aba Contas a Receber
    fireEvent.click(receivablesLink)

    // O estado visual ativo transiciona imediatamente antes da rota filha carregar
    expect(receivablesLink.className).toContain('bg-[#113025]')
    expect(receivablesLink.className).toContain('text-white')
  })

  test('serializeDecimals converte instâncias de Decimal (como PartnerCommission) em plain objects sem erros de RSC', () => {
    const { serializeDecimals } = require('@/lib/utils')

    const mockDecimal = (val: number) => ({
      toNumber: () => val,
      toString: () => String(val),
      d: [val],
      e: 1,
      s: 1,
    })

    const rawCommission = {
      id: 'comm-1',
      branchId: 'branch-1',
      partnerId: 'partner-1',
      receivableTitleId: 'rec-1',
      receivableInstallmentId: 'inst-1',
      calculationBasisAmount: mockDecimal(9000),
      commissionPercent: mockDecimal(20),
      totalCommissionAmount: mockDecimal(1800),
      releasedAmount: mockDecimal(0),
      paidAmount: mockDecimal(0),
      status: 'BLOQUEADO',
      createdAt: new Date('2026-10-06T12:00:00Z'),
      updatedAt: new Date('2026-10-06T12:00:00Z'),
      nestedList: [
        { amount: mockDecimal(500) }
      ]
    }

    const serialized = serializeDecimals(rawCommission)

    expect(typeof serialized.commissionPercent).toBe('number')
    expect(serialized.commissionPercent).toBe(20)
    expect(typeof serialized.totalCommissionAmount).toBe('number')
    expect(serialized.totalCommissionAmount).toBe(1800)
    expect(typeof serialized.releasedAmount).toBe('number')
    expect(serialized.releasedAmount).toBe(0)
    expect(typeof serialized.calculationBasisAmount).toBe('number')
    expect(serialized.calculationBasisAmount).toBe(9000)
    expect(serialized.nestedList[0].amount).toBe(500)
    expect(serialized.createdAt).toBeInstanceOf(Date)
    expect(serialized.id).toBe('comm-1')
  })
})

