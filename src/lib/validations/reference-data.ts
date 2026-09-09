// ============================================================================
// DADOS DE REFERÊNCIA E CATÁLOGOS BANCÁRIOS (BANCO DO BRASIL / SICREDI)
// ============================================================================

export const BB_IMPROVEMENTS_CATALOG = [
  { specification: 'Casa para sede alvenaria', unit: 'm²', suggestedValue: 1770 },
  { specification: 'Casa para sede madeira', unit: 'm²', suggestedValue: 1100 },
  { specification: 'Casa para funcionários alvenaria', unit: 'm²', suggestedValue: 1200 },
  { specification: 'Casa para funcionários madeira', unit: 'm²', suggestedValue: 800 },
  { specification: 'Alojamento alvenaria', unit: 'm²', suggestedValue: 950 },
  { specification: 'Refeitório alvenaria', unit: 'm²', suggestedValue: 1050 },
  { specification: 'Curral em cordoalha', unit: 'm linear', suggestedValue: 405 },
  { specification: 'Curral em madeira', unit: 'm linear', suggestedValue: 420 },
  { specification: 'Balança para curral', unit: 'unidade', suggestedValue: 18500 },
  { specification: 'Tronco / Brete / Seringa', unit: 'unidade', suggestedValue: 26000 },
  { specification: 'Cocho alvenaria', unit: 'm linear', suggestedValue: 210 },
  { specification: 'Cocho madeira coberto', unit: 'm linear', suggestedValue: 320 },
  { specification: 'Bebedouro australiano', unit: 'unidade', suggestedValue: 4500 },
  { specification: 'Reservatório de água', unit: 'm³', suggestedValue: 1050 },
  { specification: 'Poço Artesiano com bomba', unit: 'metros', suggestedValue: 350 },
  { specification: 'Açude / Barragem', unit: 'm³', suggestedValue: 45 },
  { specification: 'Cerca de arame liso (5 fios)', unit: 'km', suggestedValue: 20000 },
  { specification: 'Cerca de arame farpado (4 fios)', unit: 'km', suggestedValue: 21500 },
  { specification: 'Cerca elétrica', unit: 'km', suggestedValue: 9500 },
  { specification: 'Galpão estrutura metálica fechado', unit: 'm²', suggestedValue: 850 },
  { specification: 'Galpão estrutura metálica aberto', unit: 'm²', suggestedValue: 620 },
  { specification: 'Galpão alvenaria fechado', unit: 'm²', suggestedValue: 750 },
  { specification: 'Energia Solar Fotovoltaica conectada', unit: 'kWp', suggestedValue: 4200 },
  { specification: 'Silo metálico para grãos', unit: 'toneladas', suggestedValue: 480 },
  { specification: 'Armazém Graneleiro convencional', unit: 'm²', suggestedValue: 980 },
  { specification: 'Outros Melhoramentos', unit: 'unidade', suggestedValue: 1000 },
] as const

export const LIVESTOCK_CATEGORIES = [
  'Matrizes (Vacas)',
  'Touros (Reprodutores)',
  'Novilhas (2 a 3 Anos)',
  'Novilhos (2 a 3 Anos)',
  'Garrotas (1 a 2 Anos)',
  'Garrotes (1 a 2 Anos)',
  'Bezerras (0 a 1 Ano)',
  'Bezerros (0 a 1 Ano)',
  'Boi Gordo',
  'Animais de Serviço (Equinos/Muares)',
] as const

export const LIVESTOCK_BREEDS = [
  'Nelore',
  'Nelore Mocho',
  'Angus',
  'Senepol',
  'Brahman',
  'Tabapuã',
  'Brangus',
  'Braford',
  'Girolando',
  'Holandês',
  'Guzerá',
  'Gir Leiteiro',
  'Cruzamento Industrial',
  'Mestiço',
  'Outra Raça',
] as const

export const LIVESTOCK_PURPOSES = [
  'Cria',
  'Recria',
  'Engorda',
  'Ciclo Completo',
  'Produção de Leite',
  'Reprodução / Genética',
  'Trabalho / Lida',
] as const

export const MACHINERY_CATEGORIES = [
  'Trator de Pneus',
  'Colheitadeira de Grãos',
  'Plantadeira / Semeadeira',
  'Pulverizador Autopropelido',
  'Pulverizador de Barra (Arrasto)',
  'Caminhão Agrícola / Basculante',
  'Veículo Utilitário / Caminhonete',
  'Grade Aradora / Niveladora',
  'Carreta Agrícola',
  'Subsolador / Escarificador',
  'Distribuidor de Calcário e Fertilizantes',
  'Ensiladeira / Vagão Forrageiro',
  'Pá Carregadeira / Retroescavadeira',
  'Outros Implementos',
] as const

export const RURAL_ACTIVITIES = [
  'Pecuária de Cria',
  'Pecuária de Recria e Engorda',
  'Pecuária Leiteira',
  'Cultivo de Soja',
  'Cultivo de Milho',
  'Cultivo de Algodão',
  'Cultivo de Arroz',
  'Cultivo de Feijão',
  'Cultivo de Café',
  'Silvicultura',
  'Hortifrutigranjeiros',
  'Piscicultura',
  'Avicultura de Corte',
  'Avicultura de Postura',
  'Suinocultura',
] as const

export const PROPERTY_TYPES_DOCUMENT = [
  'Escritura Pública de Compra e Venda',
  'Título Definitivo de Domínio',
  'Escritura Pública de Doação',
  'Escritura Pública de Permuta',
  'Escritura Pública de Inventário e Partilha',
  'Formal de Partilha',
  'Sentença Judicial de Usucapião',
  'Declaração de Posse Mansa e Pacífica',
  'Contrato Particular de Compra e Venda',
  'Contrato de Arrendamento Rural',
  'Contrato de Comodato Rural',
  'Contrato de Parceria Agrícola',
] as const

export const IMPENHORABILIDADE_OPTIONS = [
  { value: 'PENHORAVEL', label: 'Penhorável (Sem Restrições)' },
  { value: 'IMPENHORAVEL_PEQUENA_PROP', label: 'Impenhorável - Pequena Propriedade Rural (CF art. 5º)' },
  { value: 'IMPENHORAVEL_BEM_FAMILIA', label: 'Impenhorável - Residência / Bem de Família (Lei 8.009)' },
  { value: 'IMPENHORAVEL_OUTROS', label: 'Impenhorável - Outros Motivos Legais' },
] as const

export const CONSERVATION_STATES = [
  { value: 'NOVO', label: 'Novo / Recém Construído' },
  { value: 'OTIMO', label: 'Ótimo' },
  { value: 'BOM', label: 'Bom' },
  { value: 'REGULAR', label: 'Regular' },
  { value: 'RUIM', label: 'Ruim' },
  { value: 'ABANDONADO', label: 'Abandonado' },
  { value: 'SEM_VISTORIA', label: 'Sem Vistoria Recente' },
] as const

export const IMPROVEMENT_UNITS = [
  'm²',
  'm linear',
  'unidade',
  'm³',
  'km',
  'ha',
  'metros',
  'kWp',
  'toneladas',
  'conjunto',
  'cabeça',
  'saca',
  'litros',
] as const

export const LIVESTOCK_MARKINGS = [
  'Ferro Quente',
  'Brinco Visual',
  'Brinco Eletrônico (RFID)',
  'Tatuagem',
  'Microchip / Transponder',
  'Mossa / Pique na Orelha',
  'Sem Marcação',
  'Outro',
] as const

export const LIVESTOCK_MARKING_LOCATIONS = [
  'Perna Traseira Direita',
  'Perna Traseira Esquerda',
  'Paleta Direita',
  'Paleta Esquerda',
  'Costela Direita',
  'Costela Esquerda',
  'Orelha Direita',
  'Orelha Esquerda',
  'Pescoço / Barbela',
  'Dorso',
  'Flanco Direito',
  'Flanco Esquerdo',
  'Não Aplicável',
] as const

export const BRAZILIAN_STATES = [
  { value: 'AC', label: 'AC - Acre' },
  { value: 'AL', label: 'AL - Alagoas' },
  { value: 'AP', label: 'AP - Amapá' },
  { value: 'AM', label: 'AM - Amazonas' },
  { value: 'BA', label: 'BA - Bahia' },
  { value: 'CE', label: 'CE - Ceará' },
  { value: 'DF', label: 'DF - Distrito Federal' },
  { value: 'ES', label: 'ES - Espírito Santo' },
  { value: 'GO', label: 'GO - Goiás' },
  { value: 'MA', label: 'MA - Maranhão' },
  { value: 'MT', label: 'MT - Mato Grosso' },
  { value: 'MS', label: 'MS - Mato Grosso do Sul' },
  { value: 'MG', label: 'MG - Minas Gerais' },
  { value: 'PA', label: 'PA - Pará' },
  { value: 'PB', label: 'PB - Paraíba' },
  { value: 'PR', label: 'PR - Paraná' },
  { value: 'PE', label: 'PE - Pernambuco' },
  { value: 'PI', label: 'PI - Piauí' },
  { value: 'RJ', label: 'RJ - Rio de Janeiro' },
  { value: 'RN', label: 'RN - Rio Grande do Norte' },
  { value: 'RS', label: 'RS - Rio Grande do Sul' },
  { value: 'RO', label: 'RO - Rondônia' },
  { value: 'RR', label: 'RR - Roraima' },
  { value: 'SC', label: 'SC - Santa Catarina' },
  { value: 'SP', label: 'SP - São Paulo' },
  { value: 'SE', label: 'SE - Sergipe' },
  { value: 'TO', label: 'TO - Tocantins' },
] as const

export const MODULE_FINANCIAL_SUMMARY = 'FINANCIAL_SUMMARY' as const

