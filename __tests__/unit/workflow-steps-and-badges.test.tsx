import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  OFFICIAL_CREDIT_LINES,
  getCreditLineBadgeClass,
} from '@/lib/constants/credit-lines-catalog'
import {
  WorkflowStepsGuideCard,
  WorkflowGuideStep,
} from '@/components/documents/WorkflowStepsGuideCard'

describe('Diretriz de Engenharia: Padronização Visual de Badges e Guia Didático de Esteira', () => {
  describe('1. Padronização Cromática das Badges do Catálogo das 15 Linhas', () => {
    it('todas as 15 linhas devem possuir badgeColor estritamente neutra (ardósia/cinza corporativo) ou verde institucional suave', () => {
      expect(OFFICIAL_CREDIT_LINES).toHaveLength(15)

      const bannedColorClasses = [
        'pink',
        'purple',
        'cyan',
        'lime',
        'amber',
        'orange',
        'blue-100',
        'indigo',
        'teal',
      ]

      OFFICIAL_CREDIT_LINES.forEach((line) => {
        // Nenhuma linha deve possuir classes com cores saturadas/arco-íris
        bannedColorClasses.forEach((banned) => {
          expect(line.badgeColor).not.toContain(banned)
        })

        if (line.axis === 'CUSTEIO') {
          expect(line.badgeColor).toBe('bg-emerald-50 text-emerald-800 border-emerald-200')
        } else {
          // INVESTIMENTO ou AMBOS
          expect(line.badgeColor).toBe('bg-slate-100 text-slate-700 border-slate-200')
        }
      })
    })

    it('getCreditLineBadgeClass deve retornar matriz cromática padronizada por eixo', () => {
      expect(getCreditLineBadgeClass('CUSTEIO')).toBe(
        'bg-emerald-50 text-emerald-800 border-emerald-200'
      )
      expect(getCreditLineBadgeClass('INVESTIMENTO')).toBe(
        'bg-slate-100 text-slate-700 border-slate-200'
      )
      expect(getCreditLineBadgeClass('AMBOS')).toBe(
        'bg-slate-100 text-slate-700 border-slate-200'
      )
    })
  })

  describe('2. Componente Reutilizável Didático WorkflowStepsGuideCard', () => {
    const mockSteps: WorkflowGuideStep[] = [
      {
        step: 1,
        title: 'Cadastro Patrimonial',
        description:
          'Dados de terras, benfeitorias, rebanho e máquinas cadastrados no CRM compõem o lastro.',
      },
      {
        step: 2,
        title: 'Simulador MCR',
        description:
          'Calibre montante, prazos e amortização instantaneamente.',
      },
      {
        step: 3,
        title: 'Inteligência Consultiva',
        description:
          'O sistema diagnostica a elegibilidade perante as normas do BACEN.',
      },
      {
        step: 4,
        title: 'Dossiê Técnico',
        description:
          'Pré-visualize em alta nitidez (336 DPI) e emita o laudo oficial.',
      },
    ]

    it('deve renderizar o título em caixa alta e os 4 passos simétricos', () => {
      render(
        <WorkflowStepsGuideCard
          title="COMO FUNCIONA A ESTEIRA DE TESTE"
          steps={mockSteps}
        />
      )

      expect(screen.getByText('COMO FUNCIONA A ESTEIRA DE TESTE')).toBeInTheDocument()

      mockSteps.forEach((step) => {
        expect(
          screen.getByText(new RegExp(`${step.step}\\.\\s+${step.title}`))
        ).toBeInTheDocument()
        expect(screen.getByText(step.description)).toBeInTheDocument()
      })
    })

    it('deve aplicar as classes estruturais e o verde institucional no cabeçalho dos passos', () => {
      const { container } = render(
        <WorkflowStepsGuideCard
          title="ESTEIRA INSTITUCIONAL"
          steps={mockSteps}
          className="custom-test-class"
        />
      )

      const rootCard = container.firstChild as HTMLElement
      expect(rootCard).toHaveClass('bg-slate-50')
      expect(rootCard).toHaveClass('border-slate-200')
      expect(rootCard).toHaveClass('rounded-2xl')
      expect(rootCard).toHaveClass('custom-test-class')

      // Verificar as 4 caixas internas
      const stepBoxes = container.querySelectorAll('.bg-white.p-4.rounded-xl')
      expect(stepBoxes).toHaveLength(4)
    })
  })
})
