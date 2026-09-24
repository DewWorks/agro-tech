import React from 'react'
import { render, screen } from '@testing-library/react'
import { DemandSlaBadge } from '@/components/demands/DemandSlaBadge'

describe('DemandSlaBadge — Régua Calibrada de Prazos (SLA)', () => {
  it('deve formatar como Vermelho (bg-red-50 text-red-700) para prazos atrasados (daysRemaining < 0)', () => {
    const { container } = render(
      <DemandSlaBadge
        sla={{
          status: 'ATRASADO',
          daysRemaining: -4,
          daysDelayed: 4,
          label: 'Atrasado há 4 dia(s)',
        }}
      />
    )

    const badge = container.querySelector('span.inline-flex')
    expect(badge).toHaveClass('bg-red-50')
    expect(badge).toHaveClass('text-red-700')
    expect(badge).toHaveClass('border-red-200')
  })

  it('deve formatar como Laranja (bg-orange-50 text-orange-800) para prazos críticos de 0 a 7 dias', () => {
    const { container, rerender } = render(
      <DemandSlaBadge
        sla={{
          status: 'ALERTA',
          daysRemaining: 0,
          daysDelayed: 0,
          label: 'Vence Hoje',
        }}
      />
    )

    let badge = container.querySelector('span.inline-flex')
    expect(badge).toHaveClass('bg-orange-50')
    expect(badge).toHaveClass('text-orange-800')
    expect(badge).toHaveClass('border-orange-300')

    rerender(
      <DemandSlaBadge
        sla={{
          status: 'ALERTA',
          daysRemaining: 5,
          daysDelayed: 0,
          label: 'Vence em 5 dia(s)',
        }}
      />
    )

    badge = container.querySelector('span.inline-flex')
    expect(badge).toHaveClass('bg-orange-50')
    expect(badge).toHaveClass('text-orange-800')
  })

  it('deve formatar como Âmbar (bg-amber-50 text-amber-800) para aviso entre 8 e 30 dias', () => {
    const { container } = render(
      <DemandSlaBadge
        sla={{
          status: 'NO_PRAZO',
          daysRemaining: 21,
          daysDelayed: 0,
          label: 'Restam 21 dia(s)',
        }}
      />
    )

    const badge = container.querySelector('span.inline-flex')
    expect(badge).toHaveClass('bg-amber-50')
    expect(badge).toHaveClass('text-amber-800')
    expect(badge).toHaveClass('border-amber-200')
  })

  it('deve formatar como Neutro (bg-slate-50 text-slate-600) para prazos confortáveis (> 30 dias)', () => {
    const { container } = render(
      <DemandSlaBadge
        sla={{
          status: 'NO_PRAZO',
          daysRemaining: 45,
          daysDelayed: 0,
          label: 'Restam 45 dia(s)',
        }}
      />
    )

    const badge = container.querySelector('span.inline-flex')
    expect(badge).toHaveClass('bg-slate-50')
    expect(badge).toHaveClass('text-slate-600')
    expect(badge).toHaveClass('border-slate-200')
  })

  it('deve formatar corretamente demandas concluídas no prazo e com atraso', () => {
    const { container, rerender } = render(
      <DemandSlaBadge
        sla={{
          status: 'CONCLUIDO_NO_PRAZO',
          daysRemaining: null,
          daysDelayed: 0,
          label: 'Concluído no Prazo',
        }}
      />
    )

    let badge = container.querySelector('span.inline-flex')
    expect(badge).toHaveClass('bg-emerald-50')
    expect(badge).toHaveClass('text-emerald-700')

    rerender(
      <DemandSlaBadge
        sla={{
          status: 'CONCLUIDO_COM_ATRASO',
          daysRemaining: 0,
          daysDelayed: 2,
          label: 'Concluído com 2 dia(s) de atraso',
        }}
      />
    )

    badge = container.querySelector('span.inline-flex')
    expect(badge).toHaveClass('bg-amber-50')
    expect(badge).toHaveClass('text-amber-800')
  })
})
