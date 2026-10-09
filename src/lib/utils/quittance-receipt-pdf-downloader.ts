/**
 * Motor de Emissão e Download de Recibo Oficial de Quitação em PDF (A4 - 336 DPI).
 * Baseado no engine institucional de dossiês da LN Consultoria.
 */
export async function downloadQuittanceReceiptPdf(html: string, fileName: string): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const html2canvas = (await import('html2canvas')).default

  // Cria um container offscreen no topo esquerdo do DOM (left: 0, top: 0),
  // com z-index: -9999 e pointer-events: none para renderização perfeita no html2canvas
  const host = document.createElement('div')
  host.id = 'quittance-receipt-render-host'
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

    const canvas = await html2canvas(content, {
      scale: 3,
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 794,
      backgroundColor: '#ffffff',
      ignoreElements: (node: Element) => node.tagName?.toLowerCase() === 'noscript',
      onclone: (clonedDoc: Document) => {
        const el = clonedDoc.getElementById('quittance-receipt-render-host')
        if (el) {
          el.style.width = '794px'
          el.style.margin = '0'
          el.style.backgroundColor = '#ffffff'
        }
      },
    })
    const imgData = canvas.toDataURL('image/jpeg', 0.98)
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)

    pdf.save(fileName || `Recibo_Quitacao_LN_${Date.now()}.pdf`)
  } finally {
    if (document.body.contains(host)) {
      document.body.removeChild(host)
    }
  }
}
