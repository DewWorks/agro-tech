import { getUserContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, 
  Plus, 
  CheckCircle2, 
  DollarSign, 
  Leaf, 
  Sun, 
  Wheat, 
  ArrowRight,
  Landmark,
  ShieldCheck,
  FileCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CREDIT_TEMPLATES_REGISTRY } from '@/lib/document-templates'

export default async function CreditProjectsHubPage() {
  const user = await getUserContext()
  if (!user) redirect('/login')

  const getIcon = (code: string) => {
    switch (code) {
      case 'CHECKLIST_PROFISSIONAL': return FileCheck
      case 'LIMITE_CREDITO_BB': return Landmark
      case 'PROJETO_RENOVAGRO': return Leaf
      case 'PROJETO_INOVAGRO': return Sun
      case 'PROJETO_CUSTEIO_SAFRA': return Wheat
      default: return FileText
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="text-[#1B4D3E] w-6 h-6" />
              Documentos & Declarações Legais
            </h1>
            <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              Padrão Banco do Brasil
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Geração de declarações ambientais, fundiárias e autorizações bancárias preenchidas automaticamente.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/admin/documents/declarations/new">
            <Button className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold shadow-xs px-4 h-10 text-xs flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Declaração
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid de Modelos Oficiais */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#1B4D3E]" />
            Modelos de Documentos Oficiais (Padrão Banco do Brasil)
          </h2>
          <span className="text-xs text-muted-foreground">{CREDIT_TEMPLATES_REGISTRY.filter(t => t.type === 'LEGAL').length} modelos disponíveis</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CREDIT_TEMPLATES_REGISTRY.filter(t => t.type === 'LEGAL').map((tmpl) => {
            const Icon = getIcon(tmpl.code)
            return (
              <div 
                key={tmpl.code}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-[#1B4D3E]/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="h-12 w-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#1B4D3E] group-hover:scale-105 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-semibold ${tmpl.badgeColor}`}>
                      {tmpl.bank}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-[#1B4D3E] transition-colors">
                    {tmpl.title}
                  </h3>
                  <p className="text-xs font-medium text-emerald-800 mb-2">
                    {tmpl.subtitle}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-gray-400">
                    PDF & DOCX
                  </span>
                  <Link href={`/admin/documents/declarations/new?template=${tmpl.code}`}>
                    <Button variant="ghost" size="sm" className="text-[#1B4D3E] hover:text-[#13382D] hover:bg-emerald-50 font-semibold text-xs flex items-center gap-1.5 p-0">
                      Gerar Declaração
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Destaques da Esteira Operacional */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#1B4D3E]" />
          Como funciona a esteira de declarações
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-slate-600">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="font-bold text-[#1B4D3E] block mb-1">1. Cadastro Central</span>
            Os dados do produtor, cônjuge, matrícula, CAR e rebanho são recuperados automaticamente.
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="font-bold text-[#1B4D3E] block mb-1">2. Tabela Oficial BB</span>
            As benfeitorias e valores de terra são balizados pela tabela de referência oficial.
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="font-bold text-[#1B4D3E] block mb-1">3. Live Preview</span>
            Visualização em formato A4 em tempo real com campos editáveis e personalização ágil.
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="font-bold text-[#1B4D3E] block mb-1">4. Emissão Multiformato</span>
            Exportação direta em PDF para impressão e download em DOCX para protocolo bancário.
          </div>
        </div>
      </div>

    </div>
  )
}
