import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DemandAuditTabs } from '@/components/demands/DemandAuditTabs'

const mockDemand = {
  id: 'dem-test-01',
  demandNumber: 'DEM-2026-0001',
  serviceType: 'PROJETO_CUSTEIO',
  status: 'EM_EXECUCAO',
  priority: 'ALTA',
  description: 'Elaboração de projeto de custeio agrícola safra 26/27',
  branchId: 'branch-1',
  branch: {
    id: 'branch-1',
    name: 'Filial Taguatinga',
  },
  proposalId: 'PROP-2026-999',
  documentId: 'doc-123',
  createdById: 'user-creator',
  createdBy: {
    id: 'user-creator',
    fullName: 'Carlos Criador',
    name: 'Carlos Criador',
    email: 'carlos@agrolimit.com.br',
  },
  assignedToId: 'user-engineer',
  assignedTo: {
    id: 'user-engineer',
    fullName: 'Mariana Engenheira',
    name: 'Mariana Engenheira',
    email: 'mariana@agrolimit.com.br',
  },
  startedAt: new Date('2026-09-01T10:00:00Z'),
  slaForecast: new Date('2026-09-30T18:00:00Z'),
  completedAt: null,
  createdAt: new Date('2026-09-01T09:00:00Z'),
  updatedAt: new Date('2026-09-10T14:30:00Z'),
  history: [
    {
      id: 'h1',
      demandId: 'dem-test-01',
      userId: 'user-creator',
      fromStatus: null,
      toStatus: 'SOLICITADO' as const,
      notes: 'Abertura da demanda no sistema',
      createdAt: new Date('2026-09-01T09:00:00Z'),
      user: {
        id: 'user-creator',
        fullName: 'Carlos Criador',
        email: 'carlos@agrolimit.com.br',
      },
    },
    {
      id: 'h2',
      demandId: 'dem-test-01',
      userId: 'user-engineer',
      fromStatus: 'SOLICITADO' as const,
      toStatus: 'EM_EXECUCAO' as const,
      notes: 'Início da coleta documental em campo',
      createdAt: new Date('2026-09-05T14:00:00Z'),
      user: {
        id: 'user-engineer',
        fullName: 'Mariana Engenheira',
        email: 'mariana@agrolimit.com.br',
      },
    },
    {
      id: 'h3',
      demandId: 'dem-test-01',
      userId: 'user-engineer',
      fromStatus: 'EM_EXECUCAO' as const,
      toStatus: 'EM_EXECUCAO' as const,
      notes: 'Análise de viabilidade concluída com sucesso',
      createdAt: new Date('2026-09-10T16:00:00Z'),
      user: {
        id: 'user-engineer',
        fullName: 'Mariana Engenheira',
        email: 'mariana@agrolimit.com.br',
      },
    },
  ],
}

describe('DemandAuditTabs — Governança (35%) e Histórico (65%) em Grid Amplo', () => {
  it('deve renderizar o card de governança e a linha do tempo simultaneamente no grid', () => {
    render(<DemandAuditTabs demand={mockDemand} />)

    expect(screen.getByText(/Governança & Rastreabilidade/i)).toBeInTheDocument()
    expect(screen.getByText(/Abertura da demanda no sistema/i)).toBeInTheDocument()
    expect(screen.getByTestId('history-counter')).toHaveTextContent('Exibindo 3 de 3 eventos')
  })

  it('deve exibir os metadados de governança no card esquerdo (Governança & Rastreabilidade)', () => {
    render(<DemandAuditTabs demand={mockDemand} />)

    expect(screen.getAllByText(/Carlos Criador/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Mariana Engenheira').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Filial Taguatinga')).toBeInTheDocument()
    expect(screen.getByText('PROP-2026-999')).toBeInTheDocument()
  })

  it('deve listar todos os eventos inicialmente na linha do tempo espaçosa', () => {
    render(<DemandAuditTabs demand={mockDemand} />)

    expect(screen.getByText(/Abertura da demanda no sistema/)).toBeInTheDocument()
    expect(screen.getByText(/Início da coleta documental em campo/)).toBeInTheDocument()
    expect(screen.getByText(/Análise de viabilidade concluída com sucesso/)).toBeInTheDocument()
    expect(screen.getByTestId('history-counter')).toHaveTextContent('Exibindo 3 de 3 eventos')
  })

  it('deve filtrar eventos instantaneamente ao digitar na busca textual', () => {
    render(<DemandAuditTabs demand={mockDemand} />)

    const searchInput = screen.getByPlaceholderText(/Buscar por despacho, usuário ou status/i)
    fireEvent.change(searchInput, { target: { value: 'viabilidade' } })

    // Apenas o evento h3 deve ser exibido
    expect(screen.getByText(/Análise de viabilidade concluída com sucesso/)).toBeInTheDocument()
    expect(screen.queryByText(/Abertura da demanda no sistema/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Início da coleta documental em campo/)).not.toBeInTheDocument()
    expect(screen.getByTestId('history-counter')).toHaveTextContent('Exibindo 1 de 3 eventos')
  })

  it('deve renderizar os selects oficiais do sistema para Usuário e Status e o DatePicker em disposição horizontal', () => {
    render(<DemandAuditTabs demand={mockDemand} />)

    const comboboxes = screen.getAllByRole('combobox')
    expect(comboboxes.length).toBeGreaterThanOrEqual(2)
    expect(comboboxes[0]).toHaveTextContent('Todos os Usuários')
    expect(comboboxes[1]).toHaveTextContent('Todos os Status')

    // Verifica a presença do DatePicker oficial do sistema (não input type=date)
    expect(screen.getByText('Filtrar por data específica...')).toBeInTheDocument()
    expect(screen.queryByTitle('Filtrar por data específica')).not.toBeInTheDocument()
  })

  it('deve exibir mensagem amigável quando nenhum evento corresponder ao filtro', () => {
    render(<DemandAuditTabs demand={mockDemand} />)

    const searchInput = screen.getByPlaceholderText(/Buscar por despacho, usuário ou status/i)
    fireEvent.change(searchInput, { target: { value: 'termo_inexistente_xyz' } })

    expect(screen.getByText('Nenhum evento corresponde aos filtros.')).toBeInTheDocument()

    // Clicar em redefinir filtros restaura os 3
    const clearButton = screen.getByText('Redefinir filtros')
    fireEvent.click(clearButton)

    expect(screen.getByTestId('history-counter')).toHaveTextContent('Exibindo 3 de 3 eventos')
    expect(screen.getByText(/Abertura da demanda no sistema/)).toBeInTheDocument()
  })
})
