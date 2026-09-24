import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DemandFiltersBar } from '@/components/demands/DemandFiltersBar'
import { DemandCancelledEmptyState } from '@/components/demands/DemandCancelledEmptyState'

const pushMock = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

describe('Switcher de Visualização (Kanban | Tabela) & Toggle de Canceladas', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  describe('DemandFiltersBar — Segmented Control de Visualização', () => {
    it('deve renderizar os botões Kanban e Tabela com seus respectivos ícones', () => {
      render(
        <DemandFiltersBar
          currentView="kanban"
          currentSearch=""
          showCancelled={false}
          cancelledCount={0}
        />
      )

      const kanbanBtn = screen.getByRole('button', { name: /kanban/i })
      const tableBtn = screen.getByRole('button', { name: /tabela/i })

      expect(kanbanBtn).toBeInTheDocument()
      expect(tableBtn).toBeInTheDocument()
      // Kanban ativo
      expect(kanbanBtn.className).toContain('bg-white')
      expect(kanbanBtn.className).toContain('text-slate-900')
      // Tabela inativo
      expect(tableBtn.className).toContain('text-slate-600')
    })

    it('deve destacar o botão Tabela quando currentView="table"', () => {
      render(
        <DemandFiltersBar
          currentView="table"
          currentSearch=""
          showCancelled={false}
          cancelledCount={2}
        />
      )

      const tableBtn = screen.getByRole('button', { name: /tabela/i })
      const kanbanBtn = screen.getByRole('button', { name: /kanban/i })

      expect(tableBtn.className).toContain('bg-white')
      expect(tableBtn.className).toContain('text-slate-900')
      expect(kanbanBtn.className).toContain('text-slate-600')
    })

    it('deve alternar a visualização para tabela ao clicar no botão Tabela', () => {
      render(
        <DemandFiltersBar
          currentView="kanban"
          currentSearch="soja"
          showCancelled={false}
          cancelledCount={0}
        />
      )

      const tableBtn = screen.getByRole('button', { name: /tabela/i })
      fireEvent.click(tableBtn)

      expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('view=table'))
      expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('search=soja'))
    })
  })

  describe('DemandFiltersBar — Botão Toggle "Ver Canceladas"', () => {
    it('deve exibir estilo neutro quando showCancelled for falso', () => {
      render(
        <DemandFiltersBar
          currentView="kanban"
          currentSearch=""
          showCancelled={false}
          cancelledCount={3}
        />
      )

      const toggleBtn = screen.getByRole('button', { name: /Ver Canceladas \(3\)/i })
      expect(toggleBtn).toBeInTheDocument()
      expect(toggleBtn.className).toContain('bg-white')
      expect(toggleBtn.className).toContain('text-slate-700')
    })

    it('deve exibir estilo escuro e alto contraste quando showCancelled for verdadeiro', () => {
      render(
        <DemandFiltersBar
          currentView="kanban"
          currentSearch=""
          showCancelled={true}
          cancelledCount={3}
        />
      )

      const toggleBtn = screen.getByRole('button', { name: /Exibindo Canceladas \(3\)/i })
      expect(toggleBtn).toBeInTheDocument()
      expect(toggleBtn.className).toContain('bg-slate-900')
      expect(toggleBtn.className).toContain('text-white')
    })

    it('deve alternar o filtro ao clicar no botão de canceladas', () => {
      render(
        <DemandFiltersBar
          currentView="kanban"
          currentSearch=""
          showCancelled={false}
          cancelledCount={1}
        />
      )

      const toggleBtn = screen.getByRole('button', { name: /Ver Canceladas/i })
      fireEvent.click(toggleBtn)

      expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('showCancelled=true'))
    })
  })

  describe('DemandCancelledEmptyState — Painel de Canceladas Zeradas', () => {
    it('deve renderizar o título e a descrição amigável de estado vazio', () => {
      render(<DemandCancelledEmptyState currentView="kanban" />)

      expect(screen.getByText('Nenhuma demanda cancelada')).toBeInTheDocument()
      expect(
        screen.getByText(
          'Não existem ordens de serviço arquivadas ou canceladas para os filtros selecionados.'
        )
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Voltar para Demandas Ativas/i })).toBeInTheDocument()
    })

    it('deve acionar router.push removendo showCancelled ao clicar em Voltar', () => {
      render(<DemandCancelledEmptyState currentView="kanban" currentSearch="milho" />)

      const backBtn = screen.getByRole('button', { name: /Voltar para Demandas Ativas/i })
      fireEvent.click(backBtn)

      expect(pushMock).toHaveBeenCalledWith('/admin/demands?view=kanban&search=milho')
    })

    it('deve chamar onReset caso fornecido', () => {
      const resetMock = jest.fn()
      render(<DemandCancelledEmptyState onReset={resetMock} />)

      const backBtn = screen.getByRole('button', { name: /Voltar para Demandas Ativas/i })
      fireEvent.click(backBtn)

      expect(resetMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('Zero Emojis Policy — Strict SVG Icons Only', () => {
    it('deve garantir que o dropdown de SLA não contenha emojis Unicode (⚠️, 🚨)', () => {
      const { container } = render(
        <DemandFiltersBar
          currentView="kanban"
          currentSearch=""
          showCancelled={false}
          cancelledCount={0}
          currentSlaFilter="WARNING_30"
        />
      )

      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u
      expect(emojiRegex.test(container.innerHTML)).toBe(false)
      expect(container.innerHTML).not.toContain('⚠️')
      expect(container.innerHTML).not.toContain('🚨')
      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })
})
