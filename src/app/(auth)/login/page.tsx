'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { login } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sprout,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { LoginShowcaseCarousel } from '@/components/auth/LoginShowcaseCarousel'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)
    const result = await login(formData)

    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row w-full font-sans antialiased">
      {/* =================================================================== */}
      {/* 1. PAINEL DA ESQUERDA: AUTORIDADE, IMERSÃO E 6 MÓDULOS (50%)       */}
      {/* =================================================================== */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between px-8 py-8 lg:px-12 lg:py-8 xl:px-14 xl:py-10 2xl:px-16 2xl:py-10 overflow-hidden bg-gradient-to-br from-[#071912] via-[#0E281F] to-[#091D16] text-white select-none">
        {/* Curvas de Nível Topográficas em SVG Vetorial (Relevo Agrícola) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
          viewBox="0 0 1000 1000"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="topoContour" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.25" />
            </linearGradient>
          </defs>
          <path d="M-100 150 C 200 50, 350 280, 650 180 C 850 120, 950 220, 1150 160" stroke="url(#topoContour)" strokeWidth="1.2" strokeDasharray="4 2" />
          <path d="M-100 220 C 180 120, 380 340, 680 240 C 880 180, 980 290, 1150 230" stroke="url(#topoContour)" strokeWidth="1.2" />
          <path d="M-100 290 C 220 190, 420 400, 720 300 C 920 240, 1020 360, 1150 300" stroke="url(#topoContour)" strokeWidth="1.2" />
          <path d="M-100 360 C 260 260, 460 460, 760 360 C 960 300, 1060 430, 1150 370" stroke="url(#topoContour)" strokeWidth="1.5" />
          <path d="M-100 430 C 300 330, 500 520, 800 420 C 1000 360, 1100 500, 1150 440" stroke="url(#topoContour)" strokeWidth="1.2" />
          <path d="M-100 500 C 340 400, 540 580, 840 480 C 1040 420, 1140 570, 1150 510" stroke="url(#topoContour)" strokeWidth="1.2" strokeDasharray="6 3" />
          <path d="M-100 570 C 380 470, 580 640, 880 540 C 1080 480, 1180 640, 1150 580" stroke="url(#topoContour)" strokeWidth="1.5" />
          <path d="M-100 640 C 420 540, 620 700, 920 600 C 1120 540, 1220 710, 1150 650" stroke="url(#topoContour)" strokeWidth="1.2" />
          <path d="M-100 710 C 460 610, 660 760, 960 660 C 1160 600, 1260 780, 1150 720" stroke="url(#topoContour)" strokeWidth="1.2" />
          <path d="M-100 780 C 500 680, 700 820, 1000 720 C 1200 660, 1300 850, 1150 790" stroke="url(#topoContour)" strokeWidth="1.5" />
          <path d="M-100 850 C 540 750, 740 880, 1040 780 C 1240 720, 1340 920, 1150 860" stroke="url(#topoContour)" strokeWidth="1.2" />
          <path d="M-100 920 C 580 820, 780 940, 1080 840 C 1280 780, 1380 990, 1150 930" stroke="url(#topoContour)" strokeWidth="1.2" />
        </svg>

        {/* Brilhos Radiais de Ambiência */}
        <div className="absolute top-1/4 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />

        {/* 1.A. Cabeçalho de Marca */}
        <div className="relative z-10 h-11 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-[#1B4D3E] p-0.5 shadow-md shadow-emerald-950/50 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#0A2219] rounded-[9px] flex items-center justify-center">
              <Sprout className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black tracking-tight text-white leading-none">
                Agro<span className="text-emerald-400 font-extrabold">Tech</span>
              </span>
            </div>
            <p className="text-xs font-bold text-emerald-300/80 uppercase tracking-wider mt-1">
              Inteligência &amp; Gestão de Crédito Rural
            </p>
          </div>
        </div>

        {/* 1.B. Showcase Executivo Minimalista e de Alto Impacto */}
        <div className="relative z-10 my-auto py-2 max-w-xl w-full">
          <LoginShowcaseCarousel />
        </div>

        {/* 1.C. Rodapé do Painel Esquerdo (Nivelado Rigorosamente com o Direito) */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50 h-12 shrink-0">
          <span className="truncate">
            &copy; {new Date().getFullYear()} LN Consultoria &bull; Todos os direitos reservados
          </span>
          <span className="flex items-center gap-1.5 text-emerald-300/80 font-medium shrink-0 ml-4">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            Ambiente Protegido &bull; Nível Bancário
          </span>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. PAINEL DA DIREITA: CENTRAL DE AUTENTICAÇÃO SEGURA (50%)          */}
      {/* =================================================================== */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between bg-[#F8FAFC] min-h-screen lg:h-screen px-6 py-8 sm:px-10 lg:px-12 lg:py-8 xl:px-14 xl:py-10 2xl:px-16 2xl:py-10 overflow-y-auto">
        {/* 2.A. Topo do Painel Direito (Altura e Alinhamento Idênticos ao Esquerdo) */}
        <div className="h-11 flex items-center justify-between w-full">
          {/* Logo no Mobile */}
          <div className="flex lg:hidden items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-[#1B4D3E] p-0.5 flex items-center justify-center shadow-xs">
              <div className="w-full h-full bg-[#0A2219] rounded-[10px] flex items-center justify-center">
                <Sprout className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 leading-none">
                Agro<span className="text-emerald-700 font-extrabold">Tech</span>
              </span>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Crédito Rural
              </p>
            </div>
          </div>

          {/* Selo de Ambiente Corporativo Seguro */}
          <div className="ml-auto flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200/90 px-3 py-1.5 rounded-full shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span>Ambiente Corporativo Seguro</span>
          </div>
        </div>

        {/* 2.B. Formulário de Acesso Centralizado */}
        <div className="max-w-[420px] w-full mx-auto my-auto py-6 sm:py-8">
          <div className="mb-7">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Acesse sua conta corporativa
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Informe suas credenciais autorizadas para ingressar na plataforma.
            </p>
          </div>

          {/* Alerta de Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl p-3.5 flex items-start gap-2.5 mb-6 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-semibold block mb-0.5">Falha na Autenticação</span>
                {error}
              </div>
            </div>
          )}

          {/* Formulário com Server Action */}
          <form action={handleSubmit} className="space-y-5">
            {/* Campo E-mail */}
            <div className="space-y-1.5 text-left">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                E-mail Corporativo
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu.nome@organizacao.com.br"
                  required
                  autoComplete="email"
                  disabled={isPending}
                  className="pl-10 h-11 text-sm bg-white border-slate-200 rounded-xl hover:border-slate-300 focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/20 transition-all text-slate-900 placeholder:text-slate-400 shadow-2xs"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                  Senha de Acesso
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#1B4D3E] hover:text-[#13382D] hover:underline transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  disabled={isPending}
                  className="pl-10 pr-10 h-11 text-sm bg-white border-slate-200 rounded-xl hover:border-slate-300 focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/20 transition-all text-slate-900 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Botão de Ação Primária */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 text-sm font-bold bg-[#1B4D3E] hover:bg-[#143B2F] active:bg-[#0E2820] text-white rounded-xl shadow-md shadow-[#1B4D3E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-70"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Autenticando sessão...</span>
                </>
              ) : (
                <>
                  <span>Acessar Plataforma</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </>
              )}
            </Button>
          </form>

          {/* Selo de Segurança */}
          <div className="mt-7 pt-5 border-t border-slate-200/80 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Ambiente Protegido &bull; Criptografia Ponta a Ponta</span>
          </div>
        </div>

        {/* 2.C. Rodapé do Painel Direito (Nivelado Rigorosamente com o Esquerdo) */}
        <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 h-12 shrink-0 w-full">
          <span className="truncate">
            Plataforma de Gestão de Crédito Rural
          </span>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="hover:text-slate-800 transition-colors cursor-pointer underline-offset-4 hover:underline"
            >
              Termos de Uso
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => setPrivacyOpen(true)}
              className="hover:text-slate-800 transition-colors cursor-pointer underline-offset-4 hover:underline"
            >
              Política de Privacidade
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. MODAIS INSTITUCIONAIS: TERMOS E POLÍTICA DE PRIVACIDADE          */}
      {/* =================================================================== */}
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1B4D3E]" />
              Termos de Uso Corporativo
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Diretrizes de acesso à infraestrutura técnica de crédito rural.
            </DialogDescription>
          </DialogHeader>
          <div className="text-xs text-slate-600 space-y-3 max-h-[300px] overflow-y-auto pr-2 leading-relaxed">
            <p>
              1. <strong>Uso Autorizado:</strong> O acesso a esta plataforma é estritamente restrito a colaboradores, consultores e operadores autorizados pela organização contratante.
            </p>
            <p>
              2. <strong>Sigilo e Proteção Bancária:</strong> As informações patrimoniais, laudos periciais e orçamentos cadastrados constituem segredo comercial e bancário, em estrita observância à Lei Complementar nº 105/2001 e normas do BACEN.
            </p>
            <p>
              3. <strong>Integridade Cadastral:</strong> O operador responde pela veracidade dos dados inseridos para elaboração de minutas e projetos técnicos protocolados perante agentes financeiros.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1B4D3E]" />
              Política de Privacidade &amp; LGPD
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Governança de dados agropecuários e conformidade com a Lei Geral de Proteção de Dados.
            </DialogDescription>
          </DialogHeader>
          <div className="text-xs text-slate-600 space-y-3 max-h-[300px] overflow-y-auto pr-2 leading-relaxed">
            <p>
              1. <strong>Finalidade do Tratamento:</strong> Os dados de produtores rurais, propriedades e garantias são tratados com a finalidade exclusiva de análise de elegibilidade, cálculo de limite e emissão de projetos técnicos de crédito.
            </p>
            <p>
              2. <strong>Criptografia e Armazenamento Seguro:</strong> Todos os registros e documentos armazenados no repositório utilizam criptografia em repouso e em trânsito com protocolos TLS 1.3 de alto padrão.
            </p>
            <p>
              3. <strong>Retenção e Descarte:</strong> Os dados são mantidos pelo período exigido pelas normas regulatórias do Manual de Crédito Rural e regulamentações pertinentes.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
