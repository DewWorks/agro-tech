export const documentStyles = `
  <style>
    @media print {
      .dossie-page {
        page-break-after: always;
        break-after: page;
        margin: 0;
        padding: 20mm;
        box-shadow: none;
      }
      body {
        background: #fff;
      }
    }
    .dossie-page {
      background: #ffffff;
      width: 794px;
      max-width: 794px;
      min-height: 1120px;
      margin: 0 auto;
      padding: 24px 30px;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #1f2937;
      font-size: 11px;
      line-height: 1.45;
      border: 1px solid #e5e7eb;
      box-sizing: border-box;
      page-break-after: always;
      break-after: page;
      position: relative;
    }
    .badge-approved {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
    }
    .badge-alert {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
    }
    .badge-rejected {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
    }
  </style>
`
