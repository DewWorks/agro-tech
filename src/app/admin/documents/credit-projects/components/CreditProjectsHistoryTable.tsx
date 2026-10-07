'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  ChevronDown,
  Kanban,
  Calculator,
  CreditCard,
  Link2,
  AlertTriangle,
  Loader2,
  Layers,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CreditProjectHistoryItem,
  createDemandFromCreditProject,
} from '@/actions/credit-projects'
import { UniversalDocumentPreviewModal } from '@/components/documents/UniversalDocumentPreviewModal'
import { A4DocumentPreview } from '../new/components/preview/A4DocumentPreview'
import { CREDIT_TEMPLATES_REGISTRY } from '@/lib/document-templates'
import { CreditProjectDetailsDrawer } from './CreditProjectDetailsDrawer'
import { BillProjectFeeModal } from './BillProjectFeeModal'
import { LinkDemandModal } from './LinkDemandModal'
import { formatCurrency, cn } from '@/lib/utils'

interface CreditProjectsHistoryTableProps {
  initialProjects: CreditProjectHistoryItem[]
}

export function CreditProjectsHistoryTable({ initialProjects }: CreditProjectsHistoryTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [axisFilter, setAxisFilter] = useState<'TODOS' | 'CUSTEIO' | 'INVESTIMENTO' | 'OUTROS'>('TODOS')

  // Modais e Gavetas
  const [previewProject, setPreviewProject] = useState<CreditProjectHistoryItem | null>(null)
  const [drawerProject, setDrawerProject] = useState<CreditProjectHistoryItem | null>(null)
  const [billFeeProject, setBillFeeProject] = useState<CreditProjectHistoryItem | null>(null)
  const [linkDemandProject, setLinkDemandProject] = useState<CreditProjectHistoryItem | null>(null)
  const [creatingDemandId, setCreatingDemandId] = useState<string | null>(null)

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

  // Ação de Criar Demanda Técnica a partir do Projeto
  const handleCreateDemand = async (project: CreditProjectHistoryItem) => {
    if (project.demandId) {
      router.push(`/admin/demands/${project.demandId}`)
      return
    }

    setCreatingDemandId(project.id)
    try {
      const res = await createDemandFromCreditProject({
        formId: project.id,
        producerId: project.producerId,
        propertyId: project.propertyId || undefined,
        templateCode: project.templateCode,
        financedAmount: project.financedAmount || 0,
        documentId: project.documentId || undefined,
        storagePdfPath: project.storagePdfPath || undefined,
        fileName: project.fileName || undefined,
        financialAgent: project.technicalDetails?.targetBank,
        interestRate: project.technicalDetails?.interestRate,
        cropYear: project.technicalDetails?.cropYear,
      })

      if (res.success && res.demandId) {
        router.refresh()
        router.push(`/admin/demands/${res.demandId}`)
      } else {
        alert(res.error || 'Erro ao criar demanda a partir do projeto.')
      }
    } catch (err: any) {
      alert(err?.message || 'Falha de comunicação ao criar demanda.')
    } finally {
      setCreatingDemandId(null)
    }
  }

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
            Hub de Continuidade: conecte projetos a Demandas no Kanban, simulação de Limite MCR e faturamento ERP.
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
                <th className="py-3 px-4">Eixo, Linha & Rastreabilidade</th>
                <th className="py-3 px-4 text-right">Investimento / Financiado</th>
                <th className="py-3 px-4 text-center">Ações Operacionais</th>
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
                  <tr
                    key={project.id}
                    onClick={() => setDrawerProject(project)}
                    className="hover:bg-emerald-50/30 cursor-pointer transition-colors group"
                    title="Clique em qualquer linha para abrir a gaveta de detalhes técnicos e desdobramentos"
                  >
                    {/* Data */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-gray-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-700 transition-colors" />
                        <span suppressHydrationWarning>{formattedDate}</span>
                      </div>
                    </td>

                    {/* Produtor */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 group-hover:text-[#1B4D3E] transition-colors truncate max-w-[200px]">
                        {project.producerName}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono">
                        {project.producerDocument || '-'}
                      </div>
                    </td>

                    {/* Imóvel */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-800 truncate max-w-[200px]">
                        {project.propertyName}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {project.propertyCity ? `${project.propertyCity}/${project.propertyState || ''}` : '-'}
                      </div>
                    </td>

                    {/* Eixo, Linha & Badges de Rastreabilidade */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
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
                          <span className="text-xs text-gray-900 font-bold truncate max-w-[220px]">
                            {project.creditLineName}
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[260px]">
                        {project.templateName}
                      </div>

                      {/* BADGES DE RASTREABILIDADE (CICLO DE VIDA DO PROJETO) */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-1.5 border-t border-dashed border-gray-100">
                        {/* 1. Vínculo com Demanda Operacional */}
                        {project.demandId ? (
                          <Link
                            href={`/admin/demands/${project.demandId}`}
                            onClick={(e) => e.stopPropagation()}
                            title="Acessar Demanda Técnica vinculada no Kanban"
                          >
                            <Badge className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 gap-1.5 cursor-pointer transition-colors shadow-2xs">
                              <Kanban className="w-3 h-3 text-emerald-700 shrink-0" />
                              <span>Demanda #{project.demandCode} • {project.demandStatusLabel || project.demandStatus}</span>
                            </Badge>
                          </Link>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-medium bg-amber-50/70 text-amber-800 border-amber-300 gap-1.5"
                            title="Nenhuma demanda operacional associada a este projeto"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Sem Demanda Vinculada</span>
                          </Badge>
                        )}

                        {/* 2. Vínculo com Limite de Crédito MCR */}
                        {project.mcrAnalysis ? (
                          <Link
                            href={`/admin/credit-limit?producerId=${project.producerId}&propertyId=${
                              project.propertyId || ''
                            }&amount=${project.financedAmount || 0}&creditLine=${encodeURIComponent(
                              project.creditLineName || project.templateName
                            )}&tab=simulator`}
                            onClick={(e) => e.stopPropagation()}
                            title="Simular capacidade de pagamento no módulo Limite MCR"
                          >
                            <Badge
                              className={`text-[10px] font-bold gap-1.5 cursor-pointer transition-colors shadow-2xs ${
                                project.mcrAnalysis.icsdValue >= 1.2
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                              }`}
                            >
                              <Calculator className="w-3 h-3 shrink-0" />
                              <span>
                                ICSD: {project.mcrAnalysis.icsdValue.toFixed(2)}x (
                                {project.mcrAnalysis.icsdValue >= 1.2 ? 'Apto' : 'Reprovado'})
                              </span>
                            </Badge>
                          </Link>
                        ) : (
                          <Link
                            href={`/admin/credit-limit?producerId=${project.producerId}&propertyId=${
                              project.propertyId || ''
                            }&amount=${project.financedAmount || 0}&creditLine=${encodeURIComponent(
                              project.creditLineName || project.templateName
                            )}&tab=simulator`}
                            onClick={(e) => e.stopPropagation()}
                            title="Simular Limite MCR para este projeto"
                          >
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 gap-1.5 cursor-pointer transition-colors"
                            >
                              <Calculator className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>Simular MCR</span>
                            </Badge>
                          </Link>
                        )}

                        {/* 3. Vínculo com Financeiro (ERP) */}
                        {project.financialTitle ? (
                          <Link
                            href="/admin/financial/receivables"
                            onClick={(e) => e.stopPropagation()}
                            title="Ver Título a Receber no ERP"
                          >
                            <Badge className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 gap-1.5 cursor-pointer transition-colors shadow-2xs">
                              <CreditCard className="w-3 h-3 text-emerald-700 shrink-0" />
                              <span>Faturado ({project.financialTitle.documentNumber})</span>
                            </Badge>
                          </Link>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-medium bg-amber-50/60 text-amber-700 border-amber-200 gap-1.5"
                            title="Honorários técnicos pendentes de emissão no ERP"
                          >
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Honorários a Faturar</span>
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Valores */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {project.totalAmount && project.totalAmount > 0 ? (
                        <>
                          <div className="font-bold text-gray-900">
                            {formatCurrency(project.totalAmount)}
                          </div>
                          {project.financedAmount && project.financedAmount > 0 ? (
                            <div className="text-[11px] text-emerald-700 font-extrabold">
                              Financiado: {formatCurrency(project.financedAmount)}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-gray-400 font-medium">Sob demanda</span>
                      )}
                    </td>

                    {/* Menu de Desdobramentos Operacionais */}
                    <td
                      className="py-3.5 px-4 text-center whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={cn(
                            buttonVariants({ variant: 'outline', size: 'sm' }),
                            'h-8 px-2.5 text-xs font-bold text-[#1B4D3E] border-[#1B4D3E]/30 hover:bg-emerald-50 gap-1.5 shadow-2xs cursor-pointer'
                          )}
                        >
                          <span>Ações Operacionais</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-64 p-1.5 shadow-xl bg-white border-gray-200"
                        >
                          {/* 1. Visualizar PDF Oficial */}
                          <DropdownMenuItem
                            onClick={() => setPreviewProject(project)}
                            className="text-xs font-semibold py-2 px-2.5 cursor-pointer text-emerald-800 hover:bg-emerald-50 rounded-lg gap-2"
                          >
                            <Eye className="w-4 h-4 text-emerald-700" />
                            <span>Visualizar PDF Oficial</span>
                          </DropdownMenuItem>

                          {/* 2. Criar Demanda Técnica no Kanban */}
                          <DropdownMenuItem
                            onClick={() => handleCreateDemand(project)}
                            disabled={creatingDemandId === project.id}
                            className="text-xs font-semibold py-2 px-2.5 cursor-pointer text-slate-800 hover:bg-slate-50 rounded-lg gap-2"
                          >
                            {creatingDemandId === project.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#1B4D3E]" />
                            ) : (
                              <Kanban className="w-4 h-4 text-[#1B4D3E]" />
                            )}
                            <span>
                              {project.demandId
                                ? 'Abrir Demanda no Kanban'
                                : 'Criar Demanda Técnica no Kanban'}
                            </span>
                          </DropdownMenuItem>

                          {/* 3. Vincular a uma Demanda Aberta */}
                          {!project.demandId && (
                            <DropdownMenuItem
                              onClick={() => setLinkDemandProject(project)}
                              className="text-xs font-semibold py-2 px-2.5 cursor-pointer text-slate-800 hover:bg-slate-50 rounded-lg gap-2"
                            >
                              <Link2 className="w-4 h-4 text-slate-600" />
                              <span>Vincular a uma Demanda Aberta</span>
                            </DropdownMenuItem>
                          )}

                          {/* 4. Simular Limite MCR para este Valor */}
                          <DropdownMenuItem
                            onClick={() => {
                              router.push(
                                `/admin/credit-limit?producerId=${project.producerId}&propertyId=${
                                  project.propertyId || ''
                                }&amount=${project.financedAmount || 0}&creditLine=${encodeURIComponent(
                                  project.creditLineName || project.templateName
                                )}&tab=simulator`
                              )
                            }}
                            className="text-xs font-semibold py-2 px-2.5 cursor-pointer text-slate-800 hover:bg-slate-50 rounded-lg gap-2"
                          >
                            <Calculator className="w-4 h-4 text-emerald-700" />
                            <span>Simular Limite MCR para este Valor</span>
                          </DropdownMenuItem>

                          {/* 5. Faturar Honorários no ERP */}
                          <DropdownMenuItem
                            onClick={() => {
                              if (project.financialTitle) {
                                router.push('/admin/financial/receivables')
                              } else {
                                setBillFeeProject(project)
                              }
                            }}
                            className="text-xs font-semibold py-2 px-2.5 cursor-pointer text-[#1B4D3E] hover:bg-emerald-50 rounded-lg gap-2"
                          >
                            <CreditCard className="w-4 h-4 text-[#1B4D3E]" />
                            <span>
                              {project.financialTitle ? 'Ver Título no ERP' : 'Faturar Honorários no ERP'}
                            </span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {/* 6. Reabrir / Editar Parâmetros */}
                          <DropdownMenuItem
                            onClick={() => {
                              router.push(
                                `/admin/documents/credit-projects/new?template=${project.templateCode}&axis=${
                                  isCusteio ? 'custeio' : 'investimento'
                                }&producerId=${project.producerId}&propertyId=${
                                  project.propertyId || ''
                                }&formId=${project.id}`
                              )
                            }}
                            className="text-xs font-semibold py-2 px-2.5 cursor-pointer text-[#1B4D3E] hover:bg-emerald-50 rounded-lg gap-2"
                          >
                            <Edit3 className="w-4 h-4 text-[#1B4D3E]" />
                            <span>Reabrir / Editar Parâmetros</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Gaveta Lateral de Detalhes Técnicos */}
      <CreditProjectDetailsDrawer
        isOpen={!!drawerProject}
        onClose={() => setDrawerProject(null)}
        project={drawerProject}
        onOpenPreview={(proj) => {
          setDrawerProject(null)
          setPreviewProject(proj)
        }}
        onCreateDemand={(proj) => {
          setDrawerProject(null)
          handleCreateDemand(proj)
        }}
        onLinkDemand={(proj) => {
          setDrawerProject(null)
          setLinkDemandProject(proj)
        }}
        onBillFee={(proj) => {
          setDrawerProject(null)
          setBillFeeProject(proj)
        }}
      />

      {/* Modal de Faturamento de Honorários no ERP */}
      <BillProjectFeeModal
        isOpen={!!billFeeProject}
        onClose={() => setBillFeeProject(null)}
        project={billFeeProject}
        onSuccess={() => {
          router.refresh()
        }}
      />

      {/* Modal de Vínculo com Demanda Aberta */}
      <LinkDemandModal
        isOpen={!!linkDemandProject}
        onClose={() => setLinkDemandProject(null)}
        project={linkDemandProject}
        onSuccess={() => {
          router.refresh()
        }}
        onCreateNewDemand={(proj) => {
          handleCreateDemand(proj)
        }}
      />

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
