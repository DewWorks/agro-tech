'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { handleServerError } from '@/lib/errorHandler'
import { getUserContext } from '@/lib/auth'
import { CivilStatus, MarriageRegime, ProducerType } from '@prisma/client'
import { validateCNPJ, validateCPF } from '@/lib/validations'

export async function createProducer(data: any) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser || !dbUser.organizationId) {
      throw new Error('Usuário sem organização')
    }

    const {
      type,
      document,
      name,
      email,
      phone,
      civilStatus,
      marriageRegime,
      spouseName,
      spouseCpf,
      dapCafNumber,
      rg,
      rgIssuer,
      profession,
      nationality,
      representativeCpf,
      
      propertyName,
      propertyCity,
      propertyState,
      pastureArea,
      totalHeadCount,
      
      registrationNumber,
      registryOffice,
      car,
      possessionYears,
      explorationActivity,
      brandDescription,
      brandRegistrationAdapec,
      brandLocation,
      
      branchId,
    } = data

    // Validação estrita de Documento (Server-side)
    const cleanDoc = document.replace(/[^\d]+/g, '')
    if (type === 'PF' && !validateCPF(cleanDoc)) {
      throw new Error('O CPF informado é matematicamente inválido.')
    }
    if (type === 'PJ' && !validateCNPJ(cleanDoc)) {
      throw new Error('O CNPJ informado é matematicamente inválido.')
    }

    // Regras de Outorga Uxória (Estado Civil)
    if (type === 'PF' && (civilStatus === 'CASADO' || civilStatus === 'UNIAO_ESTAVEL')) {
      if (!marriageRegime) {
        throw new Error('Para estado civil Casado ou União Estável, o Regime de Casamento é obrigatório.')
      }
    }

    const producer = await prisma.producer.create({
      data: {
        type: type as ProducerType,
        document: cleanDoc,
        name,
        email,
        phone,
        civilStatus: civilStatus ? (civilStatus as CivilStatus) : null,
        marriageRegime: marriageRegime ? (marriageRegime as MarriageRegime) : null,
        spouseName,
        spouseCpf: spouseCpf ? spouseCpf.replace(/[^\d]+/g, '') : null,
        dapCafNumber,
        rg,
        rgIssuer,
        profession,
        nationality,
        representativeCpf: type === 'PJ' && representativeCpf ? representativeCpf.replace(/[^\d]+/g, '') : null,
        branchId, // Deve vir do form (filial onde o produtor está sendo criado)
        createdBy: dbUser.id,
      }
    })

    // Se houver dados de propriedade preenchidos, cria a propriedade
    if (propertyName || propertyCity || propertyState || pastureArea || totalHeadCount || registrationNumber || car || explorationActivity) {
      await prisma.property.create({
        data: {
          branchId,
          name: propertyName || 'Propriedade Principal',
          propertyName: propertyName || null,
          city: propertyCity || null,
          state: propertyState || null,
          pastureArea: pastureArea ? Number(pastureArea) : 0,
          registrationNumber: registrationNumber || null,
          registryOffice: registryOffice || null,
          car: car || null,
          explorationActivity: explorationActivity || null,
          livestock: (totalHeadCount || brandDescription || brandRegistrationAdapec || brandLocation) ? {
            totalHeadCount: totalHeadCount ? Number(totalHeadCount) : 0,
            brandDescription: brandDescription || null,
            brandRegistrationAdapec: brandRegistrationAdapec || null,
            brandLocation: brandLocation || null,
          } : {},
          possessionData: possessionYears ? {
            possessionYears: Number(possessionYears)
          } : {},
          producers: {
            create: {
              producerId: producer.id,
              ownershipType: 'PROPRIETARIO'
            }
          }
        }
      })
    }

    revalidatePath('/admin/crm')
    return { success: true, data: producer }
  } catch (error: any) {
    return { 
      error: handleServerError(error, 'Producers - createProducer', {
        P2002: 'Este produtor (CPF/CNPJ) já está cadastrado nesta filial.'
      }) 
    }
  }
}

export async function updateProducer(id: string, data: any) {
  try {
    const dbUser = await getUserContext()
    
    if (!dbUser) throw new Error('Utilizador não encontrado')

    // Validar se o produtor pertence a organização do user
    const existingProducer = await prisma.producer.findUnique({
      where: { id },
      include: { branch: true }
    })

    if (!existingProducer || existingProducer.branch.organizationId !== dbUser.organizationId) {
      throw new Error('Produtor não encontrado ou sem permissão.')
    }

    const {
      branchId,
      type,
      document,
      name,
      email,
      phone,
      civilStatus,
      marriageRegime,
      spouseName,
      spouseCpf,
      dapCafNumber,
      rg,
      rgIssuer,
      profession,
      nationality,
      representativeCpf,
      
      propertyName,
      propertyCity,
      propertyState,
      pastureArea,
      totalHeadCount,
      
      registrationNumber,
      registryOffice,
      car,
      possessionYears,
      explorationActivity,
      brandDescription,
      brandRegistrationAdapec,
      brandLocation,
    } = data

    const cleanDoc = document?.replace(/[^\d]/g, '') || ''
    const cleanSpouseCpf = spouseCpf?.replace(/[^\d]/g, '') || null

    if (type === 'PF' && !validateCPF(cleanDoc)) {
      throw new Error('CPF do produtor é inválido.')
    }
    if (type === 'PJ' && !validateCNPJ(cleanDoc)) {
      throw new Error('CNPJ do produtor é inválido.')
    }

    if (type === 'PF' && (civilStatus === 'CASADO' || civilStatus === 'UNIAO_ESTAVEL')) {
      if (!marriageRegime) {
        throw new Error('Para estado civil Casado ou União Estável, o Regime de Casamento é obrigatório.')
      }
      if (cleanSpouseCpf && !validateCPF(cleanSpouseCpf)) {
        throw new Error('CPF do cônjuge é inválido.')
      }
    }

    const updatedProducer = await prisma.producer.update({
      where: { id },
      data: {
        branchId,
        type: type as ProducerType,
        document: cleanDoc,
        name,
        email: email || null,
        phone: phone || null,
        civilStatus: type === 'PF' ? (civilStatus as CivilStatus) : null,
        marriageRegime: type === 'PF' && (civilStatus === 'CASADO' || civilStatus === 'UNIAO_ESTAVEL') ? (marriageRegime as MarriageRegime) : null,
        spouseName: type === 'PF' && (civilStatus === 'CASADO' || civilStatus === 'UNIAO_ESTAVEL') ? spouseName : null,
        spouseCpf: type === 'PF' && (civilStatus === 'CASADO' || civilStatus === 'UNIAO_ESTAVEL') ? cleanSpouseCpf : null,
        dapCafNumber: dapCafNumber || null,
        rg: rg || null,
        rgIssuer: rgIssuer || null,
        profession: profession || null,
        nationality: nationality || null,
        representativeCpf: type === 'PJ' && representativeCpf ? representativeCpf.replace(/[^\d]+/g, '') : null,
        updatedBy: dbUser.id
      }
    })

    if (propertyName || propertyCity || propertyState || pastureArea || totalHeadCount || registrationNumber || car || explorationActivity) {
      // Tentar pegar a primeira propriedade
      const existingProp = await prisma.producerProperty.findFirst({
        where: { producerId: id },
        include: { property: true }
      })

      if (existingProp) {
        await prisma.property.update({
          where: { id: existingProp.propertyId },
          data: {
            name: propertyName || existingProp.property.name,
            propertyName: propertyName || null,
            city: propertyCity || null,
            state: propertyState || null,
            pastureArea: pastureArea ? Number(pastureArea) : 0,
            registrationNumber: registrationNumber || null,
            registryOffice: registryOffice || null,
            car: car || null,
            explorationActivity: explorationActivity || null,
            livestock: {
              ...(existingProp.property.livestock as any || {}),
              totalHeadCount: totalHeadCount ? Number(totalHeadCount) : 0,
              brandDescription: brandDescription || null,
              brandRegistrationAdapec: brandRegistrationAdapec || null,
              brandLocation: brandLocation || null,
            },
            possessionData: {
              ...(existingProp.property.possessionData as any || {}),
              possessionYears: possessionYears ? Number(possessionYears) : null,
            }
          }
        })
      } else {
        await prisma.property.create({
          data: {
            branchId,
            name: propertyName || 'Propriedade Principal',
            propertyName: propertyName || null,
            city: propertyCity || null,
            state: propertyState || null,
            pastureArea: pastureArea ? Number(pastureArea) : 0,
            registrationNumber: registrationNumber || null,
            registryOffice: registryOffice || null,
            car: car || null,
            explorationActivity: explorationActivity || null,
            livestock: {
              totalHeadCount: totalHeadCount ? Number(totalHeadCount) : 0,
              brandDescription: brandDescription || null,
              brandRegistrationAdapec: brandRegistrationAdapec || null,
              brandLocation: brandLocation || null,
            },
            possessionData: {
              possessionYears: possessionYears ? Number(possessionYears) : null,
            },
            producers: {
              create: {
                producerId: id,
                ownershipType: 'PROPRIETARIO'
              }
            }
          }
        })
      }
    }

    revalidatePath('/admin/crm')
    revalidatePath(`/admin/crm/${id}/edit`)
    return { success: true, data: updatedProducer }
  } catch (error: any) {
    return { 
      error: handleServerError(error, 'Producers - updateProducer', {
        P2002: 'Este produtor (CPF/CNPJ) já está cadastrado nesta filial.'
      }) 
    }
  }
}



export async function toggleProducerStatus(id: string, newStatus: boolean) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) throw new Error('Não autenticado')

    await prisma.producer.update({
      where: { id },
      data: { isActive: newStatus }
    })
    
    revalidatePath('/admin/crm')
    return { success: true }
  } catch (error: any) {
    return { error: handleServerError(error, 'Producers - toggleProducerStatus') }
  }
}
