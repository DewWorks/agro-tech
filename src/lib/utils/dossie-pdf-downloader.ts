/**
 * Utility para compilação e download do Dossiê Técnico de Crédito em PDF (A4).
 * Resolve de forma definitiva o problema de "PDF em branco" gerado por elementos offscreen
 * com left: -9999px ou displays inválidos em bibliotecas de canvas.
 */
export async function downloadCreditLimitDossierPdf(html: string, fileName: string): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const html2canvas = (await import('html2canvas')).default

  // Cria um container offscreen no topo esquerdo do DOM (left: 0, top: 0),
  // porém posicionado sob z-index: -9999 e pointer-events: none,
  // permitindo que o html2canvas processe todas as coordenadas de (0, 0) sem recortes.
  const host = document.createElement('div')
  host.id = 'dossie-pdf-render-host'
  host.style.position = 'fixed'
  host.style.left = '0'
  host.style.top = '0'
  host.style.width = '794px' // Largura exata A4 a 96 DPI
  host.style.backgroundColor = '#ffffff'
  host.style.zIndex = '-9999'
  host.style.opacity = '1'
  host.style.pointerEvents = 'none'
  host.style.display = 'block'
  host.style.overflow = 'visible'
  host.style.setProperty('text-rendering', 'geometricPrecision')
  host.style.setProperty('-webkit-font-smoothing', 'antialiased')
  host.style.setProperty('-moz-osx-font-smoothing', 'grayscale')

  const content = document.createElement('div')
  content.innerHTML = html
  content.style.width = '794px'
  content.style.backgroundColor = '#ffffff'
  content.style.setProperty('text-rendering', 'geometricPrecision')
  content.style.setProperty('-webkit-font-smoothing', 'antialiased')
  content.style.setProperty('-moz-osx-font-smoothing', 'grayscale')
  host.appendChild(content)
  document.body.appendChild(host)

  // Aguarda carregamento oficial das fontes tipográficas e estilos CSS
  if (typeof document !== 'undefined' && document.fonts) {
    await document.fonts.ready
  }
  await new Promise((resolve) => setTimeout(resolve, 150))

  try {
    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
    })

    const pages = host.querySelectorAll<HTMLElement>('.page-sheet, .dossie-page, .document-page')

    if (pages.length > 0) {
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) {
          pdf.addPage('a4', 'portrait')
        }
        const pageEl = pages[i]
        const canvas = await html2canvas(pageEl, {
          scale: 2.5,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794,
          backgroundColor: '#ffffff',
          ignoreElements: (node: Element) => node.tagName?.toLowerCase() === 'noscript',
          onclone: (clonedDoc: Document) => {
            const el = clonedDoc.getElementById('dossie-pdf-render-host')
            if (el) {
              el.style.width = '794px'
              el.style.margin = '0'
              el.style.backgroundColor = '#ffffff'
              el.style.setProperty('text-rendering', 'geometricPrecision')
              el.style.setProperty('-webkit-font-smoothing', 'antialiased')
              el.style.setProperty('-moz-osx-font-smoothing', 'grayscale')
            }
          },
        })
        const imgData = canvas.toDataURL('image/jpeg', 0.98)
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)
      }
    } else {
      const canvas = await html2canvas(content, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        backgroundColor: '#ffffff',
        ignoreElements: (node: Element) => node.tagName?.toLowerCase() === 'noscript',
      })
      const imgData = canvas.toDataURL('image/jpeg', 0.98)
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)
    }

    pdf.save(fileName || `Dossie_Limite_Credito_${Date.now()}.pdf`)
  } finally {
    if (document.body.contains(host)) {
      document.body.removeChild(host)
    }
  }
}
