'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { handleServerError } from '@/lib/errorHandler'
import { getUserContext } from '@/lib/auth'
import { OwnershipType } from '@prisma/client'

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
      productiveArea,
      pastureArea,
      preserveArea,

      // Documentação Fundiária
      registrationNumber,
      registryOffice,
      car,
      ccir,
      itr,

      // Posse & Exploração
      possessionYears,
      explorationActivity,

      // Rebanho & Marcas
      totalHeadCount,
      brandDescription,
      brandRegistrationAdapec,
      brandLocation,
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
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,

        totalArea: totalArea ? Number(totalArea) : 0,
        productiveArea: productiveArea ? Number(productiveArea) : 0,
        pastureArea: pastureArea ? Number(pastureArea) : 0,
        preserveArea: preserveArea ? Number(preserveArea) : 0,

        registrationNumber: registrationNumber || null,
        registryOffice: registryOffice || null,
        car: car || null,
        ccir: ccir || null,
        itr: itr || null,

        explorationActivity: explorationActivity || null,

        livestock: (totalHeadCount || brandDescription || brandRegistrationAdapec || brandLocation) ? {
          totalHeadCount: totalHeadCount ? Number(totalHeadCount) : 0,
          brandDescription: brandDescription || null,
          brandRegistrationAdapec: brandRegistrationAdapec || null,
          brandLocation: brandLocation || null,
        } : {},

        possessionData: possessionYears ? {
          possessionYears: Number(possessionYears),
          explorationActivity: explorationActivity || null,
        } : (explorationActivity ? { explorationActivity } : {}),

        createdBy: dbUser.id,

        // Vínculo inicial com o produtor selecionado se houver
        producers: producerId ? {
          create: {
            producerId,
            ownershipType: (ownershipType as OwnershipType) || 'PROPRIETARIO',
            explorationPercentage: explorationPercentage ? Number(explorationPercentage) : 100,
            contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
          }
        } : undefined
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
      productiveArea,
      pastureArea,
      preserveArea,

      // Documentação Fundiária
      registrationNumber,
      registryOffice,
      car,
      ccir,
      itr,

      // Posse & Exploração
      possessionYears,
      explorationActivity,

      // Rebanho & Marcas
      totalHeadCount,
      brandDescription,
      brandRegistrationAdapec,
      brandLocation,
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
        latitude: latitude !== undefined ? (latitude ? Number(latitude) : null) : existing.latitude,
        longitude: longitude !== undefined ? (longitude ? Number(longitude) : null) : existing.longitude,

        totalArea: totalArea !== undefined ? (totalArea ? Number(totalArea) : 0) : existing.totalArea,
        productiveArea: productiveArea !== undefined ? (productiveArea ? Number(productiveArea) : 0) : existing.productiveArea,
        pastureArea: pastureArea !== undefined ? (pastureArea ? Number(pastureArea) : 0) : existing.pastureArea,
        preserveArea: preserveArea !== undefined ? (preserveArea ? Number(preserveArea) : 0) : existing.preserveArea,

        registrationNumber: registrationNumber !== undefined ? (registrationNumber || null) : existing.registrationNumber,
        registryOffice: registryOffice !== undefined ? (registryOffice || null) : existing.registryOffice,
        car: car !== undefined ? (car || null) : existing.car,
        ccir: ccir !== undefined ? (ccir || null) : existing.ccir,
        itr: itr !== undefined ? (itr || null) : existing.itr,

        explorationActivity: explorationActivity !== undefined ? (explorationActivity || null) : existing.explorationActivity,

        livestock: {
          ...(existing.livestock as any || {}),
          totalHeadCount: totalHeadCount !== undefined ? (totalHeadCount ? Number(totalHeadCount) : 0) : ((existing.livestock as any)?.totalHeadCount || 0),
          brandDescription: brandDescription !== undefined ? (brandDescription || null) : ((existing.livestock as any)?.brandDescription || null),
          brandRegistrationAdapec: brandRegistrationAdapec !== undefined ? (brandRegistrationAdapec || null) : ((existing.livestock as any)?.brandRegistrationAdapec || null),
          brandLocation: brandLocation !== undefined ? (brandLocation || null) : ((existing.livestock as any)?.brandLocation || null),
        },

        possessionData: {
          ...(existing.possessionData as any || {}),
          possessionYears: possessionYears !== undefined ? (possessionYears ? Number(possessionYears) : null) : ((existing.possessionData as any)?.possessionYears || null),
          explorationActivity: explorationActivity !== undefined ? (explorationActivity || null) : ((existing.possessionData as any)?.explorationActivity || null),
        },

        updatedBy: dbUser.id,
      }
    })

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
