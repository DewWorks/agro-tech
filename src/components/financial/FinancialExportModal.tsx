'use client'

import React, { useState } from 'react'
import { FileSpreadsheet, Download, FileText, CheckCircle2, ShieldCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { downloadQuittanceReceiptPdf } from '@/lib/utils/quittance-receipt-pdf-downloader'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export interface DreExportData {
  branchName: string
  cropYear: string
  organizationName: string
  cnpj?: string | null
  generatedAt: string
  dre: {
    receitaBruta: number
    descontos: number
    receitaLiquida: number
    custosDiretos: number
    margemContribuicao: number
    despesasFixas: number
    resultadoOperacional: number
  }
  bankBalances: Array<{
    bankName: string
    accountType: string
    balance: number
  }>
  transactions: Array<{
    date: string
    type: string
    categoryCode: string
    categoryName: string
    documentNumber: string
    entityName: string
    costCenter: string
    bankName: string
    amount: number
  }>
}

export function generateDrePdfHtml(data: DreExportData): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    @media print {
      @page {
        size: A4 portrait;
        margin: 10mm 12mm 10mm 12mm;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      font-size: 11px;
      line-height: 1.4;
    }

    .report-sheet {
      width: 794px;
      min-height: 1120px;
      padding: 36px 40px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
    }

    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2.5px solid #1B4D3E;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }

    .logo-cell {
      width: 15%;
      vertical-align: middle;
    }

    .logo-badge {
      background: #1B4D3E;
      color: #ffffff;
      font-weight: 900;
      font-size: 20px;
      padding: 10px 14px;
      border-radius: 6px;
      display: inline-block;
    }

    .title-cell {
      width: 85%;
      vertical-align: middle;
      padding-left: 12px;
    }

    .org-title {
      font-size: 14px;
      font-weight: 900;
      color: #1B4D3E;
      text-transform: uppercase;
    }

    .doc-subtitle {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      margin-top: 2px;
    }

    .meta-line {
      font-size: 9px;
      color: #64748b;
      margin-top: 3px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 800;
      color: #1B4D3E;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 4px;
      margin-top: 20px;
      margin-bottom: 10px;
    }

    .dre-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }

    .dre-table td {
      padding: 7px 10px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 11px;
    }

    .dre-line-main {
      font-weight: 800;
      background: #f8fafc;
      color: #0f172a;
    }

    .dre-line-sub {
      color: #475569;
      padding-left: 24px !important;
    }

    .dre-line-total {
      font-weight: 900;
      background: #ecfdf5;
      color: #065f46;
      border-top: 2px solid #10b981 !important;
      border-bottom: 2px solid #10b981 !important;
      font-size: 12px;
    }

    .text-right {
      text-align: right;
    }

    .balance-grid {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      border: 1px solid #e2e8f0;
    }

    .balance-grid th {
      background: #f8fafc;
      padding: 6px 10px;
      text-align: left;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
    }

    .balance-grid td {
      padding: 6px 10px;
      font-size: 10px;
      border-bottom: 1px solid #f1f5f9;
    }

    .footer-signatures {
      margin-top: 45px;
      width: 100%;
      border-collapse: collapse;
    }

    .sig-cell {
      width: 50%;
      text-align: center;
      padding: 0 30px;
    }

    .sig-line {
      border-top: 1.5px solid #0f172a;
      margin-top: 40px;
      padding-top: 6px;
      font-size: 10px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="report-sheet">
    <table class="header-table">
      <tr>
        <td class="logo-cell">
          <div class="logo-badge">LN</div>
        </td>
        <td class="title-cell">
          <div class="org-title">${data.organizationName || 'LN CONSULTORIA E PROJETOS RURAIS'}</div>
          <div class="doc-subtitle">Demonstrativo do Resultado do Exercício (DRE Gerencial)</div>
          <div class="meta-line">
            Unidade: <strong>${data.branchName}</strong> • Safra: <strong>${data.cropYear}</strong> • Emissão: ${new Date(data.generatedAt).toLocaleString('pt-BR')}
          </div>
        </td>
      </tr>
    </table>

    <!-- Tabela Estruturada do DRE -->
    <div class="section-title">1. Demonstrativo Contábil do Resultado Operacional</div>
    <table class="dre-table">
      <tr class="dre-line-main">
        <td>(+) RECEITA OPERACIONAL BRUTA</td>
        <td class="text-right">${formatCurrency(data.dre.receitaBruta)}</td>
      </tr>
      <tr class="dre-line-sub">
        <td>(-) Deduções e Descontos Comerciais Concedidos</td>
        <td class="text-right" style="color: #e11d48;">- ${formatCurrency(data.dre.descontos)}</td>
      </tr>
      <tr class="dre-line-main" style="background: #f1f5f9;">
        <td>(=) RECEITA OPERACIONAL LÍQUIDA</td>
        <td class="text-right">${formatCurrency(data.dre.receitaLiquida)}</td>
      </tr>
      <tr class="dre-line-sub">
        <td>(-) Custos Diretos dos Projetos (ART, Campo, Cartório, Comissões)</td>
        <td class="text-right" style="color: #e11d48;">- ${formatCurrency(data.dre.custosDiretos)}</td>
      </tr>
      <tr class="dre-line-main" style="background: #f8fafc;">
        <td>(=) MARGEM DE CONTRIBUIÇÃO OPERACIONAL</td>
        <td class="text-right" style="color: #1B4D3E;">${formatCurrency(data.dre.margemContribuicao)}</td>
      </tr>
      <tr class="dre-line-sub">
        <td>(-) Despesas Fixas da Filial (Aluguel, Folha, Administrativas)</td>
        <td class="text-right" style="color: #e11d48;">- ${formatCurrency(data.dre.despesasFixas)}</td>
      </tr>
      <tr class="dre-line-total">
        <td>(=) RESULTADO OPERACIONAL LÍQUIDO DA SAFRA</td>
        <td class="text-right">${formatCurrency(data.dre.resultadoOperacional)}</td>
      </tr>
    </table>

    <!-- Posição de Caixas e Tesouraria -->
    <div class="section-title">2. Posição Consolidada de Caixas e Contas Bancárias</div>
    <table class="balance-grid">
      <thead>
        <tr>
          <th>Instituição / Conta</th>
          <th>Tipo</th>
          <th class="text-right">Saldo em Conta</th>
        </tr>
      </thead>
      <tbody>
        ${data.bankBalances
          .map(
            (b) => `
          <tr>
            <td style="font-weight: 700;">${b.bankName}</td>
            <td style="color: #64748b;">${b.accountType}</td>
            <td class="text-right" style="font-weight: 700; color: ${b.balance >= 0 ? '#065f46' : '#e11d48'};">
              ${formatCurrency(b.balance)}
            </td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <!-- Assinaturas de Conferência -->
    <table class="footer-signatures">
      <tr>
        <td class="sig-cell">
          <div class="sig-line">Lindomar Pereira Cardoso Junior</div>
          <div style="font-size: 8.5px; color: #64748b; text-transform: uppercase;">Diretoria Executiva / Representante Legal</div>
        </td>
        <td class="sig-cell">
          <div class="sig-line">Departamento Financeiro & Controladoria</div>
          <div style="font-size: 8.5px; color: #64748b; text-transform: uppercase;">LN Consultoria e Projetos Rurais</div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`
}

export default function FinancialExportModal({
  isOpen,
  onClose,
  exportData,
}: {
  isOpen: boolean
  onClose: () => void
  exportData: DreExportData
}) {
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  // Exportar Relatório em PDF 336 DPI
  const handleExportPdf = async () => {
    setIsExportingPdf(true)
    const toastId = toast.loading('Compilando Demonstrativo DRE em Alta Resolução (336 DPI)...')

    try {
      const html = generateDrePdfHtml(exportData)
      const cleanBranch = exportData.branchName.replace(/[^a-zA-Z0-9_-]/g, '_')
      const fileName = `DRE_${cleanBranch}_Safra_${exportData.cropYear.replace('/', '-')}_${Date.now()}.pdf`
      await downloadQuittanceReceiptPdf(html, fileName)
      toast.dismiss(toastId)
      toast.success('Demonstrativo DRE emitido com sucesso!')
      onClose()
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err?.message || 'Falha ao compilar PDF do DRE.')
    } finally {
      setIsExportingPdf(false)
    }
  }

  // Exportar Planilha Estruturada CSV para Assessoria Contábil
  const handleExportCsv = () => {
    try {
      const headers = [
        'Data Liquidação',
        'Tipo Operação',
        'Plano Contas (Código)',
        'Categoria Financeira',
        'Nº Documento',
        'Fornecedor / Produtor',
        'Centro de Custo / Proposta',
        'Conta Bancária / Caixa',
        'Valor (R$)',
      ]

      const rows = exportData.transactions.map((t) => [
        t.date,
        t.type,
        t.categoryCode,
        `"${t.categoryName}"`,
        `"${t.documentNumber}"`,
        `"${t.entityName}"`,
        `"${t.costCenter}"`,
        `"${t.bankName}"`,
        t.amount.toFixed(2).replace('.', ','),
      ])

      const csvContent =
        '\uFEFF' +
        [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const cleanBranch = exportData.branchName.replace(/[^a-zA-Z0-9_-]/g, '_')
      link.setAttribute(
        'download',
        `Extrato_Contabil_${cleanBranch}_${Date.now()}.csv`
      )
      link.setAttribute('href', url)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Planilha contábil (CSV) exportada com sucesso!')
      onClose()
    } catch (err: any) {
      toast.error('Erro ao gerar arquivo CSV contábil.')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <FileSpreadsheet className="h-5 w-5 text-emerald-800" />
            Central de Exportação Contábil (Assessoria Externa)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
            <div className="font-bold text-slate-800">
              Escopo: {exportData.branchName} • Safra {exportData.cropYear}
            </div>
            <p className="text-[11px] text-slate-500">
              Gera relatórios padronizados prontos para conferência fiscal e contabilidade externa.
            </p>
          </div>

          <div className="space-y-2">
            {/* Opção 1: Demonstrativo DRE em PDF */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3.5 hover:border-emerald-600 hover:bg-emerald-50/40 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Demonstrativo DRE Oficial (PDF)</div>
                  <div className="text-[10px] text-slate-500">
                    Formato A4 timbrado, alta resolução (336 DPI) com assinatura
                  </div>
                </div>
              </div>
              <Download className="h-4 w-4 text-emerald-800" />
            </button>

            {/* Opção 2: Planilha Estruturada CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3.5 hover:border-emerald-600 hover:bg-emerald-50/40 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-800">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Extrato Analítico (CSV / Excel)</div>
                  <div className="text-[10px] text-slate-500">
                    Planilha com plano de contas, centro de custo e notas fiscais
                  </div>
                </div>
              </div>
              <Download className="h-4 w-4 text-blue-800" />
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
