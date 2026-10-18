'use server'

import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { handleServerError } from '@/lib/errorHandler'
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

    const isSuperAdmin = dbUser.realRole === 'SUPER_ADMIN'
    const isOwner = dbUser.role === 'OWNER'

    if (!isSuperAdmin && !isOwner) {
      return { error: 'Permissão negada. Apenas o proprietário pode alterar a identidade visual da empresa.' }
    }

    const targetOrgId = isSuperAdmin
      ? ((formData.get('orgId') as string) || dbUser.organizationId)
      : dbUser.organizationId

    if (!targetOrgId) {
      return { error: 'Organização não encontrada.' }
    }

    const name = formData.get('name') as string | null
    const tradeName = formData.get('tradeName') as string | null
    const primaryColorHex = formData.get('primaryColorHex') as string | null
    const accentColorHex = formData.get('accentColorHex') as string | null

    const logoHorizontalFile = formData.get('logoHorizontal') as File | null
    const logoDarkFile = formData.get('logoDark') as File | null
    const logoIconFile = formData.get('logoIcon') as File | null

    const removeLogoHorizontal = formData.get('removeLogoHorizontal') === 'true'
    const removeLogoDark = formData.get('removeLogoDark') === 'true'
    const removeLogoIcon = formData.get('removeLogoIcon') === 'true'

    const updateData: Record<string, any> = {}

    if (name && name.trim().length >= 2) {
      updateData.name = name.trim()
    }
    if (tradeName !== null) {
      updateData.tradeName = tradeName.trim() || null
    }
    if (primaryColorHex) {
      updateData.primaryColorHex = primaryColorHex.trim()
    }
    if (accentColorHex) {
      updateData.accentColorHex = accentColorHex.trim()
    }

    // Processamento de Arquivos de Logomarca
    const validateAndUpload = async (file: File | null, type: 'logo_horizontal' | 'logo_icon' | 'logo_dark') => {
      if (!file || !(file instanceof File) || file.size === 0) return null

      if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
        throw new Error(`Formato inválido para ${type}. Aceitos: PNG, JPG, WebP, SVG.`)
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        throw new Error(`O arquivo de ${type} excede o limite máximo de 4MB.`)
      }

      return await uploadBrandingImage(targetOrgId, type, file, file.type)
    }

    // Busca URLs anteriores para limpeza de arquivos órfãos no storage
    const currentOrg = await prisma.organization.findUnique({
      where: { id: targetOrgId },
      select: {
        logoHorizontalUrl: true,
        logoDarkUrl: true,
        logoIconUrl: true,
      },
    })

    if (removeLogoHorizontal) {
      updateData.logoHorizontalUrl = null
      if (currentOrg?.logoHorizontalUrl) {
        await deleteBrandingImageFromStorage(currentOrg.logoHorizontalUrl)
      }
    } else if (logoHorizontalFile && logoHorizontalFile.size > 0) {
      const url = await validateAndUpload(logoHorizontalFile, 'logo_horizontal')
      if (url) {
        updateData.logoHorizontalUrl = url
        if (currentOrg?.logoHorizontalUrl && currentOrg.logoHorizontalUrl !== url) {
          await deleteBrandingImageFromStorage(currentOrg.logoHorizontalUrl)
        }
      }
    }

    if (removeLogoDark) {
      updateData.logoDarkUrl = null
      if (currentOrg?.logoDarkUrl) {
        await deleteBrandingImageFromStorage(currentOrg.logoDarkUrl)
      }
    } else if (logoDarkFile && logoDarkFile.size > 0) {
      const url = await validateAndUpload(logoDarkFile, 'logo_dark')
      if (url) {
        updateData.logoDarkUrl = url
        if (currentOrg?.logoDarkUrl && currentOrg.logoDarkUrl !== url) {
          await deleteBrandingImageFromStorage(currentOrg.logoDarkUrl)
        }
      }
    }

    if (removeLogoIcon) {
      updateData.logoIconUrl = null
      if (currentOrg?.logoIconUrl) {
        await deleteBrandingImageFromStorage(currentOrg.logoIconUrl)
      }
    } else if (logoIconFile && logoIconFile.size > 0) {
      const url = await validateAndUpload(logoIconFile, 'logo_icon')
      if (url) {
        updateData.logoIconUrl = url
        if (currentOrg?.logoIconUrl && currentOrg.logoIconUrl !== url) {
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
        tradeName: updatedOrg.tradeName,
        logoHorizontalUrl: updatedOrg.logoHorizontalUrl,
        logoDarkUrl: updatedOrg.logoDarkUrl,
        logoIconUrl: updatedOrg.logoIconUrl,
        primaryColorHex: updatedOrg.primaryColorHex,
        accentColorHex: updatedOrg.accentColorHex,
      },
    }
  } catch (error: any) {
    return { error: handleServerError(error, 'Branding - updateOrganizationBranding') }
  }
}

export async function getPublicBranding() {
  try {
    const org = await prisma.organization.findFirst({
      where: { isActive: true },
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
