'use client'

import React, { useState, useEffect } from 'react'
import {
  FileCheck,
  CheckCircle2,
  Info,
  AlertCircle,
  Eye,
  Sparkles,
  ShieldCheck,
  Maximize2,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BrandingLivePreviewProps {
  name?: string | null
  tradeName?: string | null
  primaryColor?: string | null
  accentColor?: string | null
  logoHorizontalUrl?: string | null
  logoDarkUrl?: string | null
  logoIconUrl?: string | null
  logoHorizontalFile?: File | null
  logoDarkFile?: File | null
}

export function BrandingLivePreview({
  name,
  tradeName,
  primaryColor,
  accentColor,
  logoHorizontalUrl,
  logoDarkUrl,
  logoIconUrl,
  logoHorizontalFile,
  logoDarkFile,
}: BrandingLivePreviewProps) {
  // Fallbacks defensivos para evitar qualquer exceção de null/undefined
  const safeDisplayName = (tradeName?.trim() || name?.trim() || 'Sua Empresa').toUpperCase()
  const safePrimaryColor = primaryColor || '#05964F'
  const safeAccentColor = accentColor || '#FFAC00'

  const [imgErrorHorizontal, setImgErrorHorizontal] = useState(false)
  const [imgErrorDark, setImgErrorDark] = useState(false)

  // Análise em tempo real das dimensões e proporção da imagem
  const [aspectAnalysis, setAspectAnalysis] = useState<{
    width: number
    height: number
    ratio: number
    isIdeal: boolean
    isSquareOrVertical: boolean
    isTransparent: boolean
  } | null>(null)

  useEffect(() => {
    setImgErrorHorizontal(false)
    if (!logoHorizontalUrl || typeof logoHorizontalUrl !== 'string') {
      setAspectAnalysis(null)
      return
    }

    try {
      const img = new Image()
      img.onload = () => {
        try {
          const w = img.naturalWidth || img.width
          const h = img.naturalHeight || img.height
          const ratio = h > 0 ? w / h : 1

          const isTransparent = logoHorizontalFile
            ? ['image/png', 'image/svg+xml'].includes(logoHorizontalFile.type)
            : logoHorizontalUrl.toLowerCase().includes('.png') ||
              logoHorizontalUrl.toLowerCase().includes('.svg') ||
              logoHorizontalUrl.startsWith('data:image/png') ||
              logoHorizontalUrl.startsWith('data:image/svg+xml')

          setAspectAnalysis({
            width: w,
            height: h,
            ratio,
            isIdeal: ratio >= 3.0 && ratio <= 4.8,
            isSquareOrVertical: ratio <= 1.4,
            isTransparent,
          })
        } catch {
          setAspectAnalysis(null)
        }
      }
      img.onerror = () => {
        setAspectAnalysis(null)
        setImgErrorHorizontal(true)
      }
      img.src = logoHorizontalUrl
    } catch {
      setAspectAnalysis(null)
    }
  }, [logoHorizontalUrl, logoHorizontalFile])

  useEffect(() => {
    setImgErrorDark(false)
  }, [logoDarkUrl])

  return (
    <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-5">
      {/* Cabeçalho do Painel de Pré-Visualização */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1B4D3E]/10 flex items-center justify-center text-[#1B4D3E]">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-none">
              Simulador em Tempo Real
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live Preview da aplicação nos documentos e sistema
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Reativo
        </span>
      </div>

      {/* =================================================================== */}
      {/* SIMULADOR 1: CABEÇALHO OFICIAL DO DOSSIÊ A4 (FUNDO BRANCO)          */}
      {/* =================================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            1. Cabeçalho Oficial do Dossiê A4 (PDF)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Altura: 52px travada</span>
        </div>

        {/* Miniatura da Folha A4 */}
        <div className="bg-white shadow-md border border-slate-200 rounded-sm p-4 w-full select-none transition-all">
          {/* Cabeçalho Idêntico ao HeaderSection.ts / BBHeader.tsx */}
          <div
            className="dossie-header-preview flex justify-between items-center overflow-hidden box-border pb-1 mb-2.5"
            style={{
              height: '52px',
              minHeight: '52px',
              maxHeight: '52px',
              borderBottom: `2px solid ${safePrimaryColor}`,
            }}
          >
            {/* Lado Esquerdo: Bounding Box Rígido da Logo (170px x 50px) */}
            <div className="flex items-center gap-2.5 h-[50px] overflow-hidden">
              <div className="w-[170px] h-[50px] min-w-[170px] max-w-[170px] flex items-center justify-start overflow-hidden box-border">
                {logoHorizontalUrl && !imgErrorHorizontal ? (
                  <img
                    src={logoHorizontalUrl}
                    alt={safeDisplayName}
                    onError={() => setImgErrorHorizontal(true)}
                    className="max-w-full max-h-full w-auto h-auto object-contain object-left block"
                  />
                ) : (
                  <div
                    className="text-[12px] font-extrabold uppercase leading-tight tracking-tight line-clamp-2"
                    style={{ color: safePrimaryColor }}
                  >
                    {safeDisplayName}
                  </div>
                )}
              </div>

              {/* Identificação Técnica do Documento */}
              <div className="flex flex-col justify-center leading-tight">
                <h4
                  className="text-[9.5px] font-extrabold uppercase tracking-wide m-0"
                  style={{ color: safePrimaryColor }}
                >
                  DOSSIÊ TÉCNICO DE LIMITE DE CRÉDITO
                </h4>
                <p className="text-[7px] text-slate-500 font-semibold m-0 mt-0.5">
                  Parecer Regulamentar &bull; MCR / BACEN
                </p>
              </div>
            </div>

            {/* Lado Direito: Controle de Folhas */}
            <div className="text-right text-[7.5px] text-slate-500 leading-tight shrink-0">
              <span className="font-bold" style={{ color: safePrimaryColor }}>
                Dossiê Técnico
              </span>
              <br />
              Folha 01 / 03 &bull; Proposta Oficial
            </div>
          </div>

          {/* Mini-Corpo do Documento (Comprovando que o cabeçalho não empurra o conteúdo) */}
          <div className="space-y-2 pt-1">
            {/* Skeleton lines da folha */}
            <div className="space-y-1">
              <div className="h-1 bg-slate-100 rounded-full w-full" />
              <div className="h-1 bg-slate-100 rounded-full w-5/6" />
              <div className="h-1 bg-slate-100 rounded-full w-2/3" />
            </div>

            {/* Mini-Tabela de Dados Simulados */}
            <div className="border border-slate-200 rounded overflow-hidden text-[7.5px] mt-2">
              <div
                className="px-2 py-0.5 font-bold text-white flex justify-between items-center"
                style={{ backgroundColor: safePrimaryColor }}
              >
                <span>Demonstrativo Financeiro & Capacidade de Pagamento</span>
                <span className="text-[6.5px] opacity-90">Exercício 2026/27</span>
              </div>
              <div className="divide-y divide-slate-100 bg-slate-50/60 font-sans">
                <div className="flex justify-between px-2 py-0.5">
                  <span className="text-slate-500">Patrimônio Líquido Rural:</span>
                  <span className="font-semibold text-slate-700">R$ 14.850.000,00</span>
                </div>
                <div className="flex justify-between px-2 py-0.5">
                  <span className="text-slate-500">Índice ICSD Projetado:</span>
                  <span className="font-bold text-emerald-700">1,84 (Aprovado)</span>
                </div>
                <div className="flex justify-between px-2 py-0.5">
                  <span className="text-slate-500">Limite Global Proposto:</span>
                  <span className="font-bold text-slate-900">R$ 3.500.000,00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SIMULADOR 2: TOPO DA SIDEBAR DO SISTEMA (FUNDO ESCURO #0F291E)      */}
      {/* =================================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            2. Barra Lateral do Sistema (Fundo Escuro)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">bg-[#0F291E]</span>
        </div>

        {/* Bloco Estilizado da Barra Lateral */}
        <div className="bg-[#0F291E] border border-[#113025] rounded-xl p-3 text-white shadow-inner select-none transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex flex-col gap-1 overflow-hidden">
              <div className="h-9 flex items-center justify-start overflow-hidden">
                {(logoDarkUrl || logoHorizontalUrl) && !imgErrorDark ? (
                  <img
                    src={(logoDarkUrl || logoHorizontalUrl) || undefined}
                    alt={safeDisplayName}
                    onError={() => setImgErrorDark(true)}
                    className="max-h-8 max-w-[170px] object-contain object-left"
                  />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-black tracking-tight text-white leading-none">
                      {safeDisplayName}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[9px] text-emerald-200/60 uppercase tracking-widest font-semibold truncate">
                Unidade Taguatinga / TO
              </p>
            </div>

            <div
              className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"
              title="Sessão Ativa"
            />
          </div>

          {/* Item de Menu Falso para Contexto Visual */}
          <div className="mt-2.5 flex items-center gap-2 px-2 py-1 rounded-md bg-white/5 text-[10px] text-emerald-100 font-medium">
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: safeAccentColor }}
            />
            <span className="truncate">Painel de Operações de Crédito</span>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. DIAGNÓSTICO DE CONFORMIDADE DA IMAGEM EM TEMPO REAL              */}
      {/* =================================================================== */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 space-y-2.5">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#1B4D3E]" />
          Diagnóstico de Conformidade Técnica
        </h4>

        {aspectAnalysis ? (
          <div className="space-y-2 text-xs">
            {/* Badge de Proporção */}
            <div className="flex flex-wrap items-center gap-1.5">
              {aspectAnalysis.isIdeal ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Proporção Ideal para Documentos A4 ({aspectAnalysis.ratio.toFixed(1)}:1)
                </span>
              ) : aspectAnalysis.isSquareOrVertical ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                  <Info className="w-3.5 h-3.5 text-amber-600" />
                  Imagem Compacta ({aspectAnalysis.ratio.toFixed(1)}:1) &bull; Será contida no limite de 50px
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  Proporção {aspectAnalysis.ratio.toFixed(1)}:1 ({aspectAnalysis.width} &times; {aspectAnalysis.height}px)
                </span>
              )}
            </div>

            {/* Badge de Fundo Transparente */}
            <div className="flex items-start gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {aspectAnalysis.isTransparent ? (
                  <>
                    <strong className="text-emerald-700 font-semibold">Formato otimizado:</strong> Imagem com suporte a transparência detectada (PNG/SVG).
                  </>
                ) : (
                  <>
                    <strong className="text-slate-700 font-semibold">Dica de acabamento:</strong> Para documentos impressos, imagens com fundo transparente (PNG ou SVG) evitam caixas brancas sobrepostas.
                  </>
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Ao selecionar uma logomarca horizontal no formulário, a geometria e proporção serão avaliadas automaticamente aqui.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
