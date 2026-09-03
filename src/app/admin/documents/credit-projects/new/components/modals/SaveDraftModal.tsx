import React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Database, MapPin, User, FileText, Check, AlertTriangle, Loader2, ArrowLeft, ArrowRight, Lock, Save } from 'lucide-react'
import { formatCPF, formatCNPJ, cn } from '@/lib/utils'

export function SaveDraftModal({
  isOpen,
  setIsOpen,
  saveModalStep,
  setSaveModalStep,
  propertyErrors,
  producerErrors,
  projectErrors,
  validationErrors: propValidationErrors,
  isFormValid: propIsFormValid,
  currentProperty,
  currentProducer,
  currentTemplate,
  customOptions,
  selectedTemplateCode,
  isSavingDraft,
  executeSaveDraft
}: any) {
  const validationErrors: string[] = propValidationErrors || [
    ...((propertyErrors as string[]) || []),
    ...((producerErrors as string[]) || []),
    ...((projectErrors as string[]) || [])
  ]
  const isFormValid: boolean = propIsFormValid !== undefined ? Boolean(propIsFormValid) : validationErrors.length === 0

  return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl sm:max-w-5xl w-[95vw] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-2xl">
          {/* Header */}
          <div className="p-6 bg-slate-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center text-[#1B4D3E]">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Conferência e Gravação no Cadastro Permanente
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-0.5">
                  Revise os dados preenchidos em cada etapa. Somente na última etapa, com todos os dados validados, a gravação será liberada.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Cards em Cima • Navegação pelas Etapas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50/80 border-b border-gray-200">
            {/* Card Etapa 1 */}
            <button
              type="button"
              onClick={() => setSaveModalStep(1)}
              className={cn(
                "p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer",
                saveModalStep === 1
                  ? "border-[#1B4D3E] bg-white ring-2 ring-[#1B4D3E]/20 shadow-sm"
                  : "border-gray-200 bg-white/70 hover:border-gray-300 hover:bg-white"
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                  <MapPin className="h-4 w-4 text-[#1B4D3E]" />
                  1. Propriedade Rural
                </span>
                {propertyErrors.length === 0 ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="h-3 w-3" /> Validado
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {propertyErrors.length} pendente(s)
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-gray-900 truncate">
                {currentProperty?.name || 'Selecione a Propriedade'}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Dados Fundiários, CAR e Acesso
              </p>
            </button>

            {/* Card Etapa 2 */}
            <button
              type="button"
              onClick={() => setSaveModalStep(2)}
              className={cn(
                "p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer",
                saveModalStep === 2
                  ? "border-[#1B4D3E] bg-white ring-2 ring-[#1B4D3E]/20 shadow-sm"
                  : "border-gray-200 bg-white/70 hover:border-gray-300 hover:bg-white"
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                  <User className="h-4 w-4 text-[#1B4D3E]" />
                  2. Produtor Rural
                </span>
                {producerErrors.length === 0 ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="h-3 w-3" /> Validado
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Pendente
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-gray-900 truncate">
                {currentProducer?.name || 'Selecione o Produtor'}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Identificação, CPF/CNPJ & Filial
              </p>
            </button>

            {/* Card Etapa 3 */}
            <button
              type="button"
              onClick={() => setSaveModalStep(3)}
              className={cn(
                "p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer",
                saveModalStep === 3
                  ? "border-[#1B4D3E] bg-white ring-2 ring-[#1B4D3E]/20 shadow-sm"
                  : "border-gray-200 bg-white/70 hover:border-gray-300 hover:bg-white"
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                  <FileText className="h-4 w-4 text-[#1B4D3E]" />
                  3. Parâmetros & RT
                </span>
                {projectErrors.length === 0 ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="h-3 w-3" /> Validado
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {projectErrors.length} pendente(s)
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-gray-900 truncate">
                {currentTemplate?.title || 'Modelo BB'}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Orçamento, Prazos, Juros & ART
              </p>
            </button>
          </div>

          {/* Body: Conteúdo Dinâmico por Etapa */}
          <div className="p-6 overflow-y-auto space-y-4 max-h-[58vh]">
            {/* ETAPA 1: PROPRIEDADE RURAL */}
            {saveModalStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                        Etapa 1 de 3 • Informações Fundiárias do Imóvel Rural
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800">
                      Estes dados fundiários e ambientais serão salvos permanentemente na página desta propriedade rural, eliminando pendências cadastrais.
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md font-semibold shrink-0">
                    Salvo no Cadastro da Propriedade
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{currentProperty?.name || 'Imóvel'}</h4>
                      <p className="text-xs text-gray-500">
                        {currentProperty?.city ? `${currentProperty.city} - ${currentProperty.state}` : 'Localização não informada'}
                      </p>
                    </div>
                    <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
                      Imóvel Ativo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-gray-500 text-[11px] block font-medium">Matrícula / Registro:</span>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">
                        {customOptions.propertyRegistrationNumber || <span className="text-red-600 font-bold">⚠️ Pendente</span>}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-gray-500 text-[11px] block font-medium">Cartório de Registro (CRI):</span>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">
                        {customOptions.propertyRegistryOffice || <span className="text-amber-600">Não informado</span>}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-gray-500 text-[11px] block font-medium">Nº do CAR (Recibo):</span>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">
                        {customOptions.propertyCar || <span className="text-red-600 font-bold">⚠️ Pendente</span>}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-gray-500 text-[11px] block font-medium">Área Total do Imóvel:</span>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">
                        {Number(customOptions.propertyTotalArea) > 0 ? (
                          `${customOptions.propertyTotalArea} ha`
                        ) : (
                          <span className="text-red-600 font-bold">⚠️ 0.00 ha (Inválido)</span>
                        )}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-gray-500 text-[11px] block font-medium">Atividade Principal do Imóvel:</span>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">
                        {customOptions.propertyActivity || <span className="text-red-600 font-bold">⚠️ Não informada</span>}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-gray-500 text-[11px] block font-medium">CCIR / ITR:</span>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">
                        {customOptions.propertyCcir || 'N/I'} • {customOptions.propertyItr || 'N/I'}
                      </p>
                    </div>

                    <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-gray-500 text-[11px] block font-medium">Roteiro de Acesso à Propriedade:</span>
                      <p className="font-semibold text-gray-900 text-xs mt-0.5 leading-relaxed">
                        {customOptions.propertyAccessRoute || <span className="text-red-600 font-bold">⚠️ Não informado (Obrigatório)</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {propertyErrors.length > 0 && (
                  <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-amber-800">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Pendências no Cadastro da Propriedade ({propertyErrors.length}):</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-amber-800/90 pl-1">
                      {propertyErrors?.map((err: string, idx: number) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-amber-700 mt-1">
                      Ajuste esses campos no card "Dados Fundiários do Imóvel" da barra lateral antes de gravar.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ETAPA 2: PRODUTOR RURAL */}
            {saveModalStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                        Etapa 2 de 3 • Identificação do Produtor Rural (Proponente)
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800">
                      Dados civis e de qualificação vinculados à titularidade do crédito e contrato de financiamento.
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md font-semibold shrink-0">
                    Salvo no Cadastro do Produtor
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{currentProducer?.name || 'Produtor Rural'}</h4>
                      <p className="text-xs text-gray-500">
                        {currentProducer?.type === 'PF' ? 'Pessoa Física (Produtor Individual)' : 'Pessoa Jurídica (Empresa Agropecuária)'}
                      </p>
                    </div>
                    <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
                      Cliente Ativo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-gray-500 text-[11px] block font-medium">Documento Oficial:</span>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">
                        {currentProducer?.document ? (
                          currentProducer.type === 'PF' ? `CPF: ${formatCPF(currentProducer.document)}` : `CNPJ: ${formatCNPJ(currentProducer.document)}`
                        ) : '-'}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-gray-500 text-[11px] block font-medium">Telefone / WhatsApp:</span>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">
                        {currentProducer?.phone || 'Não informado'}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-gray-500 text-[11px] block font-medium">E-mail:</span>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5 truncate">
                        {currentProducer?.email || 'Não informado'}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-gray-500 text-[11px] block font-medium">Estado Civil / Cônjuge:</span>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">
                        {currentProducer?.civilStatus || 'Não informado'}
                        {currentProducer?.spouseName ? ` • ${currentProducer.spouseName}` : ''}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-gray-500 text-[11px] block font-medium">Filial / Cooperativa:</span>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">
                        {currentProducer?.branchName || 'Matriz - Sede'}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-gray-500 text-[11px] block font-medium">Status do Cadastro:</span>
                      <p className="font-semibold text-emerald-700 text-sm mt-0.5 flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Ativo no Sistema
                      </p>
                    </div>
                  </div>
                </div>

                {producerErrors.length > 0 && (
                  <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-amber-800">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Pendências no Cadastro do Produtor:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-amber-800/90 pl-1">
                      {producerErrors?.map((err: string, idx: number) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ETAPA 3: PARÂMETROS TÉCNICOS & RT */}
            {saveModalStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                        Etapa 3 de 3 • Parâmetros Técnicos do Projeto & Responsabilidade Técnica
                      </span>
                    </div>
                    <p className="text-xs text-blue-800">
                      Condições financeiras, especificações e responsável técnico que serão registrados no rascunho oficial.
                    </p>
                  </div>
                  <span className="text-[10px] text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md font-semibold shrink-0">
                    Rascunho Oficial
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{currentTemplate?.title || 'Projeto de Crédito'}</h4>
                      <p className="text-xs text-gray-500">Normas SICOR / Banco do Brasil</p>
                    </div>
                    <span className="text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md font-semibold border border-purple-200">
                      {currentTemplate?.category || 'CRÉDITO RURAL'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    {selectedTemplateCode === 'PROJETO_RENOVAGRO' && (
                      <>
                        <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-gray-500 text-[11px] block font-medium">Sublinha do Programa:</span>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5">
                            {customOptions.renovagroSubline || <span className="text-red-600 font-bold">⚠️ Não informada</span>}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-gray-500 text-[11px] block font-medium">Área a Recuperar:</span>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5">{customOptions.renovagroAreaHa} ha</p>
                        </div>
                        <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-100">
                          <span className="text-emerald-700 text-[11px] block font-medium">Investimento Total:</span>
                          <p className="font-bold text-emerald-950 text-sm mt-0.5">
                            R$ {Number(customOptions.renovagroTotalInvestment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-gray-500 text-[11px] block font-medium">Financiamento Solicitado:</span>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5">
                            R$ {Number(customOptions.renovagroFinanced).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-gray-500 text-[11px] block font-medium">Condições Financeiras:</span>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5">
                            Prazo: {customOptions.renovagroTermYears} anos • Carência: {customOptions.renovagroGraceMonths} meses • Taxa: {customOptions.renovagroInterestRate}% a.a.
                          </p>
                        </div>
                      </>
                    )}

                    {selectedTemplateCode === 'PROJETO_INOVAGRO' && (
                      <>
                        <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-gray-500 text-[11px] block font-medium">Equipamento / Inovação:</span>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5">
                            {customOptions.inovagroEquipment || <span className="text-red-600 font-bold">⚠️ Não informado</span>}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-gray-500 text-[11px] block font-medium">Potência / Capacidade:</span>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5">{customOptions.inovagroPower} kWp</p>
                        </div>
                        <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-100">
                          <span className="text-emerald-700 text-[11px] block font-medium">Investimento Total:</span>
                          <p className="font-bold text-emerald-950 text-sm mt-0.5">
                            R$ {Number(customOptions.inovagroTotalInvestment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-gray-500 text-[11px] block font-medium">Financiamento Solicitado:</span>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5">
                            R$ {Number(customOptions.inovagroFinanced).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-gray-500 text-[11px] block font-medium">Condições Financeiras:</span>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5">
                            Prazo: {customOptions.inovagroTermYears} anos • Carência: {customOptions.inovagroGraceMonths} meses • Taxa: {customOptions.inovagroInterestRate}% a.a.
                          </p>
                        </div>
                      </>
                    )}

                    {selectedTemplateCode === 'PROJETO_CUSTEIO_SAFRA' && (
                      <>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-gray-500 text-[11px] block font-medium">Ano Safra:</span>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5">{customOptions.custeioSafraYear}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-gray-500 text-[11px] block font-medium">Cultura:</span>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5">{customOptions.custeioCropName}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-gray-500 text-[11px] block font-medium">Área de Plantio:</span>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5">{customOptions.custeioAreaHa} ha</p>
                        </div>
                        <div className="col-span-1 sm:col-span-2 bg-emerald-50/60 p-3 rounded-lg border border-emerald-100">
                          <span className="text-emerald-700 text-[11px] block font-medium">Orçamento Financiado:</span>
                          <p className="font-bold text-emerald-950 text-sm mt-0.5">
                            R$ {(Number(customOptions.custeioAreaHa || 0) * Number(customOptions.custeioCostPerHa || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-gray-500 text-[11px] block font-medium">Taxa de Juros:</span>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5">{customOptions.custeioInterestRate}% a.a.</p>
                        </div>
                      </>
                    )}

                    {selectedTemplateCode === 'LIMITE_CREDITO_BB' && (
                      <>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-gray-500 text-[11px] block font-medium">Cotação da Terra / ha:</span>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5">
                            R$ {Number(customOptions.estimatedLandValuePerHa || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-gray-500 text-[11px] block font-medium">Benfeitorias:</span>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5">
                            R$ {Number(customOptions.improvementsValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-gray-500 text-[11px] block font-medium">Máquinas & Equipamentos:</span>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5">
                            R$ {Number(customOptions.machineryValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </>
                    )}

                    <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-slate-50 p-3.5 rounded-lg border border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-gray-500 text-[11px] block font-medium">Responsável Técnico (RT):</span>
                        <p className="font-bold text-gray-900 text-sm mt-0.5">
                          {customOptions.responsibleName || <span className="text-red-600 font-bold">⚠️ Não informado</span>}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[11px] block font-medium">Registro no Conselho & ART:</span>
                        <p className="font-semibold text-gray-800 text-xs mt-0.5">
                          {customOptions.creaNumber ? `CREA: ${customOptions.creaNumber}` : <span className="text-red-600 font-bold">Sem CREA</span>}
                          {' • '}
                          {customOptions.artNumber ? `ART: ${customOptions.artNumber}` : <span className="text-red-600 font-bold">Sem ART</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Box de Validação Consolidada */}
                {!isFormValid ? (
                  <div className="p-4 bg-red-50/90 border-2 border-red-200 rounded-xl text-red-950 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-red-900 text-sm">
                      <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                      <span>Existem {validationErrors.length} dados obrigatórios faltantes no projeto:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-red-800 pl-1 text-[11.5px]">
                      {validationErrors.map((err: string, idx: number) => (
                        <li key={idx} className="font-medium">{err}</li>
                      ))}
                    </ul>
                    <div className="pt-1 text-[11px] text-red-700 font-semibold flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-red-600" />
                      <span>O botão de gravação abaixo está inativo. Preencha todos os campos pendentes no formulário para liberar a gravação definitiva.</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-emerald-950 text-xs flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                      <Check className="h-5 w-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="font-bold text-emerald-900 text-sm">
                        Todos os dados e parâmetros técnicos estão 100% preenchidos e validados!
                      </p>
                      <p className="text-emerald-700 text-[11px] mt-0.5">
                        A gravação atualizará permanentemente a página do Produtor Rural, a página da Propriedade Rural e o rascunho oficial deste documento.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer com Navegação entre Etapas */}
          <div className="p-4 bg-slate-50 border-t border-gray-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>

              {saveModalStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSaveModalStep((prev: number) => prev - 1)}
                  className="text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Passo Anterior
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium mr-2 hidden sm:inline">
                Etapa {saveModalStep} de 3
              </span>

              {saveModalStep < 3 ? (
                <Button
                  type="button"
                  onClick={() => setSaveModalStep((prev: number) => prev + 1)}
                  className="bg-[#1B4D3E] hover:bg-[#13382D] text-white flex items-center gap-1.5 text-xs font-bold px-5 cursor-pointer"
                >
                  Próximo Passo
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={executeSaveDraft}
                  disabled={!isFormValid || isSavingDraft}
                  title={!isFormValid ? "Preencha todos os dados obrigatórios para gravar" : "Gravar dados no cadastro permanente"}
                  className={cn(
                    "flex items-center gap-2 text-xs font-bold px-6 py-2.5 rounded-lg transition-all",
                    !isFormValid
                      ? "opacity-50 cursor-not-allowed bg-gray-300 text-gray-600 hover:bg-gray-300"
                      : "bg-[#1B4D3E] hover:bg-[#13382D] text-white shadow-md hover:shadow-lg cursor-pointer"
                  )}
                >
                  {isSavingDraft ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : !isFormValid ? (
                    <Lock className="h-4 w-4 mr-1 text-gray-500" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  {!isFormValid ? 'Gravação Inativa (Dados Faltantes)' : 'Confirmar e Gravar no Cadastro Oficial'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>


  )
}
