'use server'

import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getUserContext } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { DEMAND_STATUS_METAS } from '@/lib/validations/demands'
import {
  CREDIT_TEMPLATES_REGISTRY,
  generateChecklistProfissionalHtml,
  generateLimiteCreditoBbHtml,
  generateProjetoRenovagroHtml,
  generateProjetoInovagroHtml,
  generateProjetoCusteioSafraHtml,
  CreditTemplateMeta
} from '@/lib/document-templates'
import {
  normalizeCategoryBB,
  normalizePurposeBB,
  normalizeLivestockCategory,
  normalizeLivestockSpecies,
  denormalizePurposeBB,
} from '@/lib/validations/livestock-mapper'
import {
  sanitizePayload,
  maskRegistrationNumber,
  maskCAR,
  maskCCIR,
  maskITR,
} from '@/lib/utils/masks'

export async function getCreditTemplatesList(): Promise<CreditTemplateMeta[]> {
  const user = await getUserContext()
  if (!user) throw new Error('Unauthorized')

  const isSuperAdmin = user.role === 'SUPER_ADMIN' || (user as any).realRole === 'SUPER_ADMIN'
  const hasFinancial = isSuperAdmin || (user.organization?.modules || []).includes('FINANCIAL_SUMMARY')

  if (hasFinancial) {
    return CREDIT_TEMPLATES_REGISTRY
  }

  // Se o módulo financeiro estiver desativado para o cliente, oculta a Ficha de Limite de Crédito
  return CREDIT_TEMPLATES_REGISTRY.filter(t => t.code !== 'LIMITE_CREDITO_BB')
}

export async function getProducersWithPropertiesForCredit() {
  const user = await getUserContext()
  if (!user) throw new Error('Unauthorized')

  const whereClause: any = { isActive: true }
  if (user.branchId && user.role !== 'SUPER_ADMIN') {
    whereClause.branchId = user.branchId
  } else if (user.organizationId && user.role !== 'SUPER_ADMIN') {
    whereClause.branch = { organizationId: user.organizationId }
  }

  const producers = await prisma.producer.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      document: true,
      type: true,
      spouseName: true,
      spouseCpf: true,
      spouseRg: true,
      spouseRgIssuer: true,
      spouseNationality: true,
      spouseEducationLevel: true,
      marriageRegime: true,
      phone: true,
      email: true,
      civilStatus: true,
      representativeCpf: true,
      branch: {
        select: {
          name: true,
        }
      },
      properties: {
        select: {
          property: {
            select: {
              id: true,
              name: true,
              propertyName: true,
              city: true,
              state: true,
              registrationNumber: true,
              registryOffice: true,
              car: true,
              ccir: true,
              itr: true,
              totalArea: true,
              productiveArea: true,
              pastureArea: true,
              preserveArea: true,
              explorationActivity: true,
              possessionData: true,
              livestock: true,
              machineries: {
                select: {
                  id: true,
                  specification: true,
                  brand: true,
                  model: true,
                  year: true,
                  chassisSerial: true,
                  value: true,
                }
              },
              improvementsList: {
                select: {
                  id: true,
                  specification: true,
                  unit: true,
                  quantity: true,
                  unitValue: true,
                }
              },
              livestockList: {
                select: {
                  id: true,
                  species: true,
                  category: true,
                  categoryBB: true,
                  purpose: true,
                  purposeBB: true,
                  breed: true,
                  quantity: true,
                  ageMonths: true,
                  avgWeightKg: true,
                  unitValue: true,
                  brandingType: true,
                  brandingLocation: true,
                  observation: true,
                }
              }
            }
          }
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
    spouseRg: p.spouseRg || undefined,
    spouseRgIssuer: p.spouseRgIssuer || undefined,
    spouseNationality: p.spouseNationality || undefined,
    spouseEducationLevel: p.spouseEducationLevel || undefined,
    marriageRegime: p.marriageRegime || undefined,
    phone: p.phone || undefined,
    email: p.email || undefined,
    civilStatus: p.civilStatus || undefined,
    representativeCpf: p.representativeCpf || undefined,
    branchName: p.branch?.name || 'Matriz',
    properties: p.properties.map(link => {
      const poss = (link.property.possessionData as any) || {}
      const lsList = link.property.livestockList || []
      const calculatedHeads = lsList.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0)
      return {
        id: link.property.id,
        name: link.property.propertyName || link.property.name || 'Propriedade Sem Nome',
        city: link.property.city || undefined,
        state: link.property.state || undefined,
        registrationNumber: link.property.registrationNumber || undefined,
        registryOffice: link.property.registryOffice || undefined,
        car: link.property.car || undefined,
        ccir: link.property.ccir || undefined,
        itr: link.property.itr || undefined,
        totalArea: link.property.totalArea ? Number(link.property.totalArea) : 0,
        productiveArea: link.property.productiveArea ? Number(link.property.productiveArea) : 0,
        pastureArea: link.property.pastureArea ? Number(link.property.pastureArea) : 0,
        preserveArea: link.property.preserveArea ? Number(link.property.preserveArea) : 0,
        explorationActivity: link.property.explorationActivity || undefined,
        accessRoute: poss.accessRoute || undefined,
        totalHeadCount: calculatedHeads || (link.property.livestock as any)?.totalHeadCount || 0,
        brandDescription: (link.property.livestock as any)?.brandDescription || undefined,
        brandRegistrationAdapec: (link.property.livestock as any)?.brandRegistrationAdapec || undefined,
        brandLocation: (link.property.livestock as any)?.brandLocation || undefined,
        machineries: (link.property.machineries || []).map(m => ({
          id: m.id,
          type: m.specification || 'Trator de Pneus',
          category: m.specification || 'Trator de Pneus',
          brand: m.brand || '',
          model: m.model || '',
          year: m.year || new Date().getFullYear(),
          chassi: m.chassisSerial || '',
          value: Number(m.value) || 0,
        })),
        improvements: (link.property.improvementsList || []).map(imp => ({
          id: imp.id,
          specification: imp.specification || '',
          unit: imp.unit || 'm²',
          quantity: Number(imp.quantity) || 0,
          unitValue: Number(imp.unitValue) || 0,
          totalValue: (Number(imp.quantity) || 0) * (Number(imp.unitValue) || 0),
        })),
        livestocks: lsList.map(l => ({
          id: l.id,
          species: l.species,
          category: l.categoryBB || l.category,
          categoryBB: l.categoryBB || l.category,
          purpose: l.purposeBB || l.purpose,
          purposeBB: l.purposeBB || l.purpose,
          breed: l.breed || 'Nelore',
          quantity: Number(l.quantity) || 0,
          ageMonths: l.ageMonths || 0,
          avgWeightKg: Number(l.avgWeightKg) || 0,
          unitValue: Number(l.unitValue) || 0,
          totalValue: (Number(l.quantity) || 0) * (Number(l.unitValue) || 0),
          markingType: l.brandingType || 'Ferro Quente',
          markingLocation: l.brandingLocation || 'Perna Traseira Direita',
        })),
      }
    })
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
    where: { id: propertyId },
    include: {
      livestockList: true,
      machineries: true,
      improvementsList: true,
    }
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
  const ownerName = orgOwner?.fullName || user.fullName || ''

  const branch = user.branchId ? await prisma.branch.findUnique({
    where: { id: user.branchId }
  }) : null

  const templateMeta = CREDIT_TEMPLATES_REGISTRY.find(t => t.code === templateCode)
  if (!templateMeta) throw new Error('Modelo de crédito não encontrado.')

  const isSuperAdmin = user.role === 'SUPER_ADMIN' || (user as any).realRole === 'SUPER_ADMIN'
  const hasFinancialModule = isSuperAdmin || (org?.modules || []).includes('FINANCIAL_SUMMARY')

  if (templateCode === 'LIMITE_CREDITO_BB' && !hasFinancialModule) {
    throw new Error('Acesso não autorizado: o módulo Resumo Financeiro & Limites não está ativo para a sua organização.')
  }

  // Parse JSON fields
  const livestock = (property.livestock as any) || {}
  const possessionData = (property.possessionData as any) || {}
  const totalHeadsFromDb = property.livestockList && property.livestockList.length > 0
    ? property.livestockList.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0)
    : (livestock.totalHeadCount ? Number(livestock.totalHeadCount) : (livestock.totalCattle ? Number(livestock.totalCattle) : 0))

  // Buscar documentos reais do GED vinculados ao produtor/imóvel
  const attachedDocs = await prisma.document.findMany({
    where: {
      producerId: producer.id,
      OR: [
        { propertyId: null },
        { propertyId: property.id }
      ]
    },
    select: {
      documentType: true,
      complianceStatus: true
    }
  })

    // Resolve template-specific financial values
    let totalInv = 0
    let finAmount: number | undefined = undefined
    let ownRes: number | undefined = undefined
    let term: number | undefined = undefined
    let grace: number | undefined = undefined
    let rate: number | undefined = undefined

    if (templateCode === 'PROJETO_INOVAGRO') {
      totalInv = Number(options.inovagroTotalInvestment || options.totalInvestment || 0)
      finAmount = options.inovagroFinanced !== undefined && Number(options.inovagroFinanced) > 0 ? Number(options.inovagroFinanced) : (options.financedAmount !== undefined ? Number(options.financedAmount) : undefined)
      ownRes = options.inovagroOwnResources !== undefined && Number(options.inovagroOwnResources) > 0 ? Number(options.inovagroOwnResources) : (options.ownResources !== undefined ? Number(options.ownResources) : undefined)
      term = options.inovagroTermYears !== undefined ? Number(options.inovagroTermYears) : (options.termYears !== undefined ? Number(options.termYears) : undefined)
      grace = options.inovagroGraceMonths !== undefined ? Number(options.inovagroGraceMonths) : (options.graceMonths !== undefined ? Number(options.graceMonths) : undefined)
      rate = options.inovagroInterestRate !== undefined ? Number(options.inovagroInterestRate) : (options.interestRate !== undefined ? Number(options.interestRate) : undefined)
    } else if (templateCode === 'PROJETO_RENOVAGRO') {
      totalInv = Number(options.renovagroTotalInvestment || options.totalInvestment || 0)
      finAmount = options.renovagroFinanced !== undefined && Number(options.renovagroFinanced) > 0 ? Number(options.renovagroFinanced) : (options.financedAmount !== undefined ? Number(options.financedAmount) : undefined)
      ownRes = options.renovagroOwnResources !== undefined && Number(options.renovagroOwnResources) > 0 ? Number(options.renovagroOwnResources) : (options.ownResources !== undefined ? Number(options.ownResources) : undefined)
      term = options.renovagroTermYears !== undefined ? Number(options.renovagroTermYears) : (options.termYears !== undefined ? Number(options.termYears) : undefined)
      grace = options.renovagroGraceMonths !== undefined ? Number(options.renovagroGraceMonths) : (options.graceMonths !== undefined ? Number(options.graceMonths) : undefined)
      rate = options.renovagroInterestRate !== undefined ? Number(options.renovagroInterestRate) : (options.interestRate !== undefined ? Number(options.interestRate) : undefined)
    } else if (templateCode === 'PROJETO_CUSTEIO_SAFRA') {
      rate = options.custeioInterestRate !== undefined ? Number(options.custeioInterestRate) : (options.interestRate !== undefined ? Number(options.interestRate) : undefined)
    }

    const baseData = {
      producer: {
        name: producer.name,
        document: producer.document,
        type: producer.type as 'PF' | 'PJ',
        spouseName: producer.spouseName || undefined,
        spouseCpf: producer.spouseCpf || undefined,
        spouseRg: producer.spouseRg || undefined,
        spouseRgIssuer: producer.spouseRgIssuer || undefined,
        spouseNationality: producer.spouseNationality || undefined,
        spouseEducationLevel: producer.spouseEducationLevel || undefined,
        marriageRegime: producer.marriageRegime || undefined,
        representativeCpf: options.representativeCpf || producer.representativeCpf || undefined,
        representativeName: options.representativeName || (producer.type === 'PJ' ? producer.name.replace(/\s*\(PJ\)\s*/i, '').trim() : undefined),
        phone: producer.phone || undefined,
        civilStatus: producer.civilStatus || undefined,
        profession: producer.profession || undefined,
        street: undefined,
        city: property.city || undefined,
        state: property.state || undefined,
      },
      property: {
        name: property.propertyName || property.name || 'Imóvel Beneficiado',
        registrationNumber: options.propertyRegistrationNumber || property.registrationNumber || undefined,
        registryOffice: options.propertyRegistryOffice || property.registryOffice || undefined,
        car: options.propertyCar || property.car || undefined,
        ccir: options.propertyCcir || property.ccir || undefined,
        itr: options.propertyItr || property.itr || undefined,
        city: property.city || undefined,
        state: property.state || undefined,
        totalAreaHa: (options.propertyTotalArea !== undefined && Number(options.propertyTotalArea) > 0)
          ? Number(options.propertyTotalArea)
          : (property.totalArea ? Number(property.totalArea) : undefined),
        openAreaHa: property.productiveArea ? Number(property.productiveArea) : undefined,
        pastureAreaHa: property.pastureArea ? Number(property.pastureArea) : undefined,
        agricultureAreaHa: property.productiveArea && property.pastureArea ? Math.max(0, Number(property.productiveArea) - Number(property.pastureArea)) : undefined,
        preservationAreaHa: property.preserveArea ? Number(property.preserveArea) : undefined,
        explorationActivity: options.propertyActivity || property.explorationActivity || undefined,
        accessRoute: options.propertyAccessRoute || possessionData.accessRoute || undefined,
        livestockData: {
          totalCattle: totalHeadsFromDb,
          brandRegistrationAdapec: livestock.brandRegistrationAdapec || (property.livestock as any)?.brandRegistrationAdapec || undefined,
          brandDescription: livestock.brandDescription || (property.livestock as any)?.brandDescription || undefined,
          brandLocation: livestock.brandLocation || (property.livestock as any)?.brandLocation || undefined,
        },
        livestockList: property.livestockList || [],
        livestocks: property.livestockList || [],
        machineries: property.machineries || [],
        improvementsList: property.improvementsList || [],
      },
      attachedDocs: attachedDocs.map(d => ({
        documentType: d.documentType,
        status: d.complianceStatus
      })),
      organization: {
        name: org?.name || 'Organização',
        cnpj: org?.cnpj || undefined,
        ownerName: ownerName,
        phone: undefined,
      },
      branch: branch ? {
        name: branch.name
      } : undefined,
      options: {
        ...options,
        hasFinancialModule: hasFinancialModule,
        responsibleName: options.responsibleName
          ? options.responsibleName
          : ownerName,
        estimatedLandValuePerHa: options.estimatedLandValuePerHa !== undefined ? Number(options.estimatedLandValuePerHa) : 0,
        improvementsValue: options.improvementsValue !== undefined ? Number(options.improvementsValue) : 0,
        machineryValue: options.machineryValue !== undefined ? Number(options.machineryValue) : 0,
        annualRevenue: options.annualRevenue !== undefined ? Number(options.annualRevenue) : 0,
        annualExpenses: options.annualExpenses !== undefined ? Number(options.annualExpenses) : 0,
        existingDebts: options.existingDebts !== undefined ? Number(options.existingDebts) : 0,

        // InovAgro
        equipmentName: options.equipmentName || options.inovagroEquipment,
        equipmentSpec: options.equipmentSpec || options.inovagroSpec,
        equipmentCapacity: options.equipmentCapacity || options.inovagroCapacity,
        systemPowerKw: options.systemPowerKw !== undefined ? Number(options.systemPowerKw) : (options.inovagroPower !== undefined ? Number(options.inovagroPower) : 0),
        cnaeCode: options.cnaeCode || options.inovagroCnae,
        estimatedMonthlySavings: options.estimatedMonthlySavings !== undefined ? Number(options.estimatedMonthlySavings) : (options.inovagroMonthlySavings !== undefined ? Number(options.inovagroMonthlySavings) : 0),

        // RenovAgro
        subline: options.subline || options.renovagroSubline,
        areaToRecoverHa: options.areaToRecoverHa !== undefined ? Number(options.areaToRecoverHa) : (options.renovagroAreaHa !== undefined ? Number(options.renovagroAreaHa) : 0),
        costPerHa: options.costPerHa !== undefined ? Number(options.costPerHa) : (options.renovagroCostPerHa !== undefined ? Number(options.renovagroCostPerHa) : (options.custeioCostPerHa !== undefined ? Number(options.custeioCostPerHa) : 0)),

        // Custeio Safra
        safraYear: options.safraYear || options.custeioSafraYear,
        cropName: options.cropName || options.custeioCropName,
        cropAreaHa: options.cropAreaHa !== undefined ? Number(options.cropAreaHa) : (options.custeioAreaHa !== undefined ? Number(options.custeioAreaHa) : 0),
        expectedYieldScHa: options.expectedYieldScHa !== undefined ? Number(options.expectedYieldScHa) : (options.custeioExpectedYield !== undefined ? Number(options.custeioExpectedYield) : 0),
        pricePerSc: options.pricePerSc !== undefined ? Number(options.pricePerSc) : (options.custeioPricePerUnit !== undefined ? Number(options.custeioPricePerUnit) : 0),

        // Template-specific resolved financial values
        totalInvestment: totalInv,
        financedAmount: finAmount,
        ownResources: ownRes,
        termYears: term,
        graceMonths: grace,
        interestRate: rate,
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
      throw new Error(`Modelo "${templateCode}" não possui gerador de HTML registrado.`)
  }

  return {
    html,
    templateMeta,
    producerName: producer.name,
    propertyName: property.propertyName || property.name || 'Fazenda'
  }
}

/**
 * Salva os parâmetros preenchidos pelo usuário no banco de dados para serem recuperados depois.
 */
export async function saveCreditProjectData(
  producerId: string,
  propertyId: string,
  templateCode: string,
  payload: Record<string, any>
) {
  const user = await getUserContext()
  if (!user) throw new Error('Não autorizado')

  const producer = await prisma.producer.findUnique({
    where: { id: producerId },
    select: { branchId: true }
  })
  if (!producer) throw new Error('Produtor não encontrado')

  const branchId = user.branchId || producer.branchId

  const existing = await prisma.generatedForm.findFirst({
    where: {
      producerId,
      propertyId: propertyId || null,
      templateCode,
      branchId,
    },
    orderBy: { createdAt: 'desc' }
  })

  const sanitized = sanitizePayload(payload)

  // Resolução estruturada dos valores financeiros oficiais
  const resolvedFinancedAmount = Number(
    sanitized.financedAmount ||
    sanitized.renovagroFinanced ||
    sanitized.inovagroFinanced ||
    (Number(sanitized.custeioAreaHa || 0) * Number(sanitized.custeioCostPerHa || 0)) ||
    (Number(sanitized.custeioQuantity || 0) * Number(sanitized.custeioUnitPrice || 0)) ||
    sanitized.amount ||
    sanitized.valorFinanciado ||
    sanitized.machineryValue ||
    sanitized.totalInvestment ||
    sanitized.requestedAmount ||
    0
  )
  if (resolvedFinancedAmount > 0) sanitized.financedAmount = resolvedFinancedAmount
  if (!sanitized.interestRate) {
    sanitized.interestRate = Number(
      sanitized.renovagroInterestRate ||
      sanitized.inovagroInterestRate ||
      sanitized.custeioInterestRate ||
      sanitized.interestRateAnnual ||
      5.0
    )
  }
  if (!sanitized.financialAgent) {
    sanitized.financialAgent = sanitized.targetBank || sanitized.creditLimitTargetBank || 'Banco do Brasil'
  }
  if (!sanitized.cropYear) {
    sanitized.cropYear = sanitized.custeioSafraYear || '2025/2026'
  }

  // Se o usuário preencheu/corrigiu dados cadastrais do imóvel no formulário, sincroniza com o cadastro da propriedade
  if (propertyId) {
    try {
      const propUpdate: any = {}
      if (sanitized.propertyRegistrationNumber !== undefined) {
        propUpdate.registrationNumber = sanitized.propertyRegistrationNumber
          ? maskRegistrationNumber(sanitized.propertyRegistrationNumber)
          : null
      }
      if (sanitized.propertyRegistryOffice !== undefined) {
        propUpdate.registryOffice = sanitized.propertyRegistryOffice || null
      }
      if (sanitized.propertyCar !== undefined) {
        propUpdate.car = sanitized.propertyCar ? maskCAR(sanitized.propertyCar) : null
      }
      if (sanitized.propertyCcir !== undefined) {
        propUpdate.ccir = sanitized.propertyCcir ? maskCCIR(sanitized.propertyCcir) : null
      }
      if (sanitized.propertyItr !== undefined) {
        propUpdate.itr = sanitized.propertyItr ? maskITR(sanitized.propertyItr) : null
      }
      if (sanitized.propertyTotalArea && Number(sanitized.propertyTotalArea) > 0) {
        propUpdate.totalArea = Number(sanitized.propertyTotalArea)
      }
      if (sanitized.propertyActivity !== undefined) {
        propUpdate.explorationActivity = sanitized.propertyActivity || null
      }

      if (sanitized.propertyAccessRoute !== undefined) {
        const cur = await prisma.property.findUnique({
          where: { id: propertyId },
          select: { possessionData: true }
        })
        const curPoss = (cur?.possessionData as any) || {}
        propUpdate.possessionData = {
          ...curPoss,
          accessRoute: sanitized.propertyAccessRoute || null
        }
      }

      if (sanitized.improvementsValue !== undefined || sanitized.machineryValue !== undefined || sanitized.estimatedLandValuePerHa !== undefined) {
        const cur = await prisma.property.findUnique({
          where: { id: propertyId },
          select: { improvements: true }
        })
        const curImp = (cur?.improvements as any) || {}
        propUpdate.improvements = {
          ...curImp,
          improvementsValue: sanitized.improvementsValue !== undefined ? Number(sanitized.improvementsValue) : curImp.improvementsValue,
          machineryValue: sanitized.machineryValue !== undefined ? Number(sanitized.machineryValue) : curImp.machineryValue,
          estimatedLandValuePerHa: sanitized.estimatedLandValuePerHa !== undefined ? Number(sanitized.estimatedLandValuePerHa) : curImp.estimatedLandValuePerHa,
        }
      }

      if (Object.keys(propUpdate).length > 0) {
        await prisma.property.update({
          where: { id: propertyId },
          data: propUpdate
        })
      }

      // Sincronizar Máquinas com o cadastro relacional da fazenda
      if (sanitized.machineryItems && Array.isArray(sanitized.machineryItems)) {
        await prisma.machinery.deleteMany({ where: { propertyId } })
        if (sanitized.machineryItems.length > 0) {
          await prisma.machinery.createMany({
            data: sanitized.machineryItems.map((m: any) => ({
              branchId,
              propertyId,
              specification: m.type || m.category || m.specification || 'Trator de Pneus',
              brand: m.brand || null,
              model: m.model || null,
              powerCapacity: m.powerCapacity || null,
              year: m.year ? Number(m.year) : null,
              chassisSerial: m.chassi || m.chassisSerial || null,
              participationPercent: m.participationPercent ? Number(m.participationPercent) : 100,
              value: m.value ? Number(m.value) : 0,
              hasLien: Boolean(m.hasLien),
              lienInstitution: m.lienInstitution || null,
            }))
          })
        }
      }

      // Sincronizar Benfeitorias com o cadastro relacional da fazenda
      if (payload.improvementItems && Array.isArray(payload.improvementItems)) {
        await prisma.improvement.deleteMany({ where: { propertyId } })
        if (payload.improvementItems.length > 0) {
          await prisma.improvement.createMany({
            data: payload.improvementItems.map((imp: any) => ({
              branchId,
              propertyId,
              specification: imp.specification || '',
              unit: imp.unit || 'm²',
              quantity: imp.quantity ? Number(imp.quantity) : 0,
              unitValue: imp.unitValue ? Number(imp.unitValue) : 0,
              observation: imp.conservationState ? `Estado: ${imp.conservationState}` : null,
            }))
          })
        }
      }

      // Sincronizar Semoventes com o cadastro relacional da fazenda
      if (payload.livestockItems && Array.isArray(payload.livestockItems)) {
        await prisma.livestock.deleteMany({ where: { propertyId } })
        if (payload.livestockItems.length > 0) {
          await prisma.livestock.createMany({
            data: payload.livestockItems.map((l: any) => {
              const catBB = normalizeCategoryBB(l.categoryBB || l.category)
              const purBB = normalizePurposeBB(l.purposeBB || l.purpose)
              return {
                branchId,
                propertyId,
                species: normalizeLivestockSpecies(l.species, catBB),
                category: normalizeLivestockCategory(l.category, catBB),
                categoryBB: catBB,
                purposeBB: purBB,
                purpose: l.purpose || denormalizePurposeBB(purBB),
                breed: l.breed || null,
                quantity: Number(l.quantity) || 0,
                ageMonths: l.ageMonths ? Number(l.ageMonths) : null,
                avgWeightKg: l.avgWeightKg ? Number(l.avgWeightKg) : null,
                unitValue: Number(l.unitValue) || 0,
                brandingType: l.brandingType || l.markingType || null,
                brandingLocation: l.brandingLocation || l.markingLocation || null,
                observation: l.observation || null,
              }
            })
          })
        }
      }
    } catch (e) {
      console.error('Error synchronizing property data from credit form:', e)
    }
  }

  // Se houver dados do produtor para atualizar, sincroniza com o cadastro do produtor
  if (producerId) {
    try {
      const prodUpdate: any = {}
      if (sanitized.producerPhone !== undefined) prodUpdate.phone = sanitized.producerPhone
      if (sanitized.producerEmail !== undefined) prodUpdate.email = sanitized.producerEmail
      if (sanitized.producerCivilStatus !== undefined) prodUpdate.civilStatus = sanitized.producerCivilStatus
      if (sanitized.producerMarriageRegime !== undefined) prodUpdate.marriageRegime = sanitized.producerMarriageRegime
      if (sanitized.producerSpouseName !== undefined) prodUpdate.spouseName = sanitized.producerSpouseName
      if (sanitized.producerSpouseCpf !== undefined) prodUpdate.spouseCpf = sanitized.producerSpouseCpf ? sanitized.producerSpouseCpf.replace(/\D/g, '') : null
      if (sanitized.producerSpouseRg !== undefined) prodUpdate.spouseRg = sanitized.producerSpouseRg
      if (sanitized.producerSpouseRgIssuer !== undefined) prodUpdate.spouseRgIssuer = sanitized.producerSpouseRgIssuer
      if (sanitized.producerSpouseNationality !== undefined) prodUpdate.spouseNationality = sanitized.producerSpouseNationality
      if (sanitized.producerSpouseEducationLevel !== undefined) prodUpdate.spouseEducationLevel = sanitized.producerSpouseEducationLevel
      if (sanitized.producerProfession !== undefined) prodUpdate.profession = sanitized.producerProfession
      if (sanitized.representativeCpf !== undefined) prodUpdate.representativeCpf = sanitized.representativeCpf ? sanitized.representativeCpf.replace(/\D/g, '') : null

      if (Object.keys(prodUpdate).length > 0) {
        await prisma.producer.update({
          where: { id: producerId },
          data: prodUpdate
        })
      }
    } catch (e) {
      console.error('Error synchronizing producer data from credit form:', e)
    }
  }

  if (existing) {
    const updated = await prisma.generatedForm.update({
      where: { id: existing.id },
      data: {
        payloadSnapshot: sanitized,
        createdAt: new Date(),
      }
    })
    return { success: true, id: updated.id }
  } else {
    const created = await prisma.generatedForm.create({
      data: {
        branchId,
        producerId,
        propertyId: propertyId || null,
        templateCode,
        templateVersion: 1,
        payloadSnapshot: sanitized,
      }
    })
    return { success: true, id: created.id }
  }
}

/**
 * Recupera os últimos parâmetros salvos para um produtor, imóvel e modelo.
 */
export async function getSavedCreditProjectData(
  producerId: string,
  propertyId: string,
  templateCode: string
) {
  const user = await getUserContext()
  if (!user) return null

  const existing = await prisma.generatedForm.findFirst({
    where: {
      producerId,
      propertyId: propertyId || null,
      templateCode,
    },
    orderBy: { createdAt: 'desc' }
  })

  return (existing?.payloadSnapshot as Record<string, any>) || null
}

/**
 * Registra formalmente um evento de emissão de documento (Projeto de Crédito / Declaração).
 * Sempre cria um novo registro em generated_forms com timestamp atual e sincroniza dados cadastrais.
 */
export async function recordDocumentEmission({
  producerId,
  propertyId,
  templateCode,
  payload,
  storagePdfPath,
  sha256Hash,
  demandId,
  fileName,
}: {
  producerId: string
  propertyId?: string
  templateCode: string
  payload: Record<string, any>
  storagePdfPath?: string
  sha256Hash?: string
  demandId?: string
  fileName?: string
}) {
  const user = await getUserContext()
  if (!user) throw new Error('Não autorizado')

  const producer = await prisma.producer.findUnique({
    where: { id: producerId },
    select: { 
      branchId: true,
      branch: {
        select: { organizationId: true }
      }
    }
  })
  if (!producer) throw new Error('Produtor não encontrado')

  // Resolver filial garantindo o isolamento multi-tenant da organização
  let branchId = user.branchId

  if (!branchId && user.organizationId) {
    if (producer.branch?.organizationId === user.organizationId && producer.branchId) {
      branchId = producer.branchId
    } else {
      const orgBranch = await prisma.branch.findFirst({
        where: { organizationId: user.organizationId, isActive: true },
        select: { id: true }
      })
      if (orgBranch) {
        branchId = orgBranch.id
      }
    }
  }

  if (!branchId) {
    branchId = producer.branchId
  }

  // Resolver valores financeiros estruturados a partir do payload
  const resolvedFinancedAmount = Number(
    payload.financedAmount ||
    payload.renovagroFinanced ||
    payload.inovagroFinanced ||
    (Number(payload.custeioAreaHa || 0) * Number(payload.custeioCostPerHa || 0)) ||
    (Number(payload.custeioQuantity || 0) * Number(payload.custeioUnitPrice || 0)) ||
    payload.amount ||
    payload.valorFinanciado ||
    payload.machineryValue ||
    payload.totalInvestment ||
    payload.requestedAmount ||
    0
  )

  const resolvedInterestRate = Number(
    payload.interestRate ||
    payload.renovagroInterestRate ||
    payload.inovagroInterestRate ||
    payload.custeioInterestRate ||
    payload.interestRateAnnual ||
    5.0
  )

  const resolvedFinancialAgent =
    payload.financialAgent ||
    payload.targetBank ||
    payload.creditLimitTargetBank ||
    'Banco do Brasil'

  const resolvedCropYear =
    payload.cropYear ||
    payload.custeioSafraYear ||
    '2025/2026'

  const enrichedPayload = {
    ...payload,
    financedAmount: resolvedFinancedAmount > 0 ? resolvedFinancedAmount : payload.financedAmount,
    interestRate: resolvedInterestRate,
    financialAgent: resolvedFinancialAgent,
    cropYear: resolvedCropYear,
  }

  // Criar registro permanente de emissão
  const emission = await prisma.generatedForm.create({
    data: {
      branchId: branchId!,
      producerId,
      propertyId: propertyId || null,
      templateCode,
      templateVersion: 1,
      payloadSnapshot: enrichedPayload,
      storagePdfPath: storagePdfPath || null,
      sha256Hash: sha256Hash || null,
    }
  })

  // Criar registro correspondente no GED (documents) se a entidade estiver disponível
  const resolvedFileName =
    fileName || storagePdfPath?.split('/').pop() || `${templateCode}_${Date.now()}.pdf`
  const targetBank = resolvedFinancialAgent

  let doc: any = null
  if (prisma.document?.create) {
    doc = await prisma.document.create({
      data: {
        branchId: branchId!,
        producerId,
        propertyId: propertyId || null,
        documentType: 'LAUDO_TECNICO',
        fileName: resolvedFileName,
        fileSize: 1024 * 50,
        mimeType: 'application/pdf',
        storagePath: storagePdfPath || `ged/credit-projects/${templateCode}/${Date.now()}_${resolvedFileName}`,
        complianceStatus: 'APPROVED',
        issueDate: new Date(),
        metadataPayload: {
          templateCode,
          sha256Hash: sha256Hash || emission.sha256Hash,
          emissionId: emission.id,
          financedAmount: resolvedFinancedAmount,
          interestRate: resolvedInterestRate,
          financialAgent: targetBank,
          cropYear: resolvedCropYear,
          demandId: demandId || null,
        },
      },
    })
  }

  // Localizar demanda alvo para vinculação bidirecional
  let targetDemand: any = null
  if (prisma.serviceDemand?.findUnique) {
    if (demandId) {
      targetDemand = await prisma.serviceDemand.findUnique({
        where: { id: demandId },
      })
    }

    // Se não foi informada demandId explicitamente, localiza demanda de crédito em aberto para o produtor
    if (!targetDemand && prisma.serviceDemand?.findFirst) {
      targetDemand = await prisma.serviceDemand.findFirst({
        where: {
          producerId,
          ...(propertyId ? { propertyId } : {}),
          status: { in: ['SOLICITADO', 'EM_EXECUCAO', 'AGUARDANDO_DOCUMENTACAO'] },
          serviceType: {
            in: ['PROJETO_CUSTEIO', 'PROJETO_INVESTIMENTO', 'LIMITE_CREDITO', 'PRORROGACAO_DIVIDAS'],
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }
  }

  // Integração com a demanda encontrada: atualiza vínculos e checklist
  if (targetDemand && doc) {
    console.log(`[Credit Project Emission] Vinculando emissão à demanda #${targetDemand.id.slice(-6).toUpperCase()} com valor financiado R$ ${resolvedFinancedAmount}`)

    const proposalRef =
      payload.proposalNumber ||
      payload.artNumber ||
      targetDemand.proposalId ||
      emission.id.slice(0, 8).toUpperCase()

    const financeFormatted =
      resolvedFinancedAmount > 0
        ? `R$ ${resolvedFinancedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : 'Conforme projeto'

    const projectNote = `[Projeto Emitido] Financiado: ${financeFormatted} | Banco: ${targetBank} | Doc: ${doc.fileName}`
    const updatedNotes = targetDemand.notes
      ? `${targetDemand.notes}\n${projectNote}`
      : projectNote

    if (prisma.serviceDemand?.update) {
      await prisma.serviceDemand.update({
        where: { id: targetDemand.id },
        data: {
          documentId: doc.id,
          proposalId: proposalRef,
          notes: updatedNotes,
        },
      })
    }

    // Auto-vincular no checklist da demanda
    if (prisma.demandChecklistItem?.findFirst) {
      const existingChecklistItem = await prisma.demandChecklistItem.findFirst({
        where: {
          demandId: targetDemand.id,
          OR: [
            { title: { contains: 'Projeto', mode: 'insensitive' } },
            { title: { contains: 'Custeio', mode: 'insensitive' } },
            { title: { contains: 'Dossiê', mode: 'insensitive' } },
            { title: { contains: 'Crédito', mode: 'insensitive' } },
            { documentType: 'LAUDO_TECNICO' },
            { isDelivered: false },
          ],
        },
      })

      if (existingChecklistItem && prisma.demandChecklistItem?.update) {
        await prisma.demandChecklistItem.update({
          where: { id: existingChecklistItem.id },
          data: {
            documentId: doc.id,
            isDelivered: true,
            deliveredAt: new Date(),
            notes: `Anexado automaticamente via Emissão do Projeto de Crédito (${templateCode}).`,
          },
        })
      } else if (prisma.demandChecklistItem?.create) {
        await prisma.demandChecklistItem.create({
          data: {
            demandId: targetDemand.id,
            title: `Projeto de Crédito Emitido (${templateCode})`,
            documentType: 'LAUDO_TECNICO',
            documentId: doc.id,
            isDelivered: true,
            deliveredAt: new Date(),
            notes: `Anexado automaticamente via Emissão do Projeto.`,
          },
        })
      }
    }

    // Registrar histórico da demanda
    if (prisma.serviceDemandHistory?.create) {
      await prisma.serviceDemandHistory.create({
        data: {
          demandId: targetDemand.id,
          userId: user.id,
          fromStatus: targetDemand.status,
          toStatus: targetDemand.status,
          notes: `Documento "${doc.fileName}" anexado automaticamente ao checklist. Valor financiado: ${financeFormatted}.`,
        },
      })
    }

    revalidatePath('/admin/demands')
    revalidatePath(`/admin/demands/${targetDemand.id}`)
  }

  // Sincronizar rascunho permanente em segundo plano sem bloquear a resposta ao usuário
  if (propertyId) {
    saveCreditProjectData(producerId, propertyId, templateCode, enrichedPayload).catch((err) => {
      console.error('Warning: could not sync draft during emission:', err)
    })
  }

  revalidatePath('/admin/documents/credit-projects')
  revalidatePath('/admin/dashboard/owner')
  return { 
    success: true, 
    id: emission.id, 
    documentId: doc?.id || null,
    sha256Hash: emission.sha256Hash,
    linkedDemandId: targetDemand?.id || null,
    financedAmount: resolvedFinancedAmount,
    interestRate: resolvedInterestRate,
    financialAgent: resolvedFinancialAgent,
    cropYear: resolvedCropYear,
  }
}

export interface CreditProjectHistoryItem {
  id: string
  templateCode: string
  templateName: string
  axis: 'CUSTEIO' | 'INVESTIMENTO' | 'PATRIMONIAL' | 'CHECKLIST'
  producerId: string
  producerName: string
  producerDocument: string
  propertyId?: string | null
  propertyName: string
  propertyCity?: string
  propertyState?: string
  createdAt: string
  sha256Hash?: string | null
  storagePdfPath?: string | null
  payloadSnapshot?: any
  totalAmount?: number
  financedAmount?: number
  creditLineName?: string

  // Vínculo e Rastreabilidade de Documento Oficial
  documentId?: string | null
  fileName?: string | null

  // 1. Vínculo com Demanda Operacional (Kanban)
  demandId?: string | null
  demandCode?: string | null
  demandStatus?: string | null
  demandStatusLabel?: string | null

  // 2. Vínculo com Limite de Crédito MCR
  mcrAnalysis?: {
    id: string
    cropYear: string
    icsdValue: number
    isIcsdApproved: boolean
    requestedAmount: number
  } | null

  // 3. Vínculo com Financeiro (ERP)
  financialTitle?: {
    id: string
    documentNumber: string
    status: string
    grossAmount: number
    financedAmount: number
    successFeePercent: number
  } | null

  // Detalhes Técnicos Expandidos para o Drawer
  technicalDetails?: {
    responsibleName?: string
    creaNumber?: string
    artNumber?: string
    interestRate?: number
    termYears?: number
    graceMonths?: number
    ownResources?: number
    targetBank?: string
    cropYear?: string
  }
}

/**
 * Lista o histórico de projetos de crédito emitidos ou salvos com suporte a filtros e busca.
 * Conecta cada projeto aos módulos de Demanda (Kanban), Limite MCR e Financeiro (ERP).
 */
export async function listCreditProjects(filters: {
  search?: string
  axis?: 'todos' | 'custeio' | 'investimento'
  templateCode?: string
} = {}): Promise<CreditProjectHistoryItem[]> {
  const user = await getUserContext()
  if (!user) return []

  const whereClause: any = {}
  if (user.branchId && user.role !== 'SUPER_ADMIN') {
    whereClause.branchId = user.branchId
  } else if (user.organizationId && user.role !== 'SUPER_ADMIN') {
    whereClause.branch = { organizationId: user.organizationId }
  }

  // Apenas templates de crédito (ignora minutas puramente jurídicas)
  whereClause.templateCode = {
    in: [
      'PROJETO_CUSTEIO_SAFRA',
      'PROJETO_RENOVAGRO',
      'PROJETO_INOVAGRO',
      'LIMITE_CREDITO_BB',
      'CHECKLIST_PROFISSIONAL',
    ]
  }

  if (filters.templateCode) {
    whereClause.templateCode = filters.templateCode
  }

  const forms = await prisma.generatedForm.findMany({
    where: whereClause,
    include: {
      producer: {
        select: { id: true, name: true, document: true }
      },
      property: {
        select: { id: true, name: true, propertyName: true, city: true, state: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  })

  if (forms.length === 0) return []

  // Coleta IDs únicos para consultas paralelas de alto desempenho
  const formIds = forms.map(f => f.id)
  const producerIds = Array.from(new Set(forms.map(f => f.producerId).filter(Boolean)))
  const propertyIds = Array.from(new Set(forms.map(f => f.propertyId).filter(Boolean))) as string[]

  // Identifica produtores relacionados (PF e PJ do mesmo titular/representante)
  const formProducerNames = Array.from(new Set(forms.map(f => f.producer?.name).filter(Boolean))) as string[]
  const formRepCpfs = Array.from(
    new Set(
      forms
        .map(f => (f.payloadSnapshot as any)?.representativeCpf?.replace(/\D/g, ''))
        .filter(Boolean)
    )
  )

  const relatedProducers = await prisma.producer.findMany({
    where: {
      OR: [
        { id: { in: producerIds } },
        ...(formProducerNames.length > 0 ? [{ name: { in: formProducerNames, mode: 'insensitive' as const } }] : []),
        ...(formRepCpfs.length > 0 ? [{ document: { in: formRepCpfs } }] : []),
      ],
    },
    select: { id: true, name: true, document: true },
  })

  const allRelatedProducerIds = Array.from(new Set([
    ...producerIds,
    ...relatedProducers.map(p => p.id),
  ]))

  // Helper de normalização de nomes de arquivos para correspondência precisa
  function normalizeDocName(pathOrName?: string | null): string {
    if (!pathOrName) return ''
    const filename = pathOrName.split('/').pop() || ''
    return filename
      .replace(/^\d+_/, '')
      .replace(/\.pdf$/i, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
  }

  // Consultas complementares em paralelo para enriquecer o histórico sem N+1 queries
  const [documents, demands, analyses, titles] = await Promise.all([
    prisma.document.findMany({
      where: {
        producerId: { in: allRelatedProducerIds },
      },
      select: {
        id: true,
        fileName: true,
        producerId: true,
        propertyId: true,
        metadataPayload: true,
        storagePath: true,
        documentType: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.serviceDemand.findMany({
      where: {
        producerId: { in: allRelatedProducerIds },
      },
      include: {
        producer: { select: { id: true, name: true, document: true } },
        checklistItems: {
          include: {
            document: {
              select: {
                id: true,
                fileName: true,
                storagePath: true,
                documentType: true,
                metadataPayload: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.creditAnalysis.findMany({
      where: {
        producerId: { in: allRelatedProducerIds },
      },
      select: {
        id: true,
        producerId: true,
        propertyId: true,
        cropYear: true,
        icsdValue: true,
        isIcsdApproved: true,
        requestedAmount: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.receivableTitle.findMany({
      where: {
        producerId: { in: allRelatedProducerIds },
        status: { not: 'CANCELADO' },
      },
      select: {
        id: true,
        documentNumber: true,
        producerId: true,
        propertyId: true,
        demandId: true,
        status: true,
        grossAmount: true,
        financedAmount: true,
        successFeePercent: true,
        notes: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const results: CreditProjectHistoryItem[] = forms.map(f => {
    const payload = (f.payloadSnapshot as any) || {}
    let axis: 'CUSTEIO' | 'INVESTIMENTO' | 'PATRIMONIAL' | 'CHECKLIST' = 'INVESTIMENTO'
    if (f.templateCode === 'PROJETO_CUSTEIO_SAFRA') axis = 'CUSTEIO'
    else if (f.templateCode === 'LIMITE_CREDITO_BB') axis = 'PATRIMONIAL'
    else if (f.templateCode === 'CHECKLIST_PROFISSIONAL') axis = 'CHECKLIST'

    const tmplMeta = CREDIT_TEMPLATES_REGISTRY.find(t => t.code === f.templateCode)

    // Cálculo universal de orçamento / valores projetados e financiados
    const custeioTotal = Number(
      (payload.custeioAreaHa && (payload.custeioCostPerHa || payload.custeioUnitPrice)
        ? payload.custeioAreaHa * (payload.custeioCostPerHa || payload.custeioUnitPrice)
        : 0) ||
      (payload.cropAreaHa && payload.costPerHa
        ? payload.cropAreaHa * payload.costPerHa
        : 0) ||
      payload.custeioTotalInvestment ||
      0
    )

    const totalAmount = Number(
      payload.totalInvestment ||
      payload.renovagroTotalInvestment ||
      payload.inovagroTotalInvestment ||
      custeioTotal ||
      0
    )

    const financedAmount = Number(
      payload.financedAmount ||
      payload.renovagroFinanced ||
      payload.inovagroFinanced ||
      payload.custeioFinanced ||
      (f.templateCode === 'PROJETO_CUSTEIO_SAFRA' ? custeioTotal : 0) ||
      0
    )

    const creditLineName =
      payload.creditLineName ||
      payload.renovagroSubline ||
      payload.inovagroEquipment ||
      (f.templateCode === 'PROJETO_CUSTEIO_SAFRA'
        ? `Custeio Agrícola (${payload.custeioCropName || 'Grãos'}) • Safra ${payload.custeioSafraYear || '2026/2027'}`
        : undefined)

    const formDocNorm = normalizeDocName(f.storagePdfPath)

    // 1. Identificar Documento emitido correspondente
    const matchingDoc = documents.find(d => {
      const meta = (d.metadataPayload as any) || {}
      if (meta.emissionId === f.id || meta.formId === f.id) return true
      if (f.storagePdfPath && d.storagePath === f.storagePdfPath) return true
      if (f.sha256Hash && meta.sha256Hash === f.sha256Hash) return true
      const docNorm = normalizeDocName(d.fileName)
      if (formDocNorm && docNorm && (formDocNorm === docNorm || formDocNorm.includes(docNorm) || docNorm.includes(formDocNorm))) return true
      return false
    }) || documents.find(d => d.producerId === f.producerId && (d.metadataPayload as any)?.templateCode === f.templateCode)

    const documentId = matchingDoc?.id || payload.documentId || null
    const fileName = matchingDoc?.fileName || (f.storagePdfPath ? f.storagePdfPath.split('/').pop()?.replace(/^\d+_/, '') : null)

    // 2. Identificar Vínculo com Demanda Operacional
    let matchedDemand = demands.find(d => {
      // Vínculo explícito por ID
      if (payload.demandId && d.id === payload.demandId) return true
      if (payload.linkedDemandId && d.id === payload.linkedDemandId) return true
      if (matchingDoc && (matchingDoc.metadataPayload as any)?.demandId === d.id) return true
      if (documentId && d.documentId === documentId) return true
      if (documentId && d.checklistItems?.some(ci => ci.documentId === documentId)) return true

      // Vínculo por anexo do checklist de documentos
      if (formDocNorm) {
        for (const item of d.checklistItems) {
          if (item.document?.fileName) {
            const itemDocNorm = normalizeDocName(item.document.fileName)
            if (itemDocNorm && (itemDocNorm === formDocNorm || itemDocNorm.includes(formDocNorm) || formDocNorm.includes(itemDocNorm))) {
              return true
            }
          }
        }
      }

      // Vínculo contextual por Produtor (PF/PJ) + Tipo de Serviço
      const sameProducerName = d.producer?.name && f.producer?.name &&
        d.producer.name.trim().toLowerCase() === f.producer.name.trim().toLowerCase()
      const repCpf = (payload.representativeCpf || '').replace(/\D/g, '')
      const prodDoc = (d.producer?.document || '').replace(/\D/g, '')
      const sameRep = Boolean(repCpf && prodDoc && repCpf === prodDoc)

      const isCusteio = f.templateCode === 'PROJETO_CUSTEIO_SAFRA' && d.serviceType === 'PROJETO_CUSTEIO'
      const isRenovAgro = f.templateCode === 'PROJETO_RENOVAGRO' && (d.serviceType === 'LAUDO_TECNICO' || (d.serviceType as string) === 'PROJETO_INVESTIMENTO' || (d.serviceType as string) === 'RENOVAGRO' || (d.customServiceType && d.customServiceType.toLowerCase().includes('renovagro')))

      if ((sameProducerName || sameRep) && (isCusteio || isRenovAgro)) {
        return true
      }

      return false
    })

    const demandId = matchedDemand?.id || payload.demandId || null
    const demandCode = demandId ? demandId.slice(-6).toUpperCase() : null
    const demandStatus = matchedDemand?.status || null
    const demandStatusLabel = demandStatus ? (DEMAND_STATUS_METAS as any)[demandStatus]?.label || demandStatus : null

    // 3. Identificar Limite MCR / ICSD recente
    const matchedAnalysis =
      analyses.find(a => (a.producerId === f.producerId || allRelatedProducerIds.includes(a.producerId)) && a.propertyId === f.propertyId) ||
      analyses.find(a => a.producerId === f.producerId || allRelatedProducerIds.includes(a.producerId))

    const mcrAnalysis = matchedAnalysis ? {
      id: matchedAnalysis.id,
      cropYear: matchedAnalysis.cropYear,
      icsdValue: Number(matchedAnalysis.icsdValue),
      isIcsdApproved: Boolean(matchedAnalysis.isIcsdApproved),
      requestedAmount: Number(matchedAnalysis.requestedAmount),
    } : null

    // 4. Identificar Vínculo com Financeiro (ERP)
    const matchedTitle = titles.find(t => {
      if (payload.receivableTitleId && t.id === payload.receivableTitleId) return true
      if (demandId && t.demandId === demandId) return true
      if (t.notes?.includes(f.id)) return true
      if ((t.producerId === f.producerId || allRelatedProducerIds.includes(t.producerId)) && financedAmount > 0 && Math.abs(Number(t.financedAmount || 0) - financedAmount) < 1) return true
      return false
    })

    const financialTitle = matchedTitle ? {
      id: matchedTitle.id,
      documentNumber: matchedTitle.documentNumber,
      status: matchedTitle.status,
      grossAmount: Number(matchedTitle.grossAmount),
      financedAmount: Number(matchedTitle.financedAmount || 0),
      successFeePercent: Number(matchedTitle.successFeePercent || 0),
    } : null

    // 5. Detalhes Técnicos Expandidos para o Drawer
    const ownResources = Number(
      payload.renovagroOwnResources ||
      payload.inovagroOwnResources ||
      (totalAmount > 0 && financedAmount > 0 ? Math.max(0, totalAmount - financedAmount) : 0)
    )

    const technicalDetails = {
      responsibleName: payload.responsibleName || payload.technicalResponsibleName || 'Não informado',
      creaNumber: payload.creaNumber || payload.crea || 'Não informado',
      artNumber: payload.artNumber || payload.art || 'Não informado',
      interestRate: Number(payload.renovagroInterestRate || payload.inovagroInterestRate || payload.custeioInterestRate || payload.interestRate || 5),
      termYears: Number(payload.renovagroTermYears || payload.inovagroTermYears || (payload.custeioTermMonths ? Math.round(payload.custeioTermMonths / 12) : 1) || 10),
      graceMonths: Number(payload.renovagroGraceMonths || payload.inovagroGraceMonths || 0),
      ownResources,
      targetBank: payload.targetBank || payload.financialAgent || 'Banco do Brasil',
      cropYear: payload.custeioSafraYear || payload.cropYear || '2025/2026',
    }

    return {
      id: f.id,
      templateCode: f.templateCode,
      templateName: tmplMeta?.title || f.templateCode,
      axis,
      producerId: f.producerId,
      producerName: f.producer?.name || 'Produtor',
      producerDocument: f.producer?.document || '',
      propertyId: f.propertyId,
      propertyName: f.property?.propertyName || f.property?.name || 'Imóvel Rural',
      propertyCity: f.property?.city || undefined,
      propertyState: f.property?.state || undefined,
      createdAt: f.createdAt.toISOString(),
      sha256Hash: f.sha256Hash,
      storagePdfPath: f.storagePdfPath,
      payloadSnapshot: payload,
      totalAmount,
      financedAmount,
      creditLineName,
      documentId,
      fileName,
      demandId,
      demandCode,
      demandStatus,
      demandStatusLabel,
      mcrAnalysis,
      financialTitle,
      technicalDetails,
    }
  })

  // Filtros locais de busca e eixo
  let filtered = results
  if (filters.axis && filters.axis !== 'todos') {
    const target = filters.axis.toUpperCase()
    filtered = filtered.filter(item => item.axis === target)
  }

  if (filters.search) {
    const q = filters.search.toLowerCase()
    filtered = filtered.filter(item =>
      item.producerName.toLowerCase().includes(q) ||
      item.propertyName.toLowerCase().includes(q) ||
      item.templateName.toLowerCase().includes(q) ||
      (item.creditLineName && item.creditLineName.toLowerCase().includes(q))
    )
  }

  return filtered
}

/**
 * Consulta demandas ativas de um produtor para vincular a um projeto emitido.
 */
export async function getActiveDemandsForProducer(producerId: string) {
  try {
    const user = await getUserContext()
    if (!user) throw new Error('Não autorizado')

    // Encontra o produtor e eventuais produtores correlatos (ex: PF do representante da PJ ou mesmo nome)
    const baseProducer = await prisma.producer.findUnique({
      where: { id: producerId },
      select: { id: true, name: true, document: true, representativeCpf: true },
    })

    const relatedIds = [producerId]
    if (baseProducer) {
      const cleanRepCpf = (baseProducer.representativeCpf || '').replace(/\D/g, '')
      const related = await prisma.producer.findMany({
        where: {
          OR: [
            { name: { equals: baseProducer.name, mode: 'insensitive' } },
            ...(cleanRepCpf ? [{ document: cleanRepCpf }] : []),
          ],
        },
        select: { id: true },
      })
      for (const r of related) {
        if (!relatedIds.includes(r.id)) relatedIds.push(r.id)
      }
    }

    const demands = await prisma.serviceDemand.findMany({
      where: {
        producerId: { in: relatedIds },
        status: { in: ['SOLICITADO', 'EM_EXECUCAO', 'AGUARDANDO_DOCUMENTACAO', 'CONCLUIDO'] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        serviceType: true,
        customServiceType: true,
        status: true,
        notes: true,
        proposalId: true,
        createdAt: true,
        property: {
          select: { id: true, name: true, propertyName: true },
        },
      },
    })

    return { success: true, demands }
  } catch (error: any) {
    console.error('[getActiveDemandsForProducer] Erro:', error)
    return { success: false, error: error?.message || 'Falha ao buscar demandas ativas', demands: [] }
  }
}

/**
 * Cria uma nova Demanda Técnica no Kanban a partir do projeto emitido,
 * anexando o PDF ao checklist com financedAmount registrado e vínculo bidirecional no histórico.
 */
export async function createDemandFromCreditProject({
  formId,
  producerId,
  propertyId,
  templateCode,
  financedAmount,
  documentId,
  storagePdfPath,
  fileName,
  financialAgent,
  interestRate,
  cropYear,
}: {
  formId?: string
  producerId: string
  propertyId?: string
  templateCode: string
  financedAmount: number
  documentId?: string
  storagePdfPath?: string
  fileName?: string
  financialAgent?: string
  interestRate?: number
  cropYear?: string
}) {
  try {
    const user = await getUserContext()
    if (!user) throw new Error('Não autorizado')

    const producer = await prisma.producer.findUnique({
      where: { id: producerId },
      select: { branchId: true, branch: { select: { organizationId: true } } },
    })
    if (!producer) throw new Error('Produtor não encontrado')

    let branchId = user.branchId || producer.branchId

    // Mapeamento do templateCode para o tipo de serviço rural
    let serviceType: 'PROJETO_CUSTEIO' | 'PROJETO_INVESTIMENTO' | 'LIMITE_CREDITO' = 'PROJETO_INVESTIMENTO'
    if (templateCode.includes('CUSTEIO')) {
      serviceType = 'PROJETO_CUSTEIO'
    } else if (templateCode.includes('LIMITE')) {
      serviceType = 'LIMITE_CREDITO'
    }

    const formattedAmount =
      financedAmount > 0
        ? `R$ ${financedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : 'R$ 0,00'

    const noteText = `[Projeto Emitido] Financiado: ${formattedAmount} | Taxa: ${interestRate || 5.0}% a.a. | Banco: ${financialAgent || 'Banco do Brasil'} | Safra: ${cropYear || '2025/2026'}`

    // Se documentId não foi explicitado, busca documento emitido correspondente ao formId
    let resolvedDocId = documentId
    let resolvedFileName = fileName
    if (!resolvedDocId && formId) {
      const candidateDocs = await prisma.document.findMany({
        where: { producerId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
      const foundDoc = candidateDocs.find(d => {
        const meta = (d.metadataPayload as any) || {}
        return meta.emissionId === formId || meta.templateCode === templateCode
      })
      if (foundDoc) {
        resolvedDocId = foundDoc.id
        if (!resolvedFileName) resolvedFileName = foundDoc.fileName
      }
    }

    // 1. Criar Demanda no Kanban
    const demand = await prisma.serviceDemand.create({
      data: {
        branchId,
        createdById: user.id,
        producerId,
        propertyId: propertyId || null,
        serviceType,
        status: 'SOLICITADO',
        priority: 'MEDIA',
        documentId: resolvedDocId || null,
        description: `Elaboração e protocolo de projeto de crédito rural (${templateCode}) no valor de ${formattedAmount}.`,
        notes: noteText,
        requestDate: new Date(),
        estimatedDeliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
      },
    })

    // 2. Histórico da Demanda
    await prisma.serviceDemandHistory.create({
      data: {
        demandId: demand.id,
        userId: user.id,
        fromStatus: null,
        toStatus: 'SOLICITADO',
        notes: `Demanda criada automaticamente a partir do Histórico de Projetos de Crédito (${templateCode}). Valor financiado: ${formattedAmount}.`,
      },
    })

    // 3. Adicionar item no checklist com o PDF anexado
    await prisma.demandChecklistItem.create({
      data: {
        demandId: demand.id,
        title: `Projeto Técnico Emitido (${templateCode})`,
        documentType: 'LAUDO_TECNICO',
        documentId: resolvedDocId || null,
        isRequired: true,
        isDelivered: Boolean(resolvedDocId),
        deliveredAt: resolvedDocId ? new Date() : null,
        notes: `Documento "${resolvedFileName || 'Projeto.pdf'}" anexado automaticamente na emissão.`,
      },
    })

    // 4. Se o Document existe, sincroniza o demandId em seu metadataPayload
    if (resolvedDocId) {
      const doc = await prisma.document.findUnique({ where: { id: resolvedDocId } })
      if (doc) {
        const existingMeta = (doc.metadataPayload as any) || {}
        await prisma.document.update({
          where: { id: resolvedDocId },
          data: {
            metadataPayload: {
              ...existingMeta,
              demandId: demand.id,
            },
          },
        })
      }
    }

    // 5. Se o formId foi fornecido, persiste o demandId no GeneratedForm para rastreabilidade imediata
    if (formId) {
      const form = await prisma.generatedForm.findUnique({ where: { id: formId } })
      if (form) {
        const existingSnap = (form.payloadSnapshot as any) || {}
        await prisma.generatedForm.update({
          where: { id: formId },
          data: {
            payloadSnapshot: {
              ...existingSnap,
              demandId: demand.id,
            },
          },
        })
      }
    }

    revalidatePath('/admin/documents/credit-projects')
    revalidatePath('/admin/demands')
    revalidatePath(`/admin/demands/${demand.id}`)

    return {
      success: true,
      demandId: demand.id,
    }
  } catch (error: any) {
    console.error('[createDemandFromCreditProject] Erro:', error)
    return {
      success: false,
      error: error?.message || 'Falha ao criar demanda a partir do projeto',
    }
  }
}

/**
 * Vincula o projeto emitido a uma demanda em aberto.
 */
export async function linkProjectToExistingDemand({
  formId,
  demandId,
  documentId,
  templateCode,
  financedAmount,
  fileName,
  financialAgent,
  interestRate,
  cropYear,
}: {
  formId?: string
  demandId: string
  documentId?: string
  templateCode: string
  financedAmount: number
  fileName?: string
  financialAgent?: string
  interestRate?: number
  cropYear?: string
}) {
  try {
    const user = await getUserContext()
    if (!user) throw new Error('Não autorizado')

    const demand = await prisma.serviceDemand.findUnique({
      where: { id: demandId },
    })
    if (!demand) throw new Error('Demanda não encontrada')

    const formattedAmount =
      financedAmount > 0
        ? `R$ ${financedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : 'R$ 0,00'

    const noteText = `[Projeto Vinculado] Financiado: ${formattedAmount} | Taxa: ${interestRate || 5.0}% a.a. | Banco: ${financialAgent || 'Banco do Brasil'} | Safra: ${cropYear || '2025/2026'}`
    const updatedNotes = demand.notes ? `${demand.notes}\n${noteText}` : noteText

    // Se documentId não foi explicitado, busca documento correspondente
    let resolvedDocId = documentId
    let resolvedFileName = fileName
    if (!resolvedDocId && formId) {
      const candidateDocs = await prisma.document.findMany({
        where: { producerId: demand.producerId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
      const foundDoc = candidateDocs.find(d => {
        const meta = (d.metadataPayload as any) || {}
        return meta.emissionId === formId || meta.templateCode === templateCode
      })
      if (foundDoc) {
        resolvedDocId = foundDoc.id
        if (!resolvedFileName) resolvedFileName = foundDoc.fileName
      }
    }

    await prisma.serviceDemand.update({
      where: { id: demandId },
      data: {
        documentId: resolvedDocId || demand.documentId,
        notes: updatedNotes,
      },
    })

    // Vincular ou criar item de checklist
    if (resolvedDocId) {
      const existingItem = await prisma.demandChecklistItem.findFirst({
        where: {
          demandId,
          OR: [
            { title: { contains: 'Projeto', mode: 'insensitive' } },
            { title: { contains: 'Dossiê', mode: 'insensitive' } },
            { documentType: 'LAUDO_TECNICO' },
          ],
        },
      })

      if (existingItem) {
        await prisma.demandChecklistItem.update({
          where: { id: existingItem.id },
          data: {
            documentId: resolvedDocId,
            isDelivered: true,
            deliveredAt: new Date(),
            notes: `Projeto vinculado automaticamente (${templateCode}).`,
          },
        })
      } else {
        await prisma.demandChecklistItem.create({
          data: {
            demandId,
            title: `Projeto Técnico Emitido (${templateCode})`,
            documentType: 'LAUDO_TECNICO',
            documentId: resolvedDocId,
            isRequired: true,
            isDelivered: true,
            deliveredAt: new Date(),
            notes: `Documento "${resolvedFileName || 'Projeto.pdf'}" vinculado automaticamente.`,
          },
        })
      }

      // Atualizar metadados do documento com demandId
      const doc = await prisma.document.findUnique({ where: { id: resolvedDocId } })
      if (doc) {
        const existingMeta = (doc.metadataPayload as any) || {}
        await prisma.document.update({
          where: { id: resolvedDocId },
          data: {
            metadataPayload: {
              ...existingMeta,
              demandId,
            },
          },
        })
      }
    }

    // Persistir demandId no GeneratedForm se formId fornecido
    if (formId) {
      const form = await prisma.generatedForm.findUnique({ where: { id: formId } })
      if (form) {
        const existingSnap = (form.payloadSnapshot as any) || {}
        await prisma.generatedForm.update({
          where: { id: formId },
          data: {
            payloadSnapshot: {
              ...existingSnap,
              demandId,
            },
          },
        })
      }
    }

    // Histórico da demanda
    await prisma.serviceDemandHistory.create({
      data: {
        demandId,
        userId: user.id,
        fromStatus: demand.status,
        toStatus: demand.status,
        notes: `Projeto Técnico (${templateCode}) de ${formattedAmount} vinculado à demanda com sucesso.`,
      },
    })

    revalidatePath('/admin/documents/credit-projects')
    revalidatePath('/admin/demands')
    revalidatePath(`/admin/demands/${demandId}`)

    return { success: true, demandId }
  } catch (error: any) {
    console.error('[linkProjectToExistingDemand] Erro:', error)
    return {
      success: false,
      error: error?.message || 'Falha ao vincular projeto à demanda',
    }
  }
}

/**
 * Fatura honorários de êxito diretamente no ERP a partir do Projeto Técnico de Crédito.
 * Cria o Título a Receber com documentNumber FAT-YYYY-XXXX e parcela a vencer.
 */
export async function createProjectReceivableTitle({
  formId,
  producerId,
  propertyId,
  demandId,
  templateCode,
  financedAmount,
  successFeePercent = 2.0,
  dueDate,
  notes,
}: {
  formId?: string
  producerId: string
  propertyId?: string
  demandId?: string
  templateCode: string
  financedAmount: number
  successFeePercent?: number
  dueDate?: string
  notes?: string
}) {
  try {
    const user = await getUserContext()
    if (!user) throw new Error('Não autorizado')

    const producer = await prisma.producer.findUnique({
      where: { id: producerId },
      include: {
        branch: {
          include: {
            organization: true,
          },
        },
      },
    })
    if (!producer) throw new Error('Produtor não encontrado')

    const branchId = user.branchId || producer.branchId
    const organizationId = producer.branch.organizationId

    // 1. Categoria Financeira Padrão (Honorários de Crédito Rural)
    let category = await prisma.financialCategory.findFirst({
      where: {
        organizationId,
        code: '1.1.01',
        isActive: true,
      },
    })

    if (!category) {
      category = await prisma.financialCategory.findFirst({
        where: {
          organizationId,
          type: 'RECEITA',
          isActive: true,
        },
      })
    }

    if (!category) {
      category = await prisma.financialCategory.create({
        data: {
          organizationId,
          code: '1.1.01',
          name: 'Honorários de Crédito Rural',
          type: 'RECEITA',
          isActive: true,
        },
      })
    }

    // 2. Cálculo dos Honorários
    const safeFeePercent = successFeePercent > 0 ? successFeePercent : 2.0
    const calculatedGross = financedAmount > 0 ? financedAmount * (safeFeePercent / 100) : 1000
    const grossAmount = calculatedGross > 0 ? calculatedGross : 1000

    // 3. Sequencial do Documento (FAT-YYYY-XXXX)
    const currentYear = new Date().getFullYear()
    const titlesCount = await prisma.receivableTitle.count({
      where: { branchId },
    })
    const docSeq = String(titlesCount + 1).padStart(4, '0')
    const documentNumber = `FAT-${currentYear}-${docSeq}`

    const parsedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // 4. Criação atômica no banco de dados
    const result = await prisma.$transaction(async (tx) => {
      const title = await tx.receivableTitle.create({
        data: {
          branchId,
          producerId,
          propertyId: propertyId || null,
          demandId: demandId || null,
          categoryId: category!.id,
          originType: 'ESTEIRA_CREDITO',
          serviceSubtype: templateCode,
          documentNumber,
          cropYear: '2025/2026',
          financedAmount: financedAmount > 0 ? new Prisma.Decimal(financedAmount) : null,
          successFeePercent: new Prisma.Decimal(safeFeePercent),
          grossAmount: new Prisma.Decimal(grossAmount),
          discountAmount: new Prisma.Decimal(0),
          netAmount: new Prisma.Decimal(grossAmount),
          totalReceivedAmount: new Prisma.Decimal(0),
          status: 'PENDENTE',
          notes:
            notes ||
            `Faturamento direto do Projeto Técnico (${templateCode}). Honorários de ${safeFeePercent}% sobre R$ ${financedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
        },
      })

      const installment = await tx.receivableInstallment.create({
        data: {
          receivableTitleId: title.id,
          installmentNumber: 1,
          totalInstallments: 1,
          dueDate: parsedDueDate,
          amount: new Prisma.Decimal(grossAmount),
          receivedAmount: new Prisma.Decimal(0),
          status: 'A_VENCER',
        },
      })

      return { title, installment }
    })

    // 5. Vincular no GeneratedForm se formId fornecido
    if (formId) {
      const form = await prisma.generatedForm.findUnique({ where: { id: formId } })
      if (form) {
        const snap = (form.payloadSnapshot as any) || {}
        await prisma.generatedForm.update({
          where: { id: formId },
          data: {
            payloadSnapshot: {
              ...snap,
              receivableTitleId: result.title.id,
              receivableDocumentNumber: result.title.documentNumber,
            },
          },
        })
      }
    }

    revalidatePath('/admin/documents/credit-projects')
    revalidatePath('/admin/financial/receivables')
    revalidatePath('/admin/financial/overview')

    return {
      success: true,
      titleId: result.title.id,
      documentNumber: result.title.documentNumber,
      grossAmount,
    }
  } catch (error: any) {
    console.error('[createProjectReceivableTitle] Erro:', error)
    return {
      success: false,
      error: error?.message || 'Falha ao faturar honorários no ERP',
    }
  }
}


