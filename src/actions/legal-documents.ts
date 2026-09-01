'use server'

import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { formatCPF, formatCNPJ } from '@/lib/validations'

export async function getMinutasRepository() {
  const user = await getUserContext()
  if (!user) throw new Error('Unauthorized')

  // Retorna os templates disponíveis. Poderíamos filtrar por branchId, mas como semeamos sem branchId (globais), pegamos todos.
  const templates = await prisma.documentTemplate.findMany({
    orderBy: { title: 'asc' },
  })

  return templates
}

export async function getProducersForDropdown() {
  const user = await getUserContext()
  if (!user) throw new Error('Unauthorized')

  const whereClause: any = { isActive: true }
  if (user.branchId) {
    whereClause.branchId = user.branchId
  }

  return await prisma.producer.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      document: true,
      properties: {
        select: {
          property: {
            select: { id: true, name: true, propertyName: true }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })
}

export async function resolveDocumentData(producerId: string, propertyId: string | null, templateCode: string) {
  const user = await getUserContext()
  if (!user) throw new Error('Unauthorized')

  const template = await prisma.documentTemplate.findUnique({
    where: { code: templateCode },
  })
  if (!template) throw new Error('Template not found')

  const producer = await prisma.producer.findUnique({
    where: { id: producerId },
  })
  if (!producer) throw new Error('Producer not found')

  let property = null
  if (propertyId) {
    property = await prisma.property.findUnique({
      where: { id: propertyId },
    })
  }

  // 1. Resolve Variables
  const resolvedVariables: Record<string, string | number> = {}
  const missingFields: Array<any> = []

  const schemaJson = template.schemaJson as { required: Array<{ key: string, label: string, source: string, field: string, type: string, readonly?: boolean }> }
  const requiredFields = schemaJson?.required || []

  for (const field of requiredFields) {
    let value: any = null

    if (field.source === 'Producer') {
      if (producer.type === 'PJ' && field.key.toUpperCase().includes('CPF')) {
        value = (producer as any)['representativeCpf']
        if (value) value = formatCPF(value)
      } else {
        value = (producer as any)[field.field]
        if (field.field === 'document' && value) {
          value = producer.type === 'PF' ? formatCPF(value) : formatCNPJ(value)
        }
      }
    } else if (field.source === 'Property' && property) {
      value = (property as any)[field.field]
    } else if (field.source === 'Property.livestock' && property) {
      const livestock = property.livestock as Record<string, any> || {}
      value = livestock[field.field]
    } else if (field.source === 'Property.possessionData' && property) {
      const possession = property.possessionData as Record<string, any> || {}
      value = possession[field.field]
    } else if (field.source === 'Calculated' && property) {
      if (field.key === 'UA_TOTAL') {
        const livestock = property.livestock as any || {}
        const cabecas = Number(livestock.totalHeadCount || 0)
        // Simplificação: 1 cabeça = 1 UA
        value = cabecas
      } else if (field.key === 'TAXA_LOTACAO') {
        const pastagem = Number(property.pastureArea || 0)
        const livestock = property.livestock as any || {}
        const cabecas = Number(livestock.totalHeadCount || 0)
        value = pastagem > 0 ? (cabecas / pastagem).toFixed(2) : 0
      }
    }

    if (value === null || value === undefined || value === '') {
      if (!field.readonly) {
        missingFields.push(field)
      }
    } else {
      resolvedVariables[field.key] = value
    }
  }

  // Add Data do Sistema
  resolvedVariables['DATA_EXTENSO'] = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  resolvedVariables['DATA_CURTA'] = new Date().toLocaleDateString('pt-BR')
  
  // Add Tipagem do Documento do Produtor
  resolvedVariables['PRODUCER_DOCUMENT_TYPE'] = producer.type === 'PJ' ? 'CNPJ' : 'CPF'
  
  // Also provide a formatted document type variable (e.g. "CNPJ: 12.345.678/0001-90")
  const rawDocument = producer.document || ''
  const formattedDoc = producer.type === 'PF' ? formatCPF(rawDocument) : formatCNPJ(rawDocument)
  resolvedVariables['PRODUCER_DOCUMENT_WITH_TYPE'] = `${producer.type === 'PJ' ? 'CNPJ' : 'CPF'}: ${formattedDoc}`

  return {
    template,
    resolvedVariables,
    missingFields
  }
}

export async function saveMissingDataAndRegenerate(producerId: string, propertyId: string | null, templateCode: string, incomingData: Record<string, any>) {
  const user = await getUserContext()
  if (!user) throw new Error('Unauthorized')

  const producer = await prisma.producer.findUnique({ where: { id: producerId } })

  // Atualizar Producer
  const producerUpdates: Record<string, any> = {}
  const propertyUpdates: Record<string, any> = {}
  let livestockUpdates: Record<string, any> = {}
  let possessionUpdates: Record<string, any> = {}

  for (const [key, fieldConfig] of Object.entries(incomingData.schemaFields)) {
    const value = incomingData.values[key]
    if (value === undefined || value === '') continue

    const config = fieldConfig as any
    if (config.source === 'Producer') {
      if (producer?.type === 'PJ' && config.key.toUpperCase().includes('CPF')) {
        producerUpdates['representativeCpf'] = config.type === 'number' ? Number(value) : value
      } else {
        producerUpdates[config.field] = config.type === 'number' ? Number(value) : value
      }
    } else if (config.source === 'Property') {
      propertyUpdates[config.field] = config.type === 'number' ? Number(value) : value
    } else if (config.source === 'Property.livestock') {
      livestockUpdates[config.field] = config.type === 'number' ? Number(value) : value
    } else if (config.source === 'Property.possessionData') {
      possessionUpdates[config.field] = config.type === 'number' ? Number(value) : value
    }
  }

  if (Object.keys(producerUpdates).length > 0) {
    await prisma.producer.update({
      where: { id: producerId },
      data: producerUpdates,
    })
  }

  if (propertyId) {
    if (Object.keys(livestockUpdates).length > 0 || Object.keys(possessionUpdates).length > 0) {
      const currentProperty = await prisma.property.findUnique({ where: { id: propertyId } })
      
      if (Object.keys(livestockUpdates).length > 0) {
        propertyUpdates.livestock = {
          ...(currentProperty?.livestock as any || {}),
          ...livestockUpdates
        }
      }
      
      if (Object.keys(possessionUpdates).length > 0) {
        propertyUpdates.possessionData = {
          ...(currentProperty?.possessionData as any || {}),
          ...possessionUpdates
        }
      }
    }

    if (Object.keys(propertyUpdates).length > 0) {
      await prisma.property.update({
        where: { id: propertyId },
        data: propertyUpdates,
      })
    }
  } else if (Object.keys(propertyUpdates).length > 0 || Object.keys(livestockUpdates).length > 0 || Object.keys(possessionUpdates).length > 0) {
    // Se não há propriedade, mas o formulário pediu campos de propriedade (ex: Minuta de Posse Mansa),
    // cria uma nova propriedade vinculada ao produtor.
    const producer = await prisma.producer.findUnique({ where: { id: producerId } })
    if (producer) {
      const newProperty = await prisma.property.create({
        data: {
          name: propertyUpdates.name || propertyUpdates.propertyName || 'Propriedade Principal',
          propertyName: propertyUpdates.propertyName || propertyUpdates.name || 'Propriedade Principal',
          branchId: producer.branchId,
          ...propertyUpdates,
          livestock: livestockUpdates,
          possessionData: possessionUpdates,
          producers: {
            create: {
              producerId: producerId,
              ownershipType: 'PROPRIETARIO'
            }
          }
        }
      })
      propertyId = newProperty.id
    }
  }

  const result = await resolveDocumentData(producerId, propertyId, templateCode)
  return {
    ...result,
    newPropertyId: propertyId
  }
}

export async function saveGeneratedPdfMetadata(data: {
  producerId: string
  propertyId?: string | null
  templateCode: string
  templateVersion: number
  payloadSnapshot: any
  storagePdfPath: string
}) {
  const user = await getUserContext()
  if (!user) throw new Error('Unauthorized')

  // Se for super admin e não tiver branchId, podemos salvar como branchId = null, ou usar um fake branchId, ou lançar erro se o schema não permitir null.
  // Vamos verificar o schema para GeneratedForm.branchId: se for obrigatório, usamos uma fallback ou null se for opcional.
  // No schema, branchId no GeneratedForm é String (obrigatório se não tiver ?).
  // Se for obrigatório, podemos pegar o branchId do producer
  
  let branchIdToSave = user.branchId

  if (!branchIdToSave) {
    const producer = await prisma.producer.findUnique({ where: { id: data.producerId }, select: { branchId: true }})
    if (producer) {
      branchIdToSave = producer.branchId
    } else {
      throw new Error('Não foi possível determinar a unidade (Branch) para salvar o histórico.')
    }
  }

  return await prisma.generatedForm.create({
    data: {
      branchId: branchIdToSave!,
      producerId: data.producerId,
      propertyId: data.propertyId,
      templateCode: data.templateCode,
      templateVersion: data.templateVersion,
      payloadSnapshot: data.payloadSnapshot,
      storagePdfPath: data.storagePdfPath,
    }
  })
}
