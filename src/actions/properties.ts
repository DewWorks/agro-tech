'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { handleServerError } from '@/lib/errorHandler'
import { getUserContext } from '@/lib/auth'
import { OwnershipType } from '@prisma/client'
import {
  normalizeCategoryBB,
  normalizePurposeBB,
  normalizeLivestockCategory,
  normalizeLivestockSpecies,
  denormalizePurposeBB,
} from '@/lib/validations/livestock-mapper'

function parseCoordinate(coordStr?: string | number | null): number | null {
  if (coordStr === undefined || coordStr === null || coordStr === '') return null
  if (typeof coordStr === 'number') return isNaN(coordStr) ? null : coordStr
  const str = String(coordStr).trim()
  if (!str) return null

  const num = Number(str)
  if (!isNaN(num)) {
    return num
  }

  const match = str.match(/(\d+)[°\s]+(\d+)['\s]+([\d.]+)?["\s]*([NSEOWLnseowl])?/i)
  if (match) {
    const deg = parseFloat(match[1]) || 0
    const min = parseFloat(match[2]) || 0
    const sec = parseFloat(match[3]) || 0
    const dir = (match[4] || '').toUpperCase()
    let dec = deg + min / 60 + sec / 3600
    if (dir === 'S' || dir === 'O' || dir === 'W') {
      dec = -dec
    }
    return isNaN(dec) ? null : dec
  }

  const parsed = parseFloat(str)
  return isNaN(parsed) ? null : parsed
}

function parseSeizureStatus(val?: string | null): any {
  const valid = ['PENHORAVEL', 'IMPENHORAVEL_PEQUENA_PROP', 'IMPENHORAVEL_BEM_FAMILIA', 'IMPENHORAVEL_OUTROS']
  return val && valid.includes(val) ? val : undefined
}

function parseConservationState(val?: string | null): any {
  const valid = ['RUIM', 'REGULAR', 'BOM', 'OTIMO', 'SEM_VISTORIA', 'ABANDONADO', 'NOVO', 'USADO']
  return val && valid.includes(val) ? val : undefined
}

export async function createProperty(data: any) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) {
      throw new Error('Não autenticado')
    }
    const isSuperAdmin = dbUser.role === 'SUPER_ADMIN' || Boolean(dbUser.isSuperAdminImpersonating)
    if (!isSuperAdmin && !dbUser.organizationId) {
      throw new Error('Usuário sem organização')
    }

    const {
      name,
      propertyName,
      branchId,
      city,
      state,
      latitude,
      longitude,

      // Produtor Titular Vinculado
      producerId,
      ownershipType = 'PROPRIETARIO',
      explorationPercentage = 100,
      contractStartDate,
      contractEndDate,
      landlordName,
      landlordDocument,
      contractType,
      exploredAreaHa,

      // Status da Propriedade
      propertyStatus,
      financialStatus,

      // Áreas (ha)
      totalArea,
      consolidatedArea,
      productiveArea,
      pastureArea,
      preserveArea,
      ruralModules,
      vtnPerHectare,
      vtnValuePerHa,
      totalLandValue,
      totalVtnAmount,

      // Documentação Fundiária
      registrationNumber,
      registryOffice,
      comarca,
      car,
      ccir,
      itr,

      // Posse & Exploração
      possessionYears,
      explorationActivity,

      // Localização e Acesso
      accessRoute,
      confrontants,
      confrontantNorth,
      confrontantSouth,
      confrontantEast,
      confrontantWest,

      // Indicadores de Risco Bancário
      impenhorabilidade,
      seizureStatus,
      hasLien,
      hasInsurance,
      isBorderProperty,
      conservationState,

      // Relacionamentos e Grids
      machineries,
      improvements,
      livestocks,

      // Rebanho & Marcas legados
      totalHeadCount,
      brandDescription,
      brandRegistrationAdapec,
      brandLocation,

      // Dados Financeiros & Limite de Crédito
      effectiveAgroRevenue,
      projectedAgroRevenue,
      otherRevenues,
      operationalExpenses,
      existingDebtService,
      familyLivingCosts,
      creditLimitRequested,
      creditLimitPurpose,
      creditLimitTargetBank,
      creditLimitTermMonths,
      creditLimitNotes,
    } = data

    if (!name && !propertyName) {
      throw new Error('O nome da propriedade é obrigatório.')
    }
    if (!branchId) {
      throw new Error('A filial de cadastro é obrigatória.')
    }

    const propName = propertyName || name || 'Propriedade Rural'

    const north = confrontantNorth !== undefined ? confrontantNorth : (confrontants?.norte ?? confrontants?.north ?? null)
    const south = confrontantSouth !== undefined ? confrontantSouth : (confrontants?.sul ?? confrontants?.south ?? null)
    const east = confrontantEast !== undefined ? confrontantEast : (confrontants?.leste ?? confrontants?.east ?? null)
    const west = confrontantWest !== undefined ? confrontantWest : (confrontants?.oeste ?? confrontants?.west ?? null)

    const resolvedVtnPerHa = vtnValuePerHa !== undefined && vtnValuePerHa !== null && vtnValuePerHa !== ''
      ? Number(vtnValuePerHa)
      : (vtnPerHectare !== undefined && vtnPerHectare !== null && vtnPerHectare !== '' ? Number(vtnPerHectare) : null)

    const resolvedTotalVtn = totalVtnAmount !== undefined && totalVtnAmount !== null && totalVtnAmount !== ''
      ? Number(totalVtnAmount)
      : (totalLandValue !== undefined && totalLandValue !== null && totalLandValue !== ''
          ? Number(totalLandValue)
          : (resolvedVtnPerHa && totalArea ? resolvedVtnPerHa * Number(totalArea) : null))

    const resolvedPropertyStatus = propertyStatus || financialStatus || 'QUITADA'

    const confrontantsJson = confrontants || ((north || south || east || west) ? {
      norte: north,
      sul: south,
      leste: east,
      oeste: west,
      north,
      south,
      east,
      west
    } : null)

    const calculatedHeadCount = livestocks && Array.isArray(livestocks) && livestocks.length > 0
      ? livestocks.reduce((sum: number, l: any) => sum + (Number(l.quantity) || 0), 0)
      : (totalHeadCount ? Number(totalHeadCount) : 0)

    const property = await prisma.property.create({
      data: {
        branchId,
        name: propName,
        propertyName: propName,
        city: city || null,
        state: state || null,
        latitude: parseCoordinate(latitude),
        longitude: parseCoordinate(longitude),

        totalArea: totalArea ? Number(totalArea) : 0,
        consolidatedArea: consolidatedArea ? Number(consolidatedArea) : null,
        productiveArea: productiveArea ? Number(productiveArea) : 0,
        pastureArea: pastureArea ? Number(pastureArea) : 0,
        preserveArea: preserveArea ? Number(preserveArea) : 0,
        ruralModules: ruralModules ? Number(ruralModules) : null,

        registrationNumber: registrationNumber || null,
        registryOffice: registryOffice || null,
        comarca: comarca || null,
        car: car || null,
        ccir: ccir || null,
        itr: itr || null,

        accessRoute: accessRoute || null,
        confrontants: confrontantsJson,
        confrontantNorth: north,
        confrontantSouth: south,
        confrontantEast: east,
        confrontantWest: west,

        propertyStatus: resolvedPropertyStatus as any,
        vtnValuePerHa: resolvedVtnPerHa,
        totalVtnAmount: resolvedTotalVtn,

        hasLien: Boolean(hasLien),
        hasInsurance: Boolean(hasInsurance),
        isBorderProperty: Boolean(isBorderProperty),
        seizureStatus: parseSeizureStatus(seizureStatus || impenhorabilidade) ?? null,
        conservationState: parseConservationState(conservationState) ?? null,

        explorationActivity: explorationActivity || null,

        livestock: (calculatedHeadCount || brandDescription || brandRegistrationAdapec || brandLocation) ? {
          totalHeadCount: calculatedHeadCount,
          brandDescription: brandDescription || null,
          brandRegistrationAdapec: brandRegistrationAdapec || null,
          brandLocation: brandLocation || null,
        } : {},

        improvements: {
          machineryValue: machineries && Array.isArray(machineries)
            ? machineries.reduce((acc: number, m: any) => acc + (Number(m.value) || 0), 0)
            : 0,
          improvementsValue: improvements && Array.isArray(improvements)
            ? improvements.reduce((acc: number, imp: any) => acc + ((Number(imp.quantity) || 0) * (Number(imp.unitValue) || 0)), 0)
            : 0,
          estimatedLandValuePerHa: resolvedVtnPerHa || 0,
        },

        possessionData: {
          possessionYears: possessionYears ? Number(possessionYears) : null,
          explorationActivity: explorationActivity || null,
          vtnPerHectare: resolvedVtnPerHa,
          totalLandValue: resolvedTotalVtn,
          effectiveAgroRevenue: effectiveAgroRevenue ? Number(effectiveAgroRevenue) : null,
          projectedAgroRevenue: projectedAgroRevenue ? Number(projectedAgroRevenue) : null,
          otherRevenues: otherRevenues ? Number(otherRevenues) : null,
          operationalExpenses: operationalExpenses ? Number(operationalExpenses) : null,
          existingDebtService: existingDebtService ? Number(existingDebtService) : null,
          familyLivingCosts: familyLivingCosts ? Number(familyLivingCosts) : null,
          creditLimitRequested: creditLimitRequested ? Number(creditLimitRequested) : null,
          creditLimitPurpose: creditLimitPurpose || null,
          creditLimitTargetBank: creditLimitTargetBank || null,
          creditLimitTermMonths: creditLimitTermMonths ? Number(creditLimitTermMonths) : null,
          creditLimitNotes: creditLimitNotes || null,
        },

        createdBy: dbUser.id,

        // Vínculo inicial com o produtor selecionado se houver
        producers: producerId ? {
          create: {
            producerId,
            ownershipType: (ownershipType as OwnershipType) || 'PROPRIETARIO',
            explorationPercentage: explorationPercentage ? Number(explorationPercentage) : 100,
            contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
            contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
            landlordName: landlordName || null,
            landlordDocument: landlordDocument || null,
            contractType: contractType || null,
            exploredAreaHa: exploredAreaHa ? Number(exploredAreaHa) : null,
          }
        } : undefined,

        // Criação de máquinas se fornecidas
        machineries: machineries && Array.isArray(machineries) && machineries.length > 0 ? {
          create: machineries.map((m: any) => ({
            branchId,
            specification: m.category || m.specification || 'Trator de Pneus',
            brand: m.brand || null,
            model: m.model || null,
            powerCapacity: m.powerCapacity || null,
            year: m.year ? Number(m.year) : null,
            chassisSerial: m.chassisSerial || null,
            participationPercent: m.participationPercent ? Number(m.participationPercent) : 100,
            value: m.value ? Number(m.value) : 0,
            hasLien: Boolean(m.hasLien),
            lienInstitution: m.lienInstitution || null,
          }))
        } : undefined,

        // Criação de benfeitorias se fornecidas
        improvementsList: improvements && Array.isArray(improvements) && improvements.length > 0 ? {
          create: improvements.map((imp: any) => {
            const isArtPast = Boolean(
              imp.isArtificialPasture ||
              imp.specification === 'Pastagem Artificial' ||
              (typeof imp.specification === 'string' && imp.specification.toLowerCase().includes('pastagem artificial'))
            )
            return {
              branchId,
              specification: imp.specification || '',
              unit: isArtPast ? (imp.unit || 'ha') : (imp.unit || 'm²'),
              quantity: imp.quantity ? Number(imp.quantity) : 0,
              unitValue: imp.unitValue ? Number(imp.unitValue) : 0,
              observation: imp.observation || null,
              isArtificialPasture: isArtPast,
            }
          })
        } : undefined,

        // Criação de rebanho se fornecido
        livestockList: livestocks && Array.isArray(livestocks) && livestocks.length > 0 ? {
          create: livestocks.map((l: any) => {
            const catBB = normalizeCategoryBB(l.categoryBB || l.category)
            const purBB = normalizePurposeBB(l.purposeBB || l.purpose)
            return {
              branchId,
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
              observation: l.observation || (l.markingType ? `Marcação: ${l.markingType} (${l.markingLocation || ''})` : null),
              brandingType: l.brandingType || l.markingType || null,
              brandingLocation: l.brandingLocation || l.markingLocation || null,
            }
          })
        } : undefined,
      }
    })

    revalidatePath('/admin/crm')
    revalidatePath('/admin/crm/properties')
    return { success: true, data: property }
  } catch (error: any) {
    return { 
      error: handleServerError(error, 'Properties - createProperty') 
    }
  }
}

export async function updateProperty(id: string, data: any) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) {
      throw new Error('Não autenticado')
    }
    const isSuperAdmin = dbUser.role === 'SUPER_ADMIN' || Boolean(dbUser.isSuperAdminImpersonating)
    if (!isSuperAdmin && !dbUser.organizationId) {
      throw new Error('Usuário sem organização')
    }

    const existing = await prisma.property.findUnique({
      where: { id },
      include: { branch: true, producers: true }
    })

    if (!existing || (!isSuperAdmin && existing.branch.organizationId !== dbUser.organizationId)) {
      throw new Error('Propriedade não encontrada ou permissão negada.')
    }

    const {
      name,
      propertyName,
      branchId,
      city,
      state,
      latitude,
      longitude,

      // Produtor Titular Vinculado
      producerId,
      ownershipType = 'PROPRIETARIO',
      explorationPercentage = 100,
      contractStartDate,
      contractEndDate,
      landlordName,
      landlordDocument,
      contractType,
      exploredAreaHa,

      // Status da Propriedade
      propertyStatus,
      financialStatus,

      // Áreas (ha)
      totalArea,
      consolidatedArea,
      productiveArea,
      pastureArea,
      preserveArea,
      ruralModules,
      vtnPerHectare,
      vtnValuePerHa,
      totalLandValue,
      totalVtnAmount,

      // Documentação Fundiária
      registrationNumber,
      registryOffice,
      comarca,
      car,
      ccir,
      itr,

      // Posse & Exploração
      possessionYears,
      explorationActivity,

      // Localização e Acesso
      accessRoute,
      confrontants,
      confrontantNorth,
      confrontantSouth,
      confrontantEast,
      confrontantWest,

      // Indicadores
      impenhorabilidade,
      seizureStatus,
      hasLien,
      hasInsurance,
      isBorderProperty,
      conservationState,

      // Relacionamentos e Grids
      machineries,
      improvements,
      livestocks,

      // Rebanho & Marcas
      totalHeadCount,
      brandDescription,
      brandRegistrationAdapec,
      brandLocation,

      // Financeiro & Limite de Crédito
      effectiveAgroRevenue,
      projectedAgroRevenue,
      otherRevenues,
      operationalExpenses,
      existingDebtService,
      familyLivingCosts,
      creditLimitRequested,
      creditLimitPurpose,
      creditLimitTargetBank,
      creditLimitTermMonths,
      creditLimitNotes,
    } = data

    const propName = propertyName || name || existing.name

    const north = confrontantNorth !== undefined
      ? (confrontantNorth || null)
      : (confrontants?.norte ?? confrontants?.north ?? existing.confrontantNorth)
    const south = confrontantSouth !== undefined
      ? (confrontantSouth || null)
      : (confrontants?.sul ?? confrontants?.south ?? existing.confrontantSouth)
    const east = confrontantEast !== undefined
      ? (confrontantEast || null)
      : (confrontants?.leste ?? confrontants?.east ?? existing.confrontantEast)
    const west = confrontantWest !== undefined
      ? (confrontantWest || null)
      : (confrontants?.oeste ?? confrontants?.west ?? existing.confrontantWest)

    const resolvedVtnPerHa = vtnValuePerHa !== undefined && vtnValuePerHa !== null && vtnValuePerHa !== ''
      ? Number(vtnValuePerHa)
      : (vtnPerHectare !== undefined && vtnPerHectare !== null && vtnPerHectare !== '' ? Number(vtnPerHectare) : existing.vtnValuePerHa)

    const resolvedTotalVtn = totalVtnAmount !== undefined && totalVtnAmount !== null && totalVtnAmount !== ''
      ? Number(totalVtnAmount)
      : (totalLandValue !== undefined && totalLandValue !== null && totalLandValue !== ''
          ? Number(totalLandValue)
          : (resolvedVtnPerHa && (totalArea || existing.totalArea) ? resolvedVtnPerHa * Number(totalArea || existing.totalArea) : existing.totalVtnAmount))

    const resolvedPropertyStatus = propertyStatus || financialStatus || existing.propertyStatus || 'QUITADA'

    const confrontantsJson = confrontants !== undefined
      ? confrontants
      : ((north || south || east || west) ? {
          norte: north,
          sul: south,
          leste: east,
          oeste: west,
          north,
          south,
          east,
          west
        } : existing.confrontants)

    const totalHeadCountResolved = livestocks && Array.isArray(livestocks)
      ? livestocks.reduce((sum: number, l: any) => sum + (Number(l.quantity) || 0), 0)
      : (totalHeadCount !== undefined ? (totalHeadCount ? Number(totalHeadCount) : 0) : ((existing.livestock as any)?.totalHeadCount || 0))

    const txOps: any[] = [
      prisma.property.update({
        where: { id },
        data: {
          name: propName,
          propertyName: propName,
          branchId: branchId || existing.branchId,
          city: city !== undefined ? city : existing.city,
          state: state !== undefined ? state : existing.state,
          latitude: latitude !== undefined ? parseCoordinate(latitude) : existing.latitude,
          longitude: longitude !== undefined ? parseCoordinate(longitude) : existing.longitude,

          totalArea: totalArea !== undefined ? (totalArea ? Number(totalArea) : 0) : existing.totalArea,
          consolidatedArea: consolidatedArea !== undefined ? (consolidatedArea ? Number(consolidatedArea) : null) : existing.consolidatedArea,
          productiveArea: productiveArea !== undefined ? (productiveArea ? Number(productiveArea) : 0) : existing.productiveArea,
          pastureArea: pastureArea !== undefined ? (pastureArea ? Number(pastureArea) : 0) : existing.pastureArea,
          preserveArea: preserveArea !== undefined ? (preserveArea ? Number(preserveArea) : 0) : existing.preserveArea,
          ruralModules: ruralModules !== undefined ? (ruralModules ? Number(ruralModules) : null) : existing.ruralModules,

          registrationNumber: registrationNumber !== undefined ? (registrationNumber || null) : existing.registrationNumber,
          registryOffice: registryOffice !== undefined ? (registryOffice || null) : existing.registryOffice,
          comarca: comarca !== undefined ? (comarca || null) : existing.comarca,
          car: car !== undefined ? (car || null) : existing.car,
          ccir: ccir !== undefined ? (ccir || null) : existing.ccir,
          itr: itr !== undefined ? (itr || null) : existing.itr,

          accessRoute: accessRoute !== undefined ? (accessRoute || null) : existing.accessRoute,
          confrontants: confrontantsJson,
          confrontantNorth: north,
          confrontantSouth: south,
          confrontantEast: east,
          confrontantWest: west,

          propertyStatus: resolvedPropertyStatus as any,
          vtnValuePerHa: resolvedVtnPerHa,
          totalVtnAmount: resolvedTotalVtn,

          hasLien: hasLien !== undefined ? Boolean(hasLien) : existing.hasLien,
          hasInsurance: hasInsurance !== undefined ? Boolean(hasInsurance) : existing.hasInsurance,
          isBorderProperty: isBorderProperty !== undefined ? Boolean(isBorderProperty) : existing.isBorderProperty,
          seizureStatus: (seizureStatus !== undefined || impenhorabilidade !== undefined)
            ? (parseSeizureStatus(seizureStatus || impenhorabilidade) ?? null)
            : existing.seizureStatus,
          conservationState: conservationState !== undefined
            ? (parseConservationState(conservationState) ?? null)
            : existing.conservationState,

          explorationActivity: explorationActivity !== undefined ? (explorationActivity || null) : existing.explorationActivity,

          livestock: {
            ...(existing.livestock as any || {}),
            totalHeadCount: totalHeadCountResolved,
            brandDescription: brandDescription !== undefined ? (brandDescription || null) : ((existing.livestock as any)?.brandDescription || null),
            brandRegistrationAdapec: brandRegistrationAdapec !== undefined ? (brandRegistrationAdapec || null) : ((existing.livestock as any)?.brandRegistrationAdapec || null),
            brandLocation: brandLocation !== undefined ? (brandLocation || null) : ((existing.livestock as any)?.brandLocation || null),
          },

          improvements: {
            ...(existing.improvements as any || {}),
            machineryValue: machineries && Array.isArray(machineries)
              ? machineries.reduce((acc: number, m: any) => acc + (Number(m.value) || 0), 0)
              : ((existing.improvements as any)?.machineryValue || 0),
            improvementsValue: improvements && Array.isArray(improvements)
              ? improvements.reduce((acc: number, imp: any) => acc + ((Number(imp.quantity) || 0) * (Number(imp.unitValue) || 0)), 0)
              : ((existing.improvements as any)?.improvementsValue || 0),
            estimatedLandValuePerHa: resolvedVtnPerHa || 0,
          },

          possessionData: {
            ...(existing.possessionData as any || {}),
            possessionYears: possessionYears !== undefined ? (possessionYears ? Number(possessionYears) : null) : ((existing.possessionData as any)?.possessionYears || null),
            explorationActivity: explorationActivity !== undefined ? (explorationActivity || null) : ((existing.possessionData as any)?.explorationActivity || null),
            vtnPerHectare: resolvedVtnPerHa,
            totalLandValue: resolvedTotalVtn,
            effectiveAgroRevenue: effectiveAgroRevenue !== undefined ? (effectiveAgroRevenue ? Number(effectiveAgroRevenue) : null) : ((existing.possessionData as any)?.effectiveAgroRevenue || null),
            projectedAgroRevenue: projectedAgroRevenue !== undefined ? (projectedAgroRevenue ? Number(projectedAgroRevenue) : null) : ((existing.possessionData as any)?.projectedAgroRevenue || null),
            otherRevenues: otherRevenues !== undefined ? (otherRevenues ? Number(otherRevenues) : null) : ((existing.possessionData as any)?.otherRevenues || null),
            operationalExpenses: operationalExpenses !== undefined ? (operationalExpenses ? Number(operationalExpenses) : null) : ((existing.possessionData as any)?.operationalExpenses || null),
            existingDebtService: existingDebtService !== undefined ? (existingDebtService ? Number(existingDebtService) : null) : ((existing.possessionData as any)?.existingDebtService || null),
            familyLivingCosts: familyLivingCosts !== undefined ? (familyLivingCosts ? Number(familyLivingCosts) : null) : ((existing.possessionData as any)?.familyLivingCosts || null),
            creditLimitRequested: creditLimitRequested !== undefined ? (creditLimitRequested ? Number(creditLimitRequested) : null) : ((existing.possessionData as any)?.creditLimitRequested || null),
            creditLimitPurpose: creditLimitPurpose !== undefined ? (creditLimitPurpose || null) : ((existing.possessionData as any)?.creditLimitPurpose || null),
            creditLimitTargetBank: creditLimitTargetBank !== undefined ? (creditLimitTargetBank || null) : ((existing.possessionData as any)?.creditLimitTargetBank || null),
            creditLimitTermMonths: creditLimitTermMonths !== undefined ? (creditLimitTermMonths ? Number(creditLimitTermMonths) : null) : ((existing.possessionData as any)?.creditLimitTermMonths || null),
            creditLimitNotes: creditLimitNotes !== undefined ? (creditLimitNotes || null) : ((existing.possessionData as any)?.creditLimitNotes || null),
          },

          updatedBy: dbUser.id,
        }
      })
    ]

    // Atualização de máquinas em lote
    if (machineries && Array.isArray(machineries)) {
      txOps.push(prisma.machinery.deleteMany({ where: { propertyId: id } }))
      if (machineries.length > 0) {
        txOps.push(
          prisma.machinery.createMany({
            data: machineries.map((m: any) => ({
              branchId: branchId || existing.branchId,
              propertyId: id,
              specification: m.category || m.specification || 'Trator de Pneus',
              brand: m.brand || null,
              model: m.model || null,
              powerCapacity: m.powerCapacity || null,
              year: m.year ? Number(m.year) : null,
              chassisSerial: m.chassisSerial || null,
              participationPercent: m.participationPercent ? Number(m.participationPercent) : 100,
              value: m.value ? Number(m.value) : 0,
              hasLien: Boolean(m.hasLien),
              lienInstitution: m.lienInstitution || null,
            }))
          })
        )
      }
    }

    // Atualização de benfeitorias em lote
    if (improvements && Array.isArray(improvements)) {
      txOps.push(prisma.improvement.deleteMany({ where: { propertyId: id } }))
      if (improvements.length > 0) {
        txOps.push(
          prisma.improvement.createMany({
            data: improvements.map((imp: any) => {
              const isArtPast = Boolean(
                imp.isArtificialPasture ||
                imp.specification === 'Pastagem Artificial' ||
                (typeof imp.specification === 'string' && imp.specification.toLowerCase().includes('pastagem artificial'))
              )
              return {
                branchId: branchId || existing.branchId,
                propertyId: id,
                specification: imp.specification || '',
                unit: isArtPast ? (imp.unit || 'ha') : (imp.unit || 'm²'),
                quantity: imp.quantity ? Number(imp.quantity) : 0,
                unitValue: imp.unitValue ? Number(imp.unitValue) : 0,
                observation: imp.observation || null,
                isArtificialPasture: isArtPast,
              }
            })
          })
        )
      }
    }

    // Atualização de semoventes em lote
    if (livestocks && Array.isArray(livestocks)) {
      txOps.push(prisma.livestock.deleteMany({ where: { propertyId: id } }))
      if (livestocks.length > 0) {
        txOps.push(
          prisma.livestock.createMany({
            data: livestocks.map((l: any) => {
              const catBB = normalizeCategoryBB(l.categoryBB || l.category)
              const purBB = normalizePurposeBB(l.purposeBB || l.purpose)
              return {
                branchId: branchId || existing.branchId,
                propertyId: id,
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
                observation: l.observation || (l.markingType ? `Marcação: ${l.markingType} (${l.markingLocation || ''})` : null),
                brandingType: l.brandingType || l.markingType || null,
                brandingLocation: l.brandingLocation || l.markingLocation || null,
              }
            })
          })
        )
      }
    }

    // Sincronizar vínculo com o produtor principal se informado
    if (producerId) {
      const existingLink = await prisma.producerProperty.findUnique({
        where: {
          producerId_propertyId: {
            producerId,
            propertyId: id
          }
        }
      })

      if (existingLink) {
        txOps.push(
          prisma.producerProperty.update({
            where: {
              producerId_propertyId: {
                producerId,
                propertyId: id
              }
            },
            data: {
              ownershipType: (ownershipType as OwnershipType) || existingLink.ownershipType,
              explorationPercentage: explorationPercentage ? Number(explorationPercentage) : existingLink.explorationPercentage,
              contractStartDate: contractStartDate !== undefined ? (contractStartDate ? new Date(contractStartDate) : null) : existingLink.contractStartDate,
              contractEndDate: contractEndDate !== undefined ? (contractEndDate ? new Date(contractEndDate) : null) : existingLink.contractEndDate,
              landlordName: landlordName !== undefined ? (landlordName || null) : existingLink.landlordName,
              landlordDocument: landlordDocument !== undefined ? (landlordDocument || null) : existingLink.landlordDocument,
              contractType: contractType !== undefined ? (contractType || null) : existingLink.contractType,
              exploredAreaHa: exploredAreaHa !== undefined ? (exploredAreaHa ? Number(exploredAreaHa) : null) : existingLink.exploredAreaHa,
            }
          })
        )
      } else {
        txOps.push(
          prisma.producerProperty.deleteMany({
            where: { propertyId: id }
          }),
          prisma.producerProperty.create({
            data: {
              producerId,
              propertyId: id,
              ownershipType: (ownershipType as OwnershipType) || 'PROPRIETARIO',
              explorationPercentage: explorationPercentage ? Number(explorationPercentage) : 100,
              contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
              contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
              landlordName: landlordName || null,
              landlordDocument: landlordDocument || null,
              contractType: contractType || null,
              exploredAreaHa: exploredAreaHa ? Number(exploredAreaHa) : null,
            }
          })
        )
      }
    }

    await prisma.$transaction(txOps)

    revalidatePath('/admin/crm')
    revalidatePath('/admin/crm/properties')
    revalidatePath(`/admin/crm/properties/${id}/edit`)
    return { success: true }
  } catch (error: any) {
    return { 
      error: handleServerError(error, 'Properties - updateProperty') 
    }
  }
}

export async function deleteProperty(id: string) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) {
      throw new Error('Não autenticado')
    }
    const isSuperAdmin = dbUser.role === 'SUPER_ADMIN' || Boolean(dbUser.isSuperAdminImpersonating)
    if (!isSuperAdmin && !dbUser.organizationId) {
      throw new Error('Usuário sem organização')
    }

    const existing = await prisma.property.findUnique({
      where: { id },
      include: { branch: true }
    })

    if (!existing || (!isSuperAdmin && existing.branch.organizationId !== dbUser.organizationId)) {
      throw new Error('Propriedade não encontrada ou permissão negada.')
    }

    await prisma.property.delete({
      where: { id }
    })

    revalidatePath('/admin/crm')
    revalidatePath('/admin/crm/properties')
    return { success: true }
  } catch (error: any) {
    return { 
      error: handleServerError(error, 'Properties - deleteProperty') 
    }
  }
}

export async function getProducersForBranch(branchId: string) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) return []
    const isSuperAdmin = dbUser.role === 'SUPER_ADMIN' || Boolean(dbUser.isSuperAdminImpersonating)
    if (!isSuperAdmin && !dbUser.organizationId) return []

    const producers = await prisma.producer.findMany({
      where: {
        branchId,
        isActive: true,
        ...(!isSuperAdmin && dbUser.organizationId ? {
          branch: {
            organizationId: dbUser.organizationId
          }
        } : {})
      },
      select: {
        id: true,
        name: true,
        document: true,
        type: true,
      },
      orderBy: { name: 'asc' }
    })

    return producers
  } catch (error) {
    return []
  }
}
