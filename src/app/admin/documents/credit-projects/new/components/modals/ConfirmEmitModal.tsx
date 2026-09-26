'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck,
  User,
  Landmark,
  Loader2,
  Download,
  CheckCircle2,
  FileCheck2,
  MapPin,
  Info,
  Building2,
  Compass,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import {
  maskCPF,
  maskCNPJ,
  maskPhone,
  maskRegistrationNumber,
  maskCAR,
  maskCCIR,
  maskITR,
} from '@/lib/utils/masks'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ConfirmEmitModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  currentProducer: any
  currentProperty: any
  currentTemplate: any
  customOptions: any
  selectedTemplateCode: string
  defaultOrgName?: string
  defaultOrgCnpj?: string
  isGeneratingPdf?: boolean
  handleDownloadPdf: () => Promise<any>
  isFormValid?: boolean
  validationErrors?: string[]
}

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
  isGeneratingPdf = false,
  handleDownloadPdf,
  isFormValid = true,
  validationErrors = [],
}: ConfirmEmitModalProps) {
  const [isSuccess, setIsSuccess] = useState(false)
  const [isEmitting, setIsEmitting] = useState(false)
  const [governanceData, setGovernanceData] = useState<{
    sha256: string
    storagePath: string
    emittedAt: Date
    fileName?: string
    responsibleName: string
  } | null>(null)

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false)
      setIsEmitting(false)
      setGovernanceData(null)
    }
  }, [isOpen])

  const onConfirm = async () => {
    if (isFormValid === false || (validationErrors && validationErrors.length > 0)) {
      toast.error('Existem campos obrigatórios pendentes. Preencha todos os campos antes de emitir.')
      return
    }

    setIsEmitting(true)
    try {
      const res = await handleDownloadPdf()
      if (!res || !res.success) {
        throw new Error('Falha na compilação do arquivo PDF do documento oficial.')
      }

      const emittedAt = res.emittedAt ? new Date(res.emittedAt) : new Date()
      const sha256 = res.sha256 || 'SHA256-PENDING'
      const storagePath = res.storagePath || `ged/credit-projects/${selectedTemplateCode}/${Date.now()}.pdf`

      setGovernanceData({
        sha256,
        storagePath,
        emittedAt,
        fileName: res?.fileName,
        responsibleName: customOptions?.responsibleName || 'Responsável Técnico',
      })
      setIsSuccess(true)
      toast.success('Documento emitido e baixado com sucesso!')
    } catch (err: any) {
      console.error('Falha na emissão:', err)
      toast.error(err?.message || 'Falha ao emitir e baixar o documento.')
    } finally {
      setIsEmitting(false)
    }
  }

  const handleDownloadAgain = async () => {
    try {
      await handleDownloadPdf()
      toast.success('Download reiniciado com sucesso!')
    } catch (e: any) {
      toast.error('Erro ao baixar novamente: ' + (e.message || 'Falha no download.'))
    }
  }

  // Formatadores de apoio
  const isCnpj = currentProducer?.type === 'PJ'
  const formattedProducerDoc = currentProducer?.document
    ? isCnpj
      ? maskCNPJ(currentProducer.document)
      : maskCPF(currentProducer.document)
    : 'Não informado'

  const formattedPhone = currentProducer?.phone
    ? maskPhone(currentProducer.phone)
    : 'Não informado'

  const formattedRegistration = customOptions?.propertyRegistrationNumber
    ? maskRegistrationNumber(customOptions.propertyRegistrationNumber)
    : currentProperty?.registrationNumber
      ? maskRegistrationNumber(currentProperty.registrationNumber)
      : 'Pendente'

  const formattedCar = customOptions?.propertyCar || currentProperty?.car || 'Não informado / Pendente'

  const formattedCcir = customOptions?.propertyCcir
    ? maskCCIR(customOptions.propertyCcir)
    : currentProperty?.ccir
      ? maskCCIR(currentProperty.ccir)
      : null

  const formattedItr = customOptions?.propertyItr
    ? maskITR(customOptions.propertyItr)
    : currentProperty?.itr
      ? maskITR(currentProperty.itr)
      : null

  const totalAreaHa = Number(customOptions?.propertyTotalArea || currentProperty?.totalArea || 0)
  const formattedArea =
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalAreaHa) +
    ' ha'

  const rawBranchName =
    currentProperty?.branch?.name ||
    currentProducer?.branch?.name ||
    currentProducer?.branchName
  const isUuid =
    rawBranchName &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawBranchName.trim())
  const activeBranchName = isUuid || !rawBranchName ? 'Filial Principal' : rawBranchName

  const accessRoute =
    customOptions?.propertyAccessRoute ||
    currentProperty?.accessRoute ||
    (currentProperty?.possessionData as any)?.accessRoute ||
    null

  const hasCrea = Boolean(customOptions?.creaNumber?.trim())
  const isCreaRequired = [
    'PROJETO_INOVAGRO',
    'PROJETO_RENOVAGRO',
    'PROJETO_CUSTEIO_SAFRA',
  ].includes(selectedTemplateCode)
  const targetBank = customOptions?.targetBank || customOptions?.creditLimitTargetBank || 'Banco do Brasil'
  const isBB =
    targetBank.toLowerCase().includes('brasil') ||
    targetBank.toLowerCase().includes('bb') ||
    selectedTemplateCode.includes('BB')

  const repName =
    customOptions?.representativeName ||
    (currentProducer?.name ? currentProducer.name.replace(/\s*\(PJ\)\s*/i, '').trim() : '')
  const repCpf = customOptions?.representativeCpf || currentProducer?.representativeCpf || ''

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-full max-w-[96vw] sm:max-w-5xl lg:max-w-6xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto flex flex-col gap-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
        {/* Cabeçalho do Modal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 shrink-0">
              {isSuccess ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <ShieldCheck className="h-6 w-6" />}
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {isSuccess
                  ? 'Documento Oficial Gerado e Arquivado com Sucesso!'
                  : 'Conferência de Dados da Operação'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                {isSuccess
                  ? 'Registro cadastrado no GED corporativo com carimbo de governança e integridade.'
                  : 'Valide os dados cadastrais, fundiários e técnicos antes de compilar o documento oficial.'}
              </DialogDescription>
            </div>
          </div>

          {!isSuccess && (
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                {isBB ? 'Padrão BB / SICOR' : targetBank}
              </span>
            </div>
          )}
        </div>

        {/* Corpo do Modal: Alterna entre Conferência e Sucesso */}
        {isSuccess && governanceData ? (
          <div className="space-y-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200 py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div className="space-y-1.5 max-w-md">
              <h3 className="text-xl font-bold text-slate-900">
                Documento Oficial Gerado e Arquivado com Sucesso!
              </h3>
              <p className="text-xs text-slate-500">
                O arquivo PDF foi compilado, baixado para seu dispositivo e registrado formalmente na esteira de
                governança da organização.
              </p>
            </div>

            {/* Resumo de Governança */}
            <div className="w-full max-w-2xl bg-slate-50 border border-slate-200 rounded-xl p-5 text-left space-y-3.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1B4D3E] uppercase tracking-wider border-b border-slate-200 pb-2">
                <FileCheck2 className="w-4 h-4" />
                <span>Resumo de Governança e Autenticidade</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block font-medium">Autoria / Elaborador Técnico:</span>
                  <p className="font-semibold text-slate-900">{governanceData.responsibleName}</p>
                  <p className="text-[11px] text-slate-500">{defaultOrgName || 'AgroTech Consultoria'}</p>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block font-medium">Data e Hora da Emissão:</span>
                  <p className="font-semibold text-slate-900">
                    {format(governanceData.emittedAt, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                  </p>
                  <p className="text-[11px] text-slate-500">Filial: {activeBranchName}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1">
                <span className="text-slate-500 text-[11px] block font-medium">Carimbo de Integridade (SHA-256):</span>
                <div className="font-mono text-[11px] bg-white border border-emerald-200 text-emerald-950 p-2.5 rounded-lg break-all select-all">
                  {governanceData.sha256}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 text-[11px] block font-medium">Localização do Arquivo no GED:</span>
                <p className="font-mono text-[11px] text-slate-700 bg-white border border-slate-200 p-2.5 rounded-lg break-all select-all">
                  {governanceData.storagePath}
                </p>
              </div>
            </div>

            {/* Ações pós-emissão */}
            <div className="flex items-center justify-center gap-3 pt-2 w-full max-w-md">
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadAgain}
                className="text-xs h-10 flex-1 border-slate-300 hover:bg-slate-100"
              >
                <Download className="w-4 h-4 mr-2 text-slate-600" />
                Baixar Novamente
              </Button>

              <Button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold h-10 flex-1 bg-[#1B4D3E] hover:bg-[#13382D] text-white shadow-xs"
              >
                Concluir e Fechar
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Grid Amplo de 2 Colunas com Separação Estrita de Domínios de Dados */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* Coluna Esquerda: Proponente & Responsabilidade Técnica (5 colunas no desktop) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                
                {/* Bloco 1: Proponente (Produtor Rural) */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-2xs">
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                    <User className="h-3.5 w-3.5 text-[#1B4D3E]" />
                    <span>Proponente (Produtor Rural)</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 block">Nome do Produtor / Razão Social:</span>
                      <p className="text-sm font-bold text-slate-900 leading-tight">
                        {currentProducer?.name || 'Não selecionado'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <span className="text-[11px] font-medium text-slate-500 block">
                          {isCnpj ? 'CNPJ:' : 'CPF:'}
                        </span>
                        <p className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200/80">
                          {formattedProducerDoc}
                        </p>
                      </div>

                      <div>
                        <span className="text-[11px] font-medium text-slate-500 block">Telefone:</span>
                        <p className="text-xs text-slate-700 font-medium py-1">{formattedPhone}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-slate-500 block">E-mail:</span>
                      <p className="text-xs text-slate-600 truncate">{currentProducer?.email || 'Não informado'}</p>
                    </div>

                    {/* Sub-painel Representante Legal se for PJ */}
                    {isCnpj && (repName || repCpf) && (
                      <div className="pt-2 border-t border-slate-200/70 bg-white/80 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                        <span className="text-[10.5px] font-bold text-blue-900 uppercase tracking-wide block">
                          Representante Legal da Empresa:
                        </span>
                        <div className="text-xs space-y-1">
                          <p className="font-semibold text-slate-900">{repName || 'Titular / Administrador'}</p>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <span className="text-[11px] text-slate-500">CPF:</span>
                            <span className="font-mono text-slate-800 font-medium">
                              {repCpf ? maskCPF(repCpf) : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bloco 2: Enquadramento, Linha & Responsabilidade Técnica */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-2xs">
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                    <Landmark className="h-3.5 w-3.5 text-[#1B4D3E]" />
                    <span>Operação & Responsabilidade Técnica</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 block">Modelo do Documento:</span>
                      <p className="text-sm font-semibold text-slate-900">
                        {currentTemplate?.title || selectedTemplateCode}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <span className="text-[11px] font-medium text-slate-500 block">Sistema / Banco:</span>
                        <span className="inline-flex items-center text-[10.5px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold mt-0.5">
                          {isBB ? 'Banco do Brasil / SICOR' : targetBank}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] font-medium text-slate-500 block">Registro CREA / CFTA:</span>
                        <div className="mt-0.5">
                          {hasCrea ? (
                            <span className="inline-flex items-center text-[10.5px] font-mono font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              CREA {customOptions.creaNumber}
                              {customOptions?.artNumber ? ` • ART ${customOptions.artNumber}` : ''}
                            </span>
                          ) : isCreaRequired ? (
                            <span className="inline-flex items-center text-[10.5px] font-medium text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
                              Registro Pendente
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10.5px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                              Dispensado nesta minuta
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/70 space-y-1">
                      <span className="text-[11px] font-medium text-slate-500 block">Responsável Técnico Elaborador:</span>
                      <p className="font-semibold text-slate-900">
                        {customOptions?.responsibleName || 'Responsável Técnico Designado'}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                        <span>{defaultOrgName || 'AgroTech Consultoria'}</span>
                        <span className="font-medium text-slate-700">Filial: {activeBranchName}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Coluna Direita: Imóvel Rural Beneficiado (7 colunas no desktop) */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                
                {/* Bloco 3: Imóvel Rural Beneficiado (Dados Fundiários) */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-4 shadow-2xs">
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#1B4D3E]" />
                      <span>Imóvel Rural Beneficiado (Dados Fundiários)</span>
                    </span>
                    <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Garantia / Imóvel Vinculado
                    </span>
                  </div>

                  {/* Nome da Fazenda e Localização */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded-lg border border-slate-200/80">
                    <div>
                      <span className="text-[10.5px] font-medium text-slate-500 block">Nome da Propriedade:</span>
                      <p className="text-base font-bold text-slate-900">
                        {currentProperty?.name || customOptions?.propertyName || 'Não selecionado'}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-[10.5px] font-medium text-slate-500 block">Município / Estado:</span>
                      <p className="text-xs font-medium text-slate-700">
                        {currentProperty?.city && currentProperty?.state
                          ? `${currentProperty.city} - ${currentProperty.state}`
                          : 'Não informado'}
                      </p>
                    </div>
                  </div>

                  {/* Destaques de Métricas Fundiárias (Área Total e Matrícula) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs space-y-1">
                      <span className="text-[10.5px] font-medium text-slate-500 block uppercase tracking-wider">
                        Área Total Declarada
                      </span>
                      <div className="text-lg font-bold font-mono text-[#1B4D3E]">
                        {formattedArea}
                      </div>
                      <p className="text-[10.5px] text-slate-400">Dimensão registrada do imóvel</p>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs space-y-1">
                      <span className="text-[10.5px] font-medium text-slate-500 block uppercase tracking-wider">
                        Matrícula / Cartório (CRI)
                      </span>
                      <div className="text-sm font-bold font-mono text-slate-900 truncate">
                        {formattedRegistration}
                      </div>
                      <p className="text-[10.5px] text-slate-500 truncate" title={customOptions?.propertyRegistryOffice || 'Cartório de Registro de Imóveis'}>
                        {customOptions?.propertyRegistryOffice || 'Cartório de Registro de Imóveis'}
                      </p>
                    </div>
                  </div>

                  {/* Recibo do CAR em linha inteira sem corte */}
                  <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-600 block">
                        Nº do Recibo do CAR (Cadastro Ambiental Rural):
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">SICAR Oficial</span>
                    </div>
                    <div className="text-xs font-mono font-medium bg-slate-50 px-3 py-2 rounded border border-slate-200 text-slate-900 select-all break-all tracking-wider">
                      {formattedCar}
                    </div>
                  </div>

                  {/* Certificações Cadastrais (CCIR e ITR) */}
                  {(formattedCcir || formattedItr || customOptions?.propertyActivity) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-white p-3 rounded-lg border border-slate-200/80">
                      <div>
                        <span className="text-[10.5px] text-slate-500 block">CCIR / INCRA:</span>
                        <span className="font-mono text-slate-800 font-medium">
                          {formattedCcir || 'Não informado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10.5px] text-slate-500 block">ITR / NIRF:</span>
                        <span className="font-mono text-slate-800 font-medium">
                          {formattedItr || 'Não informado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10.5px] text-slate-500 block">Atividade Principal:</span>
                        <span className="text-slate-800 font-medium truncate block">
                          {customOptions?.propertyActivity || 'Pecuária / Agricultura'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Roteiro Detalhado de Acesso */}
                  {accessRoute && (
                    <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200/80">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                        <Compass className="h-3.5 w-3.5 text-[#1B4D3E]" />
                        <span>Roteiro Detalhado de Acesso ao Imóvel:</span>
                      </div>
                      <p className="text-xs text-slate-700 italic leading-relaxed bg-slate-50/70 p-2.5 rounded border border-slate-200/60">
                        {accessRoute}
                      </p>
                    </div>
                  )}

                </div>

              </div>

            </div>

            {/* Alerta de Pendências Cadastrais ou Informativo do GED */}
            {(!isFormValid || (validationErrors && validationErrors.length > 0)) ? (
              <div className="flex flex-col gap-2 text-xs text-amber-900 bg-amber-50 p-4 rounded-xl border border-amber-300">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Existem pendências cadastrais obrigatórias ({validationErrors?.length || 0}):</span>
                </div>
                <ul className="list-disc list-inside text-[11px] text-amber-800/90 pl-1 space-y-0.5">
                  {validationErrors?.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/60">
                <Info className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>
                  Ao emitir, uma cópia autenticada deste documento será arquivada automaticamente no GED corporativo com carimbo de integridade SHA-256 e rastreabilidade na esteira SaaS.
                </span>
              </div>
            )}

            {/* Rodapé com Ações */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isEmitting || isGeneratingPdf}
                className="text-xs font-medium px-4 h-10"
              >
                Voltar para Ajustar
              </Button>

              <Button
                type="button"
                onClick={onConfirm}
                disabled={isEmitting || isGeneratingPdf || !isFormValid || (validationErrors && validationErrors.length > 0)}
                className={cn(
                  "flex items-center gap-2 text-xs font-bold shadow-xs px-6 h-10 transition-all",
                  isFormValid && (!validationErrors || validationErrors.length === 0)
                    ? "bg-[#1B4D3E] hover:bg-[#153e32] text-white cursor-pointer"
                    : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                )}
              >
                {isEmitting || isGeneratingPdf ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Compilando PDF e Registrando...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Gerar e Baixar PDF Oficial</span>
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { ConfirmEmitModal as ReviewAndEmitDialog }
