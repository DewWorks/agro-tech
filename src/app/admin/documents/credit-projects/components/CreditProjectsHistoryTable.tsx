'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  FileText,
  Wheat,
  Tractor,
  Eye,
  Edit3,
  Calendar,
  Building2,
  User,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CreditProjectHistoryItem } from '@/actions/credit-projects'
import { UniversalDocumentPreviewModal } from '@/components/documents/UniversalDocumentPreviewModal'
import { A4DocumentPreview } from '../new/components/preview/A4DocumentPreview'
import { CREDIT_TEMPLATES_REGISTRY } from '@/lib/document-templates'

interface CreditProjectsHistoryTableProps {
  initialProjects: CreditProjectHistoryItem[]
}

export function CreditProjectsHistoryTable({ initialProjects }: CreditProjectsHistoryTableProps) {
  const [search, setSearch] = useState('')
  const [axisFilter, setAxisFilter] = useState<'TODOS' | 'CUSTEIO' | 'INVESTIMENTO' | 'OUTROS'>('TODOS')
  const [previewProject, setPreviewProject] = useState<CreditProjectHistoryItem | null>(null)

  const filteredProjects = useMemo(() => {
    let list = initialProjects

    if (axisFilter === 'CUSTEIO') {
      list = list.filter((p) => p.axis === 'CUSTEIO')
    } else if (axisFilter === 'INVESTIMENTO') {
      list = list.filter((p) => p.axis === 'INVESTIMENTO')
    } else if (axisFilter === 'OUTROS') {
      list = list.filter((p) => p.axis === 'PATRIMONIAL' || p.axis === 'CHECKLIST')
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.producerName.toLowerCase().includes(q) ||
          p.producerDocument.toLowerCase().includes(q) ||
          p.propertyName.toLowerCase().includes(q) ||
          p.templateName.toLowerCase().includes(q) ||
          (p.creditLineName && p.creditLineName.toLowerCase().includes(q))
      )
    }

    return list
  }, [initialProjects, axisFilter, search])

  // Mock de documentData para preview em UniversalDocumentPreviewModal
  const previewDocData = useMemo(() => {
    if (!previewProject) return null
    const tmplMeta =
      CREDIT_TEMPLATES_REGISTRY.find((t) => t.code === previewProject.templateCode) || {
        code: previewProject.templateCode,
        title: previewProject.templateName,
        subtitle: 'Projeto Oficial de Crédito Rural',
        type: 'CREDIT',
        category: previewProject.axis,
        bank: 'Banco do Brasil',
        description: '',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      }

    return {
      template: tmplMeta,
      producer: {
        name: previewProject.producerName,
        document: previewProject.producerDocument,
      },
      property: {
        name: previewProject.propertyName,
        city: previewProject.propertyCity,
        state: previewProject.propertyState,
      },
      organization: {
        name: 'Organização Ativa',
      },
      options: previewProject.payloadSnapshot || {},
    }
  }, [previewProject])

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
      {/* Header da Seção de Histórico */}
      <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#1B4D3E]" />
            Histórico de Projetos Técnicos Elaborados
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Consulte, visualize ou continue a elaboração dos projetos de crédito gerados na sua organização.
          </p>
        </div>

        {/* Filtros de Eixo */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            type="button"
            size="sm"
            variant={axisFilter === 'TODOS' ? 'default' : 'outline'}
            onClick={() => setAxisFilter('TODOS')}
            className={`text-xs h-8 px-3 rounded-lg ${
              axisFilter === 'TODOS'
                ? 'bg-[#1B4D3E] text-white hover:bg-[#13382D]'
                : 'text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Todos ({initialProjects.length})
          </Button>

          <Button
            type="button"
            size="sm"
            variant={axisFilter === 'CUSTEIO' ? 'default' : 'outline'}
            onClick={() => setAxisFilter('CUSTEIO')}
            className={`text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 ${
              axisFilter === 'CUSTEIO'
                ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                : 'text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Wheat className="w-3.5 h-3.5 text-emerald-500" />
            Custeio ({initialProjects.filter((p) => p.axis === 'CUSTEIO').length})
          </Button>

          <Button
            type="button"
            size="sm"
            variant={axisFilter === 'INVESTIMENTO' ? 'default' : 'outline'}
            onClick={() => setAxisFilter('INVESTIMENTO')}
            className={`text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 ${
              axisFilter === 'INVESTIMENTO'
                ? 'bg-[#1B4D3E] text-white hover:bg-[#13382D]'
                : 'text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Tractor className="w-3.5 h-3.5 text-emerald-400" />
            Investimento ({initialProjects.filter((p) => p.axis === 'INVESTIMENTO').length})
          </Button>

          <Button
            type="button"
            size="sm"
            variant={axisFilter === 'OUTROS' ? 'default' : 'outline'}
            onClick={() => setAxisFilter('OUTROS')}
            className={`text-xs h-8 px-3 rounded-lg ${
              axisFilter === 'OUTROS'
                ? 'bg-slate-700 text-white hover:bg-slate-800'
                : 'text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Outros ({initialProjects.filter((p) => p.axis === 'PATRIMONIAL' || p.axis === 'CHECKLIST').length})
          </Button>
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por produtor, CPF/CNPJ, imóvel ou linha de crédito..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-white"
          />
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          Exibindo <strong>{filteredProjects.length}</strong> de <strong>{initialProjects.length}</strong> projeto(s)
        </span>
      </div>

      {/* Conteúdo da Tabela ou Estado Vazio */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <FileText className="h-10 w-10 text-gray-300 mx-auto" />
          <h4 className="text-sm font-bold text-gray-700">Nenhum projeto encontrado</h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {search
              ? 'Nenhum resultado corresponde à sua busca. Tente buscar por outros termos ou limpar os filtros.'
              : 'Utilize os cartões mestres acima para iniciar um novo Projeto de Custeio ou Projeto de Investimento.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Data / Emissão</th>
                <th className="py-3 px-4">Proponente (Produtor)</th>
                <th className="py-3 px-4">Imóvel Beneficiado</th>
                <th className="py-3 px-4">Eixo & Linha Oficial</th>
                <th className="py-3 px-4 text-right">Investimento / Custeio</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProjects.map((project) => {
                const formattedDate = project.createdAt
                  ? format(new Date(project.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                  : '-'

                const isCusteio = project.axis === 'CUSTEIO'
                const isInvestimento = project.axis === 'INVESTIMENTO'

                return (
                  <tr key={project.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Data */}
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formattedDate}</span>
                      </div>
                    </td>

                    {/* Produtor */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900 truncate max-w-[200px]">
                        {project.producerName}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono">
                        {project.producerDocument || '-'}
                      </div>
                    </td>

                    {/* Imóvel */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800 truncate max-w-[200px]">
                        {project.propertyName}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {project.propertyCity ? `${project.propertyCity}/${project.propertyState || ''}` : '-'}
                      </div>
                    </td>

                    {/* Eixo & Linha */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {isCusteio ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border-emerald-300 gap-1"
                          >
                            <Wheat className="w-3 h-3 text-emerald-600" />
                            Custeio
                          </Badge>
                        ) : isInvestimento ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold bg-slate-100 text-slate-800 border-slate-300 gap-1"
                          >
                            <Tractor className="w-3 h-3 text-slate-700" />
                            Investimento
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold bg-gray-50 text-gray-700 border-gray-300"
                          >
                            {project.axis}
                          </Badge>
                        )}

                        {project.creditLineName && (
                          <span className="text-[11px] text-gray-700 font-medium truncate max-w-[150px]">
                            {project.creditLineName}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[220px]">
                        {project.templateName}
                      </div>
                    </td>

                    {/* Valores */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {project.totalAmount && project.totalAmount > 0 ? (
                        <>
                          <div className="font-bold text-gray-900">
                            R$ {project.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          {project.financedAmount && project.financedAmount > 0 ? (
                            <div className="text-[10px] text-emerald-700 font-semibold">
                              Financiado: R${' '}
                              {project.financedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-gray-400 font-medium">Sob demanda</span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewProject(project)}
                          className="h-8 px-2.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 text-xs font-semibold gap-1"
                          title="Visualizar documento em formato A4 oficial"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visualizar</span>
                        </Button>

                        <Link
                          href={`/admin/documents/credit-projects/new?template=${project.templateCode}&axis=${
                            isCusteio ? 'custeio' : 'investimento'
                          }`}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-blue-700 hover:text-blue-900 hover:bg-blue-50 text-xs font-semibold gap-1"
                            title="Reabrir esteira para novo preenchimento ou edição"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Reabrir</span>
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Universal de Pré-Visualização */}
      {previewProject && previewDocData && (
        <UniversalDocumentPreviewModal
          isOpen={!!previewProject}
          onClose={() => setPreviewProject(null)}
          title={`Pré-Visualização — ${previewProject.templateName}`}
          subtitle={`${previewProject.producerName} • ${previewProject.propertyName}`}
          badges={
            <Badge
              variant="outline"
              className={`text-[10px] font-bold ${
                previewProject.axis === 'CUSTEIO'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              {previewProject.axis === 'CUSTEIO' ? 'Eixo Custeio Rural' : 'Eixo Investimento Rural'}
            </Badge>
          }
          children={
            <div className="p-4 sm:p-6 bg-white w-full">
              <A4DocumentPreview documentData={previewDocData} />
            </div>
          }
          dpiInfo={
            <>
              Resolução Nativa <strong>336 DPI</strong> • Padrão Banco do Brasil / SICOR • Conformidade Regulatória
            </>
          }
          primaryActionLabel="Imprimir / Baixar Documento"
          onConfirm={() => {
            window.print()
          }}
          showPrintAction={true}
          printActionLabel="Imprimir"
          onPrint={() => {
            window.print()
          }}
        />
      )}
    </div>
  )
}
