'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { handleServerError } from '@/lib/errorHandler'
import { getUserContext } from '@/lib/auth'
import {
  createDemandSchema,
  updateDemandSchema,
  updateDemandStatusSchema,
  calculateSlaInfo,
  RURAL_SERVICES_CATALOG,
  RuralServiceTypeCode,
  DemandStatusCode,
} from '@/lib/validations/demands'

export interface DemandFilters {
  branchId?: string
  producerId?: string
  propertyId?: string
  status?: DemandStatusCode
  serviceType?: RuralServiceTypeCode
  search?: string
}

/**
 * Lista demandas com filtros dinâmicos, contadores consolidados e cálculo de SLA.
 */
export async function getDemands(filters: DemandFilters = {}) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) {
      throw new Error('Usuário não autenticado.')
    }

    const where: any = {}

    // Isolamento multi-tenant por filial
    if (filters.branchId) {
      where.branchId = filters.branchId
    } else if (dbUser.branchId && dbUser.role !== 'SUPER_ADMIN' && !dbUser.isSuperAdminImpersonating) {
      where.branchId = dbUser.branchId
    }

    if (filters.producerId) {
      where.producerId = filters.producerId
    }

    if (filters.propertyId) {
      where.propertyId = filters.propertyId
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.serviceType) {
      where.serviceType = filters.serviceType
    }

    if (filters.search && filters.search.trim() !== '') {
      const term = filters.search.trim()
      where.OR = [
        { producer: { name: { contains: term, mode: 'insensitive' } } },
        { producer: { document: { contains: term } } },
        { property: { name: { contains: term, mode: 'insensitive' } } },
        { description: { contains: term, mode: 'insensitive' } },
        { responsibleName: { contains: term, mode: 'insensitive' } },
      ]
    }

    const demands = await prisma.serviceDemand.findMany({
      where,
      include: {
        producer: {
          select: {
            id: true,
            name: true,
            document: true,
            phone: true,
            email: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            propertyName: true,
            city: true,
            state: true,
            registrationNumber: true,
            car: true,
          },
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        checklistItems: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [
        { status: 'asc' },
        { estimatedDeliveryDate: 'asc' },
        { requestDate: 'desc' },
      ],
    })

    // Adiciona cálculos de SLA e progresso de documentação
    const enrichedDemands = demands.map((demand) => {
      const sla = calculateSlaInfo(
        demand.estimatedDeliveryDate,
        demand.completionDate,
        demand.status as DemandStatusCode
      )

      const totalDocs = demand.checklistItems.length
      const deliveredDocs = demand.checklistItems.filter((i) => i.isDelivered).length
      const pendingDocs = totalDocs - deliveredDocs

      return {
        ...demand,
        sla,
        checklistSummary: {
          total: totalDocs,
          delivered: deliveredDocs,
          pending: pendingDocs,
          percentage: totalDocs > 0 ? Math.round((deliveredDocs / totalDocs) * 100) : 100,
        },
      }
    })

    // Contadores de status para o cabeçalho / Kanban
    const counters = {
      total: enrichedDemands.length,
      solicitado: enrichedDemands.filter((d) => d.status === 'SOLICITADO').length,
      emExecucao: enrichedDemands.filter((d) => d.status === 'EM_EXECUCAO').length,
      aguardandoDocumentacao: enrichedDemands.filter((d) => d.status === 'AGUARDANDO_DOCUMENTACAO').length,
      concluido: enrichedDemands.filter((d) => d.status === 'CONCLUIDO').length,
      cancelado: enrichedDemands.filter((d) => d.status === 'CANCELADO').length,
      atrasadas: enrichedDemands.filter((d) => d.sla.status === 'ATRASADO').length,
    }

    return {
      success: true,
      demands: enrichedDemands,
      counters,
    }
  } catch (error) {
    return handleServerError(error, 'Erro ao listar demandas')
  }
}

/**
 * Busca uma demanda específica por ID com todos os relacionamentos e checklist.
 */
export async function getDemandById(id: string) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) {
      throw new Error('Usuário não autenticado.')
    }

    const demand = await prisma.serviceDemand.findUnique({
      where: { id },
      include: {
        producer: true,
        property: true,
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        checklistItems: {
          include: {
            document: {
              select: {
                id: true,
                fileName: true,
                storagePath: true,
                complianceStatus: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!demand) {
      throw new Error('Demanda não encontrada.')
    }

    const sla = calculateSlaInfo(
      demand.estimatedDeliveryDate,
      demand.completionDate,
      demand.status as DemandStatusCode
    )

    const totalDocs = demand.checklistItems.length
    const deliveredDocs = demand.checklistItems.filter((i) => i.isDelivered).length
    const pendingDocs = totalDocs - deliveredDocs

    return {
      success: true,
      demand: {
        ...demand,
        sla,
        checklistSummary: {
          total: totalDocs,
          delivered: deliveredDocs,
          pending: pendingDocs,
          percentage: totalDocs > 0 ? Math.round((deliveredDocs / totalDocs) * 100) : 100,
        },
      },
    }
  } catch (error) {
    return handleServerError(error, 'Erro ao carregar demanda')
  }
}

/**
 * Cria uma nova Demanda / Ordem de Serviço Rural com checklist opcional ou sugerido.
 */
export async function createDemand(rawData: any) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) {
      throw new Error('Usuário não autenticado.')
    }

    const parsed = createDemandSchema.parse(rawData)

    const branchId = parsed.branchId || dbUser.branchId
    if (!branchId) {
      throw new Error('Filial não especificada para a demanda.')
    }

    // Se checklist não foi fornecido explicitamente, carrega os documentos sugeridos do catálogo
    let initialChecklist = parsed.checklist || []
    if (initialChecklist.length === 0 && parsed.serviceType && RURAL_SERVICES_CATALOG[parsed.serviceType]) {
      const suggestedDocs = RURAL_SERVICES_CATALOG[parsed.serviceType].defaultDocuments
      initialChecklist = suggestedDocs.map((docTitle) => ({
        title: docTitle,
        isRequired: true,
        isDelivered: false,
      }))
    }

    const result = await prisma.$transaction(async (tx) => {
      const demand = await tx.serviceDemand.create({
        data: {
          branchId,
          producerId: parsed.producerId,
          propertyId: parsed.propertyId || null,
          assigneeId: parsed.assigneeId || null,
          responsibleName: parsed.responsibleName || null,
          serviceType: parsed.serviceType,
          customServiceType: parsed.customServiceType || null,
          status: parsed.status || 'SOLICITADO',
          priority: parsed.priority || 'MEDIA',
          description: parsed.description || null,
          notes: parsed.notes || null,
          requestDate: parsed.requestDate,
          startDate: parsed.startDate || (parsed.status === 'EM_EXECUCAO' ? new Date() : null),
          estimatedDeliveryDate: parsed.estimatedDeliveryDate || null,
          completionDate: parsed.completionDate || (parsed.status === 'CONCLUIDO' ? new Date() : null),
        },
      })

      if (initialChecklist.length > 0) {
        await tx.demandChecklistItem.createMany({
          data: initialChecklist.map((item) => ({
            demandId: demand.id,
            title: item.title,
            documentType: (item.documentType as any) || null,
            documentId: item.documentId || null,
            isRequired: item.isRequired ?? true,
            isDelivered: Boolean(item.isDelivered),
            deliveredAt: item.isDelivered ? new Date() : null,
            notes: item.notes || null,
          })),
        })
      }

      return demand
    })

    revalidatePath('/admin/demands')
    revalidatePath(`/admin/crm/${parsed.producerId}`)
    if (parsed.propertyId) {
      revalidatePath(`/admin/crm/properties/${parsed.propertyId}`)
    }

    return {
      success: true,
      demand: result,
    }
  } catch (error) {
    return handleServerError(error, 'Erro ao criar demanda de serviço')
  }
}

/**
 * Atualiza campos de cadastro, descrição, responsável e prazos de uma demanda.
 */
export async function updateDemand(id: string, rawData: any) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) {
      throw new Error('Usuário não autenticado.')
    }

    const parsed = updateDemandSchema.parse(rawData)

    const existing = await prisma.serviceDemand.findUnique({
      where: { id },
    })
    if (!existing) {
      throw new Error('Demanda não encontrada.')
    }

    const updated = await prisma.serviceDemand.update({
      where: { id },
      data: {
        propertyId: parsed.propertyId !== undefined ? (parsed.propertyId || null) : undefined,
        assigneeId: parsed.assigneeId !== undefined ? (parsed.assigneeId || null) : undefined,
        responsibleName: parsed.responsibleName !== undefined ? (parsed.responsibleName || null) : undefined,
        serviceType: parsed.serviceType,
        customServiceType: parsed.customServiceType !== undefined ? (parsed.customServiceType || null) : undefined,
        status: parsed.status,
        priority: parsed.priority,
        description: parsed.description !== undefined ? (parsed.description || null) : undefined,
        notes: parsed.notes !== undefined ? (parsed.notes || null) : undefined,
        requestDate: parsed.requestDate,
        startDate: parsed.startDate !== undefined ? parsed.startDate : undefined,
        estimatedDeliveryDate: parsed.estimatedDeliveryDate !== undefined ? parsed.estimatedDeliveryDate : undefined,
        completionDate: parsed.completionDate !== undefined ? parsed.completionDate : undefined,
      },
    })

    revalidatePath('/admin/demands')
    revalidatePath(`/admin/demands/${id}`)
    revalidatePath(`/admin/crm/${updated.producerId}`)

    return {
      success: true,
      demand: updated,
    }
  } catch (error) {
    return handleServerError(error, 'Erro ao atualizar demanda')
  }
}

/**
 * Transição ágil de estado (Kanban / Workflow) com preenchimento inteligente de prazos.
 */
export async function updateDemandStatus(id: string, newStatus: DemandStatusCode) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) {
      throw new Error('Usuário não autenticado.')
    }

    const parsed = updateDemandStatusSchema.parse({ status: newStatus })

    const existing = await prisma.serviceDemand.findUnique({
      where: { id },
    })
    if (!existing) {
      throw new Error('Demanda não encontrada.')
    }

    const updateData: any = {
      status: parsed.status,
    }

    // Regra de transição 1: Se moveu para EM_EXECUCAO e não tem data de início, seta agora
    if (parsed.status === 'EM_EXECUCAO' && !existing.startDate) {
      updateData.startDate = new Date()
    }

    // Regra de transição 2: Se moveu para CONCLUIDO e não tem data de conclusão, seta agora
    if (parsed.status === 'CONCLUIDO' && !existing.completionDate) {
      updateData.completionDate = new Date()
    }

    // Se reabriu demanda concluída, remove a data de conclusão
    if (existing.status === 'CONCLUIDO' && parsed.status !== 'CONCLUIDO') {
      updateData.completionDate = null
    }

    const updated = await prisma.serviceDemand.update({
      where: { id },
      data: updateData,
    })

    revalidatePath('/admin/demands')
    revalidatePath(`/admin/demands/${id}`)

    return {
      success: true,
      demand: updated,
    }
  } catch (error) {
    return handleServerError(error, 'Erro ao alterar status da demanda')
  }
}

/**
 * Marca item de checklist como entregue / pendente com data e vínculo ao GED.
 */
export async function toggleChecklistItem(
  itemId: string,
  isDelivered: boolean,
  documentId?: string | null
) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) {
      throw new Error('Usuário não autenticado.')
    }

    const updated = await prisma.demandChecklistItem.update({
      where: { id: itemId },
      data: {
        isDelivered,
        deliveredAt: isDelivered ? new Date() : null,
        documentId: documentId !== undefined ? documentId : undefined,
      },
    })

    revalidatePath('/admin/demands')
    revalidatePath(`/admin/demands/${updated.demandId}`)

    return {
      success: true,
      item: updated,
    }
  } catch (error) {
    return handleServerError(error, 'Erro ao atualizar checklist')
  }
}

/**
 * Adiciona um novo documento de pendência ao checklist de uma demanda.
 */
export async function addChecklistItem(
  demandId: string,
  title: string,
  documentType?: string | null
) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) {
      throw new Error('Usuário não autenticado.')
    }

    if (!title || title.trim() === '') {
      throw new Error('O título do documento é obrigatório.')
    }

    const item = await prisma.demandChecklistItem.create({
      data: {
        demandId,
        title: title.trim(),
        documentType: (documentType as any) || null,
        isRequired: true,
        isDelivered: false,
      },
    })

    revalidatePath('/admin/demands')
    revalidatePath(`/admin/demands/${demandId}`)

    return {
      success: true,
      item,
    }
  } catch (error) {
    return handleServerError(error, 'Erro ao adicionar item ao checklist')
  }
}

/**
 * Remove um item do checklist de documentos.
 */
export async function deleteChecklistItem(itemId: string) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) {
      throw new Error('Usuário não autenticado.')
    }

    const item = await prisma.demandChecklistItem.delete({
      where: { id: itemId },
    })

    revalidatePath('/admin/demands')
    revalidatePath(`/admin/demands/${item.demandId}`)

    return {
      success: true,
    }
  } catch (error) {
    return handleServerError(error, 'Erro ao remover item do checklist')
  }
}

/**
 * Exclusão segura de uma demanda e seus checklists em cascata.
 */
export async function deleteDemand(id: string) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) {
      throw new Error('Usuário não autenticado.')
    }

    await prisma.serviceDemand.delete({
      where: { id },
    })

    revalidatePath('/admin/demands')

    return {
      success: true,
    }
  } catch (error) {
    return handleServerError(error, 'Erro ao excluir demanda')
  }
}
