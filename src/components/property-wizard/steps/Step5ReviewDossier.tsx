'use client'

import React, { useRef } from 'react'
import { UseFormReturn, useFormContext } from 'react-hook-form'
import { PropertyWizardFormValues } from '@/lib/validations/property-wizard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Printer,
  Save,
  FileCheck,
  CheckCircle,
  Building2,
  Tractor,
  Warehouse,
  Beef,
  Landmark,
  ShieldCheck,
} from 'lucide-react'

interface Step5ReviewDossierProps {
  form?: UseFormReturn<any>
  producerName?: string
  branchName?: string
  isSubmitting?: boolean
  onSubmit: () => void
  hasFinancialModule?: boolean
}

export function Step5ReviewDossier({
  form,
  producerName,
  branchName,
  isSubmitting = false,
  onSubmit,
  hasFinancialModule = false,
}: Step5ReviewDossierProps) {
  const context = useFormContext()
  const activeForm: UseFormReturn<any> = (form || context) as any
  // Observa os valores em tempo real para atualizar o preview imediatamente sem precisar recarregar
  const values = activeForm.watch()
  const printRef = useRef<HTMLDivElement>(null)

  const formatBRL = (val: number | undefined) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      val || 0
    )

  // Recalcula os totais SEMPRE a partir dos itens reais (fonte da verdade)
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

  // Sempre que o preview é exibido ou itens mudam, sincroniza os totais no formulário
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

  return (
    <div className="space-y-6">
      {/* Barra de Ação Superior */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Dossiê de Avaliação Patrimonial Consolidado
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Revise o documento gerado com base nas normas do Banco do Brasil e Sicredi antes de finalizar.
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

      {/* DOCUMENTO FOLHA A4 DIGITAL (LAYOUT OFICIAL BANCÁRIO) */}
      <div className="flex justify-center">
        <div
          ref={printRef}
          id="dossier-a4-document"
          className="w-full max-w-[820px] bg-white text-slate-900 border border-slate-300 shadow-xl rounded-sm p-8 sm:p-12 print:border-none print:shadow-none print:p-0 print:m-0"
          style={{ minHeight: '1050px', fontFamily: 'Inter, sans-serif' }}
        >
          {/* Header do Dossiê */}
          <div className="border-b-2 border-emerald-700 pb-4 mb-6 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-700 text-white font-bold text-xs px-2.5 py-0.5 rounded-sm uppercase tracking-wider">
                  AgroTech CRM
                </span>
                <span className="text-xs text-slate-700 uppercase font-semibold">
                  Módulo de Gestão Patrimonial & Compliance
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight mt-1.5">
                Laudo de Levantamento e Avaliação Patrimonial Rural
              </h1>
              <p className="text-xs text-slate-700">
                Padrão Operacional Banco do Brasil (SICOR / MCR) e Cooperativas de Crédito
              </p>
            </div>
            <div className="text-right text-xs text-slate-700">
              <span className="block font-semibold">Data da Emissão:</span>
              <span>{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          {/* 1. DADOS CADASTRAIS */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-1 mb-2.5">
              1. Identificação do Imóvel e Titularidade
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 text-xs">
              <div>
                <span className="text-slate-700 block text-[11px]">Propriedade:</span>
                <span className="font-bold">{values.name || '-'}</span>
              </div>
              <div>
                <span className="text-slate-700 block text-[11px]">Produtor Titular:</span>
                <span className="font-bold">{producerName || 'Não Selecionado'}</span>
              </div>
              <div>
                <span className="text-slate-700 block text-[11px]">Município / UF:</span>
                <span className="font-bold">{values.city || '-'}/{values.state || '-'}</span>
              </div>
              <div>
                <span className="text-slate-700 block text-[11px]">Vínculo:</span>
                <span className="font-bold">{values.ownershipType || 'PROPRIETARIO'} ({values.explorationPercentage || 100}%)</span>
              </div>

              <div>
                <span className="text-slate-700 block text-[11px]">Matrícula (CRI):</span>
                <span className="font-bold font-mono">{values.registrationNumber || '-'}</span>
              </div>
              <div>
                <span className="text-slate-700 block text-[11px]">Cartório / Comarca:</span>
                <span className="font-bold">{values.registryOffice || '-'} ({values.comarca || '-'})</span>
              </div>
              <div>
                <span className="text-slate-700 block text-[11px]">CCIR (INCRA):</span>
                <span className="font-bold font-mono">{values.ccir || '-'}</span>
              </div>
              <div>
                <span className="text-slate-700 block text-[11px]">ITR / NIRF:</span>
                <span className="font-bold font-mono">{values.itr || '-'}</span>
              </div>

              <div className="col-span-2 sm:col-span-4">
                <span className="text-slate-700 block text-[11px]">CAR (Cadastro Ambiental Rural):</span>
                <span className="font-bold font-mono text-[11px]">{values.car || '-'}</span>
              </div>
            </div>
          </div>

          {/* 2. ÁREAS E VTN */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-1 mb-2.5">
              2. Balanço de Áreas e Uso do Solo
            </h2>
            <div className="grid grid-cols-5 gap-2 text-center bg-slate-50 p-2.5 rounded-sm border border-slate-200 mb-2">
              <div>
                <span className="text-[10px] text-slate-700 block">Área Total</span>
                <span className="font-bold text-xs">{values.totalArea || 0} ha</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-700 block">Consolidada</span>
                <span className="font-bold text-xs">{values.consolidatedArea || 0} ha</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-700 block">Lavoura</span>
                <span className="font-bold text-xs">{values.productiveArea || 0} ha</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-700 block">Pastagens</span>
                <span className="font-bold text-xs">{values.pastureArea || 0} ha</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-700 block">Reserva/APP</span>
                <span className="font-bold text-xs">{values.preserveArea || 0} ha</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs px-1">
              <span>VTN Adotado: <strong>{formatBRL(Number(values.vtnPerHectare))} / ha</strong></span>
              <span>Valor Total Terra Nua: <strong className="text-emerald-800">{formatBRL(landTotal)}</strong></span>
            </div>
          </div>

          {/* 3. QUADRO SINTÉTICO PATRIMONIAL */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-1 mb-2.5">
              3. Resumo Consolidado do Patrimônio Avaliado
            </h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-left border-b border-slate-300">
                  <th className="p-1.5 font-bold">Item Patrimonial</th>
                  <th className="p-1.5 font-bold text-center">Quantidade / Extensão</th>
                  <th className="p-1.5 font-bold text-right">Valor Total Avaliado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-1.5 font-medium">1. Terras (Valor da Terra Nua)</td>
                  <td className="p-1.5 text-center">{values.totalArea || 0} hectares</td>
                  <td className="p-1.5 text-right font-bold">{formatBRL(landTotal)}</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-medium">2. Benfeitorias e Instalações (Tabela BB)</td>
                  <td className="p-1.5 text-center">{values.improvements?.length || 0} estruturas</td>
                  <td className="p-1.5 text-right font-bold">{formatBRL(improvementsTotal)}</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-medium">3. Máquinas, Equipamentos e Veículos</td>
                  <td className="p-1.5 text-center">{values.machineries?.length || 0} equipamentos</td>
                  <td className="p-1.5 text-right font-bold">{formatBRL(machineriesTotal)}</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-medium">4. Semoventes e Rebanho (Bovinocultura)</td>
                  <td className="p-1.5 text-center">
                    {(values.livestocks || []).reduce((acc: number, cur: any) => acc + Number(cur.quantity || 0), 0)} cabeças
                  </td>
                  <td className="p-1.5 text-right font-bold">{formatBRL(livestockTotal)}</td>
                </tr>
                <tr className="bg-emerald-50/80 font-bold border-t-2 border-emerald-700">
                  <td className="p-2 text-emerald-950 uppercase">PATRIMÔNIO BRUTO TOTAL AVALIADO</td>
                  <td className="p-2 text-center text-emerald-950">-</td>
                  <td className="p-2 text-right text-emerald-800 text-sm">{formatBRL(totalAssets)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. ROTEIRO DE ACESSO */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-1 mb-1.5">
              4. Roteiro de Acesso & Vistoria Prévia
            </h2>
            <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded-sm border border-slate-200">
              {values.accessRoute || 'Roteiro de acesso não informado.'}
            </p>
          </div>

          {/* 5. CAPACIDADE DE PAGAMENTO */}
          {hasFinancialModule && (
            <div className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-1 mb-2">
                5. Capacidade de Pagamento Anual
              </h2>
              <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2 rounded-sm border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-700 block">Receitas Anuais</span>
                  <span className="font-bold">
                    {formatBRL((Number(values.effectiveAgroRevenue) || 0) + (Number(values.otherRevenues) || 0))}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-700 block">Despesas + Dívidas</span>
                  <span className="font-bold text-red-700">
                    {formatBRL((Number(values.operationalExpenses) || 0) + (Number(values.existingDebtService) || 0) + (Number(values.familyLivingCosts) || 0))}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-700 block">Margem Líquida</span>
                  <span className="font-bold text-emerald-700">
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

          {/* BLOCO DE ASSINATURAS */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 mx-6"></div>
              <span className="font-bold block">{producerName || 'Produtor Rural'}</span>
              <span className="text-slate-700 text-[11px]">Proponente / Titular do Imóvel</span>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 mx-6"></div>
              <span className="font-bold block">Responsável Técnico / RT</span>
              <span className="text-slate-700 text-[11px]">Eng. Agrônomo / Técnico Agropecuária (ART/TRT)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
