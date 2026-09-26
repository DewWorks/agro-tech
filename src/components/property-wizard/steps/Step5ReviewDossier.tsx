'use client'

import React, { useRef } from 'react'
import { UseFormReturn, useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Printer,
  Save,
  FileCheck,
  Building2,
  Tractor,
  Warehouse,
  Beef,
  Landmark,
  ShieldCheck,
  FileText,
  Compass,
  Wallet,
  UserCheck,
} from 'lucide-react'
import { denormalizeCategoryBB, denormalizePurposeBB } from '@/lib/validations/livestock-mapper'

const OWNERSHIP_LABELS: Record<string, string> = {
  PROPRIETARIO: 'Proprietário',
  ARRENDATARIO: 'Arrendatário',
  MEEIRO: 'Meeiro',
  COMODATARIO: 'Comodatário',
  PARCEIRO: 'Parceiro Rural',
  CONDOMINO: 'Condômino',
  USUFRUTUARIO: 'Usufrutuário',
  POSSEIRO: 'Posseiro',
}

interface Step5ReviewDossierProps {
  form?: UseFormReturn<any>
  producerName?: string
  selectedProducer?: any
  branchName?: string
  isSubmitting?: boolean
  onSubmit: () => void
  hasFinancialModule?: boolean
  isFinancialModuleDisabledForOrg?: boolean
}

export function Step5ReviewDossier({
  form,
  producerName,
  selectedProducer,
  branchName,
  isSubmitting = false,
  onSubmit,
  hasFinancialModule = false,
  isFinancialModuleDisabledForOrg = false,
}: Step5ReviewDossierProps) {
  const context = useFormContext()
  const activeForm: UseFormReturn<any> = (form || context) as any
  const values = activeForm.watch()
  const printRef = useRef<HTMLDivElement>(null)

  const formatBRL = (val: number | undefined) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      val || 0
    )

  // Itens reais do formulário
  const machineriesList = values.machineries || []
  const improvementsList = values.improvements || []
  const livestocksList = values.livestocks || []
  const totalAreaNum = Number(values.totalArea || 0)
  const vtnNum = Number(values.vtnPerHectare || 0)

  const landTotal = Math.round(totalAreaNum * vtnNum * 100) / 100
  const machineriesTotal = machineriesList.reduce(
    (acc: number, cur: any) => acc + (Number(cur.value) || 0),
    0
  )
  const improvementsTotal = improvementsList.reduce(
    (acc: number, cur: any) => acc + ((Number(cur.quantity) || 0) * (Number(cur.unitValue) || 0)),
    0
  )
  const livestockTotal = livestocksList.reduce(
    (acc: number, cur: any) => acc + ((Number(cur.quantity) || 0) * (Number(cur.unitValue) || 0)),
    0
  )
  const totalAssets = landTotal + machineriesTotal + improvementsTotal + livestockTotal
  const totalHeadCount = livestocksList.reduce(
    (acc: number, cur: any) => acc + Number(cur.quantity || 0),
    0
  )

  // Sincroniza os totais calculados no formulário
  React.useEffect(() => {
    const curLand = activeForm.getValues('computedLandValue')
    const curMach = activeForm.getValues('computedMachineryValue')
    const curImp = activeForm.getValues('computedImprovementsValue')
    const curLive = activeForm.getValues('computedLivestockValue')
    const curTotal = activeForm.getValues('computedTotalAssets')

    if (curLand !== landTotal) activeForm.setValue('computedLandValue', landTotal)
    if (curMach !== machineriesTotal) activeForm.setValue('computedMachineryValue', machineriesTotal)
    if (curImp !== improvementsTotal) activeForm.setValue('computedImprovementsValue', improvementsTotal)
    if (curLive !== livestockTotal) activeForm.setValue('computedLivestockValue', livestockTotal)
    if (curTotal !== totalAssets) activeForm.setValue('computedTotalAssets', totalAssets)
  }, [landTotal, machineriesTotal, improvementsTotal, livestockTotal, totalAssets, activeForm])

  const handlePrint = () => {
    window.print()
  }

  const resolvedProducerName = producerName || selectedProducer?.name || 'Não Selecionado'
  const isMarriedOrStable = selectedProducer?.civilStatus === 'CASADO' || selectedProducer?.civilStatus === 'UNIAO_ESTAVEL'

  return (
    <div className="space-y-6">
      {/* Barra de Ação Superior */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Dossiê de Avaliação Patrimonial e Laudo Técnico Analítico
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Padrão Operacional Banco do Brasil (SICOR / MCR), Sicredi, Sicoob e BASA com discriminação item a item.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs border-slate-300 dark:border-slate-700 cursor-pointer"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Imprimir / PDF
          </Button>

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={onSubmit}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold h-9 px-5 shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {isSubmitting ? 'Salvando...' : 'Salvar no CRM e Emitir'}
          </Button>
        </div>
      </div>

      {/* DOCUMENTO FOLHA A4 DIGITAL (LAYOUT ANALÍTICO OFICIAL BANCÁRIO) */}
      <div className="flex justify-center">
        <div
          ref={printRef}
          id="dossier-a4-document"
          className="w-full max-w-[860px] bg-white text-slate-900 border border-slate-300 shadow-xl rounded-sm p-6 sm:p-10 print:border-none print:shadow-none print:p-0 print:m-0"
          style={{ minHeight: '1050px', fontFamily: 'Inter, sans-serif' }}
        >
          {/* Header do Dossiê */}
          <div className="border-b-2 border-emerald-700 pb-4 mb-5 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-700 text-white font-bold text-xs px-2.5 py-0.5 rounded-sm uppercase tracking-wider">
                  AgroTech CRM
                </span>
                <span className="text-xs text-slate-700 uppercase font-semibold">
                  Módulo de Gestão Patrimonial & Crédito Rural
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 uppercase tracking-tight mt-1.5">
                Laudo Técnico de Vistoria e Avaliação Patrimonial Rural
              </h1>
              <p className="text-xs text-slate-600">
                Padrão Operacional Banco do Brasil (SICOR / MCR) e Cooperativas de Crédito (Sicredi / Sicoob)
              </p>
            </div>
            <div className="text-right text-xs text-slate-700">
              <span className="block font-semibold">Emissão: {new Date().toLocaleDateString('pt-BR')}</span>
              {branchName && <span className="text-slate-500 text-[11px] block">Filial: {branchName}</span>}
            </div>
          </div>

          {/* 1. QUALIFICAÇÃO DO PROPONENTE, CÔNJUGE E DOMICÍLIO BANCÁRIO */}
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-1 mb-2.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              1. Qualificação do Proponente, Cônjuge e Domicílio Bancário
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Proponente Titular:</span>
                <span className="font-bold">{resolvedProducerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">CPF / CNPJ:</span>
                <span className="font-bold font-mono">{selectedProducer?.document || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">RG / Órgão Emissor:</span>
                <span className="font-bold">
                  {selectedProducer?.rg ? `${selectedProducer.rg} (${selectedProducer.rgIssuer || 'SSP'})` : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Escolaridade:</span>
                <span className="font-bold">
                  {selectedProducer?.educationLevel ? selectedProducer.educationLevel.replace(/_/g, ' ') : '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Estado Civil:</span>
                <span className="font-bold">{selectedProducer?.civilStatus || 'SOLTEIRO'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Regime de Bens:</span>
                <span className="font-bold">
                  {selectedProducer?.marriageRegime ? selectedProducer.marriageRegime.replace(/_/g, ' ') : 'NÃO APLICÁVEL'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Cônjuge (Outorga Uxória):</span>
                <span className="font-bold">{isMarriedOrStable ? (selectedProducer?.spouseName || '-') : 'NÃO APLICÁVEL'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">CPF / RG Cônjuge:</span>
                <span className="font-bold font-mono">
                  {isMarriedOrStable ? `${selectedProducer?.spouseCpf || '-'} / ${selectedProducer?.spouseRg || '-'}` : '-'}
                </span>
              </div>

              {/* Domicílio Bancário */}
              <div className="col-span-2 sm:col-span-4 mt-1 pt-1.5 border-t border-dashed border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-slate-500 block text-[11px]">Instituição Financeira:</span>
                  <span className="font-bold">{selectedProducer?.bankName || values.creditLimitTargetBank || '001 - Banco do Brasil'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Agência:</span>
                  <span className="font-bold font-mono">{selectedProducer?.bankAgency || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Conta Bancária:</span>
                  <span className="font-bold font-mono">
                    {selectedProducer?.bankAccount || '-'} ({selectedProducer?.bankAccountType || 'CORRENTE'})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Porte do Produtor:</span>
                  <span className="font-bold">
                    {selectedProducer?.producerSize ? selectedProducer.producerSize.replace(/_/g, ' ') : 'MÉDIO (PRONAMP)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. IDENTIFICAÇÃO FUNDIÁRIA, SITUAÇÃO E CONFRONTAÇÕES */}
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-1 mb-2.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              2. Identificação Fundiária, Posse e Confrontações Perimétricas
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Propriedade:</span>
                <span className="font-bold">{values.name || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Município / UF:</span>
                <span className="font-bold">{values.city || '-'}/{values.state || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Situação do Imóvel:</span>
                <span className={`font-bold ${values.propertyStatus === 'FINANCIADA' ? 'text-amber-800' : 'text-emerald-800'}`}>
                  {values.propertyStatus === 'FINANCIADA' ? 'Financiada (Alienação/Hipoteca Ativa)' : 'Quitada (Livre de Ônus)'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Vínculo com a Terra:</span>
                <span className="font-bold">
                  {OWNERSHIP_LABELS[values.ownershipType] || values.ownershipType || 'Proprietário'} ({values.explorationPercentage || 100}%)
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Matrícula (CRI):</span>
                <span className="font-bold font-mono">{values.registrationNumber || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Cartório / Comarca:</span>
                <span className="font-bold">{values.registryOffice || '-'} ({values.comarca || '-'})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">CCIR (INCRA):</span>
                <span className="font-bold font-mono">{values.ccir || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">ITR / NIRF:</span>
                <span className="font-bold font-mono">{values.itr || '-'}</span>
              </div>

              <div className="col-span-2 sm:col-span-4">
                <span className="text-slate-500 block text-[11px]">CAR (Cadastro Ambiental Rural):</span>
                <span className="font-bold font-mono text-[11px]">{values.car || '-'}</span>
              </div>

              {/* Bloco Condicional para Não Proprietários */}
              {values.ownershipType && values.ownershipType !== 'PROPRIETARIO' && (
                <div className="col-span-2 sm:col-span-4 mt-1 p-2.5 bg-amber-50/80 border border-amber-200 rounded text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-amber-900 block text-[10px] font-semibold">Cedente / Proprietário da Terra:</span>
                    <span className="font-bold">{values.landlordName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-amber-900 block text-[10px] font-semibold">CPF/CNPJ do Cedente:</span>
                    <span className="font-bold font-mono">{values.landlordDocument || '-'}</span>
                  </div>
                  <div>
                    <span className="text-amber-900 block text-[10px] font-semibold">Vigência Contratual:</span>
                    <span className="font-bold font-mono">
                      {values.contractStartDate || '-'} até {values.contractEndDate || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-amber-900 block text-[10px] font-semibold">Área Cedida Explorada:</span>
                    <span className="font-bold font-mono">{values.exploredAreaHa || 0} ha</span>
                  </div>
                </div>
              )}

              {/* Confrontações Perimétricas */}
              <div className="col-span-2 sm:col-span-4 mt-1.5 pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Limites e Confrontações Perimétricas da Propriedade
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-semibold">Norte:</span>
                    <span className="font-medium">{values.confrontantNorth || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-semibold">Sul:</span>
                    <span className="font-medium">{values.confrontantSouth || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-semibold">Leste:</span>
                    <span className="font-medium">{values.confrontantEast || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-semibold">Oeste:</span>
                    <span className="font-medium">{values.confrontantWest || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. ÁREAS E VTN */}
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-1 mb-2.5">
              3. Balanço de Áreas e Avaliação da Terra Nua (VTN)
            </h2>
            <div className="grid grid-cols-5 gap-2 text-center bg-slate-50 p-2.5 rounded-sm border border-slate-200 mb-2">
              <div>
                <span className="text-[10px] text-slate-500 block">Área Total</span>
                <span className="font-bold text-xs">{values.totalArea || 0} ha</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Consolidada</span>
                <span className="font-bold text-xs">{values.consolidatedArea || 0} ha</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Lavoura</span>
                <span className="font-bold text-xs">{values.productiveArea || 0} ha</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Pastagens</span>
                <span className="font-bold text-xs">{values.pastureArea || 0} ha</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Reserva/APP</span>
                <span className="font-bold text-xs">{values.preserveArea || 0} ha</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs px-1">
              <span>VTN Médio Adotado: <strong>{formatBRL(Number(values.vtnPerHectare))} / ha</strong></span>
              <span>Valor Total da Terra Nua: <strong className="text-emerald-800 font-mono text-sm">{formatBRL(landTotal)}</strong></span>
            </div>
          </div>

          {/* 4. TABELA ANALÍTICA 1: BENFEITORIAS E INSTALAÇÕES (ITEM A ITEM) */}
          <div className="mb-5 print:break-inside-avoid">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Warehouse className="w-3.5 h-3.5" />
                4. Benfeitorias, Instalações e Pastagens Artificiais (Item a Item)
              </h2>
              <span className="text-[10px] font-semibold text-slate-500">
                {improvementsList.length} item(ns)
              </span>
            </div>
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-left border-b border-slate-300">
                  <th className="p-1.5 font-bold">Item / Especificação</th>
                  <th className="p-1.5 font-bold text-center">Unid.</th>
                  <th className="p-1.5 font-bold text-center">Qtd.</th>
                  <th className="p-1.5 font-bold text-right">Valor Unit. (R$)</th>
                  <th className="p-1.5 font-bold text-right">Subtotal (R$)</th>
                  <th className="p-1.5 font-bold text-center">Conservação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {improvementsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-2 text-center text-slate-500 italic">
                      Nenhuma benfeitoria ou pastagem artificial informada.
                    </td>
                  </tr>
                ) : (
                  improvementsList.map((imp: any, idx: number) => {
                    const isArtPast = imp.isArtificialPasture || imp.specification === 'Pastagem Artificial'
                    const sub = (Number(imp.quantity) || 0) * (Number(imp.unitValue) || 0)
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-1.5 font-medium">
                          {imp.specification || '-'}
                          {isArtPast && (
                            <span className="ml-1.5 text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                              Pastagem Artificial
                            </span>
                          )}
                        </td>
                        <td className="p-1.5 text-center">{imp.unit || (isArtPast ? 'ha' : 'm²')}</td>
                        <td className="p-1.5 text-center font-mono">{imp.quantity || 0}</td>
                        <td className="p-1.5 text-right font-mono">{formatBRL(Number(imp.unitValue))}</td>
                        <td className="p-1.5 text-right font-mono font-bold">{formatBRL(sub)}</td>
                        <td className="p-1.5 text-center font-semibold text-[10px]">{imp.conservationState || 'BOM'}</td>
                      </tr>
                    )
                  })
                )}
                <tr className="bg-slate-50 font-bold border-t border-slate-300">
                  <td colSpan={4} className="p-1.5 text-right text-slate-700">Subtotal Benfeitorias e Pastagens:</td>
                  <td className="p-1.5 text-right font-mono text-emerald-800 font-bold">{formatBRL(improvementsTotal)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5. TABELA ANALÍTICA 2: MÁQUINAS, TRATORES E IMPLEMENTOS (ITEM A ITEM) */}
          <div className="mb-5 print:break-inside-avoid">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Tractor className="w-3.5 h-3.5" />
                5. Máquinas, Tratores, Equipamentos e Veículos (Item a Item)
              </h2>
              <span className="text-[10px] font-semibold text-slate-500">
                {machineriesList.length} equipamento(s)
              </span>
            </div>
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-left border-b border-slate-300">
                  <th className="p-1.5 font-bold">Item / Especificação</th>
                  <th className="p-1.5 font-bold">Marca / Modelo</th>
                  <th className="p-1.5 font-bold text-center">Ano</th>
                  <th className="p-1.5 font-bold text-left">Chassi / Nº de Série</th>
                  <th className="p-1.5 font-bold text-center">Part. %</th>
                  <th className="p-1.5 font-bold text-right">Valor Mercado</th>
                  <th className="p-1.5 font-bold text-center">Ônus / Gravame</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {machineriesList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-2 text-center text-slate-500 italic">
                      Nenhum maquinário cadastrado.
                    </td>
                  </tr>
                ) : (
                  machineriesList.map((m: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-1.5 font-medium">{m.category || m.specification || '-'}</td>
                      <td className="p-1.5">{m.brand || '-'} {m.model || ''}</td>
                      <td className="p-1.5 text-center font-mono">{m.year || '-'}</td>
                      <td className="p-1.5 font-mono text-[10px] text-slate-900 uppercase font-semibold">
                        {m.chassisSerial || <span className="text-amber-700 italic">Não informado</span>}
                      </td>
                      <td className="p-1.5 text-center font-mono">{m.participationPercent ?? 100}%</td>
                      <td className="p-1.5 text-right font-mono font-bold">{formatBRL(Number(m.value))}</td>
                      <td className="p-1.5 text-center text-[10px]">
                        {m.hasLien ? (
                          <span className="text-amber-800 font-bold bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                            Alienado {m.lienInstitution ? `(${m.lienInstitution})` : ''}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold">Livre de Ônus</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
                <tr className="bg-slate-50 font-bold border-t border-slate-300">
                  <td colSpan={5} className="p-1.5 text-right text-slate-700">Subtotal Máquinas e Veículos:</td>
                  <td className="p-1.5 text-right font-mono text-emerald-800 font-bold">{formatBRL(machineriesTotal)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 6. TABELA ANALÍTICA 3: SEMOVENTES E REBANHO (ITEM A ITEM) */}
          <div className="mb-5 print:break-inside-avoid">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Beef className="w-3.5 h-3.5" />
                6. Semoventes e Rebanho (Categorias e Finalidades Oficiais BB)
              </h2>
              <span className="text-[10px] font-semibold text-slate-500">
                {totalHeadCount} cabeça(s)
              </span>
            </div>
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-left border-b border-slate-300">
                  <th className="p-1.5 font-bold">Categoria BB</th>
                  <th className="p-1.5 font-bold">Finalidade BB</th>
                  <th className="p-1.5 font-bold">Raça</th>
                  <th className="p-1.5 font-bold text-center">Cabeças</th>
                  <th className="p-1.5 font-bold text-center">Idade / Peso</th>
                  <th className="p-1.5 font-bold text-right">Valor Unit.</th>
                  <th className="p-1.5 font-bold text-right">Subtotal</th>
                  <th className="p-1.5 font-bold text-left">Marcação & Local</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {livestocksList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-2 text-center text-slate-500 italic">
                      Nenhum lote de semovente cadastrado.
                    </td>
                  </tr>
                ) : (
                  livestocksList.map((l: any, idx: number) => {
                    const sub = (Number(l.quantity) || 0) * (Number(l.unitValue) || 0)
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-1.5 font-medium">{denormalizeCategoryBB(l.categoryBB || l.category)}</td>
                        <td className="p-1.5 text-[10px]">{denormalizePurposeBB(l.purposeBB || l.purpose)}</td>
                        <td className="p-1.5">{l.breed || 'Nelore'}</td>
                        <td className="p-1.5 text-center font-mono font-bold">{l.quantity || 0}</td>
                        <td className="p-1.5 text-center text-[10px] font-mono">
                          {l.ageMonths ? `${l.ageMonths}m` : '-'} / {l.avgWeightKg ? `${l.avgWeightKg}kg` : '-'}
                        </td>
                        <td className="p-1.5 text-right font-mono">{formatBRL(Number(l.unitValue))}</td>
                        <td className="p-1.5 text-right font-mono font-bold">{formatBRL(sub)}</td>
                        <td className="p-1.5 text-[10px]">
                          {l.brandingType || l.markingType || 'Ferro Quente'}
                          {l.brandingLocation || l.markingLocation ? ` (${l.brandingLocation || l.markingLocation})` : ''}
                        </td>
                      </tr>
                    )
                  })
                )}
                <tr className="bg-slate-50 font-bold border-t border-slate-300">
                  <td colSpan={6} className="p-1.5 text-right text-slate-700">Subtotal Semoventes ({totalHeadCount} cabeças):</td>
                  <td className="p-1.5 text-right font-mono text-emerald-800 font-bold">{formatBRL(livestockTotal)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 7. QUADRO SINTÉTICO PATRIMONIAL CONSOLIDADO */}
          <div className="mb-5 print:break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-1 mb-2">
              7. Resumo Consolidado do Patrimônio Avaliado
            </h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-left border-b border-slate-300">
                  <th className="p-1.5 font-bold">Classe Patrimonial</th>
                  <th className="p-1.5 font-bold text-center">Extensão / Quantidade</th>
                  <th className="p-1.5 font-bold text-right">Valor Total Avaliado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-1.5 font-medium">1. Terras (Valor da Terra Nua - VTN)</td>
                  <td className="p-1.5 text-center font-mono">{values.totalArea || 0} ha</td>
                  <td className="p-1.5 text-right font-mono font-bold">{formatBRL(landTotal)}</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-medium">2. Benfeitorias, Instalações e Pastagens Artificiais</td>
                  <td className="p-1.5 text-center font-mono">{improvementsList.length} itens</td>
                  <td className="p-1.5 text-right font-mono font-bold">{formatBRL(improvementsTotal)}</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-medium">3. Máquinas, Equipamentos e Veículos</td>
                  <td className="p-1.5 text-center font-mono">{machineriesList.length} unidades</td>
                  <td className="p-1.5 text-right font-mono font-bold">{formatBRL(machineriesTotal)}</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-medium">4. Semoventes e Rebanho (Bovinocultura)</td>
                  <td className="p-1.5 text-center font-mono">{totalHeadCount} cabeças</td>
                  <td className="p-1.5 text-right font-mono font-bold">{formatBRL(livestockTotal)}</td>
                </tr>
                <tr className="bg-emerald-50/90 font-bold border-t-2 border-emerald-700">
                  <td className="p-2 text-emerald-950 uppercase font-extrabold">PATRIMÔNIO BRUTO TOTAL AVALIADO</td>
                  <td className="p-2 text-center text-emerald-950">-</td>
                  <td className="p-2 text-right text-emerald-900 text-sm font-mono font-extrabold">{formatBRL(totalAssets)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 8. ROTEIRO DE ACESSO */}
          <div className="mb-5 print:break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              8. Roteiro de Acesso & Vistoria Prévia
            </h2>
            <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded-sm border border-slate-200">
              {values.accessRoute || 'Roteiro de acesso não informado.'}
            </p>
          </div>

          {/* 9. CAPACIDADE DE PAGAMENTO (SE ATIVO) */}
          {hasFinancialModule && (
            <div className="mb-6 print:break-inside-avoid">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5" />
                  9. Capacidade de Pagamento Anual & Limite MCR
                </h2>
                {isFinancialModuleDisabledForOrg && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                    Módulo Opcional
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2 rounded-sm border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 block">Receitas Anuais</span>
                  <span className="font-bold font-mono">
                    {formatBRL((Number(values.effectiveAgroRevenue) || 0) + (Number(values.otherRevenues) || 0))}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Despesas + Dívidas</span>
                  <span className="font-bold font-mono text-red-700">
                    {formatBRL((Number(values.operationalExpenses) || 0) + (Number(values.existingDebtService) || 0) + (Number(values.familyLivingCosts) || 0))}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Margem Líquida</span>
                  <span className="font-bold font-mono text-emerald-700">
                    {formatBRL(
                      (Number(values.effectiveAgroRevenue) || 0) +
                        (Number(values.otherRevenues) || 0) -
                        ((Number(values.operationalExpenses) || 0) +
                          (Number(values.existingDebtService) || 0) +
                          (Number(values.familyLivingCosts) || 0))
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 10. TERMO DE RESPONSABILIDADE TÉCNICA E ASSINATURAS */}
          <div className="mt-8 pt-4 border-t border-slate-300 print:break-inside-avoid">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 leading-relaxed mb-8">
              <strong className="block text-slate-900 mb-1 font-semibold">
                Termo de Responsabilidade Técnica e Veracidade dos Dados:
              </strong>
              Declaro para os devidos fins de comprovação cadastral e análise de crédito rural que as informações físicas,
              quantitativas e mercadológicas constantes neste Laudo de Levantamento e Avaliação Patrimonial foram levantadas
              com fidedignidade, espelhando a realidade fática, documental e patrimonial do imóvel e do proponente na data da vistoria.
            </div>

            <div className="grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="border-b border-slate-400 pb-1 mb-1 mx-6"></div>
                <span className="font-bold block text-slate-900">{resolvedProducerName}</span>
                <span className="text-slate-600 text-[11px] block">Proponente / Titular Avaliado</span>
                {selectedProducer?.document && (
                  <span className="text-slate-500 text-[10px] block font-mono">CPF/CNPJ: {selectedProducer.document}</span>
                )}
              </div>
              <div>
                <div className="border-b border-slate-400 pb-1 mb-1 mx-6"></div>
                <span className="font-bold block text-slate-900">Lindomar Pereira Cardoso</span>
                <span className="text-slate-700 text-[11px] block font-medium">Técnico em Agropecuária / Projetista Rural</span>
                <span className="text-slate-500 text-[10px] block font-mono">Registro Profissional: CFT / CRT-TO</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
