'use client'

import React from 'react'
import Link from 'next/link'
import {
  FolderArchive,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  FileText,
  FileSignature,
  User,
  Calendar,
} from 'lucide-react'
import { PriorityDocumentSummary } from '@/actions/home-dashboard'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface GedHealthColumnProps {
  ged: {
    totalBytes: number
    formattedUsed: string
    limitFormatted: string
    percentage: number
    validCount: number
    alertCount: number
    expiredCount: number
    totalDocsCount?: number
    emittedCount?: number
    priorityDocuments: PriorityDocumentSummary[]
  }
}

export function GedHealthColumn({ ged }: GedHealthColumnProps) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between h-full space-y-5">
      {/* Cabeçalho com Link Discreto para o GED */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1B4D3E] flex items-center justify-center border border-emerald-100/80">
            <FolderArchive className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              Saúde Documental & Armazenamento
            </h2>
            <p className="text-[11px] text-slate-500">Integridade de certidões e repositório em nuvem</p>
          </div>
        </div>

        <Link
          href="/admin/documents"
          prefetch={true}
          className="text-xs font-semibold text-[#1B4D3E] hover:text-[#13382D] flex items-center gap-1 group transition-colors"
        >
          <span>Abrir GED</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Medidor de Nuvem (Storage vs Franquia no Verde Corporativo) */}
      <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <HardDrive className="w-4 h-4 text-[#1B4D3E]" />
            <span>Capacidade em Nuvem (GED Cloud)</span>
          </div>
          <span className="font-extrabold text-slate-900">
            {ged.formattedUsed} <span className="text-slate-400 font-normal">/ {ged.limitFormatted}</span>
          </span>
        </div>

        {/* Barra de Progresso no Verde Corporativo */}
        <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-[#1B4D3E]"
            style={{ width: `${Math.max(ged.percentage, 1.5)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
          <span>Uso de cota: <strong>{ged.percentage}%</strong></span>
          <span className="text-[#1B4D3E] font-medium">Backup criptografado ativo</span>
        </div>

        {/* Quantidade de Arquivos Emitidos & Armazenados */}
        <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-200/80 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <FileSignature className="w-3.5 h-3.5 text-[#1B4D3E] shrink-0" />
            <span>Arquivos Emitidos:</span>
            <strong className="text-slate-900 font-extrabold bg-emerald-50 text-[#1B4D3E] px-2 py-0.5 rounded-md border border-emerald-200/60">
              {ged.emittedCount ?? 0}
            </strong>
          </div>
          <div className="flex items-center justify-end gap-1.5 font-medium text-slate-600">
            <FolderArchive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Repositório GED:</span>
            <strong className="text-slate-900 font-bold">{ged.totalDocsCount ?? 0} arquivos</strong>
          </div>
        </div>
      </div>

      {/* Semáforo de Validades em 3 Blocos Oficiais */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-800 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Válidos</span>
          </div>
          <span className="text-xl font-black text-emerald-900">{ged.validCount}</span>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-800 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Em Aviso</span>
          </div>
          <span className="text-xl font-black text-amber-900">{ged.alertCount}</span>
        </div>

        <div className="bg-rose-50/70 border border-rose-200/70 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-rose-800 mb-1">
            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Vencidos</span>
          </div>
          <span className="text-xl font-black text-rose-900">{ged.expiredCount}</span>
        </div>
      </div>

      {/* Lista de Prioridades: 3 Certidões mais urgentes */}
      <div className="space-y-2.5 flex-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Certidões & Prazos Críticos
        </span>

        {ged.priorityDocuments.length > 0 ? (
          <div className="space-y-2">
            {ged.priorityDocuments.map((doc) => {
              const isExpired = doc.daysRemaining < 0
              const formattedDate = format(new Date(doc.expirationDate), 'dd/MM/yyyy', { locale: ptBR })

              return (
                <div
                  key={doc.id}
                  className="border border-slate-100 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-200 rounded-xl p-3 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#1B4D3E] shrink-0" />
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {doc.documentTypeLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 truncate font-medium text-slate-700">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        {doc.producerName}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 shrink-0 font-medium">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {isExpired ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        Vencido ({Math.abs(doc.daysRemaining)}d)
                      </span>
                    ) : doc.daysRemaining <= 7 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Vence em {doc.daysRemaining}d
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Vence em {doc.daysRemaining}d
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
            Nenhuma certidão ou licença com vencimento pendente no momento. A esteira documental está regularizada.
          </div>
        )}
      </div>
    </div>
  )
}
