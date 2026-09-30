import {
  PropertyWizardFormValues,
  defaultPropertyWizardValues,
} from '@/lib/validations/property-wizard'
import { denormalizeCategoryBB, denormalizePurposeBB } from '@/lib/validations/livestock-mapper'
import { toDMS } from '../subcomponents/FarmMapModal'

export interface MapPropertyInitialValuesParams {
  initialData?: any
  branches: Array<{ id: string; name: string }>
  producers: Array<{ id: string; name: string; document?: string; branchId?: string }>
  initialProducerId?: string
  initialBranchId?: string
}

export function mapPropertyToInitialValues({
  initialData,
  branches,
  producers,
  initialProducerId,
  initialBranchId,
}: MapPropertyInitialValuesParams): Partial<PropertyWizardFormValues> {
  if (!initialData) {
    const selectedProducer = initialProducerId
      ? producers.find((p) => p.id === initialProducerId)
      : producers.length === 1
      ? producers[0]
      : null

    const defaultBranchId =
      initialBranchId ||
      selectedProducer?.branchId ||
      branches[0]?.id ||
      ''

    return {
      ...defaultPropertyWizardValues,
      branchId: defaultBranchId,
      producerId: selectedProducer?.id || '',
    }
  }

  const primaryProducer =
    initialData.producers && initialData.producers.length > 0
      ? initialData.producers[0]
      : null

  return {
    ...defaultPropertyWizardValues,
    name: initialData.name || initialData.propertyName || '',
    branchId: initialData.branchId || branches[0]?.id || '',
    producerId: primaryProducer?.producerId || initialData.producerId || producers[0]?.id || '',
    ownershipType: primaryProducer?.ownershipType || initialData.ownershipType || 'PROPRIETARIO',
    propertyStatus: initialData.propertyStatus || initialData.financialStatus || 'QUITADA',
    explorationPercentage: primaryProducer?.explorationPercentage ?? 100,
    contractStartDate: primaryProducer?.contractStartDate
      ? new Date(primaryProducer.contractStartDate).toISOString().split('T')[0]
      : '',
    contractEndDate: primaryProducer?.contractEndDate
      ? new Date(primaryProducer.contractEndDate).toISOString().split('T')[0]
      : '',
    landlordName: primaryProducer?.landlordName || '',
    landlordDocument: primaryProducer?.landlordDocument || '',
    contractType: primaryProducer?.contractType || 'ARRENDAMENTO',
    exploredAreaHa: Number(primaryProducer?.exploredAreaHa) || 0,
    registrationNumber: initialData.registrationNumber || '',
    registryOffice: initialData.registryOffice || '',
    comarca: initialData.comarca || '',
    car: initialData.car || '',
    ccir: initialData.ccir || '',
    itr: initialData.itr || '',
    explorationActivity: initialData.explorationActivity || 'Pecuária de Cria',
    possessionYears: initialData.possessionData?.possessionYears || 0,
    totalArea: Number(initialData.totalArea) || 0,
    consolidatedArea: Number(initialData.consolidatedArea) || 0,
    productiveArea: Number(initialData.productiveArea) || 0,
    pastureArea: Number(initialData.pastureArea) || 0,
    preserveArea: Number(initialData.preserveArea) || 0,
    ruralModules: Number(initialData.ruralModules) || 0,
    vtnPerHectare: Number(
      initialData.vtnValuePerHa ??
        initialData.vtnPerHectare ??
        initialData.possessionData?.vtnPerHectare ??
        initialData.improvements?.estimatedLandValuePerHa
    ) || 0,
    totalLandValue: Number(
      initialData.totalVtnAmount ??
        initialData.totalLandValue ??
        initialData.possessionData?.totalLandValue
    ) || 0,
    city: initialData.city || '',
    state: initialData.state || 'TO',
    latitude:
      initialData.latitude !== undefined && initialData.latitude !== null && initialData.latitude !== ''
        ? typeof initialData.latitude === 'number'
          ? toDMS(initialData.latitude, true)
          : String(initialData.latitude)
        : '',
    longitude:
      initialData.longitude !== undefined && initialData.longitude !== null && initialData.longitude !== ''
        ? typeof initialData.longitude === 'number'
          ? toDMS(initialData.longitude, false)
          : String(initialData.longitude)
        : '',
    accessRoute: initialData.accessRoute || '',
    confrontantNorth:
      initialData.confrontantNorth ||
      initialData.confrontants?.norte ||
      initialData.confrontants?.north ||
      '',
    confrontantSouth:
      initialData.confrontantSouth ||
      initialData.confrontants?.sul ||
      initialData.confrontants?.south ||
      '',
    confrontantEast:
      initialData.confrontantEast ||
      initialData.confrontants?.leste ||
      initialData.confrontants?.east ||
      '',
    confrontantWest:
      initialData.confrontantWest ||
      initialData.confrontants?.oeste ||
      initialData.confrontants?.west ||
      '',
    impenhorabilidade: initialData.seizureStatus || 'PENHORAVEL',
    hasLien: Boolean(initialData.hasLien),
    hasInsurance: Boolean(initialData.hasInsurance),
    isBorderProperty: Boolean(initialData.isBorderProperty),
    conservationState: initialData.conservationState || 'BOM',

    // Arrays relacionais
    machineries:
      initialData.machineries?.map((m: any) => ({
        id: m.id,
        category: m.specification || 'Trator de Pneus',
        brand: m.brand || '',
        model: m.model || '',
        year: m.year || new Date().getFullYear(),
        powerCapacity: m.powerCapacity || '',
        chassisSerial: m.chassisSerial || '',
        participationPercent: m.participationPercent ?? 100,
        value: Number(m.value) || 0,
        hasLien: Boolean(m.hasLien),
        lienInstitution: m.lienInstitution || '',
      })) || [],

    improvements:
      initialData.improvementsList?.map((imp: any) => ({
        id: imp.id,
        specification: imp.specification || '',
        unit: imp.unit || (imp.isArtificialPasture ? 'ha' : 'm²'),
        quantity: Number(imp.quantity) || 0,
        unitValue: Number(imp.unitValue) || 0,
        totalValue: (Number(imp.quantity) || 0) * (Number(imp.unitValue) || 0),
        conservationState: 'BOM',
        observation: imp.observation || '',
        isArtificialPasture: Boolean(imp.isArtificialPasture || imp.specification === 'Pastagem Artificial'),
      })) || [],

    livestocks:
      (initialData.livestockList || initialData.livestocks)?.map((l: any) => {
        const cat = denormalizeCategoryBB(l.categoryBB || l.category)
        const pur = denormalizePurposeBB(l.purposeBB || l.purpose)
        return {
          id: l.id,
          species: l.species || 'BOVINO',
          category: cat,
          categoryBB: cat,
          purpose: pur,
          purposeBB: pur,
          breed: l.breed || 'Nelore',
          geneticGrade: '1/2 Sangue',
          quantity: Number(l.quantity) || 0,
          ageMonths: Number(l.ageMonths) || 0,
          avgWeightKg: Number(l.avgWeightKg) || 0,
          unitValue: Number(l.unitValue) || 0,
          totalValue: (Number(l.quantity) || 0) * (Number(l.unitValue) || 0),
          markingType: l.brandingType || l.markingType || 'Ferro Quente',
          markingLocation: l.brandingLocation || l.markingLocation || 'Perna Traseira Direita',
        }
      }) || [],

    // Dados Financeiros e Base de Limite de Crédito (Aditivo 003)
    effectiveAgroRevenue: Number(initialData.possessionData?.effectiveAgroRevenue) || 0,
    projectedAgroRevenue: Number(initialData.possessionData?.projectedAgroRevenue) || 0,
    otherRevenues: Number(initialData.possessionData?.otherRevenues) || 0,
    operationalExpenses: Number(initialData.possessionData?.operationalExpenses) || 0,
    existingDebtService: Number(initialData.possessionData?.existingDebtService) || 0,
    familyLivingCosts: Number(initialData.possessionData?.familyLivingCosts) || 0,
    creditLimitRequested: Number(initialData.possessionData?.creditLimitRequested) || 0,
    creditLimitPurpose: initialData.possessionData?.creditLimitPurpose || 'CUSTEIO_AGRICOLA',
    creditLimitTargetBank: initialData.possessionData?.creditLimitTargetBank || 'BANCO_DO_BRASIL',
    creditLimitTermMonths: Number(initialData.possessionData?.creditLimitTermMonths) || 12,
    creditLimitNotes: initialData.possessionData?.creditLimitNotes || '',
    amortizationSystem: initialData.possessionData?.amortizationSystem || 'PRICE',
    creditLineCode: initialData.possessionData?.creditLineCode || 'PRONAMP_CUSTEIO',
    interestRateAnnual: Number(initialData.possessionData?.interestRateAnnual) || 8.0,
    gracePeriodMonths: Number(initialData.possessionData?.gracePeriodMonths) || 0,
    urbanProperties: Array.isArray(initialData.possessionData?.urbanProperties)
      ? initialData.possessionData.urbanProperties
      : [],
    vehicles: Array.isArray(initialData.possessionData?.vehicles)
      ? initialData.possessionData.vehicles
      : [],
    customAgroRevenues: Array.isArray(initialData.possessionData?.customAgroRevenues)
      ? initialData.possessionData.customAgroRevenues
      : [],
    customExpenses: Array.isArray(initialData.possessionData?.customExpenses)
      ? initialData.possessionData.customExpenses
      : [],
  }
}
