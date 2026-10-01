import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Plus, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  TreePine,
  Users,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner'
import { getLegalDeclarationsHistory } from '@/actions/legal-documents'
import { LegalDeclarationsHistoryTable } from './components/LegalDeclarationsHistoryTable'

export default async function DeclarationsHubPage() {
  const user = await getUserContext()
  if (!user) redirect('/login')

  const historyDeclarations = await getLegalDeclarationsHistory()

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Top Banner & Header Oficial */}
      <PageHeaderBanner
        badge="Padrão Banco do Brasil"
        badgeIcon={<ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" />}
        title="Documento e Declarações legais"
        description="Emissão unificada de declarações de compliance, autorizações bancárias, regularidade ambiental e garantias agropecuárias com preenchimento automático."
        actions={
          <Link href="/admin/documents/declarations/new">
            <Button className="bg-white hover:bg-emerald-50 text-[#1B4D3E] font-bold shadow-md px-6 py-6 text-sm flex items-center gap-2 cursor-pointer">
              <Plus className="h-5 w-5" />
              Nova Declaração
            </Button>
          </Link>
        }
      />

      {/* =================================================================== */}
      {/* 1. OS 3 GRANDES CARDS MESTRES DE CATEGORIA */}
      {/* =================================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#1B4D3E]" />
            Categorias de Documentos & Declarações Oficiais
          </h2>
          <span className="text-xs text-muted-foreground">3 grupos operacionais • 8 modelos oficiais</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CARD MESTRE 1: AUTORIZAÇÕES BANCÁRIAS & COMPLIANCE */}
          <div className="bg-gradient-to-br from-white via-emerald-50/15 to-emerald-50/30 border-2 border-emerald-600/30 hover:border-emerald-600/60 rounded-2xl p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform shrink-0">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] font-bold">
                    Padrão BB / BACEN
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 border-emerald-200">
                    3 Modelos
                  </Badge>
                </div>
              </div>

              <h3 className="text-lg font-black text-gray-900 mb-1 group-hover:text-[#1B4D3E] transition-colors leading-snug">
                Autorizações Bancárias & Compliance
              </h3>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-2.5">
                Padrão Banco do Brasil / BACEN
              </p>

              <p className="text-xs text-gray-600 leading-relaxed mb-4 min-h-[36px]">
                Documentos de autorização para checagem cadastral e fiscal do produtor perante os sistemas regulatórios e instituições financeiras.
              </p>

              {/* Lista compacta com marcadores dos modelos inclusos */}
              <div className="bg-white/90 border border-emerald-100 rounded-xl p-3.5 mb-6 space-y-2 text-xs text-gray-700 shadow-2xs">
                <div className="font-semibold text-gray-900 text-[11px] uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Modelos Inclusos no Grupo:
                </div>
                <ul className="space-y-1.5 pl-1">
                  <li className="flex items-start gap-2 text-[11.5px] leading-tight">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Consulta ao SCR (Sistema de Informações de Crédito)</span>
                  </li>
                  <li className="flex items-start gap-2 text-[11.5px] leading-tight">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Consulta ao SICOR (Crédito Rural e Proagro)</span>
                  </li>
                  <li className="flex items-start gap-2 text-[11.5px] leading-tight">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Compartilhamento de Dados Cadastrais (LGPD)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-500 font-medium">
                Resolução BACEN / SCR
              </span>
              <Link href="/admin/documents/declarations/new?category=bancario-compliance&template=AUTORIZACAO_SCR">
                <Button className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-bold px-4 h-10 rounded-xl shadow-xs gap-2 cursor-pointer">
                  Emitir Declarações do Grupo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* CARD MESTRE 2: REGULARIDADE AMBIENTAL & FUNDIÁRIA */}
          <div className="bg-gradient-to-br from-white via-emerald-50/15 to-emerald-50/30 border-2 border-emerald-600/30 hover:border-emerald-600/60 rounded-2xl p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform shrink-0">
                  <TreePine className="h-7 w-7" />
                </div>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] font-bold">
                    Segurança Jurídica
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 border-emerald-200">
                    3 Modelos
                  </Badge>
                </div>
              </div>

              <h3 className="text-lg font-black text-gray-900 mb-1 group-hover:text-[#1B4D3E] transition-colors leading-snug">
                Regularidade Ambiental & Fundiária
              </h3>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-2.5">
                Segurança Jurídica da Terra
              </p>

              <p className="text-xs text-gray-600 leading-relaxed mb-4 min-h-[36px]">
                Declarações comprobatórias de domínio, posse e conformidade ecológica do imóvel rural financiado perante o Banco do Brasil e IBAMA.
              </p>

              {/* Lista compacta com marcadores dos modelos inclusos */}
              <div className="bg-white/90 border border-emerald-100 rounded-xl p-3.5 mb-6 space-y-2 text-xs text-gray-700 shadow-2xs">
                <div className="font-semibold text-gray-900 text-[11px] uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Modelos Inclusos no Grupo:
                </div>
                <ul className="space-y-1.5 pl-1">
                  <li className="flex items-start gap-2 text-[11.5px] leading-tight">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Declaração de Posse Mansa e Pacífica</span>
                  </li>
                  <li className="flex items-start gap-2 text-[11.5px] leading-tight">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Declaração de Regularidade Ambiental (Sem Embargos)</span>
                  </li>
                  <li className="flex items-start gap-2 text-[11.5px] leading-tight">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Declaração de Imóvel Fora do Bioma (Amazônia/Pantanal)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-500 font-medium">
                Conformidade CAR & IBAMA
              </span>
              <Link href="/admin/documents/declarations/new?category=ambiental-fundiaria&template=DECLARACAO_REGULARIDADE_AMBIENTAL">
                <Button className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-bold px-4 h-10 rounded-xl shadow-xs gap-2 cursor-pointer">
                  Emitir Declarações do Grupo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* CARD MESTRE 3: ENQUADRAMENTO SOCIAL & GARANTIAS */}
          <div className="bg-gradient-to-br from-white via-emerald-50/15 to-emerald-50/30 border-2 border-emerald-600/30 hover:border-emerald-600/60 rounded-2xl p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform shrink-0">
                  <Users className="h-7 w-7" />
                </div>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] font-bold">
                    Produtor & Rebanho
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 border-emerald-200">
                    2 Modelos
                  </Badge>
                </div>
              </div>

              <h3 className="text-lg font-black text-gray-900 mb-1 group-hover:text-[#1B4D3E] transition-colors leading-snug">
                Enquadramento Social & Garantias
              </h3>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-2.5">
                Produtor & Rebanho em Penhor
              </p>

              <p className="text-xs text-gray-600 leading-relaxed mb-4 min-h-[36px]">
                Validação de enquadramento em programas governamentais (Pronaf/CAF) e formalização de garantias agropecuárias e penhor de rebanho.
              </p>

              {/* Lista compacta com marcadores dos modelos inclusos */}
              <div className="bg-white/90 border border-emerald-100 rounded-xl p-3.5 mb-6 space-y-2 text-xs text-gray-700 shadow-2xs">
                <div className="font-semibold text-gray-900 text-[11px] uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Modelos Inclusos no Grupo:
                </div>
                <ul className="space-y-1.5 pl-1">
                  <li className="flex items-start gap-2 text-[11.5px] leading-tight">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Solicitação e Enquadramento CAF / Pronaf</span>
                  </li>
                  <li className="flex items-start gap-2 text-[11.5px] leading-tight">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Identificação de Animais em Garantia (Penhor Pecuário)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-500 font-medium">
                PRONAF & Penhor Pecuário
              </span>
              <Link href="/admin/documents/declarations/new?category=social-garantias&template=ENQUADRAMENTO_CAF">
                <Button className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-bold px-4 h-10 rounded-xl shadow-xs gap-2 cursor-pointer">
                  Emitir Declarações do Grupo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. TABELA HISTÓRICA DE DECLARAÇÕES EMITIDAS */}
      {/* =================================================================== */}
      <LegalDeclarationsHistoryTable initialDeclarations={historyDeclarations} />

      {/* =================================================================== */}
      {/* 3. COMO FUNCIONA A ESTEIRA OPERACIONAL */}
      {/* =================================================================== */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#1B4D3E]" />
          Como funciona a esteira de declarações & minutas legais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-slate-600">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="font-bold text-[#1B4D3E] block mb-1">1. Escolha a Categoria</span>
            Acesse qualquer um dos 3 grupos mestres e escolha o modelo desejado diretamente no seletor suspenso.
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="font-bold text-[#1B4D3E] block mb-1">2. Dados Preservados</span>
            Ao alternar entre modelos, os dados cadastrais do produtor e do imóvel selecionados continuam vinculados.
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="font-bold text-[#1B4D3E] block mb-1">3. Preview Universal 336 DPI</span>
            Pré-visualize a folha A4 com alta nitidez, controle de zoom e formatação oficial do Banco do Brasil.
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="font-bold text-[#1B4D3E] block mb-1">4. Emissão e Registro</span>
            Download direto do PDF e registro automático no histórico documental da organização rural.
          </div>
        </div>
      </div>

    </div>
  )
}
