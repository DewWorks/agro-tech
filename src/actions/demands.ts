'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { handleServerError } from '@/lib/errorHandler'
import { getUserContext } from '@/lib/auth'
import {
  createDemandSchema,
  updateDemandSchema,
  updateDemandStatusSchema,
  cancelDemandSchema,
  calculateSlaInfo,
  RURAL_SERVICES_CATALOG,
  RuralServiceTypeCode,
  DemandStatusCode,
} from '@/lib/validations/demands'
import { DocumentType } from '@prisma/client'

export interface DemandFilters {
  branchId?: string
  producerId?: string
  propertyId?: string
  status?: DemandStatusCode
  serviceType?: RuralServiceTypeCode
  createdById?: string
  assignedToId?: string
  search?: string
  includeCancelled?: boolean
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

    // Isolamento multi-tenant por organização e filial
    if (dbUser.organizationId && dbUser.role !== 'SUPER_ADMIN' && !dbUser.isSuperAdminImpersonating) {
      where.branch = { organizationId: dbUser.organizationId }
    }

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
    } else if (!filters.includeCancelled) {
      // Por padrão no Kanban, não traz canceladas para manter a tela limpa
      where.status = { not: 'CANCELADO' }
    }

    if (filters.serviceType) {
      where.serviceType = filters.serviceType
    }

    if (filters.createdById) {
      where.createdById = filters.createdById
    }

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId
    }

    if (filters.search && filters.search.trim() !== '') {
      const term = filters.search.trim()
      where.OR = [
        { producer: { name: { contains: term, mode: 'insensitive' } } },
        { producer: { document: { contains: term } } },
        { property: { name: { contains: term, mode: 'insensitive' } } },
        { description: { contains: term, mode: 'insensitive' } },
        { responsibleName: { contains: term, mode: 'insensitive' } },
        { proposalId: { contains: term, mode: 'insensitive' } },
      ]
    }

    const demands = await prisma.serviceDemand.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
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
        document: {
          select: {
            id: true,
            fileName: true,
            storagePath: true,
            documentType: true,
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
    return {
      success: false,
      error: handleServerError(error, 'Erro ao listar demandas'),
      demands: [],
      counters: {
        total: 0,
        solicitado: 0,
        emExecucao: 0,
        aguardandoDocumentacao: 0,
        concluido: 0,
        cancelado: 0,
        atrasadas: 0,
      },
    }
  }
}

/**
 * Busca uma demanda específica por ID com todos os relacionamentos, checklist e linha do tempo de histórico.
 */
export async function getDemandById(id: string) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser || !dbUser.organizationId) {
      throw new Error('Usuário não autenticado ou sem organização.')
    }

    const demand = await prisma.serviceDemand.findFirst({
      where: {
        id,
        ...(dbUser.role !== 'SUPER_ADMIN' && !dbUser.isSuperAdminImpersonating
          ? { branch: { organizationId: dbUser.organizationId } }
          : {}),
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        producer: true,
        property: true,
        document: {
          select: {
            id: true,
            fileName: true,
            storagePath: true,
            documentType: true,
            complianceStatus: true,
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
        history: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!demand) {
      throw new Error('Demanda não encontrada ou permissão negada.')
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
    return {
      success: false,
      error: handleServerError(error, 'Erro ao carregar demanda'),
      demand: null,
    }
  }
}

/**
 * Cria uma nova Demanda / Ordem de Serviço Rural com autoria obrigatória e gravação de histórico inicial.
 */
export async function createDemand(rawData: any) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) {
      throw new Error('Usuário não autenticado.')
    }

    const parsed = createDemandSchema.parse(rawData)
    const assignedToId = parsed.assignedToId || parsed.assigneeId || null

    // Resolução robusta de Filial da Demanda
    let branchId = parsed.branchId || dbUser.branchId

    // 1. Se não especificado diretamente, tenta herdar da propriedade vinculada
    if (!branchId && parsed.propertyId) {
      const prop = await prisma.property.findUnique({
        where: { id: parsed.propertyId },
        select: { branchId: true },
      })
      if (prop?.branchId) {
        branchId = prop.branchId
      }
    }

    // 2. Se ainda não tiver filial, herda diretamente do produtor rural selecionado
    if (!branchId && parsed.producerId) {
      const producer = await prisma.producer.findUnique({
        where: { id: parsed.producerId },
        select: { branchId: true },
      })
      if (producer?.branchId) {
        branchId = producer.branchId
      }
    }

    // 3. Fallback: primeira filial ativa da organização
    if (!branchId && dbUser.organizationId) {
      const defaultBranch = await prisma.branch.findFirst({
        where: { organizationId: dbUser.organizationId, isActive: true },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      })
      if (defaultBranch?.id) {
        branchId = defaultBranch.id
      }
    }

    if (!branchId) {
      throw new Error('Nenhuma filial encontrada para vincular a demanda. Cadastre uma filial antes.')
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
          createdById: dbUser.id,
          assignedToId,
          producerId: parsed.producerId,
          propertyId: parsed.propertyId || null,
          proposalId: parsed.proposalId || null,
          documentId: parsed.documentId || null,
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

      // Gravação atômica do primeiro registro de auditoria e linha do tempo
      await tx.serviceDemandHistory.create({
        data: {
          demandId: demand.id,
          userId: dbUser.id,
          fromStatus: null,
          toStatus: demand.status,
          notes: parsed.notes || 'Abertura de nova ordem de serviço rural',
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
    revalidatePath(`/admin/crm/${parsed.producerId}/edit`)
    if (parsed.propertyId) {
      revalidatePath(`/admin/crm/properties/${parsed.propertyId}/edit`)
    }

    return {
      success: true,
      demand: result,
    }
  } catch (error) {
    return {
      success: false,
      error: handleServerError(error, 'Erro ao criar demanda de serviço'),
    }
  }
}

/**
 * Atualiza campos de cadastro, descrição, responsável e prazos de uma demanda.
 */
export async function updateDemand(id: string, rawData: any) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser || !dbUser.organizationId) {
      throw new Error('Usuário não autenticado ou sem organização.')
    }

    const existingDemand = await prisma.serviceDemand.findFirst({
      where: {
        id,
        ...(dbUser.role !== 'SUPER_ADMIN' && !dbUser.isSuperAdminImpersonating
          ? { branch: { organizationId: dbUser.organizationId } }
          : {}),
      },
      select: { id: true, branchId: true },
    })

    if (!existingDemand) {
      throw new Error('Demanda não encontrada ou permissão negada.')
    }

    const parsed = updateDemandSchema.parse(rawData)
    const assignedToId = parsed.assignedToId !== undefined ? parsed.assignedToId : parsed.assigneeId

    const updated = await prisma.serviceDemand.update({
      where: { id },
      data: {
        branchId: parsed.branchId ? parsed.branchId : undefined,
        propertyId: parsed.propertyId !== undefined ? (parsed.propertyId || null) : undefined,
        assignedToId: assignedToId !== undefined ? (assignedToId || null) : undefined,
        responsibleName: parsed.responsibleName !== undefined ? (parsed.responsibleName || null) : undefined,
        proposalId: parsed.proposalId !== undefined ? (parsed.proposalId || null) : undefined,
        documentId: parsed.documentId !== undefined ? (parsed.documentId || null) : undefined,
        serviceType: parsed.serviceType,
        customServiceType: parsed.customServiceType !== undefined ? (parsed.customServiceType || null) : undefined,
        status: parsed.status,
        priority: parsed.priority,
        description: parsed.description !== undefined ? (parsed.description || null) : undefined,
        notes: parsed.notes !== undefined ? (parsed.notes || null) : undefined,
        requestDate: parsed.requestDate,
        startDate: parsed.startDate !== undefined ? (parsed.startDate || null) : undefined,
        estimatedDeliveryDate: parsed.estimatedDeliveryDate !== undefined ? (parsed.estimatedDeliveryDate || null) : undefined,
        completionDate: parsed.completionDate !== undefined ? (parsed.completionDate || null) : undefined,
      },
    })

    revalidatePath('/admin/demands')
    revalidatePath(`/admin/demands/${id}`)
    revalidatePath(`/admin/crm/${updated.producerId}/edit`)
    if (updated.propertyId) {
      revalidatePath(`/admin/crm/properties/${updated.propertyId}/edit`)
    }

    return {
      success: true,
      demand: updated,
    }
  } catch (error) {
    return {
      success: false,
      error: handleServerError(error, 'Erro ao atualizar dados da demanda'),
    }
  }
}

/**
 * Transição ágil de estado com automação de datas, gravação atômica em ServiceDemandHistory e validação de justificativa.
 */
export async function updateDemandStatus(
  id: string,
  newStatus: DemandStatusCode,
  notes?: string | null
) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser || !dbUser.organizationId) {
      throw new Error('Usuário não autenticado ou sem organização.')
    }

    const parsed = updateDemandStatusSchema.parse({ status: newStatus, notes })

    const existing = await prisma.serviceDemand.findFirst({
      where: {
        id,
        ...(dbUser.role !== 'SUPER_ADMIN' && !dbUser.isSuperAdminImpersonating
          ? { branch: { organizationId: dbUser.organizationId } }
          : {}),
      },
    })
    if (!existing) {
      throw new Error('Demanda não encontrada ou permissão negada.')
    }

    const updateData: any = {
      status: parsed.status,
    }

    // Regra de automação 1: Se moveu para EM_EXECUCAO e não tem data de início, grava agora
    if (parsed.status === 'EM_EXECUCAO' && !existing.startDate) {
      updateData.startDate = new Date()
    }

    // Regra de automação 2: Se moveu para CONCLUIDO e não tem data de conclusão, grava agora
    if (parsed.status === 'CONCLUIDO') {
      updateData.completionDate = new Date()
    }

    // Regra de automação 3: Reabertura (de CONCLUIDO para outro status ativo)
    if (existing.status === 'CONCLUIDO' && parsed.status !== 'CONCLUIDO') {
      updateData.completionDate = null
      if (!notes || notes.trim().length === 0) {
        throw new Error('A justificativa técnica é obrigatória ao reabrir uma demanda já concluída.')
      }
    }

    // Regra de automação 4: Cancelamento exige motivo obrigatório
    if (parsed.status === 'CANCELADO') {
      if (!notes || notes.trim().length === 0) {
        throw new Error('O motivo do cancelamento é obrigatório.')
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const demand = await tx.serviceDemand.update({
        where: { id },
        data: updateData,
      })

      await tx.serviceDemandHistory.create({
        data: {
          demandId: id,
          userId: dbUser.id,
          fromStatus: existing.status,
          toStatus: parsed.status,
          notes: notes || null,
        },
      })

      return demand
    })

    revalidatePath('/admin/demands')
    revalidatePath(`/admin/demands/${id}`)

    return {
      success: true,
      demand: updated,
    }
  } catch (error) {
    return {
      success: false,
      error: handleServerError(error, 'Erro ao alterar status da demanda'),
    }
  }
}

/**
 * Ação de cancelamento formal de demanda com motivo obrigatório.
 */
export async function cancelDemand(id: string, reason: string) {
  try {
    const parsed = cancelDemandSchema.parse({ reason })
    return await updateDemandStatus(id, 'CANCELADO', parsed.reason)
  } catch (error) {
    return {
      success: false,
      error: handleServerError(error, 'Erro ao cancelar demanda'),
    }
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
    if (!dbUser || !dbUser.organizationId) {
      throw new Error('Usuário não autenticado ou sem organização.')
    }

    const existingItem = await prisma.demandChecklistItem.findFirst({
      where: {
        id: itemId,
        ...(dbUser.role !== 'SUPER_ADMIN' && !dbUser.isSuperAdminImpersonating
          ? { demand: { branch: { organizationId: dbUser.organizationId } } }
          : {}),
      },
      select: { id: true, demandId: true },
    })

    if (!existingItem) {
      throw new Error('Item do checklist não encontrado ou permissão negada.')
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
    return {
      success: false,
      error: handleServerError(error, 'Erro ao atualizar checklist'),
    }
  }
}

/**
 * "Entrada Única de Dados": Registra um documento corporativo na tabela Document do GED
 * e vincula automaticamente ao item de checklist da demanda.
 */
export async function attachDocumentToChecklistItem(
  itemId: string,
  metadata: {
    fileName: string
    fileSize: number
    mimeType: string
    storagePath: string
    documentType?: DocumentType | string
  }
) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser || !dbUser.organizationId) {
      throw new Error('Usuário não autenticado ou sem organização.')
    }

    const item = await prisma.demandChecklistItem.findFirst({
      where: {
        id: itemId,
        ...(dbUser.role !== 'SUPER_ADMIN' && !dbUser.isSuperAdminImpersonating
          ? { demand: { branch: { organizationId: dbUser.organizationId } } }
          : {}),
      },
      include: { demand: true },
    })

    if (!item) {
      throw new Error('Item do checklist não encontrado ou permissão negada.')
    }

    const result = await prisma.$transaction(async (tx) => {
      // Cria o registro na tabela corporativa Document (GED)
      const doc = await tx.document.create({
        data: {
          branchId: item.demand.branchId,
          producerId: item.demand.producerId,
          propertyId: item.demand.propertyId,
          documentType: (metadata.documentType as any) || item.documentType || 'OUTROS',
          fileName: metadata.fileName,
          fileSize: metadata.fileSize,
          mimeType: metadata.mimeType,
          storagePath: metadata.storagePath,
          complianceStatus: 'PENDING',
          createdBy: dbUser.id,
        },
      })

      // Conecta ao item do checklist da demanda
      const updatedItem = await tx.demandChecklistItem.update({
        where: { id: itemId },
        data: {
          documentId: doc.id,
          isDelivered: true,
          deliveredAt: new Date(),
        },
      })

      return { doc, updatedItem }
    })

    revalidatePath('/admin/demands')
    revalidatePath(`/admin/demands/${item.demandId}`)
    revalidatePath('/admin/documents')

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      error: handleServerError(error, 'Erro ao anexar documento ao checklist e GED'),
    }
  }
}

/**
 * Vincula um documento pré-existente do GED da fazenda/produtor ao item de checklist.
 */
export async function linkExistingGedDocument(itemId: string, documentId: string) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser || !dbUser.organizationId) {
      throw new Error('Usuário não autenticado ou sem organização.')
    }

    const existingItem = await prisma.demandChecklistItem.findFirst({
      where: {
        id: itemId,
        ...(dbUser.role !== 'SUPER_ADMIN' && !dbUser.isSuperAdminImpersonating
          ? { demand: { branch: { organizationId: dbUser.organizationId } } }
          : {}),
      },
      select: { id: true, demandId: true },
    })

    if (!existingItem) {
      throw new Error('Item do checklist não encontrado ou permissão negada.')
    }

    const updated = await prisma.demandChecklistItem.update({
      where: { id: itemId },
      data: {
        documentId,
        isDelivered: true,
        deliveredAt: new Date(),
      },
    })

    revalidatePath('/admin/demands')
    revalidatePath(`/admin/demands/${updated.demandId}`)

    return {
      success: true,
      item: updated,
    }
  } catch (error) {
    return {
      success: false,
      error: handleServerError(error, 'Erro ao vincular documento do GED'),
    }
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
    if (!dbUser || !dbUser.organizationId) {
      throw new Error('Usuário não autenticado ou sem organização.')
    }

    if (!title || title.trim() === '') {
      throw new Error('O título do documento é obrigatório.')
    }

    const demand = await prisma.serviceDemand.findFirst({
      where: {
        id: demandId,
        ...(dbUser.role !== 'SUPER_ADMIN' && !dbUser.isSuperAdminImpersonating
          ? { branch: { organizationId: dbUser.organizationId } }
          : {}),
      },
      select: { id: true },
    })

    if (!demand) {
      throw new Error('Demanda não encontrada ou permissão negada.')
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
    return {
      success: false,
      error: handleServerError(error, 'Erro ao adicionar item ao checklist'),
    }
  }
}

/**
 * Remove um item do checklist de documentos.
 */
export async function deleteChecklistItem(itemId: string) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser || !dbUser.organizationId) {
      throw new Error('Usuário não autenticado ou sem organização.')
    }

    const existingItem = await prisma.demandChecklistItem.findFirst({
      where: {
        id: itemId,
        ...(dbUser.role !== 'SUPER_ADMIN' && !dbUser.isSuperAdminImpersonating
          ? { demand: { branch: { organizationId: dbUser.organizationId } } }
          : {}),
      },
      select: { id: true, demandId: true },
    })

    if (!existingItem) {
      throw new Error('Item do checklist não encontrado ou permissão negada.')
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
    return {
      success: false,
      error: handleServerError(error, 'Erro ao remover item do checklist'),
    }
  }
}

/**
 * Exclusão segura de uma demanda e seus checklists/históricos em cascata.
 */
export async function deleteDemand(id: string) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser || !dbUser.organizationId) {
      throw new Error('Usuário não autenticado ou sem organização.')
    }

    const existing = await prisma.serviceDemand.findFirst({
      where: {
        id,
        ...(dbUser.role !== 'SUPER_ADMIN' && !dbUser.isSuperAdminImpersonating
          ? { branch: { organizationId: dbUser.organizationId } }
          : {}),
      },
      select: { id: true },
    })

    if (!existing) {
      throw new Error('Demanda não encontrada ou permissão negada.')
    }

    await prisma.serviceDemand.delete({
      where: { id },
    })

    revalidatePath('/admin/demands')

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: handleServerError(error, 'Erro ao excluir demanda'),
    }
  }
}
