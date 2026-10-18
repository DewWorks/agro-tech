'use server'

import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { handleServerError } from '@/lib/errorHandler'
import { serverLog } from '@/lib/logger'
import { z } from 'zod'
import { brandingUpdateSchema } from '@/lib/validations/branding'
import {
  uploadBrandingImage,
  deleteBrandingImageFromStorage,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from '@/lib/storage/branding-storage'

export async function updateOrganizationBranding(formData: FormData) {
  try {
    const dbUser = await getUserContext()
    if (!dbUser) {
      return { error: 'Não autenticado' }
    }

    const isSuperAdmin = dbUser.realRole === 'SUPER_ADMIN' || dbUser.role === 'SUPER_ADMIN'
    const isOwner = dbUser.role === 'OWNER'

    if (!isSuperAdmin && !isOwner) {
      return {
        error:
          'Permissão negada. Apenas o proprietário ou administrador pode alterar a identidade visual da empresa.',
      }
    }

    // Identificação flexível da organização alvo
    let targetOrgId = isSuperAdmin
      ? ((formData.get('orgId') as string) || dbUser.organizationId)
      : dbUser.organizationId

    if (!targetOrgId && isSuperAdmin) {
      const firstOrg = await prisma.organization.findFirst({
        where: { isActive: true },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      })
      targetOrgId = firstOrg?.id || null
    }

    if (!targetOrgId) {
      return { error: 'Organização não encontrada para atualização.' }
    }

    // 1. Validação via Zod tolerante e higienizada
    const rawData = {
      name: formData.get('name') ? String(formData.get('name')).trim() : undefined,
      tradeName:
        formData.get('tradeName') !== null
          ? String(formData.get('tradeName')).trim()
          : undefined,
      cnpj: formData.get('cnpj') ? String(formData.get('cnpj')).trim() : undefined,
      primaryColorHex: formData.get('primaryColorHex')
        ? String(formData.get('primaryColorHex')).trim()
        : undefined,
      accentColorHex: formData.get('accentColorHex')
        ? String(formData.get('accentColorHex')).trim()
        : undefined,
      removeLogoHorizontal: formData.get('removeLogoHorizontal') === 'true',
      removeLogoDark: formData.get('removeLogoDark') === 'true',
      removeLogoIcon: formData.get('removeLogoIcon') === 'true',
    }

    const parseResult = brandingUpdateSchema.safeParse(rawData)
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((e) => e.message).join(', ')
      return { error: `Dados incompletos ou inválidos: ${errorMsg}` }
    }

    const validated = parseResult.data

    // 2. Busca valores atuais da organização no banco via Prisma
    const currentOrg = await prisma.organization.findUnique({
      where: { id: targetOrgId },
    })

    if (!currentOrg) {
      return { success: false, error: 'Organização não encontrada no banco de dados.' }
    }

    // Garante que o campo Razão Social nunca seja nulo ou vazio
    const finalName =
      validated.name && validated.name.length >= 1 ? validated.name : currentOrg.name

    const updateData: Record<string, any> = {
      name: finalName,
    }

    if (validated.tradeName !== undefined) {
      updateData.tradeName = validated.tradeName || null
    }
    if (validated.primaryColorHex) {
      updateData.primaryColorHex = validated.primaryColorHex
    }
    if (validated.accentColorHex) {
      updateData.accentColorHex = validated.accentColorHex
    }

    // 3. Processamento de Arquivos de Logomarca
    const logoHorizontalFile = formData.get('logoHorizontal') as File | null
    const logoDarkFile = formData.get('logoDark') as File | null
    const logoIconFile = formData.get('logoIcon') as File | null

    const validateAndUpload = async (
      file: File | null,
      type: 'logo_horizontal' | 'logo_icon' | 'logo_dark'
    ) => {
      if (!file || !(file instanceof File) || file.size === 0) return null

      if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
        throw new Error(`Formato inválido para ${type}. Aceitos: PNG, JPG, WebP, SVG.`)
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        throw new Error(`O arquivo de ${type} excede o limite máximo de 4MB.`)
      }

      return await uploadBrandingImage(targetOrgId!, type, file, file.type)
    }

    // Logo Horizontal
    if (validated.removeLogoHorizontal) {
      updateData.logoHorizontalUrl = null
      if (currentOrg.logoHorizontalUrl) {
        await deleteBrandingImageFromStorage(currentOrg.logoHorizontalUrl)
      }
    } else if (
      logoHorizontalFile &&
      logoHorizontalFile instanceof File &&
      logoHorizontalFile.size > 0
    ) {
      const url = await validateAndUpload(logoHorizontalFile, 'logo_horizontal')
      if (url) {
        updateData.logoHorizontalUrl = url
        if (currentOrg.logoHorizontalUrl && currentOrg.logoHorizontalUrl !== url) {
          await deleteBrandingImageFromStorage(currentOrg.logoHorizontalUrl)
        }
      }
    }

    // Logo Dark
    if (validated.removeLogoDark) {
      updateData.logoDarkUrl = null
      if (currentOrg.logoDarkUrl) {
        await deleteBrandingImageFromStorage(currentOrg.logoDarkUrl)
      }
    } else if (logoDarkFile && logoDarkFile instanceof File && logoDarkFile.size > 0) {
      const url = await validateAndUpload(logoDarkFile, 'logo_dark')
      if (url) {
        updateData.logoDarkUrl = url
        if (currentOrg.logoDarkUrl && currentOrg.logoDarkUrl !== url) {
          await deleteBrandingImageFromStorage(currentOrg.logoDarkUrl)
        }
      }
    }

    // Logo Icon
    if (validated.removeLogoIcon) {
      updateData.logoIconUrl = null
      if (currentOrg.logoIconUrl) {
        await deleteBrandingImageFromStorage(currentOrg.logoIconUrl)
      }
    } else if (logoIconFile && logoIconFile instanceof File && logoIconFile.size > 0) {
      const url = await validateAndUpload(logoIconFile, 'logo_icon')
      if (url) {
        updateData.logoIconUrl = url
        if (currentOrg.logoIconUrl && currentOrg.logoIconUrl !== url) {
          await deleteBrandingImageFromStorage(currentOrg.logoIconUrl)
        }
      }
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: targetOrgId },
      data: updateData,
    })

    revalidatePath('/admin', 'layout')
    revalidatePath('/admin/settings/branding')
    revalidatePath('/admin/settings/organization')

    return {
      success: true,
      organization: {
        id: updatedOrg.id,
        name: updatedOrg.name,
        tradeName: (updatedOrg as any).tradeName ?? null,
        logoHorizontalUrl: (updatedOrg as any).logoHorizontalUrl ?? null,
        logoDarkUrl: (updatedOrg as any).logoDarkUrl ?? null,
        logoIconUrl: (updatedOrg as any).logoIconUrl ?? null,
        primaryColorHex: (updatedOrg as any).primaryColorHex ?? null,
        accentColorHex: (updatedOrg as any).accentColorHex ?? null,
      },
    }
  } catch (error: any) {
    // 1. Falha de validação do Zod
    if (error instanceof z.ZodError) {
      const errorMsg = error.issues.map((i) => i.message).join(', ')
      return {
        success: false,
        error: `Dados inválidos no formulário: ${errorMsg}`,
      }
    }

    // 2. Log interno no servidor para rastreabilidade de diagnósticos
    serverLog('error', 'Branding - updateOrganizationBranding', error)

    // 3. Retorno do motivo real do erro (Prisma, Storage ou interno) em vez de mensagem genérica
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Erro interno ao salvar dados corporativos.'

    return {
      success: false,
      error: message || 'Erro interno ao salvar dados corporativos.',
    }
  }
}

export async function getPublicBranding(orgId?: string) {
  try {
    const whereClause: any = { isActive: true }
    if (orgId) {
      whereClause.id = orgId
    }

    const org = await prisma.organization.findFirst({
      where: whereClause,
      select: {
        id: true,
        name: true,
        tradeName: true,
        logoHorizontalUrl: true,
        logoDarkUrl: true,
        logoIconUrl: true,
        primaryColorHex: true,
        accentColorHex: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return {
      name: org?.name || 'LN Consultoria',
      tradeName: org?.tradeName || org?.name || 'AgroTech',
      logoHorizontalUrl: org?.logoHorizontalUrl || null,
      logoDarkUrl: org?.logoDarkUrl || null,
      logoIconUrl: org?.logoIconUrl || null,
      primaryColorHex: org?.primaryColorHex || '#05964F',
      accentColorHex: org?.accentColorHex || '#FFAC00',
    }
  } catch {
    return {
      name: 'LN Consultoria',
      tradeName: 'AgroTech',
      logoHorizontalUrl: null,
      logoDarkUrl: null,
      logoIconUrl: null,
      primaryColorHex: '#05964F',
      accentColorHex: '#FFAC00',
    }
  }
}
