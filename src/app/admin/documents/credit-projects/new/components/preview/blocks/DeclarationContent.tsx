import React from 'react'

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
              Eu, <strong>{producer?.name || '_________________________'}</strong>, inscrito(a) no CPF/CNPJ sob o nº <strong>{producer?.document || '_________________________'}</strong>, 
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
              Autorizo o Banco do Brasil S.A. a consultar, a qualquer tempo, as informações consolidadas a meu respeito constantes do Sistema de Informações de Crédito (SCR), mantido pelo Banco Central do Brasil (Bacen).
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
              Eu, <strong>{producer?.name || '_________________________'}</strong>, inscrito(a) no CPF/CNPJ sob o nº <strong>{producer?.document || '_________________________'}</strong>, 
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
              Eu, <strong>{producer?.name || '_________________________'}</strong>, inscrito(a) no CPF/CNPJ sob o nº <strong>{producer?.document || '_________________________'}</strong>, 
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
              Eu, <strong>{producer?.name || '_________________________'}</strong>, DECLARO sob as penas da lei que as atividades agropecuárias desenvolvidas no imóvel rural <strong>{property?.name || '_________________________'}</strong> (CAR: {property?.car || '_______'}) 
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
              Eu, <strong>{producer?.name || '_________________________'}</strong>, DECLARO perante o Banco do Brasil S.A. que a área financiada na propriedade rural <strong>{property?.name || '_________________________'}</strong>, 
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

      case 'IDENTIFICACAO_ANIMAIS':
        return (
          <div style={contentStyle}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>IDENTIFICAÇÃO DE ANIMAIS EM GARANTIA (PENHOR PECUÁRIO)</h3>
            <p>
              Em relação à operação de crédito rural, apresento a seguir a identificação dos semoventes (rebanho) que constituirão a garantia de penhor em favor do Banco do Brasil S.A.
            </p>
            <div style={{ marginTop: '15px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#f9fafb' }}>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, lineHeight: '1.8' }}>
                <li><strong>Localização dos Animais (Propriedade):</strong> {property?.name}</li>
                <li><strong>Município/UF:</strong> {location}</li>
                <li><strong>Quantidade Total Vinculada:</strong> {property?.livestockData?.totalCattle || '0'} cabeças</li>
                <li><strong>Marca a Fogo / Ferro:</strong> {property?.livestockData?.brandDescription || 'Não informada'}</li>
                <li><strong>Local da Marcação:</strong> {property?.livestockData?.brandLocation || 'Não informado'}</li>
                <li><strong>Registro de Marca (ADAPEC/Órgão):</strong> {property?.livestockData?.brandRegistrationAdapec || 'Não informado'}</li>
              </ul>
            </div>
          </div>
        )

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
