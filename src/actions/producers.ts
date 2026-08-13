'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CivilStatus, MarriageRegime, ProducerType } from '@prisma/client'
import { validateCNPJ, validateCPF } from '@/lib/validations'
import { handleServerError } from '@/lib/errorHandler'

export async function createProducer(data: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
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
        branchId, // Deve vir do form (filial onde o produtor está sendo criado)
        createdBy: dbUser.id,
      }
    })

    revalidatePath('/admin/crm')
    return { success: true, data: producer }
  } catch (error: any) {
    return { 
      error: handleServerError(error, {
        P2002: 'Este produtor (CPF/CNPJ) já está cadastrado nesta filial.'
      }) 
    }
  }
}

export async function updateProducer(id: string, data: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Utilizador não autenticado')

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { userBranches: true }
    })

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
      dapCafNumber
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
        updatedBy: user.id
      }
    })

    revalidatePath('/admin/crm')
    revalidatePath(`/admin/crm/${id}/edit`)
    return { success: true, data: updatedProducer }
  } catch (error: any) {
    return { 
      error: handleServerError(error, {
        P2002: 'Este produtor (CPF/CNPJ) já está cadastrado nesta filial.'
      }) 
    }
  }
}



export async function toggleProducerStatus(id: string, newStatus: boolean) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    await prisma.producer.update({
      where: { id },
      data: { isActive: newStatus }
    })
    
    revalidatePath('/admin/crm')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao alternar status:', error)
    return { error: 'Não foi possível alterar o status do produtor.' }
  }
}
