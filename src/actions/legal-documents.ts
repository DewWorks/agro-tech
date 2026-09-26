'use server'

import prisma from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { formatCPF, formatCNPJ } from '@/lib/validations'
import { denormalizeCategoryBB, denormalizePurposeBB } from '@/lib/validations/livestock-mapper'

export async function getMinutasRepository() {
  const user = await getUserContext()
  if (!user) throw new Error('Unauthorized')

  // Retorna os templates disponíveis. Poderíamos filtrar por branchId, mas como semeamos sem branchId (globais), pegamos todos.
  const templates = await prisma.documentTemplate.findMany({
    orderBy: { title: 'asc' },
  })

  return templates
}

export async function getProducersForDropdown() {
  const user = await getUserContext()
  if (!user) throw new Error('Unauthorized')

  const whereClause: any = { isActive: true }
  if (user.branchId) {
    whereClause.branchId = user.branchId
  }

  return await prisma.producer.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      document: true,
      properties: {
        select: {
          property: {
            select: { id: true, name: true, propertyName: true }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })
}

export async function resolveDocumentData(producerId: string, propertyId: string | null, templateCode: string) {
  const user = await getUserContext()
  if (!user) throw new Error('Unauthorized')

  const template = await prisma.documentTemplate.findUnique({
    where: { code: templateCode },
  })
  if (!template) throw new Error('Template not found')

  const producer = await prisma.producer.findUnique({
    where: { id: producerId },
  })
  if (!producer) throw new Error('Producer not found')

  let property = null
  if (propertyId) {
    property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        livestockList: true,
        improvementsList: true,
        machineries: true,
      }
    })
  }

  // 1. Resolve Variables
  const resolvedVariables: Record<string, any> = {}
  const missingFields: Array<any> = []

  const schemaJson = template.schemaJson as { required: Array<{ key: string, label: string, source: string, field: string, type: string, readonly?: boolean }> }
  const requiredFields = schemaJson?.required || []

  for (const field of requiredFields) {
    let value: any = null

    if (field.source === 'Producer') {
      if (producer.type === 'PJ' && field.key.toUpperCase().includes('CPF')) {
        value = (producer as any)['representativeCpf']
        if (value) value = formatCPF(value)
      } else {
        value = (producer as any)[field.field]
        if (field.field === 'document' && value) {
          value = producer.type === 'PF' ? formatCPF(value) : formatCNPJ(value)
        }
      }
    } else if (field.source === 'Property' && property) {
      value = (property as any)[field.field]
    } else if (field.source === 'Property.livestock' && property) {
      const livestock = property.livestock as Record<string, any> || {}
      value = livestock[field.field]
    } else if (field.source === 'Property.possessionData' && property) {
      const possession = property.possessionData as Record<string, any> || {}
      value = possession[field.field]
    } else if (field.source === 'Calculated' && property) {
      if (field.key === 'UA_TOTAL') {
        const livestock = property.livestock as any || {}
        const cabecas = (property.livestockList && property.livestockList.length > 0)
          ? property.livestockList.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0)
          : Number(livestock.totalHeadCount || 0)
        value = cabecas
      } else if (field.key === 'TAXA_LOTACAO') {
        const pastagem = Number(property.pastureArea || 0)
        const livestock = property.livestock as any || {}
        const cabecas = (property.livestockList && property.livestockList.length > 0)
          ? property.livestockList.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0)
          : Number(livestock.totalHeadCount || 0)
        value = pastagem > 0 ? (cabecas / pastagem).toFixed(2) : 0
      }
    }

    if (value === null || value === undefined || value === '') {
      if (!field.readonly) {
        missingFields.push(field)
      }
    } else {
      resolvedVariables[field.key] = value
    }
  }

  // Dicionários legíveis para Regime de Casamento e Estado Civil
  const marriageRegimesLabels: Record<string, string> = {
    COMUNHAO_PARCIAL: 'Comunhão Parcial de Bens',
    COMUNHAO_UNIVERSAL: 'Comunhão Universal de Bens',
    SEPARACAO_TOTAL: 'Separação Total de Bens (Convencional)',
    SEPARACAO_OBRIGATORIA: 'Separação Obrigatória de Bens (Legal)',
    PARTICIPACAO_FINAL: 'Participação Final nos Aquestos',
  }
  const civilStatusLabels: Record<string, string> = {
    SOLTEIRO: 'Solteiro(a)',
    CASADO: 'Casado(a)',
    UNIAO_ESTAVEL: 'União Estável',
    SEPARADO: 'Separado(a)',
    DIVORCIADO: 'Divorciado(a)',
    VIUVO: 'Viúvo(a)',
  }

  // Tags do Cônjuge e Regime de Bens para Minutas Legais e Outorga Uxória
  const spouseName = producer.spouseName || ''
  const spouseCpf = producer.spouseCpf ? formatCPF(producer.spouseCpf) : ''
  const spouseRg = producer.spouseRg ? (producer.spouseRgIssuer ? `${producer.spouseRg} ${producer.spouseRgIssuer}` : producer.spouseRg) : ''
  const regimeBens = producer.marriageRegime ? (marriageRegimesLabels[producer.marriageRegime] || producer.marriageRegime) : ''

  resolvedVariables['NOME_CONJUGE'] = spouseName
  resolvedVariables['CPF_CONJUGE'] = spouseCpf
  resolvedVariables['RG_CONJUGE'] = spouseRg
  resolvedVariables['REGIME_BENS'] = regimeBens
  resolvedVariables['REGIME_CASAMENTO'] = regimeBens
  resolvedVariables['ESTADO_CIVIL'] = producer.civilStatus ? (civilStatusLabels[producer.civilStatus] || producer.civilStatus) : ''
  resolvedVariables['PRODUCER_CIVIL_STATUS'] = resolvedVariables['ESTADO_CIVIL']
  resolvedVariables['NACIONALIDADE_CONJUGE'] = producer.spouseNationality || 'Brasileira'
  resolvedVariables['ESCOLARIDADE_CONJUGE'] = producer.spouseEducationLevel || ''

  // Tags e Estrutura Relacional de Semoventes / Rebanho para Minutas (ex: Forma de Identificação dos Animais em Garantia)
  const rawLivestockList = property?.livestockList || []
  const semoventesList = rawLivestockList.map((l: any) => ({
    CATEGORIA: denormalizeCategoryBB(l.categoryBB || l.category),
    FINALIDADE: denormalizePurposeBB(l.purposeBB || l.purpose),
    RACA: l.breed || 'Nelore',
    QUANTIDADE: Number(l.quantity) || 0,
    IDADE_MESES: l.ageMonths ? `${l.ageMonths} meses` : '-',
    PESO_MEDIO: l.avgWeightKg ? `${l.avgWeightKg} kg` : '-',
    VALOR_UNITARIO: Number(l.unitValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    VALOR_TOTAL: ((Number(l.quantity) || 0) * (Number(l.unitValue) || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    MARCA: l.brandingType || '-',
    LOCAL_MARCA: l.brandingLocation || '-',
  }))

  resolvedVariables['SEMOVENTES'] = semoventesList
  resolvedVariables['TOTAL_CABECAS'] = semoventesList.reduce((acc, cur) => acc + cur.QUANTIDADE, 0) || ((property?.livestock as any)?.totalHeadCount || 0)

  // Tabela HTML pré-formatada para Semoventes em Minutas e Laudos
  const semoventesTableHtml = semoventesList.length > 0 ? `
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px;">
      <thead>
        <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
          <th style="padding: 6px 8px; border: 1px solid #e2e8f0;">Categoria (BB)</th>
          <th style="padding: 6px 8px; border: 1px solid #e2e8f0;">Finalidade</th>
          <th style="padding: 6px 8px; border: 1px solid #e2e8f0;">Raça</th>
          <th style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center;">Qtd (Cab.)</th>
          <th style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center;">Idade</th>
          <th style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center;">Peso Médio</th>
          <th style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: right;">Valor Unit.</th>
          <th style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: right;">Total Estimado</th>
          <th style="padding: 6px 8px; border: 1px solid #e2e8f0;">Marca e Local</th>
        </tr>
      </thead>
      <tbody>
        ${semoventesList.map((item: any) => `
          <tr style="border-bottom: 1px solid #e2e8f0; page-break-inside: avoid; break-inside: avoid;">
            <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 500;">${item.CATEGORIA}</td>
            <td style="padding: 5px 8px; border: 1px solid #e2e8f0;">${item.FINALIDADE}</td>
            <td style="padding: 5px 8px; border: 1px solid #e2e8f0;">${item.RACA}</td>
            <td style="padding: 5px 8px; border: 1px solid #e2e8f0; text-align: center;">${item.QUANTIDADE}</td>
            <td style="padding: 5px 8px; border: 1px solid #e2e8f0; text-align: center;">${item.IDADE_MESES}</td>
            <td style="padding: 5px 8px; border: 1px solid #e2e8f0; text-align: center;">${item.PESO_MEDIO}</td>
            <td style="padding: 5px 8px; border: 1px solid #e2e8f0; text-align: right;">${item.VALOR_UNITARIO}</td>
            <td style="padding: 5px 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #1B4D3E;">${item.VALOR_TOTAL}</td>
            <td style="padding: 5px 8px; border: 1px solid #e2e8f0;">${item.MARCA} (${item.LOCAL_MARCA})</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background: #f8fafc; font-weight: bold; border-top: 2px solid #cbd5e1;">
          <td colspan="3" style="padding: 6px 8px; border: 1px solid #e2e8f0;">TOTAL GERAL DO REBANHO</td>
          <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center;">${semoventesList.reduce((acc, cur) => acc + cur.QUANTIDADE, 0)} cab</td>
          <td colspan="3" style="padding: 6px 8px; border: 1px solid #e2e8f0;"></td>
          <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: right; color: #1B4D3E;">
            ${rawLivestockList.reduce((acc: number, cur: any) => acc + ((Number(cur.quantity) || 0) * (Number(cur.unitValue) || 0)), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </td>
          <td style="padding: 6px 8px; border: 1px solid #e2e8f0;"></td>
        </tr>
      </tfoot>
    </table>
  ` : '<p style="color: #64748b; font-style: italic; margin-top: 10px;">Nenhum semovente cadastrado para este imóvel.</p>'

  resolvedVariables['TABELA_SEMOVENTES'] = semoventesTableHtml

  // Add Data do Sistema
  resolvedVariables['DATA_EXTENSO'] = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  resolvedVariables['DATA_CURTA'] = new Date().toLocaleDateString('pt-BR')
  
  // Add Tipagem do Documento do Produtor
  resolvedVariables['PRODUCER_DOCUMENT_TYPE'] = producer.type === 'PJ' ? 'CNPJ' : 'CPF'
  
  // Also provide a formatted document type variable (e.g. "CNPJ: 12.345.678/0001-90")
  const rawDocument = producer.document || ''
  const formattedDoc = producer.type === 'PF' ? formatCPF(rawDocument) : formatCNPJ(rawDocument)
  resolvedVariables['PRODUCER_DOCUMENT_WITH_TYPE'] = `${producer.type === 'PJ' ? 'CNPJ' : 'CPF'}: ${formattedDoc}`

  return {
    template,
    resolvedVariables,
    missingFields
  }
}

export async function saveMissingDataAndRegenerate(producerId: string, propertyId: string | null, templateCode: string, incomingData: Record<string, any>) {
  const user = await getUserContext()
  if (!user) throw new Error('Unauthorized')

  const producer = await prisma.producer.findUnique({ where: { id: producerId } })

  // Atualizar Producer
  const producerUpdates: Record<string, any> = {}
  const propertyUpdates: Record<string, any> = {}
  let livestockUpdates: Record<string, any> = {}
  let possessionUpdates: Record<string, any> = {}

  for (const [key, fieldConfig] of Object.entries(incomingData.schemaFields)) {
    const value = incomingData.values[key]
    if (value === undefined || value === '') continue

    const config = fieldConfig as any
    if (config.source === 'Producer') {
      if (producer?.type === 'PJ' && config.key.toUpperCase().includes('CPF')) {
        producerUpdates['representativeCpf'] = config.type === 'number' ? Number(value) : value
      } else {
        producerUpdates[config.field] = config.type === 'number' ? Number(value) : value
      }
    } else if (config.source === 'Property') {
      propertyUpdates[config.field] = config.type === 'number' ? Number(value) : value
    } else if (config.source === 'Property.livestock') {
      livestockUpdates[config.field] = config.type === 'number' ? Number(value) : value
    } else if (config.source === 'Property.possessionData') {
      possessionUpdates[config.field] = config.type === 'number' ? Number(value) : value
    }
  }

  if (Object.keys(producerUpdates).length > 0) {
    await prisma.producer.update({
      where: { id: producerId },
      data: producerUpdates,
    })
  }

  if (propertyId) {
    if (Object.keys(livestockUpdates).length > 0 || Object.keys(possessionUpdates).length > 0) {
      const currentProperty = await prisma.property.findUnique({ where: { id: propertyId } })
      
      if (Object.keys(livestockUpdates).length > 0) {
        propertyUpdates.livestock = {
          ...(currentProperty?.livestock as any || {}),
          ...livestockUpdates
        }
      }
      
      if (Object.keys(possessionUpdates).length > 0) {
        propertyUpdates.possessionData = {
          ...(currentProperty?.possessionData as any || {}),
          ...possessionUpdates
        }
      }
    }

    if (Object.keys(propertyUpdates).length > 0) {
      await prisma.property.update({
        where: { id: propertyId },
        data: propertyUpdates,
      })
    }
  } else if (Object.keys(propertyUpdates).length > 0 || Object.keys(livestockUpdates).length > 0 || Object.keys(possessionUpdates).length > 0) {
    // Se não há propriedade, mas o formulário pediu campos de propriedade (ex: Minuta de Posse Mansa),
    // cria uma nova propriedade vinculada ao produtor.
    const producer = await prisma.producer.findUnique({ where: { id: producerId } })
    if (producer) {
      const newProperty = await prisma.property.create({
        data: {
          name: propertyUpdates.name || propertyUpdates.propertyName || 'Propriedade Principal',
          propertyName: propertyUpdates.propertyName || propertyUpdates.name || 'Propriedade Principal',
          branchId: producer.branchId,
          ...propertyUpdates,
          livestock: livestockUpdates,
          possessionData: possessionUpdates,
          producers: {
            create: {
              producerId: producerId,
              ownershipType: 'PROPRIETARIO'
            }
          }
        }
      })
      propertyId = newProperty.id
    }
  }

  const result = await resolveDocumentData(producerId, propertyId, templateCode)
  return {
    ...result,
    newPropertyId: propertyId
  }
}

export async function saveGeneratedPdfMetadata(data: {
  producerId: string
  propertyId?: string | null
  templateCode: string
  templateVersion: number
  payloadSnapshot: any
  storagePdfPath: string
  sha256Hash?: string
}) {
  const user = await getUserContext()
  if (!user) throw new Error('Unauthorized')

  let branchIdToSave = user.branchId

  if (!branchIdToSave) {
    const producer = await prisma.producer.findUnique({
      where: { id: data.producerId },
      select: {
        branchId: true,
        branch: {
          select: { organizationId: true }
        }
      }
    })

    if (producer && user.organizationId) {
      if (producer.branch?.organizationId === user.organizationId && producer.branchId) {
        branchIdToSave = producer.branchId
      } else {
        const orgBranch = await prisma.branch.findFirst({
          where: { organizationId: user.organizationId, isActive: true },
          select: { id: true }
        })
        if (orgBranch) {
          branchIdToSave = orgBranch.id
        }
      }
    }

    if (!branchIdToSave && producer?.branchId) {
      branchIdToSave = producer.branchId
    }

    if (!branchIdToSave) {
      throw new Error('Não foi possível determinar a unidade (Branch) para salvar o histórico.')
    }
  }

  const result = await prisma.generatedForm.create({
    data: {
      branchId: branchIdToSave!,
      producerId: data.producerId,
      propertyId: data.propertyId,
      templateCode: data.templateCode,
      templateVersion: data.templateVersion,
      payloadSnapshot: data.payloadSnapshot,
      storagePdfPath: data.storagePdfPath,
      sha256Hash: data.sha256Hash || null,
    }
  })

  revalidatePath('/admin/dashboard/owner')
  return result
}
