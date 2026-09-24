import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DemandMetricsRibbon } from '@/components/demands/DemandMetricsRibbon'

const pushMock = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

describe('DemandMetricsRibbon — Chips Interativos na Fita Superior', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  it('deve renderizar os chips de métricas corretamente com os contadores', () => {
    render(
      <DemandMetricsRibbon
        activeCount={8}
        overdueCount={2}
        warning30Count={3}
        pendingDocsCount={4}
        currentSlaFilter="ALL"
        currentView="kanban"
      />
    )

    expect(screen.getByText(/8 demandas ativas/i)).toBeInTheDocument()
    expect(screen.getByText(/em Aviso \(≤ 30 dias\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Atrasadas \/ Risco de SLA/i)).toBeInTheDocument()
    expect(screen.getByText(/Pendências no GED/i)).toBeInTheDocument()
  })

  it('deve aplicar o filtro slaFilter=WARNING_30 ao clicar no chip de aviso', () => {
    render(
      <DemandMetricsRibbon
        activeCount={8}
        overdueCount={2}
        warning30Count={3}
        pendingDocsCount={4}
        currentSlaFilter="ALL"
        currentView="kanban"
      />
    )

    const warningBtn = screen.getByRole('button', { name: /em Aviso/i })
    fireEvent.click(warningBtn)

    expect(pushMock).toHaveBeenCalledWith('/admin/demands?view=kanban&slaFilter=WARNING_30')
  })

  it('deve alternar e remover o filtro ao clicar novamente no chip de aviso já ativo', () => {
    render(
      <DemandMetricsRibbon
        activeCount={8}
        overdueCount={2}
        warning30Count={3}
        pendingDocsCount={4}
        currentSlaFilter="WARNING_30"
        currentView="kanban"
      />
    )

    const warningBtn = screen.getByRole('button', { name: /em Aviso/i })
    fireEvent.click(warningBtn)

    expect(pushMock).toHaveBeenCalledWith('/admin/demands?view=kanban')
  })

  it('deve aplicar o filtro slaFilter=OVERDUE ao clicar no chip de atrasadas', () => {
    render(
      <DemandMetricsRibbon
        activeCount={8}
        overdueCount={2}
        warning30Count={3}
        pendingDocsCount={4}
        currentSlaFilter="ALL"
        currentView="kanban"
      />
    )

    const overdueBtn = screen.getByRole('button', { name: /Atrasadas/i })
    fireEvent.click(overdueBtn)

    expect(pushMock).toHaveBeenCalledWith('/admin/demands?view=kanban&slaFilter=OVERDUE')
  })

  it('deve utilizar ícones SVG e nenhum emoji Unicode na fita de métricas', () => {
    const { container } = render(
      <DemandMetricsRibbon
        activeCount={8}
        overdueCount={2}
        warning30Count={3}
        pendingDocsCount={4}
        currentSlaFilter="WARNING_30"
        currentView="kanban"
      />
    )

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u
    expect(emojiRegex.test(container.innerHTML)).toBe(false)
    expect(container.innerHTML).not.toContain('⚠️')
    expect(container.innerHTML).not.toContain('🚨')
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
