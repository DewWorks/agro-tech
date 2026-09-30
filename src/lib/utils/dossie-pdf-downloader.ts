/**
 * Utility para compilação e download do Dossiê Técnico de Crédito em PDF (A4).
 * Resolve de forma definitiva o problema de "PDF em branco" gerado por elementos offscreen
 * com left: -9999px ou displays inválidos em bibliotecas de canvas.
 */
export async function downloadCreditLimitDossierPdf(html: string, fileName: string): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default

  // Cria um container offscreen no topo esquerdo do DOM (left: 0, top: 0),
  // porém posicionado sob z-index: -9999 e pointer-events: none,
  // permitindo que o html2canvas processe todas as coordenadas de (0, 0) sem recortes.
  const host = document.createElement('div')
  host.id = 'dossie-pdf-render-host'
  host.style.position = 'fixed'
  host.style.left = '0'
  host.style.top = '0'
  host.style.width = '794px' // Largura exata A4 a 96 DPI
  host.style.minHeight = '1123px'
  host.style.backgroundColor = '#ffffff'
  host.style.zIndex = '-9999'
  host.style.opacity = '1'
  host.style.pointerEvents = 'none'
  host.style.display = 'block'
  host.style.overflow = 'visible'

  const content = document.createElement('div')
  content.innerHTML = html
  content.style.width = '794px'
  content.style.backgroundColor = '#ffffff'
  host.appendChild(content)
  document.body.appendChild(host)

  // Aguarda 150ms para que o navegador processe o layout, fontes e estilos CSS
  await new Promise((resolve) => setTimeout(resolve, 150))

  try {
    const opt = {
      margin: 0,
      filename: fileName || `Dossie_Limite_Credito_${Date.now()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        backgroundColor: '#ffffff',
        ignoreElements: (node: Element) => node.tagName?.toLowerCase() === 'noscript',
      },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      pagebreak: { mode: ['css'] },
    }

    await html2pdf().set(opt).from(content).save()
  } finally {
    if (document.body.contains(host)) {
      document.body.removeChild(host)
    }
  }
}
