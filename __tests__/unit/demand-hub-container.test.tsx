import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { DemandHubContainer } from '@/components/demands/DemandHubContainer'

const pushMock = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

jest.mock('@/actions/demands', () => ({
  updateDemandStatus: jest.fn().mockResolvedValue({ success: true }),
  cancelDemand: jest.fn().mockResolvedValue({ success: true }),
}))

describe('DemandHubContainer — Skeletons e Feedback de Transição', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  const baseCounters = {
    total: 5,
    solicitado: 2,
    emExecucao: 2,
    aguardandoDocumentacao: 1,
    concluido: 0,
    cancelado: 0,
    atrasadas: 0,
    warning30: 1,
  }

  const mockDemands = [
    {
      id: 'dem-1',
      demandNumber: 'DEM-001',
      serviceType: 'PROJETO_CUSTEIO',
      status: 'SOLICITADO',
      priority: 'MEDIA',
      requestDate: new Date().toISOString(),
      producer: { name: 'João Silva' },
      property: { name: 'Fazenda Boa Esperança' },
      checklistItems: [],
      checklistSummary: { total: 0, delivered: 0, pending: 0, percentage: 0, progressPercent: 0 },
      sla: { status: 'NO_PRAZO', label: 'Restam 15 dias', daysRemaining: 15 },
    },
  ]

  it('deve renderizar o quadro Kanban quando currentView="kanban" e showCancelled=false', () => {
    render(
      <DemandHubContainer
        currentView="kanban"
        search=""
        showCancelled={false}
        activeDemands={5}
        counters={baseCounters}
        demands={mockDemands as any}
        cancelledDemands={[]}
      />
    )

    expect(screen.getByText('Solicitado')).toBeInTheDocument()
    expect(screen.getByText('Em Execução')).toBeInTheDocument()
    expect(screen.getByText('Aguardando Docs')).toBeInTheDocument()
    expect(screen.getByText('Concluído')).toBeInTheDocument()
    expect(screen.getByText('João Silva')).toBeInTheDocument()
  })

  it('deve acionar router.push e ativar transição ao clicar em Tabela', () => {
    render(
      <DemandHubContainer
        currentView="kanban"
        search=""
        showCancelled={false}
        activeDemands={5}
        counters={baseCounters}
        demands={mockDemands as any}
        cancelledDemands={[]}
      />
    )

    const tableBtn = screen.getByRole('button', { name: /tabela/i })
    fireEvent.click(tableBtn)

    expect(pushMock).toHaveBeenCalledWith('/admin/demands?view=table')
  })

  it('deve acionar router.push com showCancelled=true ao clicar em Ver Canceladas', () => {
    render(
      <DemandHubContainer
        currentView="kanban"
        search=""
        showCancelled={false}
        activeDemands={5}
        counters={baseCounters}
        demands={mockDemands as any}
        cancelledDemands={[]}
      />
    )

    const canceladasBtn = screen.getByRole('button', { name: /Ver Canceladas/i })
    fireEvent.click(canceladasBtn)

    expect(pushMock).toHaveBeenCalledWith('/admin/demands?view=kanban&showCancelled=true')
  })

  it('deve renderizar o Empty State quando showCancelled=true e não houver demandas canceladas', () => {
    render(
      <DemandHubContainer
        currentView="kanban"
        search=""
        showCancelled={true}
        activeDemands={0}
        counters={{ ...baseCounters, cancelado: 0 }}
        demands={[]}
        cancelledDemands={[]}
      />
    )

    expect(screen.getByText('Nenhuma demanda cancelada')).toBeInTheDocument()
    expect(
      screen.getByText('Não existem ordens de serviço arquivadas ou canceladas para os filtros selecionados.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Voltar para Demandas Ativas/i })).toBeInTheDocument()
  })

  it('deve renderizar a tabela com as canceladas quando showCancelled=true e houver canceladas', () => {
    const cancelledMock = [
      {
        ...mockDemands[0],
        id: 'dem-cancelled-1',
        status: 'CANCELADO',
      },
    ]

    render(
      <DemandHubContainer
        currentView="kanban"
        search=""
        showCancelled={true}
        activeDemands={0}
        counters={{ ...baseCounters, cancelado: 1 }}
        demands={cancelledMock as any}
        cancelledDemands={cancelledMock as any}
      />
    )

    expect(screen.getByText('Cancelado')).toBeInTheDocument()
    expect(screen.getByText('João Silva')).toBeInTheDocument()
  })
})
