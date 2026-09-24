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
import {
  normalizeCategoryBB,
  normalizePurposeBB,
  normalizeLivestockCategory,
  normalizeLivestockSpecies,
  denormalizePurposeBB,
} from '@/lib/validations/livestock-mapper'

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

  // Se o usuário preencheu/corrigiu dados cadastrais do imóvel no formulário, sincroniza com o cadastro da propriedade
  if (propertyId) {
    try {
      const propUpdate: any = {}
      if (payload.propertyRegistrationNumber) propUpdate.registrationNumber = payload.propertyRegistrationNumber
      if (payload.propertyRegistryOffice) propUpdate.registryOffice = payload.propertyRegistryOffice
      if (payload.propertyCar) propUpdate.car = payload.propertyCar
      if (payload.propertyCcir) propUpdate.ccir = payload.propertyCcir
      if (payload.propertyItr) propUpdate.itr = payload.propertyItr
      if (payload.propertyTotalArea && Number(payload.propertyTotalArea) > 0) propUpdate.totalArea = Number(payload.propertyTotalArea)
      if (payload.propertyActivity) propUpdate.explorationActivity = payload.propertyActivity

      if (payload.propertyAccessRoute) {
        const cur = await prisma.property.findUnique({
          where: { id: propertyId },
          select: { possessionData: true }
        })
        const curPoss = (cur?.possessionData as any) || {}
        propUpdate.possessionData = {
          ...curPoss,
          accessRoute: payload.propertyAccessRoute
        }
      }

      if (payload.improvementsValue || payload.machineryValue || payload.estimatedLandValuePerHa) {
        const cur = await prisma.property.findUnique({
          where: { id: propertyId },
          select: { improvements: true }
        })
        const curImp = (cur?.improvements as any) || {}
        propUpdate.improvements = {
          ...curImp,
          improvementsValue: payload.improvementsValue !== undefined ? Number(payload.improvementsValue) : curImp.improvementsValue,
          machineryValue: payload.machineryValue !== undefined ? Number(payload.machineryValue) : curImp.machineryValue,
          estimatedLandValuePerHa: payload.estimatedLandValuePerHa !== undefined ? Number(payload.estimatedLandValuePerHa) : curImp.estimatedLandValuePerHa,
        }
      }

      if (Object.keys(propUpdate).length > 0) {
        await prisma.property.update({
          where: { id: propertyId },
          data: propUpdate
        })
      }

      // Sincronizar Máquinas com o cadastro relacional da fazenda
      if (payload.machineryItems && Array.isArray(payload.machineryItems)) {
        await prisma.machinery.deleteMany({ where: { propertyId } })
        if (payload.machineryItems.length > 0) {
          await prisma.machinery.createMany({
            data: payload.machineryItems.map((m: any) => ({
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
      if (payload.producerPhone) prodUpdate.phone = payload.producerPhone
      if (payload.producerEmail) prodUpdate.email = payload.producerEmail
      if (payload.producerCivilStatus) prodUpdate.civilStatus = payload.producerCivilStatus
      if (payload.producerMarriageRegime) prodUpdate.marriageRegime = payload.producerMarriageRegime
      if (payload.producerSpouseName) prodUpdate.spouseName = payload.producerSpouseName
      if (payload.producerSpouseCpf) prodUpdate.spouseCpf = payload.producerSpouseCpf
      if (payload.producerSpouseRg) prodUpdate.spouseRg = payload.producerSpouseRg
      if (payload.producerSpouseRgIssuer) prodUpdate.spouseRgIssuer = payload.producerSpouseRgIssuer
      if (payload.producerSpouseNationality) prodUpdate.spouseNationality = payload.producerSpouseNationality
      if (payload.producerSpouseEducationLevel) prodUpdate.spouseEducationLevel = payload.producerSpouseEducationLevel
      if (payload.producerProfession) prodUpdate.profession = payload.producerProfession
      if (payload.representativeCpf) prodUpdate.representativeCpf = payload.representativeCpf

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
        payloadSnapshot: payload,
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
        payloadSnapshot: payload,
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
}: {
  producerId: string
  propertyId?: string
  templateCode: string
  payload: Record<string, any>
  storagePdfPath?: string
}) {
  const user = await getUserContext()
  if (!user) throw new Error('Não autorizado')

  const producer = await prisma.producer.findUnique({
    where: { id: producerId },
    select: { branchId: true }
  })
  if (!producer) throw new Error('Produtor não encontrado')

  const branchId = user.branchId || producer.branchId

  // Sincronizar rascunho permanente se houver
  if (propertyId) {
    await saveCreditProjectData(producerId, propertyId, templateCode, payload).catch((err) => {
      console.error('Warning: could not sync draft during emission:', err)
    })
  }

  // Criar registro permanente de emissão para alimentar o painel SaaS de franquia e histórico
  const emission = await prisma.generatedForm.create({
    data: {
      branchId,
      producerId,
      propertyId: propertyId || null,
      templateCode,
      templateVersion: 1,
      payloadSnapshot: payload,
      storagePdfPath: storagePdfPath || null,
    }
  })

  return { success: true, id: emission.id }
}

