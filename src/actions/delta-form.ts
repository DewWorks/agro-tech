'use server';

import prisma from '@/lib/prisma';
import { deltaFormSchema, DeltaFormPayload } from '@/lib/validations/delta-form';

export async function submitDeltaForm(
  branchId: string,
  userId: string,
  producerId: string,
  templateCode: string,
  payload: DeltaFormPayload,
  propertyId?: string
) {
  // 1. Validar payload com Zod Rigoroso
  const parsedData = deltaFormSchema.safeParse(payload);

  if (!parsedData.success) {
    throw new Error('Falha na validação do Delta Form: Dados inconsistentes.');
  }

  const validData = parsedData.data;

  // Separa o payload entre Producer e Property para a atualização bidirecional
  const producerUpdateData: Record<string, any> = {};
  const propertyUpdateData: Record<string, any> = {};

  // Mapeamento simples de chaves para seus respectivos destinos
  const producerKeys = [
    'bankName', 'bankAgency', 'bankAccount', 'bankAccountType',
    'birthDate', 'naturalness', 'educationLevel', 'producerSize',
    'spouseRg', 'spouseRgIssuer', 'spouseNationality', 'spouseEducationLevel',
    'addressStreet', 'addressNeighborhood', 'addressCity', 'addressState', 'addressZipcode'
  ];

  for (const [key, value] of Object.entries(validData)) {
    if (value !== undefined) {
      if (producerKeys.includes(key)) {
        producerUpdateData[key] = value;
      } else {
        propertyUpdateData[key] = value;
      }
    }
  }

  // 2. Transação Atômica e Resiliência
  try {
    const result = await prisma.$transaction(async (tx) => {
      
      // Atualiza o Produtor (se houver dados)
      if (Object.keys(producerUpdateData).length > 0) {
        await tx.producer.update({
          where: { id: producerId },
          data: {
            ...producerUpdateData,
            updatedBy: userId, // 🔒 Auditoria: Registro do usuário logado que alterou
          }
        });
      }

      // Atualiza a Propriedade (se houver propertyId e dados)
      if (propertyId && Object.keys(propertyUpdateData).length > 0) {
        await tx.property.update({
          where: { id: propertyId },
          data: {
            ...propertyUpdateData,
            updatedBy: userId, // 🔒 Auditoria
          }
        });
      }

      // 3. Registra a emissão do Documento (Histórico e Consumo de Franquia)
      const generatedForm = await tx.generatedForm.create({
        data: {
          branchId,
          producerId,
          propertyId,
          templateCode,
          templateVersion: 1, // Pode ser dinâmico no futuro
          payloadSnapshot: validData, // O payload capturado na hora da emissão
          // storagePdfPath e sha256Hash serão preenchidos posteriormente pelo worker 
          // ou logo em seguida quando o PDF for gerado e subido pro Supabase Storage.
        }
      });

      return generatedForm;
    });

    return { success: true, generatedFormId: result.id };
  } catch (error) {
    // 🔒 Resiliência: Rollback atômico ocorre automaticamente se falhar
    console.error('Erro na transação atômica do Delta Form:', error);
    throw new Error('Falha ao processar o formulário. O sistema reverteu a transação por segurança.');
  }
}
