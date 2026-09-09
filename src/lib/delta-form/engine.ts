/**
 * Engine responsável por cruzar as necessidades de um Template de Documento (BB)
 * com os dados persistidos no banco de dados para a Propriedade e o Produtor.
 * Retorna uma lista estrita do que está faltando, que alimentará o "Delta Form" na UI.
 */

export interface MissingFieldDefinition {
  fieldName: string;      // Nome da variável, ex: 'producerSize'
  label: string;          // Label para a UI, ex: 'Porte do Produtor'
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  options?: string[];     // Caso seja um Enum (Select)
  entity: 'Producer' | 'Property';
}

/**
 * Mapeamento global de como o Delta Form deve renderizar cada campo faltante
 */
export const DELTA_FIELD_REGISTRY: Record<string, Omit<MissingFieldDefinition, 'fieldName'>> = {
  // PRODUTOR
  bankName: { label: 'Nome do Banco', type: 'text', entity: 'Producer' },
  bankAgency: { label: 'Agência Bancária', type: 'text', entity: 'Producer' },
  bankAccount: { label: 'Conta Bancária', type: 'text', entity: 'Producer' },
  bankAccountType: { label: 'Tipo de Conta', type: 'select', options: ['CORRENTE', 'POUPANCA'], entity: 'Producer' },
  birthDate: { label: 'Data de Nascimento', type: 'date', entity: 'Producer' },
  naturalness: { label: 'Naturalidade', type: 'text', entity: 'Producer' },
  educationLevel: { label: 'Grau de Escolaridade', type: 'text', entity: 'Producer' },
  producerSize: { label: 'Porte do Produtor', type: 'select', options: ['PEQUENO', 'MEDIO', 'GRANDE'], entity: 'Producer' },
  spouseRg: { label: 'RG do Cônjuge', type: 'text', entity: 'Producer' },
  spouseRgIssuer: { label: 'Órgão Emissor do RG (Cônjuge)', type: 'text', entity: 'Producer' },
  spouseNationality: { label: 'Nacionalidade do Cônjuge', type: 'text', entity: 'Producer' },
  spouseEducationLevel: { label: 'Escolaridade do Cônjuge', type: 'text', entity: 'Producer' },
  addressStreet: { label: 'Endereço (Rua)', type: 'text', entity: 'Producer' },
  addressNeighborhood: { label: 'Bairro', type: 'text', entity: 'Producer' },
  addressCity: { label: 'Cidade', type: 'text', entity: 'Producer' },
  addressState: { label: 'UF', type: 'text', entity: 'Producer' },
  addressZipcode: { label: 'CEP', type: 'text', entity: 'Producer' },
  
  // PROPRIEDADE
  consolidatedArea: { label: 'Área Consolidada (ha)', type: 'number', entity: 'Property' },
  classification: { label: 'Classificação da Propriedade', type: 'select', options: ['MINIFUNDIO', 'PEQUENA_PROPRIEDADE', 'MEDIA_PROPRIEDADE', 'GRANDE_PROPRIEDADE'], entity: 'Property' },
  ruralModules: { label: 'Módulos Rurais', type: 'number', entity: 'Property' },
  neighborhood: { label: 'Bairro/Distrito (Propriedade)', type: 'text', entity: 'Property' },
  comarca: { label: 'Comarca', type: 'text', entity: 'Property' },
  accessRoute: { label: 'Roteiro de Acesso', type: 'text', entity: 'Property' },
  isProven: { label: 'Bem Comprovado?', type: 'boolean', entity: 'Property' },
  hasLien: { label: 'Possui Gravame?', type: 'boolean', entity: 'Property' },
  isBorderProperty: { label: 'Faz Fronteira?', type: 'boolean', entity: 'Property' },
  hasInsurance: { label: 'Possui Seguro?', type: 'boolean', entity: 'Property' },
  seizureStatus: { label: 'Status de Penhora', type: 'select', options: ['PENHORAVEL', 'IMPENHORAVEL_PEQUENA_PROP', 'IMPENHORAVEL_BEM_FAMILIA', 'IMPENHORAVEL_OUTROS'], entity: 'Property' },
  financialStatus: { label: 'Status Financeiro', type: 'select', options: ['FINANCIADA', 'QUITADA'], entity: 'Property' },
  condominiumType: { label: 'Tipo de Condomínio', type: 'select', options: ['INEXISTENTE', 'PRO_DIVISO', 'PRO_INDIVISO', 'BEM_COMUM_CASAL'], entity: 'Property' },
  conservationState: { label: 'Estado de Conservação', type: 'select', options: ['RUIM', 'REGULAR', 'BOM', 'OTIMO', 'SEM_VISTORIA', 'ABANDONADO', 'NOVO', 'USADO'], entity: 'Property' }
};

/**
 * Avalia os dados da entidade e retorna um array com a definição 
 * de UI para cada campo que estiver vazio/nulo.
 * 
 * @param requiredFields Array de chaves necessárias (e.g. ['bankName', 'birthDate', 'ruralModules'])
 * @param producerData Ojeto com os dados atuais do produtor no DB
 * @param propertyData Ojeto com os dados atuais da propriedade no DB (Opcional dependendo do doc)
 */
export function computeMissingFields(
  requiredFields: string[], 
  producerData: Record<string, any>, 
  propertyData?: Record<string, any>
): MissingFieldDefinition[] {
  const missing: MissingFieldDefinition[] = [];

  for (const field of requiredFields) {
    const config = DELTA_FIELD_REGISTRY[field];
    if (!config) continue; // Ignora se não mapeado no registry

    const entityData = config.entity === 'Producer' ? producerData : (propertyData || {});
    
    const value = entityData[field];

    // Se o valor é nulo, undefined, ou string vazia, adiciona na lista de missing
    if (value === null || value === undefined || value === '') {
      missing.push({
        fieldName: field,
        ...config
      });
    }
  }

  return missing;
}
