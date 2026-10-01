import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import LoginPage from '@/app/(auth)/login/page'

// Mock de ações de autenticação
jest.mock('@/actions/auth', () => ({
  login: jest.fn(),
}))

describe('Diretriz de UI/UX: Redesenho Minimalista e de Alto Impacto do Showcase de Login', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('deve renderizar a estrutura Split-Screen Editorial com a identidade AgroTech sem jargões', () => {
    render(<LoginPage />)

    // Logotipo e Subtítulo Operacional
    expect(screen.getAllByText(/Agro/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Tech/).length).toBeGreaterThanOrEqual(1)
    expect(
      screen.getByText('Inteligência & Gestão de Crédito Rural')
    ).toBeInTheDocument()

    // Proibido utilizar termos de desenvolvimento interno ou "SaaS"
    expect(screen.queryByText(/SaaS/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/336\s*DPI/i)).not.toBeInTheDocument()
  })

  it('deve exibir as 4 pílulas de navegação (CRM, GED, Limite, Projetos) sem truncamento', () => {
    render(<LoginPage />)

    // Apenas 4 botões com palavras exatas
    expect(screen.getByRole('button', { name: /^CRM$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^GED$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Limite$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Projetos$/i })).toBeInTheDocument()

    // Não deve conter reticências nas pílulas
    expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument()
  })

  it('deve exibir a aba CRM por padrão com a pergunta de dor e micro-widget com 3 valores', () => {
    render(<LoginPage />)

    // Pergunta de dor do CRM
    expect(
      screen.getByText('Quer passar a ter controle total sobre sua operação e clientes?')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Cadastro único de produtores e terras com herança instantânea entre safras.'
      )
    ).toBeInTheDocument()

    // Micro-widget do CRM
    expect(screen.getByText(/Fazenda Modelo — 150 ha/)).toBeInTheDocument()
    expect(screen.getByText('R$ 4.200.000')).toBeInTheDocument()
    expect(screen.getByText('R$ 850.000')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.150.000')).toBeInTheDocument()
    expect(screen.getByText('Lastro Patrimonial Auditável')).toBeInTheDocument()
    expect(screen.getByText('Padrão BACEN / MCR')).toBeInTheDocument()
  })

  it('deve alternar para a aba GED com semáforo de 3 números e barra de 94%', () => {
    render(<LoginPage />)

    fireEvent.click(screen.getByRole('button', { name: /^GED$/i }))

    // Pergunta de dor do GED
    expect(
      screen.getByText('Perdendo tempo e perdido com muitos documentos?')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Semáforo automático de validades e organização por safra com zero perda de prazos.'
      )
    ).toBeInTheDocument()

    // Micro-widget do GED: 28 Regulares, 02 Alerta, 00 Vencidos
    expect(screen.getByText('28')).toBeInTheDocument()
    expect(screen.getByText('Regulares')).toBeInTheDocument()
    expect(screen.getByText('02')).toBeInTheDocument()
    expect(screen.getByText('Em Alerta')).toBeInTheDocument()
    expect(screen.getByText('00')).toBeInTheDocument()
    expect(screen.getByText('Vencidos')).toBeInTheDocument()
    expect(screen.getByText('94% de Conformidade')).toBeInTheDocument()
  })

  it('deve alternar para a aba Limite MCR com interatividade viva nos 2 botões de teste', () => {
    render(<LoginPage />)

    fireEvent.click(screen.getByRole('button', { name: /^Limite$/i }))

    // Pergunta de dor do Limite
    expect(
      screen.getByText(
        'Inseguro se o Banco do Brasil vai aprovar a capacidade de pagamento?'
      )
    ).toBeInTheDocument()

    // Estado padrão: R$ 250 Mil -> ICSD 4.72x (Margem Atendida)
    expect(screen.getByText('4.72x')).toBeInTheDocument()
    expect(screen.getByText('Margem Atendida')).toBeInTheDocument()
    expect(screen.getByText('1105%')).toBeInTheDocument()
    expect(
      screen.getByText(/Capacidade de pagamento aprovada perante o Banco do Brasil/)
    ).toBeInTheDocument()

    // Clicar em "R$ 1,5 Milhão" -> Deve alterar instantaneamente para déficit (0.22x)
    fireEvent.click(screen.getByRole('button', { name: /R\$ 1,5 Milhão/i }))
    expect(screen.getByText('0.22x')).toBeInTheDocument()
    expect(screen.getByText('Déficit de Caixa')).toBeInTheDocument()
    expect(screen.getByText('184%')).toBeInTheDocument()
    expect(
      screen.getByText(/Déficit financeiro: requer readequação de garantias/)
    ).toBeInTheDocument()

    // Retornar para R$ 250 Mil
    fireEvent.click(screen.getByRole('button', { name: /R\$ 250 Mil/i }))
    expect(screen.getByText('4.72x')).toBeInTheDocument()
    expect(screen.getByText('Margem Atendida')).toBeInTheDocument()
  })

  it('deve alternar para a aba Projetos com alternador de Custeio e Investimento', () => {
    render(<LoginPage />)

    fireEvent.click(screen.getByRole('button', { name: /^Projetos$/i }))

    // Pergunta de dor de Projetos
    expect(
      screen.getByText('Cansado de redigitar orçamentos e propostas a cada safra?')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Projetos de Custeio e Investimento estruturados nas 15 linhas oficiais em minutos.'
      )
    ).toBeInTheDocument()

    // Custeio por padrão
    expect(screen.getByText('8% a 10,5%')).toBeInTheDocument()
    expect(screen.getByText('Até 14 meses')).toBeInTheDocument()

    // Alternar para Investimento
    fireEvent.click(screen.getByRole('button', { name: /Investimento/i }))
    expect(screen.getByText('7% a 12,5%')).toBeInTheDocument()
    expect(screen.getByText('Até 10 anos')).toBeInTheDocument()
  })

  it('deve pausar a rotação ao passar o mouse e avançar suavemente a cada 5s', () => {
    render(<LoginPage />)

    const container = screen.getByLabelText('Vitrine Interativa de Módulos')

    // Mouse enter -> Pausado
    fireEvent.mouseEnter(container)
    expect(screen.getByText('Pausado')).toBeInTheDocument()

    // Mouse leave -> Retoma
    fireEvent.mouseLeave(container)
    expect(screen.queryByText('Pausado')).not.toBeInTheDocument()

    // Avançar 5s -> Vai para a próxima aba (GED)
    act(() => {
      jest.advanceTimersByTime(5050)
    })
    expect(
      screen.getByText('Perdendo tempo e perdido com muitos documentos?')
    ).toBeInTheDocument()
  })

  it('deve renderizar os campos corporativos formais e rodapés alinhados', () => {
    render(<LoginPage />)

    // Form à direita
    expect(screen.getByText('Acesse sua conta corporativa')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail Corporativo')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha de Acesso')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Acessar Plataforma/i })).toBeInTheDocument()

    // Rodapé esquerdo
    expect(screen.getByText(/LN Consultoria • Todos os direitos reservados/)).toBeInTheDocument()
    expect(screen.getByText(/Ambiente Protegido • Nível Bancário/)).toBeInTheDocument()

    // Rodapé direito
    expect(screen.getByText('Plataforma de Gestão de Crédito Rural')).toBeInTheDocument()
    expect(screen.getByText('Termos de Uso')).toBeInTheDocument()
    expect(screen.getByText('Política de Privacidade')).toBeInTheDocument()
  })
})
