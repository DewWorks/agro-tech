/**
 * Utilitário universal para impressão limpa de documentos A4 sem pop-ups about:blank,
 * sem cabeçalhos/rodapés indesejados de URL do navegador e preservando 100% dos estilos CSS.
 */
export function printElementCleanly(
  elementOrHtml: HTMLElement | string,
  title = 'Documento Oficial'
): void {
  if (typeof window === 'undefined') return

  const existingIframe = document.getElementById('universal-print-iframe')
  if (existingIframe) {
    existingIframe.remove()
  }

  const iframe = document.createElement('iframe')
  iframe.id = 'universal-print-iframe'
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.zIndex = '-9999'
  iframe.style.visibility = 'hidden'

  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) {
    window.print()
    return
  }

  const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('\n')

  const contentHtml =
    typeof elementOrHtml === 'string'
      ? elementOrHtml
      : elementOrHtml.outerHTML

  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        ${styleLinks}
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 8mm 8mm 8mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .shadow-2xl, .shadow-xl, .shadow-md, .shadow-sm {
            box-shadow: none !important;
          }
          .border {
            border-color: #cbd5e1 !important;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
    </html>
  `)
  doc.close()

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch (e) {
      console.error('Falha ao acionar impressão no iframe:', e)
      window.print()
    }
  }

  if (typeof document !== 'undefined' && document.fonts) {
    document.fonts.ready
      .then(() => {
        setTimeout(triggerPrint, 150)
      })
      .catch(() => {
        setTimeout(triggerPrint, 300)
      })
  } else {
    setTimeout(triggerPrint, 300)
  }
}
