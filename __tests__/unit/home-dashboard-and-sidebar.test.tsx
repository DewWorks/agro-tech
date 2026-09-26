import React from 'react'
import { render, screen } from '@testing-library/react'
import AdminSidebar from '@/components/admin/layout/AdminSidebar'
import { HomeHeader } from '@/components/admin/home/HomeHeader'
import { QuickActionsGrid } from '@/components/admin/home/QuickActionsGrid'
import { DemandsOverviewColumn } from '@/components/admin/home/DemandsOverviewColumn'
import { GedHealthColumn } from '@/components/admin/home/GedHealthColumn'
import { PatrimonialSummaryFooter } from '@/components/admin/home/PatrimonialSummaryFooter'

import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'
import { Landmark } from 'lucide-react'

// Mocks do Next.js com pathname dinâmico para testar rotas e hierarquia
let mockCurrentPathname = '/admin'
jest.mock('next/navigation', () => ({
  usePathname: () => mockCurrentPathname,
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
    toString: () => '',
  }),
}))

describe('Refatoração da Sidebar e Identidade Visual (Diretriz 2)', () => {
  beforeEach(() => {
    mockCurrentPathname = '/admin'
  })

  it('deve renderizar a identidade institucional AgroTech SaaS com o nome dinâmico da organização', () => {
    render(
      <AdminSidebar
        role="OWNER"
        modules={['CRM', 'GED', 'DEMANDS', 'FINANCIAL_SUMMARY']}
        organizationName="Agropecuária Vale do Sol"
        user={{
          fullName: 'Carlos Eduardo Silva',
          email: 'carlos@agrotech.com.br',
          role: 'OWNER',
        }}
      />
    )

    expect(screen.getByText('Agro')).toBeInTheDocument()
    expect(screen.getByText('Tech')).toBeInTheDocument()
    expect(screen.getByText('SaaS')).toBeInTheDocument()
    expect(screen.getByText('Agropecuária Vale do Sol')).toBeInTheDocument()
    expect(screen.queryByText('LN Consultoria Rural')).not.toBeInTheDocument()
  })

  it('deve exibir os quatro blocos temáticos oficiais', () => {
    render(
      <AdminSidebar
        role="OWNER"
        modules={['CRM', 'GED', 'DEMANDS', 'FINANCIAL_SUMMARY']}
        user={{
          fullName: 'Carlos Eduardo Silva',
          email: 'carlos@agrotech.com.br',
          role: 'OWNER',
        }}
      />
    )

    expect(screen.getByText('Visão Geral')).toBeInTheDocument()
    expect(screen.getByText('Operação Agropecuária')).toBeInTheDocument()
    expect(screen.getByText('Documental & Crédito')).toBeInTheDocument()
    expect(screen.getByText('Governança & Sistema')).toBeInTheDocument()
  })

  it('não deve conter botões de criação direta na sidebar', () => {
    render(
      <AdminSidebar
        role="OWNER"
        modules={['CRM', 'GED', 'DEMANDS', 'FINANCIAL_SUMMARY']}
        user={{
          fullName: 'Carlos Eduardo Silva',
          email: 'carlos@agrotech.com.br',
          role: 'OWNER',
        }}
      />
    )

    expect(screen.queryByText('Novo Produtor')).not.toBeInTheDocument()
    expect(screen.queryByText('Nova Propriedade')).not.toBeInTheDocument()
    expect(screen.queryByText('Nova Filial')).not.toBeInTheDocument()
    expect(screen.queryByText('Nova Demanda')).not.toBeInTheDocument()
    expect(screen.queryByText('Novo Utilizador')).not.toBeInTheDocument()
  })

  it('deve utilizar estritamente a terminologia formal brasileira Usuários', () => {
    render(
      <AdminSidebar
        role="OWNER"
        modules={['CRM', 'GED', 'DEMANDS', 'FINANCIAL_SUMMARY']}
        user={{
          fullName: 'Carlos Eduardo Silva',
          email: 'carlos@agrotech.com.br',
          role: 'OWNER',
        }}
      />
    )

    expect(screen.getByText('Usuários')).toBeInTheDocument()
    expect(screen.queryByText('Utilizadores')).not.toBeInTheDocument()
  })

  it('deve exibir o rodapé com dados do usuário logado e botão de logout', () => {
    render(
      <AdminSidebar
        role="OWNER"
        modules={['CRM', 'GED', 'DEMANDS', 'FINANCIAL_SUMMARY']}
        user={{
          fullName: 'Carlos Eduardo Silva',
          email: 'carlos@agrotech.com.br',
          role: 'OWNER',
        }}
      />
    )

    expect(screen.getByText('Carlos Eduardo Silva')).toBeInTheDocument()
    expect(screen.getByText('Administrador (Proprietário)')).toBeInTheDocument()
    expect(screen.getByTitle('Encerrar Sessão')).toBeInTheDocument()
  })

  it('não deve ativar nem expandir GED Enterprise ao acessar Projetos de Crédito (/admin/documents/credit-projects)', () => {
    mockCurrentPathname = '/admin/documents/credit-projects'

    render(
      <AdminSidebar
        role="OWNER"
        modules={['CRM', 'GED', 'DEMANDS', 'FINANCIAL_SUMMARY']}
        user={{
          fullName: 'Carlos Eduardo Silva',
          email: 'carlos@agrotech.com.br',
          role: 'OWNER',
        }}
      />
    )

    // O link de Projetos de Crédito deve estar com classe ativa de destaque
    const creditProjectsLink = screen.getByText('Projetos de Crédito').closest('a')
    expect(creditProjectsLink).toHaveClass('border-emerald-400')

    // O botão de GED Enterprise NÃO deve estar ativo
    const gedButton = screen.getByText('GED Enterprise').closest('button')
    expect(gedButton).not.toHaveClass('border-emerald-400')

    // Os subitens do GED não devem estar visíveis pois GED Enterprise não deve estar expandido
    expect(screen.queryByText('Explorador de Arquivos')).not.toBeInTheDocument()
  })

  it('deve isolar a seleção de Propriedades Rurais sem ativar Produtores Rurais em /admin/crm/properties', () => {
    mockCurrentPathname = '/admin/crm/properties'

    render(
      <AdminSidebar
        role="OWNER"
        modules={['CRM', 'GED', 'DEMANDS', 'FINANCIAL_SUMMARY']}
        user={{
          fullName: 'Carlos Eduardo Silva',
          email: 'carlos@agrotech.com.br',
          role: 'OWNER',
        }}
      />
    )

    // CRM de Produtores deve estar expandido e ativo
    const crmButton = screen.getByText('CRM de Produtores').closest('button')
    expect(crmButton).toHaveClass('border-emerald-400')

    // Propriedades Rurais deve estar ativo
    const propertiesLink = screen.getByText('Propriedades Rurais').closest('a')
    expect(propertiesLink).toHaveClass('border-emerald-400')

    // Produtores Rurais NÃO deve estar ativo
    const producersLink = screen.getByText('Produtores Rurais').closest('a')
    expect(producersLink).not.toHaveClass('border-emerald-400')
  })
})

describe('Reformulação da Página Inicial (Diretriz 3)', () => {
  it('Seção 1: HomeHeader deve saudar o usuário e exibir contexto de filial e data', () => {
    render(
      <HomeHeader
        userName="Carlos Eduardo"
        activeBranchName="Matriz Centro-Oeste"
        branches={[{ id: 'b1', name: 'Matriz Centro-Oeste' }]}
        currentBranchId="b1"
        isOwnerOrSuperAdmin={true}
      />
    )

    expect(screen.getByText(/Carlos/)).toBeInTheDocument()
    expect(screen.getAllByText('Matriz Centro-Oeste').length).toBeGreaterThanOrEqual(1)
  })

  it('Seção 2: QuickActionsGrid deve renderizar os 5 cards temáticos de acesso rápido', () => {
    render(<QuickActionsGrid />)

    expect(screen.getByText('Nova Demanda Rural')).toBeInTheDocument()
    expect(screen.getByText('Cadastrar Produtor')).toBeInTheDocument()
    expect(screen.getByText('Mapear Propriedade')).toBeInTheDocument()
    expect(screen.getByText('Emitir Documento Oficial')).toBeInTheDocument()
    expect(screen.getByText('Explorador do GED')).toBeInTheDocument()
  })

  it('Seção 3 (Coluna Esquerda): DemandsOverviewColumn deve exibir régua de status e alertas', () => {
    render(
      <DemandsOverviewColumn
        metrics={{
          solicitado: 5,
          emExecucao: 8,
          aguardandoDocumentacao: 2,
          concluido: 14,
          totalAtivas: 15,
          overdueCount: 1,
          warning30Count: 3,
          recentDemands: [],
        }}
      />
    )

    expect(screen.getByText('Acompanhamento de Demandas')).toBeInTheDocument()
    expect(screen.getByText('Solicitado')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Em Execução')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('Aguardando Doc.')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Concluído')).toBeInTheDocument()
    expect(screen.getByText('14')).toBeInTheDocument()
    expect(screen.getByText('1 atrasada(s)')).toBeInTheDocument()
    expect(screen.getByText('3 com prazo crítico (≤ 30 dias)')).toBeInTheDocument()
  })

  it('Seção 3 (Coluna Direita): GedHealthColumn deve exibir medidor de nuvem e semáforo', () => {
    render(
      <GedHealthColumn
        ged={{
          totalBytes: 5242880,
          formattedUsed: '5.00 MB',
          limitFormatted: '50 GB',
          percentage: 0.01,
          validCount: 42,
          alertCount: 4,
          expiredCount: 1,
          totalDocsCount: 47,
          emittedCount: 15,
          priorityDocuments: [],
        }}
      />
    )

    expect(screen.getByText('Saúde Documental & Armazenamento')).toBeInTheDocument()
    expect(screen.getByText(/50 GB/)).toBeInTheDocument()
    expect(screen.getByText('Arquivos Emitidos:')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('Válidos')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Em Aviso')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('Vencidos')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('Seção 4: PatrimonialSummaryFooter deve consolidar os totais gerais com o termo Usuários', () => {
    render(
      <PatrimonialSummaryFooter
        summary={{
          totalProducers: 120,
          totalProperties: 185,
          totalHectares: 45200.5,
          formattedHectares: '45.200,50',
          totalBranches: 4,
          totalUsers: 18,
        }}
      />
    )

    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('Produtores Rurais')).toBeInTheDocument()
    expect(screen.getByText('185')).toBeInTheDocument()
    expect(screen.getByText(/45\.200,50 ha/)).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('Filiais Ativas')).toBeInTheDocument()
    expect(screen.getByText('18')).toBeInTheDocument()
    expect(screen.getByText('Usuários no Sistema')).toBeInTheDocument()
    expect(screen.queryByText(/Utilizadores/)).not.toBeInTheDocument()
  })
})

describe('Componente Padronizado de Cabeçalho Executivo (PageHeaderBanner)', () => {
  it('deve renderizar o card de cabeçalho padronizado com gradiente verde corporativo, título, descrição, etiqueta e ações', () => {
    render(
      <PageHeaderBanner
        badge="Esteira Oficial de Crédito Rural • Banco do Brasil"
        badgeIcon={Landmark}
        title="Projetos & Documentos de Crédito Rural"
        description="Geração fidedigna de propostas, checklists operacionais, laudos técnicos de investimento."
        actions={<button>+ Novo Documento / Projeto</button>}
      />
    )

    expect(screen.getByText('Esteira Oficial de Crédito Rural • Banco do Brasil')).toBeInTheDocument()
    expect(screen.getByText('Projetos & Documentos de Crédito Rural')).toBeInTheDocument()
    expect(
      screen.getByText('Geração fidedigna de propostas, checklists operacionais, laudos técnicos de investimento.')
    ).toBeInTheDocument()
    expect(screen.getByText('+ Novo Documento / Projeto')).toBeInTheDocument()
  })
})

