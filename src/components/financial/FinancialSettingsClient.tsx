'use client'

import React, { useState } from 'react'
import {
  SlidersHorizontal,
  Landmark,
  Building,
  ArrowRightLeft,
  PlusCircle,
  CheckCircle2,
  DollarSign,
  Wallet,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { formatCurrency, maskBankAgency, maskBankAccount } from '@/lib/utils'
import {
  updateFinancialSettings,
  updateBranchFinancialSettings,
  createBankAccount,
  transferBetweenBankAccounts,
} from '@/actions/financial/settings'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FinancialSettingsClientProps {
  globalSettings: any
  branchSettings: any
  bankAccounts: any[]
  branches: any[]
  isExecutive?: boolean
  currentBranchId?: string | null
}

export default function FinancialSettingsClient({
  globalSettings,
  branchSettings,
  bankAccounts,
  branches,
  isExecutive,
  currentBranchId,
}: FinancialSettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'GLOBAL' | 'BRANCH' | 'ACCOUNTS'>('GLOBAL')

  // Aba 1: Parâmetros Globais
  const [successFee, setSuccessFee] = useState<number>(
    Number(globalSettings?.defaultSuccessFeePercent || 2.0)
  )
  const [partnerComm, setPartnerComm] = useState<number>(
    Number(globalSettings?.defaultPartnerCommissionPercent || 20.0)
  )
  const [kmCost, setKmCost] = useState<number>(
    Number(globalSettings?.defaultFieldSurveyCostPerKm || 2.5)
  )
  const [isSavingGlobal, setIsSavingGlobal] = useState(false)

  // Aba 2: Parâmetros por Filial
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    currentBranchId || branches[0]?.id || ''
  )
  const [fixedCostTarget, setFixedCostTarget] = useState<number>(
    Number(branchSettings?.monthlyFixedCostTarget || 15000.0)
  )
  const [revenueTarget, setRevenueTarget] = useState<number>(
    Number(branchSettings?.monthlyRevenueTarget || 60000.0)
  )
  const [cropYear, setCropYear] = useState<string>(
    branchSettings?.activeCropYear || '2025/2026'
  )
  const [branchNotes, setBranchNotes] = useState<string>(branchSettings?.notes || '')
  const [isSavingBranch, setIsSavingBranch] = useState(false)

  // Modal: Nova Conta Bancária
  const [newAccountModalOpen, setNewAccountModalOpen] = useState(false)
  const [accountBranchId, setAccountBranchId] = useState<string>(
    currentBranchId || branches[0]?.id || ''
  )
  const [bankName, setBankName] = useState('')
  const [bankCode, setBankCode] = useState('001')
  const [agency, setAgency] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountType, setAccountType] = useState<
    'CORRENTE' | 'POUPANCA' | 'CAIXA_ESPECIE'
  >('CORRENTE')
  const [initialBalance, setInitialBalance] = useState<number>(0)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)

  // Modal: Transferência Interna de Tesouraria
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [sourceAccountId, setSourceAccountId] = useState<string>(bankAccounts[0]?.id || '')
  const [destAccountId, setDestAccountId] = useState<string>(bankAccounts[1]?.id || '')
  const [transferAmount, setTransferAmount] = useState<number>(1000)
  const [transferDescription, setTransferDescription] = useState<string>(
    'Transferência interna de tesouraria para suprimento de caixa'
  )
  const [isTransferring, setIsTransferring] = useState(false)

  // Salvar Parâmetros Globais
  const handleSaveGlobal = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingGlobal(true)
    const toastId = toast.loading('Salvando parâmetros globais...')

    try {
      const res = await updateFinancialSettings({
        defaultSuccessFeePercent: successFee,
        defaultPartnerCommissionPercent: partnerComm,
        defaultFieldSurveyCostPerKm: kmCost,
      })

      if (res.error) {
        toast.dismiss(toastId)
        toast.error(res.error)
        return
      }

      toast.dismiss(toastId)
      toast.success('Parâmetros globais atualizados!')
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err?.message || 'Falha ao salvar.')
    } finally {
      setIsSavingGlobal(false)
    }
  }

  // Salvar Parâmetros da Filial
  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBranchId) return
    setIsSavingBranch(true)
    const toastId = toast.loading('Salvando metas da filial...')

    try {
      const res = await updateBranchFinancialSettings(selectedBranchId, {
        monthlyFixedCostTarget: fixedCostTarget,
        monthlyRevenueTarget: revenueTarget,
        activeCropYear: cropYear,
        notes: branchNotes || undefined,
      })

      if (res.error) {
        toast.dismiss(toastId)
        toast.error(res.error)
        return
      }

      toast.dismiss(toastId)
      toast.success('Metas da filial atualizadas!')
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err?.message || 'Falha ao salvar metas.')
    } finally {
      setIsSavingBranch(false)
    }
  }

  // Criar Conta Bancária
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountBranchId || !bankName) {
      toast.error('Preencha os campos obrigatórios.')
      return
    }

    setIsCreatingAccount(true)
    const toastId = toast.loading('Cadastrando conta / caixa físico...')

    try {
      const res = await createBankAccount({
        branchId: accountBranchId,
        bankName: bankName.trim(),
        bankCode: bankCode.trim() || '001',
        agency: agency.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        accountType,
        initialBalance,
      })

      if (res.error) {
        toast.dismiss(toastId)
        toast.error(res.error)
        return
      }

      toast.dismiss(toastId)
      toast.success('Conta bancária cadastrada com sucesso!')
      setNewAccountModalOpen(false)
      window.location.reload()
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err?.message || 'Falha ao cadastrar conta.')
    } finally {
      setIsCreatingAccount(false)
    }
  }

  // Executar Transferência Interna
  const handleConfirmTransfer = async () => {
    if (!sourceAccountId || !destAccountId || sourceAccountId === destAccountId || transferAmount <= 0) {
      toast.error('Selecione contas de origem e destino distintas e um valor positivo.')
      return
    }

    setIsTransferring(true)
    const toastId = toast.loading('Processando transferência atômica de tesouraria...')

    try {
      const res = await transferBetweenBankAccounts({
        sourceBankAccountId: sourceAccountId,
        destinationBankAccountId: destAccountId,
        amount: transferAmount,
        description: transferDescription.trim(),
      })

      if (res.error) {
        toast.dismiss(toastId)
        toast.error(res.error)
        return
      }

      toast.dismiss(toastId)
      toast.success('Transferência efetuada com sucesso! Saldos sincronizados.')
      setTransferModalOpen(false)
      window.location.reload()
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err?.message || 'Falha ao transferir.')
    } finally {
      setIsTransferring(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Abas Internas de Configurações */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6" aria-label="Abas de Configurações">
          <button
            onClick={() => setActiveTab('GLOBAL')}
            className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'GLOBAL'
                ? 'border-emerald-800 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Parâmetros Globais
          </button>

          <button
            onClick={() => setActiveTab('BRANCH')}
            className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'BRANCH'
                ? 'border-emerald-800 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="h-4 w-4" />
            Parâmetros por Filial
          </button>

          <button
            onClick={() => setActiveTab('ACCOUNTS')}
            className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'ACCOUNTS'
                ? 'border-emerald-800 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Landmark className="h-4 w-4" />
            Contas Bancárias & Caixas ({bankAccounts.length})
          </button>
        </nav>
      </div>

      {/* ABA 1: PARÂMETROS GLOBAIS */}
      {activeTab === 'GLOBAL' && (
        <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Parâmetros Globais da Organização (Grupo LN)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Valores pré-configurados aplicados por padrão em todas as filiais e contratos de
              prestação de serviços.
            </p>
          </div>

          <form onSubmit={handleSaveGlobal} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Honorário de Êxito Padrão em Crédito Rural (%):
              </Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={successFee}
                onChange={(e) => setSuccessFee(parseFloat(e.target.value) || 0)}
                disabled={!isExecutive}
                className="text-xs font-bold text-slate-900"
              />
              <p className="text-[10px] text-slate-400">
                Percentual aplicado automaticamente na aprovação da esteira bancária.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Comissão Padrão de Parceiros Comerciais (%):
              </Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={partnerComm}
                onChange={(e) => setPartnerComm(parseFloat(e.target.value) || 0)}
                disabled={!isExecutive}
                className="text-xs font-bold text-emerald-800"
              />
              <p className="text-[10px] text-slate-400">
                Fração repassada ao prospectador ou corretor sobre o honorário líquido recebido.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Custo de Deslocamento para Vistoria de Campo (R$/km):
              </Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={kmCost}
                onChange={(e) => setKmCost(parseFloat(e.target.value) || 0)}
                disabled={!isExecutive}
                className="text-xs font-bold text-slate-900"
              />
              <p className="text-[10px] text-slate-400">
                Base para orçamentação automática de vistorias agronômicas e GPS.
              </p>
            </div>

            {isExecutive ? (
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSavingGlobal}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
                >
                  {isSavingGlobal ? 'Salvando...' : 'Salvar Parâmetros Globais'}
                </Button>
              </div>
            ) : (
              <p className="text-rose-600 font-semibold text-[11px]">
                * Apenas a Diretoria Executiva possui permissão para alterar parâmetros globais.
              </p>
            )}
          </form>
        </div>
      )}

      {/* ABA 2: PARÂMETROS POR FILIAL */}
      {activeTab === 'BRANCH' && (
        <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Metas Orçamentárias & Faturamento por Filial
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Definição da safra ativa e tetos para apuração de "dinheiro novo" no DRE Executivo.
            </p>
          </div>

          <form onSubmit={handleSaveBranch} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Selecionar Filial:</Label>
              <Select
                value={selectedBranchId}
                onValueChange={(val) => setSelectedBranchId(val || '')}
              >
                <SelectTrigger className="w-full text-xs font-semibold bg-white border-slate-200">
                  <SelectValue placeholder="Selecione a filial" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      📍 {b.name} ({b.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Teto de Custos Fixos Mensais (R$):
                </Label>
                <Input
                  type="number"
                  step="100"
                  min="0"
                  value={fixedCostTarget}
                  onChange={(e) => setFixedCostTarget(parseFloat(e.target.value) || 0)}
                  className="text-xs font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Meta de Faturamento Mensal (R$):
                </Label>
                <Input
                  type="number"
                  step="500"
                  min="0"
                  value={revenueTarget}
                  onChange={(e) => setRevenueTarget(parseFloat(e.target.value) || 0)}
                  className="text-xs font-bold text-emerald-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Ano Safra de Referência:</Label>
              <Input
                value={cropYear}
                onChange={(e) => setCropYear(e.target.value)}
                placeholder="2025/2026"
                className="text-xs font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Observações / Diretrizes Orçamentárias:</Label>
              <Textarea
                value={branchNotes}
                onChange={(e) => setBranchNotes(e.target.value)}
                rows={2}
                placeholder="Exemplo: Prioridade em consultorias para produtores de soja e milho..."
                className="text-xs"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSavingBranch}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
              >
                {isSavingBranch ? 'Gravando...' : 'Atualizar Metas da Filial'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ABA 3: CONTAS BANCÁRIAS E CAIXAS FÍSICOS */}
      {activeTab === 'ACCOUNTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Contas Bancárias & Caixas de Tesouraria
              </h3>
              <p className="text-xs text-slate-500">
                Saldos correntes em tempo real e transferências internas entre contas da empresa.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {bankAccounts.length >= 2 && (
                <Button
                  onClick={() => setTransferModalOpen(true)}
                  variant="outline"
                  className="gap-1.5 text-xs font-bold text-slate-700"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Transferência Interna
                </Button>
              )}

              <Button
                onClick={() => setNewAccountModalOpen(true)}
                className="bg-emerald-800 hover:bg-emerald-900 text-white gap-1.5 text-xs font-semibold"
              >
                <PlusCircle className="h-4 w-4" />
                Cadastrar Conta / Caixa
              </Button>
            </div>
          </div>

          {/* Cards das Contas Cadastradas */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bankAccounts.map((acc) => {
              const balance = Number(acc.currentBalance) || 0
              const isPhysical = acc.accountType === 'CAIXA_ESPECIE'

              return (
                <div
                  key={acc.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`rounded-lg p-2 ${
                            isPhysical
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isPhysical ? (
                            <Wallet className="h-4 w-4" />
                          ) : (
                            <Landmark className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{acc.bankName}</div>
                          <div className="text-[10px] text-slate-400">
                            {acc.branch ? acc.branch.name : 'Grupo LN'}
                          </div>
                        </div>
                      </div>

                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 uppercase">
                        {acc.accountType}
                      </span>
                    </div>

                    {!isPhysical && (
                      <div className="mt-3 text-xs text-slate-500 font-mono">
                        Ag.: {acc.agency || 'S/A'} • CC: {acc.accountNumber || 'S/N'}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Saldo Disponível
                    </span>
                    <div
                      className={`text-xl font-black mt-0.5 ${
                        balance >= 0 ? 'text-emerald-800' : 'text-rose-700'
                      }`}
                    >
                      {formatCurrency(balance)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* MODAL: CADASTRO DE CONTA BANCÁRIA */}
      <Dialog open={newAccountModalOpen} onOpenChange={setNewAccountModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Cadastrar Conta Bancária ou Caixa Físico
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateAccount} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Filial:</Label>
              <Select
                value={accountBranchId}
                onValueChange={(val) => setAccountBranchId(val || '')}
              >
                <SelectTrigger className="w-full text-xs font-semibold bg-white border-slate-200">
                  <SelectValue placeholder="Selecione a filial" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      📍 {b.name} ({b.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tipo de Recurso:</Label>
              <Select
                value={accountType}
                onValueChange={(val: any) => setAccountType(val)}
              >
                <SelectTrigger className="w-full text-xs font-semibold bg-white border-slate-200">
                  <SelectValue placeholder="Tipo de recurso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CORRENTE">Conta Corrente Bancária</SelectItem>
                  <SelectItem value="CAIXA_ESPECIE">Caixa Físico da Filial (Espécie)</SelectItem>
                  <SelectItem value="POUPANCA">Poupança</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nome da Instituição / Identificação:</Label>
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Ex: Banco do Brasil S/A ou Caixa Físico Taguatinga"
                className="text-xs font-medium"
              />
            </div>

            {accountType !== 'CAIXA_ESPECIE' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Agência (com dígito):</Label>
                  <Input
                    value={agency}
                    onChange={(e) => setAgency(maskBankAgency(e.target.value))}
                    placeholder="1234-5"
                    maxLength={7}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Conta (com dígito):</Label>
                  <Input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(maskBankAccount(e.target.value))}
                    placeholder="12345-6"
                    maxLength={14}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Saldo Inicial de Implantação (R$):</Label>
              <Input
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                className="text-xs font-bold text-emerald-800"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewAccountModalOpen(false)}
                disabled={isCreatingAccount}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
                disabled={isCreatingAccount}
              >
                {isCreatingAccount ? 'Cadastrando...' : 'Confirmar Cadastro'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: TRANSFERÊNCIA INTERNA DE TESOURARIA */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <ArrowRightLeft className="h-5 w-5 text-emerald-800" />
              Transferência Interna de Tesouraria
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="rounded-md border border-emerald-100 bg-emerald-50/60 p-3 text-emerald-950 space-y-1">
              <p className="font-bold text-[11px] uppercase">
                🛡️ Neutralidade Contábil no DRE (ADR-023):
              </p>
              <p className="text-[10px] text-emerald-800">
                Transferências entre contas e caixas movimentam recursos internamente sem impacto no
                resultado operacional da safra. Execução com mutação atômica nativa no banco de
                dados.
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Conta de Origem (Débito):</Label>
              <Select
                value={sourceAccountId}
                onValueChange={(val) => setSourceAccountId(val || '')}
              >
                <SelectTrigger className="w-full text-xs font-semibold bg-white border-slate-200">
                  <SelectValue placeholder="Selecione a conta de origem" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.bankName} (Saldo: {formatCurrency(Number(b.currentBalance))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Conta de Destino (Crédito):</Label>
              <Select
                value={destAccountId}
                onValueChange={(val) => setDestAccountId(val || '')}
              >
                <SelectTrigger className="w-full text-xs font-semibold bg-white border-slate-200">
                  <SelectValue placeholder="Selecione a conta de destino" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.bankName} (Saldo: {formatCurrency(Number(b.currentBalance))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Valor a Transferir (R$):</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={transferAmount}
                onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                className="text-xs font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Motivo / Descrição:</Label>
              <Input
                value={transferDescription}
                onChange={(e) => setTransferDescription(e.target.value)}
                placeholder="Ex: Suprimento do caixa em espécie para vistorias"
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTransferModalOpen(false)}
              disabled={isTransferring}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
              onClick={handleConfirmTransfer}
              disabled={isTransferring || transferAmount <= 0 || sourceAccountId === destAccountId}
            >
              {isTransferring ? 'Transferindo...' : 'Confirmar Transferência'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
