import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

interface TemplateSeed {
  code: string
  title: string
  description: string
  contentHtml: string
  schemaJson: Record<string, any>
}

const templates: TemplateSeed[] = [
  {
    code: 'AUTORIZACAO_SCR',
    title: 'Autorização para Consulta ao SCR',
    description: 'Autorização obrigatória para que o banco consulte o histórico de crédito do produtor no SCR.',
    contentHtml: `
<div style="font-family: Arial, Helvetica, sans-serif; padding: 20px 25px; line-height: 1.5; color: #1f2937; box-sizing: border-box; width: 100%;">
  {{{HEADER_OFICIAL}}}

  <!-- I - IDENTIFICAÇÃO DO PROPONENTE -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      I - IDENTIFICAÇÃO DO PROPONENTE & IMÓVEL RURAL
    </div>
    <div style="padding: 8px 12px; font-size: 10.5px; display: grid; grid-template-columns: 1.2fr 1fr; gap: 6px 14px; line-height: 1.35; background: #fafafa;">
      <div><strong>Proponente:</strong> {{NOME_PRODUTOR}}</div>
      <div><strong>Documento:</strong> {{PRODUCER_DOCUMENT_WITH_TYPE}}</div>
      <div><strong>Imóvel Rural:</strong> {{NOME_PROPRIEDADE}}</div>
      <div><strong>Município / UF:</strong> {{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}</div>
    </div>
  </div>

  <!-- II - TERMO DE AUTORIZAÇÃO -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      II - AUTORIZAÇÃO PARA CONSULTA AO SCR (SISTEMA DE INFORMAÇÕES DE CRÉDITO - BACEN)
    </div>
    <div style="padding: 10px 12px; font-size: 10.5px; line-height: 1.55; text-align: justify;">
      <p style="margin: 0 0 8px 0;">
        Eu, <strong>{{NOME_PRODUTOR}}</strong>, inscrito(a) sob o <strong>{{PRODUCER_DOCUMENT_WITH_TYPE}}</strong>, autorizo expressamente o <strong>Banco do Brasil S.A.</strong> e seus agentes autorizados a consultar, a qualquer tempo, as informações consolidadas a meu respeito constantes do <strong>Sistema de Informações de Crédito (SCR)</strong>, administrado pelo <strong>Banco Central do Brasil (Bacen)</strong>, bem como em outros bancos de dados e cadastros restritivos e de proteção ao crédito.
      </p>
      <p style="margin: 0 0 6px 0;">
        Declaro estar ciente de que:
      </p>
      <p style="margin: 0 0 4px 0; padding-left: 10px;">
        <strong>a)</strong> O SCR tem por finalidades fornecer informações ao Banco Central do Brasil para fins de supervisão do risco de crédito e propiciar o intercâmbio de informações entre instituições financeiras autorizadas;
      </p>
      <p style="margin: 0 0 4px 0; padding-left: 10px;">
        <strong>b)</strong> Poderei ter acesso aos dados constantes em meu nome no SCR por meio do sistema Registrato mantido pelo Bacen;
      </p>
      <p style="margin: 0 0 4px 0; padding-left: 10px;">
        <strong>c)</strong> Pedidos de correções, exclusões e manifestações de discordância quanto às informações no SCR deverão ser dirigidos ao Banco do Brasil S.A., mediante requerimento escrito e fundamentado.
      </p>
    </div>
  </div>

  <!-- ASSINATURAS -->
  <div style="margin-top: 30px; text-align: center; font-size: 10px; page-break-inside: avoid;">
    <p style="margin-bottom: 25px;">{{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}, {{DATA_EXTENSO}}.</p>
    <div style="display: flex; justify-content: space-around; gap: 24px;">
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_PRODUTOR}}</strong><br />
          <span>{{PRODUCER_DOCUMENT_WITH_TYPE}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Proponente / Titular</span>
        </div>
      </div>
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_EMPRESA}}</strong><br />
          <span>{{CNPJ_EMPRESA}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Consultoria Técnica / Correspondente</span>
        </div>
      </div>
    </div>
  </div>
</div>
    `,
    schemaJson: {
      required: [
        { key: 'NOME_PRODUTOR', label: 'Nome do Produtor', source: 'Producer', field: 'name', type: 'string' },
        { key: 'DOCUMENTO_PRODUTOR', label: 'CPF/CNPJ do Produtor', source: 'Producer', field: 'document', type: 'string' },
        { key: 'NOME_PROPRIEDADE', label: 'Nome da Propriedade', source: 'Property', field: 'propertyName', type: 'string' },
        { key: 'MUNICIPIO_IMOVEL', label: 'Município', source: 'Property', field: 'city', type: 'string' },
        { key: 'UF_IMOVEL', label: 'UF', source: 'Property', field: 'state', type: 'string' }
      ]
    }
  },
  {
    code: 'AUTORIZACAO_SICOR',
    title: 'Autorização para Consulta ao SICOR',
    description: 'Autorização para acesso aos dados de operações de crédito rural registradas no SICOR.',
    contentHtml: `
<div style="font-family: Arial, Helvetica, sans-serif; padding: 20px 25px; line-height: 1.5; color: #1f2937; box-sizing: border-box; width: 100%;">
  {{{HEADER_OFICIAL}}}

  <!-- I - IDENTIFICAÇÃO DO PROPONENTE -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      I - IDENTIFICAÇÃO DO PROPONENTE & IMÓVEL RURAL
    </div>
    <div style="padding: 8px 12px; font-size: 10.5px; display: grid; grid-template-columns: 1.2fr 1fr; gap: 6px 14px; line-height: 1.35; background: #fafafa;">
      <div><strong>Proponente:</strong> {{NOME_PRODUTOR}}</div>
      <div><strong>Documento:</strong> {{PRODUCER_DOCUMENT_WITH_TYPE}}</div>
      <div><strong>Imóvel Rural:</strong> {{NOME_PROPRIEDADE}}</div>
      <div><strong>Município / UF:</strong> {{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}</div>
    </div>
  </div>

  <!-- II - TERMO DE AUTORIZAÇÃO -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      II - AUTORIZAÇÃO PARA CONSULTA E REGISTRO NO SICOR (BACEN / PROAGRO)
    </div>
    <div style="padding: 10px 12px; font-size: 10.5px; line-height: 1.55; text-align: justify;">
      <p style="margin: 0 0 8px 0;">
        Eu, <strong>{{NOME_PRODUTOR}}</strong>, inscrito(a) sob o <strong>{{PRODUCER_DOCUMENT_WITH_TYPE}}</strong>, autorizo expressamente o <strong>Banco do Brasil S.A.</strong> a consultar e registrar no <strong>Sistema de Operações do Crédito Rural e do Proagro (SICOR)</strong>, administrado pelo Banco Central do Brasil, todas as informações necessárias à estruturação, concessão e acompanhamento das minhas operações de crédito rural.
      </p>
      <p style="margin: 0 0 6px 0;">
        A autorização abrange o compartilhamento e checagem de coordenadas geográficas e limites do imóvel <strong>{{NOME_PROPRIEDADE}}</strong> (CAR: {{CAR_NUMERO}}), certificações de conformidade ambiental e registros vinculados aos financiamentos concedidos.
      </p>
    </div>
  </div>

  <!-- ASSINATURAS -->
  <div style="margin-top: 30px; text-align: center; font-size: 10px; page-break-inside: avoid;">
    <p style="margin-bottom: 25px;">{{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}, {{DATA_EXTENSO}}.</p>
    <div style="display: flex; justify-content: space-around; gap: 24px;">
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_PRODUTOR}}</strong><br />
          <span>{{PRODUCER_DOCUMENT_WITH_TYPE}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Proponente / Titular</span>
        </div>
      </div>
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_EMPRESA}}</strong><br />
          <span>{{CNPJ_EMPRESA}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Consultoria Técnica / Correspondente</span>
        </div>
      </div>
    </div>
  </div>
</div>
    `,
    schemaJson: {
      required: [
        { key: 'NOME_PRODUTOR', label: 'Nome do Produtor', source: 'Producer', field: 'name', type: 'string' },
        { key: 'DOCUMENTO_PRODUTOR', label: 'CPF/CNPJ do Produtor', source: 'Producer', field: 'document', type: 'string' },
        { key: 'NOME_PROPRIEDADE', label: 'Nome da Propriedade', source: 'Property', field: 'propertyName', type: 'string' },
        { key: 'CAR_NUMERO', label: 'CAR', source: 'Property', field: 'car', type: 'string' },
        { key: 'MUNICIPIO_IMOVEL', label: 'Município', source: 'Property', field: 'city', type: 'string' },
        { key: 'UF_IMOVEL', label: 'UF', source: 'Property', field: 'state', type: 'string' }
      ]
    }
  },
  {
    code: 'AUTORIZACAO_COMPARTILHAMENTO',
    title: 'Autorização de Compartilhamento de Dados',
    description: 'Autorização formal para o Banco do Brasil consultar e compartilhar dados do cliente com outras instituições financeiras e parceiros.',
    contentHtml: `
<div style="font-family: Arial, Helvetica, sans-serif; padding: 20px 25px; line-height: 1.5; color: #1f2937; box-sizing: border-box; width: 100%;">
  {{{HEADER_OFICIAL}}}

  <!-- I - IDENTIFICAÇÃO DO PROPONENTE -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      I - IDENTIFICAÇÃO DO PROPONENTE & IMÓVEL RURAL
    </div>
    <div style="padding: 8px 12px; font-size: 10.5px; display: grid; grid-template-columns: 1.2fr 1fr; gap: 6px 14px; line-height: 1.35; background: #fafafa;">
      <div><strong>Proponente:</strong> {{NOME_PRODUTOR}}</div>
      <div><strong>Documento:</strong> {{PRODUCER_DOCUMENT_WITH_TYPE}}</div>
      <div><strong>Imóvel Rural:</strong> {{NOME_PROPRIEDADE}}</div>
      <div><strong>Município / UF:</strong> {{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}</div>
    </div>
  </div>

  <!-- II - TERMO DE AUTORIZAÇÃO -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      II - COMPARTILHAMENTO DE DADOS CADASTRAIS (LGPD)
    </div>
    <div style="padding: 10px 12px; font-size: 10.5px; line-height: 1.55; text-align: justify;">
      <p style="margin: 0 0 8px 0;">
        Eu, <strong>{{NOME_PRODUTOR}}</strong>, inscrito(a) sob o <strong>{{PRODUCER_DOCUMENT_WITH_TYPE}}</strong>, titular da propriedade rural <strong>{{NOME_PROPRIEDADE}}</strong>, venho por meio desta, de forma livre, expressa e informada, AUTORIZAR o <strong>Banco do Brasil S.A.</strong> a realizar o compartilhamento dos meus dados cadastrais, financeiros e de operações de crédito com entidades governamentais e instituições parceiras estritamente para a finalidade de análise e contratação de crédito rural, conforme diretrizes da Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
      </p>
      <p style="margin: 0 0 6px 0;">
        Esta autorização abrange as informações cadastrais e agronômicas relativas ao imóvel <strong>{{NOME_PROPRIEDADE}}</strong>, Matrícula nº {{MATRICULA}} e CAR nº {{CAR_NUMERO}}.
      </p>
    </div>
  </div>

  <!-- ASSINATURAS -->
  <div style="margin-top: 30px; text-align: center; font-size: 10px; page-break-inside: avoid;">
    <p style="margin-bottom: 25px;">{{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}, {{DATA_EXTENSO}}.</p>
    <div style="display: flex; justify-content: space-around; gap: 24px;">
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_PRODUTOR}}</strong><br />
          <span>{{PRODUCER_DOCUMENT_WITH_TYPE}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Proponente / Titular</span>
        </div>
      </div>
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_EMPRESA}}</strong><br />
          <span>{{CNPJ_EMPRESA}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Consultoria Técnica / Correspondente</span>
        </div>
      </div>
    </div>
  </div>
</div>
    `,
    schemaJson: {
      required: [
        { key: 'NOME_PRODUTOR', label: 'Nome do Produtor', source: 'Producer', field: 'name', type: 'string' },
        { key: 'DOCUMENTO_PRODUTOR', label: 'CPF/CNPJ do Produtor', source: 'Producer', field: 'document', type: 'string' },
        { key: 'NOME_PROPRIEDADE', label: 'Nome da Propriedade', source: 'Property', field: 'propertyName', type: 'string' },
        { key: 'MATRICULA', label: 'Matrícula', source: 'Property', field: 'registrationNumber', type: 'string' },
        { key: 'CAR_NUMERO', label: 'CAR', source: 'Property', field: 'car', type: 'string' },
        { key: 'MUNICIPIO_IMOVEL', label: 'Município', source: 'Property', field: 'city', type: 'string' },
        { key: 'UF_IMOVEL', label: 'UF', source: 'Property', field: 'state', type: 'string' }
      ]
    }
  },
  {
    code: 'DECLARACAO_POSSE_MANSA',
    title: 'Declaração de Posse Mansa e Pacífica',
    description: 'Declaração para áreas sem titulação definitiva atestando a posse sem litígio para acesso a financiamento.',
    contentHtml: `
<div style="font-family: Arial, Helvetica, sans-serif; padding: 20px 25px; line-height: 1.5; color: #1f2937; box-sizing: border-box; width: 100%;">
  {{{HEADER_OFICIAL}}}

  <!-- I - IDENTIFICAÇÃO DO DECLARANTE E IMÓVEL -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      I - IDENTIFICAÇÃO DO DECLARANTE E DO IMÓVEL RURAL
    </div>
    <div style="padding: 8px 12px; font-size: 10.5px; display: grid; grid-template-columns: 1.2fr 1fr; gap: 6px 14px; line-height: 1.35; background: #fafafa;">
      <div><strong>Declarante:</strong> {{NOME_PRODUTOR}}</div>
      <div><strong>Documento:</strong> {{PRODUCER_DOCUMENT_WITH_TYPE}}</div>
      <div><strong>Propriedade / Posse:</strong> {{NOME_PROPRIEDADE}}</div>
      <div><strong>Área Total:</strong> {{AREA_HA}} hectares</div>
      <div><strong>Município / UF:</strong> {{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}</div>
      <div><strong>Matrícula / Registro:</strong> {{MATRICULA}}</div>
    </div>
  </div>

  <!-- II - DECLARAÇÃO DE POSSE -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      II - DECLARAÇÃO DE POSSE MANSA, PACÍFICA E ININTERRUPTA
    </div>
    <div style="padding: 10px 12px; font-size: 10.5px; line-height: 1.55; text-align: justify;">
      <p style="margin: 0 0 8px 0;">
        Declaro para os devidos fins, sob as penas da lei, que exerço a <strong>posse mansa, pacífica, ininterrupta e sem oposição</strong> sobre o imóvel rural denominado <strong>{{NOME_PROPRIEDADE}}</strong>, com área total de <strong>{{AREA_HA}} hectares</strong>, localizado no município de <strong>{{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}</strong>, há pelo menos <strong>{{TEMPO_POSSE_ANOS}} anos</strong>.
      </p>
      <p style="margin: 0 0 6px 0;">
        Declaro ainda que o referido imóvel não é objeto de disputas judiciais, esbulho, turbação, desapropriação ou qualquer litígio agrário, destinando-se a exploração agropecuária contínua.
      </p>
    </div>
  </div>

  <!-- ASSINATURAS -->
  <div style="margin-top: 30px; text-align: center; font-size: 10px; page-break-inside: avoid;">
    <p style="margin-bottom: 25px;">{{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}, {{DATA_EXTENSO}}.</p>
    <div style="display: flex; justify-content: space-around; gap: 24px;">
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_PRODUTOR}}</strong><br />
          <span>{{PRODUCER_DOCUMENT_WITH_TYPE}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Declarante / Posseiro</span>
        </div>
      </div>
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_EMPRESA}}</strong><br />
          <span>{{CNPJ_EMPRESA}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Responsável Técnico / Testemunha</span>
        </div>
      </div>
    </div>
  </div>
</div>
    `,
    schemaJson: {
      required: [
        { key: 'NOME_PRODUTOR', label: 'Nome do Produtor', source: 'Producer', field: 'name', type: 'string' },
        { key: 'DOCUMENTO_PRODUTOR', label: 'CPF/CNPJ do Produtor', source: 'Producer', field: 'document', type: 'string' },
        { key: 'NOME_PROPRIEDADE', label: 'Nome da Propriedade', source: 'Property', field: 'propertyName', type: 'string' },
        { key: 'AREA_HA', label: 'Área Total (ha)', source: 'Property', field: 'totalArea', type: 'number' },
        { key: 'MATRICULA', label: 'Matrícula', source: 'Property', field: 'registrationNumber', type: 'string' },
        { key: 'MUNICIPIO_IMOVEL', label: 'Município', source: 'Property', field: 'city', type: 'string' },
        { key: 'UF_IMOVEL', label: 'UF', source: 'Property', field: 'state', type: 'string' },
        { key: 'TEMPO_POSSE_ANOS', label: 'Tempo de Posse (Anos)', source: 'Property.possessionData', field: 'possessionYears', type: 'number' }
      ]
    }
  },
  {
    code: 'POSSE_MANSA',
    title: 'Declaração de Posse Mansa e Pacífica (Legado)',
    description: 'Declaração de posse mansa e pacífica compatível com o código anterior.',
    contentHtml: `
<div style="font-family: Arial, Helvetica, sans-serif; padding: 20px 25px; line-height: 1.5; color: #1f2937; box-sizing: border-box; width: 100%;">
  {{{HEADER_OFICIAL}}}

  <!-- I - IDENTIFICAÇÃO DO DECLARANTE E IMÓVEL -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      I - IDENTIFICAÇÃO DO DECLARANTE E DO IMÓVEL RURAL
    </div>
    <div style="padding: 8px 12px; font-size: 10.5px; display: grid; grid-template-columns: 1.2fr 1fr; gap: 6px 14px; line-height: 1.35; background: #fafafa;">
      <div><strong>Declarante:</strong> {{NOME_PRODUTOR}}</div>
      <div><strong>Documento:</strong> {{PRODUCER_DOCUMENT_WITH_TYPE}}</div>
      <div><strong>Propriedade / Posse:</strong> {{NOME_PROPRIEDADE}}</div>
      <div><strong>Área Total:</strong> {{AREA_HA}} hectares</div>
      <div><strong>Município / UF:</strong> {{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}</div>
      <div><strong>Matrícula / Registro:</strong> {{MATRICULA}}</div>
    </div>
  </div>

  <!-- II - DECLARAÇÃO DE POSSE -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      II - DECLARAÇÃO DE POSSE MANSA, PACÍFICA E ININTERRUPTA
    </div>
    <div style="padding: 10px 12px; font-size: 10.5px; line-height: 1.55; text-align: justify;">
      <p style="margin: 0 0 8px 0;">
        Declaro para os devidos fins, sob as penas da lei, que exerço a <strong>posse mansa, pacífica, ininterrupta e sem oposição</strong> sobre o imóvel rural denominado <strong>{{NOME_PROPRIEDADE}}</strong>, com área total de <strong>{{AREA_HA}} hectares</strong>, localizado no município de <strong>{{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}</strong>, há pelo menos <strong>{{TEMPO_POSSE_ANOS}} anos</strong>.
      </p>
      <p style="margin: 0 0 6px 0;">
        Declaro ainda que o referido imóvel não é objeto de disputas judiciais, esbulho, turbação, desapropriação ou qualquer litígio agrário, destinando-se a exploração agropecuária contínua.
      </p>
    </div>
  </div>

  <!-- ASSINATURAS -->
  <div style="margin-top: 30px; text-align: center; font-size: 10px; page-break-inside: avoid;">
    <p style="margin-bottom: 25px;">{{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}, {{DATA_EXTENSO}}.</p>
    <div style="display: flex; justify-content: space-around; gap: 24px;">
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_PRODUTOR}}</strong><br />
          <span>{{PRODUCER_DOCUMENT_WITH_TYPE}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Declarante / Posseiro</span>
        </div>
      </div>
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_EMPRESA}}</strong><br />
          <span>{{CNPJ_EMPRESA}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Responsável Técnico / Testemunha</span>
        </div>
      </div>
    </div>
  </div>
</div>
    `,
    schemaJson: {
      required: [
        { key: 'NOME_PRODUTOR', label: 'Nome do Produtor', source: 'Producer', field: 'name', type: 'string' },
        { key: 'DOCUMENTO_PRODUTOR', label: 'CPF/CNPJ do Produtor', source: 'Producer', field: 'document', type: 'string' },
        { key: 'NOME_PROPRIEDADE', label: 'Nome da Propriedade', source: 'Property', field: 'propertyName', type: 'string' },
        { key: 'AREA_HA', label: 'Área Total (ha)', source: 'Property', field: 'totalArea', type: 'number' },
        { key: 'MATRICULA', label: 'Matrícula', source: 'Property', field: 'registrationNumber', type: 'string' },
        { key: 'MUNICIPIO_IMOVEL', label: 'Município', source: 'Property', field: 'city', type: 'string' },
        { key: 'UF_IMOVEL', label: 'UF', source: 'Property', field: 'state', type: 'string' },
        { key: 'TEMPO_POSSE_ANOS', label: 'Tempo de Posse (Anos)', source: 'Property.possessionData', field: 'possessionYears', type: 'number' }
      ]
    }
  },
  {
    code: 'DECLARACAO_REGULARIDADE_AMBIENTAL',
    title: 'Declaração de Regularidade Ambiental',
    description: 'Atesta que a propriedade cumpre a legislação ambiental e não possui embargos ou autuações pendentes.',
    contentHtml: `
<div style="font-family: Arial, Helvetica, sans-serif; padding: 20px 25px; line-height: 1.5; color: #1f2937; box-sizing: border-box; width: 100%;">
  {{{HEADER_OFICIAL}}}

  <!-- I - IDENTIFICAÇÃO DO DECLARANTE E IMÓVEL -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      I - IDENTIFICAÇÃO DO IMÓVEL RURAL E TITULAR
    </div>
    <div style="padding: 8px 12px; font-size: 10.5px; display: grid; grid-template-columns: 1.2fr 1fr; gap: 6px 14px; line-height: 1.35; background: #fafafa;">
      <div><strong>Titular:</strong> {{NOME_PRODUTOR}}</div>
      <div><strong>Documento:</strong> {{PRODUCER_DOCUMENT_WITH_TYPE}}</div>
      <div><strong>Imóvel Rural:</strong> {{NOME_PROPRIEDADE}}</div>
      <div><strong>CAR:</strong> {{CAR_NUMERO}}</div>
      <div><strong>Matrícula:</strong> {{MATRICULA}}</div>
      <div><strong>Município / UF:</strong> {{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}</div>
    </div>
  </div>

  <!-- II - DECLARAÇÃO AMBIENTAL -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      II - DECLARAÇÃO DE CONFORMIDADE AMBIENTAL & AUSÊNCIA DE EMBARGOS
    </div>
    <div style="padding: 10px 12px; font-size: 10.5px; line-height: 1.55; text-align: justify;">
      <p style="margin: 0 0 8px 0;">
        DECLARO sob as penas da lei, para atendimento às normas do Banco Central do Brasil (MCR) e diretrizes socioambientais vigentes, que as atividades agropecuárias desenvolvidas no imóvel rural <strong>{{NOME_PROPRIEDADE}}</strong> estão em estrita conformidade com o Código Florestal (Lei nº 12.651/2012).
      </p>
      <p style="margin: 0 0 6px 0;">
        Atesto expressamente que o referido imóvel <strong>NÃO possui áreas embargadas</strong> pelo IBAMA, ICMBio ou órgãos ambientais estaduais, não sobrepõe Terras Indígenas, Unidades de Conservação ou Territórios Quilombolas, e não incorre em desmatamento ilegal posterior a 22 de julho de 2008.
      </p>
    </div>
  </div>

  <!-- ASSINATURAS -->
  <div style="margin-top: 30px; text-align: center; font-size: 10px; page-break-inside: avoid;">
    <p style="margin-bottom: 25px;">{{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}, {{DATA_EXTENSO}}.</p>
    <div style="display: flex; justify-content: space-around; gap: 24px;">
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_PRODUTOR}}</strong><br />
          <span>{{PRODUCER_DOCUMENT_WITH_TYPE}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Produtor / Declarante</span>
        </div>
      </div>
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_EMPRESA}}</strong><br />
          <span>{{CNPJ_EMPRESA}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Responsável Técnico / Elaborador</span>
        </div>
      </div>
    </div>
  </div>
</div>
    `,
    schemaJson: {
      required: [
        { key: 'NOME_PRODUTOR', label: 'Nome do Produtor', source: 'Producer', field: 'name', type: 'string' },
        { key: 'DOCUMENTO_PRODUTOR', label: 'CPF/CNPJ do Produtor', source: 'Producer', field: 'document', type: 'string' },
        { key: 'NOME_PROPRIEDADE', label: 'Nome da Propriedade', source: 'Property', field: 'propertyName', type: 'string' },
        { key: 'CAR_NUMERO', label: 'CAR', source: 'Property', field: 'car', type: 'string' },
        { key: 'MATRICULA', label: 'Matrícula', source: 'Property', field: 'registrationNumber', type: 'string' },
        { key: 'MUNICIPIO_IMOVEL', label: 'Município', source: 'Property', field: 'city', type: 'string' },
        { key: 'UF_IMOVEL', label: 'UF', source: 'Property', field: 'state', type: 'string' }
      ]
    }
  },
  {
    code: 'DISPENSA_AMBIENTAL',
    title: 'Dispensa de Licenciamento Ambiental / Outorga (Legado)',
    description: 'Declaração padrão para enquadramento de isenção junto aos órgãos ambientais.',
    contentHtml: `
<div style="font-family: Arial, Helvetica, sans-serif; padding: 20px 25px; line-height: 1.5; color: #1f2937; box-sizing: border-box; width: 100%;">
  {{{HEADER_OFICIAL}}}

  <!-- I - IDENTIFICAÇÃO DO DECLARANTE E IMÓVEL -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      I - IDENTIFICAÇÃO DO IMÓVEL RURAL E TITULAR
    </div>
    <div style="padding: 8px 12px; font-size: 10.5px; display: grid; grid-template-columns: 1.2fr 1fr; gap: 6px 14px; line-height: 1.35; background: #fafafa;">
      <div><strong>Titular:</strong> {{NOME_PRODUTOR}}</div>
      <div><strong>Documento:</strong> {{PRODUCER_DOCUMENT_WITH_TYPE}}</div>
      <div><strong>Imóvel Rural:</strong> {{NOME_PROPRIEDADE}}</div>
      <div><strong>CAR:</strong> {{CAR_NUMERO}}</div>
      <div><strong>Matrícula:</strong> {{MATRICULA}}</div>
      <div><strong>Município / UF:</strong> {{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}</div>
    </div>
  </div>

  <!-- II - DECLARAÇÃO AMBIENTAL -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      II - DECLARAÇÃO DE DISPENSA DE LICENCIAMENTO AMBIENTAL
    </div>
    <div style="padding: 10px 12px; font-size: 10.5px; line-height: 1.55; text-align: justify;">
      <p style="margin: 0 0 8px 0;">
        Eu, <strong>{{NOME_PRODUTOR}}</strong>, inscrito(a) sob o {{PRODUCER_DOCUMENT_WITH_TYPE}}, declaro perante aos órgãos competentes que as atividades exploradas na propriedade rural denominada <strong>{{NOME_PROPRIEDADE}}</strong>, Matrícula nº {{MATRICULA}} e CAR nº {{CAR_NUMERO}}, enquadram-se nas normativas de dispensa de licenciamento ambiental e outorga do direito de uso de recursos hídricos.
      </p>
      <p style="margin: 0 0 6px 0;">
        A atividade explorada não acarreta intervenção em Áreas de Preservação Permanente (APP) ou Reserva Legal em desconformidade com a legislação vigente.
      </p>
    </div>
  </div>

  <!-- ASSINATURAS -->
  <div style="margin-top: 30px; text-align: center; font-size: 10px; page-break-inside: avoid;">
    <p style="margin-bottom: 25px;">{{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}, {{DATA_EXTENSO}}.</p>
    <div style="display: flex; justify-content: space-around; gap: 24px;">
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_PRODUTOR}}</strong><br />
          <span>{{PRODUCER_DOCUMENT_WITH_TYPE}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Produtor / Declarante</span>
        </div>
      </div>
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_EMPRESA}}</strong><br />
          <span>{{CNPJ_EMPRESA}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Responsável Técnico</span>
        </div>
      </div>
    </div>
  </div>
</div>
    `,
    schemaJson: {
      required: [
        { key: 'NOME_PRODUTOR', label: 'Nome do Produtor', source: 'Producer', field: 'name', type: 'string' },
        { key: 'DOCUMENTO_PRODUTOR', label: 'CPF/CNPJ do Produtor', source: 'Producer', field: 'document', type: 'string' },
        { key: 'NOME_PROPRIEDADE', label: 'Nome da Propriedade', source: 'Property', field: 'propertyName', type: 'string' },
        { key: 'CAR_NUMERO', label: 'CAR', source: 'Property', field: 'car', type: 'string' },
        { key: 'MATRICULA', label: 'Matrícula', source: 'Property', field: 'registrationNumber', type: 'string' },
        { key: 'MUNICIPIO_IMOVEL', label: 'Município', source: 'Property', field: 'city', type: 'string' },
        { key: 'UF_IMOVEL', label: 'UF', source: 'Property', field: 'state', type: 'string' }
      ]
    }
  },
  {
    code: 'DECLARACAO_FORA_BIOMA',
    title: 'Declaração de Imóvel Fora do Bioma',
    description: 'Atesta que o imóvel financiado não se encontra em biomas com restrições específicas do Banco Central.',
    contentHtml: `
<div style="font-family: Arial, Helvetica, sans-serif; padding: 20px 25px; line-height: 1.5; color: #1f2937; box-sizing: border-box; width: 100%;">
  {{{HEADER_OFICIAL}}}

  <!-- I - IDENTIFICAÇÃO DO PROPONENTE -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      I - IDENTIFICAÇÃO DO IMÓVEL RURAL & PROPONENTE
    </div>
    <div style="padding: 8px 12px; font-size: 10.5px; display: grid; grid-template-columns: 1.2fr 1fr; gap: 6px 14px; line-height: 1.35; background: #fafafa;">
      <div><strong>Proponente:</strong> {{NOME_PRODUTOR}}</div>
      <div><strong>Documento:</strong> {{PRODUCER_DOCUMENT_WITH_TYPE}}</div>
      <div><strong>Imóvel Rural:</strong> {{NOME_PROPRIEDADE}}</div>
      <div><strong>CAR:</strong> {{CAR_NUMERO}}</div>
      <div><strong>Município / UF:</strong> {{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}</div>
    </div>
  </div>

  <!-- II - TERMO DE DECLARAÇÃO -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      II - DECLARAÇÃO DE CONFORMIDADE DE BIOMA (AMAZÔNIA / PANTANAL)
    </div>
    <div style="padding: 10px 12px; font-size: 10.5px; line-height: 1.55; text-align: justify;">
      <p style="margin: 0 0 8px 0;">
        DECLARO perante o <strong>Banco do Brasil S.A.</strong> e órgãos reguladores que a área financiada na propriedade rural <strong>{{NOME_PROPRIEDADE}}</strong>, objeto do instrumento de crédito rural, encontra-se totalmente inserida em bioma permitido para exploração comercial financiada, NÃO estando localizada no Bioma Amazônia ou Bioma Pantanal, ou, se localizada, cumpre rigorosamente as restrições impostas pelo Conselho Monetário Nacional (CMN) e regulamentações do Banco Central do Brasil.
      </p>
    </div>
  </div>

  <!-- ASSINATURAS -->
  <div style="margin-top: 30px; text-align: center; font-size: 10px; page-break-inside: avoid;">
    <p style="margin-bottom: 25px;">{{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}, {{DATA_EXTENSO}}.</p>
    <div style="display: flex; justify-content: space-around; gap: 24px;">
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_PRODUTOR}}</strong><br />
          <span>{{PRODUCER_DOCUMENT_WITH_TYPE}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Proponente / Titular</span>
        </div>
      </div>
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_EMPRESA}}</strong><br />
          <span>{{CNPJ_EMPRESA}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Consultoria Técnica / Correspondente</span>
        </div>
      </div>
    </div>
  </div>
</div>
    `,
    schemaJson: {
      required: [
        { key: 'NOME_PRODUTOR', label: 'Nome do Produtor', source: 'Producer', field: 'name', type: 'string' },
        { key: 'DOCUMENTO_PRODUTOR', label: 'CPF/CNPJ do Produtor', source: 'Producer', field: 'document', type: 'string' },
        { key: 'NOME_PROPRIEDADE', label: 'Nome da Propriedade', source: 'Property', field: 'propertyName', type: 'string' },
        { key: 'CAR_NUMERO', label: 'CAR', source: 'Property', field: 'car', type: 'string' },
        { key: 'MUNICIPIO_IMOVEL', label: 'Município', source: 'Property', field: 'city', type: 'string' },
        { key: 'UF_IMOVEL', label: 'UF', source: 'Property', field: 'state', type: 'string' }
      ]
    }
  },
  {
    code: 'ENQUADRAMENTO_CAF',
    title: 'Enquadramento CAF / Pronaf',
    description: 'Formulário para verificação e enquadramento do produtor nos limites e requisitos do PRONAF.',
    contentHtml: `
<div style="font-family: Arial, Helvetica, sans-serif; padding: 20px 25px; line-height: 1.5; color: #1f2937; box-sizing: border-box; width: 100%;">
  {{{HEADER_OFICIAL}}}

  <!-- I - IDENTIFICAÇÃO DO PRODUTOR -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      I - IDENTIFICAÇÃO DO BENEFICIÁRIO & UNIDADE FAMILIAR
    </div>
    <div style="padding: 8px 12px; font-size: 10.5px; display: grid; grid-template-columns: 1.2fr 1fr; gap: 6px 14px; line-height: 1.35; background: #fafafa;">
      <div><strong>Beneficiário:</strong> {{NOME_PRODUTOR}}</div>
      <div><strong>Documento:</strong> {{PRODUCER_DOCUMENT_WITH_TYPE}}</div>
      <div><strong>Imóvel Rural:</strong> {{NOME_PROPRIEDADE}}</div>
      <div><strong>Área Total:</strong> {{AREA_HA}} hectares</div>
      <div><strong>Município / UF:</strong> {{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}</div>
    </div>
  </div>

  <!-- II - ENQUADRAMENTO -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      II - DECLARAÇÃO DE ENQUADRAMENTO NO PRONAF / CAF
    </div>
    <div style="padding: 10px 12px; font-size: 10.5px; line-height: 1.55; text-align: justify;">
      <p style="margin: 0 0 8px 0;">
        Declaro que possuo o <strong>Cadastro Nacional da Agricultura Familiar (CAF)</strong> ativo e regular, enquadrando-me nas condições de beneficiário do Programa Nacional de Fortalecimento da Agricultura Familiar (PRONAF), conforme normativos do Ministério do Desenvolvimento Agrário (MDA) e Manual de Crédito Rural (MCR).
      </p>
      <p style="margin: 0 0 6px 0;">
        A renda bruta familiar anual e a mão de obra empregada na exploração do estabelecimento rural observam rigorosamente os limites da categoria de enquadramento.
      </p>
    </div>
  </div>

  <!-- ASSINATURAS -->
  <div style="margin-top: 30px; text-align: center; font-size: 10px; page-break-inside: avoid;">
    <p style="margin-bottom: 25px;">{{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}, {{DATA_EXTENSO}}.</p>
    <div style="display: flex; justify-content: space-around; gap: 24px;">
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_PRODUTOR}}</strong><br />
          <span>{{PRODUCER_DOCUMENT_WITH_TYPE}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Agricultor(a) Familiar</span>
        </div>
      </div>
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_EMPRESA}}</strong><br />
          <span>{{CNPJ_EMPRESA}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Técnico Responsável / Elaborador</span>
        </div>
      </div>
    </div>
  </div>
</div>
    `,
    schemaJson: {
      required: [
        { key: 'NOME_PRODUTOR', label: 'Nome do Produtor', source: 'Producer', field: 'name', type: 'string' },
        { key: 'DOCUMENTO_PRODUTOR', label: 'CPF/CNPJ do Produtor', source: 'Producer', field: 'document', type: 'string' },
        { key: 'NOME_PROPRIEDADE', label: 'Nome da Propriedade', source: 'Property', field: 'propertyName', type: 'string' },
        { key: 'AREA_HA', label: 'Área Total (ha)', source: 'Property', field: 'totalArea', type: 'number' },
        { key: 'MUNICIPIO_IMOVEL', label: 'Município', source: 'Property', field: 'city', type: 'string' },
        { key: 'UF_IMOVEL', label: 'UF', source: 'Property', field: 'state', type: 'string' }
      ]
    }
  },
  {
    code: 'IDENTIFICACAO_ANIMAIS',
    title: 'Identificação de Animais em Garantia',
    description: 'Ficha para listagem, marcação e detalhamento do rebanho oferecido como garantia na operação.',
    contentHtml: `
<div style="font-family: Arial, Helvetica, sans-serif; padding: 20px 25px; line-height: 1.5; color: #1f2937; box-sizing: border-box; width: 100%;">
  {{{HEADER_OFICIAL}}}

  <!-- I - IDENTIFICAÇÃO DO PROPONENTE -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      I - IDENTIFICAÇÃO DO PROPRIETÁRIO & LOCALIZAÇÃO DO REBANHO
    </div>
    <div style="padding: 8px 12px; font-size: 10.5px; display: grid; grid-template-columns: 1.2fr 1fr; gap: 6px 14px; line-height: 1.35; background: #fafafa;">
      <div><strong>Proprietário:</strong> {{NOME_PRODUTOR}}</div>
      <div><strong>Documento:</strong> {{PRODUCER_DOCUMENT_WITH_TYPE}}</div>
      <div><strong>Propriedade de Criação:</strong> {{NOME_PROPRIEDADE}}</div>
      <div><strong>Município / UF:</strong> {{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}</div>
    </div>
  </div>

  <!-- II - DISCRIMINAÇÃO DOS ANIMAIS -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      II - DISCRIMINAÇÃO DOS SEMOVENTES EM GARANTIA (PENHOR PIGNORATÍCIO)
    </div>
    <div style="padding: 8px 12px; font-size: 10.5px; line-height: 1.4;">
      <p style="margin: 0 0 6px 0;">
        Declaro, para os devidos fins de constituição de garantia, que os animais relacionados abaixo pertencem ao proponente e encontram-se devidamente vacinados e registrados perante os órgãos de defesa sanitária animal:
      </p>
      {{{TABELA_SEMOVENTES}}}
    </div>
  </div>

  <!-- ASSINATURAS -->
  <div style="margin-top: 30px; text-align: center; font-size: 10px; page-break-inside: avoid;">
    <p style="margin-bottom: 25px;">{{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}, {{DATA_EXTENSO}}.</p>
    <div style="display: flex; justify-content: space-around; gap: 24px;">
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_PRODUTOR}}</strong><br />
          <span>{{PRODUCER_DOCUMENT_WITH_TYPE}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Proprietário / Financiado</span>
        </div>
      </div>
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_EMPRESA}}</strong><br />
          <span>{{CNPJ_EMPRESA}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Médico Veterinário / Responsável Técnico</span>
        </div>
      </div>
    </div>
  </div>
</div>
    `,
    schemaJson: {
      required: [
        { key: 'NOME_PRODUTOR', label: 'Nome do Produtor', source: 'Producer', field: 'name', type: 'string' },
        { key: 'DOCUMENTO_PRODUTOR', label: 'CPF/CNPJ do Produtor', source: 'Producer', field: 'document', type: 'string' },
        { key: 'NOME_PROPRIEDADE', label: 'Nome da Propriedade', source: 'Property', field: 'propertyName', type: 'string' },
        { key: 'MUNICIPIO_IMOVEL', label: 'Município', source: 'Property', field: 'city', type: 'string' },
        { key: 'UF_IMOVEL', label: 'UF', source: 'Property', field: 'state', type: 'string' }
      ]
    }
  },
  {
    code: 'MARCA_GADO',
    title: 'Identificação de Animais (Marca do Gado - Legado)',
    description: 'Declaração padrão para registro e averbação de marcação a fogo.',
    contentHtml: `
<div style="font-family: Arial, Helvetica, sans-serif; padding: 20px 25px; line-height: 1.5; color: #1f2937; box-sizing: border-box; width: 100%;">
  {{{HEADER_OFICIAL}}}

  <!-- I - IDENTIFICAÇÃO DO PROPONENTE -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      I - IDENTIFICAÇÃO DO PROPRIETÁRIO & REBANHO
    </div>
    <div style="padding: 8px 12px; font-size: 10.5px; display: grid; grid-template-columns: 1.2fr 1fr; gap: 6px 14px; line-height: 1.35; background: #fafafa;">
      <div><strong>Proprietário:</strong> {{NOME_PRODUTOR}}</div>
      <div><strong>Documento:</strong> {{PRODUCER_DOCUMENT_WITH_TYPE}}</div>
      <div><strong>Propriedade:</strong> {{NOME_PROPRIEDADE}}</div>
      <div><strong>Município / UF:</strong> {{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}</div>
    </div>
  </div>

  <!-- II - DISCRIMINAÇÃO DOS ANIMAIS -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      II - DISCRIMINAÇÃO DOS ANIMAIS E MARCAÇÃO
    </div>
    <div style="padding: 8px 12px; font-size: 10.5px; line-height: 1.4;">
      <p style="margin: 0 0 6px 0;">
        Declaro que o rebanho bovino pertencente à propriedade <strong>{{NOME_PROPRIEDADE}}</strong> encontra-se devidamente vacinado e identificado:
      </p>
      {{{TABELA_SEMOVENTES}}}
    </div>
  </div>

  <!-- ASSINATURAS -->
  <div style="margin-top: 30px; text-align: center; font-size: 10px; page-break-inside: avoid;">
    <p style="margin-bottom: 25px;">{{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}, {{DATA_EXTENSO}}.</p>
    <div style="display: flex; justify-content: space-around; gap: 24px;">
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_PRODUTOR}}</strong><br />
          <span>{{PRODUCER_DOCUMENT_WITH_TYPE}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Proprietário</span>
        </div>
      </div>
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_EMPRESA}}</strong><br />
          <span>{{CNPJ_EMPRESA}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Responsável Técnico</span>
        </div>
      </div>
    </div>
  </div>
</div>
    `,
    schemaJson: {
      required: [
        { key: 'NOME_PRODUTOR', label: 'Nome do Produtor', source: 'Producer', field: 'name', type: 'string' },
        { key: 'DOCUMENTO_PRODUTOR', label: 'CPF/CNPJ do Produtor', source: 'Producer', field: 'document', type: 'string' },
        { key: 'NOME_PROPRIEDADE', label: 'Nome da Propriedade', source: 'Property', field: 'propertyName', type: 'string' },
        { key: 'MUNICIPIO_IMOVEL', label: 'Município', source: 'Property', field: 'city', type: 'string' },
        { key: 'UF_IMOVEL', label: 'UF', source: 'Property', field: 'state', type: 'string' }
      ]
    }
  },
  {
    code: 'APASCENTAMENTO',
    title: 'Declaração de Capacidade de Apascentamento',
    description: 'Certifica a capacidade de suporte de pastagens para o rebanho declarado.',
    contentHtml: `
<div style="font-family: Arial, Helvetica, sans-serif; padding: 20px 25px; line-height: 1.5; color: #1f2937; box-sizing: border-box; width: 100%;">
  {{{HEADER_OFICIAL}}}

  <!-- I - IDENTIFICAÇÃO DA PROPRIEDADE -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      I - DADOS DA PROPRIEDADE E DA ÁREA DE PASTAGEM
    </div>
    <div style="padding: 8px 12px; font-size: 10.5px; display: grid; grid-template-columns: 1.2fr 1fr; gap: 6px 14px; line-height: 1.35; background: #fafafa;">
      <div><strong>Produtor:</strong> {{NOME_PRODUTOR}}</div>
      <div><strong>Documento:</strong> {{PRODUCER_DOCUMENT_WITH_TYPE}}</div>
      <div><strong>Propriedade:</strong> {{NOME_PROPRIEDADE}}</div>
      <div><strong>Área de Pastagem:</strong> {{AREA_PASTAGEM_HA}} hectares</div>
      <div><strong>Município / UF:</strong> {{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}</div>
    </div>
  </div>

  <!-- II - DIMENSIONAMENTO ZOOTÉCNICO -->
  <div style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
    <div style="background-color: {{COR_PRIMARIA}}; color: #ffffff; padding: 5px 12px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
      II - DIMENSIONAMENTO ZOOTÉCNICO & CAPACIDADE DE SUPORTE
    </div>
    <div style="padding: 10px 12px; font-size: 10.5px; line-height: 1.55; text-align: justify;">
      <p style="margin: 0 0 8px 0;">
        Declaro, para os devidos fins zootécnicos e de crédito rural, que a propriedade denominada <strong>{{NOME_PROPRIEDADE}}</strong> possui capacidade de apascentamento plenamente compatível com o rebanho de <strong>{{NUMERO_CABECAS}} cabeças</strong> (correspondente a <strong>{{UA_TOTAL}} Unidades Animais</strong>).
      </p>
      <p style="margin: 0 0 6px 0;">
        A taxa de lotação calculada é de <strong>{{TAXA_LOTACAO}} UA/ha</strong>, demonstrando sustentabilidade forrageira e manejo de pastagens adequado aos parâmetros técnicos regionais.
      </p>
    </div>
  </div>

  <!-- ASSINATURAS -->
  <div style="margin-top: 30px; text-align: center; font-size: 10px; page-break-inside: avoid;">
    <p style="margin-bottom: 25px;">{{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}, {{DATA_EXTENSO}}.</p>
    <div style="display: flex; justify-content: space-around; gap: 24px;">
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_PRODUTOR}}</strong><br />
          <span>{{PRODUCER_DOCUMENT_WITH_TYPE}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Produtor Rural</span>
        </div>
      </div>
      <div style="flex: 1; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 4px; margin: 0 10px;">
          <strong>{{NOME_EMPRESA}}</strong><br />
          <span>{{CNPJ_EMPRESA}}</span><br />
          <span style="font-size: 8.5px; color: #6b7280;">Responsável Técnico / Zootecnista</span>
        </div>
      </div>
    </div>
  </div>
</div>
    `,
    schemaJson: {
      required: [
        { key: 'NOME_PRODUTOR', label: 'Nome do Produtor', source: 'Producer', field: 'name', type: 'string' },
        { key: 'DOCUMENTO_PRODUTOR', label: 'CPF/CNPJ do Produtor', source: 'Producer', field: 'document', type: 'string' },
        { key: 'NOME_PROPRIEDADE', label: 'Nome da Propriedade', source: 'Property', field: 'propertyName', type: 'string' },
        { key: 'AREA_PASTAGEM_HA', label: 'Área de Pastagem (ha)', source: 'Property', field: 'pastureArea', type: 'number' },
        { key: 'NUMERO_CABECAS', label: 'Total de Cabeças', source: 'Property.livestock', field: 'totalHeadCount', type: 'number' },
        { key: 'UA_TOTAL', label: 'Total de UA', source: 'Calculated', field: 'totalUa', type: 'number', readonly: true },
        { key: 'TAXA_LOTACAO', label: 'Taxa de Lotação (UA/ha)', source: 'Calculated', field: 'stockingRate', type: 'number', readonly: true },
        { key: 'MUNICIPIO_IMOVEL', label: 'Município', source: 'Property', field: 'city', type: 'string' },
        { key: 'UF_IMOVEL', label: 'UF', source: 'Property', field: 'state', type: 'string' }
      ]
    }
  }
]

async function main() {
  const { default: prisma } = await import('../src/lib/prisma')
  console.log('Synchronizing Official Document Templates...')

  for (const template of templates) {
    await prisma.documentTemplate.upsert({
      where: { code: template.code },
      update: {
        title: template.title,
        description: template.description,
        contentHtml: template.contentHtml.trim(),
        schemaJson: template.schemaJson,
      },
      create: {
        code: template.code,
        title: template.title,
        description: template.description,
        contentHtml: template.contentHtml.trim(),
        schemaJson: template.schemaJson,
      },
    })
    console.log(`✅ Synced template: ${template.code} - ${template.title}`)
  }

  console.log(`\n🎉 All ${templates.length} document templates synchronized successfully.`)
}

main()
  .catch((e) => {
    console.error('❌ Error synchronizing templates:', e)
    process.exit(1)
  })
  .finally(async () => {
    const { default: prisma } = await import('../src/lib/prisma')
    await prisma.$disconnect()
  })
