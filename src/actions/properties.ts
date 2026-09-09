'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { handleServerError } from '@/lib/errorHandler'
import { getUserContext } from '@/lib/auth'
import { OwnershipType } from '@prisma/client'

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
    if (!dbUser || !dbUser.organizationId) {
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
      contractEndDate,

      // Áreas (ha)
      totalArea,
      consolidatedArea,
      productiveArea,
      pastureArea,
      preserveArea,
      ruralModules,
      vtnPerHectare,
      totalLandValue,

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

      // Dados Financeiros
      effectiveAgroRevenue,
      projectedAgroRevenue,
      otherRevenues,
      operationalExpenses,
      existingDebtService,
      familyLivingCosts,
    } = data

    if (!name && !propertyName) {
      throw new Error('O nome da propriedade é obrigatório.')
    }
    if (!branchId) {
      throw new Error('A filial de cadastro é obrigatória.')
    }

    const propName = propertyName || name || 'Propriedade Rural'

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
        confrontants: confrontants || null,

        hasLien: Boolean(hasLien),
        hasInsurance: Boolean(hasInsurance),
        isBorderProperty: Boolean(isBorderProperty),
        seizureStatus: parseSeizureStatus(seizureStatus || impenhorabilidade) ?? null,
        conservationState: parseConservationState(conservationState) ?? null,

        explorationActivity: explorationActivity || null,

        livestock: (totalHeadCount || brandDescription || brandRegistrationAdapec || brandLocation) ? {
          totalHeadCount: totalHeadCount ? Number(totalHeadCount) : 0,
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
          estimatedLandValuePerHa: vtnPerHectare ? Number(vtnPerHectare) : 0,
        },

        possessionData: {
          possessionYears: possessionYears ? Number(possessionYears) : null,
          explorationActivity: explorationActivity || null,
          vtnPerHectare: vtnPerHectare ? Number(vtnPerHectare) : null,
          totalLandValue: totalLandValue ? Number(totalLandValue) : null,
          effectiveAgroRevenue: effectiveAgroRevenue ? Number(effectiveAgroRevenue) : null,
          projectedAgroRevenue: projectedAgroRevenue ? Number(projectedAgroRevenue) : null,
          otherRevenues: otherRevenues ? Number(otherRevenues) : null,
          operationalExpenses: operationalExpenses ? Number(operationalExpenses) : null,
          existingDebtService: existingDebtService ? Number(existingDebtService) : null,
          familyLivingCosts: familyLivingCosts ? Number(familyLivingCosts) : null,
        },

        createdBy: dbUser.id,

        // Vínculo inicial com o produtor selecionado se houver
        producers: producerId ? {
          create: {
            producerId,
            ownershipType: (ownershipType as OwnershipType) || 'PROPRIETARIO',
            explorationPercentage: explorationPercentage ? Number(explorationPercentage) : 100,
            contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
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
          create: improvements.map((imp: any) => ({
            branchId,
            specification: imp.specification || '',
            unit: imp.unit || 'm²',
            quantity: imp.quantity ? Number(imp.quantity) : 0,
            unitValue: imp.unitValue ? Number(imp.unitValue) : 0,
            observation: imp.observation || null,
          }))
        } : undefined,

        // Criação de rebanho se fornecido
        livestockList: livestocks && Array.isArray(livestocks) && livestocks.length > 0 ? {
          create: livestocks.map((l: any) => ({
            branchId,
            species: (l.species as any) || 'BOVINO',
            category: (l.category as any) || 'MATRIZES',
            purpose: l.purpose || null,
            quantity: l.quantity ? Number(l.quantity) : 0,
            ageMonths: l.ageMonths ? Number(l.ageMonths) : null,
            avgWeightKg: l.avgWeightKg ? Number(l.avgWeightKg) : null,
            unitValue: l.unitValue ? Number(l.unitValue) : 0,
            observation: l.markingType ? `Marcação: ${l.markingType} (${l.markingLocation || ''})` : null,
          }))
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
    if (!dbUser || !dbUser.organizationId) {
      throw new Error('Usuário sem organização')
    }

    const existing = await prisma.property.findUnique({
      where: { id },
      include: { branch: true, producers: true }
    })

    if (!existing || existing.branch.organizationId !== dbUser.organizationId) {
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
      contractEndDate,

      // Áreas (ha)
      totalArea,
      consolidatedArea,
      productiveArea,
      pastureArea,
      preserveArea,
      ruralModules,
      vtnPerHectare,
      totalLandValue,

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

      // Financeiro
      effectiveAgroRevenue,
      projectedAgroRevenue,
      otherRevenues,
      operationalExpenses,
      existingDebtService,
      familyLivingCosts,
    } = data

    const propName = propertyName || name || existing.name

    await prisma.property.update({
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
        confrontants: confrontants !== undefined ? confrontants : existing.confrontants,

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
          totalHeadCount: totalHeadCount !== undefined ? (totalHeadCount ? Number(totalHeadCount) : 0) : ((existing.livestock as any)?.totalHeadCount || 0),
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
          estimatedLandValuePerHa: vtnPerHectare !== undefined
            ? (vtnPerHectare ? Number(vtnPerHectare) : 0)
            : ((existing.improvements as any)?.estimatedLandValuePerHa || 0),
        },

        possessionData: {
          ...(existing.possessionData as any || {}),
          possessionYears: possessionYears !== undefined ? (possessionYears ? Number(possessionYears) : null) : ((existing.possessionData as any)?.possessionYears || null),
          explorationActivity: explorationActivity !== undefined ? (explorationActivity || null) : ((existing.possessionData as any)?.explorationActivity || null),
          vtnPerHectare: vtnPerHectare !== undefined ? (vtnPerHectare ? Number(vtnPerHectare) : null) : ((existing.possessionData as any)?.vtnPerHectare || null),
          totalLandValue: totalLandValue !== undefined ? (totalLandValue ? Number(totalLandValue) : null) : ((existing.possessionData as any)?.totalLandValue || null),
          effectiveAgroRevenue: effectiveAgroRevenue !== undefined ? (effectiveAgroRevenue ? Number(effectiveAgroRevenue) : null) : ((existing.possessionData as any)?.effectiveAgroRevenue || null),
          projectedAgroRevenue: projectedAgroRevenue !== undefined ? (projectedAgroRevenue ? Number(projectedAgroRevenue) : null) : ((existing.possessionData as any)?.projectedAgroRevenue || null),
          otherRevenues: otherRevenues !== undefined ? (otherRevenues ? Number(otherRevenues) : null) : ((existing.possessionData as any)?.otherRevenues || null),
          operationalExpenses: operationalExpenses !== undefined ? (operationalExpenses ? Number(operationalExpenses) : null) : ((existing.possessionData as any)?.operationalExpenses || null),
          existingDebtService: existingDebtService !== undefined ? (existingDebtService ? Number(existingDebtService) : null) : ((existing.possessionData as any)?.existingDebtService || null),
          familyLivingCosts: familyLivingCosts !== undefined ? (familyLivingCosts ? Number(familyLivingCosts) : null) : ((existing.possessionData as any)?.familyLivingCosts || null),
        },

        updatedBy: dbUser.id,
      }
    })

    // Atualização de máquinas
    if (machineries && Array.isArray(machineries)) {
      await prisma.machinery.deleteMany({ where: { propertyId: id } })
      if (machineries.length > 0) {
        await prisma.machinery.createMany({
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
      }
    }

    // Atualização de benfeitorias
    if (improvements && Array.isArray(improvements)) {
      await prisma.improvement.deleteMany({ where: { propertyId: id } })
      if (improvements.length > 0) {
        await prisma.improvement.createMany({
          data: improvements.map((imp: any) => ({
            branchId: branchId || existing.branchId,
            propertyId: id,
            specification: imp.specification || '',
            unit: imp.unit || 'm²',
            quantity: imp.quantity ? Number(imp.quantity) : 0,
            unitValue: imp.unitValue ? Number(imp.unitValue) : 0,
            observation: imp.observation || null,
          }))
        })
      }
    }

    // Atualização de semoventes
    if (livestocks && Array.isArray(livestocks)) {
      await prisma.livestock.deleteMany({ where: { propertyId: id } })
      if (livestocks.length > 0) {
        await prisma.livestock.createMany({
          data: livestocks.map((l: any) => ({
            branchId: branchId || existing.branchId,
            propertyId: id,
            species: (l.species as any) || 'BOVINO',
            category: (l.category as any) || 'MATRIZES',
            purpose: l.purpose || null,
            quantity: l.quantity ? Number(l.quantity) : 0,
            ageMonths: l.ageMonths ? Number(l.ageMonths) : null,
            avgWeightKg: l.avgWeightKg ? Number(l.avgWeightKg) : null,
            unitValue: l.unitValue ? Number(l.unitValue) : 0,
            observation: l.markingType ? `Marcação: ${l.markingType} (${l.markingLocation || ''})` : null,
          }))
        })
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
        await prisma.producerProperty.update({
          where: {
            producerId_propertyId: {
              producerId,
              propertyId: id
            }
          },
          data: {
            ownershipType: (ownershipType as OwnershipType) || existingLink.ownershipType,
            explorationPercentage: explorationPercentage ? Number(explorationPercentage) : existingLink.explorationPercentage,
            contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
          }
        })
      } else {
        // Remove vínculos anteriores se for troca de titular
        await prisma.producerProperty.deleteMany({
          where: { propertyId: id }
        })

        await prisma.producerProperty.create({
          data: {
            producerId,
            propertyId: id,
            ownershipType: (ownershipType as OwnershipType) || 'PROPRIETARIO',
            explorationPercentage: explorationPercentage ? Number(explorationPercentage) : 100,
            contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
          }
        })
      }
    }

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
    if (!dbUser || !dbUser.organizationId) {
      throw new Error('Usuário sem organização')
    }

    const existing = await prisma.property.findUnique({
      where: { id },
      include: { branch: true }
    })

    if (!existing || existing.branch.organizationId !== dbUser.organizationId) {
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
    if (!dbUser || !dbUser.organizationId) return []

    const producers = await prisma.producer.findMany({
      where: {
        branchId,
        isActive: true,
        branch: {
          organizationId: dbUser.organizationId
        }
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
