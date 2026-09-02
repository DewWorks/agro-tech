'use server'

import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import {
  CREDIT_TEMPLATES_REGISTRY,
  generateChecklistProfissionalHtml,
  generateLimiteCreditoBbHtml,
  generateProjetoRenovagroHtml,
  generateProjetoInovagroHtml,
  generateProjetoCusteioSafraHtml,
  CreditTemplateMeta
} from '@/lib/document-templates'

export async function getCreditTemplatesList(): Promise<CreditTemplateMeta[]> {
  const user = await getUserContext()
  if (!user) throw new Error('Unauthorized')
  return CREDIT_TEMPLATES_REGISTRY
}

export async function getProducersWithPropertiesForCredit() {
  const user = await getUserContext()
  if (!user) throw new Error('Unauthorized')

  const whereClause: any = { isActive: true }
  if (user.branchId && user.role !== 'SUPER_ADMIN') {
    whereClause.branchId = user.branchId
  }

  const producers = await prisma.producer.findMany({
    where: whereClause,
    include: {
      properties: {
        include: {
          property: true
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  return producers.map(p => ({
    id: p.id,
    name: p.name,
    document: p.document,
    type: p.type,
    spouseName: p.spouseName || undefined,
    spouseCpf: p.spouseCpf || undefined,
    phone: p.phone || undefined,
    properties: p.properties.map(link => ({
      id: link.property.id,
      name: link.property.propertyName || link.property.name || 'Propriedade Sem Nome',
      city: link.property.city || undefined,
      state: link.property.state || undefined,
      registrationNumber: link.property.registrationNumber || undefined,
      registryOffice: link.property.registryOffice || undefined,
      car: link.property.car || undefined,
      totalArea: link.property.totalArea ? Number(link.property.totalArea) : 0,
      productiveArea: link.property.productiveArea ? Number(link.property.productiveArea) : 0,
      pastureArea: link.property.pastureArea ? Number(link.property.pastureArea) : 0,
      preserveArea: link.property.preserveArea ? Number(link.property.preserveArea) : 0,
    }))
  }))
}

export async function resolveCreditProjectDocument(
  producerId: string,
  propertyId: string,
  templateCode: string,
  options: Record<string, any> = {}
) {
  const user = await getUserContext()
  if (!user) throw new Error('Unauthorized')

  const producer = await prisma.producer.findUnique({
    where: { id: producerId }
  })
  if (!producer) throw new Error('Produtor não encontrado.')

  const property = await prisma.property.findUnique({
    where: { id: propertyId }
  })
  if (!property) throw new Error('Propriedade não encontrada.')

  const org = user.organizationId ? await prisma.organization.findUnique({
    where: { id: user.organizationId },
    include: {
      users: {
        where: { role: 'OWNER' }
      }
    }
  }) : null

  const orgOwner = org?.users[0] || (user.role === 'OWNER' ? user : null)
  const ownerName = orgOwner?.fullName || user.fullName || 'João Victor Póvoa França'

  const branch = user.branchId ? await prisma.branch.findUnique({
    where: { id: user.branchId }
  }) : null

  const templateMeta = CREDIT_TEMPLATES_REGISTRY.find(t => t.code === templateCode)
  if (!templateMeta) throw new Error('Modelo de crédito não encontrado.')

  // Parse JSON fields
  const livestock = (property.livestock as any) || {}
  const possessionData = (property.possessionData as any) || {}

  const baseData = {
    producer: {
      name: producer.name,
      document: producer.document,
      type: producer.type as 'PF' | 'PJ',
      spouseName: producer.spouseName || undefined,
      spouseCpf: producer.spouseCpf || undefined,
      phone: producer.phone || undefined,
      civilStatus: producer.civilStatus || undefined,
      profession: producer.profession || undefined,
      street: undefined,
      city: property.city || undefined,
      state: property.state || undefined,
    },
    property: {
      name: property.propertyName || property.name || 'Fazenda',
      registrationNumber: property.registrationNumber || undefined,
      registryOffice: property.registryOffice || undefined,
      car: property.car || undefined,
      city: property.city || undefined,
      state: property.state || undefined,
      totalAreaHa: property.totalArea ? Number(property.totalArea) : undefined,
      openAreaHa: property.productiveArea ? Number(property.productiveArea) : undefined,
      pastureAreaHa: property.pastureArea ? Number(property.pastureArea) : undefined,
      agricultureAreaHa: property.productiveArea && property.pastureArea ? Math.max(0, Number(property.productiveArea) - Number(property.pastureArea)) : undefined,
      preservationAreaHa: property.preserveArea ? Number(property.preserveArea) : undefined,
      accessRoute: possessionData.accessRoute || undefined,
      livestockData: {
        totalCattle: livestock.totalCattle ? Number(livestock.totalCattle) : 0,
        brandRegistrationAdapec: livestock.brandRegistrationAdapec || undefined,
        brandDescription: livestock.brandDescription || undefined,
        brandLocation: livestock.brandLocation || undefined,
      }
    },
    organization: {
      name: org?.name || 'LN - CONSULTORIA E PROJETOS RURAIS',
      cnpj: org?.cnpj || undefined,
      ownerName: ownerName,
      phone: undefined,
    },
    branch: branch ? {
      name: branch.name
    } : undefined,
    options: {
      ...options,
      responsibleName: options.responsibleName && options.responsibleName !== 'Eng. Agrônomo Consultor' && options.responsibleName !== 'Responsável Técnico'
        ? options.responsibleName
        : ownerName,
      estimatedLandValuePerHa: options.estimatedLandValuePerHa !== undefined ? Number(options.estimatedLandValuePerHa) : 12000,
      improvementsValue: options.improvementsValue !== undefined ? Number(options.improvementsValue) : 0,
      machineryValue: options.machineryValue !== undefined ? Number(options.machineryValue) : 0,
      annualRevenue: options.annualRevenue !== undefined ? Number(options.annualRevenue) : 0,
      annualExpenses: options.annualExpenses !== undefined ? Number(options.annualExpenses) : 0,
      existingDebts: options.existingDebts !== undefined ? Number(options.existingDebts) : 0,
    }
  }

  let html = ''

  switch (templateCode) {
    case 'CHECKLIST_PROFISSIONAL':
      html = generateChecklistProfissionalHtml(baseData as any)
      break
    case 'LIMITE_CREDITO_BB':
      html = generateLimiteCreditoBbHtml(baseData as any)
      break
    case 'PROJETO_RENOVAGRO':
      html = generateProjetoRenovagroHtml(baseData as any)
      break
    case 'PROJETO_INOVAGRO':
      html = generateProjetoInovagroHtml(baseData as any)
      break
    case 'PROJETO_CUSTEIO_SAFRA':
      html = generateProjetoCusteioSafraHtml(baseData as any)
      break
    default:
      throw new Error(`Gerador não implementado para o código: ${templateCode}`)
  }

  return {
    templateMeta,
    html,
    producerName: producer.name,
    propertyName: property.propertyName || property.name,
    generatedAt: new Date().toISOString()
  }
}
