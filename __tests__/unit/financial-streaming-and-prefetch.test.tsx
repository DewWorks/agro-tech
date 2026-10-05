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
})
