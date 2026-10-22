export interface HeaderParams {
  logoBase64?: string | null
  companyName: string
  primaryColor?: string
  documentTitle: string
  documentSubtitle?: string
}

export function buildOfficialDocumentHeaderHtml({
  logoBase64,
  companyName,
  primaryColor = '#1B4D3E',
  documentTitle,
  documentSubtitle = 'Declaração Legal • Banco do Brasil / Regulamentar'
}: HeaderParams): string {
  return `
    <div class="official-doc-header" style="min-height: 52px; max-height: 52px; height: 52px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 4px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; overflow: hidden; box-sizing: border-box; width: 100%;">
      <div style="display: flex; align-items: center; gap: 12px; height: 50px; overflow: hidden;">
        <div style="width: 170px; height: 50px; min-width: 170px; max-width: 170px; display: flex; align-items: center; justify-content: flex-start; overflow: hidden; box-sizing: border-box;">
          ${logoBase64 ? `
            <img 
              src="${logoBase64}" 
              alt="${companyName}" 
              style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; object-position: left center; display: block !important; margin: 0; padding: 0;" 
            />
          ` : `
            <div style="font-size: 13px; font-weight: 800; color: ${primaryColor}; text-transform: uppercase; line-height: 1.1; letter-spacing: -0.3px;">
              ${companyName}
            </div>
          `}
        </div>

        <div style="display: flex; flex-direction: column; justify-content: center;">
          <h1 style="font-size: 12px; font-weight: 800; color: ${primaryColor}; margin: 0; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.2;">
            ${documentTitle}
          </h1>
          <p style="font-size: 8.5px; color: #4b5563; margin: 2px 0 0 0; font-weight: 600; line-height: 1.2;">
            ${documentSubtitle}
          </p>
        </div>
      </div>

      <div style="text-align: right; font-size: 8px; color: #6b7280; line-height: 1.25; flex-shrink: 0;">
        <span style="font-weight: bold; color: ${primaryColor};">${companyName}</span><br />
        Conformidade MCR / BACEN
      </div>
    </div>
  `
}
