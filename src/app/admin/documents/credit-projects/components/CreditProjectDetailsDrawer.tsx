'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import {
  X,
  FileText,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Kanban,
  Calculator,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Award,
  Layers,
  Sparkles,
  Eye,
  Edit3,
  Link2,
  PlusCircle,
  Clock,
  Wheat,
  Tractor,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditProjectHistoryItem } from '@/actions/credit-projects'
import { formatCurrency, cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CreditProjectDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  project: CreditProjectHistoryItem | null
  onOpenPreview: (project: CreditProjectHistoryItem) => void
  onCreateDemand: (project: CreditProjectHistoryItem) => void
  onLinkDemand: (project: CreditProjectHistoryItem) => void
  onBillFee: (project: CreditProjectHistoryItem) => void
}

export function CreditProjectDetailsDrawer({
  isOpen,
  onClose,
  project,
  onOpenPreview,
  onCreateDemand,
  onLinkDemand,
  onBillFee,
}: CreditProjectDetailsDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !project) return null

  const formattedDate = project.createdAt
    ? format(new Date(project.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
    : '-'

  const isCusteio = project.axis === 'CUSTEIO'
  const isInvestimento = project.axis === 'INVESTIMENTO'

  const tech = project.technicalDetails || {}
  const totalAmount = project.totalAmount || 0
  const financedAmount = project.financedAmount || 0
  const ownResources = tech.ownResources || (totalAmount > financedAmount ? totalAmount - financedAmount : 0)

  const mcrUrl = `/admin/credit-limit?producerId=${project.producerId}&propertyId=${
    project.propertyId || ''
  }&amount=${financedAmount}&creditLine=${encodeURIComponent(
    project.creditLineName || project.templateName
  )}&tab=simulator`

  const wizardEditUrl = `/admin/documents/credit-projects/new?template=${project.templateCode}&axis=${
    isCusteio ? 'custeio' : 'investimento'
  }&producerId=${project.producerId}&propertyId=${project.propertyId || ''}&formId=${project.id}`

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop com Blur Suave */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl sm:max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* Header Institucional com cor de marca #113025 */}
          <div className="bg-[#113025] text-white p-5 sm:p-6 border-b border-emerald-950/40">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-emerald-800/80 text-emerald-100 border-emerald-600/50 text-[10px] font-bold">
                    {project.axis === 'CUSTEIO' ? 'Eixo Custeio Rural' : 'Eixo Investimento Rural'}
                  </Badge>
                  <span className="text-xs text-emerald-300/80 font-mono">
                    ID: #{project.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                  {project.creditLineName || project.templateName}
                </h2>

                <div className="text-xs text-emerald-100/90 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <span className="truncate max-w-[280px]">
                    Proponente: <strong>{project.producerName}</strong>
                  </span>
                  <span className="hidden sm:inline text-emerald-500">•</span>
                  <span className="truncate max-w-[200px]">
                    Fazenda: <strong>{project.propertyName}</strong>
                  </span>
                </div>
                <div className="text-[11px] text-emerald-300/80 flex items-center gap-1.5 pt-0.5">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  <span suppressHydrationWarning>Emitido em {formattedDate}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Corpo com Rolagem e Detalhes */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-slate-800">
            {/* 1. QUADRO FINANCEIRO COMPLETO */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                Quadro Financeiro Completo da Operação
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Investimento Total */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                    Investimento Total Projetado
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900">
                    {totalAmount > 0 ? formatCurrency(totalAmount) : 'Sob Demanda'}
                  </span>
                </div>

                {/* Contrapartida */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                    Recursos Próprios / Contrapartida
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-700">
                    {ownResources > 0 ? formatCurrency(ownResources) : 'R$ 0,00'}
                  </span>
                </div>

                {/* Financiado */}
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-300 col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">
                        Valor Financiado Solicitado
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-950">
                        {financedAmount > 0 ? formatCurrency(financedAmount) : 'R$ 0,00'}
                      </span>
                    </div>
                    <Badge className="bg-emerald-700 text-white font-bold text-xs">
                      {project.axis}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Condições de Pagamento e Taxas */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-slate-500 block text-[10px]">Taxa de Juros</span>
                  <strong className="text-slate-800 font-bold">
                    {tech.interestRate ? `${tech.interestRate}% a.a.` : 'Conforme Linha'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Prazo Total</span>
                  <strong className="text-slate-800 font-bold">
                    {tech.termYears ? `${tech.termYears} anos` : '12 meses'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Carência</span>
                  <strong className="text-slate-800 font-bold">
                    {tech.graceMonths ? `${tech.graceMonths} meses` : 'Sem carência'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Agente Financeiro</span>
                  <strong className="text-slate-800 font-bold truncate block">
                    {tech.targetBank || 'Banco do Brasil'}
                  </strong>
                </div>
              </div>
            </div>

            {/* 2. RESPONSABILIDADE TÉCNICA (RT, CREA & ART) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#1B4D3E]" />
                Responsabilidade Técnica & Validação Regulatória
              </h3>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Responsável Técnico (RT):</span>
                  <span className="font-bold text-slate-900 text-right">
                    {tech.responsibleName || 'Não informado'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Registro Profissional CREA:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {tech.creaNumber || 'Não informado'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ART Vinculada:</span>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {tech.artNumber || 'Não informada'}
                  </span>
                </div>
                {project.sha256Hash && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-400 block text-[10px] mb-0.5">Assinatura Digital SHA-256:</span>
                    <span className="font-mono text-[10px] text-slate-600 truncate block bg-white p-1 rounded border border-slate-200">
                      {project.sha256Hash}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. CARD DE DESDOBRAMENTOS DA ESTEIRA (HUB ATIVO) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Desdobramentos Operacionais da Esteira Rural
              </h3>

              <div className="space-y-3">
                {/* Desdobramento 1: Demanda Operacional no Kanban */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Kanban className="w-4 h-4 text-[#1B4D3E]" />
                      <span className="text-xs font-bold text-slate-900">Demanda no Kanban</span>
                    </div>
                    {project.demandId ? (
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold gap-1.5">
                        <Kanban className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span>#{project.demandCode} • {project.demandStatusLabel || project.demandStatus}</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Sem Demanda Vinculada</span>
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-600">
                    {project.demandId
                      ? 'Este projeto técnico está conectado à esteira operacional com checklist e prazos ativos.'
                      : 'Crie uma ordem de serviço no Kanban para acompanhar o protocolo bancário deste projeto.'}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    {project.demandId ? (
                      <Link
                        href={`/admin/demands/${project.demandId}`}
                        className={cn(
                          buttonVariants({ size: 'sm' }),
                          'w-full text-xs h-8 bg-[#1B4D3E] hover:bg-[#113025] text-white font-bold gap-1.5'
                        )}
                      >
                        <span>Acessar Demanda #{project.demandCode}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => onCreateDemand(project)}
                          className="flex-1 text-xs h-8 bg-[#1B4D3E] hover:bg-[#113025] text-white font-bold gap-1.5"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Criar Demanda</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onLinkDemand(project)}
                          className="text-xs h-8 border-slate-300 hover:bg-white text-slate-700 gap-1.5"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span>Vincular Aberta</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Desdobramento 2: Limite de Crédito MCR */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold text-slate-900">Limite de Crédito MCR</span>
                    </div>
                    {project.mcrAnalysis ? (
                      <Badge
                        className={`text-[10px] font-bold gap-1.5 ${
                          project.mcrAnalysis.icsdValue >= 1.2
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        <Calculator className="w-3 h-3 shrink-0" />
                        <span>
                          ICSD: {project.mcrAnalysis.icsdValue.toFixed(2)}x (
                          {project.mcrAnalysis.icsdValue >= 1.2 ? 'Apto' : 'Reprovado'})
                        </span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-100 text-slate-700 text-[10px]">
                        Sem Análise Registrada
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-600">
                    Simule a capacidade de pagamento (ICSD/LTV) e o endividamento do produtor para este montante.
                  </p>

                  <div className="pt-1">
                    <Link
                      href={mcrUrl}
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        'w-full text-xs h-8 text-emerald-800 border-emerald-300 hover:bg-emerald-100/50 font-bold gap-1.5'
                      )}
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Simular Limite MCR para {formatCurrency(financedAmount)}</span>
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Link>
                  </div>
                </div>

                {/* Desdobramento 3: Faturamento no Financeiro (ERP) */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#1B4D3E]" />
                      <span className="text-xs font-bold text-slate-900">Financeiro (ERP)</span>
                    </div>
                    {project.financialTitle ? (
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold gap-1.5">
                        <CreditCard className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span>Faturado ({project.financialTitle.documentNumber})</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] gap-1.5">
                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Honorários a Faturar</span>
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-600">
                    {project.financialTitle
                      ? `Título ${project.financialTitle.documentNumber} emitido com honorários de ${formatCurrency(
                          project.financialTitle.grossAmount
                        )}.`
                      : 'Emita o título a receber de honorários de elaboração técnica no módulo financeiro institucional.'}
                  </p>

                  <div className="pt-1">
                    {project.financialTitle ? (
                      <Link
                        href="/admin/financial/receivables"
                        className={cn(
                          buttonVariants({ variant: 'outline', size: 'sm' }),
                          'w-full text-xs h-8 text-[#1B4D3E] border-emerald-300 hover:bg-emerald-50 font-bold gap-1.5'
                        )}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Ver Título a Receber no ERP</span>
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </Link>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => onBillFee(project)}
                        className="w-full text-xs h-8 bg-[#1B4D3E] hover:bg-[#113025] text-white font-bold gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Faturar Honorários no ERP</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé Fixo da Gaveta */}
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenPreview(project)}
                className="text-xs h-8 font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50 gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>PDF Oficial</span>
              </Button>

              <Link
                href={wizardEditUrl}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'text-xs h-8 font-semibold text-[#1B4D3E] border-emerald-300 hover:bg-emerald-50 gap-1.5'
                )}
              >
                <Edit3 className="w-3.5 h-3.5 text-[#1B4D3E]" />
                <span>Reabrir Wizard</span>
              </Link>
            </div>

            <Button size="sm" variant="outline" onClick={onClose} className="text-xs h-8">
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
