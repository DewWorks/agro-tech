import React from 'react'
import { getDocumentTypeAndLabel, formatCPF } from '@/lib/utils/masks'
import { denormalizeCategoryBB, denormalizePurposeBB } from '@/lib/validations/livestock-mapper'

interface DeclarationContentProps {
  templateCode: string
  producer: any
  property: any
  options: any
}

export const DeclarationContent = React.memo(({ templateCode, producer, property, options }: DeclarationContentProps) => {
  const isLegalTemplate = [
    'AUTORIZACAO_COMPARTILHAMENTO',
    'AUTORIZACAO_SCR',
    'AUTORIZACAO_SICOR',
    'DECLARACAO_POSSE_MANSA',
    'DECLARACAO_REGULARIDADE_AMBIENTAL',
    'DECLARACAO_FORA_BIOMA',
    'ENQUADRAMENTO_CAF',
    'IDENTIFICACAO_ANIMAIS'
  ].includes(templateCode)

  if (!isLegalTemplate) return null

  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const location = property?.city && property?.state ? `${property.city} - ${property.state}` : 'Local não informado'

  const { label: docLabel, formatted: docFormatted, isCnpj } = getDocumentTypeAndLabel(producer?.document, producer?.type)
  const repCpf = options?.representativeCpf || producer?.representativeCpf
  const repCpfFormatted = repCpf ? formatCPF(repCpf) : ''
  const repName = options?.representativeName || producer?.representativeName || (isCnpj ? producer?.name?.replace(/\s*\(PJ\)\s*/i, '').trim() : '')

  const qualification = isCnpj ? (
    <>
      Eu, <strong>{producer?.name || '_________________________'}</strong>, pessoa jurídica inscrita no CNPJ sob o nº <strong style={{ whiteSpace: 'nowrap' }}>{docFormatted || '_________________________'}</strong>, neste ato representada por seu titular/representante legal{repName ? <> <strong>{repName}</strong></> : ''}, inscrito(a) no CPF sob o nº <strong style={{ whiteSpace: 'nowrap' }}>{repCpfFormatted || '_________________________'}</strong>
    </>
  ) : (
    <>
      Eu, <strong>{producer?.name || '_________________________'}</strong>, inscrito(a) no CPF sob o nº <strong style={{ whiteSpace: 'nowrap' }}>{docFormatted || '_________________________'}</strong>
    </>
  )

  const contentStyle = {
    padding: '20px 10px',
    fontSize: '12px',
    lineHeight: '1.6',
    textAlign: 'justify' as const,
    color: '#374151'
  }

  const renderContent = () => {
    switch (templateCode) {
      case 'AUTORIZACAO_COMPARTILHAMENTO':
        return (
          <div style={contentStyle}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>AUTORIZAÇÃO DE COMPARTILHAMENTO DE DADOS E INFORMAÇÕES</h3>
            <p>
              {qualification}, 
              residente e domiciliado(a) no endereço da propriedade <strong>{property?.name || '_________________________'}</strong>, Município de <strong>{location}</strong>, 
              venho por meio desta, de forma livre, expressa e informada, AUTORIZAR o Banco do Brasil S.A. a realizar o compartilhamento dos meus dados cadastrais, financeiros e de 
              operações de crédito com entidades governamentais e instituições parceiras estritamente para a finalidade de análise e contratação de crédito rural, conforme diretrizes da Lei Geral de Proteção de Dados (LGPD).
            </p>
            <p style={{ marginTop: '15px' }}>
              Esta autorização abrange as informações relativas à propriedade <strong>{property?.name}</strong>, de Matrícula <strong>{property?.registrationNumber || '_______'}</strong> e CAR <strong>{property?.car || '_______'}</strong>.
            </p>
          </div>
        )
      
      case 'AUTORIZACAO_SCR':
        return (
          <div style={contentStyle}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>AUTORIZAÇÃO PARA CONSULTA AO SCR</h3>
            <p>
              {qualification}, autorizo o Banco do Brasil S.A. a consultar, a qualquer tempo, as informações consolidadas a meu respeito constantes do Sistema de Informações de Crédito (SCR), mantido pelo Banco Central do Brasil (Bacen).
            </p>
            <p style={{ marginTop: '15px' }}>
              Declaro estar ciente de que:
              <br/>a) o SCR tem por finalidades fornecer informações ao Bacen para fins de supervisão do risco de crédito e propiciar o intercâmbio de informações entre instituições financeiras;
              <br/>b) poderei ter acesso aos dados constantes em meu nome no SCR por meio do sistema Registrato do Bacen;
              <br/>c) pedidos de correções, exclusões e manifestações de discordância quanto às informações no SCR deverão ser dirigidos ao Banco do Brasil S.A., mediante requerimento escrito e fundamentado.
            </p>
          </div>
        )

      case 'AUTORIZACAO_SICOR':
        return (
          <div style={contentStyle}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>AUTORIZAÇÃO PARA CONSULTA AO SICOR</h3>
            <p>
              {qualification}, 
              autorizo o Banco do Brasil S.A. a consultar e registrar no Sistema de Operações do Crédito Rural e do Proagro (SICOR), administrado pelo Banco Central do Brasil, todas as informações 
              necessárias à estruturação, concessão e acompanhamento das minhas operações de crédito rural, vinculadas à propriedade <strong>{property?.name}</strong> (CAR: {property?.car || '_______'}).
            </p>
          </div>
        )

      case 'DECLARACAO_POSSE_MANSA':
        return (
          <div style={contentStyle}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>DECLARAÇÃO DE POSSE MANSA E PACÍFICA</h3>
            <p>
              {qualification}, 
              DECLARO para os devidos fins, sob as penas da lei, que detenho a posse mansa, pacífica, ininterrupta e sem oposição do imóvel rural denominado <strong>{property?.name || '_________________________'}</strong>, 
              com área total de <strong>{property?.totalAreaHa || '___'} hectares</strong>, localizado no município de <strong>{location}</strong>.
            </p>
            <p style={{ marginTop: '15px' }}>
              Declaro ainda que o imóvel não é objeto de disputas judiciais, esbulho, turbação ou litígio agrário de qualquer natureza.
            </p>
          </div>
        )

      case 'DECLARACAO_REGULARIDADE_AMBIENTAL':
        return (
          <div style={contentStyle}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>DECLARAÇÃO DE REGULARIDADE AMBIENTAL</h3>
            <p>
              {qualification}, DECLARO sob as penas da lei que as atividades agropecuárias desenvolvidas no imóvel rural <strong>{property?.name || '_________________________'}</strong> (CAR: {property?.car || '_______'}) 
              estão em estrita conformidade com a Legislação Ambiental vigente.
            </p>
            <p style={{ marginTop: '15px' }}>
              Atesto, sob responsabilidade civil e criminal, que a referida propriedade NÃO possui áreas embargadas pelo IBAMA, ICMBio ou órgãos estaduais de meio ambiente, e não incorre em desmatamento ilegal após 22 de julho de 2008.
            </p>
          </div>
        )

      case 'DECLARACAO_FORA_BIOMA':
        return (
          <div style={contentStyle}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>DECLARAÇÃO DE IMÓVEL FORA DO BIOMA (AMAZÔNIA/PANTANAL)</h3>
            <p>
              {qualification}, DECLARO perante o Banco do Brasil S.A. que a área financiada na propriedade rural <strong>{property?.name || '_________________________'}</strong>, 
              objeto do instrumento de crédito rural, encontra-se totalmente inserida em bioma permitido para exploração comercial financiada, NÃO estando localizada no Bioma Amazônia ou Bioma Pantanal, ou, se localizada, cumpre rigorosamente as restrições impostas pelo Conselho Monetário Nacional (CMN).
            </p>
          </div>
        )

      case 'ENQUADRAMENTO_CAF':
        return (
          <div style={contentStyle}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>VERIFICAÇÃO DE ENQUADRAMENTO CAF / PRONAF</h3>
            <p>
              Declaro que possuo o Cadastro Nacional da Agricultura Familiar (CAF) ativo e regular, enquadrando-me nas condições de beneficiário do Programa Nacional de Fortalecimento da Agricultura Familiar (PRONAF).
            </p>
            <p style={{ marginTop: '15px' }}>
              <strong>Nome do Produtor:</strong> {producer?.name || '-'}<br/>
              <strong>Propriedade:</strong> {property?.name || '-'}<br/>
              <strong>Área Total:</strong> {property?.totalAreaHa || '-'} ha
            </p>
            <p style={{ marginTop: '15px' }}>
              Confirmo que a força de trabalho principal é familiar e que a renda oriunda da atividade agropecuária familiar constitui a parte predominante da renda do núcleo familiar.
            </p>
          </div>
        )

      case 'IDENTIFICACAO_ANIMAIS': {
        const animals: any[] = property?.livestockList || options?.livestockItems || property?.livestocks || []
        const totalHeadCount = animals.length > 0 
          ? animals.reduce((acc, a) => acc + (Number(a.quantity) || 0), 0)
          : (Number(property?.livestockData?.totalCattle) || Number(options?.livestockCattleHeads) || 0)
        
        const totalEstimatedValue = animals.length > 0
          ? animals.reduce((acc, a) => acc + ((Number(a.quantity) || 0) * (Number(a.unitValue) || Number(options?.livestockCattleHeadValue) || 2800)), 0)
          : totalHeadCount * (Number(options?.livestockCattleHeadValue) || 2800)

        const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

        return (
          <div style={contentStyle}>
            <h3 style={{ textAlign: 'center', marginBottom: '14px', fontWeight: 'bold' }}>IDENTIFICAÇÃO DE ANIMAIS EM GARANTIA (PENHOR PECUÁRIO)</h3>
            <p style={{ marginBottom: '12px' }}>
              Em relação à operação de crédito rural vinculada à propriedade <strong>{property?.name || '_________________________'}</strong>, 
              localizada no município de <strong>{location}</strong>, apresento a seguir a discriminação do rebanho bovino oferecido em garantia de penhor ao Banco do Brasil S.A.
            </p>

            {animals.length > 0 ? (
              <div style={{ marginTop: '10px', marginBottom: '14px', border: '1px solid #d1d5db', borderRadius: '4px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase', color: '#111827' }}>
                      <th style={{ padding: '6px 8px' }}>Categoria</th>
                      <th style={{ padding: '6px 8px' }}>Finalidade</th>
                      <th style={{ padding: '6px 8px' }}>Raça</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center' }}>Qtd (Cab.)</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center' }}>Idade</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center' }}>Peso Médio</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Valor Unit.</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '6px 8px' }}>Marca & Local</th>
                    </tr>
                  </thead>
                  <tbody>
                    {animals.map((item: any, idx: number) => {
                      const qty = Number(item.quantity) || 0
                      const unitVal = Number(item.unitValue) || Number(options?.livestockCattleHeadValue) || 2800
                      const tot = qty * unitVal
                      const cat = item.category || denormalizeCategoryBB(item.categoryBB) || item.categoryBB || 'Bovino'
                      const purp = denormalizePurposeBB(item.purposeBB) || item.purposeBB || 'Produção'
                      const brandInfo = [item.brandingType, item.brandingLocation].filter(Boolean).join(' - ') || property?.livestockData?.brandLocation || 'Conforme Vistoria'
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                          <td style={{ padding: '5px 8px', fontWeight: 600 }}>{cat}</td>
                          <td style={{ padding: '5px 8px', color: '#4b5563' }}>{purp}</td>
                          <td style={{ padding: '5px 8px' }}>{item.breed || 'Nelore'}</td>
                          <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 'bold' }}>{qty}</td>
                          <td style={{ padding: '5px 8px', textAlign: 'center' }}>{item.ageMonths ? `${item.ageMonths}m` : '-'}</td>
                          <td style={{ padding: '5px 8px', textAlign: 'center' }}>{item.avgWeightKg ? `${item.avgWeightKg}kg` : '-'}</td>
                          <td style={{ padding: '5px 8px', textAlign: 'right' }}>{formatBRL(unitVal)}</td>
                          <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, color: '#1B4D3E' }}>{formatBRL(tot)}</td>
                          <td style={{ padding: '5px 8px', fontSize: '9px', color: '#6b7280' }}>{brandInfo}</td>
                        </tr>
                      )
                    })}
                    <tr style={{ background: '#f9fafb', fontWeight: 'bold', borderTop: '1px solid #d1d5db' }}>
                      <td colSpan={3} style={{ padding: '6px 8px', textTransform: 'uppercase' }}>Total em Penhor</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#1B4D3E' }}>{totalHeadCount} cab</td>
                      <td colSpan={3}></td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#1B4D3E' }}>{formatBRL(totalEstimatedValue)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}

            <div style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#f9fafb', fontSize: '11px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><strong>Localização do Rebanho:</strong> {property?.name}</div>
                <div><strong>Município/UF:</strong> {location}</div>
                <div><strong>Total Vinculado em Garantia:</strong> {totalHeadCount} cabeças</div>
                <div><strong>Valor Total Avaliado:</strong> {formatBRL(totalEstimatedValue)}</div>
                <div><strong>Marca a Fogo / Ferro:</strong> {property?.livestockData?.brandDescription || options?.livestockBrandDescription || 'Ferro Quente'}</div>
                <div><strong>Local da Marcação:</strong> {property?.livestockData?.brandLocation || 'Conforme Vistoria'}</div>
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>Registro de Marca (Órgão / ADAPEC):</strong> {property?.livestockData?.brandRegistrationAdapec || options?.livestockBrandAdapec || 'Em processo / Regular'}
                </div>
              </div>
            </div>
          </div>
        )
      }

      default:
        return null
    }
  }

  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
      <div style={{ background: '#f3f4f6', padding: '4px 10px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase' }}>
        II - Texto da Declaração / Autorização
      </div>
      {renderContent()}
      <div style={{ padding: '0 20px 20px 20px', fontSize: '12px', color: '#374151', textAlign: 'right' }}>
        {location}, {today}.
      </div>
    </div>
  )
})
DeclarationContent.displayName = 'DeclarationContent'
