import { z } from 'zod';
import {
  ProducerSize,
  PropertyClassification,
  ConservationState,
  SeizureStatus,
  CondominiumType,
  PropertyFinancialStatus
} from '@prisma/client';

/**
 * Zod Schema para o Delta Form.
 * O Delta Form é dinâmico, ou seja, apenas os campos que estão faltando 
 * no banco de dados serão exigidos na UI antes de emitir o documento.
 * 
 * Por isso, marcamos os campos como `.optional()` na tipagem global, 
 * mas aplicamos validações rigorosas (regex, max length, enums) 
 * caso eles sejam fornecidos no payload (bidirecionalidade).
 */
export const deltaFormSchema = z.object({
  // ==========================================
  // DADOS DO PRODUTOR (PF/PJ)
  // ==========================================
  bankName: z.string().min(2, "Nome do banco inválido").optional(),
  bankAgency: z.string().min(2, "Agência inválida").optional(),
  bankAccount: z.string().min(4, "Conta inválida").optional(),
  bankAccountType: z.enum(['CORRENTE', 'POUPANCA']).optional(),

  birthDate: z.coerce.date().optional(),
  naturalness: z.string().min(2).optional(),
  educationLevel: z.string().min(2).optional(),
  producerSize: z.nativeEnum(ProducerSize).optional(),

  spouseRg: z.string().min(5, "RG inválido").optional(),
  spouseRgIssuer: z.string().min(2).optional(),
  spouseNationality: z.string().min(2).optional(),
  spouseEducationLevel: z.string().min(2).optional(),

  addressStreet: z.string().min(3).optional(),
  addressNeighborhood: z.string().min(2).optional(),
  addressCity: z.string().min(2).optional(),
  addressState: z.string().length(2, "Use a sigla UF com 2 letras").optional(),
  addressZipcode: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido").optional(),

  // ==========================================
  // DADOS DA PROPRIEDADE
  // ==========================================
  consolidatedArea: z.coerce.number().min(0, "A área não pode ser negativa").optional(),
  classification: z.nativeEnum(PropertyClassification).optional(),
  ruralModules: z.coerce.number().min(0).optional(),
  
  neighborhood: z.string().min(2).optional(),
  comarca: z.string().min(2).optional(),
  accessRoute: z.string().optional(),

  isProven: z.boolean().optional(),
  hasLien: z.boolean().optional(),
  isBorderProperty: z.boolean().optional(),
  hasInsurance: z.boolean().optional(),

  seizureStatus: z.nativeEnum(SeizureStatus).optional(),
  financialStatus: z.nativeEnum(PropertyFinancialStatus).optional(),
  condominiumType: z.nativeEnum(CondominiumType).optional(),
  conservationState: z.nativeEnum(ConservationState).optional(),
});

export type DeltaFormPayload = z.infer<typeof deltaFormSchema>;
