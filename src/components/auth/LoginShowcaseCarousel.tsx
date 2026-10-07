'use client'

import React, { useState, useEffect } from 'react'
import {
  Tractor,
  FolderArchive,
  Landmark,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Pause,
  ChevronLeft,
  ChevronRight,
  MapPin,
  TrendingUp,
  Percent,
  Sprout,
} from 'lucide-react'

export interface ShowcaseTab {
  id: 'crm' | 'ged' | 'limite' | 'projetos'
  label: string
  tag: string
  icon: React.ElementType
  question: string
  answer: string
}

export const SHOWCASE_TABS: ShowcaseTab[] = [
  {
    id: 'crm',
    label: 'CRM',
    tag: 'CADASTRO & GOVERNANÇA',
    icon: Tractor,
    question: 'Quer passar a ter controle total sobre sua operação e clientes?',
    answer: 'Cadastro único de produtores e terras com herança instantânea entre safras.',
  },
  {
    id: 'ged',
    label: 'GED',
    tag: 'COMPLIANCE DOCUMENTAL',
    icon: FolderArchive,
    question: 'Perdendo tempo e perdido com muitos documentos?',
    answer: 'Semáforo automático de validades e organização por safra com zero perda de prazos.',
  },
  {
    id: 'limite',
    label: 'Limite',
    tag: 'ENGENHARIA DE RISCO',
    icon: Landmark,
    question: 'Inseguro se o Banco do Brasil vai aprovar a capacidade de pagamento?',
    answer: 'Simulação de estresse financeiro e parecer oficial antes do protocolo bancário.',
  },
  {
    id: 'projetos',
    label: 'Projetos',
    tag: 'ELABORAÇÃO BANCÁRIA',
    icon: FileCheck,
    question: 'Cansado de redigitar orçamentos e propostas a cada safra?',
    answer: 'Projetos de Custeio e Investimento estruturados nas 15 linhas oficiais em minutos.',
  },
]

const ROTATION_INTERVAL_MS = 5000
const TIMER_STEP_MS = 50

export function LoginShowcaseCarousel() {
  const [activeTab, setActiveTab] = useState<number>(0)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)

  // Estados interativos dos widgets
  const [simulatedLimit, setSimulatedLimit] = useState<250 | 1500>(250)
  const [projectType, setProjectType] = useState<'custeio' | 'investimento'>('custeio')

  const currentTab = SHOWCASE_TABS[activeTab]
  const TabIcon = currentTab.icon

  // Ciclo automático suave de 5 segundos
  useEffect(() => {
    if (isPaused) return

    const stepPercentage = (TIMER_STEP_MS / ROTATION_INTERVAL_MS) * 100

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + stepPercentage >= 100) {
          setActiveTab((curr) => (curr + 1) % SHOWCASE_TABS.length)
          return 0
        }
        return prev + stepPercentage
      })
    }, TIMER_STEP_MS)

    return () => clearInterval(timer)
  }, [isPaused, activeTab])

  const handleSelectTab = (index: number) => {
    setActiveTab(index)
    setProgress(0)
  }

  const handlePrevTab = () => {
    setActiveTab((curr) => (curr - 1 + SHOWCASE_TABS.length) % SHOWCASE_TABS.length)
    setProgress(0)
  }

  const handleNextTab = () => {
    setActiveTab((curr) => (curr + 1) % SHOWCASE_TABS.length)
    setProgress(0)
  }

  return (
    <div
      className="w-full flex flex-col select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Vitrine Interativa de Módulos"
    >
      {/* 1. TOPO: TAG DO MÓDULO, CONTROLE E PAUSA */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <TabIcon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-emerald-300 tracking-wider uppercase">
            {currentTab.tag}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isPaused ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium">
              <Pause className="w-3 h-3" />
              <span>Pausado</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{`0${activeTab + 1} / 0${SHOWCASE_TABS.length}`}</span>
            </span>
          )}

          {/* Setas manuais compactas */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevTab}
              className="p-1 rounded-md bg-white/[0.05] hover:bg-white/[0.12] text-white/70 hover:text-white transition-colors cursor-pointer"
              aria-label="Aba anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextTab}
              className="p-1 rounded-md bg-white/[0.05] hover:bg-white/[0.12] text-white/70 hover:text-white transition-colors cursor-pointer"
              aria-label="Próxima aba"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. MENSAGEM DE IMPACTO & DOR (PERGUNTA BRANCA EM DESTAQUE + RESPOSTA ESMERALDA) */}
      <div
        key={currentTab.id}
        className="mb-4 min-h-[82px] flex flex-col justify-center animate-in fade-in slide-in-from-right-2 duration-250"
      >
        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight mb-1.5">
          {currentTab.question}
        </h2>
        <p className="text-xs sm:text-sm text-emerald-300/90 leading-relaxed font-normal">
          {currentTab.answer}
        </p>
      </div>

      {/* 3. BARRA DE PROGRESSO CONTÍNUA */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 4. MICRO-WIDGET VISUAL (DADOS, KPIS E GRÁFICOS - SEM PARÁGRAFOS DESCRITIVOS) */}
      <div className="bg-white/[0.04] backdrop-blur-xs border border-white/[0.09] hover:border-emerald-500/30 rounded-2xl p-4 sm:p-5 transition-all min-h-[250px] flex flex-col justify-between shadow-2xs">
        {/* ============================================================== */}
        {/* WIDGET 1: CRM (IMÓVEL, 3 CAIXAS DE VALORES E LASTRO AUDITÁVEL) */}
        {/* ============================================================== */}
        {currentTab.id === 'crm' && (
          <div className="flex flex-col justify-between h-full space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-white tracking-tight">
                  Fazenda Modelo — 150 ha
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Cadastro Ativo
              </span>
            </div>

            {/* 3 Caixas Limpas com Valores em Negrito */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 text-center">
                <span className="text-xs font-medium text-emerald-200/70 block mb-1">
                  Terra Nua
                </span>
                <span className="text-base sm:text-lg font-black text-white block tracking-tight">
                  R$ 4.200.000
                </span>
                <span className="text-[11px] text-white/50 block mt-0.5">
                  VTN Oficial
                </span>
              </div>

              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 text-center">
                <span className="text-xs font-medium text-emerald-200/70 block mb-1">
                  Benfeitorias
                </span>
                <span className="text-base sm:text-lg font-black text-white block tracking-tight">
                  R$ 850.000
                </span>
                <span className="text-[11px] text-white/50 block mt-0.5">
                  Sedes &amp; Silos
                </span>
              </div>

              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 text-center">
                <span className="text-xs font-medium text-emerald-200/70 block mb-1">
                  Rebanho
                </span>
                <span className="text-base sm:text-lg font-black text-white block tracking-tight">
                  R$ 1.150.000
                </span>
                <span className="text-[11px] text-white/50 block mt-0.5">
                  Ponderação 50%
                </span>
              </div>
            </div>

            {/* Selo Compacto de Lastro Auditável */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#04140D]/80 border border-emerald-500/25">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-white">
                  Lastro Patrimonial Auditável
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-300">
                Padrão BACEN / MCR
              </span>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* WIDGET 2: GED (PAINEL VISUAL DE SAÚDE DOCUMENTAL)              */}
        {/* ============================================================== */}
        {currentTab.id === 'ged' && (
          <div className="flex flex-col justify-between h-full space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-sm font-bold text-white tracking-tight">
                Saúde Documental da Safra 2025/2026
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Auditoria Ativa
              </span>
            </div>

            {/* 3 Números Expressivos Lado a Lado */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white/[0.04] border border-emerald-500/25 rounded-xl p-3 text-center">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 block tracking-tight">
                  28
                </span>
                <span className="text-xs font-bold text-white/90 block mt-1">
                  Regulares
                </span>
                <span className="text-[11px] text-emerald-300/70 block mt-0.5">
                  100% Válidos
                </span>
              </div>

              <div className="bg-white/[0.04] border border-amber-500/25 rounded-xl p-3 text-center">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 block tracking-tight">
                  02
                </span>
                <span className="text-xs font-bold text-white/90 block mt-1">
                  Em Alerta
                </span>
                <span className="text-[11px] text-amber-300/70 block mt-0.5">
                  Vence em 30d
                </span>
              </div>

              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 text-center">
                <span className="text-2xl sm:text-3xl font-black text-slate-400 block tracking-tight">
                  00
                </span>
                <span className="text-xs font-bold text-white/90 block mt-1">
                  Vencidos
                </span>
                <span className="text-[11px] text-white/50 block mt-0.5">
                  Zero Pendências
                </span>
              </div>
            </div>

            {/* Barra Gráfica de Progresso */}
            <div className="space-y-1.5 px-3.5 py-2.5 rounded-xl bg-[#04140D]/80 border border-emerald-500/25">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-emerald-200/80">
                  Índice de Regularidade
                </span>
                <span className="font-bold text-emerald-300">
                  94% de Conformidade
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full w-[94%]" />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* WIDGET 3: LIMITE MCR (INTERATIVO COM 2 BOTÕES RÁPIDOS)         */}
        {/* ============================================================== */}
        {currentTab.id === 'limite' && (
          <div className="flex flex-col justify-between h-full space-y-4 animate-in fade-in duration-200">
            {/* Alternador Interativo de Simulação */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Simulação de Volume:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSimulatedLimit(250)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    simulatedLimit === 250
                      ? 'bg-emerald-500 text-slate-950 shadow-xs ring-1 ring-emerald-400'
                      : 'bg-white/[0.06] text-white/70 hover:text-white border border-white/10'
                  }`}
                >
                  R$ 250 Mil
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedLimit(1500)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    simulatedLimit === 1500
                      ? 'bg-red-500 text-white shadow-xs ring-1 ring-red-400'
                      : 'bg-white/[0.06] text-white/70 hover:text-white border border-white/10'
                  }`}
                >
                  R$ 1,5 Milhão
                </button>
              </div>
            </div>

            {/* Resposta Matemática em Tempo Real */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`rounded-xl p-3 border text-center transition-all ${
                  simulatedLimit === 250
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <span className="text-xs font-medium text-emerald-200/80 block mb-1">
                  ICSD Apurado
                </span>
                <span
                  className={`text-2xl sm:text-3xl font-black block tracking-tight ${
                    simulatedLimit === 250 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {simulatedLimit === 250 ? '4.72x' : '0.22x'}
                </span>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                    simulatedLimit === 250
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {simulatedLimit === 250 ? 'Margem Atendida' : 'Déficit de Caixa'}
                </span>
              </div>

              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 text-center">
                <span className="text-xs font-medium text-emerald-200/80 block mb-1">
                  Cobertura LTV
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white block tracking-tight">
                  {simulatedLimit === 250 ? '1105%' : '184%'}
                </span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold bg-white/10 text-white/80">
                  {simulatedLimit === 250 ? 'Folga Máxima' : 'Alavancagem Limite'}
                </span>
              </div>
            </div>

            {/* Parecer Dinâmico */}
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#04140D]/80 border border-emerald-500/25">
              {simulatedLimit === 250 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-200 leading-tight">
                    Capacidade de pagamento aprovada perante o Banco do Brasil (MCR 11-1)
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-xs font-semibold text-red-200 leading-tight">
                    Déficit financeiro: requer readequação de garantias ou prazo estendido
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* WIDGET 4: PROJETOS (ALTERNADOR CUSTEIO VS INVESTIMENTO)        */}
        {/* ============================================================== */}
        {currentTab.id === 'projetos' && (
          <div className="flex flex-col justify-between h-full space-y-4 animate-in fade-in duration-200">
            {/* Alternador de Modalidade */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Modalidade Plano Safra:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setProjectType('custeio')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    projectType === 'custeio'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs ring-1 ring-emerald-400'
                      : 'bg-white/[0.06] text-white/70 hover:text-white border border-white/10'
                  }`}
                >
                  <Sprout className="w-3.5 h-3.5" />
                  <span>Custeio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProjectType('investimento')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    projectType === 'investimento'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs ring-1 ring-emerald-400'
                      : 'bg-white/[0.06] text-white/70 hover:text-white border border-white/10'
                  }`}
                >
                  <Tractor className="w-3.5 h-3.5" />
                  <span>Investimento</span>
                </button>
              </div>
            </div>

            {/* Parâmetros Regulamentares em Caixas Limpas */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 text-center">
                <span className="text-xs font-medium text-emerald-200/70 block mb-1">
                  Taxa Oficial
                </span>
                <span className="text-base sm:text-lg font-black text-white block tracking-tight">
                  {projectType === 'custeio' ? '8% a 10,5%' : '7% a 12,5%'}
                </span>
                <span className="text-[11px] text-white/50 block mt-0.5">
                  a.a. Fixada
                </span>
              </div>

              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 text-center">
                <span className="text-xs font-medium text-emerald-200/70 block mb-1">
                  Prazo Máximo
                </span>
                <span className="text-base sm:text-lg font-black text-white block tracking-tight">
                  {projectType === 'custeio' ? 'Até 14 meses' : 'Até 10 anos'}
                </span>
                <span className="text-[11px] text-white/50 block mt-0.5">
                  {projectType === 'custeio' ? 'Safra / Entressafra' : 'Carência 3 anos'}
                </span>
              </div>

              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 text-center">
                <span className="text-xs font-medium text-emerald-200/70 block mb-1">
                  Linhas
                </span>
                <span className="text-base sm:text-lg font-black text-white block tracking-tight">
                  {projectType === 'custeio' ? 'Agrícola & Pec.' : '15 Linhas'}
                </span>
                <span className="text-[11px] text-white/50 block mt-0.5">
                  {projectType === 'custeio' ? 'Pronamp / Geral' : 'Moderfrota / Renov.'}
                </span>
              </div>
            </div>

            {/* Rodapé Informativo */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#04140D]/80 border border-emerald-500/25">
              <span className="text-xs font-semibold text-white">
                {projectType === 'custeio'
                  ? 'Orçamentos e cronogramas padronizados para o Banco do Brasil'
                  : 'Dimensionamento automatizado para máquinas, pastagens e silos'}
              </span>
              <span className="text-xs font-bold text-emerald-300 shrink-0 ml-2">
                100% Homologado
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5. RÉGUA DE NAVEGAÇÃO INFERIOR (4 BOTÕES COMPACTOS, SEM RETICÊNCIAS) */}
      <div className="grid grid-cols-4 gap-2.5 mt-4 w-full">
        {SHOWCASE_TABS.map((tab, idx) => {
          const isActive = activeTab === idx
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectTab(idx)}
              className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                isActive
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-xs ring-1 ring-emerald-400/30'
                  : 'bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] border border-white/10'
              }`}
            >
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              )}
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
