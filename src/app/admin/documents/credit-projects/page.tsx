import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Wheat,
  Tractor,
  ArrowRight,
  Landmark,
  ShieldCheck,
  FileCheck,
  Coins,
  Sprout,
  Sun,
  Layers,
  Sparkles,
  ClipboardList
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'
import { listCreditProjects } from '@/actions/credit-projects'
import { CreditProjectsHistoryTable } from './components/CreditProjectsHistoryTable'

export default async function CreditProjectsHubPage() {
  const user = await getUserContext()
  if (!user) redirect('/login')

  const isSuperAdmin = user.role === 'SUPER_ADMIN' || (user as any).realRole === 'SUPER_ADMIN'
  const isOrgFinancialEnabled = (user.organization?.modules || []).includes('FINANCIAL_SUMMARY')
  const hasFinancialModule = isSuperAdmin || isOrgFinancialEnabled

  // Carregar histórico de projetos já emitidos/salvos no banco
  const historyProjects = await listCreditProjects()

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Header Oficial */}
      <PageHeaderBanner
        badge="Esteira Oficial de Crédito Rural • LN Consultoria"
        badgeIcon={<Landmark className="h-4 w-4 shrink-0 text-emerald-300" />}
        title="Projetos Técnicos de Crédito Rural"
        description="Esteira simplificada para elaboração de projetos de custeio agrícola e pecuário ou investimentos em máquinas, pastagens, tecnologia e infraestrutura, com integração às 15 linhas oficiais do Plano Safra."
      />

      {/* =================================================================== */}
      {/* 1. OS DOIS GRANDES CARDS MESTRES (CUSTEIO vs INVESTIMENTO) */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD MESTRE 1: PROJETOS DE CUSTEIO */}
        <div className="bg-gradient-to-br from-white via-emerald-50/20 to-emerald-50/50 border-2 border-emerald-600/30 hover:border-emerald-600/60 rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

          <div>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
                <Wheat className="h-7 w-7" />
              </div>
              <div className="flex flex-wrap gap-1.5 justify-end">
                <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] font-bold">
                  Ciclo Produtivo Anual
                </Badge>
                <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 border-emerald-200">
                  SICOR / MCR
                </Badge>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-1 group-hover:text-[#1B4D3E] transition-colors">
              Projetos de Custeio
            </h2>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-3">
              Lavouras Agrícolas • Grãos • Pecuária de Corte e Leite
            </p>

            <p className="text-xs text-gray-600 leading-relaxed mb-5">
              Elaboração técnica de orçamentos e propostas para o ciclo produtivo anual: insumos agrícolas (sementes,
              fertilizantes e defensivos), preparo do solo e tratos culturais, além de custeio pecuário completo com
              aquisição de animais para recria/engorda, nutrição e pastagem.
            </p>

            {/* Destaques Técnicos do Eixo */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/80 border border-emerald-100 rounded-xl p-3 mb-6">
              <div className="flex items-center gap-2 text-gray-700">
                <Sprout className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Soja, Milho, Trigo e Grãos</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Coins className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Recria, Engorda e Nutrição</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Layers className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>PRONAMP, PRONAF B e Livres</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Orçamento Oficial SICOR / BB</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-500 font-medium">
              Taxas oficiais de 0,5% a 8,0% a.a.
            </span>
            <Link href="/admin/documents/credit-projects/new?axis=custeio&template=PROJETO_CUSTEIO_SAFRA">
              <Button className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-bold px-5 h-10 rounded-xl shadow-sm gap-2 cursor-pointer">
                Iniciar Projeto de Custeio
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* CARD MESTRE 2: PROJETOS DE INVESTIMENTO */}
        <div className="bg-gradient-to-br from-white via-emerald-50/20 to-emerald-50/50 border-2 border-emerald-600/30 hover:border-emerald-600/60 rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

          <div>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
                <Tractor className="h-7 w-7" />
              </div>
              <div className="flex flex-wrap gap-1.5 justify-end">
                <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] font-bold">
                  Bens Duráveis & Obras
                </Badge>
                <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 border-emerald-200">
                  Até 10 a 12 Anos
                </Badge>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-1 group-hover:text-[#1B4D3E] transition-colors">
              Projetos de Investimento
            </h2>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-3">
              Máquinas • Pastagens • Energia Solar • Silos & Benfeitorias
            </p>

            <p className="text-xs text-gray-600 leading-relaxed mb-5">
              Projetos técnicos e laudos periciais para aquisição de bens duráveis: recuperação e reforma de pastagens
              (RenovAgro), tecnologia e energia solar (InovAgro), aquisição de tratores e colheitadeiras (Moderfrota),
              construção de armazéns e silos (PCA) e estruturação de propriedades.
            </p>

            {/* Destaques Técnicos do Eixo */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/80 border border-emerald-100 rounded-xl p-3 mb-6">
              <div className="flex items-center gap-2 text-gray-700">
                <Tractor className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Tratores e Moderfrota</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Sprout className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>RenovAgro (Solo & ILPF)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Sun className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>InovAgro (Solar & Precisão)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Landmark className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>PCA (Armazéns & Silos)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-500 font-medium">
              Carência de até 36 a 48 meses
            </span>
            <Link href="/admin/documents/credit-projects/new?axis=investimento&template=PROJETO_RENOVAGRO">
              <Button className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-bold px-5 h-10 rounded-xl shadow-xs gap-2 cursor-pointer">
                Iniciar Projeto de Investimento
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. ATALHOS RÁPIDOS COMPLEMENTARES DA ESTEIRA */}
      {/* =================================================================== */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#1B4D3E] shadow-2xs shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              Documentos Complementares de Triagem e Patrimônio
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Acesse a ficha cadastral BB, checklist de triagem operacional e declarações obrigatórias.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {hasFinancialModule && (
            <Link href="/admin/documents/credit-projects/new?template=LIMITE_CREDITO_BB">
              <Button variant="outline" size="sm" className="text-xs h-8 bg-white border-slate-300 text-slate-800 hover:bg-slate-100">
                <Landmark className="w-3.5 h-3.5 mr-1 text-[#1B4D3E]" />
                Limite & Patrimônio BB
              </Button>
            </Link>
          )}

          <Link href="/admin/documents/credit-projects/new?template=CHECKLIST_PROFISSIONAL">
            <Button variant="outline" size="sm" className="text-xs h-8 bg-white border-slate-300 text-slate-800 hover:bg-slate-100">
              <FileCheck className="w-3.5 h-3.5 mr-1 text-emerald-700" />
              Checklist de Atendimento
            </Button>
          </Link>

          <Link href="/admin/documents/declarations">
            <Button variant="outline" size="sm" className="text-xs h-8 bg-white border-slate-300 text-slate-800 hover:bg-slate-100">
              <ClipboardList className="w-3.5 h-3.5 mr-1 text-[#1B4D3E]" />
              Minutas & Declarações
            </Button>
          </Link>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. TABELA HISTÓRICA DE PROJETOS ELABORADOS */}
      {/* =================================================================== */}
      <CreditProjectsHistoryTable initialProjects={historyProjects} />
    </div>
  )
}
