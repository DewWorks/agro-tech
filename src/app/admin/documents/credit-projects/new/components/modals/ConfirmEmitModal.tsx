import React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShieldCheck, User, Landmark, Coins, Building2, Loader2, Download } from 'lucide-react'
import { formatCPF, formatCNPJ } from '@/lib/utils'

export function ConfirmEmitModal({
  isOpen,
  setIsOpen,
  currentProducer,
  currentProperty,
  currentTemplate,
  customOptions,
  selectedTemplateCode,
  defaultOrgName,
  defaultOrgCnpj,
  isGeneratingPdf,
  handleDownloadPdf
}: any) {
  return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-2xl">
          
          {/* Header */}
          <div className="p-6 bg-slate-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-[#1B4D3E]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  Conferência e Emissão do Projeto de Crédito
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-0.5">
                  Revise atentamente os dados oficiais antes de compilar o PDF definitivo para o Banco do Brasil / SICOR.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Cards Body */}
          <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh]">
            
            {/* Card 1: 👤 Proponente & Imóvel Beneficiado */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-2">
                <User className="h-4 w-4 text-[#1B4D3E]" />
                <span>Card 1 • Proponente & Imóvel Beneficiado</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 text-[11px] block">Proponente / Produtor:</span>
                  <p className="font-semibold text-gray-900">{currentProducer?.name || 'Não selecionado'}</p>
                  <p className="text-gray-600 text-[11px]">
                    {currentProducer?.document ? (currentProducer.type === 'PF' ? `CPF: ${formatCPF(currentProducer.document)}` : `CNPJ: ${formatCNPJ(currentProducer.document)}`) : ''}
                  </p>
                  {currentProducer?.phone && <p className="text-gray-500 text-[11px]">Tel: {currentProducer.phone}</p>}
                </div>

                <div>
                  <span className="text-gray-500 text-[11px] block">Imóvel Beneficiado:</span>
                  <p className="font-semibold text-gray-900">{currentProperty?.name || 'Não selecionado'}</p>
                  <p className="text-gray-600 text-[11px]">
                    {currentProperty?.city && currentProperty?.state ? `${currentProperty.city} - ${currentProperty.state}` : ''}
                    {customOptions.propertyTotalArea ? ` • Área: ${Number(customOptions.propertyTotalArea).toFixed(2)} ha` : ''}
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    Matrícula: {customOptions.propertyRegistrationNumber || 'Pendente'} {customOptions.propertyRegistryOffice ? `(${customOptions.propertyRegistryOffice})` : ''} • CAR: {customOptions.propertyCar || 'Pendente'}
                  </p>
                  <p className="text-gray-500 text-[10.5px]">
                    Atividade: {customOptions.propertyActivity || 'Não informada'}
                  </p>
                  <p className="text-gray-500 text-[10.5px] truncate">
                    Acesso: {customOptions.propertyAccessRoute || 'Não informado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: 📑 Modelo & Enquadramento Institucional */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-2">
                <Landmark className="h-4 w-4 text-[#1B4D3E]" />
                <span>Card 2 • Enquadramento & Modelo Oficial</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 text-[11px] block">Modelo Selecionado:</span>
                  <p className="font-semibold text-gray-900">{currentTemplate?.title || selectedTemplateCode}</p>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                    Padrão Banco do Brasil / SICOR
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 text-[11px] block">Finalidade / Sublinha:</span>
                  <p className="font-semibold text-gray-900">
                    {selectedTemplateCode === 'PROJETO_RENOVAGRO' && customOptions.renovagroSubline}
                    {selectedTemplateCode === 'PROJETO_INOVAGRO' && customOptions.inovagroEquipment}
                    {selectedTemplateCode === 'PROJETO_CUSTEIO_SAFRA' && `Safra ${customOptions.custeioSafraYear} - ${customOptions.custeioCropName}`}
                    {selectedTemplateCode === 'LIMITE_CREDITO_BB' && 'Levantamento Cadastral e Limite de Crédito'}
                    {selectedTemplateCode === 'CHECKLIST_PROFISSIONAL' && `${customOptions.purpose} (${customOptions.targetBank})`}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: 💰 Dimensionamento Físico & Finanças */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-2">
                <Coins className="h-4 w-4 text-[#1B4D3E]" />
                <span>Card 3 • Dimensionamento & Valores Financeiros</span>
              </div>

              {selectedTemplateCode === 'PROJETO_RENOVAGRO' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Área a Recuperar:</span>
                    <p className="font-bold text-gray-900 text-sm">{customOptions.renovagroAreaHa} ha</p>
                    <span className="text-gray-400 text-[10px]">Custo: R$ {customOptions.renovagroCostPerHa}/ha</span>
                  </div>
                  <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-emerald-700 text-[10.5px] block font-medium">Investimento Total:</span>
                    <p className="font-bold text-emerald-900 text-sm">R$ {Number(customOptions.renovagroTotalInvestment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Financiamento:</span>
                    <p className="font-bold text-gray-900 text-sm">R$ {Number(customOptions.renovagroFinanced).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Prazo & Carência:</span>
                    <p className="font-bold text-gray-900">{customOptions.renovagroTermYears} anos • {customOptions.renovagroGraceMonths}m</p>
                    <span className="text-gray-400 text-[10px]">Juros: {customOptions.renovagroInterestRate}% a.a.</span>
                  </div>
                </div>
              )}

              {selectedTemplateCode === 'PROJETO_INOVAGRO' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Potência / Capacidade:</span>
                    <p className="font-bold text-gray-900 text-sm">{customOptions.inovagroPower} kWp</p>
                    <span className="text-gray-400 text-[10px]">CNAE: {customOptions.inovagroCnae || 'N/I'}</span>
                  </div>
                  <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-emerald-700 text-[10.5px] block font-medium">Investimento Total:</span>
                    <p className="font-bold text-emerald-900 text-sm">R$ {Number(customOptions.inovagroTotalInvestment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Financiamento:</span>
                    <p className="font-bold text-gray-900 text-sm">R$ {Number(customOptions.inovagroFinanced).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Prazo & Carência:</span>
                    <p className="font-bold text-gray-900">{customOptions.inovagroTermYears} anos • {customOptions.inovagroGraceMonths}m</p>
                    <span className="text-gray-400 text-[10px]">Juros: {customOptions.inovagroInterestRate}% a.a.</span>
                  </div>
                </div>
              )}

              {selectedTemplateCode === 'PROJETO_CUSTEIO_SAFRA' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Área & Cultura:</span>
                    <p className="font-bold text-gray-900 text-sm">{customOptions.custeioAreaHa} ha</p>
                    <span className="text-gray-400 text-[10px]">{customOptions.custeioCropName}</span>
                  </div>
                  <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-emerald-700 text-[10.5px] block font-medium">Orçamento Financiado:</span>
                    <p className="font-bold text-emerald-900 text-sm">R$ {(customOptions.custeioAreaHa * customOptions.custeioCostPerHa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Produtividade Esperada:</span>
                    <p className="font-bold text-gray-900 text-sm">{customOptions.custeioExpectedYield} sc/ha</p>
                    <span className="text-gray-400 text-[10px]">Preço: R$ {customOptions.custeioPricePerUnit}/sc</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Taxa de Juros:</span>
                    <p className="font-bold text-gray-900 text-sm">{customOptions.custeioInterestRate}% a.a.</p>
                    <span className="text-gray-400 text-[10px]">Custo: R$ {customOptions.custeioCostPerHa}/ha</span>
                  </div>
                </div>
              )}

              {selectedTemplateCode === 'LIMITE_CREDITO_BB' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Cotação Terra (R$/ha):</span>
                    <p className="font-bold text-gray-900">R$ {Number(customOptions.estimatedLandValuePerHa).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Benfeitorias & Máquinas:</span>
                    <p className="font-bold text-gray-900">R$ {(Number(customOptions.improvementsValue) + Number(customOptions.machineryValue)).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-emerald-700 text-[10.5px] block font-medium">Receita Bruta Anual:</span>
                    <p className="font-bold text-emerald-900">R$ {Number(customOptions.annualRevenue).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Dívidas SCR / BACEN:</span>
                    <p className="font-bold text-gray-900">R$ {Number(customOptions.existingDebts).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              )}

              {selectedTemplateCode === 'CHECKLIST_PROFISSIONAL' && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Banco Destinatário:</span>
                    <p className="font-bold text-gray-900">{customOptions.targetBank}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-gray-500 text-[10.5px] block">Operação:</span>
                    <p className="font-bold text-gray-900">{customOptions.purpose}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Card 4: ✍️ Responsabilidade Técnica & Elaboração */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-2">
                <Building2 className="h-4 w-4 text-[#1B4D3E]" />
                <span>Card 4 • Responsabilidade Técnica & Elaboração</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 text-[11px] block">Responsável Técnico (Owner):</span>
                  <p className="font-semibold text-gray-900">{customOptions.responsibleName}</p>
                  <p className="text-gray-600 text-[11px]">
                    Registro: {customOptions.creaNumber} • ART/TRT: {customOptions.artNumber}
                  </p>
                </div>

                <div>
                  <span className="text-gray-500 text-[11px] block">Consultoria / Organização:</span>
                  <p className="font-semibold text-gray-900">{defaultOrgName || 'Organização'}</p>
                  {defaultOrgCnpj && <p className="text-gray-600 text-[11px]">CNPJ: {formatCNPJ(defaultOrgCnpj)}</p>}
                  <p className="text-gray-500 text-[11px]">Emissão Oficial em Conformidade com as Normas do Crédito Rural</p>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-gray-200 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="text-xs"
            >
              Voltar para Ajustar
            </Button>

            <Button
              type="button"
              onClick={async () => {
                setIsOpen(false)
                await handleDownloadPdf()
              }}
              disabled={isGeneratingPdf}
              className="bg-[#1B4D3E] hover:bg-[#13382D] text-white flex items-center gap-2 text-xs font-bold shadow-xs px-5"
            >
              {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Confirmar e Emitir PDF Oficial
            </Button>
          </div>

        </DialogContent>
      </Dialog>

      
  )
}
