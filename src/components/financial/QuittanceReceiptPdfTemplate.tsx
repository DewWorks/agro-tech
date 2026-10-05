'use client'

import React from 'react'
import { downloadQuittanceReceiptPdf } from '@/lib/utils/quittance-receipt-pdf-downloader'

export interface QuittanceReceiptPdfData {
  receiptNumber: string
  issuedAt: string | Date
  sha256Hash?: string | null
  organization: {
    name: string
    cnpj?: string | null
    ownerName?: string | null
  }
  branch: {
    name: string
    city?: string | null
    state?: string | null
  }
  producer: {
    name: string
    document: string
    phone?: string | null
    email?: string | null
  }
  property?: {
    name: string
    city?: string | null
    state?: string | null
    registrationNumber?: string | null
  } | null
  title: {
    documentNumber?: string | null
    serviceSubtype?: string | null
    cropYear?: string | null
    originType?: string | null
  }
  installment: {
    installmentNumber: number
    totalInstallments: number
    dueDate?: string | Date | null
  }
  amounts: {
    amountReceivedThisEvent: number
    totalInstallmentReceived: number
    installmentTotalAmount: number
    remainingInstallmentBalance: number
  }
  bankAccount: {
    bankName: string
    agency?: string | null
    accountNumber?: string | null
  }
  paymentDate: string | Date
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function formatCpfCnpj(doc: string): string {
  const clean = (doc || '').replace(/[^\d]+/g, '')
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return doc
}

/**
 * Gera o HTML oficial do Recibo de Quitação da LN Consultoria (A4, 336 DPI real).
 */
export function generateQuittanceReceiptHtml(data: QuittanceReceiptPdfData): string {
  const isTotalQuittance = data.amounts.remainingInstallmentBalance <= 0.01

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
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        background: #ffffff !important;
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
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
    }

    .receipt-sheet {
      position: relative;
      width: 794px;
      min-height: 1120px;
      background: #ffffff;
      padding: 36px 40px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      overflow: hidden;
    }

    /* Marca d'Água Institucional LN */
    .receipt-watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 78px;
      font-weight: 900;
      color: rgba(27, 77, 62, 0.035);
      letter-spacing: 12px;
      pointer-events: none;
      z-index: 0;
      white-space: nowrap;
      text-transform: uppercase;
    }

    .content-wrapper {
      position: relative;
      z-index: 1;
    }

    /* Cabeçalho Oficial Timbrado */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2.5px solid #1B4D3E;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }

    .header-logo-cell {
      width: 25%;
      vertical-align: middle;
    }

    .header-logo-badge {
      display: inline-block;
      background: #1B4D3E;
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 1.5px;
      text-align: center;
    }

    .header-title-cell {
      width: 50%;
      text-align: center;
      vertical-align: middle;
    }

    .org-name {
      font-size: 14px;
      font-weight: 900;
      color: #1B4D3E;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .org-subtitle {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      margin-top: 2px;
      text-transform: uppercase;
    }

    .receipt-number-cell {
      width: 25%;
      text-align: right;
      vertical-align: middle;
    }

    .receipt-tag {
      display: inline-block;
      background: #ecfdf5;
      border: 1.5px solid #10b981;
      color: #065f46;
      padding: 6px 12px;
      border-radius: 6px;
      text-align: right;
    }

    .receipt-tag-label {
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      display: block;
    }

    .receipt-tag-number {
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.5px;
    }

    /* Box de Destaque do Valor */
    .amount-highlight-box {
      background: linear-gradient(135deg, #1B4D3E 0%, #0d3126 100%);
      color: #ffffff;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 22px;
      display: table;
      width: 100%;
    }

    .amount-box-left {
      display: table-cell;
      vertical-align: middle;
      width: 60%;
    }

    .amount-box-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #a7f3d0;
      font-weight: 700;
    }

    .amount-box-value {
      font-size: 26px;
      font-weight: 900;
      color: #ffffff;
      margin-top: 3px;
      letter-spacing: -0.5px;
    }

    .amount-box-right {
      display: table-cell;
      vertical-align: middle;
      width: 40%;
      text-align: right;
    }

    .quittance-status-pill {
      display: inline-block;
      background: ${isTotalQuittance ? '#10b981' : '#f59e0b'};
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Seções de Informação */
    .section-title {
      font-size: 11px;
      font-weight: 800;
      color: #1B4D3E;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 4px;
      margin-top: 16px;
      margin-bottom: 10px;
    }

    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }

    .info-table td {
      padding: 5px 8px;
      vertical-align: top;
      border-bottom: 1px solid #f1f5f9;
    }

    .info-label {
      width: 25%;
      font-size: 9.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }

    .info-value {
      width: 75%;
      font-size: 11px;
      font-weight: 600;
      color: #0f172a;
    }

    /* Tabela de Discriminação Financeira */
    .fin-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }

    .fin-table th {
      background: #f8fafc;
      color: #334155;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1.5px solid #cbd5e1;
    }

    .fin-table td {
      padding: 9px 10px;
      font-size: 10.5px;
      border-bottom: 1px solid #e2e8f0;
    }

    .fin-table tr:last-child td {
      border-bottom: none;
    }

    .text-right {
      text-align: right;
    }

    .font-bold {
      font-weight: 800;
    }

    .color-primary {
      color: #1B4D3E;
    }

    /* Bloco Declaratório Legal */
    .legal-declaration {
      background: #f8fafc;
      border-left: 3px solid #1B4D3E;
      padding: 12px 16px;
      margin: 20px 0;
      font-size: 10.5px;
      line-height: 1.55;
      color: #334155;
      text-align: justify;
    }

    /* Bloco de Autenticidade Criptográfica */
    .auth-box {
      border: 1px dashed #94a3b8;
      border-radius: 6px;
      padding: 10px 14px;
      margin: 16px 0;
      background: #fafafa;
    }

    .auth-title {
      font-size: 9px;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .auth-hash {
      font-family: "Courier New", Courier, monospace;
      font-size: 9px;
      color: #0f172a;
      word-break: break-all;
      background: #ffffff;
      padding: 6px 8px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      line-height: 1.3;
    }

    /* Rodapé e Assinatura */
    .footer-section {
      margin-top: 36px;
      width: 100%;
      border-collapse: collapse;
    }

    .signature-cell {
      width: 50%;
      text-align: center;
      vertical-align: top;
      padding: 0 20px;
    }

    .signature-line {
      border-top: 1.5px solid #0f172a;
      margin-top: 40px;
      padding-top: 6px;
      font-size: 10.5px;
      font-weight: 700;
      color: #0f172a;
    }

    .signature-role {
      font-size: 9px;
      color: #64748b;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="receipt-sheet" id="receipt-sheet">
    <div class="receipt-watermark">LN CONSULTORIA</div>

    <div class="content-wrapper">
      <!-- Topo Oficial -->
      <table class="header-table">
        <tr>
          <td class="header-logo-cell">
            <div class="header-logo-badge">LN</div>
          </td>
          <td class="header-title-cell">
            <div class="org-name">${data.organization.name || 'LN CONSULTORIA E PROJETOS RURAIS'}</div>
            <div class="org-subtitle">Recibo Oficial de Liquidação Financeira</div>
            <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">
              CNPJ: ${formatCpfCnpj(data.organization.cnpj || '')} • Filial: ${data.branch.name} (${data.branch.city || ''}/${data.branch.state || ''})
            </div>
          </td>
          <td class="receipt-number-cell">
            <div class="receipt-tag">
              <span class="receipt-tag-label">Nº do Recibo</span>
              <span class="receipt-tag-number">${data.receiptNumber}</span>
            </div>
          </td>
        </tr>
      </table>

      <!-- Caixa de Destaque do Valor Amortizado -->
      <div class="amount-highlight-box">
        <div class="amount-box-left">
          <div class="amount-box-label">Valor Baixado Neste Evento</div>
          <div class="amount-box-value">${formatCurrency(data.amounts.amountReceivedThisEvent)}</div>
        </div>
        <div class="amount-box-right">
          <span class="quittance-status-pill">
            ${isTotalQuittance ? 'Quitação Total' : 'Amortização Parcial'}
          </span>
        </div>
      </div>

      <!-- Identificação do Produtor / Pagador -->
      <div class="section-title">1. Dados do Pagador (Produtor Rural)</div>
      <table class="info-table">
        <tr>
          <td class="info-label">Nome / Razão Social:</td>
          <td class="info-value">${data.producer.name}</td>
        </tr>
        <tr>
          <td class="info-label">CPF / CNPJ:</td>
          <td class="info-value">${formatCpfCnpj(data.producer.document)}</td>
        </tr>
        ${data.producer.phone ? `
        <tr>
          <td class="info-label">Telefone de Contato:</td>
          <td class="info-value">${data.producer.phone}</td>
        </tr>` : ''}
      </table>

      <!-- Identificação do Imóvel e Objeto Contratual -->
      <div class="section-title">2. Objeto do Faturamento & Imóvel Rural</div>
      <table class="info-table">
        <tr>
          <td class="info-label">Imóvel Rural / Fazenda:</td>
          <td class="info-value">${data.property?.name || 'N/A'} ${data.property?.city ? `(${data.property.city}/${data.property?.state || ''})` : ''}</td>
        </tr>
        <tr>
          <td class="info-label">Matrícula do Imóvel:</td>
          <td class="info-value">${data.property?.registrationNumber || 'Conforme projeto fundiário'}</td>
        </tr>
        <tr>
          <td class="info-label">Título / Documento Ref.:</td>
          <td class="info-value">${data.title.documentNumber || 'FAT-AVULSO'} • Safra: ${data.title.cropYear || '2025/2026'}</td>
        </tr>
        <tr>
          <td class="info-label">Serviço Técnico Realizado:</td>
          <td class="info-value">${data.title.serviceSubtype || 'Consultoria Técnica e Honorários de Crédito Rural'}</td>
        </tr>
      </table>

      <!-- Discriminação Contábil da Quitação -->
      <div class="section-title">3. Discriminação Financeira da Operação</div>
      <table class="fin-table">
        <thead>
          <tr>
            <th>Item / Parcela</th>
            <th class="text-right">Valor da Parcela</th>
            <th class="text-right">Amortizado Hoje</th>
            <th class="text-right">Total Acumulado</th>
            <th class="text-right">Saldo Residual</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="font-bold">Parcela ${String(data.installment.installmentNumber).padStart(2, '0')} de ${String(data.installment.totalInstallments).padStart(2, '0')}</td>
            <td class="text-right">${formatCurrency(data.amounts.installmentTotalAmount)}</td>
            <td class="text-right font-bold color-primary">${formatCurrency(data.amounts.amountReceivedThisEvent)}</td>
            <td class="text-right">${formatCurrency(data.amounts.totalInstallmentReceived)}</td>
            <td class="text-right font-bold" style="color: ${isTotalQuittance ? '#10b981' : '#e11d48'};">
              ${formatCurrency(data.amounts.remainingInstallmentBalance)}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Meio de Pagamento e Conta Bancária -->
      <table class="info-table" style="margin-top: 10px;">
        <tr>
          <td class="info-label">Conta de Liquidação:</td>
          <td class="info-value">${data.bankAccount.bankName} ${data.bankAccount.agency ? `(Ag. ${data.bankAccount.agency} / CC ${data.bankAccount.accountNumber})` : ''}</td>
        </tr>
        <tr>
          <td class="info-label">Data da Liquidação:</td>
          <td class="info-value">${formatDate(data.paymentDate)}</td>
        </tr>
        <tr>
          <td class="info-label">Data de Emissão do Recibo:</td>
          <td class="info-value">${formatDate(data.issuedAt)} às ${new Date(data.issuedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
        </tr>
      </table>

      <!-- Texto Declaratório Legal -->
      <div class="legal-declaration">
        <strong>DECLARAÇÃO FORMAL DE QUITAÇÃO:</strong> A empresa <strong>${data.organization.name || 'LN CONSULTORIA E PROJETOS RURAIS'}</strong>, inscrita no CNPJ sob o nº <strong>${formatCpfCnpj(data.organization.cnpj || '')}</strong>, declara formalmente haver recebido do pagador acima identificado a importância líquida e certa discriminada neste instrumento (${formatCurrency(data.amounts.amountReceivedThisEvent)}), conferindo ao mesmo plena, geral e irrevogável quitação <em>exclusivamente</em> quanto ao montante amortizado no presente evento financeiro, restando preservados os direitos de cobrança sobre saldos residuais futuros ou vincendos decorrentes do contrato de prestação de serviços.
      </div>

      <!-- Bloco de Autenticidade Digital Criptográfica -->
      <div class="auth-box">
        <div class="auth-title">PROTOCOLO DE AUTENTICIDADE CRIPTOGRÁFICA (SHA-256)</div>
        <div class="auth-hash">${data.sha256Hash || 'HASH-PENDENTE-CONVERSAO'}</div>
        <div style="font-size: 8px; color: #64748b; margin-top: 4px;">
          Este recibo oficial foi gerado e chancelado pelo Módulo de Gestão Financeira (Aditivo 004). O código hash acima assegura imutabilidade jurídica e auditoria digital conforme as normas vigentes.
        </div>
      </div>

      <!-- Assinatura Institucional -->
      <table class="footer-section">
        <tr>
          <td class="signature-cell">
            <div class="signature-line">${data.producer.name}</div>
            <div class="signature-role">Pagador / Produtor Rural</div>
          </td>
          <td class="signature-cell">
            <div class="signature-line">${data.organization.name || 'LN CONSULTORIA E PROJETOS RURAIS'}</div>
            <div class="signature-role">Departamento Financeiro & Controladoria</div>
          </td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>
`
}

/**
 * Disparo direto de download do Recibo Oficial em 1 clique (336 DPI).
 */
export async function triggerQuittanceReceiptDownload(data: QuittanceReceiptPdfData): Promise<void> {
  const html = generateQuittanceReceiptHtml(data)
  const cleanProducer = (data.producer.name || 'Produtor').replace(/[^a-zA-Z0-9_-]/g, '_')
  const fileName = `Recibo_${data.receiptNumber}_${cleanProducer}.pdf`
  await downloadQuittanceReceiptPdf(html, fileName)
}

/**
 * Componente React para Pré-visualização ou Embed do Recibo em Modal.
 */
export default function QuittanceReceiptPdfTemplate({
  data,
}: {
  data: QuittanceReceiptPdfData
}) {
  const isTotalQuittance = data.amounts.remainingInstallmentBalance <= 0.01

  return (
    <div className="relative mx-auto w-full max-w-[794px] overflow-hidden rounded-lg border border-slate-200 bg-white p-8 shadow-md text-slate-800">
      {/* Marca d'água */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-30 text-6xl font-black tracking-widest text-emerald-950/5 select-none uppercase">
        LN CONSULTORIA
      </div>

      {/* Header */}
      <div className="relative z-10 border-b-2 border-emerald-800 pb-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-black text-white">
            LN
          </div>
          <div>
            <h2 className="text-base font-black text-emerald-900 uppercase">
              {data.organization.name}
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Recibo Oficial de Liquidação Financeira
            </p>
            <p className="text-[10px] text-slate-400">
              Filial: {data.branch.name} ({data.branch.city}/{data.branch.state})
            </p>
          </div>
        </div>

        <div className="rounded-md border border-emerald-500 bg-emerald-50 px-3 py-1.5 text-right">
          <span className="block text-[9px] font-bold text-emerald-700 uppercase">
            Nº do Recibo
          </span>
          <span className="text-sm font-black text-emerald-900">{data.receiptNumber}</span>
        </div>
      </div>

      {/* Banner Valor */}
      <div className="relative z-10 mb-6 flex items-center justify-between rounded-lg bg-gradient-to-r from-emerald-800 to-emerald-950 p-4 text-white">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
            Valor Baixado Neste Evento
          </span>
          <div className="text-2xl font-black">
            {formatCurrency(data.amounts.amountReceivedThisEvent)}
          </div>
        </div>
        <div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${
              isTotalQuittance ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
            }`}
          >
            {isTotalQuittance ? 'Quitação Total' : 'Amortização Parcial'}
          </span>
        </div>
      </div>

      {/* Identificação */}
      <div className="relative z-10 space-y-4 text-xs">
        <div>
          <h3 className="border-b border-slate-200 pb-1 font-bold text-emerald-900 uppercase">
            1. Dados do Pagador
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-2 text-slate-700">
            <div>
              <span className="font-semibold text-slate-500">Produtor:</span> {data.producer.name}
            </div>
            <div>
              <span className="font-semibold text-slate-500">CPF/CNPJ:</span>{' '}
              {formatCpfCnpj(data.producer.document)}
            </div>
          </div>
        </div>

        <div>
          <h3 className="border-b border-slate-200 pb-1 font-bold text-emerald-900 uppercase">
            2. Imóvel & Objeto Contratual
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-2 text-slate-700">
            <div>
              <span className="font-semibold text-slate-500">Imóvel Rural:</span>{' '}
              {data.property?.name || 'N/A'}
            </div>
            <div>
              <span className="font-semibold text-slate-500">Documento:</span>{' '}
              {data.title.documentNumber || 'FAT-AVULSO'} (Safra {data.title.cropYear || '2025/2026'})
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-slate-500">Serviço:</span>{' '}
              {data.title.serviceSubtype || 'Consultoria Técnica Agronômica'}
            </div>
          </div>
        </div>

        {/* Tabela de Discriminação */}
        <div>
          <h3 className="border-b border-slate-200 pb-1 font-bold text-emerald-900 uppercase">
            3. Discriminação Financeira
          </h3>
          <table className="mt-2 w-full border-collapse rounded border border-slate-200 text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase">
                <th className="p-2 border-b">Parcela</th>
                <th className="p-2 border-b text-right">Valor da Parcela</th>
                <th className="p-2 border-b text-right">Amortizado Hoje</th>
                <th className="p-2 border-b text-right">Acumulado</th>
                <th className="p-2 border-b text-right">Saldo Residual</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 font-bold">
                  {String(data.installment.installmentNumber).padStart(2, '0')} /{' '}
                  {String(data.installment.totalInstallments).padStart(2, '0')}
                </td>
                <td className="p-2 text-right">{formatCurrency(data.amounts.installmentTotalAmount)}</td>
                <td className="p-2 text-right font-bold text-emerald-800">
                  {formatCurrency(data.amounts.amountReceivedThisEvent)}
                </td>
                <td className="p-2 text-right">{formatCurrency(data.amounts.totalInstallmentReceived)}</td>
                <td
                  className={`p-2 text-right font-bold ${
                    isTotalQuittance ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {formatCurrency(data.amounts.remainingInstallmentBalance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Informações da Conta */}
        <div className="rounded border border-slate-100 bg-slate-50/50 p-2 text-slate-600">
          <div>
            <span className="font-semibold">Conta Creditada:</span> {data.bankAccount.bankName}
          </div>
          <div>
            <span className="font-semibold">Data da Baixa:</span> {formatDate(data.paymentDate)}
          </div>
        </div>

        {/* Hash Criptográfico */}
        <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-2.5">
          <span className="block text-[9px] font-bold text-slate-500 uppercase">
            Protocolo de Autenticidade Criptográfica (SHA-256)
          </span>
          <code className="block text-[9px] break-all font-mono text-slate-800 mt-1">
            {data.sha256Hash || 'N/A'}
          </code>
        </div>
      </div>
    </div>
  )
}
