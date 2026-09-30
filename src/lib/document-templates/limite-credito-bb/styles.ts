export const documentStyles = `
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
      .page-sheet, .dossie-page {
        box-sizing: border-box !important;
        width: 100% !important;
        max-height: 275mm !important;
        page-break-after: always !important;
        break-after: page !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
      }
      .page-sheet:last-of-type, .dossie-page:last-of-type, .dossie-page-last {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }
    .page-sheet, .dossie-page {
      background: #ffffff;
      width: 794px;
      max-width: 794px;
      height: 1120px;
      max-height: 1120px;
      margin: 0 auto;
      padding: 22px 26px 45px 26px;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #1f2937;
      font-size: 10px;
      line-height: 1.4;
      border: 1px solid #e5e7eb;
      box-sizing: border-box;
      position: relative;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .dossie-page:not(.dossie-page-last) {
      page-break-after: always;
      break-after: page;
    }
    .dossie-page-last {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    .dossie-footer {
      position: absolute;
      bottom: 18px;
      left: 26px;
      right: 26px;
      border-top: 1px solid #e5e7eb;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5px;
      color: #9ca3af;
      box-sizing: border-box;
    }
    .dossie-card {
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: #ffffff;
      margin-bottom: 10px;
      box-sizing: border-box;
    }
    .dossie-card-header {
      background: #f3f4f6;
      padding: 4px 9px;
      font-weight: 700;
      color: #111827;
      border-bottom: 1px solid #d1d5db;
      border-top-left-radius: 3px;
      border-top-right-radius: 3px;
      text-transform: uppercase;
      font-size: 9.5px;
      line-height: 1.3;
    }
    .dossie-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      text-align: left;
      font-size: 9px;
      line-height: 1.25;
      font-variant-numeric: tabular-nums;
    }
    .dossie-table th {
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      padding: 5px 8px;
      font-weight: 700;
      color: #374151;
      font-size: 8.5px;
      text-transform: uppercase;
      vertical-align: middle !important;
      box-sizing: border-box;
    }
    .dossie-table td {
      padding: 5px 8px;
      vertical-align: middle !important;
      box-sizing: border-box;
      line-height: 1.25;
    }
    .dossie-table td > div,
    .dossie-table td > span {
      line-height: 1.25;
      vertical-align: middle;
    }
    .dossie-total-row,
    .dossie-total-row td {
      padding: 7px 8px !important;
      font-size: 9.5px !important;
      font-weight: 700 !important;
      line-height: 1.3 !important;
      vertical-align: middle !important;
      box-sizing: border-box;
    }
    .badge-approved {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 2.5px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 9.5px;
      text-transform: uppercase;
      display: inline-block;
    }
    .badge-alert {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 2.5px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 9.5px;
      text-transform: uppercase;
      display: inline-block;
    }
    .badge-rejected {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
      padding: 2.5px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 9.5px;
      text-transform: uppercase;
      display: inline-block;
    }
    .badge-neutral {
      background: #f3f4f6;
      color: #4b5563;
      border: 1px solid #d1d5db;
      padding: 2.5px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 9.5px;
      text-transform: uppercase;
      display: inline-block;
    }
  </style>
`
