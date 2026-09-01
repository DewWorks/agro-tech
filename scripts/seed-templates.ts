import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

const templates = [
  {
    code: 'POSSE_MANSA',
    title: 'Declaração de Posse Mansa e Pacífica',
    description: 'Atesta a posse contínua e sem contestação do imóvel rural pelo produtor.',
    contentHtml: `
      <div style="font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6;">
        <h2 style="text-align: center; text-transform: uppercase; margin-bottom: 40px;">DECLARAÇÃO DE POSSE MANSA E PACÍFICA</h2>
        
        <p style="text-align: justify; font-size: 16px;">
          Declaro, sob as penas da lei, que <strong>{{NOME_PRODUTOR}}</strong>, inscrito(a) no CPF sob o nº {{CPF_PRODUTOR}}, 
          exerce posse mansa e pacífica, contínua e sem oposição, sobre o imóvel rural denominado <strong>{{NOME_PROPRIEDADE}}</strong>, 
          com matrícula nº {{MATRICULA}}, registrado no cartório {{CARTORIO_REGISTRO}}, com área de {{AREA_HA}} hectares, 
          localizado no município de {{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}, há pelo menos {{TEMPO_POSSE_ANOS}} anos.
        </p>
        
        <p style="text-align: justify; font-size: 16px; margin-top: 20px;">
          Por ser verdade, firmo a presente declaração.
        </p>

        <div style="margin-top: 80px; text-align: center;">
          <p>{{MUNICIPIO_IMOVEL}}, {{DATA_EXTENSO}}.</p>
          <br/><br/><br/>
          <hr style="width: 60%; margin: 0 auto; border: 1px solid #000;" />
          <p style="margin-top: 10px;"><strong>{{NOME_PRODUTOR}}</strong></p>
          <p>CPF: {{CPF_PRODUTOR}}</p>
        </div>
      </div>
    `,
    schemaJson: {
      required: [
        { key: 'NOME_PRODUTOR', label: 'Nome do Produtor', source: 'Producer', field: 'name', type: 'string' },
        { key: 'CPF_PRODUTOR', label: 'CPF do Produtor', source: 'Producer', field: 'document', type: 'string' },
        { key: 'NOME_PROPRIEDADE', label: 'Nome da Propriedade', source: 'Property', field: 'propertyName', type: 'string' },
        { key: 'MATRICULA', label: 'Matrícula', source: 'Property', field: 'registrationNumber', type: 'string' },
        { key: 'CARTORIO_REGISTRO', label: 'Cartório', source: 'Property', field: 'registryOffice', type: 'string' },
        { key: 'AREA_HA', label: 'Área Total (ha)', source: 'Property', field: 'totalArea', type: 'number' },
        { key: 'MUNICIPIO_IMOVEL', label: 'Município', source: 'Property', field: 'city', type: 'string' },
        { key: 'UF_IMOVEL', label: 'UF', source: 'Property', field: 'state', type: 'string' },
        { key: 'TEMPO_POSSE_ANOS', label: 'Tempo de Posse (Anos)', source: 'Property.possessionData', field: 'possessionYears', type: 'number' }
      ]
    }
  },
  {
    code: 'APASCENTAMENTO',
    title: 'Declaração de Capacidade de Apascentamento',
    description: 'Certifica a capacidade de suporte de pastagens para o rebanho declarado.',
    contentHtml: `
      <div style="font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6;">
        <h2 style="text-align: center; text-transform: uppercase; margin-bottom: 40px;">DECLARAÇÃO DE CAPACIDADE DE APASCENTAMENTO</h2>
        
        <p style="text-align: justify; font-size: 16px;">
          Declaro, para os devidos fins, que a propriedade denominada <strong>{{NOME_PROPRIEDADE}}</strong>, 
          situada no município de {{MUNICIPIO_IMOVEL}} - {{UF_IMOVEL}}, de titularidade de <strong>{{NOME_PRODUTOR}}</strong> (CPF: {{CPF_PRODUTOR}}), 
          possui uma área destinada a pastagem de {{AREA_PASTAGEM_HA}} hectares.
        </p>

        <p style="text-align: justify; font-size: 16px; margin-top: 20px;">
          A propriedade comporta a capacidade de apascentamento compatível com o rebanho de {{NUMERO_CABECAS}} cabeças ({{UA_TOTAL}} Unidades Animais), 
          resultando numa taxa de lotação de {{TAXA_LOTACAO}} UA/ha, conforme dimensionamento zootécnico e levantamento técnico realizado.
        </p>

        <div style="margin-top: 80px; text-align: center;">
          <p>{{MUNICIPIO_IMOVEL}}, {{DATA_EXTENSO}}.</p>
          <br/><br/><br/>
          <hr style="width: 60%; margin: 0 auto; border: 1px solid #000;" />
          <p style="margin-top: 10px;"><strong>{{NOME_PRODUTOR}}</strong></p>
          <p>CPF: {{CPF_PRODUTOR}}</p>
        </div>
      </div>
    `,
    schemaJson: {
      required: [
        { key: 'NOME_PRODUTOR', label: 'Nome do Produtor', source: 'Producer', field: 'name', type: 'string' },
        { key: 'CPF_PRODUTOR', label: 'CPF do Produtor', source: 'Producer', field: 'document', type: 'string' },
        { key: 'NOME_PROPRIEDADE', label: 'Nome da Propriedade', source: 'Property', field: 'propertyName', type: 'string' },
        { key: 'MUNICIPIO_IMOVEL', label: 'Município', source: 'Property', field: 'city', type: 'string' },
        { key: 'UF_IMOVEL', label: 'UF', source: 'Property', field: 'state', type: 'string' },
        { key: 'AREA_PASTAGEM_HA', label: 'Área de Pastagem (ha)', source: 'Property', field: 'pastureArea', type: 'number' },
        { key: 'NUMERO_CABECAS', label: 'Total de Cabeças', source: 'Property.livestock', field: 'totalHeadCount', type: 'number' },
        { key: 'UA_TOTAL', label: 'Total de UA', source: 'Calculated', field: 'totalUa', type: 'number', readonly: true },
        { key: 'TAXA_LOTACAO', label: 'Taxa de Lotação (UA/ha)', source: 'Calculated', field: 'stockingRate', type: 'number', readonly: true }
      ]
    }
  },
  {
    code: 'DISPENSA_AMBIENTAL',
    title: 'Dispensa de Licenciamento Ambiental / Outorga',
    description: 'Declaração padrão para enquadramento de isenção junto aos órgãos ambientais.',
    contentHtml: `
      <div style="font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6;">
        <h2 style="text-align: center; text-transform: uppercase; margin-bottom: 40px;">DECLARAÇÃO DE DISPENSA DE LICENCIAMENTO AMBIENTAL</h2>
        
        <p style="text-align: justify; font-size: 16px;">
          Eu, <strong>{{NOME_PRODUTOR}}</strong>, inscrito(a) no CPF sob o nº {{CPF_PRODUTOR}} e RG nº {{RG_PRODUTOR}}, 
          declaro perante aos órgãos competentes que as atividades exploradas na propriedade rural denominada <strong>{{NOME_PROPRIEDADE}}</strong>, 
          registrada sob a matrícula nº {{MATRICULA}} e número de CAR {{CAR_NUMERO}}, localizada no município de {{MUNICIPIO_IMOVEL}}, 
          enquadram-se nas normativas de dispensa de licenciamento ambiental e outorga do direito de uso de recursos hídricos.
        </p>

        <p style="text-align: justify; font-size: 16px; margin-top: 20px;">
          A atividade atualmente explorada é: <strong>{{ATIVIDADE_EXPLORADA}}</strong>, compreendendo uma área utilizada de {{AREA_UTILIZADA_HA}} hectares,
          não possuindo intervenção em Áreas de Preservação Permanente (APP) ou Reserva Legal em desconformidade com a legislação ambiental vigente.
        </p>

        <div style="margin-top: 80px; text-align: center;">
          <p>{{MUNICIPIO_IMOVEL}}, {{DATA_EXTENSO}}.</p>
          <br/><br/><br/>
          <hr style="width: 60%; margin: 0 auto; border: 1px solid #000;" />
          <p style="margin-top: 10px;"><strong>{{NOME_PRODUTOR}}</strong></p>
        </div>
      </div>
    `,
    schemaJson: {
      required: [
        { key: 'NOME_PRODUTOR', label: 'Nome do Produtor', source: 'Producer', field: 'name', type: 'string' },
        { key: 'CPF_PRODUTOR', label: 'CPF do Produtor', source: 'Producer', field: 'document', type: 'string' },
        { key: 'RG_PRODUTOR', label: 'RG do Produtor', source: 'Producer', field: 'rg', type: 'string' },
        { key: 'NOME_PROPRIEDADE', label: 'Nome da Propriedade', source: 'Property', field: 'propertyName', type: 'string' },
        { key: 'MATRICULA', label: 'Matrícula', source: 'Property', field: 'registrationNumber', type: 'string' },
        { key: 'CAR_NUMERO', label: 'Número do CAR', source: 'Property', field: 'car', type: 'string' },
        { key: 'ATIVIDADE_EXPLORADA', label: 'Atividade Explorada', source: 'Property', field: 'explorationActivity', type: 'string' }, // New dynamic field or we store in possessionData
        { key: 'AREA_UTILIZADA_HA', label: 'Área Utilizada (ha)', source: 'Property', field: 'productiveArea', type: 'number' },
        { key: 'MUNICIPIO_IMOVEL', label: 'Município', source: 'Property', field: 'city', type: 'string' }
      ]
    }
  },
  {
    code: 'MARCA_GADO',
    title: 'Identificação de Animais (Marca do Gado)',
    description: 'Declaração padrão para registro e averbação de marcação a fogo (ADAPEC/Penhor).',
    contentHtml: `
      <div style="font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6;">
        <h2 style="text-align: center; text-transform: uppercase; margin-bottom: 40px;">DECLARAÇÃO DE IDENTIFICAÇÃO DE ANIMAIS (MARCA DE GADO)</h2>
        
        <p style="text-align: justify; font-size: 16px;">
          Eu, <strong>{{NOME_PRODUTOR}}</strong>, inscrito(a) no CPF sob o nº {{CPF_PRODUTOR}}, 
          declaro para fins de controle zootécnico e possível constituição de garantias (penhor pignoratício), 
          que o rebanho bovino pertencente à propriedade <strong>{{NOME_PROPRIEDADE}}</strong>, 
          atualmente constituído por {{QUANTIDADE_ANIMAIS}} cabeças, é marcado da seguinte forma:
        </p>

        <ul style="font-size: 16px; line-height: 1.8; margin-top: 20px;">
          <li><strong>Descrição Visual da Marca:</strong> {{DESCRICAO_MARCA}}</li>
          <li><strong>Registro ADAPEC:</strong> {{REGISTRO_ADAPEC}}</li>
          <li><strong>Localização no Corpo do Animal:</strong> {{LOCALIZACAO_MARCA_CORPO}}</li>
        </ul>

        <div style="margin-top: 80px; text-align: center;">
          <p>{{DATA_EXTENSO}}.</p>
          <br/><br/><br/>
          <hr style="width: 60%; margin: 0 auto; border: 1px solid #000;" />
          <p style="margin-top: 10px;"><strong>{{NOME_PRODUTOR}}</strong></p>
        </div>
      </div>
    `,
    schemaJson: {
      required: [
        { key: 'NOME_PRODUTOR', label: 'Nome do Produtor', source: 'Producer', field: 'name', type: 'string' },
        { key: 'CPF_PRODUTOR', label: 'CPF do Produtor', source: 'Producer', field: 'document', type: 'string' },
        { key: 'NOME_PROPRIEDADE', label: 'Nome da Propriedade', source: 'Property', field: 'propertyName', type: 'string' },
        { key: 'QUANTIDADE_ANIMAIS', label: 'Quantidade de Animais', source: 'Property.livestock', field: 'totalHeadCount', type: 'number' },
        { key: 'DESCRICAO_MARCA', label: 'Descrição da Marca', source: 'Property.livestock', field: 'brandDescription', type: 'string' },
        { key: 'REGISTRO_ADAPEC', label: 'Registro ADAPEC', source: 'Property.livestock', field: 'brandRegistrationAdapec', type: 'string' },
        { key: 'LOCALIZACAO_MARCA_CORPO', label: 'Localização da Marca (Ex: Perna Esq.)', source: 'Property.livestock', field: 'brandLocation', type: 'string' }
      ]
    }
  }
]

async function main() {
  const { default: prisma } = await import('../src/lib/prisma')
  console.log('Seeding Document Templates...')
  
  for (const template of templates) {
    await prisma.documentTemplate.upsert({
      where: { code: template.code },
      update: {
        title: template.title,
        description: template.description,
        contentHtml: template.contentHtml,
        schemaJson: template.schemaJson,
      },
      create: {
        code: template.code,
        title: template.title,
        description: template.description,
        contentHtml: template.contentHtml,
        schemaJson: template.schemaJson,
      },
    })
    console.log(`- Seeded template: ${template.code}`)
  }
  
  console.log('✅ Document Templates seeded successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

